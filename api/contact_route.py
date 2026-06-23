from datetime import datetime, timezone
from sqlalchemy import select

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.ext.asyncio import AsyncSession

from core.dependencies import get_valid_qr, get_current_user
from core.logging import logger
from core.schemas.contact import ContactActionResponse, ContactValidateResponse, MessageRequest, MessageResponse
from db.base import get_db
from models.models import AttemptStatus, ContactAction, Message, Users
from services.create_qr import create_contact_attempt, get_attempt_by_idempotency
from services.rate_liimiter import rate_limit_dependency
from services.onesignal_service import send_push_notification

router = APIRouter()

CONTACT_OPTIONS = ["call", "message", "notify"]


def _require_idempotency_key(request: Request) -> str:
    idem_key = request.headers.get("idempotent_key")
    if not idem_key:
        logger.error("idempotent_key_not_found")
        raise HTTPException(status_code=400, detail="idempotent_key_not_found")
    return idem_key


async def _record_contact_action(
    db: AsyncSession,
    public_code: str,
    action: ContactAction,
    idem_key: str,
    duplicate_message: str,
    success_message: str,
) -> ContactActionResponse:
    existing = await get_attempt_by_idempotency(db, public_code, action.value, idem_key)
    if existing:
        return ContactActionResponse(message=duplicate_message)

    await create_contact_attempt(
        db,
        public_code,
        action.value,
        AttemptStatus.success.value,
        idem_key,
    )
    await db.commit()
    return ContactActionResponse(message=success_message)


async def _store_message(
    db: AsyncSession,
    recipient_id: int,
    sender_phone: str,
    sender_name: str,
    message_content: str,
    action_type: str,
    twilio_sid: str | None = None,
) -> Message:
    message = Message(
        recipient_id=recipient_id,
        sender_phone=sender_phone,
        sender_name=sender_name or None,
        message_content=message_content,
        action_type=action_type,
        twilio_sid=twilio_sid,
    )
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return message


@router.get("/contact/{public_code}", response_model=ContactValidateResponse)
async def scan_qr(
    public_code: str,
    request: Request,
    _: None = Depends(rate_limit_dependency(5, 15)),
    db: AsyncSession = Depends(get_db),
):
    try:
        qr = await get_valid_qr(public_code, db)
    except ValueError as e:
        logger.error("QR not found")
        raise HTTPException(status_code=404, detail=str(e))

    qr.scan_count = (qr.scan_count or 0) + 1
    qr.last_scanned_at = datetime.now(timezone.utc)
    await db.commit()

    return ContactValidateResponse(
        message="QR scanned successfully",
        status="valid",
        options=CONTACT_OPTIONS,
    )


@router.post("/contact/{public_code}/call", response_model=ContactActionResponse)
async def call_contact(
    request: Request,
    public_code: str,
    idempotent_key: str | None = Header(None, description="Unique idempotency key for preventing duplicate requests"),
    _: None = Depends(rate_limit_dependency(5, 15)),
    db: AsyncSession = Depends(get_db),
):
    idem_key = idempotent_key or _require_idempotency_key(request)

    try:
        qr = await get_valid_qr(public_code, db)
    except ValueError as e:
        logger.error("QR not found in call_contact")
        raise HTTPException(status_code=404, detail=str(e))

    # Get recipient user
    result = await db.execute(select(Users).where(Users.id == qr.user_id))
    recipient = result.scalar_one_or_none()
    
    if recipient:
        # Store message record (in-app only, no SMS)
        await _store_message(
            db,
            recipient_id=qr.user_id,
            sender_phone="unknown",
            sender_name="",
            message_content="Call request",
            action_type="call",
            twilio_sid=None,
        )

    return await _record_contact_action(
        db,
        public_code,
        ContactAction.call,
        idem_key,
        duplicate_message="call already done",
        success_message="call initiated",
    )


@router.post("/contact/{public_code}/message", response_model=ContactActionResponse)
async def message_contact(
    request: Request,
    public_code: str,
    payload: MessageRequest,
    idempotent_key: str | None = Header(None, description="Unique idempotency key for preventing duplicate requests"),
    _: None = Depends(rate_limit_dependency(5, 15)),
    db: AsyncSession = Depends(get_db),
):
    idem_key = idempotent_key or _require_idempotency_key(request)

    try:
        qr = await get_valid_qr(public_code, db)
    except ValueError as e:
        logger.error("QR not found in message_contact")
        raise HTTPException(status_code=404, detail=str(e))

    # Get recipient user
    result = await db.execute(select(Users).where(Users.id == qr.user_id))
    recipient = result.scalar_one_or_none()
    
    if recipient:
        # Store message record (in-app only, no SMS)
        await _store_message(
            db,
            recipient_id=qr.user_id,
            sender_phone="unknown",
            sender_name=payload.sender_name,
            message_content=payload.message,
            action_type="message",
            twilio_sid=None,
        )

        # Send push notification
        await send_push_notification(
            user_id=qr.user_id,
            message=f"New message from {payload.sender_name or 'Anonymous'}: {payload.message}",
            title="New QR Message",
        )

    logger.info("message_contact: recorded message attempt", extra={"length": len(payload.message)})
    return await _record_contact_action(
        db,
        public_code,
        ContactAction.message,
        idem_key,
        duplicate_message="message already sent",
        success_message="message sent",
    )


@router.post("/contact/{public_code}/notify", response_model=ContactActionResponse)
async def notify_contact(
    request: Request,
    public_code: str,
    idempotent_key: str | None = Header(None, description="Unique idempotency key for preventing duplicate requests"),
    _: None = Depends(rate_limit_dependency(5, 15)),
    db: AsyncSession = Depends(get_db),
):
    idem_key = idempotent_key or _require_idempotency_key(request)

    try:
        qr = await get_valid_qr(public_code, db)
    except ValueError as e:
        logger.error("QR not found in notify_contact")
        raise HTTPException(status_code=404, detail=str(e))

    # Get recipient user
    result = await db.execute(select(Users).where(Users.id == qr.user_id))
    recipient = result.scalar_one_or_none()
    
    if recipient:
        # Store message record (in-app only, no SMS)
        await _store_message(
            db,
            recipient_id=qr.user_id,
            sender_phone="unknown",
            sender_name="",
            message_content="Notification",
            action_type="notify",
            twilio_sid=None,
        )

    return await _record_contact_action(
        db,
        public_code,
        ContactAction.notify,
        idem_key,
        duplicate_message="notification already sent",
        success_message="notification sent",
    )


@router.get("/messages", response_model=list[MessageResponse])
async def get_messages(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get all messages for the current user."""
    result = await db.execute(
        select(Message)
        .where(Message.recipient_id == current_user.id)
        .order_by(Message.created_at.desc())
    )
    messages = result.scalars().all()
    return messages


@router.patch("/messages/{message_id}/read")
async def mark_message_read(
    message_id: int,
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a message as read."""
    result = await db.execute(
        select(Message)
        .where(Message.id == message_id, Message.recipient_id == current_user.id)
    )
    message = result.scalar_one_or_none()
    
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    message.is_read = True
    await db.commit()
    
    return {"message": "Message marked as read"}


@router.patch("/messages/read-all")
async def mark_all_messages_read(
    current_user: Users = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all messages as read for the current user."""
    result = await db.execute(
        select(Message)
        .where(Message.recipient_id == current_user.id, Message.is_read == False)
    )
    messages = result.scalars().all()
    
    for message in messages:
        message.is_read = True
    
    await db.commit()
    
    return {"message": f"Marked {len(messages)} messages as read"}

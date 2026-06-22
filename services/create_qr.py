import hashlib

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models import models


async def create_qr(user_id: int, db: AsyncSession) -> models.QRCode:
    res = await db.execute(select(models.Users).where(models.Users.id == user_id))
    user = res.scalar_one_or_none()

    if not user:
        raise ValueError("youre not registered as user")

    public_code = hashlib.sha256(user.phone_number.encode()).hexdigest()

    existing = await db.execute(
        select(models.QRCode).where(
            models.QRCode.user_id == user.id,
            models.QRCode.public_code == public_code,
        )
    )
    qr = existing.scalar_one_or_none()
    if qr:
        if not qr.is_active:
            qr.is_active = True
            await db.commit()
            await db.refresh(qr)
        return qr

    qr = models.QRCode(public_code=public_code, user_id=user.id, is_active=True)
    db.add(qr)
    await db.commit()
    await db.refresh(qr)
    return qr


async def list_user_qr_codes(user_id: int, db: AsyncSession) -> list[models.QRCode]:
    result = await db.execute(
        select(models.QRCode)
        .where(models.QRCode.user_id == user_id)
        .order_by(models.QRCode.created_at.desc())
    )
    return list(result.scalars().all())


async def deactivate_qr(qr_id: int, user_id: int, db: AsyncSession) -> models.QRCode:
    result = await db.execute(
        select(models.QRCode).where(
            models.QRCode.id == qr_id,
            models.QRCode.user_id == user_id,
        )
    )
    qr = result.scalar_one_or_none()
    if qr is None:
        raise ValueError("QR code not found")
    qr.is_active = False
    await db.commit()
    await db.refresh(qr)
    return qr


async def get_attempt_by_idempotency(
    db: AsyncSession,
    public_code: str,
    action: str,
    idem_key: str,
) -> models.ContactAttempt | None:
    result = await db.execute(
        select(models.ContactAttempt).where(models.ContactAttempt.idem_key == idem_key)
    )
    attempt = result.scalar_one_or_none()
    if attempt is None:
        return None
    if attempt.qr_code != public_code or attempt.action_type.value != action:
        return None
    return attempt


async def create_contact_attempt(
    db: AsyncSession,
    public_code: str,
    action: str,
    status: str,
    idem_key: str,
) -> models.ContactAttempt:
    attempt = models.ContactAttempt(
        qr_code=public_code,
        action_type=action,
        status=status,
        idem_key=idem_key,
    )
    db.add(attempt)
    await db.flush()
    await db.refresh(attempt)
    return attempt
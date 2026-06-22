from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
import qrcode
import io
import base64
from core.config import settings

from core.dependencies import get_current_user
from core.logging import logger
from core.schemas.qr import QRCodeResponse
from db.base import get_db
from models import models
from services.create_qr import create_qr, deactivate_qr, list_user_qr_codes
from services.rate_liimiter import rate_limit_dependency

router = APIRouter()


def _serialize_qr(qr: models.QRCode) -> QRCodeResponse:
    return QRCodeResponse(
        id=qr.id,
        public_code=qr.public_code,
        is_active=qr.is_active,
        created_at=qr.created_at,
        scan_count=qr.scan_count or 0,
        last_scanned_at=qr.last_scanned_at,
    )


@router.get("/qr_code")
async def qr_code(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: models.Users = Depends(get_current_user),
    _: None = Depends(rate_limit_dependency(10, 60)),
):
    try:
        qr = await create_qr(user.id, db)
    except ValueError as e:
        logger.error("QR creation failed")
        raise HTTPException(status_code=404, detail=str(e))

    return {
        "public_code": qr.public_code,
    }


@router.get("/qr_code/image")
async def qr_code_image(
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: models.Users = Depends(get_current_user),
    _: None = Depends(rate_limit_dependency(10, 60)),
):
    """Generate QR code image as base64 data URL."""
    try:
        qr = await create_qr(user.id, db)
    except ValueError as e:
        logger.error("QR creation failed")
        raise HTTPException(status_code=404, detail=str(e))

    # Generate contact URL
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    contact_url = f"{frontend_url}/contact/{qr.public_code}"
    
    # Create QR code
    qr_img = qrcode.make(contact_url)
    
    # Convert to base64
    buffer = io.BytesIO()
    qr_img.save(buffer, format="PNG")
    img_str = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "public_code": qr.public_code,
        "contact_url": contact_url,
        "qr_image": f"data:image/png;base64,{img_str}",
    }


@router.get("/my-qr-codes", response_model=list[QRCodeResponse])
async def my_qr_codes(
    db: AsyncSession = Depends(get_db),
    user: models.Users = Depends(get_current_user),
):
    qr_codes = await list_user_qr_codes(user.id, db)
    return [_serialize_qr(qr) for qr in qr_codes]


@router.delete("/qr-codes/{qr_id}")
async def delete_qr_code(
    qr_id: int,
    db: AsyncSession = Depends(get_db),
    user: models.Users = Depends(get_current_user),
):
    try:
        await deactivate_qr(qr_id, user.id, db)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    return {"message": "QR code deactivated"}

from datetime import datetime, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from db.base import get_db
from models import models
from .security import verify_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> models.Users:
    user_id = verify_access_token(token)

    result = await db.execute(select(models.Users).where(models.Users.id == int(user_id)))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )
    return user


async def get_valid_qr(public_code: str, db: AsyncSession = Depends(get_db)) -> models.QRCode:
    result = await db.execute(
        select(models.QRCode).where(models.QRCode.public_code == public_code)
    )
    qr = result.scalar_one_or_none()
    if qr is None:
        raise ValueError("Qr not found")

    if not qr.is_active:
        raise ValueError("Qr is inactive")

    if qr.expires_at:
        expires_at = qr.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if datetime.now(timezone.utc) > expires_at:
            raise ValueError("Qr expired")
    return qr



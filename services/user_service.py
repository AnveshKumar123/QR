"""User service for database operations."""
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from models import models
from services.phone_utils import normalize_phone, normalize_existing_phone
from core.logging import logger
import hashlib


async def check_user_exists(
    db: AsyncSession,
    username: Optional[str] = None,
    normalized_phone: Optional[str] = None
) -> Optional[models.Users]:

    if username:
        result = await db.execute(
            select(models.Users).where(models.Users.username == username)
        )
        user = result.scalar_one_or_none()
        if user:
            return user

    if normalized_phone:
        result = await db.execute(
            select(models.Users).where(models.Users.phone_number == normalized_phone)
        )
        return result.scalar_one_or_none()

    return None



async def create_user(
    db: AsyncSession,
    username: str,
    phone_number: str,
    password: str
) -> models.Users:
    """
    Create a new user with normalized phone number.
    Raises IntegrityError if duplicate exists.
    """
    from services.phone_utils import normalize_phone
    
    normalized_phone = normalize_phone(phone_number)
    if not normalized_phone:
        raise ValueError("Invalid phone number format")
    
    hashed_password = hashlib.sha256(password.encode()).hexdigest()
    
    new_user = models.Users(
        username=username,
        phone_number=normalized_phone,
        hashed_password=hashed_password
    )
    
    db.add(new_user)
    
    return new_user


async def find_user_by_phone_or_username(
    db: AsyncSession,
    identifier: str
) -> Optional[models.Users]:
    """
    Find user by phone number (normalized) or username.
    Optimized for login.
    """
    # If starts with +, it's a phone number
    if identifier.startswith('+'):
        normalized = normalize_phone(identifier)
        if not normalized:
            return None
        
        # Try exact match first (most common case)
        result = await db.execute(
            select(models.Users).where(models.Users.phone_number == normalized)
        )
        user = result.scalar_one_or_none()
        
        if user:
            return user
        
        # Fallback: check all users for normalized match (handles old format)
        # This is less efficient but handles migration period
        all_users = await db.execute(select(models.Users))
        for db_user in all_users.scalars().all():
            phone_val = getattr(db_user, "phone_number", None)
            if not isinstance(phone_val, str):
                continue
            try:
                if normalize_existing_phone(phone_val) == normalized:
                    logger.debug(f"find_user_by_phone_or_username: fallback match id={db_user.id} phone={phone_val!r}")
                    return db_user
            except Exception:
                logger.debug("find_user_by_phone_or_username: normalize_existing_phone failed for stored value; skipping", exc_info=True)
                continue
        
        return None
    else:
        # Username lookup
        result = await db.execute(
            select(models.Users).where(models.Users.username == identifier)
        )
        return result.scalar_one_or_none()

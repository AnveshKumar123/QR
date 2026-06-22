"""Authentication routes for signup and login."""
from fastapi import APIRouter, HTTPException, Depends, status , Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.exc import IntegrityError
from core.dependencies import get_current_user
from core.schemas.user import UserCreate, UserResponse
from core.security import create_access_token
from db.base import get_db
from models import models
from fastapi.security import OAuth2PasswordRequestForm
from services.phone_utils import normalize_phone, validate_phone_format
from services.user_service import check_user_exists, create_user, find_user_by_phone_or_username
from core.logging import logger
import hashlib

router = APIRouter()


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup(request:Request,user: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Register a new user.
    
    Validates phone number format, checks for duplicates, and creates user.
    Phone numbers are normalized to 10 digits for consistent storage.
    """
    # Validate phone number format
    if not validate_phone_format(user.phone_number):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format. Must start with + and have 11-13 digits."
        )
    
    # Normalize phone number
    normalized_phone = normalize_phone(user.phone_number)
    if not normalized_phone:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format"
        )
    
    # Check for existing user (optimized query)
    incoming_username = (user.username or "").strip()
    existing_user = await check_user_exists(
        db,
        username=incoming_username,
        normalized_phone=normalized_phone
    )

    logger.debug("signup: check_user_exists returned", extra={"type": type(existing_user), "value": repr(existing_user)})

    # Defensive: if a DB Result/Row was accidentally returned, extract the scalar
    if existing_user is not None and not hasattr(existing_user, "username") and hasattr(existing_user, "scalar_one_or_none"):
        existing_user = existing_user.scalar_one_or_none()

    # If the returned object still doesn't look like a model, log and treat as no-match (avoid false-positive duplicate)
    if existing_user is not None and not hasattr(existing_user, "username"):
        logger.error("signup: unexpected return from check_user_exists", exc_info=True)
        existing_user = None

    if existing_user is not None:
        # Use getattr(...) to avoid accidentally evaluating SQLAlchemy Column expressions
        existing_username = getattr(existing_user, "username", None)
        existing_phone = getattr(existing_user, "phone_number", None)

        if existing_username == incoming_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
        if existing_phone == normalized_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Phone number already registered"
            )
        # If we somehow have a model but it doesn't match exactly, treat as no-match (defensive)
        logger.debug("signup: existing_user returned but no exact match on username/phone; continuing")
    
    # Create user
    try:
        new_user = await create_user(
            db,
            username=user.username,
            phone_number=user.phone_number,
            password=user.password
        )
        await db.commit()
        await db.refresh(new_user)
        
        logger.info(f"User created successfully: {new_user.username} (ID: {new_user.id})")
        return {"message": "User created successfully", "user_id": new_user.id}
    
    except IntegrityError as e:
        await db.rollback()
        logger.error(f"Database integrity error during signup: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists (duplicate constraint violation)"
        )
    except ValueError as e:
        await db.rollback()
        logger.error(f"Validation error during signup: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Unexpected error during signup: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error during signup"
        )


@router.post("/login")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """
    Authenticate user and return JWT token.
    
    Supports login with either username or phone number.
    Phone numbers should start with + (e.g., +91XXXXXXXXXX).
    """
    # Find user by phone or username
    user = await find_user_by_phone_or_username(db, form_data.username)

    # Defensive: if a DB Result was accidentally returned, extract the scalar
    if user is not None and not hasattr(user, "hashed_password") and hasattr(user, "scalar_one_or_none"):
        user = user.scalar_one_or_none()
    
    if not user:
        logger.warning(f"Login attempt with invalid identifier: {form_data.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/phone or password"
        )
    
    # Verify password (SHA256 hash)
    input_hash = hashlib.sha256(form_data.password.encode()).hexdigest()
    if str(user.hashed_password) != input_hash:
        logger.warning(f"Invalid password attempt for user: {user.username}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username/phone or password"
        )
    
    # Generate JWT token
    token = create_access_token(str(user.id))
    logger.info(f"User logged in successfully: {user.username} (ID: {user.id})")
    
    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.get("/me", response_model=UserResponse)
async def get_me(user: models.Users = Depends(get_current_user)):
    return user

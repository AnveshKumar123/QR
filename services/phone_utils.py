"""Phone number normalization and validation utilities."""
import re
from typing import Optional


def extract_phone_digits(phone: str) -> str:
    """Extract only digits from phone number."""
    return re.sub(r"[^\d]", "", phone)


def normalize_phone(phone: str) -> Optional[str]:
    """
    Normalize phone number to last 10 digits.
    Handles formats like: +91XXXXXXXXXX, +91-XXXX-XXXXXX, etc.
    Returns None if invalid.
    """
    if not phone:
        return None
    
    # If already 10 digits, return as-is
    if len(phone) == 10 and phone.isdigit():
        return phone
    
    # Extract all digits
    digits = extract_phone_digits(phone)
    
    # Return last 10 digits (the phone number part)
    return digits[-10:]


def validate_phone_format(phone: str) -> bool:
    """Validate that phone number starts with + and has valid format."""
    if not phone.startswith('+'):
        return False
    
    digits = extract_phone_digits(phone)
    return 11 <= len(digits) <= 13


def normalize_existing_phone(phone: str) -> str:
    """
    Normalize phone from database - handles both formats.
    Returns normalized 10-digit phone or original if can't normalize.
    """
    normalized = normalize_phone(phone)
    return normalized if normalized else phone

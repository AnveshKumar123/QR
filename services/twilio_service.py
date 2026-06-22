from twilio.rest import Client
from core.config import settings
from core.logging import logger
from typing import Optional

twilio_client: Optional[Client] = None

def get_twilio_client() -> Optional[Client]:
    global twilio_client
    if not settings.TWILIO_ENABLED:
        return None
    if not all([settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN, settings.TWILIO_PHONE_NUMBER]):
        logger.warning("Twilio credentials not fully configured")
        return None
    if twilio_client is None:
        try:
            twilio_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        except Exception as e:
            logger.error(f"Failed to initialize Twilio client: {e}")
            return None
    return twilio_client

async def send_sms(to_phone: str, message: str) -> Optional[str]:
    """Send SMS via Twilio. Returns message SID or None if failed."""
    client = get_twilio_client()
    if not client:
        logger.warning("Twilio not enabled or not configured")
        return None
    
    try:
        # Ensure phone number format (add + if missing)
        if not to_phone.startswith('+'):
            to_phone = '+' + to_phone.lstrip('+')
        
        message_obj = client.messages.create(
            body=message,
            from_=settings.TWILIO_PHONE_NUMBER,
            to=to_phone
        )
        logger.info(f"SMS sent successfully to {to_phone}, SID: {message_obj.sid}")
        return message_obj.sid
    except Exception as e:
        logger.error(f"Failed to send SMS to {to_phone}: {e}")
        return None

async def make_call(to_phone: str, message: str) -> Optional[str]:
    """Make a call via Twilio with text-to-speech message. Returns call SID or None if failed."""
    client = get_twilio_client()
    if not client:
        logger.warning("Twilio not enabled or not configured")
        return None
    
    try:
        # Ensure phone number format
        if not to_phone.startswith('+'):
            to_phone = '+' + to_phone.lstrip('+')
        
        # Use Twilio's TwiML for text-to-speech
        from twilio.twiml.voice_response import VoiceResponse
        twiml = VoiceResponse()
        twiml.say(message)
        
        call_obj = client.calls.create(
            twiml=str(twiml),
            from_=settings.TWILIO_PHONE_NUMBER,
            to=to_phone
        )
        logger.info(f"Call initiated to {to_phone}, SID: {call_obj.sid}")
        return call_obj.sid
    except Exception as e:
        logger.error(f"Failed to initiate call to {to_phone}: {e}")
        return None

import httpx
from core.config import settings
from core.logging import logger


async def send_push_notification(user_id: int, message: str, title: str = "New Message") -> bool:
    """Send push notification via OneSignal REST API."""
    if not settings.ONESIGNAL_ENABLED:
        logger.info("OneSignal not enabled, skipping push notification")
        return False

    if not all([settings.ONESIGNAL_APP_ID, settings.ONESIGNAL_REST_API_KEY]):
        logger.warning("OneSignal credentials not configured")
        return False

    try:
        # Send notification to user using external_user_id (user_id)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://onesignal.com/api/v1/notifications",
                headers={
                    "Content-Type": "application/json; charset=utf-8",
                    "Authorization": f"Basic {settings.ONESIGNAL_REST_API_KEY}",
                },
                json={
                    "app_id": settings.ONESIGNAL_APP_ID,
                    "include_external_user_ids": [str(user_id)],
                    "contents": {"en": message},
                    "headings": {"en": title},
                },
                timeout=10.0,
            )

            if response.status_code == 200:
                logger.info(f"Push notification sent to user {user_id}")
                return True
            else:
                logger.error(f"OneSignal API error: {response.status_code} - {response.text}")
                return False

    except Exception as e:
        logger.error(f"Failed to send push notification: {e}")
        return False

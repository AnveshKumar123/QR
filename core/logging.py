# core/logging.py
import logging
# INFO → normal

# WARNING → user misuse / abuse

# ERROR → system failure

# EXCEPTION → failure + stacktrace

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
)

logger = logging.getLogger("qr_app")

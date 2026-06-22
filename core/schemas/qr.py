from datetime import datetime

from pydantic import BaseModel


class QRCodeResponse(BaseModel):
    id: int
    public_code: str
    is_active: bool
    created_at: datetime | None = None
    scan_count: int = 0
    last_scanned_at: datetime | None = None

    class Config:
        from_attributes = True

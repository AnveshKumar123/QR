from pydantic import BaseModel, Field
from datetime import datetime


class ContactValidateResponse(BaseModel):
    message: str
    status: str
    options: list[str]


class MessageRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=500)
    sender_name: str = Field(default="", max_length=100)


class ContactActionResponse(BaseModel):
    message: str


class MessageResponse(BaseModel):
    id: int
    sender_phone: str
    sender_name: str | None
    message_content: str
    action_type: str
    is_read: bool
    twilio_sid: str | None
    created_at: datetime
    
    class Config:
        from_attributes = True

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Boolean, Text 
from db.base import Base
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from typing import Any
from sqlalchemy import Enum as SqlEnum
from enum import Enum

class Users(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    phone_number = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    def __repr__(self):
        return f"User(id={self.id}, username={self.username}, phone_number={self.phone_number})"

###################################################################################################################

class QRCode(Base):
    __tablename__ = "qr_codes"
    id = Column(Integer, primary_key=True, index=True)
    public_code = Column(String, unique=True, index=True)
    user_id=Column(Integer, ForeignKey(Users.id), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    expires_at=Column(DateTime, nullable=True)
    last_scanned_at=Column(DateTime, nullable=True)
    scan_count=Column(Integer, default=0)
    is_active=Column(Boolean, default=True)

###########################################################################################################################

class ContactAction(str, Enum):
    scan = "scan"
    call = "call"
    message = "message"
    notify = "notify"

class AttemptStatus(str, Enum):
    success = "success"
    blocked = "blocked"
    failed = "failed"

    
class ContactAttempt(Base):
    __tablename__="contactattempt"
    id = Column(Integer, primary_key=True, index=True)
    idem_key=Column(String, unique=True)
    qr_code = Column(String, index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    action_type = Column(SqlEnum(ContactAction, name="contact_action_enum"), nullable=False)
    status = Column(SqlEnum(AttemptStatus, name="attempt_status_enum"), nullable=False)


####################################################################################################################

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    recipient_id = Column(Integer, ForeignKey(Users.id), nullable=False, index=True)
    sender_phone = Column(String, nullable=False)  # Phone number of the person sending the message
    sender_name = Column(String, nullable=True)  # Optional name if provided
    message_content = Column(Text, nullable=False)
    action_type = Column(String, nullable=False)  # 'message', 'call', 'notify'
    is_read = Column(Boolean, default=False)
    twilio_sid = Column(String, nullable=True)  # Twilio message SID if sent via SMS
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    recipient = relationship("Users", foreign_keys=[recipient_id])

    def __repr__(self):
        return f"Message(id={self.id}, recipient_id={self.recipient_id}, sender_phone={self.sender_phone})"
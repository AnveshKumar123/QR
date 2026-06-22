from pydantic import BaseModel, EmailStr, field_validator


# -------------------
# User Create (signup)
# -------------------
class UserCreate(BaseModel):
    username: str
    phone_number: str
    password: str

    @field_validator('phone_number')
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        if not v.startswith('+91'):
            raise ValueError('Phone number must start with +91')
        return v
class UserResponse(BaseModel):
    id: int
    username: str
    phone_number: str

    class Config:
        from_attributes = True

    

# -------------------
# User Login
# -------------------
class UserLogin(BaseModel):
    username: str
    password: str
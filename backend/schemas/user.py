from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from uuid import UUID   # 🔥 ADD THIS

class UserBase(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    role: str  # 'swimmer', 'owner'

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: UUID   # 🔥 FIXED
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

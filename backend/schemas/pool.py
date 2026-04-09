from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PoolBase(BaseModel):
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    pool_type: Optional[str] = None  # 'indoor' or 'outdoor'
    capacity: Optional[int] = None
    length_meters: Optional[int] = None
    entry_fee: Optional[int] = None
    amenities: Optional[List[str]] = None
    is_open: bool = True
    opening_time: Optional[str] = "06:00"
    closing_time: Optional[str] = "21:00"

class PoolCreate(PoolBase):
    pass

class PoolUpdate(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    pool_type: Optional[str] = None
    capacity: Optional[int] = None
    length_meters: Optional[int] = None
    entry_fee: Optional[int] = None
    amenities: Optional[List[str]] = None
    is_open: Optional[bool] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None

class Pool(PoolBase):
    id: str
    owner_id: str
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None
    cleanliness_score: float
    created_at: datetime

    class Config:
        from_attributes = True

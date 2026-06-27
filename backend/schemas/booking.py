from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID


# ----------------------------
# Booking Slot
# ----------------------------

class BookingSlotRequest(BaseModel):
    pool_id: str
    slot_date: str
    start_time: str
    end_time: str
    capacity: int
    price_per_slot: float


class BookingSlotResponse(BookingSlotRequest):
    id: UUID
    booked_count: int
    is_available: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ----------------------------
# Booking
# ----------------------------

class PoolFacilityRequest(BaseModel):
    pool_id: str

    has_lifeguard: bool = False
    has_emergency_equipment: bool = False
    has_changing_rooms: bool = False
    has_locker_facility: bool = False
    has_cctv: bool = False
    has_cafe: bool = False
    has_parking: bool = False
    has_wheelchair_access: bool = False


class PoolFacilityResponse(PoolFacilityRequest):
    id: UUID

    class Config:
        from_attributes = True

class BookingRequest(BaseModel):
    pool_id: str
    booking_date: str
    start_time: str
    end_time: str
    duration_minutes: int
    number_of_people: int = 1
    notes: Optional[str] = None


class BookingResponse(BookingRequest):
    id: UUID
    user_id: UUID
    status: str
    total_amount: float
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ----------------------------
# Pool Occupancy
# ----------------------------

class OccupancyResponse(BaseModel):
    pool_id: UUID
    current_occupancy: int
    max_capacity: int
    occupancy_percentage: float
    timestamp: datetime

    class Config:
        from_attributes = True
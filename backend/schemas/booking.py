from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class BookingSlotRequest(BaseModel):
    pool_id: str
    slot_date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str
    capacity: int
    price_per_slot: float

class BookingSlotResponse(BookingSlotRequest):
    id: UUID
    pool_id: UUID
    booked_count: int
    is_available: bool
    created_at: datetime

    class Config:
        from_attributes = True

class BookingRequest(BaseModel):
    pool_id: str
    booking_date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str
    duration_minutes: int
    number_of_people: int = 1
    notes: Optional[str] = None

class BookingResponse(BookingRequest):
    id: UUID
    pool_id: UUID
    user_id: UUID
    status: str
    total_amount: float
    payment_id: Optional[UUID] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PaymentRequest(BaseModel):
    booking_id: str
    amount: float
    payment_method: str  # card, upi, wallet, netbanking
    card_number: Optional[str] = None
    card_holder_name: Optional[str] = None
    expiry_date: Optional[str] = None
    cvv: Optional[str] = None

class PaymentResponse(BaseModel):
    id: UUID
    booking_id: UUID
    amount: float
    payment_method: str
    status: str
    transaction_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class RazorpayOrderRequest(BaseModel):
    booking_id: str
    payment_method: str

class RazorpayOrderResponse(BaseModel):
    order_id: str
    amount: int
    currency: str
    key: str

class RazorpayVerifyRequest(BaseModel):
    booking_id: str
    payment_method: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

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
    pool_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class OccupancyResponse(BaseModel):
    pool_id: UUID
    current_occupancy: int
    max_capacity: int
    occupancy_percentage: float
    timestamp: datetime

    class Config:
        from_attributes = True


class InvoiceResponse(BaseModel):
    invoice_number: str
    issue_date: datetime
    booking_id: UUID
    booking_status: str
    payment_id: Optional[UUID] = None
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None
    transaction_id: Optional[str] = None
    gateway: Optional[str] = None
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    pool_name: str
    pool_address: Optional[str] = None
    pool_city: Optional[str] = None
    owner_name: Optional[str] = None
    owner_email: Optional[str] = None
    owner_phone: Optional[str] = None
    booking_date: datetime
    start_time: str
    end_time: str
    duration_minutes: int
    number_of_people: int
    total_amount: float

    class Config:
        from_attributes = True

from sqlalchemy import Column, String, Float, DateTime, func, ForeignKey, Enum as SQLEnum, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base
import uuid
import enum

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"

class PaymentMethod(str, enum.Enum):
    CARD = "card"
    UPI = "upi"
    WALLET = "wallet"
    NETBANKING = "netbanking"
    COD = "cod"

class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id = Column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(SQLEnum(PaymentMethod), nullable=False)
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)

    # Card details (encrypted in production)
    card_number = Column(String(20))  # Store last 4 digits only in production
    card_holder_name = Column(String(100))
    expiry_date = Column(String(7))  # MM/YY
    cvv = Column(String(4))  # Never store in production - for demo only

    # Transaction details
    transaction_id = Column(String(100), unique=True)  # External payment gateway ID
    gateway = Column(String(50))  # stripe, razorpay, etc.
    failure_reason = Column(String(500))

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    booking = relationship("Booking", foreign_keys=[booking_id])
    user = relationship("User")


class PoolFacility(Base):
    __tablename__ = "pool_facilities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pool_id = Column(UUID(as_uuid=True), ForeignKey("pools.id"), nullable=False)
    has_lifeguard = Column(Boolean, default=False)
    has_emergency_equipment = Column(Boolean, default=False)
    has_changing_rooms = Column(Boolean, default=False)
    has_locker_facility = Column(Boolean, default=False)
    has_cctv = Column(Boolean, default=False)
    has_cafe = Column(Boolean, default=False)
    has_parking = Column(Boolean, default=False)
    has_wheelchair_access = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    pool = relationship("Pool")

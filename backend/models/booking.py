from sqlalchemy import (
    Column,
    String,
    Float,
    Integer,
    DateTime,
    func,
    ForeignKey,
    Enum as SQLEnum,
    Boolean,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base
import uuid
import enum


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Booking(Base):
    __tablename__ = "booking"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    pool_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pools.id"),
        nullable=False
    )

    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False
    )

    booking_date = Column(DateTime(timezone=True), nullable=False)

    start_time = Column(String(10), nullable=False)

    end_time = Column(String(10), nullable=False)

    duration_minutes = Column(Integer, nullable=False)

    number_of_people = Column(Integer, default=1)

    status = Column(
        SQLEnum(BookingStatus),
        default=BookingStatus.PENDING
    )

    total_amount = Column(Float, nullable=False)

    notes = Column(String(500))

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        onupdate=func.now()
    )

    pool = relationship("Pool")

    user = relationship("User")


class BookingSlot(Base):
    __tablename__ = "booking_slots"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    pool_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pools.id"),
        nullable=False
    )

    slot_date = Column(DateTime(timezone=True), nullable=False)

    start_time = Column(String(10), nullable=False)

    end_time = Column(String(10), nullable=False)

    capacity = Column(Integer, nullable=False)

    booked_count = Column(Integer, default=0)

    is_available = Column(Boolean, default=True)

    price_per_slot = Column(Float, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    pool = relationship("Pool")


class PoolOccupancy(Base):
    __tablename__ = "pool_occupancy"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    pool_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pools.id"),
        nullable=False
    )

    current_occupancy = Column(Integer, default=0)

    max_capacity = Column(Integer, nullable=False)

    occupancy_percentage = Column(Float, default=0)

    timestamp = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    pool = relationship("Pool")
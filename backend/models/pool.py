from sqlalchemy import Column, String, Float, Integer, Boolean, DateTime, func, ForeignKey, ARRAY
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base
import uuid

class Pool(Base):
    __tablename__ = "pools"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(150), nullable=False)
    address = Column(String)
    city = Column(String(100))
    latitude = Column(Float)
    longitude = Column(Float)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    pool_type = Column(String(50))  # 'indoor' or 'outdoor'
    capacity = Column(Integer)
    length_meters = Column(Integer)
    entry_fee = Column(Integer)
    amenities = Column(ARRAY(String))
    is_open = Column(Boolean, default=True)
    opening_time = Column(String(10), default="06:00")
    closing_time = Column(String(10), default="21:00")
    cleanliness_score = Column(Float, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    owner = relationship("User")

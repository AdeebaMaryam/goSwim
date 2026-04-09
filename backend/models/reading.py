from sqlalchemy import Column, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    time = Column(DateTime(timezone=True), primary_key=True)
    pool_id = Column(UUID(as_uuid=True), primary_key=True)
    device_id = Column(UUID(as_uuid=True))
    ph = Column(Float)
    chlorine_ppm = Column(Float)
    temperature_c = Column(Float)
    turbidity_ntu = Column(Float)
    cleanliness_score = Column(Float)
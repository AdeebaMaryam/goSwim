from sqlalchemy import Column, Float, DateTime, String
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base

class SensorReading(Base):
    __tablename__ = "sensor_reading"

    time = Column(DateTime(timezone=True), primary_key=True)
    pool_id = Column(String, primary_key=True)
    
    ph = Column(Float)
    tds = Column(Float)
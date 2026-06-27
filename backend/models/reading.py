from sqlalchemy import Column, Float, DateTime, String, Integer, func
from db.database import Base


class SensorReading(Base):
    __tablename__ = "sensor_reading"

    id = Column(Integer, primary_key=True, index=True)

    time = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    pool_id = Column(String, nullable=False)

    ph = Column(Float, nullable=False)

    tds = Column(Float, nullable=False)

    temperature = Column(Float, nullable=False)

    cleanliness_score = Column(Float, nullable=False, default=0)
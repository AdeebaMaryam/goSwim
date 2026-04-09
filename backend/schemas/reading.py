from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SensorReadingBase(BaseModel):
    ph: Optional[float] = None
    chlorine_ppm: Optional[float] = None
    temperature_c: Optional[float] = None
    turbidity_ntu: Optional[float] = None
    cleanliness_score: Optional[float] = None

class SensorReadingCreate(SensorReadingBase):
    pool_id: str
    device_id: Optional[str] = None
    time: datetime

class SensorReading(SensorReadingBase):
    time: datetime
    pool_id: str
    device_id: Optional[str] = None

    class Config:
        from_attributes = True
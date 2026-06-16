from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class SensorReadingBase(BaseModel):
    ph: Optional[float] = None
    tds: Optional[float] = None

class SensorReadingCreate(SensorReadingBase):
    pool_id: str
    time: datetime

class SensorReading(SensorReadingBase):
    time: datetime
    pool_id: str

    class Config:
        from_attributes = True
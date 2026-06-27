from pydantic import BaseModel
from datetime import datetime


class SensorReadingBase(BaseModel):
    ph: float
    tds: float
    temperature: float
    cleanliness_score: float


class SensorReadingCreate(SensorReadingBase):
    pool_id: str


class SensorReading(SensorReadingBase):
    id: int
    pool_id: str
    time: datetime

    class Config:
        from_attributes = True
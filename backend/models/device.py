from sqlalchemy import Column, String, Boolean, DateTime, func, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from db.database import Base
import uuid

class IoTDevice(Base):
    __tablename__ = "iot_devices"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    pool_id = Column(UUID(as_uuid=True), ForeignKey("pools.id"))
    device_name = Column(String(100))
    device_type = Column(String(50))  # 'esp32', 'waterguru', 'phin'
    mqtt_topic = Column(String(200))
    is_active = Column(Boolean, default=True)
    last_seen = Column(DateTime(timezone=True))
    registered_at = Column(DateTime(timezone=True), server_default=func.now())

    pool = relationship("Pool")
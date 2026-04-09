from sqlalchemy import Column, String, DateTime, func, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100))
    email = Column(String(100), unique=True, nullable=False)
    phone = Column(String(30))
    password_hash = Column(String, nullable=False)
    role = Column(String(20), CheckConstraint("role IN ('swimmer', 'owner', 'admin')"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

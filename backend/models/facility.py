from sqlalchemy import Column, Boolean, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from db.database import Base
import uuid


class PoolFacility(Base):
    __tablename__ = "pool_facilities"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    pool_id = Column(
        UUID(as_uuid=True),
        ForeignKey("pools.id"),
        unique=True,
        nullable=False
    )

    has_lifeguard = Column(Boolean, default=False)

    has_emergency_equipment = Column(Boolean, default=False)

    has_changing_rooms = Column(Boolean, default=False)

    has_locker_facility = Column(Boolean, default=False)

    has_cctv = Column(Boolean, default=False)

    has_cafe = Column(Boolean, default=False)

    has_parking = Column(Boolean, default=False)

    has_wheelchair_access = Column(Boolean, default=False)
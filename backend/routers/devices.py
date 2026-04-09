from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.device import IoTDevice
from models.pool import Pool
from models.user import User
from utils.security import verify_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel

router = APIRouter()
security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    token = verify_token(credentials.credentials)
    if not token:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.email == token["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user


class DeviceCreate(BaseModel):
    pool_id: str
    device_name: str
    device_type: str
    mqtt_topic: str


@router.get("/{pool_id}")
def get_devices(pool_id: str, db: Session = Depends(get_db)):
    devices = db.query(IoTDevice).filter(IoTDevice.pool_id == pool_id).all()
    return devices


@router.post("/")
def create_device(
    device: DeviceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    
    pool = db.query(Pool).filter(Pool.id == device.pool_id).first()

    if pool is None:
        raise HTTPException(status_code=404, detail="Pool not found")

    if (pool.owner_id != current_user.id) and (current_user.role != "admin"):  # type: ignore
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_device = IoTDevice(**device.dict())
    db.add(db_device)
    db.commit()
    db.refresh(db_device)

    return db_device


@router.put("/{device_id}/toggle")
def toggle_device(
    device_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    device = db.query(IoTDevice).filter(IoTDevice.id == device_id).first()

    if device is None:
        raise HTTPException(status_code=404, detail="Device not found")

    pool = db.query(Pool).filter(Pool.id == device.pool_id).first()

    if pool is None:
        raise HTTPException(status_code=404, detail="Pool not found")

    # ✅ ADD THIS BACK (authorization)
    if (pool.owner_id != current_user.id) and (current_user.role != "admin"):  # type: ignore
        raise HTTPException(status_code=403, detail="Not authorized")

    # Toggle safely
    current_status = bool(device.is_active)
    device.is_active = not current_status  # type: ignore

    db.commit()
    db.refresh(device)

    return {"is_active": device.is_active}
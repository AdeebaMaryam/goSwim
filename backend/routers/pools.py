from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from db.database import get_db
from models.pool import Pool
from models.user import User
from schemas.pool import PoolCreate, PoolUpdate, Pool as PoolSchema
from utils.security import get_current_user

router = APIRouter()


# 🔄 SERIALIZER (VERY IMPORTANT 🔥)
def serialize_pool(pool: Pool):
    return {
        "id": str(pool.id),
        "name": pool.name,
        "address": pool.address,
        "city": pool.city,
        "latitude": pool.latitude,
        "longitude": pool.longitude,
        "pool_type": pool.pool_type,
        "capacity": pool.capacity,
        "length_meters": pool.length_meters,
        "entry_fee": pool.entry_fee,
        "amenities": pool.amenities,
        "is_open": pool.is_open,
        "opening_time": pool.opening_time,
        "closing_time": pool.closing_time,
        "cleanliness_score": pool.cleanliness_score,
        "created_at": pool.created_at,
        "owner_id": str(pool.owner_id),
        "owner_name": pool.owner.name if pool.owner else None,
        "owner_email": pool.owner.email if pool.owner else None,
        "owner_phone": pool.owner.phone if pool.owner else None
    }


# ✅ GET ALL POOLS
@router.get("/", response_model=list[PoolSchema])
def get_pools(
    city: str = Query(None),
    min_score: float = Query(None),
    is_open: bool = Query(None),
    type: str = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Pool)

    if city:
        query = query.filter(Pool.city.ilike(f"%{city}%"))
    if min_score is not None:
        query = query.filter(Pool.cleanliness_score >= min_score)
    if is_open is not None:
        query = query.filter(Pool.is_open == is_open)
    if type:
        query = query.filter(Pool.pool_type == type)

    pools = query.all()

    return [serialize_pool(p) for p in pools]


@router.get("/me", response_model=list[PoolSchema])
def get_my_pools(
    current_user_token = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == current_user_token["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    pools = db.query(Pool).filter(Pool.owner_id == user.id).order_by(Pool.created_at.desc()).all()
    return [serialize_pool(p) for p in pools]


# ✅ GET SINGLE POOL
@router.get("/{pool_id}", response_model=PoolSchema)
def get_pool(pool_id: str, db: Session = Depends(get_db)):
    pool = db.query(Pool).filter(Pool.id == pool_id).first()

    if not pool:
        raise HTTPException(status_code=404, detail="Pool is not registered")

    return serialize_pool(pool)


# ✅ CREATE POOL
@router.post("/", response_model=PoolSchema)
def create_pool(
    pool: PoolCreate,
    current_user_token = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get user from database using email from token
    user = db.query(User).filter(User.email == current_user_token["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    if user.role != "owner":
        raise HTTPException(status_code=403, detail="Not authorized - only pool owners can register pools")

    existing_pool = db.query(Pool).filter(Pool.owner_id == user.id).first()

    if existing_pool:
        raise HTTPException(
            status_code=400,
            detail="You can register only one pool. Update or delete your existing pool instead."
        )
        

    db_pool = Pool(**pool.dict(), owner_id=user.id)

    db.add(db_pool)
    db.commit()
    db.refresh(db_pool)

    return serialize_pool(db_pool)


# ✅ UPDATE POOL
@router.put("/{pool_id}", response_model=PoolSchema)
def update_pool(
    pool_id: str,
    pool: PoolUpdate,
    current_user_token = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Get user from database using email from token
    user = db.query(User).filter(User.email == current_user_token["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    db_pool = db.query(Pool).filter(Pool.id == pool_id).first()

    if not db_pool:
        raise HTTPException(status_code=404, detail="Pool is not registered")

    # 🔐 SAFE AUTH CHECK (NO PYLANCE ERROR)
    owner_id = str(db_pool.owner_id)
    current_id = str(user.id)

    is_owner = owner_id == current_id

    if not is_owner:
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    for key, value in pool.dict(exclude_unset=True).items():
        setattr(db_pool, key, value)

    db.commit()
    db.refresh(db_pool)

    return serialize_pool(db_pool)


@router.delete("/{pool_id}")
def delete_pool(
    pool_id: str,
    current_user_token = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == current_user_token["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    db_pool = db.query(Pool).filter(Pool.id == pool_id).first()
    if not db_pool:
        raise HTTPException(status_code=404, detail="Pool is not registered")

    is_owner = str(db_pool.owner_id) == str(user.id)

    if not is_owner:
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )
    
    db.delete(db_pool)
    db.commit()
    return {"message": "Pool deleted successfully"}

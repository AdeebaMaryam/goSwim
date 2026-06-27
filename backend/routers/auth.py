from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.user import User as UserModel
from schemas.user import UserCreate, UserLogin, User as UserSchema
from utils.security import verify_password, get_password_hash, create_access_token, get_current_user
from pydantic import BaseModel

router = APIRouter()


class ProfileUpdateRequest(BaseModel):
    phone: str | None = None

ALLOWED_ROLES = ["swimmer", "owner"]


# 🔐 REGISTER
@router.post("/register", response_model=UserSchema)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # Check if email exists
    db_user = db.query(UserModel).filter(UserModel.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Normalize role
    role = user.role.lower()

    # Validate role (VERY IMPORTANT 🔥)
    if role not in ALLOWED_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid role. Allowed roles: {ALLOWED_ROLES}"
        )

    # Hash password
    hashed_password = get_password_hash(user.password)

    # Create user
    new_user = UserModel(
        name=user.name,
        email=user.email,
        phone=user.phone,
        password_hash=hashed_password,
        role=role
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# 🔐 LOGIN
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(UserModel.email == user.email).first()

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(user.password, db_user.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": db_user.email, "role": db_user.role}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(db_user.id),
            "name": db_user.name,
            "email": db_user.email,
            "phone": db_user.phone,
            "role": db_user.role
        }
    }

@router.get("/me")
def get_profile(current_user_token = Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(UserModel.email == current_user_token["sub"]).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="User not found")
    return {
        "id": str(db_user.id),
        "name": db_user.name,
        "email": db_user.email,
        "phone": db_user.phone,
        "role": db_user.role
    }

@router.put("/me")
def update_profile(payload: ProfileUpdateRequest, current_user_token = Depends(get_current_user), db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(UserModel.email == current_user_token["sub"]).first()
    if not db_user:
        raise HTTPException(status_code=401, detail="User not found")
    db_user.phone = payload.phone
    db.commit()
    return {
        "id": str(db_user.id),
        "name": db_user.name,
        "email": db_user.email,
        "phone": db_user.phone,
        "role": db_user.role
    }

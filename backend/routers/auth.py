from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models.user import User as UserModel
from schemas.user import UserCreate, UserLogin, User as UserSchema
from utils.security import verify_password, get_password_hash, create_access_token, get_current_user
import json
import base64
from pydantic import BaseModel

router = APIRouter()


class GoogleLoginRequest(BaseModel):
    token: str
    role: str = "swimmer"

class ProfileUpdateRequest(BaseModel):
    phone: str | None = None

ALLOWED_ROLES = ["swimmer", "owner", "admin"]


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


# 🔐 GOOGLE OAUTH LOGIN
@router.post("/google-login")
def google_login(request: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Handle Google OAuth login without requiring google-auth library.
    Decodes JWT from frontend and verifies basic structure.
    """
    try:
        token = request.token
        if not token:
            raise HTTPException(status_code=400, detail="No token provided")

        # Decode JWT manually (without verification for MVP)
        # In production, verify with Google's public keys
        parts = token.split(".")
        if len(parts) != 3:
            raise HTTPException(status_code=400, detail="Invalid token format")

        # Decode payload (add padding if needed)
        payload_encoded = parts[1]
        padding = 4 - len(payload_encoded) % 4
        if padding != 4:
            payload_encoded += "=" * padding

        try:
            decoded = base64.urlsafe_b64decode(payload_encoded)
            user_info = json.loads(decoded)
        except Exception:
            raise HTTPException(status_code=400, detail="Failed to decode token")

        email = user_info.get("email")
        name = user_info.get("name", "")

        if not email:
            raise HTTPException(status_code=400, detail="Email not in token")

        requested_role = request.role.lower()
        if requested_role not in ALLOWED_ROLES:
            requested_role = "swimmer"

        # Check if user exists
        db_user = db.query(UserModel).filter(UserModel.email == email).first()

        if db_user:
            db.commit()
        else:
            # Create new user from Google data
            db_user = UserModel(
                email=email,
                name=name,
                phone=None,
                password_hash="",  # OAuth users don't have passwords
                role=requested_role
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)

        # Create access token
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

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=400, detail="Google login failed")

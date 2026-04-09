from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from db.database import get_db
from models.booking import Booking, BookingStatus
from models.user import User
from models.pool import Pool
from models.notification import Notification
from models.payment import Payment, PaymentStatus, PaymentMethod
from schemas.booking import (
    PaymentRequest,
    PaymentResponse,
    RazorpayOrderRequest,
    RazorpayOrderResponse,
    RazorpayVerifyRequest,
)
from utils.security import get_current_user
from datetime import datetime
import uuid
import os
import hmac
import hashlib
import base64
import requests

router = APIRouter(prefix="/payments", tags=["payments"])

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET")

def get_db_user(db: Session, current_user_token):
    user = db.query(User).filter(User.email == current_user_token["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def ensure_payment_pending_booking(db: Session, booking_id: str, current_user):
    user = get_db_user(db, current_user)
    booking = db.query(Booking).filter(
        and_(Booking.id == uuid.UUID(booking_id), Booking.user_id == user.id)
    ).first()

    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking.status != BookingStatus.PENDING:
        raise HTTPException(status_code=400, detail="Booking is not pending")

    return user, booking

def get_payment_method(value: str) -> PaymentMethod:
    try:
        return PaymentMethod(value)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payment method")

def create_booking_notifications(db: Session, booking: Booking, user: User, payment_method: PaymentMethod):
    pool = db.query(Pool).filter(Pool.id == booking.pool_id).first()
    if not pool:
        return
    db.add(Notification(
        user_id=user.id,
        title="Booking confirmed",
        message=f"Your booking for {pool.name} is confirmed.",
        channel="in_app"
    ))
    db.add(Notification(
        user_id=pool.owner_id,
        title="Payment received",
        message=f"{user.name or user.email}'s booking for {pool.name} is confirmed via {payment_method.value}.",
        channel="in_app"
    ))

def get_razorpay_auth_header() -> str:
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=500, detail="Razorpay credentials are not configured")
    token = base64.b64encode(f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode("utf-8")).decode("utf-8")
    return f"Basic {token}"

@router.post("/create-order", response_model=RazorpayOrderResponse)
def create_razorpay_order(
    order_request: RazorpayOrderRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user, booking = ensure_payment_pending_booking(db, order_request.booking_id, current_user)
    payment_method = get_payment_method(order_request.payment_method)

    if payment_method not in {PaymentMethod.CARD, PaymentMethod.UPI}:
        raise HTTPException(status_code=400, detail="Razorpay is only available for card and UPI payments")

    amount_paise = int(round(float(booking.total_amount) * 100))
    if amount_paise <= 0:
        raise HTTPException(status_code=400, detail="Invalid booking amount")

    try:
        response = requests.post(
            "https://api.razorpay.com/v1/orders",
            headers={
                "Authorization": get_razorpay_auth_header(),
                "Content-Type": "application/json",
            },
            json={
                "amount": amount_paise,
                "currency": "INR",
                "receipt": str(booking.id),
                "notes": {
                    "booking_id": str(booking.id),
                    "user_email": user.email,
                    "payment_method": payment_method.value,
                },
            },
            timeout=20,
        )
        response.raise_for_status()
    except requests.RequestException as exc:
        detail = "Unable to create Razorpay order"
        if getattr(exc, "response", None) is not None:
            try:
                detail = exc.response.json().get("error", {}).get("description", detail)
            except Exception:
                pass
        raise HTTPException(status_code=502, detail=detail)

    payload = response.json()
    return RazorpayOrderResponse(
        order_id=payload["id"],
        amount=payload["amount"],
        currency=payload["currency"],
        key=RAZORPAY_KEY_ID,
    )

@router.post("/verify", response_model=PaymentResponse)
def verify_razorpay_payment(
    verification: RazorpayVerifyRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user, booking = ensure_payment_pending_booking(db, verification.booking_id, current_user)
    payment_method = get_payment_method(verification.payment_method)

    if payment_method not in {PaymentMethod.CARD, PaymentMethod.UPI}:
        raise HTTPException(status_code=400, detail="Unsupported online payment method")

    generated_signature = hmac.new(
        (RAZORPAY_KEY_SECRET or "").encode("utf-8"),
        f"{verification.razorpay_order_id}|{verification.razorpay_payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not RAZORPAY_KEY_SECRET or generated_signature != verification.razorpay_signature:
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    existing_payment = db.query(Payment).filter(Payment.transaction_id == verification.razorpay_payment_id).first()
    if existing_payment:
        return existing_payment

    try:
        new_payment = Payment(
            id=uuid.uuid4(),
            booking_id=booking.id,
            user_id=user.id,
            amount=booking.total_amount,
            payment_method=payment_method,
            transaction_id=verification.razorpay_payment_id,
            gateway="razorpay",
            status=PaymentStatus.COMPLETED
        )
        db.add(new_payment)
        booking.status = BookingStatus.CONFIRMED
        booking.payment_id = new_payment.id
        create_booking_notifications(db, booking, user, payment_method)
        db.commit()
        db.refresh(new_payment)
        return new_payment
    except HTTPException:
        db.rollback()
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(exc))

@router.post("/", response_model=PaymentResponse)
def process_payment(
    payment: PaymentRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Process payment for a booking"""
    try:
        user, booking = ensure_payment_pending_booking(db, payment.booking_id, current_user)
        payment_method = get_payment_method(payment.payment_method)

        if payment_method in {PaymentMethod.CARD, PaymentMethod.UPI}:
            raise HTTPException(status_code=400, detail="Use Razorpay checkout for card or UPI payments")

        if payment_method != PaymentMethod.COD:
            raise HTTPException(status_code=400, detail="Unsupported payment method")

        new_payment = Payment(
            id=uuid.uuid4(),
            booking_id=booking.id,
            user_id=user.id,
            amount=booking.total_amount,
            payment_method=payment_method,
            transaction_id=f"TXN_{uuid.uuid4().hex[:12].upper()}",
            gateway="offline",
            status=PaymentStatus.COMPLETED
        )

        db.add(new_payment)

        booking.status = BookingStatus.CONFIRMED
        booking.payment_id = new_payment.id
        create_booking_notifications(db, booking, user, payment_method)

        db.commit()
        db.refresh(new_payment)

        return new_payment

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get payment details"""
    user = get_db_user(db, current_user)
    payment = db.query(Payment).filter(
        and_(Payment.id == uuid.UUID(payment_id), Payment.user_id == user.id)
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    return payment

@router.get("/", response_model=list[PaymentResponse])
def get_user_payments(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = get_db_user(db, current_user)
    payments = db.query(Payment).filter(Payment.user_id == user.id).order_by(Payment.created_at.desc()).all()
    return payments

@router.get("/booking/{booking_id}", response_model=PaymentResponse)
def get_payment_by_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get payment for a booking"""
    user = get_db_user(db, current_user)
    payment = db.query(Payment).filter(
        and_(Payment.booking_id == uuid.UUID(booking_id), Payment.user_id == user.id)
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    return payment

@router.post("/{payment_id}/refund")
def refund_payment(
    payment_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Refund a payment"""
    user = get_db_user(db, current_user)
    payment = db.query(Payment).filter(
        and_(Payment.id == uuid.UUID(payment_id), Payment.user_id == user.id)
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    if payment.status != PaymentStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only refund completed payments")

    payment.status = PaymentStatus.REFUNDED
    payment.updated_at = datetime.utcnow()

    # Update booking status
    booking = db.query(Booking).filter_by(id=payment.booking_id).first()
    if booking:
        booking.status = BookingStatus.CANCELLED

    db.commit()
    return {"message": "Payment refunded successfully"}

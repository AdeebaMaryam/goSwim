from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import and_
from db.database import get_db
from models.booking import Booking, BookingSlot, PoolOccupancy, BookingStatus
from models.pool import Pool
from models.user import User
from schemas.booking import (
    BookingRequest, BookingResponse, BookingSlotRequest, BookingSlotResponse,
    PoolFacilityRequest, PoolFacilityResponse, OccupancyResponse, InvoiceResponse
)
from models.payment import PoolFacility
from utils.security import get_current_user
from datetime import datetime, timedelta
import uuid
import os
from html import escape

router = APIRouter(prefix="/bookings", tags=["bookings"])
INVOICE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "generated_invoices"))

def get_db_user(db: Session, current_user_token):
    user = db.query(User).filter(User.email == current_user_token["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def get_active_booking_statuses():
    return [BookingStatus.PENDING, BookingStatus.CONFIRMED]

def times_overlap(start_a: str, end_a: str, start_b: str, end_b: str) -> bool:
    return start_a < end_b and start_b < end_a

def time_to_minutes(value: str) -> int:
    hours, minutes = value.split(":")
    return int(hours) * 60 + int(minutes)

def validate_time_range(start_time: str, end_time: str):
    if time_to_minutes(start_time) >= time_to_minutes(end_time):
        raise HTTPException(status_code=400, detail="End time must be later than start time")

def get_slot_reserved_count(db: Session, pool_id: uuid.UUID, slot_date: str, start_time: str, end_time: str) -> int:
    bookings = db.query(Booking).filter(
        Booking.pool_id == pool_id,
        Booking.booking_date >= datetime.fromisoformat(f"{slot_date}T00:00:00"),
        Booking.booking_date < datetime.fromisoformat(f"{slot_date}T00:00:00") + timedelta(days=1),
        Booking.start_time == start_time,
        Booking.end_time == end_time,
        Booking.status.in_(get_active_booking_statuses()),
    ).all()
    return sum(booking.number_of_people or 0 for booking in bookings)


def build_invoice_payload(db: Session, booking_id: str, user: User) -> InvoiceResponse:
    booking = db.query(Booking).filter(Booking.id == uuid.UUID(booking_id)).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    pool = db.query(Pool).filter(Pool.id == booking.pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")

    if (
        str(booking.user_id) != str(user.id)
        and str(pool.owner_id) != str(user.id)
        and user.role != "admin"
    ):
        raise HTTPException(status_code=403, detail="Not authorized to view this invoice")

    customer = db.query(User).filter(User.id == booking.user_id).first()
    owner = db.query(User).filter(User.id == pool.owner_id).first() if pool.owner_id else None
    payment = db.query(Payment).filter(Payment.booking_id == booking.id).order_by(Payment.created_at.desc()).first()

    issue_date = payment.created_at or booking.created_at or datetime.utcnow()
    invoice_number = f"INV-{issue_date.strftime('%Y%m%d')}-{str(booking.id).split('-')[0].upper()}"

    return InvoiceResponse(
        invoice_number=invoice_number,
        issue_date=issue_date,
        booking_id=booking.id,
        booking_status=booking.status.value if hasattr(booking.status, "value") else str(booking.status),
        payment_id=payment.id if payment else None,
        payment_status=payment.status.value if payment and hasattr(payment.status, "value") else (str(payment.status) if payment else None),
        payment_method=payment.payment_method.value if payment and hasattr(payment.payment_method, "value") else (str(payment.payment_method) if payment else None),
        transaction_id=payment.transaction_id if payment else None,
        gateway=payment.gateway if payment else None,
        customer_name=(customer.name or customer.email) if customer else user.email,
        customer_email=customer.email if customer else user.email,
        customer_phone=customer.phone if customer else None,
        pool_name=pool.name,
        pool_address=pool.address,
        pool_city=pool.city,
        owner_name=owner.name if owner else None,
        owner_email=owner.email if owner else None,
        owner_phone=owner.phone if owner else None,
        booking_date=booking.booking_date,
        start_time=booking.start_time,
        end_time=booking.end_time,
        duration_minutes=booking.duration_minutes,
        number_of_people=booking.number_of_people or 1,
        total_amount=booking.total_amount,
    )


def render_invoice_html(invoice: InvoiceResponse) -> str:
    issue_date = invoice.issue_date.strftime("%d %b %Y, %I:%M %p")
    booking_date = invoice.booking_date.strftime("%d %b %Y")
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{escape(invoice.invoice_number)}</title>
  <style>
    body {{ font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; padding: 32px; }}
    .invoice {{ max-width: 900px; margin: 0 auto; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 16px; padding: 32px; }}
    .header {{ display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }}
    .brand {{ font-size: 32px; font-weight: 700; color: #0891b2; }}
    .muted {{ color: #475569; }}
    .status {{ background: #ecfeff; border: 1px solid #a5f3fc; color: #155e75; padding: 12px 16px; border-radius: 12px; min-width: 200px; }}
    .grid {{ display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-top: 24px; }}
    .card {{ border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; }}
    .title {{ font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #0891b2; margin-bottom: 12px; }}
    .line {{ display: flex; justify-content: space-between; gap: 20px; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }}
    .line:last-child {{ border-bottom: none; }}
    .total {{ font-size: 22px; font-weight: 700; }}
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <div>
        <div class="brand">goSwim Invoice</div>
        <p class="muted">Invoice #{escape(invoice.invoice_number)}</p>
        <p class="muted">Issued on {escape(issue_date)}</p>
      </div>
      <div class="status">
        <div><strong>Booking:</strong> {escape(invoice.booking_status)}</div>
        <div><strong>Payment:</strong> {escape(invoice.payment_status or "pending")}</div>
      </div>
    </div>
    <div class="grid">
      <div class="card">
        <div class="title">Customer</div>
        <div>{escape(invoice.customer_name)}</div>
        <div>{escape(invoice.customer_email)}</div>
        <div>{escape(invoice.customer_phone or "Phone not provided")}</div>
      </div>
      <div class="card">
        <div class="title">Pool</div>
        <div>{escape(invoice.pool_name)}</div>
        <div>{escape(invoice.pool_address or "Address not available")}</div>
        <div>{escape(invoice.pool_city or "City not available")}</div>
        <div>{escape(invoice.owner_name or "Owner")}</div>
        <div>{escape(invoice.owner_email or "Owner email not available")}</div>
        <div>{escape(invoice.owner_phone or "Owner phone not available")}</div>
      </div>
    </div>
    <div class="grid">
      <div class="card">
        <div class="title">Booking Details</div>
        <div class="line"><span>Date</span><span>{escape(booking_date)}</span></div>
        <div class="line"><span>Time</span><span>{escape(invoice.start_time)} - {escape(invoice.end_time)}</span></div>
        <div class="line"><span>Guests</span><span>{invoice.number_of_people}</span></div>
        <div class="line"><span>Duration</span><span>{invoice.duration_minutes} minutes</span></div>
      </div>
      <div class="card">
        <div class="title">Payment Details</div>
        <div class="line"><span>Method</span><span>{escape(invoice.payment_method or "pending")}</span></div>
        <div class="line"><span>Gateway</span><span>{escape(invoice.gateway or "offline / pending")}</span></div>
        <div class="line"><span>Transaction ID</span><span>{escape(invoice.transaction_id or "not available")}</span></div>
        <div class="line total"><span>Total</span><span>Rs {invoice.total_amount:.2f}</span></div>
      </div>
    </div>
  </div>
</body>
</html>"""

# ==================== BOOKING SLOTS ====================

@router.post("/slots", response_model=BookingSlotResponse)
def create_booking_slot(
    slot: BookingSlotRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create available booking slots (owner only)"""
    user = get_db_user(db, current_user)
    pool = db.query(Pool).filter(Pool.id == uuid.UUID(slot.pool_id)).first()
    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")
    if str(pool.owner_id) != str(user.id) and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to manage slots for this pool")
    validate_time_range(slot.start_time, slot.end_time)
    opening_time = pool.opening_time or "06:00"
    closing_time = pool.closing_time or "21:00"
    if time_to_minutes(slot.start_time) < time_to_minutes(opening_time) or time_to_minutes(slot.end_time) > time_to_minutes(closing_time):
        raise HTTPException(
            status_code=400,
            detail=f"Slots must be within pool hours: {opening_time} to {closing_time}"
        )

    existing_slot = db.query(BookingSlot).filter(
        BookingSlot.pool_id == uuid.UUID(slot.pool_id),
        BookingSlot.slot_date == datetime.fromisoformat(f"{slot.slot_date}T{slot.start_time}:00"),
        BookingSlot.start_time == slot.start_time,
        BookingSlot.end_time == slot.end_time,
    ).first()
    if existing_slot:
        raise HTTPException(status_code=400, detail="A slot already exists for this time")

    new_slot = BookingSlot(
        id=uuid.uuid4(),
        pool_id=uuid.UUID(slot.pool_id),
        slot_date=datetime.fromisoformat(f"{slot.slot_date}T{slot.start_time}:00"),
        start_time=slot.start_time,
        end_time=slot.end_time,
        capacity=slot.capacity,
        price_per_slot=slot.price_per_slot
    )
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    return new_slot

@router.get("/slots/{pool_id}", response_model=list[BookingSlotResponse])
def get_available_slots(
    pool_id: str,
    date: str = None,  # YYYY-MM-DD
    db: Session = Depends(get_db)
):
    """Get available booking slots for a pool"""
    query = db.query(BookingSlot).filter(BookingSlot.pool_id == uuid.UUID(pool_id), BookingSlot.is_available == True)

    if date:
        target_date = datetime.fromisoformat(f"{date}T00:00:00")
        next_date = target_date + timedelta(days=1)
        query = query.filter(and_(BookingSlot.slot_date >= target_date, BookingSlot.slot_date < next_date))

    slots = query.order_by(BookingSlot.slot_date).all()
    slot_date_string = date
    for slot in slots:
        if not slot_date_string:
            slot_date_string = slot.slot_date.date().isoformat()
        booked_count = get_slot_reserved_count(db, uuid.UUID(pool_id), slot_date_string, slot.start_time, slot.end_time)
        slot.booked_count = booked_count  # type: ignore[attr-defined]
        slot.is_available = booked_count < (slot.capacity or 0)  # type: ignore[attr-defined]
    return slots

@router.delete("/slots/{slot_id}")
def delete_booking_slot(
    slot_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = get_db_user(db, current_user)
    slot = db.query(BookingSlot).filter(BookingSlot.id == uuid.UUID(slot_id)).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    pool = db.query(Pool).filter(Pool.id == slot.pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")
    if str(pool.owner_id) != str(user.id) and user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this slot")

    db.delete(slot)
    db.commit()
    return {"message": "Slot deleted successfully"}

# ==================== BOOKINGS ====================

@router.post("/", response_model=BookingResponse)
def create_booking(
    booking: BookingRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create a new booking"""
    try:
        user = get_db_user(db, current_user)
        pool = db.query(Pool).filter_by(id=uuid.UUID(booking.pool_id)).first()
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")
        if not pool.is_open:
            raise HTTPException(status_code=400, detail="This pool is currently not accepting bookings")
        validate_time_range(booking.start_time, booking.end_time)
        opening_time = pool.opening_time or "06:00"
        closing_time = pool.closing_time or "21:00"
        if time_to_minutes(booking.start_time) < time_to_minutes(opening_time) or time_to_minutes(booking.end_time) > time_to_minutes(closing_time):
            raise HTTPException(
                status_code=400,
                detail=f"Bookings are only available between {opening_time} and {closing_time}"
            )

        booking_date = datetime.fromisoformat(f"{booking.booking_date}T00:00:00")
        requested_pool_id = uuid.UUID(booking.pool_id)

        overlapping_bookings = db.query(Booking).filter(
            Booking.pool_id == requested_pool_id,
            Booking.booking_date >= booking_date,
            Booking.booking_date < booking_date + timedelta(days=1),
            Booking.status.in_(get_active_booking_statuses()),
        ).all()

        existing_people_for_time = 0
        for existing_booking in overlapping_bookings:
            if times_overlap(existing_booking.start_time, existing_booking.end_time, booking.start_time, booking.end_time):
                existing_people_for_time += existing_booking.number_of_people or 0

        if pool.capacity and existing_people_for_time + booking.number_of_people > pool.capacity:
            raise HTTPException(
                status_code=400,
                detail=f"Only {max(pool.capacity - existing_people_for_time, 0)} spots are available for that time"
            )

        matching_slot = db.query(BookingSlot).filter(
            BookingSlot.pool_id == requested_pool_id,
            BookingSlot.slot_date >= booking_date,
            BookingSlot.slot_date < booking_date + timedelta(days=1),
            BookingSlot.start_time == booking.start_time,
            BookingSlot.end_time == booking.end_time,
            BookingSlot.is_available == True
        ).first()

        if matching_slot:
            reserved_in_slot = get_slot_reserved_count(
                db,
                requested_pool_id,
                booking.booking_date,
                booking.start_time,
                booking.end_time
            )
            remaining_in_slot = max((matching_slot.capacity or 0) - reserved_in_slot, 0)
            if booking.number_of_people > remaining_in_slot:
                raise HTTPException(
                    status_code=400,
                    detail=f"Only {remaining_in_slot} spots are left in this slot"
                )

        # Calculate total amount from the pool price stored in the database.
        slot = matching_slot or db.query(BookingSlot).filter_by(pool_id=requested_pool_id).first()
        hourly_rate = pool.entry_fee or (slot.price_per_slot if slot else 150)
        total_amount = (booking.duration_minutes / 60) * hourly_rate

        new_booking = Booking(
            id=uuid.uuid4(),
            pool_id=requested_pool_id,
            user_id=user.id,
            booking_date=booking_date,
            start_time=booking.start_time,
            end_time=booking.end_time,
            duration_minutes=booking.duration_minutes,
            number_of_people=booking.number_of_people,
            total_amount=total_amount,
            notes=booking.notes
        )
        db.add(new_booking)
        owner = db.query(User).filter(User.id == pool.owner_id).first()
        db.commit()
        db.refresh(new_booking)
        return new_booking
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list[BookingResponse])
def get_user_bookings(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get all bookings for current user"""
    user = get_db_user(db, current_user)
    bookings = db.query(Booking).filter(Booking.user_id == user.id).order_by(Booking.created_at.desc()).all()
    return bookings


@router.get("/history")
def get_user_booking_history(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = get_db_user(db, current_user)
    rows = (
        db.query(Booking, Pool)
        .join(Pool, Booking.pool_id == Pool.id)
        .outerjoin(booking_id == Booking.id)
        .filter(Booking.user_id == user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(booking.id),
            "pool_id": str(pool.id),
            "pool_name": pool.name,
            "pool_city": pool.city,
            "pool_address": pool.address,
            "booking_date": booking.booking_date,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
            "duration_minutes": booking.duration_minutes,
            "number_of_people": booking.number_of_people,
            "status": booking.status.value if hasattr(booking.status, "value") else str(booking.status),
            "total_amount": booking.total_amount,
            "payment_id": str(payment.id) if payment else None,
            "payment_status": payment.status.value if payment and hasattr(payment.status, "value") else (str(payment.status) if payment else None),
            "payment_method": payment.payment_method.value if payment and hasattr(payment.payment_method, "value") else (str(payment.payment_method) if payment else None),
            "transaction_id": payment.transaction_id if payment else None,
            "created_at": booking.created_at,
        }
        for booking, pool, payment in rows
    ]

@router.get("/owner")
def get_owner_bookings(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get bookings for pools owned by the current owner."""
    owner = get_db_user(db, current_user)

    bookings = (
        db.query(Booking, Pool, User)
        .join(Pool, Booking.pool_id == Pool.id)
        .join(User, Booking.user_id == User.id)
        .filter(Pool.owner_id == owner.id)
        .order_by(Booking.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(booking.id),
            "pool_id": str(pool.id),
            "pool_name": pool.name,
            "user_id": str(user.id),
            "user_name": user.name,
            "user_email": user.email,
            "user_phone": user.phone,
            "booking_date": booking.booking_date,
            "start_time": booking.start_time,
            "end_time": booking.end_time,
            "duration_minutes": booking.duration_minutes,
            "number_of_people": booking.number_of_people,
            "status": booking.status,
            "total_amount": booking.total_amount,
            "notes": booking.notes,
            "created_at": booking.created_at,
        }
        for booking, pool, user in bookings
    ]

@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get booking details"""
    user = get_db_user(db, current_user)
    booking = db.query(Booking).filter(
        and_(Booking.id == uuid.UUID(booking_id), Booking.user_id == user.id)
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.get("/{booking_id}/invoice", response_model=InvoiceResponse)
def get_booking_invoice(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = get_db_user(db, current_user)
    return build_invoice_payload(db, booking_id, user)


@router.get("/{booking_id}/invoice-file")
def download_booking_invoice_file(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user = get_db_user(db, current_user)
    invoice = build_invoice_payload(db, booking_id, user)
    os.makedirs(INVOICE_DIR, exist_ok=True)
    file_path = os.path.join(INVOICE_DIR, f"{invoice.invoice_number}.html")
    with open(file_path, "w", encoding="utf-8") as invoice_file:
        invoice_file.write(render_invoice_html(invoice))
    return FileResponse(
        path=file_path,
        media_type="text/html",
        filename=f"{invoice.invoice_number}.html",
    )

@router.put("/{booking_id}/cancel")
def cancel_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cancel a booking"""
    user = get_db_user(db, current_user)
    booking = db.query(Booking).filter(
        and_(Booking.id == uuid.UUID(booking_id), Booking.user_id == user.id)
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = BookingStatus.CANCELLED  # type: ignore
    db.commit()
    return {"message": "Booking cancelled successfully"}

# ==================== FACILITIES ====================

@router.post("/facilities", response_model=PoolFacilityResponse)
def create_pool_facility(
    facility: PoolFacilityRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Create/Update pool facilities (owner only)"""
    existing = db.query(PoolFacility).filter_by(pool_id=uuid.UUID(facility.pool_id)).first()

    if existing:
        existing.has_lifeguard = facility.has_lifeguard  # type: ignore
        existing.has_emergency_equipment = facility.has_emergency_equipment  # type: ignore
        existing.has_changing_rooms = facility.has_changing_rooms  # type: ignore
        existing.has_locker_facility = facility.has_locker_facility  # type: ignore
        existing.has_cctv = facility.has_cctv  # type: ignore
        existing.has_cafe = facility.has_cafe  # type: ignore
        existing.has_parking = facility.has_parking  # type: ignore
        existing.has_wheelchair_access = facility.has_wheelchair_access  # type: ignore
        db.commit()
        db.refresh(existing)
        return existing

    new_facility = PoolFacility(
        id=uuid.uuid4(),
        pool_id=uuid.UUID(facility.pool_id),
        **facility.dict(exclude={"pool_id"})
    )
    db.add(new_facility)
    db.commit()
    db.refresh(new_facility)
    return new_facility

@router.get("/{pool_id}/facilities", response_model=PoolFacilityResponse)
def get_pool_facilities(
    pool_id: str,
    db: Session = Depends(get_db)
):
    """Get pool facilities"""
    facility = db.query(PoolFacility).filter_by(pool_id=uuid.UUID(pool_id)).first()
    if not facility:
        raise HTTPException(status_code=404, detail="Facilities not found")
    return facility

# ==================== OCCUPANCY ====================

@router.get("/{pool_id}/occupancy", response_model=OccupancyResponse)
def get_pool_occupancy(
    pool_id: str,
    db: Session = Depends(get_db)
):
    """Get current pool occupancy"""
    occupancy = db.query(PoolOccupancy).filter_by(pool_id=uuid.UUID(pool_id)).order_by(PoolOccupancy.timestamp.desc()).first()
    if not occupancy:
        raise HTTPException(status_code=404, detail="Occupancy data not found")
    return occupancy

@router.put("/{pool_id}/occupancy")
def update_pool_occupancy(
    pool_id: str,
    current_occupancy: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Update pool occupancy (owner/admin only)"""
    occupancy = db.query(PoolOccupancy).filter_by(pool_id=uuid.UUID(pool_id)).order_by(PoolOccupancy.timestamp.desc()).first()

    if occupancy:
        occupancy.current_occupancy = current_occupancy  # type: ignore
        occupancy.occupancy_percentage = (current_occupancy / occupancy.max_capacity * 100) if occupancy.max_capacity > 0 else 0  # type: ignore
        occupancy.timestamp = datetime.utcnow()  # type: ignore
    else:
        # Create new occupancy record
        pool = db.query(Pool).filter_by(id=uuid.UUID(pool_id)).first()
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")

        occupancy = PoolOccupancy(
            id=uuid.uuid4(),
            pool_id=uuid.UUID(pool_id),
            current_occupancy=current_occupancy,
            max_capacity=pool.capacity or 50,
            occupancy_percentage=(current_occupancy / (pool.capacity or 50)) * 100
        )
        db.add(occupancy)

    db.commit()
    db.refresh(occupancy)
    return occupancy

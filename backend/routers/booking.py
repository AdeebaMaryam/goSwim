"""
bookings.py — goSwim Booking Router
====================================
Handles all booking-related API routes for the goSwim swimming pool management system.

Sections:
  1. Booking Slots    — Owners create/delete available time slots
  2. Bookings         — Users create, view, and cancel bookings
  3. Booking History  — Full booking history with pool details
  4. Owner Bookings   — Owners view bookings for their pools
  5. Pool Facilities  — Owners manage amenities (lifeguard, CCTV, parking, etc.)
  6. Pool Occupancy   — Real-time occupancy tracking (fed by ESP32 IoT sensors)
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from db.database import get_db
from models.booking import Booking, BookingSlot, PoolOccupancy, BookingStatus
from models.pool import Pool
from models.user import User
from models.facility import PoolFacility  # PoolFacility model lives here — keep this import
from schemas.booking import (
    BookingRequest, BookingResponse,
    BookingSlotRequest, BookingSlotResponse,
    PoolFacilityRequest, PoolFacilityResponse,
    OccupancyResponse,
)
from utils.security import get_current_user
from datetime import datetime, timedelta
import uuid

router = APIRouter()


# ─────────────────────────────────────────────
# HELPER: Fetch authenticated user from DB
# ─────────────────────────────────────────────

def get_db_user(db: Session, current_user_token) -> User:
    """
    Looks up the currently logged-in user in the database
    using the email stored in their JWT token payload.
    """
    user = db.query(User).filter(User.email == current_user_token["sub"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ─────────────────────────────────────────────
# HELPER: Return active booking statuses
# ─────────────────────────────────────────────

def get_active_booking_statuses():
    """Returns the list of statuses that count as 'active' (i.e. taking up capacity)."""
    return [BookingStatus.PENDING, BookingStatus.CONFIRMED]


# ─────────────────────────────────────────────
# HELPER: Check if two time ranges overlap
# ─────────────────────────────────────────────

def times_overlap(start_a: str, end_a: str, start_b: str, end_b: str) -> bool:
    """
    Returns True if time range A overlaps with time range B.
    Times are strings in "HH:MM" format.
    """
    return start_a < end_b and start_b < end_a


# ─────────────────────────────────────────────
# HELPER: Convert "HH:MM" to total minutes
# ─────────────────────────────────────────────

def time_to_minutes(value: str) -> int:
    """Converts a time string like '14:30' into total minutes (870)."""
    hours, minutes = value.split(":")
    return int(hours) * 60 + int(minutes)


# ─────────────────────────────────────────────
# HELPER: Validate that end_time > start_time
# ─────────────────────────────────────────────

def validate_time_range(start_time: str, end_time: str):
    """Raises a 400 error if the end time is not after the start time."""
    if time_to_minutes(start_time) >= time_to_minutes(end_time):
        raise HTTPException(status_code=400, detail="End time must be later than start time")


# ─────────────────────────────────────────────
# HELPER: Count how many people are already
#         booked in a specific slot on a date
# ─────────────────────────────────────────────

def get_slot_reserved_count(
    db: Session,
    pool_id: uuid.UUID,
    slot_date: str,
    start_time: str,
    end_time: str
) -> int:
    """
    Returns the total number of people booked for a given pool slot on a given date.
    Only counts PENDING and CONFIRMED bookings.
    """
    day_start = datetime.fromisoformat(f"{slot_date}T00:00:00")
    day_end = day_start + timedelta(days=1)

    bookings = db.query(Booking).filter(
        Booking.pool_id == pool_id,
        Booking.booking_date >= day_start,
        Booking.booking_date < day_end,
        Booking.start_time == start_time,
        Booking.end_time == end_time,
        Booking.status.in_(get_active_booking_statuses()),
    ).all()

    return sum(booking.number_of_people or 0 for booking in bookings)


# ══════════════════════════════════════════════
# SECTION 1: BOOKING SLOTS
# ══════════════════════════════════════════════

@router.post("/slots", response_model=BookingSlotResponse)
def create_booking_slot(
    slot: BookingSlotRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Create a new available booking slot for a pool.
    Only the pool owner or an admin can create slots.
    """
    user = get_db_user(db, current_user)

    # Make sure the pool exists
    pool = db.query(Pool).filter(Pool.id == uuid.UUID(slot.pool_id)).first()
    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")

    # Only the owner or admin can manage slots
    
    if str(pool.owner_id) != str(user.id):
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to manage this pool."
        )

    # Validate start < end
    validate_time_range(slot.start_time, slot.end_time)

    # Validate slot is within pool's operating hours
    opening_time = pool.opening_time or "06:00"
    closing_time = pool.closing_time or "21:00"
    if (
        time_to_minutes(slot.start_time) < time_to_minutes(opening_time)
        or time_to_minutes(slot.end_time) > time_to_minutes(closing_time)
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Slots must be within pool hours: {opening_time} to {closing_time}"
        )

    # Prevent duplicate slots at the same time
    existing_slot = db.query(BookingSlot).filter(
        BookingSlot.pool_id == uuid.UUID(slot.pool_id),
        BookingSlot.slot_date == datetime.fromisoformat(f"{slot.slot_date}T{slot.start_time}:00"),
        BookingSlot.start_time == slot.start_time,
        BookingSlot.end_time == slot.end_time,
    ).first()

    if existing_slot:
        raise HTTPException(status_code=400, detail="A slot already exists for this time")

    # Create the new slot
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
    date: str = None,  # Expected format: YYYY-MM-DD
    db: Session = Depends(get_db)
):
    """
    Get all available booking slots for a specific pool.
    Optionally filter by date (YYYY-MM-DD).
    Each slot shows how many spots are still available.
    """
    query = db.query(BookingSlot).filter(
        BookingSlot.pool_id == uuid.UUID(pool_id),
        BookingSlot.is_available == True
    )

    # Filter by a specific date if provided
    if date:
        target_date = datetime.fromisoformat(f"{date}T00:00:00")
        next_date = target_date + timedelta(days=1)
        query = query.filter(
            and_(BookingSlot.slot_date >= target_date, BookingSlot.slot_date < next_date)
        )

    slots = query.order_by(BookingSlot.slot_date).all()

    # For each slot, calculate how many people are already booked
    for slot in slots:
        # Use the date from the slot itself if no date was passed in
        slot_date_string = date or slot.slot_date.date().isoformat()
        booked_count = get_slot_reserved_count(
            db, uuid.UUID(pool_id), slot_date_string, slot.start_time, slot.end_time
        )
        # Dynamically attach booked count and update availability
        slot.booked_count = booked_count          # type: ignore[attr-defined]
        slot.is_available = booked_count < (slot.capacity or 0)  # type: ignore[attr-defined]

    return slots


@router.delete("/slots/{slot_id}")
def delete_booking_slot(
    slot_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Delete a booking slot.
    Only the pool owner or an admin can delete slots.
    """
    user = get_db_user(db, current_user)

    # Find the slot
    slot = db.query(BookingSlot).filter(BookingSlot.id == uuid.UUID(slot_id)).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")

    # Find the pool to verify ownership
    pool = db.query(Pool).filter(Pool.id == slot.pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="Pool not found")

    
    if str(pool.owner_id) != str(user.id):
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to manage this pool."
        )

    db.delete(slot)
    db.commit()
    return {"message": "Slot deleted successfully"}


# ══════════════════════════════════════════════
# SECTION 2: BOOKINGS
# ══════════════════════════════════════════════

@router.post("/", response_model=BookingResponse)
def create_booking(
    booking: BookingRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Create a new pool booking for the logged-in user.
    Validates pool capacity, time overlap, and slot availability before confirming.
    """
    try:
        user = get_db_user(db, current_user)

        # Fetch the pool
        pool = db.query(Pool).filter_by(id=uuid.UUID(booking.pool_id)).first()
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")

        # Check if pool is accepting bookings
        if not pool.is_open:
            raise HTTPException(status_code=400, detail="This pool is currently not accepting bookings")

        # Validate start < end time
        validate_time_range(booking.start_time, booking.end_time)

        # Check if requested times are within pool's operating hours
        opening_time = pool.opening_time or "06:00"
        closing_time = pool.closing_time or "21:00"
        if (
            time_to_minutes(booking.start_time) < time_to_minutes(opening_time)
            or time_to_minutes(booking.end_time) > time_to_minutes(closing_time)
        ):
            raise HTTPException(
                status_code=400,
                detail=f"Bookings are only available between {opening_time} and {closing_time}"
            )

        booking_date = datetime.fromisoformat(f"{booking.booking_date}T00:00:00")
        requested_pool_id = uuid.UUID(booking.pool_id)

        # Fetch all active bookings for this pool on the requested date
        overlapping_bookings = db.query(Booking).filter(
            Booking.pool_id == requested_pool_id,
            Booking.booking_date >= booking_date,
            Booking.booking_date < booking_date + timedelta(days=1),
            Booking.status.in_(get_active_booking_statuses()),
        ).all()

        # Count people already booked in overlapping time windows
        existing_people_for_time = 0
        for existing_booking in overlapping_bookings:
            if times_overlap(
                existing_booking.start_time,
                existing_booking.end_time,
                booking.start_time,
                booking.end_time
            ):
                existing_people_for_time += existing_booking.number_of_people or 0

        # Enforce pool capacity limit
        if pool.capacity and existing_people_for_time + booking.number_of_people > pool.capacity:
            available_spots = max(pool.capacity - existing_people_for_time, 0)
            raise HTTPException(
                status_code=400,
                detail=f"Only {available_spots} spots are available for that time"
            )

        # Check if a matching slot exists and enforce slot-level capacity
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

        # Calculate booking total from pool entry fee or slot price
        fallback_slot = matching_slot or db.query(BookingSlot).filter_by(pool_id=requested_pool_id).first()
        hourly_rate = pool.entry_fee or (fallback_slot.price_per_slot if fallback_slot else 150)
        total_amount = (booking.duration_minutes / 60) * hourly_rate

        # Create and save the booking
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
def get_user_booking(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get all bookings made by the currently logged-in user."""
    user = get_db_user(db, current_user)
    bookings = (
        db.query(Booking)
        .filter(Booking.user_id == user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return booking

# ══════════════════════════════════════════════
# SECTION 3: BOOKING HISTORY
# ══════════════════════════════════════════════

@router.get("/history", response_model=None)
def get_user_booking_history(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get full booking history for the logged-in user,
    including pool name, city, and booking details.
    """
    user = get_db_user(db, current_user)

    # Join bookings with pool info for a richer response
    rows = (
        db.query(Booking, Pool)
        .join(Pool, Booking.pool_id == Pool.id)
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
            "notes": booking.notes,
            "created_at": booking.created_at,
        }
        for booking, pool in rows
    ]


# ══════════════════════════════════════════════
# SECTION 4: OWNER BOOKINGS
# ══════════════════════════════════════════════

@router.get("/owner", response_model=None)
def get_owner_booking(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Get all bookings for pools owned by the logged-in owner.
    Includes user contact details so the owner can follow up if needed.
    """
    owner = get_db_user(db, current_user)

    # Join bookings → pool → user for a complete view
    rows = (
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
            "status": booking.status.value if hasattr(booking.status, "value") else str(booking.status),
            "total_amount": booking.total_amount,
            "notes": booking.notes,
            "created_at": booking.created_at,
        }
        for booking, pool, user in rows
    ]



@router.get("/details/{booking_id}", response_model=BookingResponse)
def get_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Get details of a specific booking. Users can only view their own bookings."""
    user = get_db_user(db, current_user)
    booking = db.query(Booking).filter(
        and_(
            Booking.id == uuid.UUID(booking_id),
            Booking.user_id == user.id
        )
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@router.put("/{booking_id}/cancel")
def cancel_booking(
    booking_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """Cancel an existing booking. Users can only cancel their own bookings."""
    user = get_db_user(db, current_user)
    booking = db.query(Booking).filter(
        and_(
            Booking.id == uuid.UUID(booking_id),
            Booking.user_id == user.id
        )
    ).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = BookingStatus.CANCELLED  # type: ignore
    db.commit()
    return {"message": "Booking cancelled successfully"}

# ══════════════════════════════════════════════
# SECTION 5: POOL FACILITIES
# ══════════════════════════════════════════════

@router.post("/facilities", response_model=PoolFacilityResponse)
def create_pool_facility(
    facility: PoolFacilityRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Create or update facilities for a pool.
    Only the pool owner or admin can modify facilities.
    """

    # Get logged-in user
    user = db.query(User).filter(
        User.email == current_user["sub"]
    ).first()

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    # Find pool
    pool = db.query(Pool).filter(
        Pool.id == uuid.UUID(facility.pool_id)
    ).first()

    if not pool:
        raise HTTPException(
            status_code=404,
            detail="Pool not found"
        )

    # Only owner or admin can edit facilities
    if str(pool.owner_id) != str(user.id):
        raise HTTPException(
            status_code=403,
            detail="You are not authorized to manage this pool."
        )

    # Check if facilities already exist
    existing = (
        db.query(PoolFacility)
        .filter_by(pool_id=uuid.UUID(facility.pool_id))
        .first()
    )

    if existing:

        existing.has_lifeguard = facility.has_lifeguard
        existing.has_emergency_equipment = facility.has_emergency_equipment
        existing.has_changing_rooms = facility.has_changing_rooms
        existing.has_locker_facility = facility.has_locker_facility
        existing.has_cctv = facility.has_cctv
        existing.has_cafe = facility.has_cafe
        existing.has_parking = facility.has_parking
        existing.has_wheelchair_access = facility.has_wheelchair_access

        db.commit()
        db.refresh(existing)

        return existing

    # Create new facility record
    new_facility = PoolFacility(
        id=uuid.uuid4(),
        pool_id=uuid.UUID(facility.pool_id),
        **facility.model_dump(exclude={"pool_id"})
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
    """
    Get facility details for a specific pool.
    No authentication required.
    """

    facility = (
        db.query(PoolFacility)
        .filter_by(pool_id=uuid.UUID(pool_id))
        .first()
    )

    if not facility:
        raise HTTPException(
            status_code=404,
            detail="Facilities not found for this pool"
        )

    return facility

# ══════════════════════════════════════════════
# SECTION 6: POOL OCCUPANCY
# (Updated by ESP32 IoT sensors in real time)
# ══════════════════════════════════════════════

@router.get("/{pool_id}/occupancy", response_model=OccupancyResponse)
def get_pool_occupancy(
    pool_id: str,
    db: Session = Depends(get_db)
):
    """
    Get the most recent occupancy reading for a pool.
    This data is typically pushed by ESP32 sensors monitoring the pool entrance.
    """
    occupancy = (
        db.query(PoolOccupancy)
        .filter_by(pool_id=uuid.UUID(pool_id))
        .order_by(PoolOccupancy.timestamp.desc())
        .first()
    )
    if not occupancy:
        raise HTTPException(status_code=404, detail="Occupancy data not found for this pool")
    return occupancy


@router.put("/{pool_id}/occupancy")
def update_pool_occupancy(
    pool_id: str,
    current_occupancy: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    """
    Update the current occupancy of a pool.
    Called by the ESP32 IoT system or by the pool owner/admin.
    Automatically calculates the occupancy percentage.
    """
    occupancy = (
        db.query(PoolOccupancy)
        .filter_by(pool_id=uuid.UUID(pool_id))
        .order_by(PoolOccupancy.timestamp.desc())
        .first()
    )

    if occupancy:
        # Update the existing record
        occupancy.current_occupancy = current_occupancy  # type: ignore
        occupancy.occupancy_percentage = (  # type: ignore
            (current_occupancy / occupancy.max_capacity * 100)
            if occupancy.max_capacity > 0
            else 0
        )
        occupancy.timestamp = datetime.now()  # type: ignore
    else:
        # No record exists yet — create one using the pool's max capacity
        pool = db.query(Pool).filter_by(id=uuid.UUID(pool_id)).first()
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")

        max_capacity = pool.capacity or 50
        occupancy = PoolOccupancy(
            id=uuid.uuid4(),
            pool_id=uuid.UUID(pool_id),
            current_occupancy=current_occupancy,
            max_capacity=max_capacity,
            occupancy_percentage=(current_occupancy / max_capacity) * 100
        )
        db.add(occupancy)

    db.commit()
    db.refresh(occupancy)
    return occupancy
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from db.database import get_db
from models.reading import SensorReading

router = APIRouter()


# ------------------------------------------------
# Latest Reading
# ------------------------------------------------
@router.get("/{pool_id}/latest")
def get_latest_reading(pool_id: str, db: Session = Depends(get_db)):

    reading = (
        db.query(SensorReading)
        .filter(SensorReading.pool_id == pool_id)
        .order_by(SensorReading.time.desc())
        .first()
    )

    if reading is None:
        raise HTTPException(status_code=404, detail="No readings found")

    return reading


# ------------------------------------------------
# Last 10 Readings
# ------------------------------------------------
@router.get("/{pool_id}/history")
def get_history(pool_id: str, db: Session = Depends(get_db)):

    reading = (
        db.query(SensorReading)
        .filter(SensorReading.pool_id == pool_id)
        .order_by(SensorReading.time.desc())
        .limit(50)
        .all()
    )

    return reading


# ------------------------------------------------
# Dashboard
# ------------------------------------------------
@router.get("/{pool_id}/dashboard")
def get_dashboard(pool_id: str, db: Session = Depends(get_db)):

    reading = (
        db.query(SensorReading)
        .filter(SensorReading.pool_id == pool_id)
        .order_by(SensorReading.time.desc())
        .first()
    )

    if reading is None:
        raise HTTPException(status_code=404, detail="No readings found")

    score = float(reading.cleanliness_score)

    if score >= 90:
        status = "Excellent"
    elif score >= 75:
        status = "Good"
    elif score >= 60:
        status = "Average"
    elif score >= 40:
        status = "Poor"
    else:
        status = "Unsafe"

    return {
        "pool_id": reading.pool_id,
        "ph": reading.ph,
        "tds": reading.tds,
        "temperature": reading.temperature,
        "cleanliness_score": score,
        "status": status,
        "last_updated": reading.time,
    }


# ------------------------------------------------
# Alerts
# ------------------------------------------------
@router.get("/{pool_id}/alerts")
def get_alerts(pool_id: str, db: Session = Depends(get_db)):

    reading = (
        db.query(SensorReading)
        .filter(SensorReading.pool_id == pool_id)
        .order_by(SensorReading.time.desc())
        .first()
    )

    if reading is None:
        return [
            {
                "message": "No sensor readings available.",
                "severity": "warning",
            }
        ]

    alerts = []

    score = reading.cleanliness_score
    ph = reading.ph
    tds = reading.tds
    temperature = reading.temperature

    if ph < 7.2 or ph > 7.8:
        alerts.append({
            "message": "pH level is outside the recommended range.",
            "severity": "warning",
        })

    if tds > 500:
        alerts.append({
            "message": "High TDS detected.",
            "severity": "warning",
        })

    if temperature < 26 or temperature > 30:
        alerts.append({
            "message": "Water temperature is outside the ideal range.",
            "severity": "warning",
        })

    if score < 60:
        alerts.append({
            "message": "Poor water quality.",
            "severity": "critical",
        })

    if not alerts:
        alerts.append({
            "message": "Water quality is excellent.",
            "severity": "info",
        })

    return alerts
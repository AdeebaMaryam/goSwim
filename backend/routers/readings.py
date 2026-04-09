from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from models.reading import SensorReading
from models.device import IoTDevice
from schemas.reading import SensorReading as ReadingSchema
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/{pool_id}/latest", response_model=ReadingSchema)
def get_latest_reading(pool_id: str, db: Session = Depends(get_db)):
    reading = db.query(SensorReading).filter(SensorReading.pool_id == pool_id).order_by(SensorReading.time.desc()).first()
    if not reading:
        raise HTTPException(status_code=404, detail="No readings found")
    return reading

@router.get("/{pool_id}/history")
def get_reading_history(pool_id: str, hours: int = 24, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(hours=hours)
    readings = db.query(SensorReading).filter(
        SensorReading.pool_id == pool_id,
        SensorReading.time >= since
    ).order_by(SensorReading.time).all()
    return [ReadingSchema.from_orm(r) for r in readings]

@router.get("/{pool_id}/stats")
def get_reading_stats(pool_id: str, days: int = 7, db: Session = Depends(get_db)):
    since = datetime.utcnow() - timedelta(days=days)
    stats = db.query(
        func.date(SensorReading.time).label('date'),
        func.avg(SensorReading.ph).label('avg_ph'),
        func.avg(SensorReading.chlorine_ppm).label('avg_chlorine'),
        func.avg(SensorReading.temperature_c).label('avg_temp'),
        func.avg(SensorReading.turbidity_ntu).label('avg_turbidity'),
        func.avg(SensorReading.cleanliness_score).label('avg_score')
    ).filter(
        SensorReading.pool_id == pool_id,
        SensorReading.time >= since
    ).group_by(func.date(SensorReading.time)).order_by(func.date(SensorReading.time)).all()
    return [
        {
            "date": stat.date.isoformat(),
            "avg_ph": round(stat.avg_ph, 2) if stat.avg_ph else None,
            "avg_chlorine": round(stat.avg_chlorine, 2) if stat.avg_chlorine else None,
            "avg_temp": round(stat.avg_temp, 2) if stat.avg_temp else None,
            "avg_turbidity": round(stat.avg_turbidity, 2) if stat.avg_turbidity else None,
            "avg_score": round(stat.avg_score, 2) if stat.avg_score else None
        } for stat in stats
    ]

@router.get("/{pool_id}/alerts")
def get_pool_alerts(pool_id: str, db: Session = Depends(get_db)):
    reading = db.query(SensorReading).filter(SensorReading.pool_id == pool_id).order_by(SensorReading.time.desc()).first()
    devices = db.query(IoTDevice).filter(IoTDevice.pool_id == pool_id).all()
    alerts = []

    if not reading:
        alerts.append({
            "id": "no-reading",
            "message": "No water-quality readings are available yet",
            "severity": "warning"
        })
    else:
        checks = [
            ("ph", reading.ph, 7.2, 7.6, "pH level is outside the ideal range"),
            ("chlorine", reading.chlorine_ppm, 1.0, 3.0, "Chlorine level is outside the ideal range"),
            ("temperature", reading.temperature_c, 26.0, 30.0, "Water temperature is outside the ideal range"),
            ("turbidity", reading.turbidity_ntu, None, 0.5, "Turbidity is above the ideal range"),
        ]
        for key, value, low, high, message in checks:
            if value is None:
                continue
            out_of_range = value > high if low is None else value < low or value > high
            if out_of_range:
                alerts.append({
                    "id": key,
                    "message": message,
                    "severity": "critical" if key in ["ph", "chlorine", "turbidity"] else "warning"
                })

        if reading.cleanliness_score is not None and reading.cleanliness_score < 70:
            alerts.append({
                "id": "cleanliness-score",
                "message": "Cleanliness score is below the recommended threshold",
                "severity": "critical"
            })

    for device in devices:
        if not device.last_seen:
            alerts.append({
                "id": f"device-{device.id}",
                "message": f"{device.device_name or 'Device'} has never reported data",
                "severity": "warning"
            })
            continue

        minutes_ago = (datetime.utcnow() - device.last_seen.replace(tzinfo=None)).total_seconds() / 60
        if minutes_ago > 30:
            alerts.append({
                "id": f"device-{device.id}",
                "message": f"{device.device_name or 'Device'} has not reported for {int(minutes_ago)} minutes",
                "severity": "warning"
            })

    if not alerts:
        alerts.append({
            "id": "all-clear",
            "message": "All live readings are within the ideal range",
            "severity": "info"
        })

    return alerts

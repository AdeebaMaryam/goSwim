from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from db.database import get_db
from models.reading import SensorReading
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
        func.avg(SensorReading.tds).label('avg_tds'),
    ).filter(
        SensorReading.pool_id == pool_id,
        SensorReading.time >= since
    ).group_by(func.date(SensorReading.time)).order_by(func.date(SensorReading.time)).all()
    return [
        {
            "date": stat.date.isoformat(),
            "avg_ph": round(stat.avg_ph, 2) if stat.avg_ph else None,
            "avg_tds": round(stat.avg_tds, 2) if stat.avg_tds else None
        } for stat in stats
    ]

@router.get("/{pool_id}/alerts")
def get_pool_alerts(pool_id: str, db: Session = Depends(get_db)):

    reading = db.query(SensorReading)\
        .filter(SensorReading.pool_id == pool_id)\
        .order_by(SensorReading.time.desc())\
        .first()

    if not reading:
        return [{
            "message": "No water readings available",
            "severity": "warning"
        }]

    alerts = []

    if reading.ph is not None:
        if reading.ph < 6.5 or reading.ph > 8.5:
            alerts.append({
                "message": "pH level is unhealthy",
                "severity": "critical"
            })

    if reading.tds is not None:
        if reading.tds > 1000:
            alerts.append({
                "message": "Water quality is poor (High TDS)",
                "severity": "critical"
            })

    if not alerts:
        alerts.append({
            "message": "Water quality is good",
            "severity": "info"
        })

    return alerts
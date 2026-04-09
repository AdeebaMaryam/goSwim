from fastapi import APIRouter, HTTPException, Query
import requests

router = APIRouter(prefix="/external-pools", tags=["external-pools"])

OVERPASS_URL = "https://overpass-api.de/api/interpreter"

@router.get("/")
def get_nearby_public_pools(
    lat: float = Query(...),
    lon: float = Query(...),
    radius: int = Query(10000, ge=500, le=50000)
):
    query = f"""
    [out:json][timeout:25];
    (
      node["leisure"="swimming_pool"](around:{radius},{lat},{lon});
      way["leisure"="swimming_pool"](around:{radius},{lat},{lon});
      relation["leisure"="swimming_pool"](around:{radius},{lat},{lon});
      node["sport"="swimming"](around:{radius},{lat},{lon});
      way["sport"="swimming"](around:{radius},{lat},{lon});
      relation["sport"="swimming"](around:{radius},{lat},{lon});
    );
    out center tags;
    """
    try:
      response = requests.post(OVERPASS_URL, data={"data": query}, timeout=30)
      response.raise_for_status()
    except requests.RequestException as exc:
      raise HTTPException(status_code=502, detail=f"Unable to fetch public pools: {exc}")

    data = response.json()
    pools = []
    seen = set()
    for element in data.get("elements", []):
      tags = element.get("tags", {})
      external_id = f"osm-{element.get('type')}-{element.get('id')}"
      if external_id in seen:
        continue
      seen.add(external_id)

      latitude = element.get("lat") or element.get("center", {}).get("lat")
      longitude = element.get("lon") or element.get("center", {}).get("lon")
      if latitude is None or longitude is None:
        continue

      pools.append({
        "id": external_id,
        "name": tags.get("name") or "Public swimming pool",
        "address": tags.get("addr:full") or tags.get("addr:street"),
        "city": tags.get("addr:city"),
        "latitude": latitude,
        "longitude": longitude,
        "pool_type": tags.get("covered") == "yes" and "indoor" or "public",
        "capacity": None,
        "length_meters": None,
        "entry_fee": None,
        "amenities": [],
        "is_open": True,
        "cleanliness_score": None,
        "is_registered": False,
        "source": "openstreetmap"
      })

    return pools

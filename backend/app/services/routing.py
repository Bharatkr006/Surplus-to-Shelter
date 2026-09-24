import math
import urllib.request
import json
from typing import Dict, Any

def haversine(lat1, lon1, lat2, lon2):
    """Calculate the great circle distance in kilometers between two points on the earth."""
    R = 6371.0 # Earth radius in kilometers
    dLat = math.radians(lat2 - lat1)
    dLon = math.radians(lon2 - lon1)
    a = math.sin(dLat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dLon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def get_route_info(origin_lat: float, origin_lng: float, dest_lat: float, dest_lng: float) -> Dict[str, Any]:
    """
    Get routing information. Uses OSRM if available, falls back to Haversine straight-line calculation.
    Uses standard urllib so no external dependencies (like requests) are required.
    """
    osrm_url = f"http://router.project-osrm.org/route/v1/driving/{origin_lng},{origin_lat};{dest_lng},{dest_lat}?overview=false"

    try:
        req = urllib.request.Request(osrm_url, headers={'User-Agent': 'SurplusToShelter/1.0'})
        with urllib.request.urlopen(req, timeout=3.0) as response:
            if response.status == 200:
                data = json.loads(response.read().decode())
                if data.get("routes") and len(data["routes"]) > 0:
                    route = data["routes"][0]
                    distance_km = route.get("distance", 0) / 1000.0
                    duration_min = route.get("duration", 0) / 60.0

                    return {
                        "distance_km": round(distance_km, 2),
                        "estimated_minutes": max(1, int(round(duration_min))),
                        "provider": "OSRM"
                    }
    except Exception as e:
        # Silently catch any network/OSRM issue and smoothly fall back
        pass

    # FALLBACK ESTIMATE
    dist_km = haversine(origin_lat, origin_lng, dest_lat, dest_lng)

    # Assume urban average speed of 30 km/h (0.5 km/min) + 5 min dispatch/traffic overhead
    est_min = (dist_km / 0.5) + 5.0

    return {
        "distance_km": round(dist_km, 2),
        "estimated_minutes": max(1, int(round(est_min))),
        "provider": "FALLBACK_ESTIMATE"
    }

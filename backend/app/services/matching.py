from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from .routing import get_route_info

# Engineering weights for scoring (Total = 1.0)
WEIGHTS = {
    "distance": 0.25,        # 25% Proximity
    "capacity": 0.20,        # 20% Ability to accommodate without bottleneck
    "food_compat": 0.15,     # 15% Category match
    "need": 0.15,            # 15% Stated active hunger relief priority
    "urgency": 0.15,         # 15% Expiry buffer & feasible time margin
    "driver": 0.10          # 10% Immediate courier readiness
}

DEFAULT_DISPATCH_BUFFER_MINUTES = 15  # Buffer for packing and vehicle arrival
MAX_SERVICE_DISTANCE_KM = 30.0        # Max boundary for urban food rescue


def calculate_distance_score(distance_km: float) -> float:
    """Closer distance receives a higher score (0 - 100)."""
    if distance_km >= MAX_SERVICE_DISTANCE_KM:
        return 0.0
    score = (1.0 - (distance_km / MAX_SERVICE_DISTANCE_KM)) * 100.0
    return round(max(0.0, min(100.0, score)), 1)


def calculate_capacity_score(donation_qty: float, capacity_available: float) -> float:
    """
    Prefer organizations that comfortably accommodate the batch.
    Higher ratio of available capacity gives higher headroom score.
    """
    if capacity_available <= 0:
        return 0.0
    # Headroom ratio
    ratio = float(donation_qty) / float(capacity_available)
    if ratio > 1.0:
        return 0.0
    # Give a base score of 60 for fitting, plus up to 40 for healthy buffer
    score = 60.0 + (1.0 - ratio) * 40.0
    return round(max(0.0, min(100.0, score)), 1)


def calculate_food_compatibility_score(food_category: str, accepted_categories: List[str]) -> float:
    """100 if accepted, otherwise 0."""
    if not accepted_categories:
        return 50.0  # Open to all if unspecified
    normalized = [c.lower().strip() for c in accepted_categories]
    if food_category.lower().strip() in normalized:
        return 100.0
    return 0.0


def calculate_need_score(food_category: str, current_needs: List[str]) -> float:
    """Scores 100 if specifically requested in urgent needs, 40 baseline for standard meals."""
    if not current_needs:
        return 50.0
    normalized = [n.lower().strip() for n in current_needs]
    if food_category.lower().strip() in normalized:
        return 100.0
    return 40.0


def calculate_urgency_score(time_remaining_minutes: float, route_minutes: int, buffer_minutes: int) -> float:
    """
    Evaluates safety margin before expiry.
    If trip + buffer takes most of the remaining time, score drops.
    """
    total_needed = route_minutes + buffer_minutes
    margin = time_remaining_minutes - total_needed
    if margin <= 0:
        return 0.0
    # Safe margin of >= 90 mins gets full 100 score
    score = min(100.0, (margin / 90.0) * 100.0)
    return round(score, 1)


def calculate_driver_score(driver_available: bool) -> float:
    """100 if immediate driver is ready, 30 baseline if waiting on dispatch."""
    return 100.0 if driver_available else 30.0


def evaluate_candidates(
    donation: Any,
    organizations: List[Any],
    available_drivers_count: int = 1,
    dispatch_buffer_minutes: int = DEFAULT_DISPATCH_BUFFER_MINUTES
) -> Dict[str, Any]:
    """
    Evaluates all candidate organizations against a donation and returns
    the ranked results with full explainability.
    """
    now = datetime.now(timezone.utc)

    # Ensure safe_until is timezone-aware
    safe_until = donation.safe_until
    if safe_until.tzinfo is None:
        safe_until = safe_until.replace(tzinfo=timezone.utc)

    time_remaining_sec = (safe_until - now).total_seconds()
    time_remaining_min = max(0.0, time_remaining_sec / 60.0)

    # If donation is already expired
    if time_remaining_min <= 0:
        return {
            "selected_match": None,
            "error": "Donation has already expired",
            "eligible_candidates": [],
            "rejected_candidates": [
                {
                    "organization_id": org.id,
                    "organization_name": org.name,
                    "eligible": False,
                    "reasons": ["Donation has already reached safe_until deadline"]
                }
                for org in organizations
            ]
        }

    eligible_candidates = []
    rejected_candidates = []

    for org in organizations:
        rejection_reasons = []

        # 1. Operational status
        if not getattr(org, 'is_open', True):
            rejection_reasons.append("Organization is currently closed")

        # 2. Capacity check
        cap_avail = float(getattr(org, 'capacity_available', 0) or 0)
        don_qty = float(donation.quantity)
        if cap_avail < don_qty:
            rejection_reasons.append(
                f"Insufficient capacity: requires {don_qty:g} {donation.unit}, only {cap_avail:g} available"
            )

        # 3. Food compatibility check
        accepted_cats = getattr(org, 'accepted_food_categories', []) or []
        compat_score = calculate_food_compatibility_score(donation.food_category, accepted_cats)
        if compat_score == 0.0:
            rejection_reasons.append(
                f"Food category '{donation.food_category}' is not in accepted categories"
            )

        # 4. Route & ETA Calculation
        route = get_route_info(
            origin_lat=donation.pickup_lat,
            origin_lng=donation.pickup_lng,
            dest_lat=org.latitude,
            dest_lng=org.longitude
        )

        # 5. Expiry feasibility check
        total_trip_time = route["estimated_minutes"] + dispatch_buffer_minutes
        if total_trip_time >= time_remaining_min:
            rejection_reasons.append(
                f"Expiry risk: ETA + buffer ({total_trip_time}m) exceeds remaining safe shelf-life ({int(time_remaining_min)}m)"
            )

        # If any hard rejection criteria met
        if rejection_reasons:
            rejected_candidates.append({
                "organization_id": org.id,
                "organization_name": org.name,
                "eligible": False,
                "reasons": rejection_reasons,
                "distance_km": route["distance_km"],
                "estimated_minutes": route["estimated_minutes"]
            })
            continue

        # Candidate is ELIGIBLE -> calculate multi-factor scores
        dist_score = calculate_distance_score(route["distance_km"])
        cap_score = calculate_capacity_score(don_qty, cap_avail)
        current_needs = getattr(org, 'current_needs', []) or []
        need_score = calculate_need_score(donation.food_category, current_needs)
        urgency_score = calculate_urgency_score(time_remaining_min, route["estimated_minutes"], dispatch_buffer_minutes)
        driver_avail = available_drivers_count > 0
        driver_score = calculate_driver_score(driver_avail)

        # Weighted final score calculation (0 - 100)
        final_score = (
            WEIGHTS["distance"] * dist_score +
            WEIGHTS["capacity"] * cap_score +
            WEIGHTS["food_compat"] * compat_score +
            WEIGHTS["need"] * need_score +
            WEIGHTS["urgency"] * urgency_score +
            WEIGHTS["driver"] * driver_score
        )
        final_score = round(final_score, 1)

        # Generate human-readable explanation checklist
        explanation = []
        explanation.append(f"Capacity available: {cap_avail:g} portions (Requested {don_qty:g})")
        explanation.append(f"Accepts {donation.food_category}")
        if need_score == 100.0:
            explanation.append(f"High current priority need for {donation.food_category}")
        explanation.append(f"{route['distance_km']} km road distance ({route['estimated_minutes']} mins ETA via {route['provider']})")
        if driver_avail:
            explanation.append("Volunteer driver available for immediate dispatch")
        explanation.append(f"Delivery safe with {int(time_remaining_min - total_trip_time)} mins expiry margin")

        candidate_data = {
            "organization_id": org.id,
            "organization_name": org.name,
            "address": org.address,
            "latitude": org.latitude,
            "longitude": org.longitude,
            "capacity_available": cap_avail,
            "eligible": True,
            "score": final_score,
            "score_breakdown": {
                "distance": dist_score,
                "capacity": cap_score,
                "food_compatibility": compat_score,
                "need": need_score,
                "urgency": urgency_score,
                "driver": driver_score
            },
            "route": route,
            "explanation": explanation
        }
        eligible_candidates.append(candidate_data)

    # Sort eligible candidates descending by final score
    eligible_candidates.sort(key=lambda c: c["score"], reverse=True)

    selected_match = eligible_candidates[0] if eligible_candidates else None

    return {
        "selected_match": selected_match,
        "eligible_candidates": eligible_candidates,
        "rejected_candidates": rejected_candidates,
        "total_evaluated": len(organizations),
        "eligible_count": len(eligible_candidates),
        "rejected_count": len(rejected_candidates)
    }

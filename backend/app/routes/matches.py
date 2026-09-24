from flask import Blueprint, jsonify, request
from app.db import db
from app.db_models import Donation, Organization, Driver, Match, dict_helper
from app.services.matching import evaluate_candidates
from datetime import datetime, timezone

bp = Blueprint('matches', __name__)


@bp.route('/', methods=['GET'])
def list_matches():
    """List all stored match records."""
    matches = Match.query.order_by(Match.created_at.desc()).all()
    result = []
    for m in matches:
        d = dict_helper(m)
        # Attach org name for convenience
        org = Organization.query.get(m.organization_id)
        d['organization_name'] = org.name if org else None
        result.append(d)
    return jsonify({"matches": result})


@bp.route('/donation/<donation_id>', methods=['GET'])
def get_match_for_donation(donation_id):
    """Get the match record for a specific donation."""
    match = Match.query.filter_by(donation_id=donation_id).order_by(Match.created_at.desc()).first()
    if not match:
        return jsonify({"match": None, "message": "No match found for this donation"}), 200

    result = dict_helper(match)
    org = Organization.query.get(match.organization_id)
    result['organization_name'] = org.name if org else None
    result['organization_address'] = org.address if org else None
    result['organization_lat'] = org.latitude if org else None
    result['organization_lng'] = org.longitude if org else None

    if match.driver_id:
        driver = Driver.query.get(match.driver_id)
        result['driver_name'] = driver.name if driver else None
        result['driver_phone'] = driver.phone if driver else None
        result['driver_vehicle_type'] = driver.vehicle_type if driver else None

    return jsonify({"match": result})


@bp.route('/run/<donation_id>', methods=['POST'])
def run_matching_for_donation(donation_id):
    """
    Core matching endpoint. Evaluates all eligible organizations for a given donation,
    selects the best viable match, persists it to DB, and returns full explainable results.
    """
    donation = Donation.query.get(donation_id)
    if not donation:
        return jsonify({"error": "Donation not found"}), 404

    if donation.status not in ('POSTED', 'MATCHING'):
        return jsonify({"error": f"Donation is in status '{donation.status}' and cannot be matched"}), 400

    # Update donation to MATCHING state
    donation.status = 'MATCHING'
    db.session.commit()

    # Fetch all open organizations as candidates
    organizations = Organization.query.filter_by(is_open=True).all()

    if not organizations:
        return jsonify({"error": "No organizations available for matching"}), 503

    # Count available drivers
    available_drivers = Driver.query.filter_by(is_available=True).all()
    available_drivers_count = len(available_drivers)

    # Run the matching engine
    result = evaluate_candidates(
        donation=donation,
        organizations=organizations,
        available_drivers_count=available_drivers_count
    )

    selected = result.get("selected_match")

    if not selected:
        # No eligible match — revert to POSTED
        donation.status = 'POSTED'
        db.session.commit()
        return jsonify({
            "selected_match": None,
            "eligible_candidates": result.get("eligible_candidates", []),
            "rejected_candidates": result.get("rejected_candidates", []),
            "total_evaluated": result.get("total_evaluated", 0),
            "eligible_count": 0,
            "rejected_count": result.get("rejected_count", 0),
            "error": result.get("error", "No viable match found after evaluating all candidates")
        }), 200

    # Assign nearest available driver (if any)
    assigned_driver = available_drivers[0] if available_drivers else None

    # Persist match to DB
    match = Match(
        donation_id=donation.id,
        organization_id=selected["organization_id"],
        driver_id=assigned_driver.id if assigned_driver else None,
        score=selected["score"],
        distance_km=selected["route"]["distance_km"],
        estimated_minutes=selected["route"]["estimated_minutes"],
        reasoning={
            "score_breakdown": selected["score_breakdown"],
            "explanation": selected["explanation"],
            "route": selected["route"],
            "eligible_candidates": result.get("eligible_candidates", []),
            "rejected_candidates": result.get("rejected_candidates", []),
            "total_evaluated": result.get("total_evaluated", 0),
            "eligible_count": result.get("eligible_count", 0),
            "rejected_count": result.get("rejected_count", 0),
        }
    )
    db.session.add(match)

    # Mark driver as unavailable
    if assigned_driver:
        assigned_driver.is_available = False
        assigned_driver.status = 'IN_TRANSIT'

    # Update donation status
    donation.status = 'MATCHED'
    db.session.commit()

    # Build full response for frontend
    return jsonify({
        "selected_match": {
            "match_id": match.id,
            "organization_id": selected["organization_id"],
            "organization_name": selected["organization_name"],
            "organization_address": selected["address"],
            "organization_lat": selected["latitude"],
            "organization_lng": selected["longitude"],
            "score": selected["score"],
            "score_breakdown": selected["score_breakdown"],
            "route": selected["route"],
            "explanation": selected["explanation"],
            "driver": {
                "name": assigned_driver.name,
                "phone": assigned_driver.phone,
                "vehicle_type": assigned_driver.vehicle_type,
            } if assigned_driver else None
        },
        "eligible_candidates": result.get("eligible_candidates", []),
        "rejected_candidates": result.get("rejected_candidates", []),
        "total_evaluated": result.get("total_evaluated", 0),
        "eligible_count": result.get("eligible_count", 0),
        "rejected_count": result.get("rejected_count", 0),
    }), 200

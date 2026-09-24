from flask import Blueprint, jsonify, request
from app.db import db
from app.db_models import Donation, Match, Driver, Organization, dict_helper
from datetime import datetime, timezone

bp = Blueprint('deliveries', __name__)


@bp.route('/', methods=['GET'])
def list_deliveries():
    """List all active deliveries (matched donations with drivers)."""
    driver_id = request.args.get('driver_id')
    query = Match.query.filter(Match.driver_id.isnot(None))
    if driver_id:
        query = query.filter(Match.driver_id == driver_id)
    matches = query.order_by(Match.created_at.desc()).all()
    result = []
    for m in matches:
        d = dict_helper(m)
        donation = Donation.query.get(m.donation_id)
        driver = Driver.query.get(m.driver_id)
        org = Organization.query.get(m.organization_id)
        if donation:
            d['donation_food_type'] = donation.food_type
            d['donation_food_category'] = donation.food_category
            d['donation_quantity'] = float(donation.quantity)
            d['donation_unit'] = donation.unit
            d['donation_status'] = donation.status
            d['donation_pickup_address'] = donation.pickup_address
            d['donation_pickup_lat'] = donation.pickup_lat
            d['donation_pickup_lng'] = donation.pickup_lng
            d['donation_safe_until'] = donation.safe_until.isoformat() if donation.safe_until else None
        if driver:
            d['driver_name'] = driver.name
            d['driver_phone'] = driver.phone
            d['driver_vehicle_type'] = driver.vehicle_type
            d['driver_status'] = driver.status
            d['driver_is_available'] = driver.is_available
        if org:
            d['organization_name'] = org.name
            d['organization_address'] = org.address
            d['organization_phone'] = org.contact_phone
            d['organization_lat'] = org.latitude
            d['organization_lng'] = org.longitude
        result.append(d)
    return jsonify({"deliveries": result, "total": len(result)})


@bp.route('/<match_id>/pickup', methods=['POST'])
def mark_picked_up(match_id):
    """Mark donation as picked up by the driver."""
    match = Match.query.get(match_id)
    if not match:
        return jsonify({"error": "Match not found"}), 404

    donation = Donation.query.get(match.donation_id)
    if not donation:
        return jsonify({"error": "Donation not found"}), 404

    donation.status = 'PICKED_UP'
    match.status = 'IN_TRANSIT'

    if match.driver_id:
        driver = Driver.query.get(match.driver_id)
        if driver:
            driver.status = 'IN_TRANSIT'
            driver.is_available = False

    db.session.commit()
    return jsonify({
        "success": True,
        "message": "Donation marked as PICKED_UP",
        "donation_status": donation.status,
        "match_id": match.id
    })


@bp.route('/<match_id>/deliver', methods=['POST'])
def mark_delivered(match_id):
    """Mark donation as successfully delivered to the recipient shelter."""
    match = Match.query.get(match_id)
    if not match:
        return jsonify({"error": "Match not found"}), 404

    donation = Donation.query.get(match.donation_id)
    if not donation:
        return jsonify({"error": "Donation not found"}), 404

    donation.status = 'DELIVERED'
    match.status = 'COMPLETED'

    # Free up driver for next rescue
    if match.driver_id:
        driver = Driver.query.get(match.driver_id)
        if driver:
            driver.status = 'IDLE'
            driver.is_available = True

    # Adjust organization available capacity
    org = Organization.query.get(match.organization_id)
    if org:
        current_cap = float(org.capacity_available or 0)
        qty = float(donation.quantity or 0)
        org.capacity_available = max(0, current_cap - qty)

    db.session.commit()
    return jsonify({
        "success": True,
        "message": "Donation delivered successfully! Driver is now available for new tasks.",
        "donation_status": donation.status,
        "match_id": match.id
    })


@bp.route('/<match_id>/claim', methods=['POST'])
def claim_delivery(match_id):
    """Assign driver to a matched rescue."""
    match = Match.query.get(match_id)
    if not match:
        return jsonify({"error": "Match not found"}), 404

    data = request.get_json() or {}
    driver_id = data.get('driver_id')
    if not driver_id:
        return jsonify({"error": "driver_id is required"}), 400

    driver = Driver.query.get(driver_id)
    if not driver:
        return jsonify({"error": "Driver not found"}), 404

    match.driver_id = driver.id
    driver.is_available = False
    driver.status = 'IN_TRANSIT'

    donation = Donation.query.get(match.donation_id)
    if donation and donation.status == 'POSTED':
        donation.status = 'MATCHED'

    db.session.commit()
    return jsonify({
        "success": True,
        "message": f"Driver {driver.name} assigned to delivery",
        "match": dict_helper(match)
    })

from flask import Blueprint, jsonify, request
from app.db import db
from app.db_models import Organization, dict_helper

bp = Blueprint('organizations', __name__)


@bp.route('/', methods=['GET'])
def list_organizations():
    """List all organizations, with optional open-only filter."""
    open_only = request.args.get('open_only', 'false').lower() == 'true'
    query = Organization.query
    if open_only:
        query = query.filter_by(is_open=True)
    orgs = query.order_by(Organization.name).all()
    return jsonify({"organizations": [dict_helper(o) for o in orgs]})


@bp.route('/<org_id>', methods=['GET'])
def get_organization(org_id):
    """Get a single organization by ID."""
    org = Organization.query.get(org_id)
    if not org:
        return jsonify({"error": "Organization not found"}), 404
    return jsonify(dict_helper(org))


@bp.route('/<org_id>', methods=['PATCH'])
def update_organization(org_id):
    """Update capacity, accepted categories, needs, or open/closed status."""
    org = Organization.query.get(org_id)
    if not org:
        return jsonify({"error": "Organization not found"}), 404

    data = request.get_json() or {}

    if 'capacity_available' in data:
        val = float(data['capacity_available'])
        if val < 0:
            return jsonify({"error": "capacity_available cannot be negative"}), 400
        if val > float(org.capacity_total):
            return jsonify({"error": "capacity_available cannot exceed capacity_total"}), 400
        org.capacity_available = val

    if 'capacity_total' in data:
        org.capacity_total = float(data['capacity_total'])

    if 'accepted_food_categories' in data:
        org.accepted_food_categories = data['accepted_food_categories']

    if 'current_needs' in data:
        org.current_needs = data['current_needs']

    if 'is_open' in data:
        org.is_open = bool(data['is_open'])

    if 'description' in data:
        org.description = data['description']

    db.session.commit()
    return jsonify(dict_helper(org))


@bp.route('/<org_id>/matches', methods=['GET'])
def get_org_matches(org_id):
    """Get all matches assigned to this organization (incoming donations)."""
    from app.db_models import Match, Donation
    org = Organization.query.get(org_id)
    if not org:
        return jsonify({"error": "Organization not found"}), 404

    matches = Match.query.filter_by(organization_id=org_id).order_by(Match.created_at.desc()).all()
    result = []
    for m in matches:
        d = dict_helper(m)
        donation = Donation.query.get(m.donation_id)
        if donation:
            d['donation_food_type'] = donation.food_type
            d['donation_food_category'] = donation.food_category
            d['donation_quantity'] = float(donation.quantity)
            d['donation_unit'] = donation.unit
            d['donation_safe_until'] = donation.safe_until.isoformat()
            d['donation_pickup_address'] = donation.pickup_address
            d['donation_status'] = donation.status
        result.append(d)

    return jsonify({"organization": dict_helper(org), "matches": result, "total": len(result)})

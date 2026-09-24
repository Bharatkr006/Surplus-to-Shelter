from flask import Blueprint, jsonify, request
from app.db import db
from app.db_models import Driver, dict_helper

bp = Blueprint('drivers', __name__)


@bp.route('/', methods=['GET'])
def list_drivers():
    """List all drivers with optional available-only filter."""
    available_only = request.args.get('available_only', 'false').lower() == 'true'
    query = Driver.query
    if available_only:
        query = query.filter_by(is_available=True)
    drivers = query.order_by(Driver.name).all()
    return jsonify({"drivers": [dict_helper(d) for d in drivers]})


@bp.route('/<driver_id>', methods=['GET'])
def get_driver(driver_id):
    """Get a single driver by ID."""
    driver = Driver.query.get(driver_id)
    if not driver:
        return jsonify({"error": "Driver not found"}), 404
    return jsonify(dict_helper(driver))


@bp.route('/<driver_id>/status', methods=['PATCH'])
def update_driver_status(driver_id):
    """Toggle driver availability and status."""
    driver = Driver.query.get(driver_id)
    if not driver:
        return jsonify({"error": "Driver not found"}), 404

    data = request.get_json() or {}

    if 'is_available' in data:
        driver.is_available = bool(data['is_available'])

    if 'status' in data:
        valid_statuses = ('IDLE', 'IN_TRANSIT', 'OFFLINE')
        if data['status'] not in valid_statuses:
            return jsonify({"error": f"Invalid status. Must be one of: {valid_statuses}"}), 400
        driver.status = data['status']
        if data['status'] == 'IDLE':
            driver.is_available = True
        elif data['status'] == 'OFFLINE':
            driver.is_available = False

    db.session.commit()
    return jsonify(dict_helper(driver))

from flask import Blueprint, jsonify, request
from app.db import db
from app.db_models import Donation, dict_helper
from datetime import datetime, timezone
import dateutil.parser

bp = Blueprint('donations', __name__)

VALID_TRANSITIONS = {
    "POSTED": ["MATCHING", "CANCELLED"],
    "MATCHING": ["MATCHED", "EXPIRED", "CANCELLED"],
    "MATCHED": ["DRIVER_ASSIGNED", "PICKED_UP", "CANCELLED"],
    "DRIVER_ASSIGNED": ["PICKED_UP", "CANCELLED"],
    "PICKED_UP": ["DELIVERED"],
    "DELIVERED": [],
    "EXPIRED": [],
    "CANCELLED": []
}

@bp.route('/', methods=['GET'])
def list_donations():
    status = request.args.get('status')
    food_category = request.args.get('food_category')
    active_only = request.args.get('active_only', 'false').lower() == 'true'

    query = Donation.query

    if status:
        query = query.filter(Donation.status == status)
    if food_category:
        query = query.filter(Donation.food_category == food_category) # typo! I will fix this
        
    donations = query.order_by(Donation.created_at.desc()).all()
    
    # Filter active in python if requested (active = not completed/cancelled/expired)
    if active_only:
        donations = [d for d in donations if d.status not in ['DELIVERED', 'CANCELLED', 'EXPIRED']]

    return jsonify({"donations": [dict_helper(d) for d in donations]})

@bp.route('/<donation_id>', methods=['GET'])
def get_donation(donation_id):
    donation = Donation.query.get(donation_id)
    if not donation:
        return jsonify({"error": "Donation not found"}), 404
    return jsonify(dict_helper(donation))

@bp.route('/', methods=['POST'])
def create_donation():
    data = request.get_json() or {}
    
    # Simple Validation
    required_fields = ['food_type', 'food_category', 'description', 'quantity', 'unit', 'prepared_at', 'safe_until', 'pickup_address', 'pickup_lat', 'pickup_lng']
    
    for f in required_fields:
        if f not in data or data[f] == '' or data[f] is None:
            return jsonify({"error": f"Missing or empty required field: {f}"}), 400
            
    try:
        qty = float(data['quantity'])
        if qty <= 0:
            return jsonify({"error": "Quantity must be greater than 0"}), 400
            
        lat = float(data['pickup_lat'])
        lng = float(data['pickup_lng'])
        if not (-90 <= lat <= 90) or not (-180 <= lng <= 180):
            return jsonify({"error": "Invalid coordinates"}), 400
            
        prepared = dateutil.parser.isoparse(data['prepared_at'])
        safe = dateutil.parser.isoparse(data['safe_until'])
        
        # ensure naive or aware match for comparison, assuming both are given as ISO aware or naive strings via JS Date
        if prepared.tzinfo is None:
            prepared = prepared.replace(tzinfo=timezone.utc)
        if safe.tzinfo is None:
            safe = safe.replace(tzinfo=timezone.utc)
            
        if safe <= prepared:
            return jsonify({"error": "safe_until must be after prepared_at"}), 400
            
        if safe <= datetime.now(timezone.utc):
            return jsonify({"error": "safe_until must be in the future"}), 400
            
    except ValueError as e:
        return jsonify({"error": f"Invalid data format: str({e})"}), 400

    new_donation = Donation(
        food_type=data['food_type'],
        food_category=data['food_category'],
        description=data['description'],
        quantity=qty,
        unit=data['unit'],
        prepared_at=prepared,
        safe_until=safe,
        pickup_address=data['pickup_address'],
        pickup_lat=lat,
        pickup_lng=lng,
        food_image_url=data.get('food_image_url')
        # status defaults to POSTED
    )
    
    db.session.add(new_donation)
    db.session.commit()
    
    return jsonify(dict_helper(new_donation)), 201

@bp.route('/<donation_id>/status', methods=['PATCH'])
def update_status(donation_id):
    data = request.get_json() or {}
    new_status = data.get('status')
    
    if not new_status:
        return jsonify({"error": "Missing status parameter"}), 400
        
    donation = Donation.query.get(donation_id)
    if not donation:
        return jsonify({"error": "Donation not found"}), 404
        
    current_status = donation.status
    allowed_next = VALID_TRANSITIONS.get(current_status, [])
    
    # Allow identical state transitions, or valid transitions
    if new_status != current_status and new_status not in allowed_next:
        return jsonify({"error": f"Invalid status transition from {current_status} to {new_status}"}), 400
        
    donation.status = new_status

    # Synchronize match and driver state
    from app.db_models import Match, Driver
    match = Match.query.filter_by(donation_id=donation.id).first()
    if match:
        if new_status == 'PICKED_UP':
            match.status = 'IN_TRANSIT'
            if match.driver_id:
                driver = Driver.query.get(match.driver_id)
                if driver:
                    driver.status = 'IN_TRANSIT'
                    driver.is_available = False
        elif new_status == 'DELIVERED':
            match.status = 'COMPLETED'
            if match.driver_id:
                driver = Driver.query.get(match.driver_id)
                if driver:
                    driver.status = 'IDLE'
                    driver.is_available = True

    db.session.commit()
    
    return jsonify(dict_helper(donation))

from flask import Blueprint, jsonify, request
from app.db import db
from app.db_models import Organization, Driver, Donation, Match, Delivery
from datetime import datetime, timezone, timedelta

bp = Blueprint('demo', __name__)


@bp.route('/reset', methods=['POST'])
def reset_demo_state():
    """
    Restore the deterministic hackathon demo state:
    - Clears past matches and deliveries
    - Resets organizations to exact baseline (Hope Shelter cap=15, Annapurna cap=80, Helping Hands closed)
    - Resets drivers to available/idle
    - Creates a fresh demo donation in POSTED state ready for 1-click matching demonstration
    """
    try:
        # 1. Clear matches and deliveries
        Match.query.delete()
        Delivery.query.delete()
        Donation.query.delete()

        # 2. Reset or re-create Organizations
        Organization.query.delete()
        Driver.query.delete()

        orgs = [
            # Recipient A: Closest (2.1km) but INSUFFICIENT CAPACITY (15 available < 40 needed) → REJECTED
            Organization(
                name="Hope Shelter",
                description="Providing meals for the unhoused in central Jaipur.",
                address="12 MI Road, Jaipur",
                latitude=26.9174,
                longitude=75.8173,
                capacity_total=200,
                capacity_available=15,  # Only 15 portions available!
                accepted_food_categories=["Cooked Meals", "Baked Goods", "Fruits", "Vegetables"],
                current_needs=["Cooked Meals", "Fruits"],
                is_open=True,
                contact_name="Ramesh Singh",
                contact_phone="9876543210"
            ),
            # Recipient B: Farther (12.4km) but BEST VIABLE MATCH (80 cap, Cooked Meals, High Need, Driver available) → SELECTED
            Organization(
                name="Annapurna Community Kitchen",
                description="Daily community meals for over 300 people. Urgently needs hot cooked meals.",
                address="45 Tonk Road, Jaipur",
                latitude=26.8833,
                longitude=75.7999,
                capacity_total=200,
                capacity_available=80,  # 80 available — comfortably fits 40 portions
                accepted_food_categories=["Cooked Meals", "Rice & Grains", "Vegetables"],
                current_needs=["Cooked Meals"],
                is_open=True,
                contact_name="Sunita Sharma",
                contact_phone="9876543211"
            ),
            # Recipient C: Incompatible food category (Packaged only, does NOT accept Cooked Meals) → REJECTED
            Organization(
                name="City Food Bank",
                description="Central redistribution hub for packaged and shelf-stable food.",
                address="Plot 5, Mansarovar, Jaipur",
                latitude=26.8643,
                longitude=75.7533,
                capacity_total=1000,
                capacity_available=900,
                accepted_food_categories=["Rice & Grains", "Vegetables", "Packaged Food", "Bakery"],
                current_needs=["Rice & Grains", "Vegetables"],
                is_open=True,
                contact_name="Vikram Verma",
                contact_phone="9876543214"
            ),
            # Recipient D: CLOSED → REJECTED
            Organization(
                name="Helping Hands Shelter",
                description="Night shelter for women and children.",
                address="12 Vidhyadhar Nagar, Jaipur",
                latitude=26.9531,
                longitude=75.7877,
                capacity_total=80,
                capacity_available=80,
                accepted_food_categories=["Cooked Meals", "Fruits", "Dairy"],
                current_needs=["Cooked Meals"],
                is_open=False,  # Closed
                contact_name="Priya Das",
                contact_phone="9876543213"
            ),
            # Recipient E: Incompatible food category → REJECTED
            Organization(
                name="Seva Foundation",
                description="NGO supporting local schools with dry goods distribution.",
                address="88 Malviya Nagar, Jaipur",
                latitude=26.8521,
                longitude=75.8115,
                capacity_total=100,
                capacity_available=50,
                accepted_food_categories=["Packaged Food", "Dairy", "Bakery"],
                current_needs=["Dairy", "Packaged Food"],
                is_open=True,
                contact_name="Amit Patel",
                contact_phone="9876543212"
            )
        ]
        db.session.add_all(orgs)

        # 3. Reset Drivers
        drivers = [
            Driver(
                name="Alex Kumar",
                phone="8881112221",
                vehicle_type="Bike",
                latitude=26.8300,
                longitude=75.8500,
                is_available=True,
                status="IDLE"
            ),
            Driver(
                name="Mohammed Ali",
                phone="8881112223",
                vehicle_type="Van",
                latitude=26.8800,
                longitude=75.7900,
                is_available=True,
                status="IDLE"
            ),
            Driver(
                name="Sneha Reddy",
                phone="8881112224",
                vehicle_type="Car",
                latitude=26.8500,
                longitude=75.8150,
                is_available=True,
                status="IDLE"
            ),
            Driver(
                name="Rajat Gupta",
                phone="8881112222",
                vehicle_type="Scooter",
                latitude=26.9200,
                longitude=75.8000,
                is_available=False,
                status="OFFLINE"
            ),
            Driver(
                name="Karan Singh",
                phone="8881112225",
                vehicle_type="Bike",
                latitude=26.9500,
                longitude=75.7800,
                is_available=False,
                status="IN_TRANSIT"
            )
        ]
        db.session.add_all(drivers)

        # 4. Create one clean Deterministic Demo Donation in POSTED state
        now = datetime.now(timezone.utc)
        demo_donation = Donation(
            food_type="Dal Makhani & Jeera Rice (40 Portions)",
            food_category="Cooked Meals",
            description="Freshly cooked nutritious vegetarian meals from university hostel luncheon. Packed in insulated food-grade containers.",
            quantity=40.0,
            unit="Portions",
            prepared_at=now - timedelta(minutes=45),
            safe_until=now + timedelta(hours=3, minutes=30),
            pickup_address="SKIT Campus Hostel, Ramnagaria, Jaipur",
            pickup_lat=26.8228,
            pickup_lng=75.8660,
            status="POSTED"
        )
        db.session.add(demo_donation)

        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Deterministic demo state successfully initialized.",
            "demo_donation": {
                "id": demo_donation.id,
                "food_type": demo_donation.food_type,
                "quantity": demo_donation.quantity,
                "unit": demo_donation.unit,
                "status": demo_donation.status
            },
            "recipients_reset": len(orgs),
            "drivers_reset": len(drivers)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Failed to reset demo state: {str(e)}"}), 500

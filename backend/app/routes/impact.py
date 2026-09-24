from flask import Blueprint, jsonify
from app.db_models import Donation, Match
from sqlalchemy import func

bp = Blueprint('impact', __name__)


@bp.route('/', methods=['GET'])
def get_impact():
    """Compute real-time impact metrics from the database."""
    # Count delivered donations
    delivered = Donation.query.filter_by(status='DELIVERED').count()
    # Count total successful matches
    matched_count = Match.query.count()
    # Active donations (not completed/cancelled/expired)
    active = Donation.query.filter(
        Donation.status.in_(['POSTED', 'MATCHING', 'MATCHED', 'DRIVER_ASSIGNED', 'PICKED_UP'])
    ).count()

    # Sum quantities delivered
    delivered_donations = Donation.query.filter_by(status='DELIVERED').all()
    total_portions = sum(float(d.quantity) for d in delivered_donations)

    # Estimate CO2: ~2.5 kg CO2e per kg of food waste avoided; assume avg 0.3 kg/portion
    total_kg = total_portions * 0.3
    co2_avoided = round(total_kg * 2.5, 1)

    return jsonify({
        "metrics": {
            "total_donations_posted": Donation.query.count(),
            "total_matches_created": matched_count,
            "successful_deliveries": delivered,
            "active_donations": active,
            "total_portions_rescued": int(total_portions),
            "estimated_weight_kg": round(total_kg, 1),
            "estimated_co2e_avoided_kg": co2_avoided,
        }
    })

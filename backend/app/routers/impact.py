from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def get_impact_metrics():
    return {
        "metrics": {
            "total_meals_rescued": 0,
            "total_weight_diverted_kg": 0,
            "estimated_co2e_avoided_kg": 0,
            "successful_deliveries": 0,
            "active_donations": 0,
        },
        "message": "Impact metrics endpoint ready",
    }

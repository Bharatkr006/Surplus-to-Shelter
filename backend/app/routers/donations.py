from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_donations():
    return {"donations": [], "message": "Donations endpoint ready"}

@router.post("/")
async def create_donation():
    return {"message": "Donation creation endpoint ready"}

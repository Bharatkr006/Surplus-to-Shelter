from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_drivers():
    return {"drivers": [], "message": "Drivers endpoint ready"}

@router.post("/")
async def create_driver():
    return {"message": "Driver creation endpoint ready"}

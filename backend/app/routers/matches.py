from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def list_matches():
    return {"matches": [], "message": "Matches endpoint ready"}

@router.post("/run")
async def run_matching():
    return {"message": "Matching engine endpoint ready"}

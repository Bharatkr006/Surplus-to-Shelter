from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import donations, organizations, drivers, matches, deliveries, impact, health

app = FastAPI(
    title="Surplus-to-Shelter API",
    description="Real-time food rescue routing platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, tags=["health"])
app.include_router(donations.router, prefix="/api/donations", tags=["donations"])
app.include_router(organizations.router, prefix="/api/organizations", tags=["organizations"])
app.include_router(drivers.router, prefix="/api/drivers", tags=["drivers"])
app.include_router(matches.router, prefix="/api/matches", tags=["matches"])
app.include_router(deliveries.router, prefix="/api/deliveries", tags=["deliveries"])
app.include_router(impact.router, prefix="/api/impact", tags=["impact"])

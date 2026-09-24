# Surplus-to-Shelter: Real-Time Food Rescue Routing

A real-time platform that matches surplus food donations to the best-fit nearby recipient organization and coordinates pickup. 
Created for AMIHACKS 1.0 (Track A: NGO/Social Impact).

## Problem Statement
We need a dynamic routing and matching engine that goes beyond "closest distance" to find the *best viable* recipient for perishable food based on capacity, compatibility, urgency, and driver availability.

## Tech Stack
- **Frontend**: React, Vite, TypeScript, Tailwind CSS v4, Maps (Leaflet)
- **Backend / Database**: Python, Flask, SQLAlchemy (PostgreSQL / Supabase Ready)
- **Routing**: OpenStreetMap / OSRM
- **Deployment**: Vercel (frontend), Render (backend)

## Database Setup

By default, the backend will auto-initialize a local SQLite database (`backend/app.db`) to ensure the platform can be run seamlessly during development, without needing manual DDL creation.

**To transition to Supabase (PostgreSQL), update `/backend/.env` with your project's credentials:**
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Note on Seed Data 🌱
On first boot, the system automatically inserts demo seed data for **5 Organizations** (Hope Shelter, etc.,) and **5 Drivers** equipped with dummy coordinate data (Jaipur Area coordinates) so you don't start with a blank state.

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+

### Setup

**1. Backend**
```bash
cd backend
python -m venv .venv
source .venv/Scripts/activate  # or source .venv/bin/activate on Linux/Mac
pip install -r requirements.txt
cp .env.example .env

# Run development server
python run.py
```
> The API will be available at `http://localhost:8001`

**2. Frontend**
```bash
cd frontend
npm install
cp .env.example .env

# Run development server
npm run dev
```
> The application will be available at `http://localhost:5173` (or whichever port Vite falls back to)

## Architecture
- **Donor Flow**: Input surplus → system calculates → driver assigned
- **NGO Flow**: Accept donations, declare capacity/needs
- **Matching Engine**: Custom weighting system prioritizing urgency and fit

from app.db import db
from app.db_models import Organization, Driver
import os


def seed_data():
    if Organization.query.count() > 0:
        return  # already seeded

    # ---------------------------------------------------------------------------
    # DEMO SCENARIO FOR JUDGES
    # Donation: 40 portions of Cooked Meals, pickup at SKIT College, Jaipur
    # (lat 26.8228, lng 75.8660)
    #
    # Expected algorithm result:
    #   Candidate 1 — Hope Shelter (2.1 km):   REJECTED — insufficient capacity (15 < 40)
    #   Candidate 2 — Annapurna Kitchen (4.8 km): SELECTED — 80 cap, accepts Cooked Meals, high need
    #   Candidate 3 — City Food Bank (6.3 km): ELIGIBLE but lower score (doesn't accept Cooked Meals as primary need)
    #   Candidate 4 — Helping Hands (9.1 km):  REJECTED — organization is closed
    #   Candidate 5 — Seva Foundation (3.5 km):REJECTED — food category incompatible (accepts Packaged only)
    # ---------------------------------------------------------------------------

    orgs = [
        # Candidate 1: Very close but INSUFFICIENT CAPACITY → REJECTED
        Organization(
            name="Hope Shelter",
            description="Providing meals for the unhoused in central Jaipur.",
            address="12 MI Road, Jaipur",
            latitude=26.9174,
            longitude=75.8173,
            capacity_total=200,
            capacity_available=15,  # Only 15 available — insufficient for 40-portion donation
            accepted_food_categories=["Cooked Meals", "Baked Goods", "Fruits", "Vegetables"],
            current_needs=["Cooked Meals", "Fruits"],
            is_open=True,
            contact_name="Ramesh Singh",
            contact_phone="9876543210"
        ),
        # Candidate 2: Slightly farther, BEST MATCH — high capacity, high need, accepts food → SELECTED
        Organization(
            name="Annapurna Community Kitchen",
            description="Daily community meals for over 300 people. Urgently needs cooked food.",
            address="45 Tonk Road, Jaipur",
            latitude=26.8833,
            longitude=75.7999,
            capacity_total=200,
            capacity_available=80,  # 80 available — comfortably fits 40 portions
            accepted_food_categories=["Cooked Meals", "Rice & Grains", "Vegetables"],
            current_needs=["Cooked Meals"],  # Actively requesting this exact category
            is_open=True,
            contact_name="Sunita Sharma",
            contact_phone="9876543211"
        ),
        # Candidate 3: Moderate distance, enough capacity but no driver → lower ranked
        Organization(
            name="City Food Bank",
            description="Central redistribution hub for packaged and shelf-stable food.",
            address="Plot 5, Mansarovar, Jaipur",
            latitude=26.8643,
            longitude=75.7533,
            capacity_total=1000,
            capacity_available=900,
            accepted_food_categories=["Rice & Grains", "Vegetables", "Packaged Food", "Bakery"],
            # City Food Bank does NOT list Cooked Meals → food_compat score = 0 → REJECTED
            current_needs=["Rice & Grains", "Vegetables"],
            is_open=True,
            contact_name="Vikram Verma",
            contact_phone="9876543214"
        ),
        # Candidate 4: CLOSED → REJECTED
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
            is_open=False,  # CLOSED — automatic rejection
            contact_name="Priya Das",
            contact_phone="9876543213"
        ),
        # Candidate 5: Close but food INCOMPATIBLE → REJECTED
        Organization(
            name="Seva Foundation",
            description="NGO supporting local schools with dry goods distribution.",
            address="88 Malviya Nagar, Jaipur",
            latitude=26.8521,
            longitude=75.8115,
            capacity_total=100,
            capacity_available=50,
            accepted_food_categories=["Packaged Food", "Dairy", "Bakery"],
            # Does NOT accept Cooked Meals → food incompatibility
            current_needs=["Dairy", "Packaged Food"],
            is_open=True,
            contact_name="Amit Patel",
            contact_phone="9876543212"
        )
    ]

    db.session.add_all(orgs)

    # 5 Demo drivers (Jaipur area)
    # Alex Kumar is AVAILABLE → will be assigned to the winning match
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
            name="Rajat Gupta",
            phone="8881112222",
            vehicle_type="Scooter",
            latitude=26.9200,
            longitude=75.8000,
            is_available=False,
            status="OFFLINE"
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
    db.session.commit()
    print("✅ Database seeded with demo organizations and drivers (judge demo scenario ready).")

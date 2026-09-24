import pytest
from app import create_app
from app.db import db
from datetime import datetime, timedelta, timezone

@pytest.fixture
def app():
    app_instance = create_app()
    app_instance.config.update({
        "TESTING": True,
        "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:"
    })
    
    with app_instance.app_context():
        db.create_all()
        yield app_instance
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_create_valid_donation(client):
    now = datetime.now(timezone.utc)
    res = client.post('/api/donations/', json={
        "food_type": "Fruits",
        "food_category": "Fruits",
        "description": "Apples",
        "quantity": 10,
        "unit": "Kg",
        "prepared_at": now.isoformat(),
        "safe_until": (now + timedelta(hours=5)).isoformat(),
        "pickup_address": "123 Test St",
        "pickup_lat": 26.9,
        "pickup_lng": 75.8
    })
    assert res.status_code == 201
    assert res.json['status'] == 'POSTED'

def test_reject_invalid_quantity(client):
    now = datetime.now(timezone.utc)
    res = client.post('/api/donations/', json={
        "food_type": "Fruits",
        "food_category": "Fruits",
        "description": "Apples",
        "quantity": -5,
        "unit": "Kg",
        "prepared_at": now.isoformat(),
        "safe_until": (now + timedelta(hours=5)).isoformat(),
        "pickup_address": "123 Test St",
        "pickup_lat": 26.9,
        "pickup_lng": 75.8
    })
    assert res.status_code == 400
    assert "Quantity must be greater than 0" in res.json['error']

def test_reject_safe_until_before_prepared(client):
    now = datetime.now(timezone.utc)
    res = client.post('/api/donations/', json={
        "food_type": "Fruits",
        "food_category": "Fruits",
        "description": "Apples",
        "quantity": 10,
        "unit": "Kg",
        "prepared_at": (now + timedelta(hours=5)).isoformat(),
        "safe_until": now.isoformat(),
        "pickup_address": "123 Test St",
        "pickup_lat": 26.9,
        "pickup_lng": 75.8
    })
    assert res.status_code == 400
    assert "after prepared_at" in res.json['error']

def test_reject_invalid_coordinates(client):
    now = datetime.now(timezone.utc)
    res = client.post('/api/donations/', json={
        "food_type": "Fruits",
        "food_category": "Fruits",
        "description": "Apples",
        "quantity": 10,
        "unit": "Kg",
        "prepared_at": now.isoformat(),
        "safe_until": (now + timedelta(hours=5)).isoformat(),
        "pickup_address": "123 Test St",
        "pickup_lat": 100, # Invalid (>90)
        "pickup_lng": 75.8
    })
    assert res.status_code == 400

def test_status_transition(client):
    now = datetime.now(timezone.utc)
    # Create
    res = client.post('/api/donations/', json={
        "food_type": "Meals", "food_category": "Cooked Meals", "description": "Rice",
        "quantity": 20, "unit": "Portions", "prepared_at": now.isoformat(),
        "safe_until": (now + timedelta(hours=2)).isoformat(), "pickup_address": "abc", "pickup_lat": 20, "pickup_lng": 20
    })
    d_id = res.json['id']
    
    # Valid transition POSTED -> MATCHING
    res = client.patch(f'/api/donations/{d_id}/status', json={"status": "MATCHING"})
    assert res.status_code == 200
    assert res.json['status'] == 'MATCHING'
    
    # Invalid transition MATCHING -> POSTED
    res = client.patch(f'/api/donations/{d_id}/status', json={"status": "POSTED"})
    assert res.status_code == 400
    
    # Valid MATCHING -> EXPIRED
    res = client.patch(f'/api/donations/{d_id}/status', json={"status": "EXPIRED"})
    assert res.status_code == 200

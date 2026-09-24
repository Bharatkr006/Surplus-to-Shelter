from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.ext.compiler import compiles
import sqlalchemy.types as types
from app.db import db, generate_uuid
import json

# Fallback for JSONB in sqlite
class JSONType(types.TypeDecorator):
    impl = types.String
    def process_bind_param(self, value, dialect):
        if value is not None:
            return json.dumps(value)
        return value
    def process_result_value(self, value, dialect):
        if value is not None:
            return json.loads(value)
        return value
        
# Determine JSON dialect
def get_json_type():
    return db.JSON().with_variant(JSONB, 'postgresql').with_variant(JSONType, 'sqlite')


class Organization(db.Model):
    __tablename__ = 'organizations'
    id = db.Column(db.String, primary_key=True, default=generate_uuid)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text, nullable=True)
    address = db.Column(db.Text, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    capacity_total = db.Column(db.Numeric, nullable=False, default=0)
    capacity_available = db.Column(db.Numeric, nullable=False, default=0)
    accepted_food_categories = db.Column(get_json_type(), nullable=True, default=list)
    current_needs = db.Column(get_json_type(), nullable=True, default=list)
    is_open = db.Column(db.Boolean, default=True, index=True)
    contact_name = db.Column(db.String, nullable=True)
    contact_phone = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Driver(db.Model):
    __tablename__ = 'drivers'
    id = db.Column(db.String, primary_key=True, default=generate_uuid)
    name = db.Column(db.String, nullable=False)
    phone = db.Column(db.String, nullable=True)
    vehicle_type = db.Column(db.String, nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    is_available = db.Column(db.Boolean, default=True, index=True)
    status = db.Column(db.String, default='IDLE')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Donation(db.Model):
    __tablename__ = 'donations'
    id = db.Column(db.String, primary_key=True, default=generate_uuid)
    donor_id = db.Column(db.String, nullable=True) # Optional for now
    food_type = db.Column(db.String, nullable=False)
    food_category = db.Column(db.String, nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    quantity = db.Column(db.Numeric, nullable=False)
    unit = db.Column(db.String, nullable=False)
    prepared_at = db.Column(db.DateTime, nullable=False)
    safe_until = db.Column(db.DateTime, nullable=False, index=True)
    pickup_address = db.Column(db.Text, nullable=False)
    pickup_lat = db.Column(db.Float, nullable=False)
    pickup_lng = db.Column(db.Float, nullable=False)
    food_image_url = db.Column(db.Text, nullable=True)
    status = db.Column(db.String, default='POSTED', index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Match(db.Model):
    __tablename__ = 'matches'
    id = db.Column(db.String, primary_key=True, default=generate_uuid)
    donation_id = db.Column(db.String, db.ForeignKey('donations.id'), nullable=False)
    organization_id = db.Column(db.String, db.ForeignKey('organizations.id'), nullable=False)
    driver_id = db.Column(db.String, db.ForeignKey('drivers.id'), nullable=True)
    score = db.Column(db.Float, nullable=True)
    distance_km = db.Column(db.Float, nullable=True)
    estimated_minutes = db.Column(db.Integer, nullable=True)
    reasoning = db.Column(get_json_type(), nullable=True)
    status = db.Column(db.String, default='PENDING', index=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Delivery(db.Model):
    __tablename__ = 'deliveries'
    id = db.Column(db.String, primary_key=True, default=generate_uuid)
    donation_id = db.Column(db.String, db.ForeignKey('donations.id'), nullable=False)
    driver_id = db.Column(db.String, db.ForeignKey('drivers.id'), nullable=False)
    pickup_time = db.Column(db.DateTime, nullable=True)
    delivery_time = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String, default='PENDING', index=True)
    route_distance_km = db.Column(db.Float, nullable=True)
    estimated_minutes = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

def dict_helper(obj):
    """Helper to convert sqlalchemy obj to dict safely"""
    d = {}
    for column in obj.__table__.columns:
        val = getattr(obj, column.name)
        if isinstance(val, datetime):
            val = val.isoformat()
        d[column.name] = val
    return d


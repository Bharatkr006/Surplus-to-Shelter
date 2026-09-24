from flask_sqlalchemy import SQLAlchemy
import uuid

db = SQLAlchemy()

def generate_uuid():
    return str(uuid.uuid4())

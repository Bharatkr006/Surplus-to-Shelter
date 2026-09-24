from app import create_app
from app.db import db
from seed import seed_data
import os

app = create_app()

def initialize_database():
    with app.app_context():
        db.create_all()
        seed_data()

if __name__ == '__main__':
    initialize_database()
    port = int(os.environ.get("PORT", 8000))
    app.run(host='0.0.0.0', port=port, debug=True)

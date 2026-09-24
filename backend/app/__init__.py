from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
from .db import db

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app, resources={r"/api/*": {"origins": "*"}, r"/health": {"origins": "*"}})
    
    # Database config
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///app.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    db.init_app(app)

    @app.route('/health', methods=['GET'])
    def health_check():
        return jsonify({"status": "healthy", "version": "1.0.1"})

    # Register blueprints
    try:
        from .routes import donations, organizations, drivers, matches, deliveries, impact, demo
        
        app.register_blueprint(donations.bp, url_prefix='/api/donations')
        app.register_blueprint(organizations.bp, url_prefix='/api/organizations')
        app.register_blueprint(drivers.bp, url_prefix='/api/drivers')
        app.register_blueprint(matches.bp, url_prefix='/api/matches')
        app.register_blueprint(deliveries.bp, url_prefix='/api/deliveries')
        app.register_blueprint(impact.bp, url_prefix='/api/impact')
        app.register_blueprint(demo.bp, url_prefix='/api/demo')
    except Exception as e:
        print(f"Error registering blueprints: {e}")

    return app

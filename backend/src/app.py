from flask import Flask
from flask_cors import CORS
from src.routes.health import health_bp
from src.routes.devices import devices_bp

def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(health_bp)
    app.register_blueprint(devices_bp)
    CORS(app)

    return app

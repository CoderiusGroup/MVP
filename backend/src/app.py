from flask import Flask

from src.routes.health import health_bp


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(health_bp)
    return app

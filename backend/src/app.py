from pathlib import Path

from flask import Flask
from flask_cors import CORS

from src.repositories.decision_tree_repository import JsonDecisionTreeRepository
from src.routes.decision_tree import create_decision_tree_blueprint
from src.routes.devices import devices_bp
from src.routes.health import health_bp
from src.services.decision_tree_service import DecisionTreeService

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(health_bp)
    app.register_blueprint(devices_bp)

    decision_tree_repository = JsonDecisionTreeRepository(DATA_DIR / "decision_trees")
    decision_tree_service = DecisionTreeService(decision_tree_repository)
    app.register_blueprint(create_decision_tree_blueprint(decision_tree_service))

    CORS(app)

    return app

from pathlib import Path

from flask import Flask

from src.repositories.decision_tree_repository import JsonDecisionTreeRepository
from src.routes.decision_tree import create_decision_tree_blueprint
from src.routes.health import health_bp
from src.services.decision_tree_service import DecisionTreeService

DATA_DIR = Path(__file__).resolve().parent.parent / "data"


def create_app() -> Flask:
    app = Flask(__name__)
    app.register_blueprint(health_bp)

    decision_tree_repository = JsonDecisionTreeRepository(DATA_DIR / "decision_trees")
    decision_tree_service = DecisionTreeService(decision_tree_repository)
    app.register_blueprint(create_decision_tree_blueprint(decision_tree_service))

    return app

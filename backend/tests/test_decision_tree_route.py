import json
from pathlib import Path

from flask import Flask

from src.repositories.decision_tree_repository import IDecisionTreeRepository
from src.routes.decision_tree import create_decision_tree_blueprint
from src.services.decision_tree_service import DecisionTreeService

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "sample_decision_tree.json"


class FakeDecisionTreeRepository(IDecisionTreeRepository):
    def __init__(self, trees):
        self._trees = trees

    def get(self, id):
        return self._trees.get(id)

    def save(self, decision_tree):
        raise NotImplementedError

    def delete(self, id):
        raise NotImplementedError

    def list(self):
        return list(self._trees)


def _build_app():
    raw = json.loads(FIXTURE_PATH.read_text())
    requirement_id = raw["decisionTree"]["requirementId"]
    repository = FakeDecisionTreeRepository({requirement_id: raw})
    service = DecisionTreeService(repository)
    app = Flask(__name__)
    app.register_blueprint(create_decision_tree_blueprint(service))
    return app, raw["decisionTree"]


def test_get_decision_tree_returns_contract_shape():
    app, decision_tree = _build_app()
    client = app.test_client()

    response = client.get(f"/decision-trees/{decision_tree['requirementId']}")
    body = response.get_json()

    assert response.status_code == 200
    assert body["requirementId"] == decision_tree["requirementId"]
    assert body["requirementName"] == decision_tree["requirementName"]
    assert body["rootNode"] == decision_tree["rootNode"]
    assert body["nodes"] == decision_tree["nodes"]
    assert body["appliesTo"] == decision_tree["appliesTo"]


def test_get_decision_tree_returns_404_when_missing():
    app, _ = _build_app()
    client = app.test_client()

    response = client.get("/decision-trees/does-not-exist")

    assert response.status_code == 404
    assert "error" in response.get_json()

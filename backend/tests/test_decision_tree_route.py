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


def test_list_decision_trees_returns_requirement_summaries():
    raw = json.loads(FIXTURE_PATH.read_text())
    other = json.loads(FIXTURE_PATH.read_text())
    other["decisionTree"]["requirementId"] = "AUM-1-1"
    other["decisionTree"]["requirementName"] = "Access management"

    app = Flask(__name__)
    repo = FakeDecisionTreeRepository({raw["decisionTree"]["requirementId"]: raw, other["decisionTree"]["requirementId"]: other})
    app.register_blueprint(create_decision_tree_blueprint(DecisionTreeService(repo)))
    client = app.test_client()

    response = client.get("/decision-trees")
    body = response.get_json()

    assert response.status_code == 200
    assert body == [
        {"requirementId": raw["decisionTree"]["requirementId"], "requirementName": raw["decisionTree"]["requirementName"]},
        {"requirementId": other["decisionTree"]["requirementId"], "requirementName": other["decisionTree"]["requirementName"]},
    ]


def test_export_decision_tree_supports_json_and_csv():
    raw = json.loads(FIXTURE_PATH.read_text())
    app = Flask(__name__)
    repo = FakeDecisionTreeRepository({raw["decisionTree"]["requirementId"]: raw})
    app.register_blueprint(create_decision_tree_blueprint(DecisionTreeService(repo)))
    client = app.test_client()

    json_response = client.get(f"/decision-trees/{raw['decisionTree']['requirementId']}/export?format=json")
    csv_response = client.get(f"/decision-trees/{raw['decisionTree']['requirementId']}/export?format=csv")

    assert json_response.status_code == 200
    assert json_response.get_json()["requirementId"] == raw["decisionTree"]["requirementId"]
    assert json_response.headers["Content-Type"].startswith("application/json")

    assert csv_response.status_code == 200
    assert csv_response.headers["Content-Type"].startswith("text/csv")
    csv_text = csv_response.get_data(as_text=True)
    assert "requirementId" in csv_text
    assert raw["decisionTree"]["rootNode"] in csv_text
    assert "branchesYes" in csv_text

import json
from io import BytesIO
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
        requirement_id = decision_tree["decisionTree"]["requirementId"]
        self._trees[requirement_id] = decision_tree

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
    repo = FakeDecisionTreeRepository(
        {raw["decisionTree"]["requirementId"]: raw, other["decisionTree"]["requirementId"]: other}
    )
    app.register_blueprint(create_decision_tree_blueprint(DecisionTreeService(repo)))
    client = app.test_client()

    response = client.get("/decision-trees")
    body = response.get_json()

    assert response.status_code == 200
    assert body == [
        {
            "requirementId": raw["decisionTree"]["requirementId"],
            "requirementName": raw["decisionTree"]["requirementName"],
        },
        {
            "requirementId": other["decisionTree"]["requirementId"],
            "requirementName": other["decisionTree"]["requirementName"],
        },
    ]


def test_export_decision_tree_supports_json_and_csv():
    raw = json.loads(FIXTURE_PATH.read_text())
    app = Flask(__name__)
    repo = FakeDecisionTreeRepository({raw["decisionTree"]["requirementId"]: raw})
    app.register_blueprint(create_decision_tree_blueprint(DecisionTreeService(repo)))
    client = app.test_client()

    json_response = client.get(
        f"/decision-trees/{raw['decisionTree']['requirementId']}/export?format=json"
    )
    csv_response = client.get(
        f"/decision-trees/{raw['decisionTree']['requirementId']}/export?format=csv"
    )

    assert json_response.status_code == 200
    assert json_response.get_json()["requirementId"] == raw["decisionTree"]["requirementId"]
    assert json_response.headers["Content-Type"].startswith("application/json")

    assert csv_response.status_code == 200
    assert csv_response.headers["Content-Type"].startswith("text/csv")
    csv_text = csv_response.get_data(as_text=True)
    assert "requirementId" in csv_text
    assert raw["decisionTree"]["rootNode"] in csv_text
    assert "branchesYes" in csv_text


def test_import_decision_tree_accepts_json_and_updates_catalog():
    app, decision_tree = _build_app()
    client = app.test_client()
    imported = json.loads(FIXTURE_PATH.read_text())
    imported["decisionTree"]["requirementId"] = "TST-1"

    response = client.post(
        "/decision-trees/import",
        data={"file": (BytesIO(json.dumps(imported).encode()), "tree.json")},
        content_type="multipart/form-data",
    )

    assert response.status_code == 201
    assert response.get_json()["requirementId"] == "TST-1"
    assert client.get("/decision-trees/TST-1").status_code == 200
    assert any(
        item["requirementId"] == "TST-1" for item in client.get("/decision-trees").get_json()
    )
    assert decision_tree["requirementId"] in [
        item["requirementId"] for item in client.get("/decision-trees").get_json()
    ]


def test_import_decision_tree_accepts_export_json_without_envelope():
    app, decision_tree = _build_app()
    client = app.test_client()

    response = client.post(
        "/decision-trees/import",
        data={"file": (BytesIO(json.dumps(decision_tree).encode()), "tree.json")},
        content_type="multipart/form-data",
    )

    assert response.status_code == 201
    assert response.get_json()["requirementId"] == decision_tree["requirementId"]


def test_import_decision_tree_accepts_csv():
    app, _ = _build_app()
    client = app.test_client()
    csv_payload = """requirementId,requirementName,version,appliesTo,dependencies,rootNode,nodeId,nodeType,nodeText,outcome,branchesYes,branchesNo
TST-2,Imported tree,1.0.0,security,,N1,N1,question,Is it enabled?,,L1,L2
TST-2,Imported tree,1.0.0,security,,N1,L1,leaf,Yes,PASS,,
TST-2,Imported tree,1.0.0,security,,N1,L2,leaf,No,FAIL,,
"""

    response = client.post(
        "/decision-trees/import",
        data={"file": (BytesIO(csv_payload.encode()), "tree.csv")},
        content_type="multipart/form-data",
    )

    assert response.status_code == 201
    assert response.get_json()["requirementId"] == "TST-2"
    assert client.get("/decision-trees/TST-2").get_json()["nodes"][0]["id"] == "N1"


def test_import_decision_tree_rejects_unsupported_format():
    app, _ = _build_app()
    client = app.test_client()

    response = client.post(
        "/decision-trees/import",
        data={"file": (BytesIO(b"content"), "tree.txt")},
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_import_decision_tree_rejects_invalid_structure():
    app, _ = _build_app()
    client = app.test_client()
    invalid = {"decisionTree": {"requirementId": "TST-3", "nodes": []}}

    response = client.post(
        "/decision-trees/import",
        data={"file": (BytesIO(json.dumps(invalid).encode()), "tree.json")},
        content_type="multipart/form-data",
    )

    assert response.status_code == 400
    assert "error" in response.get_json()

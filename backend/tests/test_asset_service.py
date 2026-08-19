import pytest

from src.repositories.decision_tree_repository import IDecisionTreeRepository
from src.services.asset_service import InvalidAssetDataError, create_asset
from src.services.decision_tree_service import DecisionTreeService


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


def _tree(requirement_id, applies_to):
    return {
        "decisionTree": {
            "requirementId": requirement_id,
            "requirementName": requirement_id,
            "appliesTo": applies_to,
            "rootNode": "L1",
            "nodes": [{"id": "L1", "type": "leaf", "outcome": "PASS"}],
        }
    }


@pytest.fixture
def decision_tree_service():
    repository = FakeDecisionTreeRepository(
        {
            "ACM-1": _tree("ACM-1", ["network", "security"]),
            "PRIV-1": _tree("PRIV-1", ["privacy"]),
        }
    )
    return DecisionTreeService(repository)


def _valid_payload(**overrides):
    payload = {
        "name": "Credenziali utente",
        "type": "security",
        "description": "Codici PIN memorizzati sul dispositivo.",
        "sensitive": True,
    }
    payload.update(overrides)
    return payload


def test_create_asset_generates_id_when_absent(decision_tree_service):
    asset = create_asset(_valid_payload(), decision_tree_service)

    assert asset.id
    assert asset.name == "Credenziali utente"
    assert asset.type == "security"
    assert asset.sensitive is True


def test_create_asset_respects_provided_id(decision_tree_service):
    asset = create_asset(_valid_payload(id="AS-02"), decision_tree_service)

    assert asset.id == "AS-02"


def test_create_asset_derives_requirements_from_applies_to_when_absent(decision_tree_service):
    asset = create_asset(_valid_payload(type="security"), decision_tree_service)

    assert asset.requirements == ["ACM-1"]


def test_create_asset_derives_no_requirements_when_no_tree_applies(decision_tree_service):
    asset = create_asset(_valid_payload(type="financial"), decision_tree_service)

    assert asset.requirements == []


def test_create_asset_respects_explicit_requirements(decision_tree_service):
    asset = create_asset(
        _valid_payload(type="security", requirements=["ACM-1", "ACM-2"]), decision_tree_service
    )

    assert asset.requirements == ["ACM-1", "ACM-2"]


def test_create_asset_respects_explicit_empty_requirements(decision_tree_service):
    asset = create_asset(_valid_payload(type="security", requirements=[]), decision_tree_service)

    assert asset.requirements == []


def test_create_asset_missing_name(decision_tree_service):
    payload = _valid_payload()
    del payload["name"]

    with pytest.raises(InvalidAssetDataError):
        create_asset(payload, decision_tree_service)


def test_create_asset_invalid_type(decision_tree_service):
    with pytest.raises(InvalidAssetDataError):
        create_asset(_valid_payload(type="unknown"), decision_tree_service)


def test_create_asset_missing_description(decision_tree_service):
    payload = _valid_payload()
    del payload["description"]

    with pytest.raises(InvalidAssetDataError):
        create_asset(payload, decision_tree_service)


def test_create_asset_missing_sensitive(decision_tree_service):
    payload = _valid_payload()
    del payload["sensitive"]

    with pytest.raises(InvalidAssetDataError):
        create_asset(payload, decision_tree_service)


def test_create_asset_invalid_requirements_type(decision_tree_service):
    with pytest.raises(InvalidAssetDataError):
        create_asset(_valid_payload(requirements="ACM-1"), decision_tree_service)


def test_create_asset_with_non_dict_body(decision_tree_service):
    with pytest.raises(InvalidAssetDataError):
        create_asset(["not", "a", "dict"], decision_tree_service)

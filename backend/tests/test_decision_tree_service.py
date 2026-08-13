import json
from pathlib import Path

import pytest

from src.repositories.decision_tree_repository import IDecisionTreeRepository
from src.services.decision_tree_service import DecisionTreeNotFoundError, DecisionTreeService

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


def test_get_tree_normalizes_nodes_from_repository():
    raw = json.loads(FIXTURE_PATH.read_text())
    requirement_id = raw["decisionTree"]["requirementId"]
    service = DecisionTreeService(FakeDecisionTreeRepository({requirement_id: raw}))

    tree = service.get_tree(requirement_id)

    assert tree.requirement_id == requirement_id
    assert tree.root_node == raw["decisionTree"]["rootNode"]
    assert len(tree.nodes) == len(raw["decisionTree"]["nodes"])


def test_get_tree_raises_when_missing():
    service = DecisionTreeService(FakeDecisionTreeRepository({}))

    with pytest.raises(DecisionTreeNotFoundError):
        service.get_tree("missing")

import json
from pathlib import Path

import pytest

from src.domain.node import NodeOutcome
from src.services.decision_tree_service import normalize_tree

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "sample_decision_tree.json"


def _load_tree():
    raw = json.loads(FIXTURE_PATH.read_text())
    return normalize_tree(raw)


def test_get_node_returns_matching_node():
    tree = _load_tree()

    node = tree.get_node(tree.root_node)

    assert node.id == tree.root_node


def test_get_node_raises_for_unknown_id():
    tree = _load_tree()

    with pytest.raises(KeyError):
        tree.get_node("does-not-exist")


def test_question_node_next_follows_yes_branch():
    tree = _load_tree()
    root = tree.get_node(tree.root_node)

    assert root.next(True) == root.branches.yes


def test_question_node_next_follows_no_branch():
    tree = _load_tree()
    root = tree.get_node(tree.root_node)

    assert root.next(False) == root.branches.no


def test_question_node_has_no_verdict():
    tree = _load_tree()
    root = tree.get_node(tree.root_node)

    assert root.verdict() is None


def test_leaf_node_next_raises():
    tree = _load_tree()
    leaf = tree.get_node("L-PASS-1")

    with pytest.raises(TypeError):
        leaf.next(True)


def test_leaf_node_verdict_returns_outcome():
    tree = _load_tree()
    leaf = tree.get_node("L-PASS-1")

    assert leaf.verdict() == NodeOutcome.PASS


def test_node_outcome_from_string():
    assert NodeOutcome.from_string("PASS") is NodeOutcome.PASS


def test_node_outcome_from_string_rejects_unknown():
    with pytest.raises(ValueError):
        NodeOutcome.from_string("nope")

import json
from pathlib import Path

import pytest

from src.domain.tree_rules import get_node, next_node_id
from src.services.decision_tree_service import normalize_tree

FIXTURE_PATH = Path(__file__).parent / "fixtures" / "sample_decision_tree.json"


def _load_tree():
    raw = json.loads(FIXTURE_PATH.read_text())
    return normalize_tree(raw)


def test_get_node_returns_matching_node():
    tree = _load_tree()

    node = get_node(tree, tree.root_node)

    assert node.id == tree.root_node


def test_get_node_raises_for_unknown_id():
    tree = _load_tree()

    with pytest.raises(KeyError):
        get_node(tree, "does-not-exist")


def test_next_node_id_follows_yes_branch():
    tree = _load_tree()
    root = get_node(tree, tree.root_node)

    assert next_node_id(root, True) == root.branches.yes


def test_next_node_id_follows_no_branch():
    tree = _load_tree()
    root = get_node(tree, tree.root_node)

    assert next_node_id(root, False) == root.branches.no

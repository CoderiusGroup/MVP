import json
from pathlib import Path

import pytest

from src.services.decision_tree_service import normalize_tree

DATA_DIR = Path(__file__).resolve().parent.parent / "data" / "decision_trees"
SEED_FILES = sorted(DATA_DIR.glob("*.json"))


@pytest.mark.parametrize("path", SEED_FILES, ids=lambda path: path.stem)
def test_seed_file_normalizes_without_error(path):
    raw = json.loads(path.read_text())

    tree = normalize_tree(raw)

    assert tree.requirement_id == path.stem


@pytest.mark.parametrize("path", SEED_FILES, ids=lambda path: path.stem)
def test_seed_file_root_node_exists(path):
    raw = json.loads(path.read_text())
    tree = normalize_tree(raw)

    node_ids = {node.id for node in tree.nodes}

    assert tree.root_node in node_ids


@pytest.mark.parametrize("path", SEED_FILES, ids=lambda path: path.stem)
def test_seed_file_has_at_least_one_pass_and_one_fail_leaf(path):
    raw = json.loads(path.read_text())
    tree = normalize_tree(raw)

    outcomes = {node.outcome for node in tree.nodes if node.type == "leaf"}

    assert "PASS" in outcomes
    assert "FAIL" in outcomes


@pytest.mark.parametrize("path", SEED_FILES, ids=lambda path: path.stem)
def test_seed_file_question_branches_point_to_existing_nodes(path):
    raw = json.loads(path.read_text())
    tree = normalize_tree(raw)

    node_ids = {node.id for node in tree.nodes}

    for node in tree.nodes:
        if node.type == "question":
            assert node.branches.yes in node_ids
            assert node.branches.no in node_ids


def test_at_least_the_known_seed_trees_are_present():
    ids = {path.stem for path in SEED_FILES}

    assert {"ACM-1", "ACM-2", "AUM-1-1", "AUM-1-2"}.issubset(ids)

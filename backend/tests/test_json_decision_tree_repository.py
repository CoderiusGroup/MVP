import json

from src.repositories.decision_tree_repository import JsonDecisionTreeRepository

SAMPLE = {
    "schemaVersion": "1.0",
    "kind": "decisionTree",
    "decisionTree": {
        "requirementId": "TST-1",
        "requirementName": "Test requirement",
        "rootNode": "N1",
        "nodes": [{"id": "N1", "type": "leaf", "outcome": "PASS"}],
    },
}


def test_get_returns_none_when_file_is_missing(tmp_path):
    repository = JsonDecisionTreeRepository(tmp_path)

    assert repository.get("does-not-exist") is None


def test_save_then_get_roundtrips_the_full_envelope(tmp_path):
    repository = JsonDecisionTreeRepository(tmp_path)

    repository.save(SAMPLE)

    assert repository.get("TST-1") == SAMPLE
    assert (tmp_path / "TST-1.json").exists()


def test_save_creates_the_data_directory_if_missing(tmp_path):
    repository = JsonDecisionTreeRepository(tmp_path / "nested" / "decision_trees")

    repository.save(SAMPLE)

    assert json.loads((tmp_path / "nested" / "decision_trees" / "TST-1.json").read_text()) == SAMPLE


def test_delete_removes_the_file(tmp_path):
    repository = JsonDecisionTreeRepository(tmp_path)
    repository.save(SAMPLE)

    repository.delete("TST-1")

    assert repository.get("TST-1") is None


def test_delete_is_a_no_op_when_the_file_does_not_exist(tmp_path):
    repository = JsonDecisionTreeRepository(tmp_path)

    repository.delete("does-not-exist")


def test_list_returns_the_requirement_ids_of_stored_trees(tmp_path):
    repository = JsonDecisionTreeRepository(tmp_path)
    repository.save(SAMPLE)
    other = json.loads(json.dumps(SAMPLE))
    other["decisionTree"]["requirementId"] = "TST-2"
    repository.save(other)

    assert sorted(repository.list()) == ["TST-1", "TST-2"]


def test_list_returns_empty_when_the_data_directory_does_not_exist(tmp_path):
    repository = JsonDecisionTreeRepository(tmp_path / "missing")

    assert repository.list() == []

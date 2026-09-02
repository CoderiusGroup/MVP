import pytest

from src.domain.decision_tree_validation import (
    InvalidDecisionTreeError,
    validate_graph,
    validate_raw_tree,
    validate_shape,
)


def _raw() -> dict:
    return {
        "schemaVersion": "1.0",
        "kind": "decisionTree",
        "decisionTree": {
            "requirementId": "ACM-1",
            "requirementName": "Access control",
            "version": "1.0.0",
            "appliesTo": ["network", "security"],
            "dependencies": [],
            "rootNode": "n1",
            "nodes": [
                {
                    "id": "n1",
                    "type": "question",
                    "text": "Q1?",
                    "branches": {"yes": "n2", "no": "n3"},
                },
                {"id": "n2", "type": "leaf", "outcome": "PASS"},
                {"id": "n3", "type": "leaf", "outcome": "FAIL"},
            ],
        },
    }


class TestValidateShape:
    def test_accepts_a_well_formed_tree(self):
        validate_shape(_raw())

    def test_rejects_a_missing_envelope(self):
        with pytest.raises(InvalidDecisionTreeError, match="non contiene un decision tree valido"):
            validate_shape({"foo": "bar"})

    def test_rejects_an_invalid_requirement_id(self):
        raw = _raw()
        raw["decisionTree"]["requirementId"] = "acm1"
        with pytest.raises(InvalidDecisionTreeError, match="Metadati o nodi"):
            validate_shape(raw)

    def test_rejects_an_empty_requirement_name(self):
        raw = _raw()
        raw["decisionTree"]["requirementName"] = "   "
        with pytest.raises(InvalidDecisionTreeError, match="Metadati o nodi"):
            validate_shape(raw)

    def test_rejects_an_empty_node_list(self):
        raw = _raw()
        raw["decisionTree"]["nodes"] = []
        with pytest.raises(InvalidDecisionTreeError, match="Metadati o nodi"):
            validate_shape(raw)

    def test_rejects_a_node_without_id(self):
        raw = _raw()
        raw["decisionTree"]["nodes"].append({"type": "leaf", "outcome": "PASS"})
        with pytest.raises(InvalidDecisionTreeError, match="id valido"):
            validate_shape(raw)

    def test_rejects_a_question_node_without_branches(self):
        raw = _raw()
        del raw["decisionTree"]["nodes"][0]["branches"]
        with pytest.raises(InvalidDecisionTreeError, match="Nodo domanda non valido: n1"):
            validate_shape(raw)

    def test_rejects_a_leaf_with_an_unknown_outcome(self):
        raw = _raw()
        raw["decisionTree"]["nodes"][1]["outcome"] = "MAYBE"
        with pytest.raises(InvalidDecisionTreeError, match="Esito foglia non valido: n2"):
            validate_shape(raw)

    def test_rejects_an_unknown_node_type(self):
        raw = _raw()
        raw["decisionTree"]["nodes"][1]["type"] = "gateway"
        with pytest.raises(InvalidDecisionTreeError, match="Tipo nodo non valido: n2"):
            validate_shape(raw)

    def test_rejects_an_invalid_version(self):
        raw = _raw()
        raw["decisionTree"]["version"] = "v1"
        with pytest.raises(InvalidDecisionTreeError, match="Versione del decision tree"):
            validate_shape(raw)

    def test_rejects_an_unknown_asset_type(self):
        raw = _raw()
        raw["decisionTree"]["appliesTo"] = ["network", "quantum"]
        with pytest.raises(InvalidDecisionTreeError, match="Tipologia asset"):
            validate_shape(raw)

    def test_rejects_non_string_dependencies(self):
        raw = _raw()
        raw["decisionTree"]["dependencies"] = ["ACM-1", 2]
        with pytest.raises(InvalidDecisionTreeError, match="Dipendenze non valide"):
            validate_shape(raw)


class TestValidateGraph:
    def _nodes(self) -> list[dict]:
        return _raw()["decisionTree"]["nodes"]

    def test_accepts_a_connected_acyclic_tree(self):
        validate_graph(self._nodes(), "n1")

    def test_rejects_a_duplicate_node_id(self):
        nodes = self._nodes()
        nodes.append({"id": "n2", "type": "leaf", "outcome": "FAIL"})
        with pytest.raises(InvalidDecisionTreeError, match="Id nodo duplicato: n2"):
            validate_graph(nodes, "n1")

    def test_rejects_a_missing_root(self):
        with pytest.raises(InvalidDecisionTreeError, match="Il nodo radice non esiste"):
            validate_graph(self._nodes(), "n9")

    def test_rejects_a_dangling_branch_reference(self):
        nodes = self._nodes()
        nodes[0]["branches"]["no"] = "ghost"
        with pytest.raises(InvalidDecisionTreeError, match="punta a un nodo inesistente"):
            validate_graph(nodes, "n1")

    def test_rejects_a_cycle(self):
        nodes = [
            {"id": "n1", "type": "question", "text": "Q1?", "branches": {"yes": "n2", "no": "n2"}},
            {"id": "n2", "type": "question", "text": "Q2?", "branches": {"yes": "n1", "no": "n1"}},
        ]
        with pytest.raises(InvalidDecisionTreeError, match="contiene un ciclo"):
            validate_graph(nodes, "n1")

    def test_rejects_an_unreachable_node(self):
        nodes = self._nodes()
        nodes.append({"id": "orphan", "type": "leaf", "outcome": "PASS"})
        with pytest.raises(InvalidDecisionTreeError, match="nodi non raggiungibili"):
            validate_graph(nodes, "n1")


def test_validate_raw_tree_runs_shape_then_graph():
    validate_raw_tree(_raw())

    raw = _raw()
    raw["decisionTree"]["rootNode"] = "missing"
    with pytest.raises(InvalidDecisionTreeError, match="Il nodo radice non esiste"):
        validate_raw_tree(raw)

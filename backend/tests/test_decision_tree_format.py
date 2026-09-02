import pytest

from src.domain.decision_tree_validation import InvalidDecisionTreeError
from src.services.decision_tree_format import (
    CsvDecisionTreeFormat,
    JsonDecisionTreeFormat,
    format_by_name,
    format_for_filename,
    tree_to_dict,
)
from src.services.decision_tree_service import normalize_tree

_CSV_HEADER = (
    "requirementId,requirementName,version,appliesTo,dependencies,rootNode,"
    "nodeId,nodeType,nodeText,outcome,branchesYes,branchesNo"
)

_TREE = {
    "requirementId": "ACM-1",
    "requirementName": "Access control",
    "version": "1.0.0",
    "appliesTo": ["network", "security"],
    "dependencies": [],
    "rootNode": "n1",
    "nodes": [
        {"id": "n1", "type": "question", "text": "Domanda?", "branches": {"yes": "n2", "no": "n3"}},
        {"id": "n2", "type": "leaf", "outcome": "PASS", "text": "Esito PASS"},
        {"id": "n3", "type": "leaf", "outcome": "FAIL"},
    ],
}


def _csv(*rows: str) -> str:
    return "\n".join([_CSV_HEADER, *rows])


class TestFormatSelection:
    def test_format_for_filename_maps_the_extension(self):
        assert isinstance(format_for_filename("tree.json"), JsonDecisionTreeFormat)
        assert isinstance(format_for_filename("TREE.CSV"), CsvDecisionTreeFormat)
        assert format_for_filename("tree.txt") is None

    def test_format_by_name_is_case_insensitive(self):
        assert isinstance(format_by_name("JSON"), JsonDecisionTreeFormat)
        assert isinstance(format_by_name("csv"), CsvDecisionTreeFormat)
        assert format_by_name("xml") is None


class TestJsonFormat:
    def test_parse_keeps_an_already_wrapped_tree(self):
        raw = JsonDecisionTreeFormat().parse('{"decisionTree": {"requirementId": "ACM-1"}}')
        assert raw == {"decisionTree": {"requirementId": "ACM-1"}}

    def test_parse_wraps_a_bare_tree_in_the_envelope(self):
        wrapped = JsonDecisionTreeFormat().parse('{"requirementId": "ACM-1"}')
        assert wrapped["kind"] == "decisionTree"
        assert wrapped["decisionTree"] == {"requirementId": "ACM-1"}

    def test_parse_rejects_malformed_json(self):
        with pytest.raises(InvalidDecisionTreeError, match="non contiene dati validi"):
            JsonDecisionTreeFormat().parse("{not json")

    def test_serialize_round_trips_through_the_domain(self):
        tree = normalize_tree({"decisionTree": _TREE})
        text = JsonDecisionTreeFormat().serialize(tree)

        reparsed = JsonDecisionTreeFormat().parse(text)
        assert reparsed["decisionTree"]["requirementId"] == "ACM-1"
        assert tree_to_dict(normalize_tree(reparsed)) == tree_to_dict(tree)


class TestCsvFormat:
    def test_parse_builds_the_json_envelope(self):
        raw = CsvDecisionTreeFormat().parse(
            _csv(
                "ACM-1,Access control,1.0.0,network;security,,n1,n1,question,Domanda?,,n2,n3",
                "ACM-1,Access control,1.0.0,network;security,,n1,n2,leaf,,PASS,,",
                "ACM-1,Access control,1.0.0,network;security,,n1,n3,leaf,Esito FAIL,FAIL,,",
            )
        )

        tree = raw["decisionTree"]
        assert raw["kind"] == "decisionTree"
        assert tree["requirementId"] == "ACM-1"
        assert tree["appliesTo"] == ["network", "security"]
        assert tree["nodes"][0] == {
            "id": "n1",
            "type": "question",
            "text": "Domanda?",
            "branches": {"yes": "n2", "no": "n3"},
        }
        assert tree["nodes"][1] == {"id": "n2", "type": "leaf", "outcome": "PASS"}
        assert tree["nodes"][2]["text"] == "Esito FAIL"

    def test_parse_rejects_a_wrong_header(self):
        with pytest.raises(InvalidDecisionTreeError, match="Intestazione CSV non valida"):
            CsvDecisionTreeFormat().parse("a,b,c\n1,2,3")

    def test_parse_rejects_a_file_without_node_rows(self):
        with pytest.raises(InvalidDecisionTreeError, match="non contiene nodi"):
            CsvDecisionTreeFormat().parse(_CSV_HEADER)

    def test_parse_rejects_inconsistent_metadata(self):
        with pytest.raises(InvalidDecisionTreeError, match="metadati CSV non sono coerenti"):
            CsvDecisionTreeFormat().parse(
                _csv(
                    "ACM-1,Access control,1.0.0,network,,n1,n1,question,Domanda?,,n2,n3",
                    "ACM-2,Access control,1.0.0,network,,n1,n2,leaf,,PASS,,",
                )
            )

    def test_parse_rejects_an_unknown_node_type(self):
        with pytest.raises(InvalidDecisionTreeError, match="Tipo nodo CSV non valido"):
            CsvDecisionTreeFormat().parse(_csv("ACM-1,Access control,,,,n1,n1,gateway,x,,n2,n3"))

    def test_serialize_round_trips_through_parse(self):
        tree = normalize_tree({"decisionTree": _TREE})
        text = CsvDecisionTreeFormat().serialize(tree)

        assert text.splitlines()[0] == _CSV_HEADER
        reparsed = CsvDecisionTreeFormat().parse(text)["decisionTree"]
        assert reparsed["rootNode"] == "n1"
        assert [node["id"] for node in reparsed["nodes"]] == ["n1", "n2", "n3"]
        assert reparsed["appliesTo"] == ["network", "security"]

import pytest

from src.domain.decision_tree_validation import InvalidDecisionTreeError
from src.services.decision_tree_csv import tree_from_csv

_HEADER = (
    "requirementId,requirementName,version,appliesTo,dependencies,rootNode,"
    "nodeId,nodeType,nodeText,outcome,branchesYes,branchesNo"
)


def _csv(*rows: str) -> str:
    return "\n".join([_HEADER, *rows])


def test_parses_a_valid_csv_into_the_json_envelope():
    content = _csv(
        "ACM-1,Access control,1.0.0,network;security,,n1,n1,question,Domanda?,,n2,n3",
        "ACM-1,Access control,1.0.0,network;security,,n1,n2,leaf,,PASS,,",
        "ACM-1,Access control,1.0.0,network;security,,n1,n3,leaf,Esito FAIL,FAIL,,",
    )

    raw = tree_from_csv(content)

    tree = raw["decisionTree"]
    assert raw["kind"] == "decisionTree"
    assert tree["requirementId"] == "ACM-1"
    assert tree["appliesTo"] == ["network", "security"]
    assert tree["version"] == "1.0.0"
    assert tree["nodes"][0] == {
        "id": "n1",
        "type": "question",
        "text": "Domanda?",
        "branches": {"yes": "n2", "no": "n3"},
    }
    assert tree["nodes"][1] == {"id": "n2", "type": "leaf", "outcome": "PASS"}
    assert tree["nodes"][2]["text"] == "Esito FAIL"


def test_rejects_a_wrong_header():
    with pytest.raises(InvalidDecisionTreeError, match="Intestazione CSV non valida"):
        tree_from_csv("a,b,c\n1,2,3")


def test_rejects_a_file_without_node_rows():
    with pytest.raises(InvalidDecisionTreeError, match="non contiene nodi"):
        tree_from_csv(_HEADER)


def test_rejects_inconsistent_metadata_between_rows():
    content = _csv(
        "ACM-1,Access control,1.0.0,network,,n1,n1,question,Domanda?,,n2,n3",
        "ACM-2,Access control,1.0.0,network,,n1,n2,leaf,,PASS,,",
    )
    with pytest.raises(InvalidDecisionTreeError, match="metadati CSV non sono coerenti"):
        tree_from_csv(content)


def test_rejects_an_unknown_node_type():
    content = _csv("ACM-1,Access control,,,,n1,n1,gateway,x,,n2,n3")
    with pytest.raises(InvalidDecisionTreeError, match="Tipo nodo CSV non valido"):
        tree_from_csv(content)

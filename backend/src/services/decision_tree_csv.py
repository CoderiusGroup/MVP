from __future__ import annotations

import csv
import io

from src.domain.decision_tree_validation import InvalidDecisionTreeError

_REQUIRED_FIELDS = {
    "requirementId",
    "requirementName",
    "version",
    "appliesTo",
    "dependencies",
    "rootNode",
    "nodeId",
    "nodeType",
    "nodeText",
    "outcome",
    "branchesYes",
    "branchesNo",
}

_METADATA_FIELDS = (
    "requirementId",
    "requirementName",
    "version",
    "appliesTo",
    "dependencies",
    "rootNode",
)


def _split_csv_values(value: str) -> list[str]:
    return [item for item in value.split(";") if item]


def tree_from_csv(content: str) -> dict:
    try:
        reader = csv.DictReader(io.StringIO(content))
        fieldnames = reader.fieldnames
        rows = list(reader)
    except csv.Error as error:
        raise InvalidDecisionTreeError("Il file non contiene dati validi") from error

    if not fieldnames or not _REQUIRED_FIELDS.issubset(fieldnames):
        raise InvalidDecisionTreeError("Intestazione CSV non valida")
    if not rows:
        raise InvalidDecisionTreeError("Il file CSV non contiene nodi")

    first = rows[0]
    for row in rows[1:]:
        if any(row[field] != first[field] for field in _METADATA_FIELDS):
            raise InvalidDecisionTreeError("I metadati CSV non sono coerenti")

    nodes = []
    for row in rows:
        node_type = row["nodeType"]
        node = {"id": row["nodeId"], "type": node_type}
        if node_type == "question":
            node["text"] = row["nodeText"]
            node["branches"] = {"yes": row["branchesYes"], "no": row["branchesNo"]}
        elif node_type == "leaf":
            node["outcome"] = row["outcome"]
            if row["nodeText"]:
                node["text"] = row["nodeText"]
        else:
            raise InvalidDecisionTreeError("Tipo nodo CSV non valido")
        nodes.append(node)

    tree = {
        "requirementId": first["requirementId"],
        "requirementName": first["requirementName"],
        "rootNode": first["rootNode"],
        "nodes": nodes,
        "version": first["version"] or None,
        "appliesTo": _split_csv_values(first["appliesTo"]),
        "dependencies": _split_csv_values(first["dependencies"]),
    }
    return {"schemaVersion": "1.0", "kind": "decisionTree", "decisionTree": tree}

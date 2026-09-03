from __future__ import annotations

import csv
import io
import json
from abc import ABC, abstractmethod

from src.domain.decision_tree import DecisionTree
from src.domain.decision_tree_validation import InvalidDecisionTreeError
from src.domain.node import QuestionNode

_ENVELOPE = {"schemaVersion": "1.0", "kind": "decisionTree"}

_CSV_HEADER = [
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
]
_CSV_REQUIRED_FIELDS = set(_CSV_HEADER)
_CSV_METADATA_FIELDS = (
    "requirementId",
    "requirementName",
    "version",
    "appliesTo",
    "dependencies",
    "rootNode",
)


def _node_to_dict(node) -> dict:
    if isinstance(node, QuestionNode):
        return {
            "id": node.id,
            "type": "question",
            "text": node.text,
            "branches": {"yes": node.branches.yes, "no": node.branches.no},
        }
    body = {"id": node.id, "type": "leaf", "outcome": node.outcome}
    if node.text is not None:
        body["text"] = node.text
    return body


def tree_to_dict(tree: DecisionTree) -> dict:
    body = {
        "requirementId": tree.requirement_id,
        "requirementName": tree.requirement_name,
        "rootNode": tree.root_node,
        "nodes": [_node_to_dict(node) for node in tree.nodes],
    }
    if tree.version is not None:
        body["version"] = tree.version
    if tree.applies_to:
        body["appliesTo"] = tree.applies_to
    if tree.dependencies:
        body["dependencies"] = tree.dependencies
    return body


def _split_csv_values(value: str) -> list[str]:
    return [item for item in value.split(";") if item]


class DecisionTreeFormat(ABC):
    extension: str
    mime_type: str

    @abstractmethod
    def parse(self, text: str) -> dict: ...

    @abstractmethod
    def serialize(self, tree: DecisionTree) -> str: ...


class JsonDecisionTreeFormat(DecisionTreeFormat):
    extension = "json"
    mime_type = "application/json"

    def parse(self, text: str) -> dict:
        try:
            raw = json.loads(text)
        except json.JSONDecodeError as error:
            raise InvalidDecisionTreeError("Il file non contiene dati validi") from error
        if isinstance(raw, dict) and "decisionTree" not in raw:
            return {**_ENVELOPE, "decisionTree": raw}
        return raw

    def serialize(self, tree: DecisionTree) -> str:
        return json.dumps(tree_to_dict(tree), indent=2)


class CsvDecisionTreeFormat(DecisionTreeFormat):
    extension = "csv"
    mime_type = "text/csv"

    def parse(self, text: str) -> dict:
        try:
            reader = csv.DictReader(io.StringIO(text))
            fieldnames = reader.fieldnames
            rows = list(reader)
        except csv.Error as error:
            raise InvalidDecisionTreeError("Il file non contiene dati validi") from error

        if not fieldnames or not _CSV_REQUIRED_FIELDS.issubset(fieldnames):
            raise InvalidDecisionTreeError("Intestazione CSV non valida")
        if not rows:
            raise InvalidDecisionTreeError("Il file CSV non contiene nodi")

        first = rows[0]
        for row in rows[1:]:
            if any(row[field] != first[field] for field in _CSV_METADATA_FIELDS):
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
        return {**_ENVELOPE, "decisionTree": tree}

    def serialize(self, tree: DecisionTree) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(_CSV_HEADER)
        for node in tree.nodes:
            writer.writerow(
                [
                    tree.requirement_id,
                    tree.requirement_name,
                    tree.version or "",
                    ";".join(tree.applies_to),
                    ";".join(tree.dependencies),
                    tree.root_node,
                    node.id,
                    node.type,
                    getattr(node, "text", "") or "",
                    getattr(node, "outcome", "") or "",
                    getattr(getattr(node, "branches", None), "yes", "") or "",
                    getattr(getattr(node, "branches", None), "no", "") or "",
                ]
            )
        return output.getvalue()


_FORMATS: dict[str, DecisionTreeFormat] = {
    "json": JsonDecisionTreeFormat(),
    "csv": CsvDecisionTreeFormat(),
}


def format_by_name(name: str) -> DecisionTreeFormat | None:
    return _FORMATS.get(name.lower())


def format_for_filename(filename: str) -> DecisionTreeFormat | None:
    lowered = filename.lower()
    for fmt in _FORMATS.values():
        if lowered.endswith(f".{fmt.extension}"):
            return fmt
    return None

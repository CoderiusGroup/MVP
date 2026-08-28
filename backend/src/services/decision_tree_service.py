from __future__ import annotations

import csv
import io
import json
import re

from src.domain.decision_tree import DecisionTree
from src.domain.node import Branches, LeafNode, Node, QuestionNode
from src.repositories.decision_tree_repository import IDecisionTreeRepository


class DecisionTreeNotFoundError(Exception):
    pass


class InvalidDecisionTreeError(Exception):
    pass


REQUIREMENT_ID_PATTERN = re.compile(r"^[A-Z]{2,4}(-[A-Za-z0-9]+)+$")
ASSET_TYPES = {"network", "security", "privacy", "financial"}
OUTCOMES = {"PASS", "FAIL", "NOT_APPLICABLE"}


def _normalize_node(raw: dict) -> Node:
    if raw["type"] == "question":
        branches = raw["branches"]
        return QuestionNode(
            id=raw["id"],
            type="question",
            text=raw["text"],
            branches=Branches(yes=branches["yes"], no=branches["no"]),
        )
    return LeafNode(
        id=raw["id"],
        type="leaf",
        outcome=raw["outcome"],
        text=raw.get("text"),
    )


def normalize_tree(raw: dict) -> DecisionTree:
    decision_tree = raw["decisionTree"]
    return DecisionTree(
        requirement_id=decision_tree["requirementId"],
        requirement_name=decision_tree["requirementName"],
        root_node=decision_tree["rootNode"],
        nodes=[_normalize_node(node) for node in decision_tree["nodes"]],
        version=decision_tree.get("version"),
        applies_to=decision_tree.get("appliesTo", []),
        dependencies=decision_tree.get("dependencies", []),
    )


def _split_csv_values(value: str) -> list[str]:
    return [item for item in value.split(";") if item]


def _validate_raw_tree(raw: dict) -> None:
    if not isinstance(raw, dict) or not isinstance(raw.get("decisionTree"), dict):
        raise InvalidDecisionTreeError("Il file non contiene un decision tree valido")

    tree = raw["decisionTree"]
    requirement_id = tree.get("requirementId")
    requirement_name = tree.get("requirementName")
    root_node = tree.get("rootNode")
    nodes = tree.get("nodes")
    if (
        not isinstance(requirement_id, str)
        or not REQUIREMENT_ID_PATTERN.fullmatch(requirement_id)
        or not isinstance(requirement_name, str)
        or not requirement_name.strip()
        or not isinstance(root_node, str)
        or not isinstance(nodes, list)
        or not nodes
    ):
        raise InvalidDecisionTreeError("Metadati o nodi del decision tree non validi")

    node_by_id = {}
    for node in nodes:
        if not isinstance(node, dict) or not isinstance(node.get("id"), str):
            raise InvalidDecisionTreeError("Ogni nodo deve avere un id valido")
        node_id = node["id"]
        if node_id in node_by_id:
            raise InvalidDecisionTreeError(f"Id nodo duplicato: {node_id}")
        node_by_id[node_id] = node
        if node.get("type") == "question":
            branches = node.get("branches")
            if (
                not isinstance(node.get("text"), str)
                or not node["text"].strip()
                or not isinstance(branches, dict)
                or not isinstance(branches.get("yes"), str)
                or not isinstance(branches.get("no"), str)
            ):
                raise InvalidDecisionTreeError(f"Nodo domanda non valido: {node_id}")
        elif node.get("type") == "leaf":
            if node.get("outcome") not in OUTCOMES:
                raise InvalidDecisionTreeError(f"Esito foglia non valido: {node_id}")
            if "text" in node and not isinstance(node["text"], str):
                raise InvalidDecisionTreeError(f"Testo foglia non valido: {node_id}")
        else:
            raise InvalidDecisionTreeError(f"Tipo nodo non valido: {node_id}")

    if root_node not in node_by_id:
        raise InvalidDecisionTreeError("Il nodo radice non esiste")

    for node in nodes:
        if node["type"] == "question":
            for branch in ("yes", "no"):
                if node["branches"][branch] not in node_by_id:
                    raise InvalidDecisionTreeError("Un collegamento punta a un nodo inesistente")

    visiting = set()
    visited = set()

    def visit(node_id: str) -> None:
        if node_id in visiting:
            raise InvalidDecisionTreeError("Il decision tree contiene un ciclo")
        if node_id in visited:
            return
        visiting.add(node_id)
        node = node_by_id[node_id]
        if node["type"] == "question":
            visit(node["branches"]["yes"])
            visit(node["branches"]["no"])
        visiting.remove(node_id)
        visited.add(node_id)

    visit(root_node)
    if visited != set(node_by_id):
        raise InvalidDecisionTreeError("Il decision tree contiene nodi non raggiungibili")

    version = tree.get("version")
    if version is not None and (
        not isinstance(version, str) or not re.fullmatch(r"\d+\.\d+\.\d+", version)
    ):
        raise InvalidDecisionTreeError("Versione del decision tree non valida")
    applies_to = tree.get("appliesTo", [])
    dependencies = tree.get("dependencies", [])
    if not isinstance(applies_to, list) or any(item not in ASSET_TYPES for item in applies_to):
        raise InvalidDecisionTreeError("Tipologia asset non valida")
    if not isinstance(dependencies, list) or any(
        not isinstance(item, str) for item in dependencies
    ):
        raise InvalidDecisionTreeError("Dipendenze non valide")


def _tree_from_csv(content: str) -> dict:
    reader = csv.DictReader(io.StringIO(content))
    required_fields = {
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
    if not reader.fieldnames or not required_fields.issubset(reader.fieldnames):
        raise InvalidDecisionTreeError("Intestazione CSV non valida")

    rows = list(reader)
    if not rows:
        raise InvalidDecisionTreeError("Il file CSV non contiene nodi")
    first = rows[0]
    metadata_fields = (
        "requirementId",
        "requirementName",
        "version",
        "appliesTo",
        "dependencies",
        "rootNode",
    )
    for row in rows[1:]:
        if any(row[field] != first[field] for field in metadata_fields):
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


class DecisionTreeService:
    def __init__(self, repository: IDecisionTreeRepository) -> None:
        self._repository = repository

    def get_tree(self, requirement_id: str) -> DecisionTree:
        raw = self._repository.get(requirement_id)
        if raw is None:
            raise DecisionTreeNotFoundError(requirement_id)
        return normalize_tree(raw)

    def list_trees(self) -> list[dict[str, str]]:
        trees = []
        for tree_id in sorted(self._repository.list()):
            tree = self.get_tree(tree_id)
            trees.append(
                {
                    "requirementId": tree.requirement_id,
                    "requirementName": tree.requirement_name,
                }
            )
        return trees

    def list_requirement_ids_for_type(self, asset_type: str) -> list[str]:
        requirement_ids = []
        for tree_id in self._repository.list():
            tree = self.get_tree(tree_id)
            if asset_type in tree.applies_to:
                requirement_ids.append(tree.requirement_id)
        return requirement_ids

    def import_tree(self, content: bytes, filename: str) -> DecisionTree:
        try:
            text = content.decode("utf-8-sig")
            if filename.lower().endswith(".json"):
                raw = json.loads(text)
                if isinstance(raw, dict) and "decisionTree" not in raw:
                    raw = {"schemaVersion": "1.0", "kind": "decisionTree", "decisionTree": raw}
            elif filename.lower().endswith(".csv"):
                raw = _tree_from_csv(text)
            else:
                raise InvalidDecisionTreeError("Formato non supportato: usare JSON o CSV")
        except (UnicodeDecodeError, json.JSONDecodeError, csv.Error) as error:
            raise InvalidDecisionTreeError("Il file non contiene dati validi") from error

        _validate_raw_tree(raw)
        self._repository.save(raw)
        return normalize_tree(raw)

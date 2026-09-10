from __future__ import annotations

import re

REQUIREMENT_ID_PATTERN = re.compile(r"^[A-Z]{2,4}(-[A-Za-z0-9]+)+$")
VERSION_PATTERN = re.compile(r"\d+\.\d+\.\d+")
ASSET_TYPES = {"network", "security", "privacy", "financial"}
OUTCOMES = {"PASS", "FAIL", "NOT_APPLICABLE"}


class InvalidDecisionTreeError(Exception):
    pass


def validate_shape(raw: object) -> None:
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

    for node in nodes:
        if not isinstance(node, dict) or not isinstance(node.get("id"), str):
            raise InvalidDecisionTreeError("Ogni nodo deve avere un id valido")
        node_id = node["id"]
        node_type = node.get("type")
        if node_type == "question":
            branches = node.get("branches")
            if (
                not isinstance(node.get("text"), str)
                or not node["text"].strip()
                or not isinstance(branches, dict)
                or not isinstance(branches.get("yes"), str)
                or not isinstance(branches.get("no"), str)
            ):
                raise InvalidDecisionTreeError(f"Nodo domanda non valido: {node_id}")
        elif node_type == "leaf":
            if node.get("outcome") not in OUTCOMES:
                raise InvalidDecisionTreeError(f"Esito foglia non valido: {node_id}")
            if "text" in node and not isinstance(node["text"], str):
                raise InvalidDecisionTreeError(f"Testo foglia non valido: {node_id}")
        else:
            raise InvalidDecisionTreeError(f"Tipo nodo non valido: {node_id}")

    version = tree.get("version")
    if version is not None and (
        not isinstance(version, str) or not VERSION_PATTERN.fullmatch(version)
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


def validate_graph(nodes: list[dict], root_node: str) -> None:
    node_by_id: dict[str, dict] = {}
    for node in nodes:
        node_id = node["id"]
        if node_id in node_by_id:
            raise InvalidDecisionTreeError(f"Id nodo duplicato: {node_id}")
        node_by_id[node_id] = node

    if root_node not in node_by_id:
        raise InvalidDecisionTreeError("Il nodo radice non esiste")

    for node in nodes:
        if node["type"] == "question":
            for branch in ("yes", "no"):
                if node["branches"][branch] not in node_by_id:
                    raise InvalidDecisionTreeError("Un collegamento punta a un nodo inesistente")

    visiting: set[str] = set()
    visited: set[str] = set()

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


def validate_raw_tree(raw: object) -> None:
    validate_shape(raw)
    tree = raw["decisionTree"]
    validate_graph(tree["nodes"], tree["rootNode"])

from __future__ import annotations

import json

from src.domain.decision_tree import DecisionTree
from src.domain.decision_tree_validation import InvalidDecisionTreeError, validate_raw_tree
from src.domain.node import Branches, LeafNode, Node, QuestionNode
from src.repositories.decision_tree_repository import IDecisionTreeRepository
from src.services.decision_tree_csv import tree_from_csv

__all__ = [
    "DecisionTreeNotFoundError",
    "DecisionTreeService",
    "InvalidDecisionTreeError",
    "normalize_tree",
]


class DecisionTreeNotFoundError(Exception):
    pass


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


class DecisionTreeService:
    def __init__(self, repository: IDecisionTreeRepository) -> None:
        self._repository = repository

    def get_tree(self, requirement_id: str) -> DecisionTree:
        raw = self._repository.get(requirement_id)
        if raw is None:
            raise DecisionTreeNotFoundError(requirement_id)
        return normalize_tree(raw)

    def delete_tree(self, requirement_id: str) -> None:
        if self._repository.get(requirement_id) is None:
            raise DecisionTreeNotFoundError(requirement_id)
        self._repository.delete(requirement_id)

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

    def import_tree(self, content: bytes, filename: str) -> tuple[DecisionTree, str]:
        try:
            text = content.decode("utf-8-sig")
        except UnicodeDecodeError as error:
            raise InvalidDecisionTreeError("Il file non contiene dati validi") from error

        lowered = filename.lower()
        if lowered.endswith(".json"):
            try:
                raw = json.loads(text)
            except json.JSONDecodeError as error:
                raise InvalidDecisionTreeError("Il file non contiene dati validi") from error
            if isinstance(raw, dict) and "decisionTree" not in raw:
                raw = {"schemaVersion": "1.0", "kind": "decisionTree", "decisionTree": raw}
        elif lowered.endswith(".csv"):
            raw = tree_from_csv(text)
        else:
            raise InvalidDecisionTreeError("Formato non supportato: usare JSON o CSV")

        validate_raw_tree(raw)
        requirement_id = raw["decisionTree"]["requirementId"]
        message = (
            "Decision Tree presente e aggiornato"
            if self._repository.get(requirement_id) is not None
            else "Decision Tree importato correttamente"
        )
        self._repository.save(raw)
        return normalize_tree(raw), message

from __future__ import annotations

from src.domain.decision_tree import DecisionTree
from src.domain.node import Branches, LeafNode, Node, QuestionNode
from src.repositories.decision_tree_repository import IDecisionTreeRepository


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

    def list_requirement_ids_for_type(self, asset_type: str) -> list[str]:
        requirement_ids = []
        for tree_id in self._repository.list():
            tree = self.get_tree(tree_id)
            if asset_type in tree.applies_to:
                requirement_ids.append(tree.requirement_id)
        return requirement_ids

from __future__ import annotations

from src.domain.decision_tree import DecisionTree
from src.domain.node import Node, QuestionNode


def get_node(tree: DecisionTree, node_id: str) -> Node:
    for node in tree.nodes:
        if node.id == node_id:
            return node
    raise KeyError(f"node {node_id!r} not found in tree {tree.requirement_id!r}")


def next_node_id(node: QuestionNode, answer: bool) -> str:
    return node.branches.yes if answer else node.branches.no

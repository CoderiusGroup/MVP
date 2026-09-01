from __future__ import annotations

from dataclasses import dataclass, field

from src.domain.node import Node


@dataclass(frozen=True)
class DecisionTree:
    requirement_id: str
    requirement_name: str
    root_node: str
    nodes: list[Node]
    version: str | None = None
    applies_to: list[str] = field(default_factory=list)
    dependencies: list[str] = field(default_factory=list)

    def get_node(self, node_id: str) -> Node:
        for node in self.nodes:
            if node.id == node_id:
                return node
        raise KeyError(f"node {node_id!r} not found in tree {self.requirement_id!r}")

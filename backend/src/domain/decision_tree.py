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

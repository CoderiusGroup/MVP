from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

from src.domain.device import Device
from src.domain.node import NodeOutcome

EvaluationStatus = Literal["not_evaluated", "in_progress", "completed"]
SessionStatus = Literal["in_progress", "completed"]
Answer = Literal["yes", "no"]


@dataclass(frozen=True)
class PathStep:
    node_id: str
    answer: Answer


@dataclass(frozen=True)
class Evaluation:
    asset_id: str
    requirement_id: str
    status: EvaluationStatus
    outcome: NodeOutcome | None = None
    justification: str | None = None
    path: list[PathStep] = field(default_factory=list)


@dataclass(frozen=True)
class Current:
    asset_id: str
    requirement_id: str
    node_id: str


@dataclass(frozen=True)
class Session:
    id: str
    saved_at: str
    status: SessionStatus
    device: Device
    evaluations: list[Evaluation] = field(default_factory=list)
    decision_tree_versions: dict[str, str] = field(default_factory=dict)
    current: Current | None = None

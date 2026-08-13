from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

NodeOutcome = Literal["PASS", "FAIL", "NOT_APPLICABLE"]


@dataclass(frozen=True)
class Branches:
    yes: str
    no: str


@dataclass(frozen=True)
class QuestionNode:
    id: str
    type: Literal["question"]
    text: str
    branches: Branches


@dataclass(frozen=True)
class LeafNode:
    id: str
    type: Literal["leaf"]
    outcome: NodeOutcome
    text: str | None = None


Node = QuestionNode | LeafNode

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from enum import Enum


class NodeOutcome(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    NOT_APPLICABLE = "NOT_APPLICABLE"

    @classmethod
    def from_string(cls, value: str) -> NodeOutcome:
        for member in cls:
            if member.value == value:
                return member
        raise ValueError(f"Unknown node outcome: {value}")


@dataclass(frozen=True)
class Branches:
    yes: str
    no: str


class Node(ABC):
    @property
    @abstractmethod
    def id(self) -> str: ...

    @abstractmethod
    def next(self, answer: bool) -> str: ...

    @abstractmethod
    def verdict(self) -> NodeOutcome | None: ...


@dataclass(frozen=True, init=False)
class QuestionNode(Node):
    _id: str
    _text: str
    _branches: Branches

    def __init__(self, id: str, text: str, branches: Branches, type: str = "question") -> None:
        object.__setattr__(self, "_id", id)
        object.__setattr__(self, "_text", text)
        object.__setattr__(self, "_branches", branches)

    @property
    def id(self) -> str:
        return self._id

    @property
    def type(self) -> str:
        return "question"

    @property
    def text(self) -> str:
        return self._text

    @property
    def branches(self) -> Branches:
        return self._branches

    def next(self, answer: bool) -> str:
        return self._branches.yes if answer else self._branches.no

    def verdict(self) -> NodeOutcome | None:
        return None


@dataclass(frozen=True, init=False)
class LeafNode(Node):
    _id: str
    _outcome: NodeOutcome
    _text: str | None

    def __init__(
        self, id: str, outcome: NodeOutcome | str, text: str | None = None, type: str = "leaf"
    ) -> None:
        object.__setattr__(self, "_id", id)
        object.__setattr__(self, "_outcome", NodeOutcome.from_string(outcome))
        object.__setattr__(self, "_text", text)

    @property
    def id(self) -> str:
        return self._id

    @property
    def type(self) -> str:
        return "leaf"

    @property
    def outcome(self) -> NodeOutcome:
        return self._outcome

    @property
    def text(self) -> str | None:
        return self._text

    def next(self, answer: bool) -> str:
        raise TypeError("un nodo foglia non ha un nodo successivo")

    def verdict(self) -> NodeOutcome | None:
        return self._outcome

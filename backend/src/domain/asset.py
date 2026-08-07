from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

AssetType = Literal["network", "security", "privacy", "financial"]


@dataclass(frozen=True)
class Asset:
    id: str
    name: str
    type: AssetType
    description: str
    sensitive: bool
    requirements: list[str] = field(default_factory=list)

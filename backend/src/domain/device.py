from __future__ import annotations

from dataclasses import dataclass, field

from src.domain.asset import Asset


@dataclass(frozen=True)
class Device:
    id: str
    name: str
    operating_system: str
    description: str
    assets: list[Asset] = field(default_factory=list)

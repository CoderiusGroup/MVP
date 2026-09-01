from __future__ import annotations

import uuid
from dataclasses import dataclass

from src.domain.asset import Asset


class InvalidDeviceDataError(Exception):
    pass


@dataclass(frozen=True, init=False)
class Device:
    _id: str
    _name: str
    _operating_system: str
    _description: str
    _assets: list[Asset]

    def __init__(
        self,
        id: str,
        name: str,
        operating_system: str,
        description: str,
        assets: list[Asset] | None = None,
    ) -> None:
        object.__setattr__(self, "_id", id)
        object.__setattr__(self, "_name", name)
        object.__setattr__(self, "_operating_system", operating_system)
        object.__setattr__(self, "_description", description)
        object.__setattr__(self, "_assets", list(assets) if assets is not None else [])

    @property
    def id(self) -> str:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def operating_system(self) -> str:
        return self._operating_system

    @property
    def description(self) -> str:
        return self._description

    @property
    def assets(self) -> list[Asset]:
        return list(self._assets)

    @classmethod
    def create(cls, data: object) -> Device:
        if not isinstance(data, dict):
            raise InvalidDeviceDataError("Corpo della richiesta non valido")

        name = data.get("name")
        if not name:
            raise InvalidDeviceDataError("Campo name richiesto")

        operating_system = data.get("operatingSystem")
        if not operating_system:
            raise InvalidDeviceDataError("Campo operatingSystem richiesto")

        description = data.get("description")
        if not description:
            raise InvalidDeviceDataError("Campo description richiesto")

        device_id = data.get("id") or str(uuid.uuid4())

        return cls(
            id=device_id,
            name=name,
            operating_system=operating_system,
            description=description,
            assets=[],
        )

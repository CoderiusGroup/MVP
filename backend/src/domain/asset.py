from __future__ import annotations

import uuid
from dataclasses import dataclass
from enum import Enum


class InvalidAssetDataError(Exception):
    pass


class AssetType(str, Enum):
    NETWORK = "network"
    SECURITY = "security"
    PRIVACY = "privacy"
    FINANCIAL = "financial"

    @classmethod
    def from_string(cls, value: str) -> AssetType:
        for member in cls:
            if member.value == value:
                return member
        raise ValueError(f"Unknown asset type: {value}")


@dataclass(frozen=True, init=False)
class Asset:
    _id: str
    _name: str
    _type: AssetType
    _description: str
    _sensitive: bool
    _requirements: list[str]

    def __init__(
        self,
        id: str,
        name: str,
        type: AssetType | str,
        description: str,
        sensitive: bool,
        requirements: list[str] | None = None,
    ) -> None:
        object.__setattr__(self, "_id", id)
        object.__setattr__(self, "_name", name)
        object.__setattr__(self, "_type", AssetType.from_string(type))
        object.__setattr__(self, "_description", description)
        object.__setattr__(self, "_sensitive", sensitive)
        object.__setattr__(
            self, "_requirements", list(requirements) if requirements is not None else []
        )

    @property
    def id(self) -> str:
        return self._id

    @property
    def name(self) -> str:
        return self._name

    @property
    def type(self) -> AssetType:
        return self._type

    @property
    def description(self) -> str:
        return self._description

    @property
    def sensitive(self) -> bool:
        return self._sensitive

    @property
    def requirements(self) -> list[str]:
        return list(self._requirements)

    @classmethod
    def create(cls, data: object) -> Asset:
        if not isinstance(data, dict):
            raise InvalidAssetDataError("Corpo della richiesta non valido")

        name = data.get("name")
        if not name:
            raise InvalidAssetDataError("Campo name richiesto")

        asset_type_raw = data.get("type")
        try:
            asset_type = AssetType.from_string(asset_type_raw) if asset_type_raw else None
        except ValueError:
            asset_type = None
        if asset_type is None:
            raise InvalidAssetDataError("Campo type non valido")

        description = data.get("description")
        if not description:
            raise InvalidAssetDataError("Campo description richiesto")

        sensitive = data.get("sensitive")
        if not isinstance(sensitive, bool):
            raise InvalidAssetDataError("Campo sensitive richiesto")

        requirements = data.get("requirements")
        if requirements is not None and (
            not isinstance(requirements, list) or not all(isinstance(item, str) for item in requirements)
        ):
            raise InvalidAssetDataError("Campo requirements non valido")

        asset_id = data.get("id") or str(uuid.uuid4())

        return cls(
            id=asset_id,
            name=name,
            type=asset_type,
            description=description,
            sensitive=sensitive,
            requirements=requirements if requirements is not None else [],
        )

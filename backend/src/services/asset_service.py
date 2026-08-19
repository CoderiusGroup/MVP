from __future__ import annotations

import uuid

from src.domain.asset import Asset
from src.services.decision_tree_service import DecisionTreeService

ASSET_TYPES = {"network", "security", "privacy", "financial"}


class InvalidAssetDataError(Exception):
    pass


def create_asset(data: object, decision_tree_service: DecisionTreeService) -> Asset:
    if not isinstance(data, dict):
        raise InvalidAssetDataError("Corpo della richiesta non valido")

    name = data.get("name")
    if not name:
        raise InvalidAssetDataError("Campo name richiesto")

    asset_type = data.get("type")
    if asset_type not in ASSET_TYPES:
        raise InvalidAssetDataError("Campo type non valido")

    description = data.get("description")
    if not description:
        raise InvalidAssetDataError("Campo description richiesto")

    sensitive = data.get("sensitive")
    if not isinstance(sensitive, bool):
        raise InvalidAssetDataError("Campo sensitive richiesto")

    requirements = data.get("requirements")
    if requirements is None:
        requirements = decision_tree_service.list_requirement_ids_for_type(asset_type)
    elif not isinstance(requirements, list) or not all(
        isinstance(item, str) for item in requirements
    ):
        raise InvalidAssetDataError("Campo requirements non valido")

    asset_id = data.get("id") or str(uuid.uuid4())

    return Asset(
        id=asset_id,
        name=name,
        type=asset_type,
        description=description,
        sensitive=sensitive,
        requirements=requirements,
    )

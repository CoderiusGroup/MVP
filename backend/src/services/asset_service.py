from __future__ import annotations

from src.domain.asset import Asset, InvalidAssetDataError
from src.services.decision_tree_service import DecisionTreeService

__all__ = ["InvalidAssetDataError", "create_asset"]


def create_asset(data: object, decision_tree_service: DecisionTreeService) -> Asset:
    if (
        isinstance(data, dict)
        and data.get("requirements") is None
        and isinstance(data.get("type"), str)
    ):
        data = {
            **data,
            "requirements": decision_tree_service.list_requirement_ids_for_type(data["type"]),
        }

    return Asset.create(data)

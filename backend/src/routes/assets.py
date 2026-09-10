from __future__ import annotations

from flask import Blueprint, jsonify, request

from src.domain.asset import Asset
from src.services.asset_service import InvalidAssetDataError, create_asset
from src.services.decision_tree_service import DecisionTreeService


def _serialize_asset(asset: Asset) -> dict:
    return {
        "id": asset.id,
        "name": asset.name,
        "type": asset.type,
        "description": asset.description,
        "sensitive": asset.sensitive,
        "requirements": asset.requirements,
    }


def create_assets_blueprint(decision_tree_service: DecisionTreeService) -> Blueprint:
    blueprint = Blueprint("assets", __name__)

    @blueprint.post("/assets")
    def create_asset_route():
        data = request.get_json(silent=True)

        try:
            asset = create_asset(data, decision_tree_service)
        except InvalidAssetDataError as exc:
            return jsonify({"error": str(exc)}), 400

        return jsonify(_serialize_asset(asset)), 201

    return blueprint

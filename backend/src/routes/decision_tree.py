from __future__ import annotations

from flask import Blueprint, Response, jsonify, request

from src.services.decision_tree_format import format_by_name, tree_to_dict
from src.services.decision_tree_service import (
    DecisionTreeNotFoundError,
    DecisionTreeService,
    InvalidDecisionTreeError,
)


def create_decision_tree_blueprint(service: DecisionTreeService) -> Blueprint:
    blueprint = Blueprint("decision_trees", __name__)

    @blueprint.get("/decision-trees")
    def list_decision_trees():
        return jsonify(service.list_trees())

    @blueprint.post("/decision-trees/import")
    def import_decision_tree():
        uploaded_file = request.files.get("file")
        if uploaded_file is None or not uploaded_file.filename:
            return jsonify({"error": "Selezionare un file JSON o CSV"}), 400
        try:
            tree, message = service.import_tree(uploaded_file.read(), uploaded_file.filename)
        except InvalidDecisionTreeError as error:
            return jsonify({"error": str(error)}), 400
        payload = tree_to_dict(tree)
        payload["message"] = message
        return jsonify(payload), 201

    @blueprint.get("/decision-trees/<requirement_id>")
    def get_decision_tree(requirement_id: str):
        try:
            tree = service.get_tree(requirement_id)
        except DecisionTreeNotFoundError:
            return jsonify({"error": f"decision tree '{requirement_id}' not found"}), 404
        return jsonify(tree_to_dict(tree))

    @blueprint.delete("/decision-trees/<requirement_id>")
    def delete_decision_tree(requirement_id: str):
        try:
            service.delete_tree(requirement_id)
        except DecisionTreeNotFoundError:
            return jsonify({"error": f"decision tree '{requirement_id}' not found"}), 404
        return "", 204

    @blueprint.get("/decision-trees/<requirement_id>/export")
    def export_decision_tree(requirement_id: str):
        try:
            tree = service.get_tree(requirement_id)
        except DecisionTreeNotFoundError:
            return jsonify({"error": f"decision tree '{requirement_id}' not found"}), 404

        fmt = format_by_name(request.args.get("format", "json"))
        if fmt is None:
            return jsonify({"error": "unsupported export format; use json or csv"}), 400

        return Response(
            fmt.serialize(tree),
            mimetype=fmt.mime_type,
            headers={
                "Content-Disposition": f'attachment; filename="{requirement_id}.{fmt.extension}"'
            },
        )

    return blueprint

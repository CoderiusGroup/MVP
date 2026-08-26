from __future__ import annotations

import csv
import io

from flask import Blueprint, Response, jsonify, request

from src.domain.node import QuestionNode
from src.services.decision_tree_service import DecisionTreeNotFoundError, DecisionTreeService


def _serialize_node(node):
    if isinstance(node, QuestionNode):
        return {
            "id": node.id,
            "type": "question",
            "text": node.text,
            "branches": {"yes": node.branches.yes, "no": node.branches.no},
        }
    body = {"id": node.id, "type": "leaf", "outcome": node.outcome}
    if node.text is not None:
        body["text"] = node.text
    return body


def _serialize_tree(tree):
    body = {
        "requirementId": tree.requirement_id,
        "requirementName": tree.requirement_name,
        "rootNode": tree.root_node,
        "nodes": [_serialize_node(node) for node in tree.nodes],
    }
    if tree.version is not None:
        body["version"] = tree.version
    if tree.applies_to:
        body["appliesTo"] = tree.applies_to
    if tree.dependencies:
        body["dependencies"] = tree.dependencies
    return body


def _tree_to_csv(tree):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "requirementId",
        "requirementName",
        "version",
        "appliesTo",
        "dependencies",
        "rootNode",
        "nodeId",
        "nodeType",
        "nodeText",
        "outcome",
        "branchesYes",
        "branchesNo",
    ])

    for node in tree.nodes:
        row = [
            tree.requirement_id,
            tree.requirement_name,
            tree.version or "",
            ";".join(tree.applies_to),
            ";".join(tree.dependencies),
            tree.root_node,
            node.id,
            node.type,
            getattr(node, "text", "") or "",
            getattr(node, "outcome", "") or "",
            getattr(getattr(node, "branches", None), "yes", "") or "",
            getattr(getattr(node, "branches", None), "no", "") or "",
        ]
        writer.writerow(row)
    return output.getvalue()


def create_decision_tree_blueprint(service: DecisionTreeService) -> Blueprint:
    blueprint = Blueprint("decision_trees", __name__)

    @blueprint.get("/decision-trees")
    def list_decision_trees():
        return jsonify(service.list_trees())

    @blueprint.get("/decision-trees/<requirement_id>")
    def get_decision_tree(requirement_id: str):
        try:
            tree = service.get_tree(requirement_id)
        except DecisionTreeNotFoundError:
            return jsonify({"error": f"decision tree '{requirement_id}' not found"}), 404
        return jsonify(_serialize_tree(tree))

    @blueprint.get("/decision-trees/<requirement_id>/export")
    def export_decision_tree(requirement_id: str):
        try:
            tree = service.get_tree(requirement_id)
        except DecisionTreeNotFoundError:
            return jsonify({"error": f"decision tree '{requirement_id}' not found"}), 404

        export_format = request.args.get("format", "json").lower()
        if export_format == "json":
            response = jsonify(_serialize_tree(tree))
            response.headers["Content-Type"] = "application/json"
            return response

        if export_format == "csv":
            csv_payload = _tree_to_csv(tree)
            return Response(
                csv_payload,
                mimetype="text/csv",
                headers={"Content-Disposition": f'attachment; filename="{requirement_id}.csv"'},
            )

        return jsonify({"error": "unsupported export format; use json or csv"}), 400

    return blueprint

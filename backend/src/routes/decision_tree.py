from __future__ import annotations

from flask import Blueprint, jsonify

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


def create_decision_tree_blueprint(service: DecisionTreeService) -> Blueprint:
    blueprint = Blueprint("decision_trees", __name__)

    @blueprint.get("/decision-trees/<requirement_id>")
    def get_decision_tree(requirement_id: str):
        try:
            tree = service.get_tree(requirement_id)
        except DecisionTreeNotFoundError:
            return jsonify({"error": f"decision tree '{requirement_id}' not found"}), 404
        return jsonify(_serialize_tree(tree))

    return blueprint

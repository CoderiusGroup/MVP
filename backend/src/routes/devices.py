from flask import Blueprint, jsonify, request

devices_bp = Blueprint("devices", __name__)

@devices_bp.post("/devices")
def create_device():
    
    data = request.get_json(silent=True) or {}
    if not isinstance(data,dict):
        return jsonify({"error": "Corpo della richiesta non valido"}), 400

    name = data.get("name")
    if not name:
        return jsonify({"error": "Campo name richiesto"}), 400

    return jsonify({
       "id": "1",
        "name": name,
        "OperatingSystem": data.get("OperatingSystem", ""),
        "description": data.get("description", ""),
        "assets": []
    }), 201
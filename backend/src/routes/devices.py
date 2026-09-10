from flask import Blueprint, jsonify, request

from src.domain.device import Device
from src.services.device_service import InvalidDeviceDataError, create_device

devices_bp = Blueprint("devices", __name__)


def _serialize_device(device: Device) -> dict:
    return {
        "id": device.id,
        "name": device.name,
        "operatingSystem": device.operating_system,
        "description": device.description,
        "assets": [],
    }


@devices_bp.post("/devices")
def create_device_route():
    data = request.get_json(silent=True)

    try:
        device = create_device(data)
    except InvalidDeviceDataError as exc:
        return jsonify({"error": str(exc)}), 400

    return jsonify(_serialize_device(device)), 201

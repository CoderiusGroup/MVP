from __future__ import annotations

import uuid

from src.domain.device import Device


class InvalidDeviceDataError(Exception):
    pass


def create_device(data: object) -> Device:
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

    return Device(
        id=device_id,
        name=name,
        operating_system=operating_system,
        description=description,
        assets=[],
    )

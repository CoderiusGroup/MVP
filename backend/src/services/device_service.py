from __future__ import annotations

from src.domain.device import Device, InvalidDeviceDataError

__all__ = ["InvalidDeviceDataError", "create_device"]


def create_device(data: object) -> Device:
    return Device.create(data)

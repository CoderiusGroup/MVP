import pytest

from src.app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def _valid_payload(**overrides):
    payload = {
        "name": "Credenziali utente",
        "type": "security",
        "description": "Codici PIN memorizzati sul dispositivo.",
        "sensitive": True,
    }
    payload.update(overrides)
    return payload


def test_create_asset_generates_id_when_absent(client):
    response = client.post("/assets", json=_valid_payload())

    assert response.status_code == 201
    data = response.get_json()
    assert data["id"]
    assert data["name"] == "Credenziali utente"
    assert data["type"] == "security"
    assert data["sensitive"] is True


def test_create_asset_derives_requirements_from_applies_to(client):
    response = client.post("/assets", json=_valid_payload(type="security"))

    data = response.get_json()
    assert "ACM-1" in data["requirements"]


def test_create_asset_derives_no_requirements_when_type_not_covered(client):
    response = client.post("/assets", json=_valid_payload(type="financial"))

    data = response.get_json()
    assert data["requirements"] == []


def test_create_asset_respects_provided_id(client):
    response = client.post("/assets", json=_valid_payload(id="AS-02"))

    assert response.get_json()["id"] == "AS-02"


def test_create_asset_missing_name(client):
    payload = _valid_payload()
    del payload["name"]

    response = client.post("/assets", json=payload)

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_create_asset_invalid_type(client):
    response = client.post("/assets", json=_valid_payload(type="unknown"))

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_create_asset_missing_sensitive(client):
    payload = _valid_payload()
    del payload["sensitive"]

    response = client.post("/assets", json=payload)

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_create_asset_with_empty_body(client):
    response = client.post("/assets")

    assert response.status_code == 400
    assert "error" in response.get_json()

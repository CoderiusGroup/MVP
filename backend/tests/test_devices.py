import pytest

from src.app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_create_device_generates_id_when_absent(client):
    response = client.post(
        "/devices",
        json={"name": "Router1", "operatingSystem": "Linux", "description": "Router per la casa"},
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["id"]
    assert data["name"] == "Router1"
    assert data["operatingSystem"] == "Linux"
    assert data["description"] == "Router per la casa"
    assert data["assets"] == []


def test_create_device_generates_different_ids_across_requests(client):
    payload = {"name": "Router1", "operatingSystem": "Linux", "description": "Router per la casa"}

    first = client.post("/devices", json=payload).get_json()
    second = client.post("/devices", json=payload).get_json()

    assert first["id"] != second["id"]


def test_create_device_respects_provided_id(client):
    response = client.post(
        "/devices",
        json={
            "id": "DEV-SL200",
            "name": "Router1",
            "operatingSystem": "Linux",
            "description": "Router per la casa",
        },
    )

    assert response.status_code == 201
    assert response.get_json()["id"] == "DEV-SL200"


def test_create_device_missing_name(client):
    response = client.post(
        "/devices", json={"operatingSystem": "Linux", "description": "Router per la casa"}
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_create_device_missing_operating_system(client):
    response = client.post(
        "/devices", json={"name": "Router1", "description": "Router per la casa"}
    )

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_create_device_missing_description(client):
    response = client.post("/devices", json={"name": "Router1", "operatingSystem": "Linux"})

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_create_device_with_list_body(client):
    response = client.post("/devices", json=[{"name": "Router1"}])

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_create_device_with_empty_body(client):
    response = client.post("/devices")

    assert response.status_code == 400
    assert "error" in response.get_json()

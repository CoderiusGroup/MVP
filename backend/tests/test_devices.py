import pytest

from src.app import create_app


@pytest.fixture
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_create_device_success(client):
    response = client.post(
        "/devices",
        json={"name": "Router1", "operatingSystem": "Linux", "description": "Router per la casa"},
    )

    assert response.status_code == 201
    data = response.get_json()
    assert data["name"] == "Router1"
    assert data["operatingSystem"] == "Linux"


def test_create_device_missing_name(client):
    response = client.post("/devices", json={"operatingSystem": "Linux"})

    assert response.status_code == 400
    assert "error" in response.get_json()


def test_create_device_with_list_body(client):
    response = client.post("/devices", json=[{"name": "Router1"}])

    assert response.status_code == 400
    assert "error" in response.get_json()

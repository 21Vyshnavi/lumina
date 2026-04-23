def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


def test_register_success(client):
    resp = client.post("/auth/register", json={
        "email": "new@lumina.dev",
        "username": "newuser",
        "password": "Secret123!",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert data["email"] == "new@lumina.dev"
    assert "id" in data


def test_register_duplicate_email(client, registered_user):
    resp = client.post("/auth/register", json={
        "email": registered_user["email"],
        "username": "other",
        "password": "pass",
    })
    assert resp.status_code == 400


def test_login_success(client, registered_user):
    resp = client.post("/auth/login", json=registered_user)
    assert resp.status_code == 200
    assert "access_token" in resp.json()


def test_login_wrong_password(client, registered_user):
    resp = client.post("/auth/login", json={
        "email": registered_user["email"],
        "password": "wrongpass",
    })
    assert resp.status_code == 401


def test_me_authenticated(client, auth_headers):
    resp = client.get("/auth/me", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["email"] == "test@lumina.dev"


def test_me_unauthenticated(client):
    resp = client.get("/auth/me")
    assert resp.status_code == 403

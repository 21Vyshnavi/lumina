def test_list_sessions_empty(client, auth_headers):
    resp = client.get("/chat/sessions", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_get_session_not_found(client, auth_headers):
    resp = client.get("/chat/sessions/nonexistent", headers=auth_headers)
    assert resp.status_code == 404


def test_chat_requires_auth(client):
    resp = client.get("/chat/sessions")
    assert resp.status_code == 403

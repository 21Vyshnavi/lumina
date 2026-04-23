def test_create_document(client, auth_headers):
    resp = client.post("/documents", json={
        "title": "Test Doc",
        "content": "This is a test document with some content for testing purposes.",
    }, headers=auth_headers)
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "Test Doc"
    assert data["word_count"] > 0
    return data["id"]


def test_list_documents(client, auth_headers):
    client.post("/documents", json={
        "title": "List Test",
        "content": "Content here.",
    }, headers=auth_headers)
    resp = client.get("/documents", headers=auth_headers)
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)
    assert len(resp.json()) >= 1


def test_get_document(client, auth_headers):
    create = client.post("/documents", json={
        "title": "Fetch Me",
        "content": "Some content.",
    }, headers=auth_headers)
    doc_id = create.json()["id"]
    resp = client.get(f"/documents/{doc_id}", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["id"] == doc_id


def test_get_document_not_found(client, auth_headers):
    resp = client.get("/documents/nonexistent-id", headers=auth_headers)
    assert resp.status_code == 404


def test_delete_document(client, auth_headers):
    create = client.post("/documents", json={
        "title": "Delete Me",
        "content": "Bye.",
    }, headers=auth_headers)
    doc_id = create.json()["id"]
    resp = client.delete(f"/documents/{doc_id}", headers=auth_headers)
    assert resp.status_code == 204
    resp = client.get(f"/documents/{doc_id}", headers=auth_headers)
    assert resp.status_code == 404


def test_documents_require_auth(client):
    resp = client.get("/documents")
    assert resp.status_code == 403

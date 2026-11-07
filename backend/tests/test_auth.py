async def test_login_success(client, make_user):
    user = await make_user(email="coach@test.com", password="secret123", role="coach")

    response = await client.post(
        "/auth/login",
        data={"username": "coach@test.com", "password": "secret123"},
    )

    assert response.status_code == 201
    body = response.json()
    assert body["token_type"] == "bearer"
    assert body["role"] == "coach"
    assert body["user_id"] == user.id
    assert body["access_token"]


async def test_login_wrong_password(client, make_user):
    await make_user(email="coach@test.com", password="secret123", role="coach")

    response = await client.post(
        "/auth/login",
        data={"username": "coach@test.com", "password": "secret123"},
    )

    assert response.status_code == 401
    body = response.json()
    assert body["detail"] == "Credenziali non valide"
    assert "access_token" not in body


async def test_login_wrong_email(client, make_user):
    response = await client.post(
        "/auth/login",
        data={"username": "coach@test.com", "password": "secret123"},
    )

    assert response.status_code == 401
    body = response.json()
    assert body["detail"] == "Credenziali non valide"
    assert "access_token" not in body

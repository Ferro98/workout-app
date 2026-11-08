async def test_get_clients_no_token(client):
    response = await client.get(
        "/api/clients/"
    )

    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}


async def test_get_clients_no_coach(client, make_user, auth_headers):
    user = await make_user(email="cliente@test.com", password="secret123", role="client")

    response = await client.get(
        "/api/clients/",
        headers=auth_headers(user)
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Richiede ruolo coach"}


async def test_coach_sees_only_own_clients(client, make_user, auth_headers):
    coach1 = await make_user(email="coach1@test.com", password="secret123", role="coach")
    coach2 = await make_user(email="coach2@test.com", password="secret123", role="coach")

    client1 = await make_user(email="client1@test.com", full_name="Client One", password="secret123", role="client", coach_id=coach1.id)
    client2 = await make_user(email="client2@test.com", full_name="Client Two", password="secret123", role="client", coach_id=coach2.id)

    response = await client.get(
        "/api/clients/",
        headers=auth_headers(coach1)
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == client1.id
    assert body[0]["name"] == client1.full_name

    response = await client.get(
        "/api/clients/",
        headers=auth_headers(coach2)
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["id"] == client2.id
    assert body[0]["name"] == client2.full_name

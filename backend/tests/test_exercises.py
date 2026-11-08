async def test_get_exercises_no_token(client):
    response = await client.get("/api/exercises/")

    assert response.status_code == 401
    assert response.json() == {"detail": "Not authenticated"}


async def test_get_exercises_as_client(client, make_user, make_exercise, auth_headers):
    user = await make_user(email="client@test.com", role="client")
    exercise = await make_exercise(name="Bench Press", category="chest", type="weight")

    response = await client.get("/api/exercises/", headers=auth_headers(user))

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": exercise.id,
            "name": "Bench Press",
            "category": "chest",
            "type": "weight",
        }
    ]


async def test_get_exercises_as_coach(client, make_user, make_exercise, auth_headers):
    user = await make_user(email="coach@test.com", role="coach")
    await make_exercise(name="Bench Press")

    response = await client.get("/api/exercises/", headers=auth_headers(user))

    assert response.status_code == 200
    assert len(response.json()) == 1


async def test_get_exercises_empty_catalog(client, make_user, auth_headers):
    user = await make_user(email="client@test.com", role="client")

    response = await client.get("/api/exercises/", headers=auth_headers(user))

    assert response.status_code == 200
    assert response.json() == []


async def test_get_exercises_ordered_by_category_then_name(
    client, make_user, make_exercise, auth_headers
):
    user = await make_user(email="client@test.com", role="client")
    # Created out of order on purpose
    await make_exercise(name="Squat", category="legs")
    await make_exercise(name="Pull-up", category="back")
    await make_exercise(name="Row", category="back")
    await make_exercise(name="Bench Press", category="chest")

    response = await client.get("/api/exercises/", headers=auth_headers(user))

    assert response.status_code == 200
    names = [e["name"] for e in response.json()]
    assert names == ["Pull-up", "Row", "Bench Press", "Squat"]

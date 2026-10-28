import pytest
from app import QUOTES, app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as test_client:
        yield test_client


def test_quotes_dataset_integrity():
    """Verify there are exactly 100 well-formed quotes with unique IDs."""
    assert len(QUOTES) == 100
    ids = set()
    for item in QUOTES:
        assert "id" in item and isinstance(item["id"], int)
        assert "quote" in item and isinstance(item["quote"], str) and item["quote"].strip()
        assert "author" in item and isinstance(item["author"], str) and item["author"].strip()
        assert (
            "categories" in item
            and isinstance(item["categories"], list)
            and len(item["categories"]) > 0
        )
        ids.add(item["id"])
    assert len(ids) == 100


def test_index_page(client):
    """Verify the main HTML page loads."""
    response = client.get("/")
    assert response.status_code == 200
    html = response.data.decode("utf-8")
    assert "QuoteVault" in html
    assert "Search by Author" in html


def test_meta_endpoint(client):
    """Verify /api/meta returns 100 total quotes and populated authors/categories."""
    response = client.get("/api/meta")
    assert response.status_code == 200
    data = response.get_json()
    assert data["total_quotes"] == 100
    assert len(data["authors"]) > 20
    assert len(data["categories"]) >= 8


def test_random_quote_endpoint(client):
    """Verify /api/quotes/random returns a valid quote and respects filters."""
    response = client.get("/api/quotes/random")
    assert response.status_code == 200
    data = response.get_json()
    assert data["pool_size"] == 100
    assert "quote" in data and data["quote"]["id"] in range(1, 101)

    # Filter random quote by category
    res_cat = client.get("/api/quotes/random?category=Science")
    assert res_cat.status_code == 200
    cat_quote = res_cat.get_json()["quote"]
    assert "Science" in cat_quote["categories"]

    # Filter random quote by author
    res_author = client.get("/api/quotes/random?author=Einstein")
    assert res_author.status_code == 200
    author_quote = res_author.get_json()["quote"]
    assert "Einstein" in author_quote["author"]

    # Non-existent filter returns 404
    res_none = client.get("/api/quotes/random?author=NonExistentAuthorXYZ")
    assert res_none.status_code == 404


def test_quotes_search_by_author_and_category(client):
    """Verify /api/quotes filters by author, category, and both combined."""
    # Search by author substring (case-insensitive)
    res_author = client.get("/api/quotes?author=mark twain")
    assert res_author.status_code == 200
    author_data = res_author.get_json()
    assert author_data["count"] > 0
    for q in author_data["quotes"]:
        assert "mark twain" in q["author"].lower()

    # Search by category
    res_cat = client.get("/api/quotes?category=Humor")
    assert res_cat.status_code == 200
    cat_data = res_cat.get_json()
    assert cat_data["count"] > 0
    for q in cat_data["quotes"]:
        assert "Humor" in q["categories"]

    # Combined author + category search
    res_combined = client.get("/api/quotes?author=Einstein&category=Science")
    assert res_combined.status_code == 200
    combined_data = res_combined.get_json()
    assert combined_data["count"] > 0
    for q in combined_data["quotes"]:
        assert "Einstein" in q["author"]
        assert "Science" in q["categories"]

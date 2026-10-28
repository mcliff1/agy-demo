import json
import os
import random
from collections import Counter
from flask import Flask, jsonify, render_template, request

app = Flask(__name__)

QUOTES_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "quotes.json")


def load_quotes():
    """Load the 100 quotes dataset from quotes.json."""
    with open(QUOTES_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


QUOTES = load_quotes()


def filter_quotes(quotes, author="", category="", query=""):
    """Filter quotes by author substring, exact category, and/or keyword query."""
    author_norm = author.strip().lower()
    category_norm = category.strip().lower()
    query_norm = query.strip().lower()

    results = []
    for item in quotes:
        if author_norm and author_norm not in item["author"].lower():
            continue
        if category_norm and not any(
            cat.lower() == category_norm for cat in item["categories"]
        ):
            continue
        if query_norm and (
            query_norm not in item["quote"].lower()
            and query_norm not in item["author"].lower()
            and not any(query_norm in cat.lower() for cat in item["categories"])
        ):
            continue
        results.append(item)

    return results


@app.route("/")
def index():
    """Serve the main single-page application."""
    return render_template("index.html")


@app.route("/api/meta")
def get_meta():
    """Return metadata including total quote count, sorted authors, and categories with counts."""
    author_counts = Counter(q["author"] for q in QUOTES)
    category_counts = Counter(
        cat for q in QUOTES for cat in q.get("categories", [])
    )

    authors = [
        {"name": name, "count": author_counts[name]}
        for name in sorted(author_counts.keys())
    ]
    categories = [
        {"name": name, "count": category_counts[name]}
        for name in sorted(category_counts.keys())
    ]

    return jsonify(
        {
            "total_quotes": len(QUOTES),
            "authors": authors,
            "categories": categories,
        }
    )


@app.route("/api/quotes")
def get_quotes():
    """Return filtered quotes based on author, category, and optional keyword query."""
    author = request.args.get("author", "")
    category = request.args.get("category", "")
    query = request.args.get("q", "")

    matched = filter_quotes(QUOTES, author=author, category=category, query=query)
    return jsonify(
        {
            "count": len(matched),
            "total": len(QUOTES),
            "quotes": matched,
        }
    )


@app.route("/api/quotes/random")
def get_random_quote():
    """Return a single random quote, optionally filtered by author, category, or query."""
    author = request.args.get("author", "")
    category = request.args.get("category", "")
    query = request.args.get("q", "")
    exclude_id = request.args.get("exclude_id", type=int)

    pool = filter_quotes(QUOTES, author=author, category=category, query=query)
    if not pool:
        return (
            jsonify(
                {
                    "error": "No quotes found matching the specified filters.",
                    "quote": None,
                }
            ),
            404,
        )

    if exclude_id is not None and len(pool) > 1:
        candidates = [q for q in pool if q["id"] != exclude_id]
        if candidates:
            pool = candidates

    selected = random.choice(pool)
    return jsonify(
        {
            "pool_size": len(pool),
            "quote": selected,
        }
    )


if __name__ == "__main__":
    app.run(debug=True, host="127.0.0.1", port=5000)

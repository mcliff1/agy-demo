# QuoteVault 100

A lightweight, responsive web application built with **Python (Flask)** and **vanilla JavaScript, HTML5, and CSS3** that displays random quotes from a curated collection of **100 well-known quotes** and allows searching and filtering by **author** and **categories**.

## Features

- **Featured Random Quote Spotlight**: Displays a random quote on load with one-click buttons to draw a new random quote across all 100 quotes or within your active search filters.
- **Author Search with Autocomplete**: Live, debounced case-insensitive search by author name backed by an HTML5 `<datalist>` of all authors in the collection.
- **Category Filtering**: Filter quotes across 10 categories (*Courage*, *Happiness*, *Humor*, *Inspiration*, *Leadership*, *Life*, *Philosophy*, *Science*, *Success*, *Wisdom*) using quick-filter pills, the category dropdown, or by clicking any badge on a quote card.
- **Interactive Quote Cards**: Click any author or category tag on a quote card to filter by it, spotlight a specific quote, or copy a formatted quote to your clipboard.

## Tech Stack

- **Backend**: Python 3, Flask
- **Frontend**: Plain Vanilla JavaScript (`fetch` API, ES6+), HTML5, CSS3 (Custom Properties, CSS Grid & Flexbox)
- **Data Store**: Structured JSON (`quotes.json`)
- **Testing**: `pytest`

## Project Structure

```text
.
├── app.py               # Flask application and REST API endpoints
├── quotes.json          # Curated dataset of 100 well-known quotes
├── requirements.txt     # Python dependencies (Flask, pytest)
├── test_app.py          # Automated unit & integration test suite
├── templates/
│   └── index.html       # Main single-page application template
└── static/
    ├── app.js           # Frontend vanilla JavaScript logic
    └── styles.css       # Application styles and responsive layout
```

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/mcliff1/agy-demo.git
cd agy-demo
```

### 2. Create a Virtual Environment & Install Dependencies

**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

**macOS / Linux:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Run the Application

```bash
python app.py
```

Open **http://127.0.0.1:5000** in your browser.

## API Endpoints

| Method | Endpoint | Query Parameters | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | — | Serves the main HTML web application. |
| `GET` | `/api/meta` | — | Returns total quote count (`100`), sorted authors with quote counts, and categories with quote counts. |
| `GET` | `/api/quotes` | `author`, `category`, `q` | Returns all quotes matching the optional author substring, exact category, and/or keyword query. |
| `GET` | `/api/quotes/random` | `author`, `category`, `q`, `exclude_id` | Returns a single random quote from all 100 quotes or from the filtered pool (excluding `exclude_id` when possible). |

## Running Tests

Run the automated test suite with `pytest`:

```bash
pytest -v
```

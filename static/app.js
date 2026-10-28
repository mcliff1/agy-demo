document.addEventListener("DOMContentLoaded", () => {
  const state = {
    totalQuotes: 100,
    currentSpotlight: null,
    authorFilter: "",
    categoryFilter: "",
    matchingQuotes: [],
  };

  // DOM Elements
  const statTotalEl = document.getElementById("stat-total");
  const statAuthorsEl = document.getElementById("stat-authors");
  const statCategoriesEl = document.getElementById("stat-categories");

  const spotlightCard = document.getElementById("spotlight-card");
  const spotlightHeading = document.getElementById("spotlight-heading");
  const spotlightId = document.getElementById("spotlight-id");
  const spotlightQuoteText = document.getElementById("spotlight-quote-text");
  const spotlightAuthor = document.getElementById("spotlight-author");
  const spotlightCategories = document.getElementById("spotlight-categories");

  const btnRandomAll = document.getElementById("btn-random-all");
  const btnRandomFiltered = document.getElementById("btn-random-filtered");
  const btnCopySpotlight = document.getElementById("btn-copy-spotlight");

  const authorInput = document.getElementById("author-input");
  const clearAuthorBtn = document.getElementById("clear-author-btn");
  const authorsDatalist = document.getElementById("authors-datalist");
  const categorySelect = document.getElementById("category-select");
  const categoryPills = document.getElementById("category-pills");
  const btnClearFilters = document.getElementById("btn-clear-filters");
  const btnEmptyReset = document.getElementById("btn-empty-reset");

  const resultsCount = document.getElementById("results-count");
  const activeFiltersSummary = document.getElementById("active-filters-summary");
  const emptyState = document.getElementById("empty-state");
  const quotesGrid = document.getElementById("quotes-grid");
  const toastEl = document.getElementById("toast");

  let toastTimeout = null;

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.hidden = false;
    if (toastTimeout) {
      clearTimeout(toastTimeout);
    }
    toastTimeout = setTimeout(() => {
      toastEl.hidden = true;
    }, 2200);
  }

  async function copyQuoteToClipboard(quoteObj) {
    if (!quoteObj) return;
    const formatted = `"${quoteObj.quote}" — ${quoteObj.author}`;
    try {
      await navigator.clipboard.writeText(formatted);
      showToast("Quote copied to clipboard!");
    } catch {
      showToast(`Copied: ${formatted}`);
    }
  }

  function renderSpotlight(quoteObj, labelText = "Featured Random Quote") {
    if (!quoteObj) return;
    state.currentSpotlight = quoteObj;

    spotlightCard.classList.add("fade-transition");
    setTimeout(() => {
      spotlightHeading.textContent = labelText;
      spotlightId.textContent = `#${quoteObj.id} of ${state.totalQuotes}`;
      spotlightQuoteText.textContent = quoteObj.quote;
      spotlightAuthor.textContent = `— ${quoteObj.author}`;
      spotlightAuthor.dataset.author = quoteObj.author;

      spotlightCategories.innerHTML = "";
      quoteObj.categories.forEach((cat) => {
        const badge = document.createElement("button");
        badge.type = "button";
        badge.className = "tag-badge";
        badge.textContent = cat;
        badge.title = `Filter by ${cat}`;
        badge.addEventListener("click", () => {
          setCategoryFilter(cat);
        });
        spotlightCategories.appendChild(badge);
      });

      spotlightCard.classList.remove("fade-transition");
    }, 120);
  }

  async function fetchRandomQuote({ useFilters = false } = {}) {
    const params = new URLSearchParams();
    if (state.currentSpotlight && state.currentSpotlight.id) {
      params.set("exclude_id", String(state.currentSpotlight.id));
    }
    if (useFilters) {
      if (state.authorFilter) params.set("author", state.authorFilter);
      if (state.categoryFilter) params.set("category", state.categoryFilter);
    }

    const res = await fetch(`/api/quotes/random?${params.toString()}`);
    if (!res.ok) {
      showToast("No matching quotes found for that filter.");
      return;
    }
    const data = await res.json();
    const label = useFilters && (state.authorFilter || state.categoryFilter)
      ? `Random Filtered Quote (${data.pool_size} matching)`
      : "Featured Random Quote";
    renderSpotlight(data.quote, label);
  }

  async function loadMeta() {
    const res = await fetch("/api/meta");
    if (!res.ok) return;
    const data = await res.json();

    state.totalQuotes = data.total_quotes || 100;
    statTotalEl.textContent = String(state.totalQuotes);
    statAuthorsEl.textContent = String(data.authors.length);
    statCategoriesEl.textContent = String(data.categories.length);

    // Populate authors datalist
    authorsDatalist.innerHTML = "";
    data.authors.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.name;
      option.label = `${item.name} (${item.count})`;
      authorsDatalist.appendChild(option);
    });

    // Populate category dropdown & pills
    categorySelect.innerHTML = `<option value="">All Categories (${state.totalQuotes})</option>`;
    categoryPills.innerHTML = "";

    const allPill = document.createElement("button");
    allPill.type = "button";
    allPill.className = "pill active";
    allPill.dataset.category = "";
    allPill.textContent = `All (${state.totalQuotes})`;
    allPill.addEventListener("click", () => setCategoryFilter(""));
    categoryPills.appendChild(allPill);

    data.categories.forEach((cat) => {
      const opt = document.createElement("option");
      opt.value = cat.name;
      opt.textContent = `${cat.name} (${cat.count})`;
      categorySelect.appendChild(opt);

      const pill = document.createElement("button");
      pill.type = "button";
      pill.className = "pill";
      pill.dataset.category = cat.name;
      pill.textContent = `${cat.name} (${cat.count})`;
      pill.addEventListener("click", () => setCategoryFilter(cat.name));
      categoryPills.appendChild(pill);
    });
  }

  function syncFilterUI() {
    const hasFilters = Boolean(state.authorFilter || state.categoryFilter);
    btnClearFilters.hidden = !hasFilters;
    btnRandomFiltered.hidden = !hasFilters;
    clearAuthorBtn.hidden = !state.authorFilter;

    // Sync category select
    categorySelect.value = state.categoryFilter;

    // Sync category pills
    const pills = categoryPills.querySelectorAll(".pill");
    pills.forEach((pill) => {
      const isMatch = pill.dataset.category === state.categoryFilter;
      pill.classList.toggle("active", isMatch);
    });

    // Render active filter summary chips
    activeFiltersSummary.innerHTML = "";
    if (state.authorFilter) {
      const chip = document.createElement("span");
      chip.className = "filter-chip";
      chip.textContent = `Author: "${state.authorFilter}"`;
      activeFiltersSummary.appendChild(chip);
    }
    if (state.categoryFilter) {
      const chip = document.createElement("span");
      chip.className = "filter-chip";
      chip.textContent = `Category: ${state.categoryFilter}`;
      activeFiltersSummary.appendChild(chip);
    }
  }

  function renderQuotesGrid(quotes) {
    quotesGrid.innerHTML = "";
    resultsCount.textContent = `(${quotes.length} of ${state.totalQuotes})`;

    if (quotes.length === 0) {
      emptyState.hidden = false;
      return;
    }
    emptyState.hidden = true;

    const fragment = document.createDocumentFragment();
    quotes.forEach((q) => {
      const card = document.createElement("article");
      card.className = "quote-card";

      const topBar = document.createElement("div");
      topBar.className = "quote-card-top";

      const idSpan = document.createElement("span");
      idSpan.className = "card-id";
      idSpan.textContent = `#${q.id}`;

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "card-actions";

      const featureBtn = document.createElement("button");
      featureBtn.type = "button";
      featureBtn.className = "card-btn";
      featureBtn.textContent = "Spotlight";
      featureBtn.addEventListener("click", () => {
        renderSpotlight(q, "Selected Quote");
        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      const copyBtn = document.createElement("button");
      copyBtn.type = "button";
      copyBtn.className = "card-btn";
      copyBtn.textContent = "Copy";
      copyBtn.addEventListener("click", () => copyQuoteToClipboard(q));

      actionsDiv.appendChild(featureBtn);
      actionsDiv.appendChild(copyBtn);
      topBar.appendChild(idSpan);
      topBar.appendChild(actionsDiv);

      const quoteText = document.createElement("p");
      quoteText.className = "card-quote-text";
      quoteText.textContent = `\u201C${q.quote}\u201D`;

      const footer = document.createElement("div");
      footer.className = "card-footer";

      const authorBtn = document.createElement("button");
      authorBtn.type = "button";
      authorBtn.className = "card-author-btn";
      authorBtn.textContent = `\u2014 ${q.author}`;
      authorBtn.title = `Search quotes by ${q.author}`;
      authorBtn.addEventListener("click", () => {
        setAuthorFilter(q.author);
      });

      const catsDiv = document.createElement("div");
      catsDiv.className = "card-categories";
      q.categories.forEach((cat) => {
        const tag = document.createElement("button");
        tag.type = "button";
        tag.className = "card-category-tag";
        if (state.categoryFilter && cat.toLowerCase() === state.categoryFilter.toLowerCase()) {
          tag.classList.add("active");
        }
        tag.textContent = cat;
        tag.addEventListener("click", () => setCategoryFilter(cat));
        catsDiv.appendChild(tag);
      });

      footer.appendChild(authorBtn);
      footer.appendChild(catsDiv);

      card.appendChild(topBar);
      card.appendChild(quoteText);
      card.appendChild(footer);
      fragment.appendChild(card);
    });

    quotesGrid.appendChild(fragment);
  }

  async function fetchFilteredQuotes() {
    syncFilterUI();

    const params = new URLSearchParams();
    if (state.authorFilter) params.set("author", state.authorFilter);
    if (state.categoryFilter) params.set("category", state.categoryFilter);

    const res = await fetch(`/api/quotes?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    state.matchingQuotes = data.quotes || [];
    renderQuotesGrid(state.matchingQuotes);
  }

  function setCategoryFilter(category) {
    state.categoryFilter = category;
    fetchFilteredQuotes();
  }

  function setAuthorFilter(author) {
    state.authorFilter = author.trim();
    authorInput.value = state.authorFilter;
    fetchFilteredQuotes();
  }

  function resetAllFilters() {
    state.authorFilter = "";
    state.categoryFilter = "";
    authorInput.value = "";
    fetchFilteredQuotes();
  }

  // Event Listeners
  btnRandomAll.addEventListener("click", () => fetchRandomQuote({ useFilters: false }));
  btnRandomFiltered.addEventListener("click", () => fetchRandomQuote({ useFilters: true }));
  btnCopySpotlight.addEventListener("click", () => copyQuoteToClipboard(state.currentSpotlight));

  spotlightAuthor.addEventListener("click", () => {
    const author = spotlightAuthor.dataset.author;
    if (author) {
      setAuthorFilter(author);
    }
  });

  let debounceTimer = null;
  authorInput.addEventListener("input", (e) => {
    const value = e.target.value;
    clearAuthorBtn.hidden = !value;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.authorFilter = value.trim();
      fetchFilteredQuotes();
    }, 180);
  });

  clearAuthorBtn.addEventListener("click", () => {
    setAuthorFilter("");
    authorInput.focus();
  });

  categorySelect.addEventListener("change", (e) => {
    setCategoryFilter(e.target.value);
  });

  btnClearFilters.addEventListener("click", resetAllFilters);
  btnEmptyReset.addEventListener("click", resetAllFilters);

  // Initialize application
  loadMeta();
  fetchRandomQuote({ useFilters: false });
  fetchFilteredQuotes();
});

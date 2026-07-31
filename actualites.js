(function () {
  const news = Array.isArray(window.SITE_NEWS) ? window.SITE_NEWS : [];
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>'"]/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[char]));
  const articleUrl = (item) => `article.html?id=${encodeURIComponent(item.id)}`;

  function renderFeatured() {
    const host = document.getElementById("featured-news");
    if (!host || !news.length) return;
    const item = news[0];
    host.innerHTML = `
      <div class="featured-visual"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt)}"></div>
      <div class="featured-copy-news">
        <div class="news-kicker">À LA UNE · ${escapeHtml(item.category)} · ${escapeHtml(item.date)}</div>
        <h2>${escapeHtml(item.title)}</h2>
        <p>${escapeHtml(item.summary)}</p>
        <a class="read-button" href="${articleUrl(item)}">Lire le communiqué <span>→</span></a>
      </div>`;
  }

  function renderCatalogue() {
    const host = document.getElementById("news-list");
    const search = document.getElementById("news-search");
    const category = document.getElementById("news-category");
    const count = document.getElementById("news-count");
    if (!host || !search || !category) return;

    const update = () => {
      const term = search.value.trim().toLowerCase();
      const selected = category.value;
      const rows = news.filter((item) => {
        const categoryMatch = selected === "all" || item.category === selected;
        const text = `${item.title} ${item.summary} ${item.category}`.toLowerCase();
        return categoryMatch && text.includes(term);
      });
      if (count) count.textContent = `${rows.length} publication${rows.length > 1 ? "s" : ""}`;
      host.innerHTML = rows.length ? rows.map((item) => `
        <article class="catalogue-card">
          <a class="catalogue-image" href="${articleUrl(item)}"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt)}"></a>
          <div class="catalogue-content">
            <div class="catalogue-meta">${escapeHtml(item.category)} · ${escapeHtml(item.date)}</div>
            <h3><a href="${articleUrl(item)}">${escapeHtml(item.title)}</a></h3>
            <p>${escapeHtml(item.summary)}</p>
            <a class="catalogue-link" href="${articleUrl(item)}">Lire la publication →</a>
          </div>
        </article>`).join("") : `<div class="empty-state"><strong>Aucune publication trouvée.</strong><p>Modifiez votre recherche ou choisissez une autre catégorie.</p></div>`;
    };
    search.addEventListener("input", update);
    category.addEventListener("change", update);
    update();
  }

  function renderArticle() {
    const host = document.getElementById("article-page");
    if (!host) return;
    const id = new URLSearchParams(window.location.search).get("id");
    const item = news.find((entry) => entry.id === id) || news[0];
    if (!item) {
      host.innerHTML = `<section class="article-shell"><h1>Publication introuvable</h1><a href="actualites.html">Retour aux actualités</a></section>`;
      return;
    }
    document.title = `${item.title} · Royaume-Uni de Grande-Bretagne`;
    host.innerHTML = `
      <article class="article-shell">
        <a class="article-back" href="actualites.html">← Toutes les actualités</a>
        <div class="article-meta">${escapeHtml(item.category)} · ${escapeHtml(item.date)}</div>
        <h1>${escapeHtml(item.title)}</h1>
        <p class="article-lead">${escapeHtml(item.summary)}</p>
        <div class="article-hero-image"><img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.imageAlt)}"></div>
        <div class="article-body">${(item.body || []).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}</div>
        <div class="article-signature"><span>Publié par</span><strong>Le Gouvernement de Sa Majesté</strong></div>
      </article>`;
  }

  renderFeatured();
  renderCatalogue();
  renderArticle();
})();

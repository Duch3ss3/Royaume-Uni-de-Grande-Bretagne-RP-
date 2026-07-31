async function loadNews() {
  const response = await fetch('data/news.json');
  return response.json();
}

function newsCard(item, index = null) {
  return `
    <article class="news-card" data-category="${item.category}">
      ${index !== null ? `<div class="news-index">${String(index + 1).padStart(2, '0')}</div>` : ''}
      <div>
        <div class="news-meta"><span class="category">${item.category}</span><span>${item.date}</span></div>
        <h3>${item.title}</h3>
        <p>${item.summary}</p>
        <small>${item.ministry}</small>
      </div>
    </article>`;
}

loadNews().then(items => {
  const home = document.getElementById('home-news');
  if (home) home.innerHTML = items.slice(0, 3).map(item => newsCard(item)).join('');

  const list = document.getElementById('news-list');
  if (list) list.innerHTML = items.map((item, index) => newsCard(item, index)).join('');

  document.querySelectorAll('.filter').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.filter').forEach(b => b.classList.remove('active'));
      button.classList.add('active');
      const filter = button.dataset.filter;
      document.querySelectorAll('#news-list .news-card').forEach(card => {
        card.classList.toggle('hidden', filter !== 'all' && card.dataset.category !== filter);
      });
    });
  });
}).catch(error => {
  console.error(error);
  const target = document.getElementById('news-list') || document.getElementById('home-news');
  if (target) target.innerHTML = '<p>Impossible de charger les actualités.</p>';
});

const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.main-nav');
if (menuButton && nav) {
  menuButton.addEventListener('click', () => nav.classList.toggle('open'));
}
const sync = document.getElementById('sync-time');
if (sync) sync.textContent = new Date().toLocaleString('fr-FR');

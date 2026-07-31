const info = document.getElementById('map-info');
const descriptions = {
  territoire: "Territoire relevant directement de la souveraineté britannique.",
  allie: "Partenaire officiel ou puissance liée par un accord stratégique.",
  revendication: "Zone faisant l'objet d'une revendication politique ou historique.",
  ennemi: "Puissance hostile ou adversaire déclaré du Royaume.",
  neutre: "État sans alliance ni hostilité formelle."
};

document.querySelectorAll('.zone').forEach(zone => {
  zone.addEventListener('click', () => {
    const status = zone.dataset.status;
    info.innerHTML = `
      <p class="eyebrow">STATUT : ${status.toUpperCase()}</p>
      <h2>${zone.dataset.name}</h2>
      <p>${descriptions[status]}</p>`;
  });
});

document.querySelectorAll('[data-map-filter]').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('[data-map-filter]').forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.mapFilter;
    document.querySelectorAll('.zone').forEach(zone => {
      zone.classList.toggle('hidden', filter !== 'all' && zone.dataset.status !== filter);
    });
  });
});

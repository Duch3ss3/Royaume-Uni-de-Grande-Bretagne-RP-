function renderJournal(){
 const list=document.getElementById('journal-list'); if(!list)return;
 const q=(document.getElementById('journal-search')?.value||'').toLowerCase();
 const f=document.getElementById('journal-filter')?.value||'all';
 const items=getData().publications.filter(x=>(x.title+' '+x.summary).toLowerCase().includes(q)&&(f==='all'||x.type===f));
 list.innerHTML=items.length?items.map(x=>`<article class="article-item"><p class="kicker">${esc(x.type)} • ${esc(x.date||'Date non précisée')}</p><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p></article>`).join(''):'<div class="empty">Aucune publication officielle.</div>';
}
document.getElementById('journal-search')?.addEventListener('input',renderJournal);
document.getElementById('journal-filter')?.addEventListener('change',renderJournal);
renderJournal();
const home=document.getElementById('home-publications');
if(home){const items=getData().publications.slice(-3).reverse();home.innerHTML=items.length?items.map(x=>`<article class="card"><p class="kicker">${esc(x.type)}</p><h3>${esc(x.title)}</h3><p>${esc(x.summary)}</p></article>`).join(''):'<div class="empty" style="grid-column:1/-1">Aucune publication pour le moment.</div>'}

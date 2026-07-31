function renderEconomy(){
 const data=getData().territories||[];const body=document.getElementById('economy-table');if(!body)return;const q=(document.getElementById('eco-search')?.value||'').toLowerCase();const f=document.getElementById('eco-filter')?.value||'all';
 const items=data.filter(x=>x.economyEnabled&&(x.name||'').toLowerCase().includes(q)&&(f==='all'||x.relation===f));
 body.innerHTML=items.map(x=>`<tr><td>${flagHTML(x.flag,x.name)}<strong>${esc(x.name)}</strong></td><td><span class="status ${esc((x.relation||'normale').toLowerCase())}">${esc(x.relation||'Normale')}</span></td><td>${Number(x.importTax||0).toFixed(1)} %</td><td>${Number(x.exportTax||0).toFixed(1)} %</td><td>${esc(x.notes||'—')}</td></tr>`).join('');
 document.getElementById('economy-empty').style.display=items.length?'none':'block';
}
document.getElementById('eco-search')?.addEventListener('input',renderEconomy);document.getElementById('eco-filter')?.addEventListener('change',renderEconomy);renderEconomy();

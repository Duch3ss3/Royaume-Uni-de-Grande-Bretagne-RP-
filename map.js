const STATUS_COLORS={national:'#315f94',allie:'#287a55',neutre:'#6e7681',revendique:'#b6903f',hostile:'#9f3030'};
const svg=d3.select('#world-map');const width=1000,height=620;svg.attr('viewBox',`0 0 ${width} ${height}`);
const projection=d3.geoNaturalEarth1();const path=d3.geoPath(projection);const root=svg.append('g');
const zoom=d3.zoom().scaleExtent([1,12]).on('zoom',e=>root.attr('transform',e.transform));svg.call(zoom);
let features=[];

function territoryPanel(feature){
 const t=territoryByAtlas(feature.id);const info=document.getElementById('map-info');const displayName=t?.name||feature.properties?.name||`Territoire ${feature.id}`;
 if(!t){info.innerHTML=`<p class="kicker">Territoire non configuré</p><h2>${esc(displayName)}</h2><p>Ce pays existe sur la carte mais ne possède pas encore de fiche dans l’administration.</p>`;return}
 const list=(label,arr)=>arr?.length?`<div class="detail-row"><strong>${label}</strong>${arr.map(x=>`<div>• ${esc(x)}</div>`).join('')}</div>`:'';
 info.innerHTML=`<div class="map-flag">${flagHTML(t.flag,t.name)}</div><p class="kicker">${esc(t.status||'neutre')}</p><h2>${esc(t.name)}</h2>
 <div class="detail-list">
 <div class="detail-row"><strong>Relation</strong><span class="status ${esc((t.relation||'normale').toLowerCase())}">${esc(t.relation||'Normale')}</span></div>
 <div class="detail-row"><strong>Propriétaire ou gouvernement</strong>${esc(t.owner||'Non renseigné')}</div>
 <div class="detail-row"><strong>Taxe d’importation</strong>${Number(t.importTax||0).toFixed(1)} %</div>
 <div class="detail-row"><strong>Taxe d’exportation</strong>${Number(t.exportTax||0).toFixed(1)} %</div>
 ${list('Traités et accords',t.treaties)}${list('Organisations',t.organizations)}
 ${t.claims?`<div class="detail-row"><strong>Revendications</strong>${esc(t.claims)}</div>`:''}
 ${t.notes?`<div class="detail-row"><strong>Notes RP</strong>${esc(t.notes)}</div>`:''}
 </div>`;
}
function colorFor(feature){const t=territoryByAtlas(feature.id);return t?STATUS_COLORS[t.status]||STATUS_COLORS.neutre:'#273446'}
async function loadMap(){
 try{
  const world=await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json');
  features=topojson.feature(world,world.objects.countries).features;
  projection.fitExtent([[12,12],[width-12,height-12]],{type:'FeatureCollection',features});
  root.selectAll('path').data(features).join('path').attr('class','country').attr('d',path).attr('fill',colorFor)
   .on('click',(event,d)=>{territoryPanel(d);const [[x0,y0],[x1,y1]]=path.bounds(d);event.stopPropagation();svg.transition().duration(650).call(zoom.transform,d3.zoomIdentity.translate(width/2,height/2).scale(Math.min(8,.85/Math.max((x1-x0)/width,(y1-y0)/height))).translate(-(x0+x1)/2,-(y0+y1)/2))})
   .append('title').text(d=>territoryByAtlas(d.id)?.name||d.properties?.name||d.id);
  document.getElementById('map-status').textContent='Carte chargée • Cliquez sur un pays';
  const wanted=new URLSearchParams(location.search).get('territory');if(wanted){const f=features.find(x=>String(x.id)===String(wanted));if(f){territoryPanel(f);}}
 }catch(e){document.getElementById('map-status').textContent='Impossible de charger la carte. Vérifiez votre connexion.';console.error(e)}
}
function searchMap(){
 const q=document.getElementById('map-search').value.trim().toLowerCase();if(!q)return;
 const f=features.find(x=>((territoryByAtlas(x.id)?.name||x.properties?.name||'').toLowerCase().includes(q)));
 if(!f)return alert('Territoire introuvable.');
 territoryPanel(f);const [[x0,y0],[x1,y1]]=path.bounds(f);svg.transition().duration(650).call(zoom.transform,d3.zoomIdentity.translate(width/2,height/2).scale(Math.min(8,.85/Math.max((x1-x0)/width,(y1-y0)/height))).translate(-(x0+x1)/2,-(y0+y1)/2));
}
document.getElementById('map-search-btn').onclick=searchMap;document.getElementById('map-search').addEventListener('keydown',e=>{if(e.key==='Enter')searchMap()});
document.getElementById('map-reset').onclick=()=>svg.transition().duration(500).call(zoom.transform,d3.zoomIdentity);
loadMap();

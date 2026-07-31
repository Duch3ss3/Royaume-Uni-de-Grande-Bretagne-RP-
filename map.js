const STATUS_COLORS={
  national:'#315f94', allie:'#287a55', neutre:'#6e7681',
  revendique:'#b6903f', hostile:'#9f3030'
};

const MAP_STYLE={
  version:8,
  sources:{
    'dark-raster':{
      type:'raster',
      tiles:[
        'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        'https://b.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        'https://c.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png',
        'https://d.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png'
      ],
      tileSize:256,
      attribution:'© OpenStreetMap © CARTO'
    }
  },
  layers:[{id:'dark-raster',type:'raster',source:'dark-raster'}]
};

const map=new maplibregl.Map({
  container:'maplibre-map', style:MAP_STYLE, center:[3,18], zoom:1.35,
  minZoom:1, maxZoom:9, renderWorldCopies:false
});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');

const statusEl=document.getElementById('map-status');
let regionsData={type:'FeatureCollection',features:[]};
let hoveredId=null;

function regionKey(feature){return `region:${feature.properties.region_id}`}
function linkedTerritory(feature){return territoryByRegionId(regionKey(feature))}
function regionName(feature){return feature.properties?.name||`Région ${feature.properties?.region_id||''}`}
function countryName(feature){return feature.properties?.country_name||'Pays non renseigné'}

function prepareData(data){
  data.features.forEach(feature=>{
    const p=feature.properties||{};
    const territory=territoryByRegionId(regionKey(feature));
    p.map_id=regionKey(feature);
    p.rp_color=territory
      ? (territory.color||STATUS_COLORS[territory.status]||STATUS_COLORS.neutre)
      : (p.region_color_hex||p.country_color||'#737373');
    p.rp_configured=Boolean(territory);
  });
  return data;
}

function flattenCoordinates(coords,out=[]){
  if(Array.isArray(coords)&&typeof coords[0]==='number')out.push(coords);
  else if(Array.isArray(coords))coords.forEach(item=>flattenCoordinates(item,out));
  return out;
}
function boundsFor(feature){
  const bounds=new maplibregl.LngLatBounds();
  flattenCoordinates(feature.geometry.coordinates).forEach(c=>bounds.extend(c));
  return bounds;
}
function itemList(label,items){
  return items?.length?`<div class="detail-row"><strong>${label}</strong>${items.map(x=>`<div>• ${esc(x)}</div>`).join('')}</div>`:'';
}
function showFeature(feature,zoom=true){
  const territory=linkedTerritory(feature);
  const info=document.getElementById('map-info');
  if(zoom){
    const bounds=boundsFor(feature);
    if(!bounds.isEmpty())map.fitBounds(bounds,{padding:55,maxZoom:7,duration:650});
  }
  if(!territory){
    info.innerHTML=`<p class="kicker">Région non configurée</p><h2>${esc(regionName(feature))}</h2>
      <div class="detail-list">
        <div class="detail-row"><strong>Pays</strong>${esc(countryName(feature))}</div>
        <div class="detail-row"><strong>Zone géographique</strong>${esc(feature.properties.geographical_area||'Non renseignée')}</div>
      </div><p>Cette région peut être rattachée à une fiche depuis l’administration.</p>`;
    return;
  }
  const grouped=(territory.regionIds||[]).map(id=>{
    const f=regionsData.features.find(x=>regionKey(x)===String(id));return f?regionName(f):null;
  }).filter(Boolean);
  info.innerHTML=`<div class="map-flag">${flagHTML(territory.flag,territory.name)}</div>
    <p class="kicker">${esc(territory.status||'neutre')}</p><h2>${esc(territory.name)}</h2>
    <div class="detail-list">
      <div class="detail-row"><strong>Région sélectionnée</strong>${esc(regionName(feature))}</div>
      <div class="detail-row"><strong>Propriétaire ou gouvernement</strong>${esc(territory.owner||'Non renseigné')}</div>
      <div class="detail-row"><strong>Relation</strong><span class="status ${esc((territory.relation||'normale').toLowerCase())}">${esc(territory.relation||'Normale')}</span></div>
      <div class="detail-row"><strong>Taxe d’importation</strong>${Number(territory.importTax||0).toFixed(1)} %</div>
      <div class="detail-row"><strong>Taxe d’exportation</strong>${Number(territory.exportTax||0).toFixed(1)} %</div>
      ${itemList('Territoires regroupés',grouped)}
      ${itemList('Traités et accords',territory.treaties)}
      ${itemList('Organisations',territory.organizations)}
      ${territory.claims?`<div class="detail-row"><strong>Revendications</strong>${esc(territory.claims)}</div>`:''}
      ${territory.notes?`<div class="detail-row"><strong>Notes RP</strong>${esc(territory.notes)}</div>`:''}
    </div>`;
}
function searchRegion(){
  const q=document.getElementById('map-search').value.trim().toLowerCase();
  if(!q)return;
  const feature=regionsData.features.find(f=>{
    const territory=linkedTerritory(f);
    return regionName(f).toLowerCase().includes(q)||countryName(f).toLowerCase().includes(q)||(territory?.name||'').toLowerCase().includes(q);
  });
  if(!feature)return alert('Aucune région correspondante.');
  showFeature(feature,true);
}
function openFromQuery(){
  const wanted=new URLSearchParams(location.search).get('territory');
  if(!wanted)return;
  const territory=(getData().territories||[]).find(t=>String(t.id||t.name)===String(wanted)||t.name===wanted);
  const first=territory?.regionIds?.[0];
  const feature=regionsData.features.find(f=>regionKey(f)===String(first));
  if(feature)showFeature(feature,true);
}

map.on('load',async()=>{
  try{
    statusEl.textContent='Chargement des frontières de Projet Résurgence…';
    const response=await fetch('regions.geojson');
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    regionsData=prepareData(await response.json());
    map.addSource('resurgence-regions',{type:'geojson',data:regionsData,promoteId:'map_id'});
    map.addLayer({
      id:'region-fills',type:'fill',source:'resurgence-regions',
      paint:{
        'fill-color':['get','rp_color'],
        'fill-opacity':['case',['boolean',['feature-state','hover'],false],0.96,0.82]
      }
    });
    map.addLayer({
      id:'region-borders',type:'line',source:'resurgence-regions',
      paint:{
        'line-color':['case',['boolean',['feature-state','hover'],false],'#ffffff','#383d43'],
        'line-width':['case',['boolean',['feature-state','hover'],false],2,0.8],
        'line-opacity':1
      }
    });
    map.on('mousemove','region-fills',event=>{
      map.getCanvas().style.cursor='pointer';
      const feature=event.features?.[0];if(!feature)return;
      if(hoveredId!==null)map.setFeatureState({source:'resurgence-regions',id:hoveredId},{hover:false});
      hoveredId=feature.id;map.setFeatureState({source:'resurgence-regions',id:hoveredId},{hover:true});
      statusEl.textContent=`${regionName(feature)} — ${countryName(feature)}`;
    });
    map.on('mouseleave','region-fills',()=>{
      map.getCanvas().style.cursor='';
      if(hoveredId!==null)map.setFeatureState({source:'resurgence-regions',id:hoveredId},{hover:false});
      hoveredId=null;statusEl.textContent=`${regionsData.features.length.toLocaleString('fr-FR')} régions chargées`;
    });
    map.on('click','region-fills',event=>{const feature=event.features?.[0];if(feature)showFeature(feature,true)});
    statusEl.textContent=`${regionsData.features.length.toLocaleString('fr-FR')} régions chargées`;
    openFromQuery();
  }catch(error){
    console.error(error);statusEl.textContent='Impossible de charger regions.geojson.';
  }
});

document.getElementById('map-search-btn').addEventListener('click',searchRegion);
document.getElementById('map-search').addEventListener('keydown',e=>{if(e.key==='Enter')searchRegion()});
document.getElementById('map-reset').addEventListener('click',()=>map.easeTo({center:[3,18],zoom:1.35,duration:650}));

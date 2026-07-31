const MAP_GREY='#858585';
const FILTER_COLORS={
  myCountry:'#315f94',
  claim:'#b6903f',
  ally:'#3f8bd5',
  commerce:'#3aa85a'
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
  container:'maplibre-map',style:MAP_STYLE,center:[3,18],zoom:1.35,
  minZoom:1,maxZoom:9,renderWorldCopies:false
});
map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');

const statusEl=document.getElementById('map-status');
let regionsData={type:'FeatureCollection',features:[]};
let hoveredId=null;
const activeFilters=new Set();

function regionKey(feature){return `region:${feature.properties.region_id}`}
function linkedTerritory(feature){return territoryByRegionId(regionKey(feature))}
function regionName(feature){return feature.properties?.name||`Région ${feature.properties?.region_id||''}`}
function countryName(feature){return feature.properties?.country_name||'Pays non renseigné'}

function colorForTerritory(territory){
  if(!territory)return MAP_GREY;
  if(activeFilters.has('national')){
    if(territory.myCountry)return territory.color||FILTER_COLORS.myCountry;
    if(territory.claim)return FILTER_COLORS.claim;
  }
  if(activeFilters.has('allies')&&territory.economyEnabled&&territory.ally){
    return territory.color||FILTER_COLORS.ally;
  }
  if(activeFilters.has('commerce')&&territory.economyEnabled&&territory.commerce){
    return territory.color||FILTER_COLORS.commerce;
  }
  return MAP_GREY;
}

function prepareData(data){
  data.features.forEach(feature=>{
    const p=feature.properties||{};
    p.map_id=regionKey(feature);
    p.rp_color=MAP_GREY;
  });
  return data;
}

function refreshMapColors(){
  if(!map.getSource('resurgence-regions'))return;
  regionsData.features.forEach(feature=>{
    feature.properties.rp_color=colorForTerritory(linkedTerritory(feature));
  });
  map.getSource('resurgence-regions').setData(regionsData);
  const labels=[];
  if(activeFilters.has('national'))labels.push('mon pays et revendications');
  if(activeFilters.has('allies'))labels.push('alliés');
  if(activeFilters.has('commerce'))labels.push('commerce');
  statusEl.textContent=labels.length?`Filtres actifs : ${labels.join(', ')}`:'Carte vierge • tous les territoires sont gris';
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
function categoryText(t){
  const values=[];
  if(t.myCountry)values.push('Mon pays');
  if(t.claim)values.push('Revendication');
  if(t.ally)values.push('Allié');
  if(t.commerce)values.push('Commerce');
  return values.length?values.join(' • '):'Aucun filtre';
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
        <div class="detail-row"><strong>État de la carte</strong>Territoire vierge</div>
        <div class="detail-row"><strong>Zone géographique</strong>${esc(feature.properties.geographical_area||'Non renseignée')}</div>
      </div><p>Cette région peut être rattachée à une fiche depuis l’administration.</p>`;
    return;
  }
  const grouped=(territory.regionIds||[]).map(id=>{
    const f=regionsData.features.find(x=>regionKey(x)===String(id));return f?regionName(f):null;
  }).filter(Boolean);
  info.innerHTML=`<div class="map-flag">${flagHTML(territory.flag,territory.name)}</div>
    <p class="kicker">${esc(categoryText(territory))}</p><h2>${esc(territory.name)}</h2>
    <div class="detail-list">
      <div class="detail-row"><strong>Région sélectionnée</strong>${esc(regionName(feature))}</div>
      <div class="detail-row"><strong>Propriétaire ou gouvernement</strong>${esc(territory.owner||'Non renseigné')}</div>
      <div class="detail-row"><strong>Relation</strong><span class="status ${esc((territory.relation||'normale').toLowerCase())}">${esc(territory.relation||'Normale')}</span></div>
      ${territory.economyEnabled?`<div class="detail-row"><strong>Taxe d’importation</strong>${Number(territory.importTax||0).toFixed(1)} %</div>
      <div class="detail-row"><strong>Taxe d’exportation</strong>${Number(territory.exportTax||0).toFixed(1)} %</div>`:''}
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

function updateFilterButtons(){
  document.querySelectorAll('.map-filter-btn').forEach(button=>{
    const enabled=activeFilters.has(button.dataset.filter);
    button.classList.toggle('active',enabled);
    button.setAttribute('aria-pressed',String(enabled));
  });
}
document.querySelectorAll('.map-filter-btn').forEach(button=>button.addEventListener('click',()=>{
  const filter=button.dataset.filter;
  activeFilters.has(filter)?activeFilters.delete(filter):activeFilters.add(filter);
  updateFilterButtons();refreshMapColors();
}));
document.getElementById('map-filter-reset').addEventListener('click',()=>{
  activeFilters.clear();updateFilterButtons();refreshMapColors();
});

map.on('load',async()=>{
  try{
    statusEl.textContent='Chargement de la carte vierge…';
    const response=await fetch('regions.geojson');
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    regionsData=prepareData(await response.json());
    map.addSource('resurgence-regions',{type:'geojson',data:regionsData,promoteId:'map_id'});
    map.addLayer({
      id:'region-fills',type:'fill',source:'resurgence-regions',
      paint:{
        'fill-color':['get','rp_color'],
        'fill-opacity':['case',['boolean',['feature-state','hover'],false],0.96,0.86]
      }
    });
    map.addLayer({
      id:'region-borders',type:'line',source:'resurgence-regions',
      paint:{
        'line-color':['case',['boolean',['feature-state','hover'],false],'#ffffff','#414141'],
        'line-width':['case',['boolean',['feature-state','hover'],false],2,0.75],
        'line-opacity':1
      }
    });
    map.on('mousemove','region-fills',event=>{
      map.getCanvas().style.cursor='pointer';
      const feature=event.features?.[0];if(!feature)return;
      if(hoveredId!==null)map.setFeatureState({source:'resurgence-regions',id:hoveredId},{hover:false});
      hoveredId=feature.id;map.setFeatureState({source:'resurgence-regions',id:hoveredId},{hover:true});
      statusEl.textContent=`${regionName(feature)}${linkedTerritory(feature)?` — ${linkedTerritory(feature).name}`:' — territoire vierge'}`;
    });
    map.on('mouseleave','region-fills',()=>{
      map.getCanvas().style.cursor='';
      if(hoveredId!==null)map.setFeatureState({source:'resurgence-regions',id:hoveredId},{hover:false});
      hoveredId=null;refreshMapColors();
    });
    map.on('click','region-fills',event=>{const feature=event.features?.[0];if(feature)showFeature(feature,true)});
    refreshMapColors();openFromQuery();
  }catch(error){
    console.error(error);statusEl.textContent='Impossible de charger regions.geojson.';
  }
});

document.getElementById('map-search-btn').addEventListener('click',searchRegion);
document.getElementById('map-search').addEventListener('keydown',e=>{if(e.key==='Enter')searchRegion()});
document.getElementById('map-reset').addEventListener('click',()=>map.easeTo({center:[3,18],zoom:1.35,duration:650}));

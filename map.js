
const COUNTRY_LAYER='https://gisserver.habitat.org/arcgis/rest/services/World_Countries/FeatureServer/0';
const ADMIN1_LAYER='https://gisserver.habitat.org/arcgis/rest/services/WorldStatesAndProvinces/MapServer/0';

const DETAILED_COUNTRIES=new Set([
 'United States of America','United States','Canada','Mexico','Brazil','Argentina',
 'Russian Federation','Russia','China','India','Australia','Indonesia',
 'Germany','France','Spain','Italy','United Kingdom','Türkiye','Turkey',
 'Iran (Islamic Republic of)','Iran','Saudi Arabia','South Africa','Nigeria',
 'Democratic Republic of the Congo','Ethiopia','Pakistan','Japan'
]);

const STATUS_COLORS={
 national:'#315f94',
 allie:'#287a55',
 neutre:'#6e7681',
 revendique:'#b6903f',
 hostile:'#9f3030'
};

const EMPTY_STYLE={
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
 layers:[{
   id:'dark-raster',
   type:'raster',
   source:'dark-raster',
   minzoom:0,
   maxzoom:19
 }]
};

const map=new maplibregl.Map({
 container:'maplibre-map',
 style:EMPTY_STYLE,
 center:[5,22],
 zoom:1.55,
 minZoom:1.2,
 maxZoom:9,
 renderWorldCopies:false,
 attributionControl:true
});

map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');

const statusEl=document.getElementById('map-status');
let hybridData={type:'FeatureCollection',features:[]};
let hoveredId=null;

async function fetchJson(url){
 const response=await fetch(url);
 if(!response.ok)throw new Error(`HTTP ${response.status}`);
 return response.json();
}

async function queryAll(layerUrl,outFields,chunkSize=400){
 const idsData=await fetchJson(`${layerUrl}/query?where=1%3D1&returnIdsOnly=true&f=json`);
 const ids=idsData.objectIds||[];
 const result=[];
 for(let i=0;i<ids.length;i+=chunkSize){
   const params=new URLSearchParams({
     objectIds:ids.slice(i,i+chunkSize).join(','),
     outFields,
     returnGeometry:'true',
     outSR:'4326',
     maxAllowableOffset:'0.025',
     f:'geojson'
   });
   const data=await fetchJson(`${layerUrl}/query?${params}`);
   result.push(...(data.features||[]));
 }
 return result;
}

function territoryForFeature(feature){
 return territoryByRegionId(String(feature.properties.hybrid_id));
}

function applyRpProperties(feature){
 const t=territoryForFeature(feature);
 feature.properties.rp_color=t?(t.color||STATUS_COLORS[t.status]||STATUS_COLORS.neutre):'#263548';
 feature.properties.rp_configured=Boolean(t);
 feature.properties.rp_name=t?.name||'';
 feature.properties.rp_status=t?.status||'';
 return feature;
}

async function createHybridGeoJSON(){
 statusEl.textContent='Chargement des frontières nationales…';
 const countries=await queryAll(COUNTRY_LAYER,'*');
 const features=[];

 countries.forEach((feature,index)=>{
   const p=feature.properties||{};
   const name=p.COUNTRY||p.CNTRY_NAME||p.NAME||p.ADMIN||`Pays ${index}`;
   if(DETAILED_COUNTRIES.has(name))return;
   p.hybrid_id=`country:${name}`;
   p.hybrid_type='country';
   p.display_name=name;
   p.parent_country=name;
   features.push(applyRpProperties(feature));
 });

 statusEl.textContent='Chargement des régions stratégiques…';
 const admin1=await queryAll(
   ADMIN1_LAYER,
   'FID,adm1_code,iso_3166_2,name,name_fr,name_en,admin,type_en'
 );

 admin1.forEach(feature=>{
   const p=feature.properties||{};
   const country=p.admin||'';
   if(!DETAILED_COUNTRIES.has(country))return;
   p.hybrid_id=`admin1:${p.FID}`;
   p.hybrid_type='admin1';
   p.display_name=p.name_fr||p.name||p.name_en||`Région ${p.FID}`;
   p.parent_country=country;
   features.push(applyRpProperties(feature));
 });

 return {type:'FeatureCollection',features};
}

function displayName(feature){
 return feature.properties?.display_name||'Territoire';
}

function parentCountry(feature){
 return feature.properties?.parent_country||displayName(feature);
}

function flattenCoordinates(coords,output=[]){
 if(typeof coords?.[0]==='number'){
   output.push(coords);
 }else if(Array.isArray(coords)){
   coords.forEach(item=>flattenCoordinates(item,output));
 }
 return output;
}

function featureBounds(feature){
 const coords=flattenCoordinates(feature.geometry.coordinates);
 const bounds=new maplibregl.LngLatBounds();
 coords.forEach(coord=>bounds.extend(coord));
 return bounds;
}

function panelList(label,items){
 if(!items?.length)return '';
 return `<div class="detail-row"><strong>${label}</strong>${items.map(x=>`<div>• ${esc(x)}</div>`).join('')}</div>`;
}

function showFeature(feature,zoom=true){
 const t=territoryForFeature(feature);
 const info=document.getElementById('map-info');

 if(zoom){
   const bounds=featureBounds(feature);
   if(!bounds.isEmpty()){
     map.fitBounds(bounds,{padding:55,maxZoom:6.5,duration:750});
   }
 }

 if(!t){
   info.innerHTML=`
    <p class="kicker">${feature.properties.hybrid_type==='admin1'?'Région':'Pays'} non configuré</p>
    <h2>${esc(displayName(feature))}</h2>
    <div class="detail-list">
      <div class="detail-row"><strong>Pays de rattachement</strong>${esc(parentCountry(feature))}</div>
      <div class="detail-row"><strong>Niveau cartographique</strong>${feature.properties.hybrid_type==='admin1'?'Subdivision régionale':'État entier'}</div>
    </div>
    <p>Ce territoire ne possède pas encore de fiche RP dans l’administration.</p>`;
   return;
 }

 const grouped=(t.regionIds||[]).map(id=>{
   const found=hybridData.features.find(f=>String(f.properties.hybrid_id)===String(id));
   return found?displayName(found):null;
 }).filter(Boolean);

 info.innerHTML=`
  <div class="map-flag">${flagHTML(t.flag,t.name)}</div>
  <p class="kicker">${esc(t.status||'neutre')}</p>
  <h2>${esc(t.name)}</h2>
  <div class="detail-list">
    <div class="detail-row"><strong>Territoire sélectionné</strong>${esc(displayName(feature))}</div>
    <div class="detail-row"><strong>Propriétaire ou gouvernement</strong>${esc(t.owner||'Non renseigné')}</div>
    <div class="detail-row"><strong>Relation</strong><span class="status ${esc((t.relation||'normale').toLowerCase())}">${esc(t.relation||'Normale')}</span></div>
    <div class="detail-row"><strong>Taxe d’importation</strong>${Number(t.importTax||0).toFixed(1)} %</div>
    <div class="detail-row"><strong>Taxe d’exportation</strong>${Number(t.exportTax||0).toFixed(1)} %</div>
    ${panelList('Territoires regroupés',grouped)}
    ${panelList('Traités et accords',t.treaties)}
    ${panelList('Organisations',t.organizations)}
    ${t.claims?`<div class="detail-row"><strong>Revendications</strong>${esc(t.claims)}</div>`:''}
    ${t.notes?`<div class="detail-row"><strong>Notes RP</strong>${esc(t.notes)}</div>`:''}
  </div>`;
}

function findFeature(query){
 const q=query.trim().toLowerCase();
 return hybridData.features.find(feature=>{
   const t=territoryForFeature(feature);
   return displayName(feature).toLowerCase().includes(q)||
          parentCountry(feature).toLowerCase().includes(q)||
          (t?.name||'').toLowerCase().includes(q);
 });
}

function searchFeature(){
 const value=document.getElementById('map-search').value;
 if(!value.trim())return;
 const feature=findFeature(value);
 if(!feature)return alert('Aucun territoire correspondant.');
 showFeature(feature,true);
}

function openFromQuery(){
 const wanted=new URLSearchParams(location.search).get('territory');
 if(!wanted)return;
 const t=(getData().territories||[]).find(item=>
   String(item.id||item.name)===String(wanted)||String(item.name)===String(wanted)
 );
 const id=t?.regionIds?.[0];
 const feature=hybridData.features.find(f=>String(f.properties.hybrid_id)===String(id));
 if(feature)showFeature(feature,true);
}

map.on('load',async()=>{
 try{
   hybridData=await createHybridGeoJSON();

   map.addSource('territories',{
     type:'geojson',
     data:hybridData,
     promoteId:'hybrid_id'
   });

   map.addLayer({
     id:'territory-fills',
     type:'fill',
     source:'territories',
     paint:{
       'fill-color':['get','rp_color'],
       'fill-opacity':[
         'case',
         ['boolean',['feature-state','hover'],false],0.94,
         ['boolean',['get','rp_configured']],0.82,
         0.66
       ]
     }
   });

   map.addLayer({
     id:'territory-lines',
     type:'line',
     source:'territories',
     paint:{
       'line-color':[
         'case',
         ['boolean',['feature-state','hover'],false],'#ffffff',
         '#aab2bd'
       ],
       'line-width':[
         'case',
         ['boolean',['feature-state','hover'],false],1.8,
         ['==',['get','hybrid_type'],'country'],0.85,
         0.55
       ],
       'line-opacity':0.95
     }
   });

   map.on('mousemove','territory-fills',event=>{
     map.getCanvas().style.cursor='pointer';
     if(!event.features?.length)return;
     const feature=event.features[0];
     if(hoveredId!==null){
       map.setFeatureState({source:'territories',id:hoveredId},{hover:false});
     }
     hoveredId=feature.id;
     map.setFeatureState({source:'territories',id:hoveredId},{hover:true});
     statusEl.textContent=`${displayName(feature)} — ${parentCountry(feature)}`;
   });

   map.on('mouseleave','territory-fills',()=>{
     map.getCanvas().style.cursor='';
     if(hoveredId!==null){
       map.setFeatureState({source:'territories',id:hoveredId},{hover:false});
     }
     hoveredId=null;
     statusEl.textContent=`Carte MapLibre chargée • ${hybridData.features.length.toLocaleString('fr-FR')} territoires cliquables`;
   });

   map.on('click','territory-fills',event=>{
     const feature=event.features?.[0];
     if(feature)showFeature(feature,true);
   });

   statusEl.textContent=`Carte MapLibre chargée • ${hybridData.features.length.toLocaleString('fr-FR')} territoires cliquables`;
   openFromQuery();
 }catch(error){
   console.error(error);
   statusEl.textContent='Impossible de charger les frontières. Vérifiez la connexion Internet.';
 }
});

document.getElementById('map-search-btn').addEventListener('click',searchFeature);
document.getElementById('map-search').addEventListener('keydown',event=>{
 if(event.key==='Enter')searchFeature();
});
document.getElementById('map-reset').addEventListener('click',()=>{
 map.easeTo({center:[5,22],zoom:1.55,duration:700});
});

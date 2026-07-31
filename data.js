const DEFAULT_DATA={territories:[],publications:[],government:[]};
function getData(){try{return {...DEFAULT_DATA,...JSON.parse(localStorage.getItem('uk2308_data')||'{}')}}catch(e){return structuredClone(DEFAULT_DATA)}}
function setData(d){localStorage.setItem('uk2308_data',JSON.stringify(d))}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function flagHTML(value,name){
 if(!value) return '<span style="font-size:1.7rem;margin-right:10px">🏳️</span>';
 if(/^data:image|https?:|\.png$|\.jpg$|\.jpeg$|\.webp$|\.svg$/.test(value)) return `<img class="country-flag" src="${esc(value)}" alt="Drapeau de ${esc(name)}">`;
 return `<span style="font-size:1.7rem;vertical-align:middle;margin-right:10px">${esc(value)}</span>`;
}
function personImage(person,cls){
 if(person.image) return `<img class="${cls}" src="${esc(person.image)}" alt="Portrait de ${esc(person.name)}">`;
 return `<div class="${cls} placeholder-photo">♛</div>`;
}
function lines(value){return String(value||'').split(/\n+/).map(x=>x.trim()).filter(Boolean)}
function territoryByRegionId(id){
 return (getData().territories||[]).find(t=>(t.regionIds||[]).map(String).includes(String(id)));
}
function territoryByAtlas(id){return territoryByRegionId(id)}


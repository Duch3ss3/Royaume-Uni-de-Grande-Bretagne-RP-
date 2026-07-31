const DEFAULT_DATA={economy:[],publications:[],ministers:[],diplomacy:[]};
function getData(){try{return {...DEFAULT_DATA,...JSON.parse(localStorage.getItem('uk2308_data')||'{}')}}catch(e){return structuredClone(DEFAULT_DATA)}}
function setData(d){localStorage.setItem('uk2308_data',JSON.stringify(d))}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function flagHTML(value,name){
 if(!value) return '<span class="country-flag" style="display:inline-grid;place-items:center;background:#eee">🏳️</span>';
 if(/^https?:|\.png$|\.jpg$|\.svg$/.test(value)) return `<img class="country-flag" src="${esc(value)}" alt="Drapeau de ${esc(name)}">`;
 return `<span style="font-size:1.7rem;vertical-align:middle;margin-right:10px">${esc(value)}</span>`;
}

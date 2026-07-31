document.querySelectorAll('.navinner a').forEach(a=>{
  const here=location.pathname.split('/').pop()||'index.html';
  if(a.getAttribute('href')===here) a.classList.add('active');
});

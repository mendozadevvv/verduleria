
document.addEventListener('DOMContentLoaded',()=>{
  const grid = document.getElementById('gridProducts');
  if(!grid) return;
  const wrap = document.createElement('div');
  wrap.id='catalogScroll';
  grid.parentNode.insertBefore(wrap, grid);
  wrap.appendChild(grid);
});

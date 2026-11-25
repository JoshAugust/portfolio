(function(){
const App = window.App, $ = App.$;
const NAV = [['#/','Home','⌂'],['#/learn','Learn','▤'],['#/figures','Key figures','№'],['#/practice','Practice','✎'],['#/mock','Mock exam','◷'],['#/mistakes','Weak spots','◎'],['#/cards','Fact drill','▣'],['#/sources','Sources','✓']];
App.refreshNav = function(){
  const h = location.hash || '#/'; const open = App.load() && App.mistakes().length;
  $('#navlinks').innerHTML = NAV.map(([href,l,ic]) => { const on = href === '#/' ? (h === '#/' || h === '') : (h.startsWith(href) || (href === '#/practice' && h === '#/run')); return `<a href="${href}" class="${on?'on':''}"><span aria-hidden="true">${ic}</span>${l}${href === '#/mistakes' && open ? `<span class="badge">${open}</span>` : ''}</a>`; }).join('');
};
App.route = function(){
  const view = $('#view'); const raw = (location.hash || '#/').slice(2); const parts = raw.split('/'); const name = parts[0] || 'home';
  window.scrollTo(0, 0);
  if (name !== 'run') { App.run && !App.run.submitted && App.run.kind === 'mock' ? 0 : 0; }
  try {
    if (name === 'run') App.renderRun(view);
    else if (name === 'cards') App.views.cards(view);
    else if (App.views[name]) App.views[name](view, parts);
    else App.views.home(view);
  } catch (e) { view.innerHTML = `<div class="card"><h2>Something went wrong</h2><pre style="white-space:pre-wrap">${App.esc(e.stack || e)}</pre></div>`; console.error(e); }
  App.refreshNav();
};
window.addEventListener('hashchange', App.route);
$('#searchform').addEventListener('submit', e => { e.preventDefault(); const q = $('#searchbox').value.trim(); if (q) location.hash = '#/search/' + encodeURIComponent(q); });
App.load(); App.route();
})();

(function(){
const App = window.App, $ = App.$;
const GROUPS = {
  learn:  { href:'#/learn',    label:'Learn',  icon:'▤', tabs:[['#/learn','Topics',['learn','search']],['#/figures','Key figures',['figures']],['#/ranges','Ranges',['ranges']]] },
  test:   { href:'#/practice', label:'Test',   icon:'✎', tabs:[['#/practice','Quizzes',['practice']],['#/mock','Exams',['mock']]] },
  review: { href:'#/cards',    label:'Review', icon:'◎', tabs:[['#/cards','Drill',['cards']],['#/mistakes','Weak spots',['mistakes']],['#/plan','Revision plan',['plan']],['#/history','Results',['history']]] }
};
const NAV = [['home','#/','Home','⌂'], ['learn'], ['test'], ['review'], ['ask','#','Ask','✦'], ['sources','#/sources','More','✓']];
const groupOf = name => Object.keys(GROUPS).find(k => GROUPS[k].tabs.some(t => t[2].includes(name)) || (k === 'test' && name === 'run'));
App.refreshNav = function(){
  const name = ((location.hash || '#/').slice(2).split('/')[0]) || 'home'; const open = App.load() && App.mistakes().length; const g = groupOf(name);
  $('#navlinks').innerHTML = NAV.map(n => { let key = n[0], href, label, icon;
    if (GROUPS[key]) { href = GROUPS[key].href; label = GROUPS[key].label; icon = GROUPS[key].icon; } else { [, href, label, icon] = n; }
    const on = GROUPS[key] ? g === key : (key === 'home' ? name === 'home' : name === key);
    return `<a href="${href}" class="${on ? 'on' : ''}"><span aria-hidden="true">${icon}</span>${label}${key === 'review' && open ? `<span class="badge">${open}</span>` : ''}</a>`; }).join('');
};
function subnav(name){
  const g = groupOf(name); if (!g || name === 'run') return '';
  return `<nav class="subnav" aria-label="${GROUPS[g].label} sections">${GROUPS[g].tabs.map(t => `<a href="${t[0]}" class="${t[2].includes(name) ? 'on' : ''}">${t[1]}${t[0] === '#/plan' && (App.load().plan || []).length ? ` <span class="n">${App.load().plan.length}</span>` : ''}</a>`).join('')}</nav>`;
}
App.route = function(){
  const view = $('#view'); const raw = (location.hash || '#/').slice(2); const parts = raw.split('/'); const name = parts[0] || 'home';
  window.scrollTo(0, 0);
  if (!App.storageOK && !$('#savewarn')) view.insertAdjacentHTML('beforebegin', '<div class="banner save" id="savewarn" style="margin:12px 28px 0">Your browser is blocking storage, so progress cannot be saved here. Use a normal (not private) window, or allow site data for this page.</div>');
  try {
    if (name === 'run') App.renderRun(view);
    else if (name === 'cards') App.views.cards(view);
    else if (App.views[name]) App.views[name](view, parts);
    else App.views.home(view);
  } catch (e) { view.innerHTML = `<div class="card"><h2>Something went wrong</h2><pre style="white-space:pre-wrap">${App.esc(e.stack || e)}</pre></div>`; console.error(e); }
  if (!(name === 'cards' && App.cardRun && App.cardRun.i < App.cardRun.ids.length)) view.insertAdjacentHTML('afterbegin', subnav(name));
  App.refreshNav();
  const st = App.load().settings; if (!st.tipSeen && ['learn','figures','run'].includes(name)) { st.tipSeen = true; App.save(); setTimeout(() => App.toast('Tip: highlight any text to add it to your revision plan'), 900); }
};
function applyTheme(t){ if (t) document.documentElement.setAttribute('data-theme', t); else document.documentElement.removeAttribute('data-theme'); }
$('#themebtn').onclick = () => { const cur = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'; const nx = cur === 'light' ? 'dark' : 'light'; applyTheme(nx); try { localStorage.setItem('hksi.theme', nx); } catch(e){} };
$('#tourbtn').onclick = () => App.startTour();
window.addEventListener('hashchange', App.route);
$('#searchform').addEventListener('submit', e => { e.preventDefault(); const q = $('#searchbox').value.trim(); if (q) location.hash = '#/search/' + encodeURIComponent(q); });
App.load(); App.route();
})();

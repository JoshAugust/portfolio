/* Key figures: every number, threshold, penalty and time limit from the guide, with a cover-and-recall mode and a drill. */
(function(){
const App = window.App, D = App.D, esc = App.esc, $ = App.$;
const F = D.figures || [];
const CATS = ["Disclosure & shareholding thresholds","Penalties (fines & imprisonment)","Time limits & deadlines","Capital, liquidity & financial resources","Client money, assets & records","People, quorum & voting","Fees, levies & trading limits","Other key numbers"];
App.figures = F;
App.figureById = id => F.find(f => f.id === id);
const ui = { topic:'all', cat:'all', q:'', cover:false, hideKnown:false };
function known(){ const s = App.load(); return s.figKnown || (s.figKnown = {}); }

App.views.figures = function(view){
  const kn = known(); const nKnown = F.filter(f => kn[f.id]).length;
  const list = F.filter(f => (ui.topic === 'all' || f.topic === +ui.topic) && (ui.cat === 'all' || f.category === ui.cat)
    && (!ui.hideKnown || !kn[f.id])
    && (!ui.q || (f.subject + ' ' + f.figure + ' ' + f.detail + ' ' + f.law + ' ' + f.quote).toLowerCase().includes(ui.q.toLowerCase())));
  const count = c => F.filter(f => (ui.topic === 'all' || f.topic === +ui.topic) && f.category === c).length;
  const groups = CATS.map(c => [c, list.filter(f => f.category === c)]).filter(g => g[1].length);
  view.innerHTML = `
  <div class="row" style="align-items:flex-end"><div><h1>Key figures</h1>
  <p class="lead" style="margin:6px 0 0">Every threshold, penalty, time limit and amount stated in the guide, in one place. ${F.length} figures, each with the exact page it comes from.</p></div></div>
  <div class="card" style="margin:16px 0">
    <div class="row" style="gap:14px;flex-wrap:wrap">
      <div class="stat"><b>${nKnown} / ${F.length}</b><span>marked as known</span></div>
      <div class="bar" style="flex:1;min-width:140px"><i style="width:${App.pct(nKnown, F.length)}%"></i></div>
      <button class="btn primary" id="fgdrill">Drill ${list.length < F.length ? 'these ' + Math.min(list.length, 30) : '30'} figures</button>
      <button class="btn" id="fgcover">${ui.cover ? 'Show all answers' : 'Cover answers (self-test)'}</button>
    </div>
    <div class="row" style="margin-top:12px;gap:10px;flex-wrap:wrap">
      <input id="fgq" type="search" class="inp" placeholder="Filter, e.g. 5%, imprisonment, days…" value="${esc(ui.q)}" style="flex:1;min-width:200px">
      <select id="fgt" class="inp" aria-label="Topic"><option value="all">All topics</option><option value="0" ${ui.topic === '0' ? 'selected' : ''}>Exam facts and weights</option>${D.topics.map(t => `<option value="${t.id}" ${+ui.topic === t.id ? 'selected' : ''}>Topic ${t.id}: ${esc(t.short)}</option>`).join('')}</select>
      <label class="small muted" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="fgk" ${ui.hideKnown ? 'checked' : ''}> hide the ones I know</label>
    </div>
    <div class="row" style="margin-top:12px;gap:6px;flex-wrap:wrap">
      <button class="pill ${ui.cat === 'all' ? 'on' : ''}" data-cat="all">All</button>
      ${CATS.map(c => `<button class="pill ${ui.cat === c ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)} <span class="muted">${count(c)}</span></button>`).join('')}
    </div>
  </div>
  ${groups.length ? groups.map(([c, items]) => `<h2 style="margin:26px 0 10px">${esc(c)} <span class="muted small" style="font-weight:500">${items.length}</span></h2>
    <div class="fgtable">${items.map(f => row(f, kn)).join('')}</div>`).join('') : '<p class="empty">No figures match that filter.</p>'}
  <p class="muted small" style="margin-top:26px">Every figure above is stated in Study Guide v3.5; the quoted wording is machine-checked against the guide text. Always confirm the exact wording in the guide before the exam, since small changes (for example "and" versus "or") can change a rule.</p>`;
  $('#fgq').oninput = e => { ui.q = e.target.value; const p = e.target.selectionStart; App.views.figures(view); const i = $('#fgq'); i.focus(); i.setSelectionRange(p, p); };
  $('#fgt').onchange = e => { ui.topic = e.target.value; App.views.figures(view); };
  $('#fgk').onchange = e => { ui.hideKnown = e.target.checked; App.views.figures(view); };
  $('#fgcover').onclick = () => { ui.cover = !ui.cover; App.views.figures(view); };
  $('#fgdrill').onclick = () => App.startCards(App.shuffle(list).slice(0, 30).map(f => 'FG:' + f.id));
  view.querySelectorAll('[data-cat]').forEach(b => b.onclick = () => { ui.cat = b.dataset.cat; App.views.figures(view); });
  view.querySelectorAll('.fgrow').forEach(r => {
    const id = r.dataset.id;
    r.querySelector('.fgk').onchange = e => { const k = known(); e.target.checked ? k[id] = Date.now() : delete k[id]; App.save(); App.views.figures(view); };
    const cv = r.querySelector('.fgcover'); if (cv) cv.onclick = () => { r.classList.add('open'); cv.remove(); };
  });
};
function row(f, kn){
  const cov = ui.cover && !kn[f.id];
  return `<div class="fgrow ${kn[f.id] ? 'done' : ''} ${cov ? '' : 'open'}" data-id="${f.id}">
    <div class="fgsubj"><b>${esc(f.subject)}</b><div class="row small" style="gap:6px;margin-top:4px">${App.chip(f.topic ? 'Topic ' + f.topic : 'Exam facts', 'acc')}${f.law ? `<span class="muted">${esc(f.law)}</span>` : ''}<a class="cite" data-page="${f.pdf_page}" href="#">p.${esc(App.pageLabel(f.pdf_page))}</a></div></div>
    <div class="fgans">${cov ? `<button class="fgcover btn sm">Reveal</button>` : ''}<div class="fgbody"><div class="fgnum">${esc(f.figure)}</div><div class="fgdetail">${esc(f.detail)}</div>${f.trap ? `<div class="trap"><b>Don't confuse:</b> ${esc(f.trap)}</div>` : ''}<div class="quote">“${esc(f.quote)}”</div></div></div>
    <label class="fgknown small muted"><input type="checkbox" class="fgk" ${kn[f.id] ? 'checked' : ''}> known</label></div>`;
}
const baseCard = App.cardData;
App.cardData = function(id){
  if (id.startsWith('FG:')) { const f = App.figureById(id.slice(3)); return f && { id, kind:'kc', topic:f.topic, head:'Key figure · ' + f.category, q:f.subject + (f.law ? ' (' + f.law + ')' : '') + ' — what is the figure?', a:'**' + f.figure + '**\n' + f.detail + (f.trap ? '\n\nDon\'t confuse: ' + f.trap : ''), page:f.pdf_page }; }
  return baseCard(id);
};
})();

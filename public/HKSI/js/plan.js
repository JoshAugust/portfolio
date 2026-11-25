/* Revision plan: highlight any text and add it, with context, to a stack you can revise later. */
(function(){
const App = window.App, $ = App.$, esc = App.esc, D = App.D;
const plan = () => { const s = App.load(); return s.plan || (s.plan = []); };
App.planItems = plan;
const KEY = id => 'PL:' + id;

/* ---------- capture ---------- */
function elOf(n){ return n.nodeType === 1 ? n : n.parentElement; }
function pickCite(scope, range){
  const cites = [...scope.querySelectorAll('.cite[data-page]')]; if (!cites.length) return null;
  const after = cites.find(c => range.comparePoint(c, 0) > 0); if (after) return after;
  const before = cites.filter(c => range.comparePoint(c, 0) < 0); return before[before.length - 1] || cites[0];
}
function contextFor(range, text){
  const node = elOf(range.commonAncestorContainer), view = $('#view');
  const near = node.closest('li,p,td,.fact,.fgrow,.quote,.qstem,.verdict') || node;
  const wide = node.closest('.fact,.fgrow,.explain,.card,.md') || view;
  const cite = pickCite(near, range) || pickCite(wide, range);
  let page = cite ? +cite.dataset.page : null;
  const hs = [...view.querySelectorAll('h1,h2,h3,.h-sec,summary')].filter(h => h.compareDocumentPosition(node) & Node.DOCUMENT_POSITION_FOLLOWING || h.contains(node));
  let title = hs.length ? hs[hs.length - 1].textContent.trim().replace(/\s+/g, ' ').slice(0, 90) : '';
  const hash = location.hash || '#/'; let topic = null, where = 'Study tool', href = hash, qid = null;
  let m;
  if ((m = hash.match(/^#\/learn\/(\d)/))) { topic = +m[1]; where = 'Learn · Topic ' + topic; }
  else if (hash.startsWith('#/figures')) { const row = node.closest('.fgrow'); const f = row && App.figureById && App.figureById(row.dataset.id); if (f) { topic = f.topic || null; page = page || f.pdf_page; title = f.subject; } where = 'Key figures'; }
  else if (hash === '#/run' && App.run) { const q = App.qById(App.run.ids[App.run.i]); if (q) { qid = q.id; topic = q.topics[0] || null; where = 'Question · ' + q.srcLabel; title = q.stem.length > 90 ? q.stem.slice(0, 90) + '…' : q.stem; href = topic ? '#/learn/' + topic : '#/practice'; } }
  else if (hash.startsWith('#/search')) where = 'Search';
  if (!topic && page) topic = App.topicOfPage(page);
  return { page, topic, where, title, href, qid };
}
App.addToPlan = function(text, ctx){
  text = text.replace(/\s+/g, ' ').trim(); const L = plan();
  if (L.some(x => x.text === text)) { App.toast('Already in your revision plan'); return false; }
  L.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), text, note:'', ctx, ts:Date.now() }); App.save();
  App.toast(`Added to your revision plan (${L.length})`); App.refreshNav && App.refreshNav(); return true;
};

/* ---------- selection popover ---------- */
let pop = null, current = null, timer = null;
function hide(){ if (pop) pop.hidden = true; current = null; }
function check(){
  const sel = getSelection();
  if (!sel || sel.isCollapsed || !sel.rangeCount) return hide();
  const text = sel.toString().replace(/\s+/g, ' ').trim();
  if (text.length < 6 || text.length > 700) return hide();
  const range = sel.getRangeAt(0), view = $('#view');
  const a = elOf(range.startContainer), b = elOf(range.endContainer);
  if (!view.contains(a) || !view.contains(b) || a.closest('input,textarea,select,#selpop,.tour-pop,#modal') || b.closest('input,textarea,select')) return hide();
  if (!pop) {
    pop = document.createElement('button'); pop.id = 'selpop'; pop.type = 'button'; pop.innerHTML = '<span>＋</span> Add to revision plan';
    pop.addEventListener('mousedown', e => e.preventDefault());
    pop.addEventListener('click', () => { if (!current) return; App.addToPlan(current.text, current.ctx); getSelection().removeAllRanges(); hide(); });
    document.body.appendChild(pop);
  }
  const rects = range.getClientRects(); const r = rects.length ? rects[rects.length - 1] : range.getBoundingClientRect();
  current = { text, ctx: contextFor(range, text) };
  pop.hidden = false; const w = pop.offsetWidth || 190, h = pop.offsetHeight || 38;
  let top = r.top - h - 10, left = r.left + r.width / 2 - w / 2; if (top < 8) top = r.bottom + 10;
  pop.style.top = Math.max(8, Math.min(top, innerHeight - h - 8)) + 'px'; pop.style.left = Math.max(8, Math.min(left, innerWidth - w - 8)) + 'px';
}
document.addEventListener('selectionchange', () => { clearTimeout(timer); timer = setTimeout(check, 220); });
addEventListener('scroll', () => { if (pop && !pop.hidden) check(); }, { passive:true });
addEventListener('hashchange', hide);

/* ---------- drill cards for plan items ---------- */
const baseCard = App.cardData;
App.cardData = function(id){
  if (id.startsWith('PL:')) {
    const it = plan().find(x => KEY(x.id) === id); if (!it) return null; const c = App.cloze(it.text);
    return { id, kind:'fact', topic:it.ctx.topic || 0, head: it.ctx.title ? 'From: ' + it.ctx.title : 'Saved for revision', html:c.html, blanks:c.n, fact:it.text, quote:'', page:it.ctx.page || null, trap:it.note || '', type:'saved' };
  }
  return baseCard(id);
};
const baseDue = App.dueCards;
App.dueCards = function(){
  const s = App.load(), seen = s.cards || {}; const ids = baseDue();
  plan().forEach(x => { if (!seen[KEY(x.id)] && !ids.includes(KEY(x.id))) ids.push(KEY(x.id)); });
  return ids.filter(id => !id.startsWith('PL:') || plan().some(x => KEY(x.id) === id));
};

/* ---------- the plan page ---------- */
const ui = { topic:'all' };
function status(it){
  const c = App.load().cards[KEY(it.id)]; if (!c) return ['New', 'info'];
  const d = Math.ceil((c.due - Date.now()) / 864e5);
  return c.due <= Date.now() ? ['Due now', 'warn'] : [`Next review in ${d} day${d === 1 ? '' : 's'}`, 'good'];
}
App.views.plan = function(view){
  const L = plan().slice().reverse(); const topics = [...new Set(L.map(x => x.ctx.topic || 0))].sort((a, b) => a - b);
  const list = L.filter(x => ui.topic === 'all' || (x.ctx.topic || 0) === +ui.topic);
  const due = L.filter(x => status(x)[0] === 'Due now' || status(x)[0] === 'New');
  view.innerHTML = `<div class="row" style="align-items:flex-end"><div><h1>Revision <em>plan</em></h1>
  <p class="lead" style="margin:6px 0 0">Anything you highlight and add lands here, with where it came from. Come back to revise it, or test yourself on it.</p></div></div>
  ${L.length ? `<div class="card" style="margin:16px 0"><div class="row" style="gap:14px">
    <div class="stat"><b>${L.length}</b><span>saved</span></div><div class="stat"><b>${due.length}</b><span>due for revision</span></div><span class="sp"></span>
    <button class="btn primary" id="pldue" ${due.length ? '' : 'disabled'}>Revise ${due.length} due</button><button class="btn" id="plall">Test me on all</button><button class="btn" id="plcopy">Copy as text</button></div>
    ${topics.length > 1 ? `<div class="row" style="margin-top:12px;gap:6px"><button class="pill ${ui.topic === 'all' ? 'on' : ''}" data-t="all">All</button>${topics.map(t => `<button class="pill ${ui.topic === String(t) ? 'on' : ''}" data-t="${t}">${t ? 'Topic ' + t : 'Other'}</button>`).join('')}</div>` : ''}</div>
  <div class="plan-list">${list.map(it => { const [st, k] = status(it); const c = it.ctx;
    return `<div class="card plan-item" data-id="${it.id}"><blockquote class="plan-text">${esc(it.text)}</blockquote>
      <div class="row small" style="gap:8px;margin:8px 0">${c.topic ? App.chip('Topic ' + c.topic, 'acc') : ''}${App.chip(st, k)}${c.page ? `<a class="cite" data-page="${c.page}" href="#">p.${esc(App.pageLabel(c.page))}</a>` : ''}<span class="muted">${esc(c.where || '')}${c.title ? ' · ' + esc(c.title) : ''}</span></div>
      <textarea class="input plan-note" rows="1" placeholder="Add a note (why this matters, how to remember it)…">${esc(it.note)}</textarea>
      <div class="row" style="margin-top:8px"><button class="btn sm" data-a="one">Test me on this</button>${c.href && c.href !== '#/run' ? `<a class="btn sm ghost" href="${esc(c.href)}">Open where I found it</a>` : ''}<span class="sp"></span><button class="btn sm ghost" data-a="del">Remove</button></div></div>`; }).join('')}</div>`
  : `<div class="card empty" style="margin-top:18px"><b>Nothing here yet.</b><p class="muted">Select any sentence while you learn, practise or read an explanation, then tap <b>Add to revision plan</b>. It is saved here with its topic, guide page and where you found it.</p><a class="btn primary" href="#/learn">Start learning</a></div>`}`;
  view.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { ui.topic = b.dataset.t; App.views.plan(view); });
  const ids = rows => rows.map(x => KEY(x.id));
  $('#pldue') && ($('#pldue').onclick = () => App.startCards(App.shuffle(ids(due))));
  $('#plall') && ($('#plall').onclick = () => App.startCards(App.shuffle(ids(list))));
  $('#plcopy') && ($('#plcopy').onclick = () => { const t = L.slice().reverse().map((x, i) => `${i + 1}. ${x.text}\n   [${x.ctx.topic ? 'Topic ' + x.ctx.topic : 'Other'}${x.ctx.page ? ', guide p.' + App.pageLabel(x.ctx.page) : ''}${x.ctx.title ? ' · ' + x.ctx.title : ''}]${x.note ? '\n   Note: ' + x.note : ''}`).join('\n\n'); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => App.toast('Plan copied'), () => App.toast('Could not copy')); });
  view.querySelectorAll('.plan-item').forEach(el => {
    const id = el.dataset.id, it = plan().find(x => x.id === id);
    const ta = el.querySelector('.plan-note'); const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; }; fit(); ta.oninput = fit; ta.onblur = () => { if (ta.value !== it.note) { it.note = ta.value; App.save(); } };
    el.querySelector('[data-a="one"]').onclick = () => App.startCards([KEY(id)]);
    el.querySelector('[data-a="del"]').onclick = () => { const s = App.load(); s.plan = plan().filter(x => x.id !== id); delete s.cards[KEY(id)]; App.save(); App.refreshNav(); App.views.plan(view); };
  });
};
})();

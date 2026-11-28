/* Ranges: memory views built on the verified key figures.
   1. Deadline range chart — time limits as a poker-style grid: each rule is a tile, the tile's
      "suit" is its number, the grid's shape is the thing you learn. Cover mode ghosts every
      number (tiles and row heads) and leaves the shape for self-testing; tap a tile to reveal.
   2. Penalty board — the real fine/jail numbers as regime-coloured tiles on a fine×jail grid.
   3. The Orphanage — figures whose value appears at most twice anywhere: brute-force these.
   Everything is computed from D.figures (machine-checked against the guide); nothing is hand-maintained. */
(function(){
const App = window.App, D = App.D, esc = App.esc, $ = App.$;
const F = D.figures || [];
const ui = { covTL: false, covPen: false, hideOrph: false, revealed: {} };
function known(){ const s = App.load(); return s.figKnown || (s.figKnown = {}); }

/* ---------- 1. deadline range chart ---------- */
const ROWS = [
  ['r0','Same time · immediately'],['r1','ASAP · reasonably practicable'],['r2','Same day · intraday · daily'],
  ['r3','1 day (business)'],['r4','2 days · T+2'],['r5','3 days'],['r6','7 days'],['r7','10–15 days'],
  ['r8','28–40 days'],['r9','5 weeks'],['r10','1 month'],['r11','2–3 months'],['r12','4 months'],
  ['r13','6 months'],['r14','9 months'],['rF','Monthly · half-yearly'],['r15','12–24 months · annual'],
  ['r16','2–3 years'],['r17','5 years'],['r18','7–10 years'],['r19','Other / odd'],
];
function rowOf(v){
  const s = v.toLowerCase();
  if (/same time|immediatel|without delay|promptly/.test(s)) return 'r0';
  if (/as soon as|reasonably practicable|shortly after|as soon as reasonable/.test(s)) return 'r1';
  if (/09:|9:15|12:00|13:00|16:0|16:1|every 15|first 15|last 20|within 1 minute|within 15 minutes|within 1 hour|commencement of trading|on the day the options|t-1|current day|balance as at|daily|end of trading day|cooling-off/.test(s)) return 'r2';
  if (/1 business day|one business day|that business day|next business day|within one day|one day \(no roll|t\+1|trade day/.test(s)) return 'r3';
  if (/2 business day|2nd business day|two business day|2 trading day|t\+2/.test(s)) return 'r4';
  if (/3 business day|normally 3|t\+3|three (hong kong )?(trading|business)/.test(s)) return 'r5';
  if (/7 business day|seven (business )?days|within 7 days|a week after/.test(s)) return 'r6';
  if (/10 business day|ten days|14 days|15 days/.test(s)) return 'r7';
  if (/28 days|30 days|40 days|180 days/.test(s)) return 'r8';
  if (/5 weeks/.test(s)) return 'r9';
  if (/one month|1 month|a calendar month/.test(s)) return 'r10';
  if (/3 months|three months/.test(s)) return 'r11';
  if (/4 months|four months/.test(s)) return 'r12';
  if (/6 months|six months/.test(s)) return 'r13';
  if (/9 months/.test(s)) return 'r14';
  if (/monthly|half-yearly/.test(s)) return 'rF';
  if (/12 months|annual|yearly|1 year|18 months|24 months|within a year/.test(s)) return 'r15';
  if (/2 years|two years|3 financial years|36 months|not less than 1 year/.test(s)) return 'r16';
  if (/5 years/.test(s)) return 'r17';
  if (/7 years|10 years/.test(s)) return 'r18';
  return 'r19';
}
const COLS = [
  ['cA','Notify / file with the SFC','acc'],['cB','Client-facing','info'],['cC','Company & filings','good'],
  ['cD','Exchange & settlement','warn'],['cE','Records & retention','bad'],['cF','Conduct & other','neu'],
];
function colOf(f){
  const t = (f.subject + ' ' + (f.detail || '')).toLowerCase();
  if (/record|retention|keep|keeping|preserve|reconcil|register of/.test(t)) return 'cE';
  if (/(notify|inform|advis|report|submit|submission|provide|tell)[^,;]{0,60}\b(sfc|hkma|financial secretary|regulator)\b/.test(t)) return 'cA';
  if (/client|discretionary|contract note|statement of account|receipt|risk disclosure|unsolicited|cold-call|suitability|customer|written authority|confirmation/.test(t)) return 'cB';
  if (/agm|resolution|winding|solvency|auditor|accounts|registrar|incorporat|compan(y|ies)|director|general meeting|financial year|prospectus|listing document|sponsor/.test(t)) return 'cC';
  if (/sehk|hkex|exchange|settlement|trading|order|short position|participant|connect|northbound|southbound|cts|closing|stock|options|pricing|research|fair value|market|ipo/.test(t)) return 'cD';
  return 'cF';
}
const timeLimits = F.filter(f => f.category === 'Time limits & deadlines');
function gridData(){
  const cells = {};
  timeLimits.forEach(f => { const r = rowOf(f.figure), c = colOf(f); (cells[r] = cells[r] || {}); (cells[r][c] = cells[r][c] || []).push(f); });
  return cells;
}
/* the tile's chip: the rule's own timing wording, kept specific — never a bare abstraction */
function chipText(figure){
  let s = figure.trim();
  if (/^T\+\d/i.test(s)) return s.match(/^T\+\d/i)[0];
  s = s.replace(/^(within|no later than|not later than)\s+/i, '');
  if (s.length > 34) s = s.slice(0, 33).replace(/\s\S*$/, '') + '…';
  return s;
}
function rowNum(r, rl){ return rl.split('·')[0].trim(); }
const shortSub = s => s.length > 72 ? s.slice(0, 71).replace(/\s\S*$/, '') + '…' : s;
function tileHTML(f, tint, kind, kn){
  const num = kind === 'pen' ? penShort(f.figure) : chipText(f.figure);
  const done = kn && kn[f.id] ? ' done' : '';
  return `<div class="rgtile ${tint}${done}" data-fig="${esc(f.id)}">${done ? '<span class="rgtick">✓</span>' : ''}<b class="rgnum">${esc(num)}</b><span class="rglbl">${esc(shortSub(f.subject))}</span></div>`;
}
function cellHTML(items, tint, kn){
  if (!items) return `<div class="rgcell ${tint} empty"></div>`;
  return `<div class="rgcell ${tint}">${items.map(f => tileHTML(f, tint, 'tl', kn)).join('')}</div>`;
}
function gridHTML(){
  const cells = gridData();
  const kn = known();
  const active = ROWS.filter(([r]) => cells[r] && COLS.some(([c]) => (cells[r][c] || []).length));
  return `<div class="card scroll-x"><table class="rgtable" id="tltable"><thead><tr><th class="corner"></th>${COLS.map(([c, l]) => `<th class="${c}">${l}</th>`).join('')}</tr></thead><tbody>
    ${active.map(([r, rl]) => {
      const total = COLS.reduce((n, [c]) => n + ((cells[r][c] || []).length), 0);
      return `<tr><th class="rgrowh"><b class="rgrownum">${esc(rowNum(r, rl))}</b><span class="muted small">· ${esc(rl.replace(/^[^·]*·\s*/, ''))} · ${total}</span></th>
      ${COLS.map(([c, , tint]) => `<td class="rgtd">${cellHTML(cells[r][c], tint, kn)}</td>`).join('')}</tr>`; }).join('')}
  </tbody></table></div>
  <p class="muted small" style="margin:10px 2px 0">Each tile is one rule; the bold chip is the number. Learn the <b>shape</b> first (SFC column: 1 or 7 business days, never months · records: years · client money: 1–2 days), then the tiles. Empty cells rule options out in the exam. <b>Cover mode</b> ghosts every number so you can recall them from the rule names — tap any tile to check yourself. The grid scrolls sideways; row and column headers stay pinned. A tick marks a tile as known (set it in the tile's card); the tile fades but keeps its colour.</p>`;
}

/* ---------- 2. penalty board ---------- */
const pens = F.filter(f => f.category === 'Penalties (fines & imprisonment)');
function penParse(f){
  if (/suspension|reprimand|Case \d/.test(f.subject + ' ' + f.figure)) return { case: true };
  const j = (f.figure.match(/(\d+)\s*years?/) || [])[1] || '0';
  let $c = 'none';
  if (/unlimited/i.test(f.figure)) $c = 'unl';
  else if (/10 million/i.test(f.figure)) $c = 'f10';
  else if (/5 million/i.test(f.figure)) $c = 'f5';
  else if (/1 million/i.test(f.figure)) $c = 'f1';
  else if (/level 6|per day/i.test(f.figure)) $c = 'oth';
  return { j, c: $c };
}
function penShort(figure){
  const y = (figure.match(/(\d+)\s*years?/) || [])[1];
  const mm = figure.match(/HK\$([\d.,]+)\s*(million)?/i);
  const money = /unlimited/i.test(figure) ? 'unlimited' : mm ? (mm[2] ? 'HK$' + mm[1].replace(/\.0+$/, '') + 'm' : 'HK$' + mm[1].replace(/,000$/, 'k')) : '';
  const parts = [];
  if (y) parts.push(y + 'y jail');
  if (money) parts.push(money);
  if (!parts.length) return figure.replace(/^greater of /i, '').slice(0, 18);
  return parts.join(' · ');
}
function penTint(f){
  const t = (f.subject + ' ' + f.figure).toLowerCase();
  if (/market misconduct/.test(t)) return 'bad';
  if (/amlo/.test(t)) return 'warn';
  if (/wmd/.test(t)) return 'bad';
  if (/otcd/.test(t)) return 'info';
  if (/sfc|disciplinary|pecuniary/.test(t)) return 'acc';
  return 'neu';
}
const JAIL = ['10','7','3','2','0'], FINE = [['unl','Unlimited fine'],['f10','HK$10m / 3× profit'],['f5','HK$5m'],['f1','HK$1m'],['oth','Other (level 6 + daily)'],['none','No fine stated']];
function boardHTML(){
  const board = {}; pens.forEach(f => { const p = penParse(f); if (p.case) return;
    (board[p.j] = board[p.j] || {}); (board[p.j][p.c] = board[p.j][p.c] || []).push(f); });
  const cases = pens.filter(f => penParse(f).case);
  const kn = known();
  return `<div class="card scroll-x"><table class="rgtable"><thead><tr><th class="corner">Jail ↓ · Fine →</th>${FINE.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead><tbody>
    ${JAIL.map(j => `<tr><th class="rgrowh"><b class="rgrownum">${j === '0' ? 'no jail' : esc(j) + (j === '1' ? ' year' : ' years')}</b></th>${FINE.map(([c]) => {
      const items = (board[j] || {})[c];
      return `<td class="rgtd">${items ? `<div class="rgcell">${items.map(f => tileHTML(f, penTint(f), 'pen', kn)).join('')}</div>` : '<div class="rgcell empty"></div>'}</td>`; }).join('')}</tr>`).join('')}
  </tbody></table></div>
  <p class="muted small" style="margin:8px 2px 0">Colours: <span class="chip bad">market misconduct / WMD</span> <span class="chip warn">AMLO</span> <span class="chip info">OTCD rules</span> <span class="chip acc">SFC disciplinary</span>. Two clusters, that's the whole board: <b>HK$1m + short jail</b> and <b>HK$10m-or-3× + long jail</b>; AMLO splits on intent (2y permitting vs 7y intent to defraud). The board scrolls sideways with headers pinned.</p>
  ${cases.length ? `<h3 style="margin:18px 0 8px">Actual sanctions handed out (SFC cases — not maximums)</h3>
  <div class="card"><div class="rgcell">${cases.map(f => tileHTML(f, 'neu', 'pen', kn)).join('')}</div></div>` : ''}`;
}

/* ---------- 3. the orphanage ---------- */
function unitClass(s){
  s = (s || '').toLowerCase();
  if (/as soon as|immediatel|same time|without delay|promptly|shortly/.test(s)) return 'asap';
  if (/%/.test(s)) return 'pct';
  if (/hk\$|levy|fee/.test(s)) return 'money';
  if (/business day|trading day|\bdays?\b|t-|t\+/.test(s)) return 'day';
  if (/week/.test(s)) return 'week';
  if (/month/.test(s)) return 'month';
  if (/year|annual|yearly/.test(s)) return 'year';
  if (/\b(1[89]\d\d|20\d\d)\b/.test(s)) return 'date';
  return 'count';
}
function numVal(s){ const m = (s || '').match(/(\d+(?:\.\d+)?)/); return m ? m[1] : (s || '').trim().slice(0, 14); }
const SECREF = /s\.?\s?\d|part\s+(ix|iv|v|xii|x)\b|sch\b|article\s+\d/i;
function orphanage(){
  const pool = F.filter(f => f.topic && f.category !== 'Penalties (fines & imprisonment)' && !['asap', 'date'].includes(unitClass(f.figure)));
  const freq = {};
  pool.forEach(f => { const k = numVal(f.figure) + '|' + unitClass(f.figure); freq[k] = (freq[k] || 0) + 1; });
  return pool.filter(f => f.category !== 'Time limits & deadlines' && /\d/.test(f.figure) && !SECREF.test(f.figure) && freq[numVal(f.figure) + '|' + unitClass(f.figure)] <= 2);
}
function orphanHTML(){
  const orph = orphanage(); const kn = known();
  const list = orph.filter(f => !ui.hideOrph || !kn[f.id]);
  return `<div class="card">
    <p class="small" style="margin-top:0">The grid takes the deadlines, the board takes the penalties. A figure lands here when it is quantitative, is not a section reference or a narrative date, and shares its exact value with <b>at most one other figure</b> — no family, no logic hook, nothing to deduce. These ${orph.length} are the only numbers that need brute repetition.</p>
    <div class="row" style="gap:10px;flex-wrap:wrap">
      <div class="stat"><b>${orph.length}</b><span>orphans</span></div>
      <button class="btn primary" id="odrill">Drill the orphans</button>
      <label class="small muted" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="ohide" ${ui.hideOrph ? 'checked' : ''}> hide the ones I know</label>
    </div>
    <div class="fgtable" style="margin-top:14px">${list.map(f => `<div class="fgrow ${kn[f.id] ? 'done' : ''}" data-oid="${f.id}">
      <div class="fgsubj"><b>${esc(f.subject)}</b><div class="row small" style="gap:6px;margin-top:4px">${App.chip(f.topic ? 'Topic ' + f.topic : 'Exam facts', 'acc')}<span class="muted">${esc(f.category)}</span><a class="cite" data-page="${f.pdf_page}" href="#">p.${esc(App.pageLabel(f.pdf_page))}</a></div></div>
      <div class="fgans"><div class="fgbody"><div class="fgnum">${esc(f.figure)}</div><div class="fgdetail">${App.enumify(esc(f.detail))}</div></div></div>
      <label class="fgknown small muted"><input type="checkbox" class="fgk" ${kn[f.id] ? 'checked' : ''}> known</label>
    </div>`).join('') || '<p class="empty">Nothing left here.</p>'}</div></div>`;
}

/* ---------- tile details modal ---------- */
function figModal(f){
  let m = $('#rgmodal');
  if (!m) { document.body.insertAdjacentHTML('beforeend', `<div id="rgmodal" class="modal" hidden><div class="box" style="width:min(620px,94vw)"><div class="mh"><b id="rgmtitle"></b><button class="iconbtn" id="rgmclose" aria-label="Close">×</button></div><div class="mb" id="rgmbody" style="padding:18px;overflow:auto;max-height:78vh;background:var(--bg)"></div></div></div>`); m = $('#rgmodal'); $('#rgmclose').onclick = () => { m.hidden = true; }; }
  const kn = known();
  $('#rgmtitle').textContent = f.subject;
  $('#rgmbody').innerHTML = `
    <div class="rgnum" style="font-size:1.9rem;margin:2px 0 10px">${esc(f.figure)}</div>
    <p>${App.enumify(esc(f.detail || ''))}</p>
    ${f.trap ? `<div class="trap"><b>Don't confuse:</b> ${esc(f.trap)}</div>` : ''}
    <div class="quote">“${esc(f.quote)}”</div>
    <div class="row small" style="gap:10px;margin-top:14px;flex-wrap:wrap">
      <a class="cite" data-page="${f.pdf_page}" href="#">guide p.${esc(App.pageLabel(f.pdf_page))}</a>
      <label class="small muted" style="display:flex;gap:6px;align-items:center"><input type="checkbox" id="rgmk" ${kn[f.id] ? 'checked' : ''}> known</label>
      <button class="btn sm" id="rgmdrill">Drill this figure</button>
    </div>`;
  $('#rgmk').onchange = e => { const k = known(); e.target.checked ? k[f.id] = Date.now() : delete k[f.id]; App.save();
    document.querySelectorAll('.rgtile[data-fig="' + CSS.escape(f.id) + '"]').forEach(t => { t.classList.toggle('done', e.target.checked);
      const tick = document.createElement('span'); tick.className = 'rgtick'; tick.textContent = '✓';
      if (e.target.checked && !t.querySelector('.rgtick')) t.prepend(tick); else if (!e.target.checked) { const x = t.querySelector('.rgtick'); if (x) x.remove(); } });
    document.querySelectorAll('.fgrow[data-oid="' + CSS.escape(f.id) + '"]').forEach(r => r.classList.toggle('done', e.target.checked)); };
  $('#rgmdrill').onclick = () => { m.hidden = true; App.startCards(['FG:' + f.id]); };
  m.hidden = false;
}

/* ---------- view ---------- */
App.views.ranges = function(view){
  const orph = orphanage();
  const fig = id => F.find(f => f.id === id);
  view.innerHTML = `
  <div class="row" style="align-items:flex-end"><div><h1>Ranges</h1>
  <p class="lead" style="margin:6px 0 0">The ${F.length} figures are not ${F.length} facts. They collapse into families — learn the <b>shape</b> like a range chart, and only the orphans by heart.</p></div></div>
  <div class="row" style="gap:12px;flex-wrap:wrap;margin:16px 0">
    <div class="stat"><b>${timeLimits.length}</b><span>in the deadline grid</span></div>
    <div class="stat"><b>${pens.length}</b><span>on the penalty board</span></div>
    <div class="stat"><b>${orph.length}</b><span>true orphans</span></div>
  </div>
  <h2 style="margin:10px 0 8px">Deadline range chart</h2>
  <div class="row" style="gap:8px;margin:0 0 10px;flex-wrap:wrap">
    <button class="btn" id="tgcov">${ui.covTL ? 'Show the numbers' : 'Cover the numbers (self-test)'}</button>
    <button class="btn primary" id="tldrill">Drill this grid</button>
  </div>
  <div id="tlgrid" class="${ui.covTL ? 'cov' : ''}">${gridHTML()}</div>
  <h2 style="margin:30px 0 8px">Penalty board</h2>
  <div class="row" style="gap:8px;margin:0 0 10px;flex-wrap:wrap">
    <button class="btn" id="pencov">${ui.covPen ? 'Show the numbers' : 'Cover the numbers (self-test)'}</button>
    <button class="btn primary" id="pendrill">Drill the penalties</button>
  </div>
  <div id="penboard" class="${ui.covPen ? 'cov' : ''}">${boardHTML()}</div>
  <h2 style="margin:30px 0 8px">The Orphanage <span class="muted small" style="font-weight:500">numbers with no system</span></h2>
  <div id="orph">${orphanHTML()}</div>`;
  $('#tgcov').onclick = () => { ui.covTL = !ui.covTL; ui.revealed = {}; App.views.ranges(view); };
  $('#pencov').onclick = () => { ui.covPen = !ui.covPen; ui.revealed = {}; App.views.ranges(view); };
  $('#tldrill').onclick = () => App.startCards(App.shuffle(timeLimits).slice(0, 30).map(f => 'FG:' + f.id));
  $('#pendrill').onclick = () => App.startCards(App.shuffle(pens).map(f => 'FG:' + f.id));
  $('#odrill').onclick = () => App.startCards(App.shuffle(orph).slice(0, 30).map(f => 'FG:' + f.id));
  $('#ohide').onchange = e => { ui.hideOrph = e.target.checked; App.views.ranges(view); };
  view.querySelectorAll('.rgtile').forEach(t => t.onclick = () => {
    const f = fig(t.dataset.fig); if (!f) return;
    const sec = t.closest('.cov');                      /* inside a covered section? */
    const num = t.querySelector('.rgnum');
    if (sec && num && getComputedStyle(num).visibility === 'hidden') { num.style.visibility = 'visible'; return; }   /* first tap = reveal the number */
    figModal(f);                                        /* otherwise: full details */
  });
  view.querySelectorAll('.fgrow[data-oid] .fgk').forEach(cb => cb.onchange = e => { const k = known(); const id = cb.closest('.fgrow').dataset.oid; e.target.checked ? k[id] = Date.now() : delete k[id]; App.save(); App.views.ranges(view); });
};
})();

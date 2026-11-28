/* Ranges: memory views built on the verified key figures.
   1. Deadline range chart — time limits as a poker-style grid (shape first, cells second).
   2. Penalty board — the few real fine/imprisonment numbers as a card grid.
   3. The Orphanage — figures whose value appears nowhere else: the honest brute-force list.
   Everything is computed from D.figures (machine-checked against the guide); nothing is hand-maintained. */
(function(){
const App = window.App, D = App.D, esc = App.esc, $ = App.$;
const F = D.figures || [];
const ui = { covTL:false, covPen:false, hideOrph:false, revealed:{} };
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
const shortSub = s => s.length > 44 ? s.slice(0, 43).replace(/\s\S*$/, '') + '…' : s;
function cellHTML(items, key, tint){
  if (!items) return `<div class="rgcell ${tint} empty"></div>`;
  const cov = ui.covTL && !ui.revealed[key];
  return `<div class="rgcell ${tint}${cov ? ' cov' : ''}" data-rv="${esc(key)}">${cov
    ? `<span class="rgn">${items.length}</span><span class="rgnhint">reveal</span>`
    : items.map(f => `<span class="rgchip" title="${esc(f.subject)} — ${esc(f.figure)}">${esc(shortSub(f.subject))}<a class="cite" data-page="${f.pdf_page}" href="#">p.${esc(App.pageLabel(f.pdf_page))}</a></span>`).join('')}</div>`;
}
function gridHTML(){
  const cells = gridData();
  const active = ROWS.filter(([r]) => cells[r] && COLS.some(([c]) => (cells[r][c] || []).length));
  return `<div class="card scroll-x"><table class="rgtable"><thead><tr><th></th>${COLS.map(([c, l]) => `<th class="${c}">${l}</th>`).join('')}</tr></thead><tbody>
    ${active.map(([r, rl]) => {
      const total = COLS.reduce((n, [c]) => n + ((cells[r][c] || []).length), 0);
      return `<tr><th class="rgrowh">${esc(rl)}<span class="muted small"> ${total}</span></th>
      ${COLS.map(([c, , tint]) => cellHTML(cells[r][c], r + ':' + c, tint)).join('')}</tr>`; }).join('')}
  </tbody></table></div>
  <p class="muted small" style="margin:10px 2px 0">Read it like a range chart: first learn the <b>shape</b> (the SFC column is never in months; records run for years; client-facing is 1–2 days), then fill the cells. Empty cells are information — "no cell there" rules options out in the exam. Covered cells show only how many rules sit there; click to reveal.</p>`;
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
const JAIL = ['10','7','3','2','0'], FINE = [['unl','Unlimited fine'],['f10','HK$10m / 3× profit'],['f5','HK$5m'],['f1','HK$1m'],['oth','Other (level 6 + daily)'],['none','No fine stated']];
function boardHTML(){
  const board = {}; pens.forEach(f => { const p = penParse(f); if (p.case) return;
    (board[p.j] = board[p.j] || {}); (board[p.j][p.c] = board[p.j][p.c] || []).push(f); });
  const cases = pens.filter(f => penParse(f).case);
  const cellP = (j, c) => { const items = (board[j] || {})[c]; const key = 'P' + j + c;
    if (!items) return `<div class="rgcell pen empty"></div>`;
    const cov = ui.covPen && !ui.revealed[key];
    return `<div class="rgcell pen${cov ? ' cov' : ''}" data-rv="${esc(key)}">${cov
      ? `<span class="rgn">${items.length}</span><span class="rgnhint">reveal</span>`
      : items.map(f => `<span class="rgchip" title="${esc(f.subject)}">${esc(shortSub(f.subject))}<a class="cite" data-page="${f.pdf_page}" href="#">p.${esc(App.pageLabel(f.pdf_page))}</a></span>`).join('')}</div>`; };
  return `<div class="card scroll-x"><table class="rgtable pen"><thead><tr><th>Jail ↓ · Fine →</th>${FINE.map(([, l]) => `<th>${l}</th>`).join('')}</tr></thead><tbody>
    ${JAIL.map(j => `<tr><th class="rgrowh">${j === '0' ? 'No imprisonment' : esc(j) + (j === '1' ? ' year' : ' years')}</th>${FINE.map(([c]) => cellP(j, c)).join('')}</tr>`).join('')}
  </tbody></table></div>
  ${cases.length ? `<h3 style="margin:18px 0 8px">Actual sanctions handed out (SFC cases — not maximums)</h3>
  <div class="card"><div class="rgcell pen" style="display:block">${cases.map(f => `<span class="rgchip" title="${esc(f.subject)}">${esc(shortSub(f.subject))}<a class="cite" data-page="${f.pdf_page}" href="#">p.${esc(App.pageLabel(f.pdf_page))}</a></span>`).join('')}</div>
  <p class="muted small" style="margin:10px 0 0">The whole statutory board is two clusters: <b>HK$1m + short/medium jail</b> and <b>HK$10m-or-3× + long jail</b>, with AMLO splitting on intent (2 years for permitting a breach vs 7 years for intent to defraud). One glance, whole category done.</p></div>` : ''}`;
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

/* ---------- view ---------- */
App.views.ranges = function(view){
  const orph = orphanage();
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
    <button class="btn" id="tgcov">${ui.covTL ? 'Reveal all cells' : 'Cover the grid (self-test)'}</button>
    <button class="btn primary" id="tldrill">Drill this grid</button>
  </div>
  <div id="tlgrid">${gridHTML()}</div>
  <h2 style="margin:30px 0 8px">Penalty board</h2>
  <div class="row" style="gap:8px;margin:0 0 10px;flex-wrap:wrap">
    <button class="btn" id="pencov">${ui.covPen ? 'Reveal all cards' : 'Cover the board (self-test)'}</button>
    <button class="btn primary" id="pendrill">Drill the penalties</button>
  </div>
  <div id="penboard">${boardHTML()}</div>
  <h2 style="margin:30px 0 8px">The Orphanage <span class="muted small" style="font-weight:500">numbers with no system</span></h2>
  <div id="orph">${orphanHTML()}</div>`;
  $('#tgcov').onclick = () => { ui.covTL = !ui.covTL; ui.revealed = {}; App.views.ranges(view); };
  $('#pencov').onclick = () => { ui.covPen = !ui.covPen; ui.revealed = {}; App.views.ranges(view); };
  $('#tldrill').onclick = () => App.startCards(App.shuffle(timeLimits).slice(0, 30).map(f => 'FG:' + f.id));
  $('#pendrill').onclick = () => App.startCards(App.shuffle(pens).map(f => 'FG:' + f.id));
  $('#odrill').onclick = () => App.startCards(App.shuffle(orph).slice(0, 30).map(f => 'FG:' + f.id));
  $('#ohide').onchange = e => { ui.hideOrph = e.target.checked; App.views.ranges(view); };
  view.querySelectorAll('[data-rv]').forEach(el => el.onclick = () => { ui.revealed[el.dataset.rv] = true; App.views.ranges(view); });
  view.querySelectorAll('.fgrow[data-oid] .fgk').forEach(cb => cb.onchange = e => { const k = known(); const id = cb.closest('.fgrow').dataset.oid; e.target.checked ? k[id] = Date.now() : delete k[id]; App.save(); App.views.ranges(view); });
};
})();

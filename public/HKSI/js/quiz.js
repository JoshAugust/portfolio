/* Quiz engine: practice / retry / targeted / mock runs, explanation panel, results, flashcard drills */
(function(){
const App = window.App, D = App.D, esc = App.esc, $ = App.$;
const KIND_LABEL = { practice:'Practice', retry:'Retry my mistakes', targeted:'Targeted quiz', mock:'Mock exam', review:'Daily review' };

App.run = null;
App.startRun = function(kind, ids, opts={}){
  if (!ids.length) { App.toast('No questions match those settings'); return false; }
  App.run = { kind, ids, i:0, ans:{}, checked:{}, flags:{}, start:Date.now(), limitMs: opts.limitMs || 0, submitted:false, note: opts.note || '' };
  App.persistRun();
  if (location.hash === '#/run') App.route(); else location.hash = '#/run';
  return true;
};

/* ---------- mock builder ---------- */
const MID = { 1:3.5, 2:3.5, 3:13.5, 4:23.5, 5:18.5, 6:16.5, 7:10, 8:6.5, 9:4.5 };
App.buildMock = function(n=60){
  const pool = App.pool({ includeUnverified:false, sources:['past2006','sample2023'] });
  const total = Object.values(MID).reduce((a,b)=>a+b,0);
  const byTopic = {}; pool.forEach(q => { const t = q.topics[0] || 0; (byTopic[t] = byTopic[t] || []).push(q); });
  Object.keys(byTopic).forEach(t => byTopic[t] = App.shuffle(byTopic[t]));
  n = Math.min(n, pool.length);
  const chosen = []; const used = new Set();
  const quota = Object.entries(MID).map(([t,w]) => ({ t:+t, exact: n*w/total })).map(x => Object.assign(x, { k: Math.floor(x.exact), r: x.exact % 1 }));
  let left = n - quota.reduce((a,x)=>a+x.k,0);
  quota.sort((a,b)=>b.r-a.r).forEach(x => { if (left > 0) { x.k++; left--; } });
  quota.forEach(x => { (byTopic[x.t] || []).slice(0, x.k).forEach(q => { chosen.push(q); used.add(q.id); }); });
  if (chosen.length < n) App.shuffle(pool.filter(q => !used.has(q.id))).slice(0, n - chosen.length).forEach(q => chosen.push(q));
  return { ids: App.shuffle(chosen).map(q => q.id), size: chosen.length, available: pool.length };
};

/* ---------- explanation ---------- */
App.optText = (q, k) => q.opts[k];
App.explainHTML = function(q, choice){
  const ok = choice === q.ans; const tr = App.trust(q);
  let h = '';
  if (choice !== undefined && choice !== null)
    h += `<div class="verdict ${ok ? 'ok' : 'no'}">${ok ? '✓ Correct' : '✗ Not quite'} <span class="muted small" style="font-family:var(--sans);font-weight:500">Answer: ${q.ans}. ${esc(q.opts[q.ans])}</span></div>`;
  if (tr === 'unverified') h += `<div class="banner"><b>Unverified.</b> ${q.status === 'KEY_OUTDATED' ? 'The rule this question tests has changed since it was written, so the original key may no longer be right.' : q.status === 'GUIDE_SILENT' ? 'The current guide does not cover this point, so the answer cannot be confirmed from it.' : 'The current guide cannot settle this question.'} The key shown is the publisher's. Do not rely on it for the exam.</div>`;
  else if (tr === 'generated') h += `<div class="banner info"><b>New question.</b> Written from the guide, not HKSI. Every answer was checked against the quoted guide text by two separate passes. HKSI may word things differently.</div>`;
  else if (tr === 'bestfit') h += `<div class="banner info"><b>Best-supported answer.</b> The guide backs this option, but some of the reasoning is by elimination or inference. Statements marked "Not stated" are not in the guide.</div>`;
  else if (tr === 'unofficial' || tr === 'unofficial-ok') h += `<div class="banner"><b>Unofficial question.</b> From ${esc(q.srcLabel.replace('Unofficial: ',''))}, not from HKSI. ${tr === 'unofficial-ok' ? 'The core claim matches the guide.' : 'The guide does not clearly confirm it.'} ${q.url ? `<a href="${esc(q.url)}" target="_blank" rel="noopener">Source</a>` : ''}</div>`;
  if (q.verdict && q.key !== q.verdict && 'ABCD'.includes(q.verdict)) h += `<div class="banner"><b>Key differs.</b> The original key says ${q.key}, but guide v3.5 supports ${q.verdict}.</div>`;
  if (q.bottom) h += `<div class="card flat"><div class="h-sec" style="margin-top:0">Why</div><p>${App.inline(q.bottom)}</p></div>`;
  if (q.rows && q.rows.length) {
    h += `<div class="card flat"><div class="h-sec" style="margin-top:0">${q.stmts ? 'Each statement, checked against the guide' : 'Each option, checked against the guide'}</div><div class="scroll-x"><table class="tbl"><thead><tr><th>${q.stmts ? 'Stmt' : 'Opt'}</th><th>Verdict</th><th>Evidence</th><th>Why / trap</th></tr></thead><tbody>` +
      q.rows.map(r => `<tr><td><b>${esc(r[0])}</b></td><td class="v-${esc((r[1].split(/[\s(]/)[0] || '').toUpperCase())}">${esc(r[1])}</td><td>${App.inline(r[2])}</td><td>${App.inline(r[3])}</td></tr>`).join('') + '</tbody></table></div></div>';
  }
  if (q.elim) h += `<div class="card flat"><div class="h-sec" style="margin-top:0">Why each option stands or falls</div><div class="md">${App.md(q.elim)}</div></div>`;
  if (q.trapnote) h += `<div class="trap"><b>Trap:</b> ${App.inline(q.trapnote)}</div>`;
  if (q.remember) h += `<div class="card flat"><div class="h-sec" style="margin-top:0">Remember</div><div class="md">${App.md(q.remember)}</div></div>`;
  if (q.pages && q.pages.length) h += `<div class="row small"><span class="muted">Read in the guide:</span>${q.pages.slice(0,8).map(p => `<a class="cite" data-page="${p}" href="#">p.${esc(App.pageLabel(p))}</a>`).join(' ')}</div>`;
  return `<div class="explain">${h}</div>`;
};

/* ---------- run renderer ---------- */
function fmtTime(ms){ ms = Math.max(0, ms); const s = Math.floor(ms/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`; }
let tick = null;
App.renderRun = function(view){
  clearInterval(tick);
  const r = App.run;
  if (!r) { location.hash = '#/practice'; return; }
  if (r.submitted) return App.renderResults(view);
  App.persistRun();
  const q = App.qById(r.ids[r.i]); const mock = r.kind === 'mock';
  const checked = !!r.checked[q.id]; const sel = r.ans[q.id];
  const answered = Object.keys(r.ans).length;
  view.innerHTML = `<div class="qwrap">
    <div class="row" style="margin:8px 0 16px"><b>${KIND_LABEL[r.kind]}</b><span class="muted small">Question ${r.i+1} of ${r.ids.length}</span><span class="sp"></span>
      ${mock ? `<span class="timer" id="timer"></span>` : ''}<button class="btn sm" id="flagbtn">${r.flags[q.id] ? '⚑ Flagged' : '⚐ Flag'}</button><button class="btn sm ghost" id="quit">${mock ? 'Submit exam' : 'End session'}</button></div>
    <div class="bar" style="margin-bottom:16px"><i style="width:${App.pct(r.i + (checked?1:0), r.ids.length)}%"></i></div>
    <div class="card">
      <div class="qhead">${App.chip(q.srcLabel)} ${App.trustChip(q)} ${q.topics.map(t => App.chip('Topic ' + t, 'acc')).join(' ')}</div>
      <div class="qstem">${esc(q.stem)}</div>
      ${q.stmts ? `<ul class="stmts">${q.stmts.map(s => `<li><b>${esc(s.n)}</b><span>${esc(s.text)}</span></li>`).join('')}</ul>` : ''}
      <div class="opts" role="radiogroup">${Object.entries(q.opts).map(([k, v]) => {
        let cls = 'opt'; if (sel === k) cls += ' sel';
        if (checked) { cls = 'opt'; if (k === q.ans) cls += ' right'; else if (k === sel) cls += ' wrong'; }
        return `<button class="${cls}" data-k="${k}" role="radio" aria-checked="${sel === k}" ${checked ? 'disabled' : ''}><b>${k}</b><span>${esc(v)}</span></button>`; }).join('')}</div>
      <div class="row" style="margin-top:16px">
        ${mock ? `<button class="btn" id="prev" ${r.i===0?'disabled':''}>‹ Previous</button><button class="btn" id="next" ${r.i===r.ids.length-1?'disabled':''}>Next ›</button><span class="sp"></span><span class="muted small">${answered}/${r.ids.length} answered</span>`
        : `<span class="sp"></span>${checked ? `<button class="btn primary" id="next">${r.i === r.ids.length-1 ? 'See results' : 'Next question ›'}</button>` : `<button class="btn primary" id="check" ${sel ? '' : 'disabled'}>Check answer</button>`}`}
      </div>
      <div class="muted tiny" style="margin-top:8px">Keys: A–D to choose · Enter to ${mock ? 'go on' : (checked ? 'continue' : 'check')}</div>
    </div>
    ${checked ? App.explainHTML(q, sel) : ''}
    ${mock ? `<div class="card flat" style="margin-top:14px"><div class="h-sec" style="margin-top:0">Jump to</div><div class="nav-grid">${r.ids.map((id, i) => `<button data-j="${i}" class="${r.ans[id] ? 'done' : ''} ${i===r.i?'cur':''} ${r.flags[id]?'flag':''}">${i+1}</button>`).join('')}</div></div>` : ''}
  </div>`;
  if (mock) {
    const upd = () => { const left = r.limitMs - (Date.now() - r.start); const t = $('#timer'); if (!t) return clearInterval(tick); t.textContent = fmtTime(left); t.classList.toggle('low', left < 5*60e3); if (left <= 0) { clearInterval(tick); App.submitRun(); } };
    let n = 0; upd(); tick = setInterval(() => { upd(); if (++n % 10 === 0) App.persistRun(); }, 1000);
  }
  const choose = k => { if (!r.checked[q.id] && q.opts[k]) { r.ans[q.id] = k; App.renderRun(view); } };
  view.querySelectorAll('.opt').forEach(b => b.onclick = () => choose(b.dataset.k));
  const go = d => { r.i = Math.max(0, Math.min(r.ids.length - 1, r.i + d)); App.renderRun(view); window.scrollTo(0,0); };
  $('#prev') && ($('#prev').onclick = () => go(-1));
  $('#next') && ($('#next').onclick = () => { if (!mock && r.i === r.ids.length - 1) App.submitRun(); else go(1); });
  $('#check') && ($('#check').onclick = () => { r.checked[q.id] = true; App.recordAnswer(q, r.ans[q.id], r.kind); App.renderRun(view); });
  $('#flagbtn').onclick = () => { r.flags[q.id] = !r.flags[q.id]; App.renderRun(view); };
  $('#quit').onclick = () => { if (mock) { if (confirm(`Submit now? ${r.ids.length - answered} question(s) unanswered.`)) App.submitRun(); } else App.submitRun(); };
  view.querySelectorAll('[data-j]').forEach(b => b.onclick = () => { r.i = +b.dataset.j; App.renderRun(view); window.scrollTo(0,0); });
  App.runKeys = e => {
    if (e.target.matches('input,textarea,select')) return;
    const k = e.key.toUpperCase();
    if ('ABCD'.includes(k) && k.length === 1) choose(k);
    else if (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4') choose('ABCD'[+e.key - 1]);
    else if (e.key === 'Enter') { const b = $('#check') || $('#next'); if (b && !b.disabled) b.click(); }
  };
};
document.addEventListener('keydown', e => { if (location.hash === '#/run' && App.runKeys && App.run && !App.run.submitted) App.runKeys(e); });

App.submitRun = function(){
  const r = App.run; if (!r || r.submitted) return;
  clearInterval(tick); r.submitted = true; r.end = Date.now();
  if (r.kind === 'mock') r.ids.forEach(id => { if (r.ans[id]) App.recordAnswer(App.qById(id), r.ans[id], 'mock'); });
  const s = App.load();
  const score = r.ids.filter(id => r.ans[id] === App.qById(id).ans).length;
  s.sessions.push({ kind:r.kind, ts:r.end, n:r.ids.length, score, answered:Object.keys(r.ans).length, ms:r.end - r.start, id:r.end });
  s.runs = s.runs || []; s.runs.push({ id:r.end, kind:r.kind, ids:r.ids, ans:r.ans, flags:r.flags, checked:r.checked, start:r.start, end:r.end, note:r.note }); if (s.runs.length > 15) s.runs.shift();
  s.activeRun = null;
  if (s.sessions.length > 300) s.sessions.shift();
  App.save(); location.hash = '#/run'; App.route && App.route();
};

App.renderResults = function(view){
  const r = App.run; const qs = r.ids.map(id => App.qById(id));
  const right = qs.filter(q => r.ans[q.id] === q.ans); const n = qs.length; const pct = App.pct(right.length, n);
  const mock = r.kind === 'mock'; const pass = pct >= 70;
  const byT = {}; qs.forEach(q => { const t = q.topics[0] || 0; const o = byT[t] || (byT[t] = { n:0, ok:0 }); o.n++; if (r.ans[q.id] === q.ans) o.ok++; });
  const wrong = qs.filter(q => r.ans[q.id] !== q.ans);
  view.innerHTML = `<div class="qwrap">
    <h1>${mock ? (pass ? 'Passed' : 'Not yet') : 'Session complete'}</h1>
    <div class="card"><div class="row" style="gap:24px"><div class="ring" style="--p:${pct}"><div>${pct}%</div></div>
      <div><div class="stat"><b>${right.length} / ${n}</b><span>correct${mock ? ` · pass mark 70% (${Math.ceil(n*.7)} of ${n})` : ''}</span></div>
      <div class="muted small">${Object.keys(r.ans).length} answered · ${fmtTime((r.end||Date.now()) - r.start)} taken</div></div></div></div>
    <p class="muted small" style="margin:10px 2px 0">✓ Saved in this browser. <a href="#/history">All your results</a> · <button class="btn sm ghost" id="bk" type="button">Download a backup</button></p>
    <h2 style="margin-top:26px">By topic</h2><div class="card flat">${Object.entries(byT).sort((a,b)=>a[0]-b[0]).map(([t,o]) => `<div class="row" style="margin:8px 0"><span style="width:200px">${t === '0' ? 'Other' : 'Topic ' + t + ' · ' + esc(App.topic(t).short)}</span><div class="bar ${o.ok/o.n<.7?'bad':'good'} sp"><i style="width:${App.pct(o.ok,o.n)}%"></i></div><span class="small muted" style="width:44px;text-align:right">${o.ok}/${o.n}</span></div>`).join('')}</div>
    <div class="row" style="margin:20px 0">${wrong.length ? `<button class="btn primary" id="retry">Retry the ${wrong.length} I missed</button>` : ''}<a class="btn" href="#/mistakes">See weak spots</a><a class="btn" href="#/practice">New quiz</a></div>
    <h2>Review</h2>${qs.map((q, i) => { const ok = r.ans[q.id] === q.ans; return `<details class="acc"><summary><span class="chip ${ok ? 'good' : 'bad'}">${ok ? '✓' : (r.ans[q.id] ? '✗' : '–')}</span><span>${i+1}. ${esc(q.stem.length > 110 ? q.stem.slice(0,110) + '…' : q.stem)}</span></summary><div class="in"><div class="qstem" style="font-size:1rem">${esc(q.stem)}</div>${q.stmts ? `<ul class="stmts">${q.stmts.map(s => `<li><b>${esc(s.n)}</b><span>${esc(s.text)}</span></li>`).join('')}</ul>` : ''}<div class="muted small">You chose: ${r.ans[q.id] ? r.ans[q.id] + '. ' + esc(q.opts[r.ans[q.id]]) : 'no answer'}</div>${App.explainHTML(q, r.ans[q.id] || 'none')}</div></details>`; }).join('')}
  </div>`;
  $('#bk') && ($('#bk').onclick = App.exportProgress);
  const rb = $('#retry'); if (rb) rb.onclick = () => App.startRun('retry', wrong.map(q => q.id));
};

/* ---------- flashcards ---------- */
App.cardRun = null;
App.startCards = function(ids){
  if (!ids.length) { App.toast('No cards to show'); return; }
  App.cardRun = { ids, i:0, revealed:false, ok:0, bad:0 }; if (location.hash === '#/cards') App.route(); else location.hash = '#/cards';
};
App.cardData = function(id){
  if (id.startsWith('KC:')) { const k = D.kc.find(x => 'KC:' + x.id === id); return k && { id, kind:'kc', topic:k.topic, head:'Guide review question', q:k.q, a:k.a + (k.e ? '\n' + k.e : ''), page:k.pa || k.pq }; }
  const f = App.factById(id); if (!f) return null; const c = App.cloze(f.f);
  return { id, kind:'fact', topic:f.topic, head:f.h || 'Fact', html:c.html, blanks:c.n, fact:f.f, quote:f.q, page:f.p, trap:f.tr, type:f.t };
};
App.renderCards = function(view){
  const r = App.cardRun; if (!r) { location.hash = '#/practice'; return; }
  if (r.i >= r.ids.length) {
    view.innerHTML = `<div class="qwrap"><h1>Drill complete</h1><div class="card"><div class="stat"><b>${r.ok} / ${r.ids.length}</b><span>recalled</span></div></div><div class="row" style="margin-top:18px"><a class="btn primary" href="#/mistakes">Weak spots</a><a class="btn" href="#/learn">Back to learning</a></div></div>`; return;
  }
  const c = App.cardData(r.ids[r.i]);
  if (!c) { r.i++; return App.renderCards(view); }
  const body = c.kind === 'kc'
    ? `<div class="big">${esc(c.q)}</div>${r.revealed ? `<div class="hr"></div><div class="md">${App.md(c.a)}</div>` : ''}`
    : `<div class="big">${c.html}</div>${r.revealed ? `${c.blanks ? '' : ''}${c.quote ? `<div class="quote">“${esc(c.quote)}”</div>` : ''}${c.trap ? `<div class="trap"><b>Trap:</b> ${esc(c.trap)}</div>` : ''}` : (c.blanks ? '' : '<div class="muted small">Try to recall the rule before you reveal it.</div>')}`;
  view.innerHTML = `<div class="qwrap"><div class="row" style="margin:8px 0 16px"><b>Fact drill</b><span class="muted small">Card ${r.i+1} of ${r.ids.length}</span><span class="sp"></span><a class="btn sm ghost" href="#/learn">End</a></div>
    <div class="bar" style="margin-bottom:16px"><i style="width:${App.pct(r.i, r.ids.length)}%"></i></div>
    <div class="card flash"><div class="row small">${App.chip('Topic ' + c.topic, 'acc')} <span class="muted">${esc(c.head)}</span></div>${c.kind === 'fact' && !c.blanks && !r.revealed ? `<div class="big" style="color:var(--muted)">${esc(c.head)}</div><div class="muted">What does the guide say here?</div>` : body}
      ${r.revealed && c.kind === 'fact' && !c.blanks ? `<div class="big">${esc(c.fact)}</div>${c.quote ? `<div class="quote">“${esc(c.quote)}”</div>` : ''}${c.trap ? `<div class="trap"><b>Trap:</b> ${esc(c.trap)}</div>` : ''}` : ''}
      ${r.revealed ? `<div class="row small"><span class="muted">Source:</span><a class="cite" data-page="${c.page}" href="#">p.${esc(App.pageLabel(c.page))}</a></div>` : ''}
    </div>
    <div class="row" style="margin-top:14px;justify-content:center">${r.revealed ? `<button class="btn" id="miss" style="min-width:130px">✗ Missed it</button><button class="btn primary" id="got" style="min-width:130px">✓ Got it</button>` : `<button class="btn primary" id="reveal" style="min-width:200px">Reveal</button>`}</div>
    <div class="muted tiny" style="text-align:center;margin-top:8px">Space to reveal · 1 = missed · 2 = got it</div></div>`;
  if (r.revealed) view.querySelectorAll('.blank').forEach(b => b.classList.add('show'));
  const next = ok => { App.recordCard(c.id, ok); ok ? r.ok++ : r.bad++; r.i++; r.revealed = false; App.renderCards(view); };
  $('#reveal') && ($('#reveal').onclick = () => { r.revealed = true; App.renderCards(view); });
  $('#got') && ($('#got').onclick = () => next(true)); $('#miss') && ($('#miss').onclick = () => next(false));
  App.cardKeys = e => { if (e.target.matches('input,textarea')) return; if (e.key === ' ' && !r.revealed) { e.preventDefault(); $('#reveal').click(); } else if (r.revealed && e.key === '1') $('#miss').click(); else if (r.revealed && e.key === '2') $('#got').click(); };
};
document.addEventListener('keydown', e => { if (location.hash === '#/cards' && App.cardKeys && App.cardRun) App.cardKeys(e); });
})();

/* Core: data access, storage, helpers, trust model, spaced review, mistake analysis */
(function(){
const D = window.HKSI; const App = window.App = { D };
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
App.$ = $; App.$$ = $$; App.esc = esc;

/* ---------- storage (localStorage with in-memory fallback) ---------- */
const KEY = 'hksi.paper1.v1';
let mem = null;
function blank(){ return { attempts:{}, cards:{}, learned:{}, log:[], sessions:[], runs:[], plan:[], activeRun:null, lastExport:0, settings:{ showUnverified:false } }; }
App.load = function(){
  if (mem) return mem;
  try { const raw = localStorage.getItem(KEY); mem = raw ? Object.assign(blank(), JSON.parse(raw)) : blank(); }
  catch(e){ mem = blank(); }
  return mem;
};
App.save = function(){ try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch(e){} };
App.reset = function(){ mem = blank(); App.save(); };
App.replaceState = function(obj){ mem = Object.assign(blank(), obj); App.save(); };
App.storageOK = (function(){ try { localStorage.setItem('hksi.probe','1'); localStorage.removeItem('hksi.probe'); return true; } catch(e){ return false; } })();
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch(e){}
App.exportProgress = function(){
  const s = App.load(); s.lastExport = Date.now(); App.save();
  const b = new Blob([JSON.stringify(s)], { type:'application/json' }); const a = document.createElement('a');
  a.href = URL.createObjectURL(b); a.download = 'hksi-progress-' + new Date().toISOString().slice(0,10) + '.json'; a.click();
  App.toast('Backup downloaded');
};
/* an unfinished quiz or mock is saved after every step, so a refresh or closed tab loses nothing */
App.persistRun = function(){
  const r = App.run, s = App.load();
  if (!r || r.submitted) { if (s.activeRun) { s.activeRun = null; App.save(); } return; }
  s.activeRun = Object.assign({}, r, { elapsed: Date.now() - r.start }); App.save();
};
App.resumeRun = function(){
  const r = App.load().activeRun; if (!r) return false;
  r.ids = (r.ids || []).filter(id => App.qById(id));  // drop questions no longer in the bank
  if (!r.ids.length) return false;
  r.start = Date.now() - (r.elapsed || 0); r.submitted = false; App.run = r; location.hash = '#/run'; App.route(); return true;
};
App.discardRun = function(){ const s = App.load(); s.activeRun = null; App.run = null; App.save(); };
App.openSavedRun = function(id){
  const r = (App.load().runs || []).find(x => x.id === +id); if (!r) { App.toast('That session is no longer stored'); return; }
  r.ids = (r.ids || []).filter(id => App.qById(id));  // drop questions no longer in the bank
  if (!r.ids.length) { App.toast('That session\u2019s questions are no longer in the bank'); return; }
  App.run = Object.assign({}, r, { submitted:true }); location.hash = '#/run'; App.route();
};
App.toast = function(msg){ const t=$('#toast'); t.textContent=msg; t.hidden=false; clearTimeout(App._tt); App._tt=setTimeout(()=>t.hidden=true,2200); };

/* ---------- topics, pages ---------- */
App.topic = id => D.topics.find(t => t.id === +id);
App.topicLabel = id => `Topic ${id}`;
App.pageLabel = p => (D.labels[p] ? D.labels[p] : `PDF ${p}`);
App.topicOfPage = p => (D.topics.find(t => p >= t.p0 && p <= t.p1) || {}).id || null;

/* ---------- trust model ---------- */
// verified   : guide v3.5 supports the answer directly.
// bestfit    : answer is the best-supported option, but one or more statements are inferred / eliminated.
// unverified : guide can't confirm (outdated rule, guide silent, undetermined, unofficial without support).
App.trust = function(q){
  if (q.src === 'generated' || q.src === 'generated_hard') return 'generated';
  if (q.src === 'unofficial') return q.guide_check === 'SUPPORTED' ? 'unofficial-ok' : 'unofficial';
  if (q.status === 'CONFIRMED') return 'verified';
  if (q.status === 'PARTIAL' && q.verdict && 'ABCD'.includes(q.verdict)) return 'bestfit';
  return 'unverified';
};
App.trustMeta = {
  'generated': ['New · guide-derived, double-checked','acc'], 'verified': ['Verified in guide','good'], 'bestfit': ['Best-supported answer','info'],
  'unverified': ['Unverified','warn'], 'unofficial': ['Unofficial · not confirmed in guide','warn'], 'unofficial-ok': ['Unofficial · matches guide','acc'] };
App.isScored = q => ['verified','bestfit','generated'].includes(App.trust(q));
App.questions = () => D.questions;
App.qById = id => D.questions.find(q => q.id === id);
App.pool = function(opts={}){
  const incl = opts.includeUnverified ?? App.load().settings.showUnverified;
  return D.questions.filter(q => {
    const t = App.trust(q);
    if (!incl && !['verified','bestfit','generated'].includes(t) && t !== 'unofficial-ok') return false;
    if (opts.sources && !opts.sources.includes(q.src)) return false;
    if (opts.topics && opts.topics.length && !(q.topics.some(x => opts.topics.includes(x)))) return false;
    return true;
  });
};

/* ---------- spaced review (Leitner) ---------- */
const DAYS = [0,1,3,7,14,30];
const DAY = 864e5;
App.recordAnswer = function(q, choice, mode){
  const s = App.load(); const now = Date.now();
  const ok = choice === q.ans;
  const a = s.attempts[q.id] || (s.attempts[q.id] = { n:0, wrong:0, streak:0, box:0, due:0, last:null });
  a.n++; if (!ok) a.wrong++;
  a.streak = ok ? a.streak + 1 : 0;
  a.box = ok ? Math.min(a.box + 1, DAYS.length - 1) : 0;
  a.due = now + DAYS[a.box] * DAY; a.last = ok; a.ts = now; a.lastChoice = choice;
  s.log.push({ q:q.id, ok, ts:now, m:mode, c:choice });
  if (s.log.length > 4000) s.log.splice(0, s.log.length - 4000);
  App.save();
  return ok;
};
App.recordCard = function(id, ok){
  const s = App.load(); const now = Date.now();
  const c = s.cards[id] || (s.cards[id] = { n:0, wrong:0, box:0, due:0 });
  c.n++; if (!ok) c.wrong++;
  c.box = ok ? Math.min(c.box + 1, DAYS.length - 1) : 0;
  c.due = now + DAYS[c.box] * DAY; c.ts = now; c.last = ok;
  App.save();
};
App.dueQuestions = function(){
  const s = App.load(); const now = Date.now();
  return D.questions.filter(q => { const a = s.attempts[q.id]; return a && a.due <= now && (App.isScored(q) || App.load().settings.showUnverified); });
};
App.dueCards = function(){
  const s = App.load(); const now = Date.now();
  return Object.entries(s.cards).filter(([id, c]) => c.due <= now).map(([id]) => id);
};

/* ---------- mistakes & weak spots ---------- */
App.TRAPS = {
  'only/all': 'Words like "only", "all", "any", "always" make a true-sounding statement false. Check for the exception.',
  'scope': 'The statement is right about something nearby, but not about what the question asks. Re-read who, what and where.',
  'near-duplicate-options': 'Two options differ by one item or word. List what each option includes before choosing.',
  'negation': 'The stem asks for the INCORRECT / NOT / UNLIKELY one. Flip the question before you read the options.',
  'numbers': 'Thresholds, periods and percentages are tested exactly. Learn them as numbers, not ideas.',
  'must-vs-should': 'The guide separates "must" (rule) from "should" (guidance) and "may" (permission). Exam wording often swaps them.',
  'actor': 'Who has the power: the SFC, the Financial Secretary, the exchange, the company, the client? Wrong actor = wrong answer.',
  'outdated-rule': 'Old exam material may use a rule that has changed. Trust the current guide.',
  'definition': 'Exact definitions matter. Learn the wording used in the guide.',
  'negation-in-substance': 'The statement sounds like a restriction or a duty but means the reverse.'
};
App.mistakes = function(){
  const s = App.load();
  return D.questions.filter(q => { const a = s.attempts[q.id]; return a && a.wrong > 0 && a.streak < 2 && App.isScored(q); });
};
App.weakness = function(){
  const s = App.load();
  const topics = {}; const traps = {};
  D.topics.forEach(t => topics[t.id] = { id:t.id, n:0, wrong:0, open:0 });
  const pages = {};
  D.questions.forEach(q => {
    const a = s.attempts[q.id]; if (!a || !App.isScored(q)) return;
    q.topics.forEach(t => { if (topics[t]) { topics[t].n += a.n; topics[t].wrong += a.wrong; } });
    if (a.wrong > 0 && a.streak < 2) {
      q.topics.forEach(t => { if (topics[t]) topics[t].open++; });
      q.traps.forEach(tr => traps[tr] = (traps[tr] || 0) + a.wrong);
      q.pages.forEach(p => pages[p] = (pages[p] || 0) + 1);
    }
  });
  Object.values(topics).forEach(t => t.acc = t.n ? 1 - t.wrong / t.n : null);
  return { topics, traps, pages };
};
App.recommendTopics = function(){
  const w = App.weakness();
  return Object.values(w.topics).filter(t => t.open > 0 || (t.n >= 3 && t.acc < .75))
    .sort((a,b) => (b.open * 2 + (1 - (b.acc ?? 1))) - (a.open * 2 + (1 - (a.acc ?? 1))));
};
// Build a targeted quiz around the user's open mistakes: unseen/other questions sharing pages, topics and trap types.
App.targetedQuestions = function(limit=15){
  const M = App.mistakes(); const s = App.load();
  const pages = new Set(), topics = new Set(), traps = new Set();
  M.forEach(q => { q.pages.forEach(p => pages.add(p)); q.topics.forEach(t => topics.add(t)); q.traps.forEach(t => traps.add(t)); });
  const mids = new Set(M.map(q => q.id));
  const cands = App.pool().filter(q => !mids.has(q.id)).map(q => {
    let sc = 0;
    q.pages.forEach(p => { if (pages.has(p)) sc += 3; else if ([...pages].some(x => Math.abs(x - p) <= 2)) sc += 1; });
    q.topics.forEach(t => { if (topics.has(t)) sc += 1; });
    q.traps.forEach(t => { if (traps.has(t)) sc += 1; });
    const a = s.attempts[q.id]; if (!a) sc += 1.5; else if (a.wrong) sc += 1;
    return { q, sc };
  }).filter(x => x.sc >= 2).sort((a,b) => b.sc - a.sc).slice(0, limit);
  return { mistakes:M, extra:cands.map(x => x.q), pages:[...pages].sort((a,b)=>a-b), topics:[...topics].sort(), traps:[...traps] };
};
App.exportWeakSpots = function(){
  const T = App.targetedQuestions(0); const lines = ['HKSI Paper 1: my weak spots (for generating guide-backed practice questions)', ''];
  lines.push('Topics: ' + (T.topics.map(t => `${t} (${App.topic(t).short})`).join('; ') || 'none yet'));
  lines.push('Guide PDF pages to cover: ' + (T.pages.join(', ') || 'none yet'));
  lines.push('Trap types I fall for: ' + (T.traps.join(', ') || 'none yet'), '', 'Questions I missed:');
  T.mistakes.forEach(q => lines.push(`- ${q.id} (${q.srcLabel}) topics ${q.topics.join(',')}, guide pages ${q.pages.join(',')}`));
  return lines.join('\n');
};

/* ---------- lessons / facts ---------- */
App.allFacts = (() => { const out = []; for (const t of Object.keys(D.lessons)) D.lessons[t].forEach(f => out.push(Object.assign({ topic:+t }, f))); return out; })();
App.cardFacts = App.allFacts.filter(f => !/expected learning outcomes|topic overview/i.test(f.h) && !/^\(?[a-z]\)\s+(describe|explain|identify|outline|understand|list|state|discuss|define)\b/i.test(f.f));
App.factById = id => App.allFacts.find(f => f.id === id);
App.factsNearPages = function(pages, span=1){
  const ps = new Set(pages); return App.cardFacts.filter(f => [...ps].some(p => Math.abs(p - f.p) <= span));
};
// Cloze: blank numbers and modal verbs mechanically (never invents content).
const NUM = /(?:HK\$|RMB|US\$)\s?[\d,.]+(?:\s?(?:million|billion|m|bn))?|\b\d[\d,.]*(?:\s?(?:%|per cent|years?|months?|days?|working days|calendar months?|trading days|hours?|minutes?|min|seconds?|times))?/g;
const MODAL = /\b(must not|should not|may not|shall not|cannot|must|should|may|shall|only|all|any)\b/gi;
App.cloze = function(fact){
  const answers = []; let text = fact;
  const parts = []; let i = 0;
  const re = new RegExp(NUM.source + '|' + MODAL.source, 'gi'); let m;
  while ((m = re.exec(fact)) && answers.length < 4) {
    if (/^\d{1,2}$/.test(m[0]) && /^\s*\)/.test(fact.slice(m.index + m[0].length))) continue; // list markers like "(1)"
    if (/^\d/.test(m[0]) && /(?:Topics?|sections?|Parts?|paragraphs?|paras?|Schedules?|Articles?|Rules?|Chapters?|Appendix|Appendices|pages?|pp?\.|ss?\.|Cap\.?|Code|Divisions?|Forms?|Types?)\s*$/i.test(fact.slice(0, m.index))) continue; // cross-references, not facts to recall
    if (m.index > 0 && /\(/.test(fact[m.index - 1]) && /^[a-z]$/i.test(m[0])) continue;
    parts.push(esc(fact.slice(i, m.index))); parts.push(`<span class="blank" data-a="${esc(m[0])}">${esc(m[0])}</span>`);
    answers.push(m[0]); i = m.index + m[0].length;
  }
  parts.push(esc(fact.slice(i)));
  return { html: App.enumify(parts.join('')), n: answers.length };
};

/* ---------- display-only: put "(1) .. (2) .. (3) .." points on their own lines ---------- */
const ENUM_SETS = [['1','2','3','4','5','6','7','8','9'], ['i','ii','iii','iv','v','vi','vii','viii','ix','x'], ['a','b','c','d','e','f','g','h']];
App.enumify = function(h){
  if (typeof h !== 'string' || h.indexOf('(') < 0) return h;
  const re = /(^|[\s:;,.])\(([1-9]|[ivx]{1,4}|[a-h])\)(?=\s)/g; const hits = []; let m;
  while ((m = re.exec(h))) hits.push({ i: m.index, pre: m[1], mk: m[2], len: m[0].length });
  const mark = new Set();
  for (const set of ENUM_SETS) {
    let want = 0, run = [];
    for (const x of hits) { if (x.mk === set[want]) { run.push(x); want++; } }
    if (run.length >= 2) run.forEach(x => mark.add(x.i));
  }
  if (!mark.size) return h;
  let out = '', last = 0;
  for (const x of hits) {
    if (!mark.has(x.i)) continue;
    out += h.slice(last, x.i) + (/\s/.test(x.pre) || !x.pre ? '' : x.pre) + (x.i === 0 && !x.pre ? '' : '<br class="en">') + '<b class="en">(' + x.mk + ')</b>';
    last = x.i + x.len;
  }
  return out + h.slice(last);
};

/* ---------- rendering helpers ---------- */
const CITE = /\[SG p\.(\d+)(?:\s*[-–]\s*(\d+))?([^\]]*)\]/g;
App.cite = function(escaped){ // escaped HTML string -> citation chips
  return escaped.replace(/\[SG p\.(\d+)(?:\s*[-–]\s*(\d+))?([^\]]*)\]/g, (m, a, b, rest) => {
    const lab = (rest.match(/printed\s+([^\]|]+)/) || [])[1] || App.pageLabel(+a);
    return `<a class="cite" data-page="${a}" href="#" title="Open guide page ${a}">p.${lab ? lab.trim() : a}${b ? '–' + b : ''}</a>`;
  });
};
App.inline = function(s){
  let h = esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code>$1</code>').replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s).,;:]|$)/g, '$1<i>$2</i>');
  return App.enumify(App.cite(h));
};
App.md = function(src){
  const lines = src.replace(/\r/g,'').split('\n'); const out = []; let i = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (/^\s*$/.test(l)) { i++; continue; }
    let m;
    if ((m = l.match(/^(#{1,4})\s+(.*)/))) { const n = Math.min(m[1].length + 0, 4); out.push(`<h${n}>${App.inline(m[2])}</h${n}>`); i++; continue; }
    if (/^\|/.test(l)) {
      const rows = []; while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = r => r.replace(/\\\|/g, '│').trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim().replace(/│/g,'|'));
      const head = cells(rows[0]); const body = rows.slice(2).map(cells);
      out.push('<div class="scroll-x"><table><thead><tr>' + head.map(c => `<th>${App.inline(c)}</th>`).join('') + '</tr></thead><tbody>' +
        body.map(r => '<tr>' + r.map(c => `<td>${App.inline(c)}</td>`).join('') + '</tr>').join('') + '</tbody></table></div>');
      continue;
    }
    if (/^\s*[-*]\s+/.test(l)) {
      const items = []; while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i++; }
      out.push('<ul>' + items.map(x => `<li>${App.inline(x)}</li>`).join('') + '</ul>'); continue;
    }
    if (/^\s*\d+[.)]\s+/.test(l)) {
      const items = []; while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*\d+[.)]\s+/, '')); i++; }
      out.push('<ol>' + items.map(x => `<li>${App.inline(x)}</li>`).join('') + '</ol>'); continue;
    }
    const para = []; while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,4}\s|\||\s*[-*]\s)/.test(lines[i])) { para.push(lines[i]); i++; }
    out.push(`<p>${App.inline(para.join(' '))}</p>`);
  }
  return out.join('\n');
};

/* ---------- guide page viewer ---------- */
App.openPage = function(p){
  p = Math.max(1, Math.min(441, +p)); const modal = $('#modal');
  if (window.HKSI_PUBLIC) { const lab = App.pageLabel(p), t = App.topicOfPage(p); modal.hidden = false;
    modal.innerHTML = `<div class="box" role="dialog" aria-label="Guide page"><div class="mh"><b>Study Guide page ${esc(lab)}</b><span class="chip">PDF p.${p}</span>${t ? `<span class="chip acc">Topic ${t}</span>` : ''}<span class="sp"></span><button class="btn sm" data-close>Close</button></div><div class="mb"><p style="padding:18px 6px">Open your copy of the HKSI Paper 1 Study Guide v3.5 at <b>PDF page ${p}</b> (printed page <b>${esc(lab)}</b>) to read this in full. The guide itself is HKSI's copyright and is not reproduced on this site.</p></div></div>`; return; }
  const lab = App.pageLabel(p); const t = App.topicOfPage(p);
  modal.hidden = false;
  modal.innerHTML = `<div class="box" role="dialog" aria-label="Guide page"><div class="mh"><b>Guide page ${esc(lab)}</b><span class="chip">PDF p.${p}</span>${t ? `<span class="chip acc">Topic ${t}</span>` : ''}<span class="sp"></span>
    <button class="btn sm" data-go="${p-1}" ${p<=1?'disabled':''}>‹ Prev</button><button class="btn sm" data-go="${p+1}" ${p>=441?'disabled':''}>Next ›</button><button class="btn sm" data-close>Close</button></div>
    <div class="mb"><img alt="Study guide page ${p}" src="../02_page_images/study_guide_v3.5/p${String(p).padStart(3,'0')}.jpg" onerror="this.replaceWith(Object.assign(document.createElement('p'),{className:'empty',textContent:'Page image not found next to the tool. Keep the folder 02_page_images beside 06_study_tool.'}))"></div></div>`;
};
App.closeModal = () => { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; };
document.addEventListener('click', e => {
  const c = e.target.closest('.cite'); if (c) { e.preventDefault(); App.openPage(c.dataset.page); return; }
  const g = e.target.closest('[data-go]'); if (g && !g.disabled) { App.openPage(g.dataset.go); return; }
  if (e.target.closest('[data-close]') || e.target.id === 'modal') App.closeModal();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') App.closeModal(); });

App.chip = (txt, kind='') => `<span class="chip ${kind}">${esc(txt)}</span>`;
App.trustChip = q => { const m = App.trustMeta[App.trust(q)]; return App.chip(m[0], m[1]); };
App.pct = (a, b) => b ? Math.round(100 * a / b) : 0;
App.shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
})();

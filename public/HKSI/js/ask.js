/* Ask the guide: a sidebar chat over the verified guide extract, powered by Claude Haiku only.
   - Grounded answers: every reply is built from retrieved guide facts with page numbers; the
     passages used are shown under each answer so nothing can be silently invented.
   - Photos (two-phase): Haiku first transcribes the question(s) verbatim, the transcript is
     searched against the extract, then a grounded call answers it or declares it outside the
     guide. Out-of-scope items are collected to a "for Josh" list that can be emailed or copied
     (the site is static, so nothing leaves the browser by itself).
   - The API key is pasted in once and stored only in this browser's localStorage; it is never
     part of the site. No key, no AI call: without one you still get the guide passages. */
(function(){
const App = window.App, D = App.D, esc = App.esc, $ = App.$;
const MODELS = ['claude-haiku-5-5', 'claude-haiku-4-5'];   // Haiku only
const STOP = new Set(['the','and','of','in','to','for','where','does','do','what','how','is','are','a','an','on','about','guide','says','tell','me','it','that','this','when','which','can','i']);
const SYS = `You are the study assistant inside the HKSI Paper 1 Study Tool. The user is preparing for the HKSI Paper 1 exam (Study Guide v3.5).
You answer ONLY from the extracted guide passages provided, each tagged with its guide page number like [p.148]. Cite pages as p.N whenever you use a passage.
If the passages do not answer the question, say so plainly, show the closest pages, and never invent rules, numbers or page numbers. Keep answers short and exam-focused.
When asked "where does the guide talk about X", list the pages/sections found with a one-line pointer each.
For a photo question you receive a verbatim transcript plus the guide passages found from it: if the passages cover the tested rule(s), answer the question and show which pages cover it, then end with the exact line: SCOPE: COVERED
If the passages genuinely do not cover it — a rule the guide v3.5 extract does not state, or material from a different paper or regime — say "fair enough: this looks outside the guide extract", name what it appears to test instead, remind the user it is being collected for the author, then end with the exact line: SCOPE: NOT_FOUND
Never write a SCOPE line for anything other than photo questions.`;
const SYS_TRANSCRIBE = 'Transcribe the exam-style question(s) shown in the photo verbatim and completely: the stem, any statements I-IV, and all options A-D, keeping every number exactly. Output only the transcript, nothing else.';
const ui = { open: false, attach: null, busy: false, lastImg: null };
function st(){ const s = App.load(); s.chat = s.chat || []; s.outscope = s.outscope || []; s.settings = s.settings || {}; return s; }

/* ---------- retrieval over the verified extract ---------- */
function retrieve(q){
  const terms = (q || '').toLowerCase().split(/[^a-z0-9$%]+/).filter(w => w.length > 2 && !STOP.has(w));
  if (!terms.length) return [];
  const hits = [];
  for (let t = 1; t <= 9; t++) (D.lessons[t] || []).forEach(L => {
    const f = (L.f || '').toLowerCase(), qt = (L.q || '').toLowerCase(), h = (L.h || '').toLowerCase();
    let s = 0; terms.forEach(w => { if (f.includes(w)) s += 3; if (qt.includes(w)) s += 2; if (h.includes(w)) s += 1; });
    if (terms.length > 1 && f.includes(terms.join(' '))) s += 8;
    if (s > 0) hits.push({ s, kind: 'lesson', txt: L.f, quote: L.q, p: L.p });
  });
  (D.figures || []).forEach(FG => {
    const f = (FG.subject + ' ' + (FG.detail || '')).toLowerCase();
    let s = 0; terms.forEach(w => { if (f.includes(w)) s += 2; });
    if (s > 0) hits.push({ s, kind: 'figure', txt: FG.subject + ' — ' + FG.figure, quote: FG.quote, p: FG.pdf_page });
  });
  hits.sort((a, b) => b.s - a.s);
  return hits.slice(0, 12);
}
const ctxOf = h => h.length ? h.map(x => `[p.${x.p}] ${x.txt}${x.quote ? ` — guide says: "${x.quote.slice(0, 220)}"` : ''}`).join('\n') : '(no passages matched)';

/* ---------- Haiku (Haiku only; model fallback; per-call system prompt) ---------- */
async function haiku(key, msgs, sys){
  const s = st(); let lastErr = '';
  const headers = { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json',
    'anthropic-dangerous-direct-browser-access': 'true' };
  if (s.settings.apiWs) headers['anthropic-workspace-id'] = s.settings.apiWs;   // user-scoped keys need this
  for (const model of MODELS) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: {
        'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true' },
        body: JSON.stringify({ model, max_tokens: 900, temperature: 0, system: sys || SYS, messages: msgs }) });
      if (!r.ok) { const t = (await r.text()).slice(0, 200);
        if (r.status === 404 || /model/i.test(t)) { lastErr = t; continue; }   // unknown model id → older haiku
        throw new Error(r.status === 401 ? 'the API key was rejected (401)' : (t || ('HTTP ' + r.status))); }
      const d = await r.json();
      return (d.content || []).map(c => c.text || '').join('').trim();
    } catch (e) { lastErr = e.message; if (/rejected/.test(e.message)) break; }
  }
  throw new Error(lastErr || 'the request failed');
}

/* ---------- storage hygiene: keep chat images under the quota ---------- */
function pruneImgs(s){
  let total = s.chat.reduce((n, m) => n + (m.img ? m.img.length : 0), 0) + s.outscope.reduce((n, o) => n + (o.img ? o.img.length : 0), 0);
  if (total < 3.5e6) return;
  for (const m of s.chat) { if (total < 3.5e6) break; if (m.img) { total -= m.img.length; m.img = null; } }
  App.save();
}
function scopeOf(text){ const m = text.match(/SCOPE:\s*(COVERED|NOT_FOUND)/i); return m ? m[1].toUpperCase() : null; }

/* ---------- send flows ---------- */
function send(){
  const s = st(); const inp = $('#askinput'); const q = inp.value.trim();
  if (ui.busy) return;
  if (ui.attach) { const img = ui.lastImg;
    s.chat.push({ role: 'user', text: '[photo] ' + (q || 'Is this in the guide?'), img });
    inp.value = ''; ui.attach = null; renderAttach(); pruneImgs(s); App.save(); renderLog();
    handlePhoto(q); return; }
  if (!q) return;
  s.chat.push({ role: 'user', text: q }); inp.value = ''; App.save(); renderLog();
  answerText(q);
}
function answerText(q){
  const s = st(); const hits = retrieve(q);
  const key = s.settings.apiKey;
  if (!key) { s.chat.push({ role: 'assistant', text: 'No API key is set, so here is what the search found — the page links answer "where does the guide talk about it". Add a key (bottom of this panel) to get written answers from Claude Haiku.', hits }); App.save(); renderLog(); return; }
  ui.busy = true; spin(true);
  const hist = s.chat.slice(0, -1).slice(-2).map(m => ({ role: m.role, content: m.text }));
  s.chat.push({ role: 'assistant', text: '…' }); renderLog();
  haiku(key, hist.concat([{ role: 'user', content: `Passages from the Study Guide v3.5 extract:\n${ctxOf(hits)}\n\nQuestion: ${q}` }]))
    .then(reply => { s.chat.pop(); s.chat.push({ role: 'assistant', text: reply, hits }); App.save(); })
    .catch(e => { s.chat.pop(); s.chat.push({ role: 'assistant', text: 'The AI call failed: ' + e.message + '\n\nThe guide passages found are below — they still answer "where does the guide talk about it".', hits }); App.save(); })
    .finally(() => { ui.busy = false; spin(false); renderLog(); });
}
async function handlePhoto(note){
  const s = st(); const key = s.settings.apiKey; const img = ui.lastImg;
  if (!key) { s.chat.push({ role: 'assistant', text: 'No API key is set, so I cannot read the photo. Add a key (bottom of this panel), then send it again.' }); App.save(); renderLog(); return; }
  ui.busy = true; spin(true);
  const say = t => { s.chat[s.chat.length - 1] && s.chat[s.chat.length - 1].role === 'assistant' && s.chat.pop(); };
  s.chat.push({ role: 'assistant', text: 'Reading the photo…' }); renderLog();
  try {
    const transcript = await haiku(key, [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: ui.attachMeta, data: img.split(',')[1] } },
      { type: 'text', text: SYS_TRANSCRIBE + (note ? `\nUser note: ${note}` : '') } ] }], SYS_TRANSCRIBE);
    const hits = retrieve(transcript);
    say();
    const reply = await haiku(key, [{ role: 'user', content:
      `Passages from the Study Guide v3.5 extract:\n${ctxOf(hits)}\n\nVerbatim transcript of the photo question(s):\n${transcript}\n\nAssess scope as instructed${note ? ' (user note: ' + note + ')' : ''}.` }]);
    const scope = scopeOf(reply);
    const text = reply.replace(/\n?SCOPE:\s*(COVERED|NOT_FOUND)/i, '');
    if (scope === 'NOT_FOUND') {
      s.outscope.push({ d: new Date().toISOString().slice(0, 10), note: note || '', transcript: transcript.slice(0, 900), reply: text.trim().slice(0, 600), img });
      if (s.outscope.length > 30) s.outscope.shift();
      s.chat.push({ role: 'assistant', text: 'Transcript:\n' + transcript + '\n\n' + text + '\n\n✅ Saved to the "for Josh" list — the button at the bottom of this panel emails or copies everything collected.', hits, scope });
    } else {
      s.chat.push({ role: 'assistant', text: 'Transcript:\n' + transcript + '\n\n' + text, hits, scope: scope || null });
    }
    pruneImgs(s); App.save();
  } catch (e) {
    say();
    s.chat.push({ role: 'assistant', text: 'The AI call failed: ' + e.message }); App.save();
  } finally { ui.busy = false; spin(false); renderLog(); }
}

/* ---------- UI ---------- */
function hitsHTML(h){ return h && h.length ? `<details class="acc small" style="margin:8px 0"><summary>Guide passages used (${h.length})</summary><div class="in">${h.map(x => `<p class="small" style="margin:6px 0"><a class="cite" data-page="${x.p}" href="#">p.${esc(App.pageLabel(x.p))}</a> ${x.kind === 'figure' ? '<b>figure:</b> ' : ''}${esc(x.txt)}${x.quote ? ` <span class="muted">“${esc(x.quote.slice(0, 160))}${x.quote.length > 160 ? '…' : ''}”</span>` : ''}</p>`).join('')}</div></details>` : ''; }
function renderAttach(){
  const el = $('#askattachrow'); if (!el) return;
  el.innerHTML = ui.attach ? `<span class="chip warn" style="cursor:pointer" id="askrm" title="Remove attachment">📎 photo attached — tap to remove</span>` : '';
  const rm = $('#askrm'); if (rm) rm.onclick = () => { ui.attach = null; renderAttach(); };
}
function renderLog(){
  const s = st(); const log = $('#asklog'); if (!log) return;
  log.innerHTML = s.chat.slice(-40).map(m => `<div class="askmsg ${m.role}">${m.img ? `<img class="askimg" src="${m.img}" alt="attached photo">` : ''}
    <div class="asktxt">${esc(m.text).replace(/\n/g, '<br>')}</div>
    ${m.scope ? `<span class="chip ${m.scope === 'NOT_FOUND' ? 'bad' : 'good'}">${m.scope === 'NOT_FOUND' ? 'not in the guide extract — saved for Josh' : 'covered by the guide'}</span>` : ''}
    ${hitsHTML(m.hits)}</div>`).join('');
  log.scrollTop = log.scrollHeight;
  const el = $('#askcollect'); if (el) el.innerHTML = s.outscope.length ? `For Josh (${s.outscope.length})` : 'For Josh';
}
function renderCollect(){
  const s = st();
  $('#askmodalbody').innerHTML = `<h3 style="margin:4px 0 6px">Collected for Josh <span class="muted small">outside the guide extract</span></h3>
  <p class="muted small" style="margin:0 0 10px">Everything stacks up here as you go — nothing is sent until you press a button below, and it all goes in one message.</p>
  ${s.outscope.length ? s.outscope.slice().reverse().map((o, ri) => { const i = s.outscope.length - 1 - ri; return `<details class="acc" open><summary><span class="chip bad">out of scope</span> ${esc(o.d)} — ${esc((o.transcript || o.reply).slice(0, 76))}…<button class="iconbtn" data-oi="${i}" title="Remove this item" style="margin-left:auto">×</button></summary><div class="in">
    <p class="small" style="white-space:pre-wrap">${esc(o.transcript || '(no transcript)')}</p>
    <p class="small muted">Why: ${esc(o.reply.slice(0, 400))}</p>
    ${o.img ? `<a class="cite" download="hksi-outscope-${o.d}-${i + 1}.jpg" href="${o.img}">download the photo</a>` : '<span class="muted small">photo no longer stored (quota) — transcript above</span>'}</div></details>`; }).join('') + `
    <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button class="btn primary" id="ocmail">Email all to Josh</button><button class="btn" id="occopy">Copy all as text</button></div>`
  : '<p class="empty">Nothing collected yet. Attach a photo of a question the guide doesn\u2019t cover and it will land here.</p>'}`;
  $('#askmodalbody').querySelectorAll('[data-oi]').forEach(b => b.onclick = e => { e.preventDefault(); s.outscope.splice(+b.dataset.oi, 1); App.save(); renderCollect(); renderLog(); });
  if (!s.outscope.length) return;
  const txt = () => s.outscope.map((o, i) => `--- Out-of-scope question ${i + 1} (${o.d})${o.note ? ' — note: ' + o.note : ''} ---\n${o.transcript}\nWhy it looks out of scope: ${o.reply}`).join('\n\n');
  $('#occopy').onclick = () => { if (navigator.clipboard) navigator.clipboard.writeText(txt()).then(() => App.toast('Copied — paste it to Josh when you like')); else App.toast('Clipboard not available'); };
  $('#ocmail').onclick = () => {
    let to = s.settings.joshEmail || '';
    if (!to) { to = (prompt('Josh\u2019s email address (stored in this browser only):') || '').trim(); if (!to) return; s.settings.joshEmail = to; App.save(); }
    location.href = 'mailto:' + encodeURIComponent(to) + '?subject=' + encodeURIComponent('HKSI: questions outside the guide extract') + '&body=' + encodeURIComponent(txt());
  };
}
function spin(on){ const b = $('#asksend'); if (b) { b.disabled = on; b.textContent = on ? '…' : 'Ask'; } }
function openAsk(prefill){
  ui.open = true; $('#askdock').hidden = false;
  renderLog(); renderAttach(); keyUI();
  const inp = $('#askinput'); if (prefill) inp.value = prefill; inp.focus();
}
function keyUI(){
  const s = st(); const has = s.settings.apiKey;
  $('#askkeybox').innerHTML = has
    ? `<span class="muted small">Haiku key set ✓</span> <button class="btn sm" id="askkey">change</button>`
    : `<button class="btn sm primary" id="askkey">Paste API key</button>`;
  $('#askkey').onclick = () => {
    const k = (prompt('Anthropic API key (sk-ant-…). It is stored only in this browser and never becomes part of the site. Use a Haiku-capable key.') || '').trim();
    const s = st(); if (k) s.settings.apiKey = k; else delete s.settings.apiKey; App.save(); keyUI();
  };
}
function downscale(dataUrl){
  return new Promise(res => {
    const img = new Image();
    img.onload = () => {
      const MAX = 1568; let w = img.width, h = img.height;
      if (Math.max(w, h) > MAX) { const k = MAX / Math.max(w, h); w = Math.round(w * k); h = Math.round(h * k); }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      c.getContext('2d').drawImage(img, 0, 0, w, h);
      res(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => res(dataUrl);
    img.src = dataUrl;
  });
}
async function attachFile(f){
  if (!f) return;
  const r = new FileReader();
  r.onload = async () => {
    const small = await downscale(r.result);
    ui.lastImg = small; ui.attach = true; ui.attachMeta = 'image/jpeg';
    renderAttach(); openAsk();
  };
  r.readAsDataURL(f);
}
function boot(){
  /* one-tap key handoff: #askkey=...&ws=... stores the key (and optional workspace id
     for user-scoped keys) in this browser only, then wipes the URL */
  const km = (location.hash || '').match(/^#askkey=([^&]+)(&ws=([^&]+))?/);
  if (km) { const s = st(); s.settings.apiKey = decodeURIComponent(km[1].trim());
    if (km[3]) s.settings.apiWs = decodeURIComponent(km[3].trim()); else delete s.settings.apiWs;
    App.save(); history.replaceState(null, '', location.pathname + location.search);
    setTimeout(() => App.toast('API key stored in this browser only ✓'), 400); }
  const nav = $('#nav');
  if (nav && !$('#askbar')) nav.insertAdjacentHTML('beforeend',
    `<div id="askbar"><input id="askmini" placeholder="Ask the guide…" aria-label="Ask the guide"><button id="askgo" aria-label="Open chat">✦</button></div>`);
  if (!$('#askdock')) document.body.insertAdjacentHTML('beforeend', `
  <div id="askdock" hidden>
    <div class="askhead"><b>✦ Ask the guide</b><span class="muted small">Haiku · answers only from the verified extract</span><button class="iconbtn" id="askclose" aria-label="Close">×</button></div>
    <div id="asklog"></div>
    <div id="askattachrow"></div>
    <div class="askin">
      <button class="iconbtn" id="askclip" title="Attach a photo of a question">📎</button>
      <input id="askinput" placeholder="Where does the guide talk about…">
      <button class="btn primary" id="asksend">Ask</button>
    </div>
    <div class="askfoot"><button class="btn sm" id="askcollect">For Josh</button><span id="askkeybox"></span></div>
    <input type="file" id="askfile" accept="image/*" capture="environment" hidden>
    <div id="modal2" class="modal" hidden><div class="box" style="width:min(560px,94vw)"><div class="mh"><b>Out-of-scope questions</b><button class="iconbtn" id="askmclose" aria-label="Close">×</button></div><div class="mb" id="askmodalbody" style="padding:16px;overflow:auto;max-height:80vh;background:var(--bg)"></div></div></div>
  </div>`);
  const mini = $('#askmini');
  if (mini) {
    const go = () => { openAsk(mini.value.trim()); mini.value = ''; };
    $('#askgo').onclick = go;
    mini.onkeydown = e => { if (e.key === 'Enter') go(); };
  }
  $('#askclose').onclick = () => { $('#askdock').hidden = true; };
  $('#asksend').onclick = send;
  $('#askinput').onkeydown = e => { if (e.key === 'Enter') send(); };
  $('#askclip').onclick = () => $('#askfile').click();
  $('#askfile').onchange = e => { const f = e.target.files[0]; e.target.value = ''; attachFile(f); };
  $('#askinput').addEventListener('paste', e => { const it = [...((e.clipboardData || {}).items || [])].find(i => i.type.startsWith('image/')); if (it) { e.preventDefault(); attachFile(it.getAsFile()); } });
  $('#askcollect').onclick = () => { renderCollect(); $('#modal2').hidden = false; };
  $('#askmclose').onclick = () => { $('#modal2').hidden = true; };
  keyUI(); renderLog();
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('#navlinks a[href="#"]');
    if (a && /Ask/.test(a.textContent)) { e.preventDefault(); openAsk(); }
  });
}
boot();
})();

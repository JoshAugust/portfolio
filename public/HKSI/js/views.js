/* Views: home, learn, topic, search, practice setup, mock setup, weak spots, sources */
(function(){
const App = window.App, D = App.D, esc = App.esc, $ = App.$;
const V = App.views = {};
const SRC = { past2006:'Past paper (Dec 2006)', sample2023:'Official sample test (Oct 2023)', generated:'New questions written from the guide', unofficial:'Unofficial question banks' };
const TYPE_LABEL = { rule:'Rule', list:'List', number:'Number', principle:'Principle', definition:'Definition', contrast:'Contrast', exception:'Exception' };

function stats(){
  const s = App.load(); const scored = D.questions.filter(App.isScored);
  let n = 0, wrong = 0, seen = 0;
  scored.forEach(q => { const a = s.attempts[q.id]; if (a) { seen++; n += a.n; wrong += a.wrong; } });
  const learned = Object.keys(s.learned).length;
  return { n, wrong, seen, total:scored.length, acc: n ? 1 - wrong / n : null, learned, facts: App.allFacts.length,
    due: App.dueQuestions().length + App.dueCards().length, mistakes: App.mistakes().length };
}
function topicProgress(t){
  const s = App.load(); const facts = D.lessons[t] || []; const learned = facts.filter(f => s.learned[f.id]).length;
  const w = App.weakness().topics[t];
  return { facts: facts.length, learned, acc: w ? w.acc : null, n: w ? w.n : 0, open: w ? w.open : 0 };
}
const weightTxt = t => t.wmin ? `${t.wmin}–${t.wmax}%` : `up to ${t.wmax}%`;

/* ---------- Home notices: resume, tour, backup ---------- */
function notices(){
  const s = App.load(); let h = '';
  const ar = s.activeRun;
  if (ar && !ar.submitted) { const done = Object.keys(ar.ans || {}).length;
    h += `<div class="card notice"><div class="sp"><b>You have an unfinished ${ar.kind === 'mock' ? 'mock exam' : 'quiz'}</b><div class="muted small">${done} of ${ar.ids.length} answered. It was saved automatically${ar.kind === 'mock' ? ', and the clock was paused while you were away' : ''}.</div></div><button class="btn primary" id="resume">Resume</button><button class="btn ghost" id="discard">Discard</button></div>`; }
  if (!s.settings.tourSeen) h += `<div class="card notice"><div class="sp"><b>New here?</b><div class="muted small">A one-minute tour shows where everything is and how your progress is kept.</div></div><button class="btn primary" id="hometour">Take the tour</button><button class="btn ghost" id="tourno">Not now</button></div>`;
  const answers = Object.values(s.attempts).reduce((a, x) => a + x.n, 0);
  if (App.storageOK && (answers >= 25 || (s.sessions || []).length >= 2) && Date.now() - (s.lastExport || 0) > 7 * 864e5)
    h += `<div class="card notice"><div class="sp"><b>Keep a backup</b><div class="muted small">Your progress lives in this browser only. A backup file protects it if you clear browser data or switch device.</div></div><button class="btn" id="homebk">Download backup</button></div>`;
  return h;
}

/* ---------- Results history ---------- */
V.history = function(view){
  const s = App.load(); const list = (s.sessions || []).slice().reverse(); const saved = new Set((s.runs || []).map(r => r.id));
  const last = (s.sessions || []).slice(-24);
  const spark = last.length ? `<div class="spark" aria-label="Score for each of your last ${last.length} sessions">${last.map(x => `<i class="${x.kind === 'mock' ? 'mock' : ''}" style="height:${Math.max(4, App.pct(x.score, x.n))}%" title="${App.pct(x.score, x.n)}%"></i>`).join('')}<span class="passline" style="bottom:70%"></span></div><div class="row small muted" style="margin-top:6px"><span><i class="chip" style="background:var(--accent);padding:0 6px">&nbsp;</i> practice</span><span><i class="chip" style="background:var(--coral);padding:0 6px">&nbsp;</i> mock exam</span><span>dashed line = 70% pass mark</span></div>` : '';
  const kl = { practice:'Practice', retry:'Retry mistakes', targeted:'Targeted quiz', mock:'Mock exam', review:'Daily review' };
  view.innerHTML = `<h1>Your <em>results</em></h1><p class="lead">Every finished quiz and mock exam is saved here, along with the questions you answered. Nothing is lost when you close the tab.</p>
  ${list.length ? `<div class="card" style="margin:18px 0">${spark}</div>
  <div class="card scroll-x" style="padding:8px 18px"><table class="tbl"><thead><tr><th>When</th><th>Type</th><th>Score</th><th></th><th>Time</th><th></th></tr></thead><tbody>${list.map(x => { const p = App.pct(x.score, x.n); const tm = Math.round((x.ms || 0) / 60000);
    return `<tr><td>${new Date(x.ts).toLocaleString([], { dateStyle:'medium', timeStyle:'short' })}</td><td>${((D.exams || []).find(e => e.id === x.exam) || {}).name || kl[x.kind] || x.kind}</td><td><b>${x.score} / ${x.n}</b> · ${p}%</td><td>${x.kind === 'mock' ? `<span class="chip ${p >= 70 ? 'good' : 'bad'}">${p >= 70 ? 'Pass' : 'Below 70%'}</span>` : ''}</td><td>${tm || '<1'} min</td><td>${saved.has(x.id) ? `<button class="btn sm" data-open="${x.id}">Review</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>
  <p class="muted small" style="margin-top:12px">Answers to individual questions also feed your <a href="#/mistakes">weak spots</a>. The last 15 sessions can be reopened for review.</p>`
  : `<div class="card empty">No finished sessions yet. <a href="#/practice">Start a quiz</a> and your results will appear here.</div>`}
  <div class="card flat" style="margin-top:18px"><b class="small">Where is this saved?</b> <span class="muted small">In this browser on this device, and it survives refreshing and closing the tab. It is lost only if you clear your browser's site data, use a private window, or switch browser or device. <a href="#/sources">Download a backup</a> to keep a copy or move it elsewhere.</span></div>`;
  view.querySelectorAll('[data-open]').forEach(b => b.onclick = () => App.openSavedRun(b.dataset.open));
};

/* ---------- Home ---------- */
V.home = function(view){
  const st = stats(); const rec = App.recommendTopics().slice(0, 3);
  view.innerHTML = `
  <div style="padding:18px 0 6px"><div class="chip acc">Study Guide v3.5 · exams from 30 June 2026</div>
  <h1 style="margin-top:14px;font-size:clamp(2.2rem,5vw,3.4rem);line-height:1.08">Paper 1: <em>Fundamentals</em> of Securities and Futures Regulation</h1>
  <p class="lead">Every fact and every answer in this tool traces back to a page of the official study guide. Questions you miss are remembered, so the tool can show you what to revisit.</p></div>
  ${notices()}
  <div class="grid g4" style="margin:22px 0">
    <div class="card stat"><b>${st.acc === null ? '–' : Math.round(st.acc*100) + '%'}</b><span>accuracy so far (${st.n} answers)</span></div>
    <div class="card stat"><b>${st.seen}<small class="muted" style="font-size:1rem"> / ${st.total}</small></b><span>questions attempted</span></div>
    <div class="card stat"><b>${st.learned}<small class="muted" style="font-size:1rem"> / ${st.facts}</small></b><span>facts marked as learned</span></div>
    <div class="card stat"><b>${st.due}</b><span>due for review today</span></div>
  </div>
  <div class="row" style="margin-bottom:8px">
    <a class="btn primary" href="#/practice">Start practising</a>
    ${st.due ? `<button class="btn" id="dueq">Review ${st.due} due</button>` : ''}
    <a class="btn" href="#/mock">Take a mock exam</a><a class="btn" href="#/learn">Learn the guide</a><a class="btn" href="#/history">My results</a>
  </div>
  ${rec.length ? `<h2 style="margin-top:30px">Where to focus next</h2><div class="grid g3">${rec.map(w => { const t = App.topic(w.id); return `<div class="card"><div class="topic-no">Topic ${t.id}</div><h3>${esc(t.short)}</h3><p class="muted small">${w.open} open mistake${w.open===1?'':'s'}${w.acc !== null ? ` · ${Math.round(w.acc*100)}% accurate` : ''}</p><div class="row"><a class="btn sm" href="#/learn/${t.id}">Re-read</a><button class="btn sm primary" data-quiz="${t.id}">Quiz me</button></div></div>`; }).join('')}</div>` : ''}
  <h2 style="margin-top:30px">Topics</h2>
  <div class="grid g3">${D.topics.map(t => { const p = topicProgress(t.id); return `<a class="card topic-card" href="#/learn/${t.id}"><div class="topic-no">Topic ${t.id} · exam weight ${weightTxt(t)}</div><h3 style="margin:0">${esc(t.title)}</h3>
    <div><div class="bar"><i style="width:${App.pct(p.learned, p.facts)}%"></i></div><div class="row small muted" style="margin-top:6px"><span>${p.learned}/${p.facts} facts learned</span><span class="sp"></span><span>${p.acc === null ? 'no quiz data' : Math.round(p.acc*100) + '% accurate'}</span></div></div></a>`; }).join('')}</div>
  <div class="card flat" style="margin-top:28px"><b>How far to trust it.</b> <span class="muted">Each question is labelled. "Verified in guide" means the current guide supports the answer directly. "Best-supported" means it is the best option but some reasoning is inferred. "Unverified" questions are hidden unless you switch them on. <a href="#/sources">Details</a></span></div>`;
  const rs = $('#resume'); if (rs) rs.onclick = () => App.resumeRun();
  const ds = $('#discard'); if (ds) ds.onclick = () => { if (confirm('Discard the unfinished session?')) { App.discardRun(); App.route(); } };
  const tt = $('#hometour'); if (tt) tt.onclick = () => App.startTour();
  const td = $('#tourno'); if (td) td.onclick = () => { App.load().settings.tourSeen = true; App.save(); App.route(); };
  const bk = $('#homebk'); if (bk) bk.onclick = () => { App.exportProgress(); App.route(); };
  const dq = $('#dueq'); if (dq) dq.onclick = () => { const q = App.dueQuestions(); if (q.length) App.startRun('review', q.map(x => x.id)); else App.startCards(App.dueCards()); };
  view.querySelectorAll('[data-quiz]').forEach(b => b.onclick = () => startTopicQuiz(+b.dataset.quiz));
};
function startTopicQuiz(t, n=15){
  const s = App.load();
  const ids = App.shuffle(App.pool({ topics:[t] })).sort((a,b) => (s.attempts[a.id] ? 1 : 0) - (s.attempts[b.id] ? 1 : 0)).slice(0, n).map(q => q.id);
  App.startRun('practice', ids);
}
App.startTopicQuiz = startTopicQuiz;

/* ---------- Learn index + topic ---------- */
V.learn = function(view, parts){
  if (parts[1]) return V.topic(view, +parts[1], parts[2] || 'summary');
  view.innerHTML = `<h1>Learn the guide</h1><p class="lead">Nine topics, each broken into atomic facts with a link to the exact guide page. Tick facts as you learn them, then drill them.</p>
  <div class="grid g2" style="margin-top:20px">${D.topics.map(t => { const p = topicProgress(t.id); return `<a class="card topic-card" href="#/learn/${t.id}"><div class="topic-no">Topic ${t.id} · exam weight ${weightTxt(t)}</div><h2 style="margin:0">${esc(t.title)}</h2>
    <p class="muted small" style="margin:0">Guide pages ${esc(App.pageLabel(t.p0))} to ${esc(App.pageLabel(t.p1))}</p>
    <div class="bar"><i style="width:${App.pct(p.learned,p.facts)}%"></i></div><div class="row small muted"><span>${p.learned}/${p.facts} facts learned</span><span class="sp"></span><span>${p.open ? p.open + ' open mistakes' : ''}</span></div></a>`; }).join('')}</div>`;
};
V.topic = function(view, id, tab){
  const t = App.topic(id); if (!t) return V.learn(view, ['learn']);
  const p = topicProgress(id); const unofficial = (D.unofficial || []).filter(u => u.topic === id);
  const qn = App.pool({ topics:[id], includeUnverified:true }).length;
  view.innerHTML = `<div class="small"><a href="#/learn">‹ All topics</a></div>
  <div class="topic-no" style="margin-top:10px">Topic ${t.id} · exam weight ${weightTxt(t)}</div><h1>${esc(t.title)}</h1>
  <div class="row"><button class="btn primary" id="drill">Drill unlearned facts</button><button class="btn" id="quizt">Quiz this topic</button><span class="muted small">${p.learned}/${p.facts} facts learned · ${qn} questions</span></div>
  <div class="tabs" role="tablist">${[['summary','Summary'],['facts','All facts (' + p.facts + ')'],['unofficial','Unofficial notes (' + unofficial.length + ')']].map(([k,l]) => `<button class="${tab===k?'on':''}" data-tab="${k}" role="tab">${l}</button>`).join('')}</div><div id="tabbody"></div>`;
  view.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { location.hash = `#/learn/${id}/${b.dataset.tab}`; });
  $('#quizt').onclick = () => startTopicQuiz(id, 20);
  $('#drill').onclick = () => { const s = App.load(); const ids = App.shuffle(App.cardFacts.filter(f => f.topic === id && !s.learned[f.id])).slice(0, 25).map(f => f.id); App.startCards(ids); };
  const body = $('#tabbody');
  if (tab === 'summary') {
    body.innerHTML = `<div class="banner info" style="margin-bottom:14px">This summary was written from the guide. Each [p.x] link opens the exact guide page.</div><div class="md card">${App.md(D.digests[id] || '')}</div>`;
  } else if (tab === 'facts') renderFacts(body, id);
  else {
    body.innerHTML = `<div class="banner"><b>Unofficial notes.</b> Collected from third-party prep websites, not from HKSI, and paraphrased here. Only treat an item as reliable if it says "Matches the guide". Everything else is a lead to check, not a fact.</div><div style="margin-top:12px">${unofficial.length ? unofficial.map(u => `<div class="card flat" style="margin:8px 0"><div class="row small">${App.chip(u.kind || 'note', 'warn')}${u.guide_check === 'SUPPORTED' ? App.chip('Matches the guide', 'good') : u.guide_check === 'CONTRADICTED' ? App.chip('Contradicts the guide', 'bad') : App.chip('Not found in guide', 'warn')}<span class="muted">${esc(u.source_name || '')}</span></div><p style="margin:.5em 0 0">${esc(u.claim)}</p>${(u.guide_pages||[]).length ? `<div class="row small">${u.guide_pages.slice(0,4).map(g => `<a class="cite" data-page="${g}" href="#">p.${esc(App.pageLabel(g))}</a>`).join(' ')}</div>` : ''}${u.source_url ? `<div class="tiny muted"><a href="${esc(u.source_url)}" target="_blank" rel="noopener">Source</a></div>` : ''}</div>`).join('') : '<div class="empty">No unofficial notes for this topic yet.</div>'}</div>`;
  }
};
function renderFacts(body, id){
  const types = ['all', ...new Set(D.lessons[id].map(f => f.t))]; let ft = 'all', q = '';
  const draw = () => {
    const s = App.load(); const list = D.lessons[id].filter(f => (ft === 'all' || f.t === ft) && (!q || (f.f + ' ' + f.h).toLowerCase().includes(q)));
    const groups = []; list.forEach(f => { const g = groups[groups.length-1]; if (g && g.h === f.h) g.items.push(f); else groups.push({ h:f.h, items:[f] }); });
    $('#factlist').innerHTML = groups.length ? groups.map(g => `<div class="h-sec">${esc(g.h || 'General')}</div><div class="card flat" style="padding:4px 18px">${g.items.map(f => factHTML(f, s)).join('')}</div>`).join('') : '<div class="empty">Nothing matches.</div>';
    $('#factlist').querySelectorAll('.tick').forEach(b => b.onclick = () => { const st = App.load(); if (st.learned[b.dataset.id]) delete st.learned[b.dataset.id]; else st.learned[b.dataset.id] = 1; App.save(); b.classList.toggle('on'); App.refreshNav(); });
    $('#factlist').querySelectorAll('[data-q]').forEach(b => b.onclick = () => { const n = b.parentElement.nextElementSibling; n.hidden = !n.hidden; });
  };
  body.innerHTML = `<div class="row" style="margin-bottom:6px"><input class="input" id="ffind" placeholder="Filter facts…" style="min-width:200px"><div class="pills">${types.map(x => `<button class="pill ${x==='all'?'on':''}" data-t="${x}">${x === 'all' ? 'All types' : TYPE_LABEL[x] || x}</button>`).join('')}</div></div><div id="factlist"></div>`;
  $('#ffind').oninput = e => { q = e.target.value.toLowerCase().trim(); draw(); };
  body.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { ft = b.dataset.t; body.querySelectorAll('[data-t]').forEach(x => x.classList.toggle('on', x === b)); draw(); });
  draw();
}
function factHTML(f, s){
  return `<div class="fact"><button class="tick ${s.learned[f.id] ? 'on' : ''}" data-id="${f.id}" aria-label="Mark as learned">✓</button><div class="txt"><div>${esc(f.f)}</div>
    ${f.tr ? `<div class="trap"><b>Trap:</b> ${esc(f.tr)}</div>` : ''}
    <div class="row small" style="margin-top:6px">${App.chip(TYPE_LABEL[f.t] || f.t)}<a class="cite" data-page="${f.p}" href="#">p.${esc(App.pageLabel(f.p))}</a>${f.q ? `<button class="btn sm ghost" data-q style="padding:0 4px">guide wording</button>` : ''}</div>${f.q ? `<div class="quote" hidden>“${esc(f.q)}”</div>` : ''}</div></div>`;
}

/* ---------- Search ---------- */
V.search = function(view, parts){
  const q = decodeURIComponent(parts.slice(1).join('/')).toLowerCase().trim();
  const terms = q.split(/\s+/).filter(Boolean);
  const hit = s => terms.every(t => s.toLowerCase().includes(t));
  const facts = q ? App.allFacts.filter(f => hit(f.f + ' ' + f.h)).slice(0, 60) : [];
  const kc = q ? D.kc.filter(k => hit(k.q + ' ' + k.a)).slice(0, 10) : [];
  view.innerHTML = `<h1>Search</h1><p class="muted">${q ? `Results for “${esc(q)}”` : 'Type in the box above to search all 1,973 facts.'}</p>
    ${facts.map(f => `<div class="card flat" style="margin:8px 0"><div class="row small">${App.chip('Topic ' + f.topic, 'acc')}<span class="muted">${esc(f.h)}</span></div><p style="margin:.4em 0 0">${esc(f.f)}</p><div class="row small"><a class="cite" data-page="${f.p}" href="#">p.${esc(App.pageLabel(f.p))}</a></div></div>`).join('')}
    ${kc.length ? `<h2>Guide review questions</h2>${kc.map(k => `<div class="card flat" style="margin:8px 0"><b>${esc(k.q)}</b><p class="small">${esc(k.a)}</p><a class="cite" data-page="${k.pa || k.pq}" href="#">p.${esc(App.pageLabel(k.pa || k.pq))}</a></div>`).join('')}` : ''}
    ${q && !facts.length && !kc.length ? '<div class="empty">No facts match. Try fewer words.</div>' : ''}`;
};

/* ---------- Practice setup ---------- */
V.practice = function(view){
  const s = App.load(); const sel = { topics:new Set(), sources:new Set(['past2006','sample2023','generated']), len:20, mode:'mixed' };
  const draw = () => {
    const pool = App.pool({ topics:[...sel.topics], sources:[...sel.sources] });
    const unseen = pool.filter(q => !s.attempts[q.id]).length;
    view.innerHTML = `<h1>Quizzes</h1><p class="lead">Answer, check, and read exactly why each option stands or falls. Wrong answers are saved so the tool can show you what to revise.</p>
    <div class="card" style="margin-top:18px">
      <div class="field"><span class="lbl">Topics <span class="muted">(none selected = all)</span></span><div class="pills">${D.topics.map(t => `<button class="pill ${sel.topics.has(t.id)?'on':''}" data-t="${t.id}">${t.id}. ${esc(t.short)}</button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Question sources</span><div class="pills">${Object.entries(SRC).map(([k,l]) => `<button class="pill ${sel.sources.has(k)?'on':''}" data-s="${k}">${l}</button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Order</span><div class="pills">${[['mixed','Mixed'],['unseen','Unseen first'],['weak','My weakest first']].map(([k,l]) => `<button class="pill ${sel.mode===k?'on':''}" data-m="${k}">${l}</button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Length</span><div class="pills">${[10,20,40,0].map(n => `<button class="pill ${sel.len===n?'on':''}" data-n="${n}">${n || 'All'}</button>`).join('')}</div></div>
      <label class="row small" style="gap:8px"><input type="checkbox" id="unv" ${s.settings.showUnverified?'checked':''}> Include unverified questions (outdated or not covered by the current guide)</label>
      <div class="hr"></div><div class="row"><button class="btn primary" id="go" ${pool.length?'':'disabled'}>Start ${Math.min(sel.len || pool.length, pool.length)} questions</button><span class="muted small">${pool.length} available · ${unseen} not yet attempted</span></div>
    </div>
`;
    view.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const t = +b.dataset.t; sel.topics.has(t) ? sel.topics.delete(t) : sel.topics.add(t); draw(); });
    view.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { const k = b.dataset.s; sel.sources.has(k) ? sel.sources.delete(k) : sel.sources.add(k); draw(); });
    view.querySelectorAll('[data-m]').forEach(b => b.onclick = () => { sel.mode = b.dataset.m; draw(); });
    view.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { sel.len = +b.dataset.n; draw(); });
    $('#unv').onchange = e => { s.settings.showUnverified = e.target.checked; App.save(); draw(); };
    $('#go').onclick = () => {
      let list = App.shuffle(pool);
      if (sel.mode === 'unseen') list.sort((a,b) => (s.attempts[a.id] ? 1 : 0) - (s.attempts[b.id] ? 1 : 0));
      if (sel.mode === 'weak') { const w = App.weakness().topics; const sc = q => Math.max(0, ...q.topics.map(t => w[t] && w[t].n ? (w[t].wrong / w[t].n) : 0.3)) + (s.attempts[q.id] && s.attempts[q.id].wrong ? 1 : 0); list.sort((a,b) => sc(b) - sc(a)); }
      App.startRun('practice', list.slice(0, sel.len || list.length).map(q => q.id));
    };
  };
  draw();
};

/* ---------- Mock setup ---------- */
V.mock = function(view){
  const m = App.buildMock(60); const mins = Math.round(90 * m.size / 60); const S = App.load().sessions || [];
  const card = (id, title, sub, label, extra) => { const t = S.filter(x => id === 'RANDOM' ? (x.kind === 'mock' && !x.exam) : x.exam === id); const best = t.reduce((mx, x) => Math.max(mx, App.pct(x.score, x.n)), -1); const last = t[t.length - 1];
    return `<div class="card"><div class="topic-no">${label}</div><h3 style="margin:2px 0 8px">${esc(title)}</h3><p class="muted small" style="min-height:3.2em">${sub}<br>${t.length ? `Best ${best}% · latest ${App.pct(last.score, last.n)}% · taken ${t.length}×` : 'Not attempted yet.'}</p><button class="btn primary" data-exam="${id}">${t.length ? 'Take again' : 'Start'}</button></div>`; };
  view.innerHTML = `<h1><em>Exams</em></h1><p class="lead">The real paper has 60 multiple-choice questions in 90 minutes, and you need 70% (42 correct) to pass. Each exam below follows the topic weightings. No feedback until you submit; you can flag questions and jump around. A paused exam resumes where you left it, with the clock stopped while you were away.</p>
  ${m.available < 60 ? `<div class="banner" style="margin:14px 0">The verified official bank has only ${m.available} questions, so the official mock is shorter than the real exam.</div>` : ''}
  <div class="grid g2" style="margin:18px 0">
    ${card('RANDOM', 'Official-question mock', `Drawn from the 2006 paper and the 2023 sample test. ${m.size} questions, ${mins} min. Different each time.`, 'Official questions')}
    ${(D.exams || []).map(e => card(e.id, e.name, '60 new guide-based questions, fixed set, no overlap with the other exams. 90 min.', 'Full exam')).join('')}
  </div>
  <p class="muted small">Your wrong answers feed Weak spots. Weights: topic 4 is the heaviest (20–27%), then 5 (15–22%), 6 (13–20%), 3 (10–17%).</p>`;
  view.querySelectorAll('[data-exam]').forEach(b => b.onclick = () => { const s = App.load(); if (s.activeRun && !s.activeRun.submitted && !confirm('You have an unfinished session. Starting this exam will replace it. Continue?')) return;
    if (b.dataset.exam === 'RANDOM') return App.startRun('mock', m.ids, { limitMs: mins * 60e3 });
    const e = (D.exams || []).find(x => x.id === b.dataset.exam); App.startRun('mock', e.ids, { limitMs: 90 * 60e3, note: e.id }); });
};

/* ---------- Weak spots ---------- */
V.mistakes = function(view){
  const s = App.load(); const T = App.targetedQuestions(15); const rec = App.recommendTopics(); const w = App.weakness();
  const attempted = Object.keys(s.attempts).length;
  if (!attempted) { view.innerHTML = `<h1>Weak spots</h1><div class="card empty"><p>Nothing here yet. Answer some practice questions and your mistakes will show up here, with the topics to revisit.</p><a class="btn primary" href="#/practice">Start practising</a></div>`; return; }
  const cleared = D.questions.filter(q => { const a = s.attempts[q.id]; return a && a.wrong > 0 && a.streak >= 2; }).length;
  const drillIds = App.factsNearPages(T.pages, 1).map(f => f.id);
  const traps = Object.entries(w.traps).sort((a,b) => b[1]-a[1]).slice(0, 5);
  view.innerHTML = `<h1>Weak spots</h1><p class="lead">A mistake clears after you answer that question correctly twice in a row.</p>
  <div class="grid g3" style="margin:16px 0"><div class="card stat"><b>${T.mistakes.length}</b><span>open mistakes</span></div><div class="card stat"><b>${cleared}</b><span>mistakes cleared</span></div><div class="card stat"><b>${T.pages.length}</b><span>guide pages to revisit</span></div></div>
  ${T.mistakes.length ? `<div class="card"><h2>Fix them</h2><div class="row">
    <button class="btn primary" id="retry">Retry my ${T.mistakes.length} mistake${T.mistakes.length===1?'':'s'}</button>
    <button class="btn" id="targ" ${T.extra.length?'':'disabled'}>Targeted quiz (${T.extra.length} new questions)</button>
    <button class="btn" id="fdrill" ${drillIds.length?'':'disabled'}>Fact drill on those pages (${Math.min(drillIds.length,30)})</button></div>
    <p class="muted small" style="margin-top:10px">The targeted quiz picks other questions on the same guide pages, topics and trap types as your mistakes, favouring ones you have not seen. The fact drill uses the guide's own facts around those pages.${T.extra.length < 5 ? ' The question bank is limited, so only a few new questions match. To get more, copy your weak-spot summary below and ask Claude to write new guide-backed questions on those pages.' : ''}</p></div>` : `<div class="card"><b>No open mistakes.</b> <span class="muted">Keep practising or take a mock exam.</span></div>`}
  ${rec.length ? `<h2 style="margin-top:28px">Topics to go back over</h2><div class="grid g2">${rec.map(r => { const t = App.topic(r.id); const pg = T.pages.filter(p => p >= t.p0 && p <= t.p1).slice(0,6); return `<div class="card"><div class="topic-no">Topic ${t.id}</div><h3>${esc(t.title)}</h3><p class="muted small">${r.open} open mistake${r.open===1?'':'s'}${r.acc !== null ? ` · ${Math.round(r.acc*100)}% accurate over ${r.n} answers` : ''}</p>${pg.length ? `<div class="row small"><span class="muted">Re-read:</span>${pg.map(p => `<a class="cite" data-page="${p}" href="#">p.${esc(App.pageLabel(p))}</a>`).join(' ')}</div>` : ''}<div class="row" style="margin-top:10px"><a class="btn sm" href="#/learn/${t.id}/facts">Study facts</a><button class="btn sm primary" data-quiz="${t.id}">Quiz me</button></div></div>`; }).join('')}</div>` : ''}
  ${traps.length ? `<h2 style="margin-top:28px">Trap patterns you fall for</h2><div class="card">${traps.map(([k,n]) => `<div style="margin:10px 0"><b>${esc(k)}</b> ${App.chip(n + ' miss' + (n===1?'':'es'),'bad')}<div class="muted small">${esc(App.TRAPS[k] || '')}</div></div>`).join('')}</div>` : ''}
  ${T.mistakes.length ? `<h2 style="margin-top:28px">Your open mistakes</h2>${T.mistakes.map(q => { const a = s.attempts[q.id]; return `<details class="acc"><summary><span class="chip bad">✗ ${a.wrong}</span><span>${esc(q.stem.length > 120 ? q.stem.slice(0,120) + '…' : q.stem)}</span></summary><div class="in"><div class="row small">${App.chip(q.srcLabel)} ${q.topics.map(t => App.chip('Topic ' + t,'acc')).join(' ')}</div><p class="muted small">You chose ${a.lastChoice}. ${esc(q.opts[a.lastChoice] || '')}</p>${q.stmts ? `<ul class="stmts">${q.stmts.map(x => `<li><b>${esc(x.n)}</b><span>${esc(x.text)}</span></li>`).join('')}</ul>` : ''}${App.explainHTML(q, a.lastChoice)}</div></details>`; }).join('')}` : ''}
  <div class="card flat" style="margin-top:28px"><div class="row"><b>Need more questions on these weak spots?</b><span class="sp"></span><button class="btn sm" id="copyw">Copy weak-spot summary</button></div><p class="muted small" style="margin:6px 0 0">Paste it to Claude to have fresh questions written from exactly those guide pages. Check them against the guide before you rely on them.</p></div>`;
  const q$ = id => $(id);
  q$('#retry') && (q$('#retry').onclick = () => App.startRun('retry', App.shuffle(T.mistakes).map(q => q.id)));
  q$('#targ') && (q$('#targ').onclick = () => App.startRun('targeted', T.extra.map(q => q.id)));
  q$('#fdrill') && (q$('#fdrill').onclick = () => App.startCards(App.shuffle(drillIds).slice(0, 30)));
  view.querySelectorAll('[data-quiz]').forEach(b => b.onclick = () => App.startTopicQuiz(+b.dataset.quiz));
  q$('#copyw').onclick = () => { const txt = App.exportWeakSpots(); (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject()).then(() => App.toast('Copied'), () => { prompt('Copy this:', txt); }); };
};

/* ---------- Fact drill ---------- */
V.cards = function(view){
  if (App.cardRun && App.cardRun.i < App.cardRun.ids.length) return App.renderCards(view);
  const s = App.load(); const dueIds = App.dueCards(); const sel = new Set();
  const draw = () => {
    const base = App.cardFacts.filter(f => !sel.size || sel.has(f.topic));
    const kcAll = D.kc.filter(k => !sel.size || sel.has(k.topic));
    view.innerHTML = `<h1><em>Drill</em></h1><p class="lead">Short recall cards built from the guide's own facts. Numbers and words like “must”, “should” and “may” are blanked out, because those are what the exam tests. Cards you miss come back sooner.</p>
    <div class="card" style="margin-top:16px"><div class="field"><span class="lbl">Topics</span><div class="pills">${D.topics.map(t => `<button class="pill ${sel.has(t.id)?'on':''}" data-t="${t.id}">${t.id}. ${esc(t.short)}</button>`).join('')}</div></div>
    <div class="row"><button class="btn primary" id="n1">Numbers and rules (20)</button><button class="btn" id="n2">The guide's review questions (${kcAll.length})</button><button class="btn" id="n3">Unlearned facts (20)</button>${dueIds.length ? `<button class="btn" id="n4">Due today (${dueIds.length})</button>` : ''}</div></div>`;
    view.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const t = +b.dataset.t; sel.has(t) ? sel.delete(t) : sel.add(t); draw(); });
    $('#n1').onclick = () => App.startCards(App.shuffle(base.filter(f => App.cloze(f.f).n > 0)).slice(0, 20).map(f => f.id));
    $('#n2').onclick = () => App.startCards(App.shuffle(kcAll).map(k => 'KC:' + k.id));
    $('#n3').onclick = () => App.startCards(App.shuffle(base.filter(f => !s.learned[f.id])).slice(0, 20).map(f => f.id));
    $('#n4') && ($('#n4').onclick = () => App.startCards(dueIds));
  };
  draw();
};

/* ---------- Sources & trust ---------- */
V.sources = function(view){
  const qs = D.questions; const by = k => qs.filter(q => q.src === k);
  const cnt = (list, f) => list.filter(f).length;
  const unv = qs.filter(q => App.trust(q) === 'unverified' && q.src !== 'unofficial');
  const best = qs.filter(q => App.trust(q) === 'bestfit');
  const row = (l, k) => { const L = by(k); return `<tr><td>${l}</td><td>${L.length}</td><td>${cnt(L,q=>App.trust(q)==='verified')}</td><td>${cnt(L,q=>App.trust(q)==='bestfit')}</td><td>${cnt(L,q=>App.trust(q)==='unverified'||App.trust(q)==='unofficial')}</td></tr>`; };
  view.innerHTML = `<h1>Sources, <em>trust</em> and backup</h1><p class="lead">The tool is built to be accurate first. This page says exactly where everything comes from and how far to trust it.</p>
  <h2>What counts as truth</h2><div class="card"><ol style="margin:0;padding-left:1.2em"><li><b>The Study Guide v3.5</b> (HKSI, April 2026, effective for exams from 30 June 2026) is the single source of truth. All lessons and answer explanations cite its pages. Click any <span class="cite">p.x</span> link to see the original page.</li><li><b>Official HKSI questions</b> (the Oct 2023 sample test and the Dec 2006 past paper) are used as questions. Each one was re-checked against the current guide, because the law and the guide have changed. The publisher's answer key is shown, but the tool's answer is what the guide supports.</li><li><b>Unofficial material</b> from third-party prep sites is always labelled, never used in mock exams, and marked when the guide does not back it.</li></ol></div>
  <h2 style="margin-top:28px">Question bank</h2><div class="card scroll-x"><table class="tbl"><thead><tr><th>Source</th><th>Questions</th><th>Verified</th><th>Best-supported</th><th>Unverified</th></tr></thead><tbody>${row('Official sample test, Oct 2023','sample2023')}${row('New, written from the guide','generated')}${row('Past paper, Dec 2006','past2006')}${row('Unofficial banks','unofficial')}</tbody></table>
  <p class="small muted" style="margin-bottom:0"><b>Verified</b>: the guide supports the answer directly. <b>Best-supported</b>: the answer is the best option but part of the reasoning is inferred. <b>Unverified</b>: outdated or not covered by the guide, hidden by default.</p></div>
  ${unv.length ? `<h2 style="margin-top:28px">Official questions the guide cannot confirm (${unv.length})</h2>${unv.map(q => `<details class="acc"><summary>${App.chip(q.srcLabel)}<span>${esc(q.stem.length > 100 ? q.stem.slice(0,100) + '…' : q.stem)}</span></summary><div class="in"><p class="small">${App.inline(q.bottom || 'Not analysed.')}</p><div class="chip warn">Publisher's key: ${esc(q.key)}</div></div></details>`).join('')}` : ''}
  ${best.length ? `<details class="acc" style="margin-top:18px"><summary>${best.length} best-supported questions (answer reached partly by elimination)</summary><div class="in">${best.map(q => `<p class="small"><b>${esc(q.srcLabel.split(',')[0])} Q${q.n}</b> · ${App.inline((q.bottom || '').slice(0, 260))}${(q.bottom||'').length > 260 ? '…' : ''}</p>`).join('')}</div></details>` : ''}
  ${(D.unofficial||[]).some(u => u.guide_check === 'CONTRADICTED') ? `<h2 style="margin-top:28px">Unofficial claims the guide contradicts</h2><div class="card">${D.unofficial.filter(u => u.guide_check === 'CONTRADICTED').map(u => `<p class="small"><span class="chip bad">Contradicts guide</span> ${esc(u.claim)} <span class="muted">(${esc(u.source_name||'')})</span> ${(u.guide_pages||[]).slice(0,3).map(g => `<a class="cite" data-page="${g}" href="#">p.${esc(App.pageLabel(g))}</a>`).join(' ')}</p>`).join('')}</div>` : ''}
  <h2 style="margin-top:28px">Known quirks in the guide</h2><div class="card"><ul style="margin:0;padding-left:1.2em"><li>Regulated activity Types 11 and 12 are described as not yet fully in force.</li><li>A page refers to "Part XI" where discipline is under Part IX.</li><li>The futures and securities dealing definitions use "and" in one place and "or" in another.</li><li>Several of the guide's own review answers just point to a section.</li></ul></div>
  <h2 style="margin-top:28px">Your data</h2><div class="card"><p class="small muted">Your progress, results and mistakes are saved automatically in this browser and survive refreshing or closing the tab. They are lost only if you clear site data, use a private window, or change browser or device. Download a backup to keep a copy or move it.</p><div class="row"><button class="btn" id="exp">Export progress</button><label class="btn">Import progress<input id="imp" type="file" accept="application/json" hidden></label><button class="btn" id="rst" style="color:var(--bad)">Reset everything</button></div></div>
  <div class="card flat" style="margin-top:22px"><b class="small">Copyright.</b> <span class="muted small">The Study Guide and sample test are © Hong Kong Securities and Investment Institute. HKSI states its sample questions are not real exam questions and may be out of date. This tool is for personal study. Do not redistribute the materials.</span></div>`;
  $('#exp').onclick = App.exportProgress;
  $('#imp').onchange = e => { const f = e.target.files[0]; if (!f) return; f.text().then(t => { try { App.replaceState(JSON.parse(t)); App.toast('Progress imported'); App.route(); } catch(err) { App.toast('That file is not valid'); } }); };
  $('#rst').onclick = () => { if (confirm('Delete all your progress and mistakes on this device?')) { App.reset(); App.toast('Progress reset'); App.route(); } };
};
})();

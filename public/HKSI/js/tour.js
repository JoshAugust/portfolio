/* Guided tour: spotlights one part of the site at a time. Start it from the "Take the tour" button. */
(function(){
const App = window.App, $ = App.$;
const STEPS = [
  { title:'Welcome', text:'This tool teaches the HKSI Paper 1 guide fact by fact and tests you on it. Every fact and answer cites the exact page of the Study Guide. This tour takes about a minute.' },
  { sel:'#navlinks', title:'Your menu', text:'Everything is one click away from here. The coral number on Weak spots is how many questions you currently need to revisit.' },
  { hash:'#/learn', sel:'#navlinks a[href="#/learn"]', title:'Learn', text:'The nine guide topics, broken into short facts with a page link. Tick a fact when you know it. Facts and notes that come from unofficial sites carry a clear label.' },
  { hash:'#/figures', sel:'#fgcover', fallback:'#navlinks a[href="#/figures"]', title:'Key figures', text:'Every number worth knowing: thresholds, penalties, time limits and amounts. Use "Cover answers" to test yourself, then tick the ones you know.' },
  { hash:'#/practice', sel:'#navlinks a[href="#/practice"]', title:'Practice', text:'Questions from the 2006 paper, the official 2023 sample and new ones written from the guide. After each answer you see why it is right, why the others are wrong, and the page to read.' },
  { hash:'#/mock', sel:'#navlinks a[href="#/mock"]', title:'Mock exam', text:'60 questions, 90 minutes, weighted like the real paper, with a 70% pass mark. If you close the tab part-way it is saved and you can resume.' },
  { hash:'#/mistakes', sel:'#navlinks a[href="#/mistakes"]', title:'Weak spots', text:'Every question you get wrong is remembered here. The tool ranks the topics to revisit, builds a new quiz around your mistakes, and drills the related facts.' },
  { hash:'#/cards', sel:'#navlinks a[href="#/cards"]', title:'Fact drill', text:'Flashcards with the key numbers and terms blanked out. Cards you miss come back sooner, using spaced repetition.' },
  { hash:'#/history', sel:'#view h1', title:'Your results are kept', text:'Every finished quiz and mock exam is saved on this device, with a score history. Refreshing or closing the tab loses nothing. Clearing browser data, private windows or another device would, so download a backup from Sources now and then.' },
  { hash:'#/sources', sel:'#navlinks a[href="#/sources"]', title:'Sources and trust', text:'Shows where everything comes from and how far to trust it. Each question carries a label: verified in the guide, best-supported, or unofficial.' },
  { sel:'#themebtn', title:'Light or dark', text:'Switch the look any time. You can restart this tour from the "Take the tour" button.' }
];
let i = -1, els = null;
function visible(el){ return el && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'; }
function build(){
  const hole = document.createElement('div'); hole.className = 'tour-hole';
  const veil = document.createElement('div'); veil.className = 'tour-veil';
  const pop = document.createElement('div'); pop.className = 'tour-pop'; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-live', 'polite');
  document.body.append(veil, hole, pop); els = { hole, veil, pop };
  veil.onclick = e => e.stopPropagation();
}
function place(){
  if (!els) return; const st = STEPS[i]; const { hole, pop } = els;
  let t = st.sel && document.querySelector(st.sel); if (!visible(t) && st.fallback) t = document.querySelector(st.fallback); if (!visible(t)) t = null;
  const vw = innerWidth, vh = innerHeight;
  els.veil.style.background = '';
  if (t) {
    t.scrollIntoView({ block:'nearest', inline:'nearest' });
    const r = t.getBoundingClientRect(), pad = 8;
    Object.assign(hole.style, { left:(r.left - pad) + 'px', top:(r.top - pad) + 'px', width:(r.width + pad * 2) + 'px', height:(r.height + pad * 2) + 'px', opacity:1 });
    const pw = Math.min(360, vw - 24), ph = pop.offsetHeight || 220;
    let left, top;
    if (r.right + 20 + pw < vw) { left = r.right + 20; top = r.top; }
    else if (r.left - 20 - pw > 0) { left = r.left - 20 - pw; top = r.top; }
    else { left = r.left; top = r.bottom + 16; if (top + ph > vh - 12) top = r.top - ph - 16; }
    left = Math.max(12, Math.min(left, vw - pw - 12)); top = Math.max(12, Math.min(top, vh - ph - 12));
    pop.style.left = left + 'px'; pop.style.top = top + 'px';
  } else {
    els.veil.style.background = 'rgba(3,8,28,.74)';
    Object.assign(hole.style, { left:(vw / 2) + 'px', top:(vh / 2) + 'px', width:'0px', height:'0px', opacity:0 });
    const pw = Math.min(360, vw - 24), ph = pop.offsetHeight || 220;
    pop.style.left = ((vw - pw) / 2) + 'px'; pop.style.top = Math.max(12, (vh - ph) / 2) + 'px';
  }
}
function show(n){
  i = n; const st = STEPS[i];
  const go = () => {
    els.pop.innerHTML = `<div class="step">Step ${i + 1} of ${STEPS.length}</div><h3>${App.esc(st.title)}</h3><p>${App.esc(st.text)}</p>
      <div class="foot"><div class="tour-dots">${STEPS.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <button class="btn sm ghost" data-t="end">${i === STEPS.length - 1 ? '' : 'Skip'}</button>${i ? '<button class="btn sm" data-t="back">Back</button>' : ''}<button class="btn sm primary" data-t="next">${i === STEPS.length - 1 ? 'Finish' : 'Next'}</button></div>`;
    els.pop.querySelectorAll('[data-t]').forEach(b => b.onclick = () => { const a = b.dataset.t; if (a === 'next') (i === STEPS.length - 1 ? end() : show(i + 1)); else if (a === 'back') show(i - 1); else end(); });
    place(); setTimeout(place, 120); els.pop.querySelector('[data-t="next"]').focus({ preventScroll:true });
  };
  if (st.hash && location.hash !== st.hash) { location.hash = st.hash; setTimeout(go, 160); } else go();
}
function end(){
  if (!els) return; els.hole.remove(); els.veil.remove(); els.pop.remove(); els = null; i = -1;
  document.removeEventListener('keydown', keys); removeEventListener('resize', place);
  const s = App.load(); s.settings.tourSeen = true; App.save(); location.hash = '#/'; App.route();
}
function keys(e){
  if (!els) return;
  if (e.key === 'Escape') end(); else if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); i === STEPS.length - 1 ? end() : show(i + 1); }
  else if (e.key === 'ArrowLeft' && i > 0) show(i - 1);
}
App.startTour = function(){
  if (els) return; App.closeModal && App.closeModal(); build(); document.addEventListener('keydown', keys); addEventListener('resize', place); show(0);
};
})();

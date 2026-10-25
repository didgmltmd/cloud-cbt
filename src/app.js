/* AWS 클라우드 CBT — 홈 · 개념 정리 · 연습 · 실전 모의고사 · 오답노트 */
(function () {
  'use strict';
  const Q = window.CLOUD_QS || [];
  const C = window.CLOUD_CONCEPTS || [];
  const DG = window.CLOUD_DIAGRAMS || {};
  const MI = window.CLOUD_MODICON || {};
  const MODS = [2, 3, 4, 5, 6, 7];
  const MT = { 2: '아키텍팅 소개 · 글로벌 인프라', 3: '액세스 보안 (IAM)', 4: '스토리지 계층 (S3)', 5: '컴퓨팅 계층 (EC2)', 6: '데이터베이스 계층', 7: '네트워킹 (VPC)' };
  const MOD = Object.fromEntries(MODS.map(m => [m, `모듈 ${m} · ${MT[m]}`]));
  const LT = 'ABCDEFG';
  const app = document.getElementById('app'), topr = document.getElementById('topr'), tabs = document.getElementById('tabs');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const st = {
    get(k, d) { try { const v = localStorage.getItem('cloudcbt.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('cloudcbt.' + k, JSON.stringify(v)); } catch (e) { } },
  };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const same = (a, b) => a.length === b.length && a.slice().sort().join() === b.slice().sort().join();
  const META_TAGS = new Set(['지식확인', '샘플문항', '교재샘플', '랩원리', '랩 원리']);
  let S = null, clockT = null, view = 'home', backTo = null;

  /* ---------- 개념 ↔ 문제 연결 ---------- */
  const SECS = []; C.forEach(m => (m.sections || []).forEach(s => SECS.push(Object.assign({ module: m.module }, s))));
  const qOfSec = s => { const tg = new Set(s.tags || []); return Q.filter(q => q.module === s.module && (q.tags || []).some(t => tg.has(t))); };
  function secsOfQ(q) {
    const tg = (q.tags || []).filter(t => !META_TAGS.has(t));
    return SECS.map(s => ({ s, n: (s.tags || []).filter(t => tg.includes(t)).length + (s.module === q.module ? 0.5 : 0) })).filter(x => x.n >= 1.5).sort((a, b) => b.n - a.n).slice(0, 2).map(x => x.s);
  }

  /* ---------- 간단 마크다운 ---------- */
  function inl(s) { return esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>'); }
  function md(src) {
    const ls = String(src || '').replace(/\r/g, '').split('\n'); const out = []; let i = 0;
    while (i < ls.length) {
      const l = ls[i];
      if (/^```/.test(l)) { const b = []; i++; while (i < ls.length && !/^```/.test(ls[i])) b.push(ls[i++]); i++; out.push(`<pre><code>${esc(b.join('\n'))}</code></pre>`); continue; }
      if (/^\s*\|/.test(l)) { const rows = []; while (i < ls.length && /^\s*\|/.test(ls[i])) rows.push(ls[i++]); const cells = r => r.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim()); const body = rows.filter(r => !/^\s*\|[\s:|-]+\|\s*$/.test(r)); out.push('<div class="tbl"><table>' + body.map((r, k) => '<tr>' + cells(r).map(c => k === 0 ? `<th>${inl(c)}</th>` : `<td>${inl(c)}</td>`).join('') + '</tr>').join('') + '</table></div>'); continue; }
      if (/^\s*([-*]|\d+\.)\s+/.test(l)) { const ord = /^\s*\d+\./.test(l); const it = []; while (i < ls.length && /^\s*([-*]|\d+\.)\s+/.test(ls[i])) it.push(ls[i++].replace(/^\s*([-*]|\d+\.)\s+/, '')); out.push(`<${ord ? 'ol' : 'ul'}>${it.map(x => `<li>${inl(x)}</li>`).join('')}</${ord ? 'ol' : 'ul'}>`); continue; }
      const h = /^#{2,4}\s+(.*)$/.exec(l); if (h) { out.push(`<h4>${inl(h[1])}</h4>`); i++; continue; }
      if (!l.trim()) { i++; continue; }
      const b = []; while (i < ls.length && ls[i].trim() && !/^(```|\s*\||\s*([-*]|\d+\.)\s|#{2,4}\s)/.test(ls[i])) b.push(ls[i++]);
      out.push(`<p>${b.map(inl).join('<br>')}</p>`);
    }
    return out.join('');
  }

  /* ---------- 대화상자 ---------- */
  function ask(title, msg, ok, noCancel) {
    return new Promise(res => {
      const w = document.createElement('div'); w.className = 'dlg-back';
      w.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="dlg-t"><div class="dlg-t" id="dlg-t">${esc(title)}</div>${msg ? `<div class="dlg-m">${esc(msg).replace(/\n/g, '<br>')}</div>` : ''}<div class="dlg-b">${noCancel ? '' : '<button class="btn" data-k="no">취소</button>'}<button class="btn pri" data-k="ok">${esc(ok || '확인')}</button></div></div>`;
      document.body.appendChild(w); setTimeout(() => w.querySelector('.pri').focus(), 0);
      const done = v => { w.remove(); res(v); };
      w.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) done(b.dataset.k === 'ok'); else if (e.target === w) done(false); });
      w.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); done(false); } }, true);
    });
  }

  /* ---------- 상단 탭 ---------- */
  function setTabs(v) {
    view = v; tabs.hidden = false; topr.innerHTML = '';
    tabs.querySelectorAll('[data-tab]').forEach(b => { const on = b.dataset.tab === v; b.classList.toggle('on', on); b.setAttribute('aria-current', on ? 'page' : 'false'); });
    const w = st.get('res', {}), f = st.get('flag', {}); const n = Object.values(w).filter(x => x === false).length + Object.keys(f).filter(id => w[id] !== false).length;
    const badge = tabs.querySelector('.bdg'); badge.textContent = n; badge.hidden = !n;
  }
  function examMode(on) { tabs.hidden = on; }
  function stats() {
    const res = st.get('res', {});
    const by = m => { const qs = Q.filter(q => !m || q.module === m); const d = qs.filter(q => q.id in res); return { n: qs.length, d: d.length, ok: d.filter(q => res[q.id]).length }; };
    return { res, by };
  }
  const pctTxt = x => x.d ? Math.round(x.ok / x.d * 100) + '%' : '–';

  /* ---------- 홈 ---------- */
  function home() {
    S = null; clearInterval(clockT); backTo = null; setTabs('home'); document.title = 'AWS 클라우드 CBT';
    const { by } = stats(); const all = by(0); const hist = st.get('hist', []); const last = hist[hist.length - 1];
    const res = st.get('res', {}), flags = st.get('flag', {});
    const wrong = Object.values(res).filter(v => v === false).length;
    const ring = all.n ? Math.round(all.d / all.n * 100) : 0;
    app.innerHTML = `<div class="wrap">
      <section class="hero">
        <div class="hero-t">
          <p class="eyebrow">AWS Academy Cloud Architecting · 모듈 2~7</p>
          <h1>클라우드 컴퓨팅 중간고사</h1>
          <p class="sub">개념 정리로 읽고, 모듈별로 풀고, 실전처럼 25문항 모의고사로 마무리해요.</p>
          <ul class="facts"><li><b>약 25문항</b> 선다형만</li><li><b>N개 고르시오</b> 복수 선택 많음</li><li><b>반반</b> 지식 확인 · SAA 수준</li><li><b>시간 제한 없음</b> 보통 1시간</li></ul>
        </div>
        <div class="hero-c">
          <div class="ring" style="--p:${ring}"><div><b>${ring}%</b><span>진도</span></div></div>
          <dl class="kv"><div><dt>푼 문제</dt><dd>${all.d} / ${all.n}</dd></div><div><dt>정답률</dt><dd>${pctTxt(all)}</dd></div><div><dt>최근 모의고사</dt><dd>${last ? last.ok + ' / ' + last.n : '–'}</dd></div></dl>
          <div class="hero-a"><button class="btn pri" data-go="mock">실전 모의고사 시작</button><button class="btn" data-go="wrong"${wrong + Object.keys(flags).length ? '' : ' disabled'}>오답노트 ${wrong + Object.keys(flags).filter(id => res[id] !== false).length}</button></div>
        </div>
      </section>
      <div class="sec-h"><h2>모듈별 학습</h2><span>개념을 읽고 바로 그 모듈 문제를 풀어 보세요</span></div>
      <div class="mgrid">${MODS.map(m => {
        const x = by(m); const cm = C.find(c => c.module === m); const p = x.n ? x.d / x.n * 100 : 0;
        return `<article class="mcard">
          <div class="mtop">${MI[m] ? `<svg class="micon" viewBox="0 0 64 64" aria-hidden="true"><use href="#${MI[m]}"/></svg>` : `<span class="mno">${m}</span>`}<div><div class="mlbl">모듈 ${m}</div><h3>${esc(MT[m])}</h3></div></div>
          ${cm ? `<p class="msum">${esc(cm.summary || '')}</p><div class="topics">${(cm.sections || []).slice(0, 4).map(s => `<button class="tpc" data-sec="${esc(s.id)}">${esc(s.title)}</button>`).join('')}${(cm.sections || []).length > 4 ? `<span class="more">+${cm.sections.length - 4}</span>` : ''}</div>` : ''}
          <div class="mprog"><div class="bar" role="img" aria-label="진도 ${Math.round(p)}%"><i style="width:${p}%"></i></div><span>${x.d}/${x.n}문항 · 정답률 ${pctTxt(x)}</span></div>
          <div class="macts">${cm ? `<button class="btn" data-go="concept" data-m="${m}">개념 정리</button>` : ''}<button class="btn pri" data-go="pm" data-m="${m}">문제 풀기</button></div>
        </article>`; }).join('')}</div>
      <details class="howto"><summary>시험 요령 · 단축키</summary>
        <ul><li><b>복수 선택</b>: ① 고를 개수부터 확인 ② 조건 키워드에 밑줄(최저 비용 · 고가용성 · 최소 운영 부담 · 가장 안전) ③ 보기마다 O/X — 틀린 단어가 하나만 있어도 X.</li>
        <li><b>랩 원리</b>: 랩 절차는 안 나오지만 원리는 보기로 나와요. 예) 인터넷 연결 = IGW 생성 → VPC에 연결 → 라우팅 테이블에 0.0.0.0/0 경로.</li>
        <li><b>단축키</b>: 숫자 1~6 보기 선택 · Enter 정답 확인/다음 · ← → 이전/다음 문제</li></ul></details>
      <p class="foot">문제와 개념 정리는 수업 PDF(모듈 2~7)와 학습 노트를 바탕으로 새로 쓴 연습 자료예요. 실제 지식 확인 문항이나 유출된 덤프 문제를 옮긴 게 아니에요. 기록은 이 브라우저에만 저장돼요. <button class="lnk" data-go="reset">기록 지우기</button></p>
    </div>`;
    window.scrollTo(0, 0);
  }

  /* ---------- 개념 정리 ---------- */
  function concepts(m, secId) {
    window.LMTrack && window.LMTrack.event('concept'); 
    S = null; clearInterval(clockT); setTabs('concept'); document.title = '개념 정리 · AWS 클라우드 CBT';
    if (!C.length) { app.innerHTML = '<div class="wrap"><p class="sub">개념 정리를 준비하고 있어요.</p></div>'; return; }
    if (secId) { const s = SECS.find(x => x.id === secId); if (s) m = s.module; }
    m = m || st.get('cmod', C[0].module); st.set('cmod', m); curMod = +m;
    const cm = C.find(c => c.module === +m) || C[0];
    const { by } = stats(); const x = by(cm.module);
    app.innerHTML = `<div class="cwrap">
      ${backTo ? `<div class="backbar"><button class="btn" data-a="backq">← 풀던 문제로 돌아가기</button><span>문제 ${backTo.i + 1} / ${backTo.list.length}</span></div>` : ''}
      <nav class="mchips" aria-label="모듈">${C.map(c => `<button class="mchip${c.module === cm.module ? ' on' : ''}" data-go="concept" data-m="${c.module}"><b>${c.module}</b> ${esc(MT[c.module] || c.title)}</button>`).join('')}</nav>
      <div class="cgrid">
        <aside class="ctoc"><div class="ctoc-h">모듈 ${cm.module} 목차</div>${cm.sections.map((s, i) => `<a href="#" data-sec="${esc(s.id)}"><span class="n">${i + 1}</span><span>${esc(s.title)}</span></a>`).join('')}<div class="prog" id="cprog"></div></aside>
        <div class="cmain">
          <header class="chead"><div class="chead-t">${MI[cm.module] ? `<svg class="micon" viewBox="0 0 64 64" aria-hidden="true"><use href="#${MI[cm.module]}"/></svg>` : ''}<div><p class="eyebrow">모듈 ${cm.module}</p><h1>${esc(cm.title || MT[cm.module])}</h1></div></div><p class="sub">${esc(cm.summary || '')}</p>
            <div class="hero-a"><button class="btn pri" data-go="pm" data-m="${cm.module}">모듈 ${cm.module} 문제 풀기 (${x.n})</button><span class="muted">푼 문제 ${x.d} · 정답률 ${pctTxt(x)}</span></div></header>
          ${cm.sections.map(s => { const n = qOfSec(Object.assign({ module: cm.module }, s)).length; return `<article class="ccard" id="sec-${esc(s.id)}">
            <h2>${esc(s.title)}</h2>${(DG[s.id] || []).map(f => `<figure class="dg">${f.svg}${f.caption ? `<figcaption>${esc(f.caption)}</figcaption>` : ''}</figure>`).join('')}<div class="md">${md(s.body)}</div>
            ${s.tip ? `<div class="ctip"><b>시험 포인트</b><div>${inl(s.tip)}</div></div>` : ''}
            <div class="cfoot"><div class="tags">${(s.tags || []).slice(0, 6).map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div>${n ? `<button class="btn" data-go="ps" data-sec="${esc(s.id)}">이 주제 문제 풀기 (${n})</button>` : ''}</div>
          </article>`; }).join('')}
          <div class="cnext">${(() => { const i = C.indexOf(cm); return `${i > 0 ? `<button class="btn" data-go="concept" data-m="${C[i - 1].module}">← 모듈 ${C[i - 1].module}</button>` : '<span></span>'}${i < C.length - 1 ? `<button class="btn" data-go="concept" data-m="${C[i + 1].module}">모듈 ${C[i + 1].module} →</button>` : ''}`; })()}</div>
        </div>
      </div></div>`;
    if (secId) { const el = document.getElementById('sec-' + secId); if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); } } else window.scrollTo(0, 0);
    spy();
    layoutIcons(app); if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (view === 'concept') layoutIcons(app); });
  }
  /* 그림 속 서비스 칩: 실제 글자 폭을 재서 아이콘+글자를 칩 가운데에 */
  function layoutIcons(rootEl) {
    rootEl.querySelectorAll('g.ico').forEach(g => {
      const t = g.nextElementSibling; if (!t || t.tagName.toLowerCase() !== 'text' || !t.getComputedTextLength) return;
      const len = t.getComputedTextLength(); if (!len) return;
      const cx = +g.dataset.x, cw = +g.dataset.w, s = +g.dataset.s, gap = 6;
      const gw = s + gap + len;
      if (gw > cw - 10) { g.style.display = 'none'; t.setAttribute('x', cx + cw / 2); return; }
      g.style.display = '';
      const start = cx + (cw - gw) / 2; const [r, u] = g.children;
      r.setAttribute('x', start); u.setAttribute('x', start + 1.5);
      t.setAttribute('x', start + s + gap + len / 2);
    });
  }
  /* 목차: 지금 보고 있는 섹션 표시 */
  let spyT = 0;
  function spy() {
    const cards = [...app.querySelectorAll('.ccard')]; if (!cards.length) return;
    const line = 140 + (document.querySelector('.backbar') ? 50 : 0);
    let cur = cards[0];
    for (const c of cards) { if (c.getBoundingClientRect().top - line <= 0) cur = c; }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) cur = cards[cards.length - 1];
    const id = cur.id.replace(/^sec-/, ''); const idx = cards.indexOf(cur);
    cards.forEach(c => c.classList.toggle('cur', c === cur));
    app.querySelectorAll('.ctoc a[data-sec]').forEach((a, i) => { a.classList.toggle('on', a.dataset.sec === id); a.classList.toggle('seen', i < idx); if (a.dataset.sec === id) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
    const on = app.querySelector('.ctoc a.on'); const toc = app.querySelector('.ctoc');
    if (on && toc && toc.scrollHeight > toc.clientHeight) { const r = on.getBoundingClientRect(), tr = toc.getBoundingClientRect(); if (r.top < tr.top + 30 || r.bottom > tr.bottom - 30) toc.scrollTop += r.top - tr.top - tr.height / 2; }
    const pg = document.getElementById('cprog'); if (pg) pg.innerHTML = `${idx + 1} / ${cards.length} 섹션<div class="bar"><i style="width:${(idx + 1) / cards.length * 100}%"></i></div>`;
  }
  window.addEventListener('scroll', () => { if (view !== 'concept' || spyT) return; spyT = setTimeout(() => { spyT = 0; spy(); }, 50); }, { passive: true });
  window.addEventListener('resize', () => { if (view === 'concept') spy(); });

  /* ---------- 연습 설정 ---------- */
  let PF = st.get('pf', { mods: [], lv: '', only: '' });
  function practiceSetup() {
    S = null; clearInterval(clockT); backTo = null; setTabs('practice'); document.title = '연습 · AWS 클라우드 CBT';
    const res = st.get('res', {});
    const list = practiceList();
    const seg = (key, opts) => `<div class="seg" role="radiogroup">${opts.map(([v, l]) => `<button role="radio" aria-checked="${PF[key] === v}" class="${PF[key] === v ? 'on' : ''}" data-pf="${key}" data-v="${v}">${l}</button>`).join('')}</div>`;
    app.innerHTML = `<div class="wrap narrow">
      <p class="eyebrow">연습 모드</p><h1>골라서 풀기</h1><p class="sub">한 문제씩 풀고 바로 정답과 보기마다 왜 맞고 틀린지 해설을 봐요.</p>
      <div class="panel">
        <div class="frow"><div class="flbl">모듈</div><div class="mpick">${MODS.map(m => `<button class="${PF.mods.includes(m) ? 'on' : ''}" data-pm="${m}" aria-pressed="${PF.mods.includes(m)}"><b>${m}</b> ${esc(MT[m])}</button>`).join('')}</div><div class="fhint">아무것도 고르지 않으면 전체 모듈이에요.</div></div>
        <div class="frow"><div class="flbl">난이도</div>${seg('lv', [['', '전체'], ['basic', '지식 확인 수준'], ['saa', '자격증(SAA) 수준']])}</div>
        <div class="frow"><div class="flbl">범위</div>${seg('only', [['', '모든 문제'], ['new', '안 푼 문제'], ['multi', '복수 선택만']])}</div>
        <div class="fgo"><span><b>${list.length}</b>문항이 골라졌어요 · 순서는 섞여요</span><button class="btn pri" data-go="practice"${list.length ? '' : ' disabled'}>연습 시작</button></div>
      </div></div>`;
    window.scrollTo(0, 0);
  }
  function practiceList() { const res = st.get('res', {}); return Q.filter(q => (!PF.mods.length || PF.mods.includes(q.module)) && (!PF.lv || q.level === PF.lv) && (PF.only !== 'new' || !(q.id in res)) && (PF.only !== 'multi' || q.pick > 1)); }

  /* ---------- 문제 세트 ---------- */
  function mockSet() {
    const per = { 2: 4, 3: 4, 4: 4, 5: 5, 6: 4, 7: 4 }; let out = [];
    Object.keys(per).forEach(m => { const qs = Q.filter(q => q.module === +m); const b = shuffle(qs.filter(q => q.level === 'basic')), s = shuffle(qs.filter(q => q.level === 'saa')); const n = per[m], nb = Math.ceil(n / 2); out = out.concat(b.slice(0, nb), s.slice(0, n - nb)); });
    return shuffle(out);
  }
  // 문제를 어디서 시작했는지 기억 → 나가기/끝내기/뒤로 가기 때 그 자리로
  let origin = null, curMod = null;
  const ORIGIN_LABEL = { concept: '개념 정리로', home: '홈으로', practice: '연습 설정으로', mock: '모의고사 안내로', wrong: '홈으로' };
  function startExam(mode, list, label, sec) {
    if (!list.length) { ask('조건에 맞는 문제가 없어요', '다른 조건을 골라 보세요.', '확인', true); return; }
    backTo = null;
    origin = { view, m: curMod, sec: sec || null, y: window.scrollY };
    try { history.pushState({ cbt: 'exam' }, ''); } catch (e) { }
    S = { mode, list, i: 0, ans: {}, flag: {}, checked: {}, t0: Date.now(), review: false, label: label || '' };
    if (mode === 'mock') { clearInterval(clockT); clockT = setInterval(drawClock, 1000); }
    render();
  }
  function drawClock() { const c = document.getElementById('clk'); if (!c || !S) return; const s = Math.floor((Date.now() - S.t0) / 1000); c.textContent = `경과 ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }

  /* ---------- 문제 화면 ---------- */
  function render() {
    if (S.review) return renderReview();
    examMode(true);
    const q = S.list[S.i]; const a = S.ans[q.id] || []; const mock = S.mode === 'mock'; const done = !mock && S.checked[q.id];
    const right = done && same(a, q.answer);
    document.title = `${S.i + 1}/${S.list.length} · AWS 클라우드 CBT`;
    topr.innerHTML = (mock ? '<span class="clock" id="clk"></span>' : `<span class="mode-l">${esc(S.label || (S.mode === 'wrong' ? '오답노트' : '연습'))}</span>`) + (mock ? '<button class="btn dark" data-a="quit">그만두기</button>' : `<button class="btn dark" data-a="exit">← ${esc(ORIGIN_LABEL[(origin || {}).view] || '나가기')}</button>`);
    const flagged = mock ? S.flag[q.id] : !!st.get('flag', {})[q.id];
    const opts = q.options.map((o, k) => {
      let c = a.includes(k) ? ' on' : '';
      if (done) { if (q.answer.includes(k)) c = ' right'; else if (a.includes(k)) c = ' wrong'; else c = ''; }
      const why = done && q.why ? `<span class="why">${esc(q.why[k])}</span>` : '';
      return `<button class="opt${c}" data-opt="${k}" role="${q.pick > 1 ? 'checkbox' : 'radio'}" aria-checked="${a.includes(k)}"><span class="mk"></span><span class="lt">${LT[k]}.</span><span>${esc(o)}${why}</span></button>`;
    }).join('');
    let res = '';
    if (done) {
      const rel = secsOfQ(q);
      res = `<div class="res ${right ? 'ok' : 'no'}"><b class="${right ? 'r' : 'w'}">${right ? '정답이에요!' : '틀렸어요.'}</b> 정답: ${q.answer.map(k => LT[k]).join(', ')}<div style="margin-top:6px">${esc(q.explain)}</div>
        ${rel.length ? `<div class="rel"><span>관련 개념</span>${rel.map(s => `<button class="tpc" data-rel="${esc(s.id)}">${esc(s.title)} →</button>`).join('')}</div>` : ''}</div>`;
    }
    const answeredN = S.list.filter(x => (S.ans[x.id] || []).length).length;
    const okN = S.list.filter(x => S.checked[x.id] && same(S.ans[x.id] || [], x.answer)).length, chN = S.list.filter(x => S.checked[x.id]).length;
    app.innerHTML = `<div class="exam">
      <div class="pbar" aria-hidden="true"><i style="width:${(S.i + 1) / S.list.length * 100}%"></i></div>
      <div class="qbar"><span class="qmeta"><span class="qn">문제 ${S.i + 1} / ${S.list.length}</span><span class="chip">모듈 ${q.module}</span>${mock ? '' : `<span class="chip ${q.level === 'saa' ? 'saa' : 'kc'}">${q.level === 'saa' ? '자격증 수준' : '지식 확인 수준'}</span>`}</span>
        <label class="flagbox"><input type="checkbox" data-a="flag"${flagged ? ' checked' : ''}> 검토 표시</label></div>
      <div class="qcard"><p class="qt">${esc(q.q)}</p><p class="pick">${q.pick > 1 ? `${q.pick}개를 고르시오.` : '1개를 고르시오.'}${q.pick > 1 ? ` <span class="muted">(${a.length}/${q.pick} 선택)</span>` : ''}</p>
        <div class="opts${q.pick > 1 ? ' multi' : ''}" role="${q.pick > 1 ? 'group' : 'radiogroup'}">${opts}</div>${res}</div>
    </div>
    <nav class="nav"><div class="in"><div class="g"><button class="btn" data-a="prev"${S.i === 0 ? ' disabled' : ''}>← 이전</button>${mock ? '<button class="btn" data-a="review">전체 검토</button>' : ''}</div>
      <span class="prog">${mock ? `답한 문제 ${answeredN} / ${S.list.length}` : `맞힘 ${okN} / 확인 ${chN}`}</span>
      <div class="g">${!mock && !done ? `<button class="btn pri" data-a="check"${a.length === q.pick ? '' : ' disabled'}>정답 확인</button>` : ''}${S.i < S.list.length - 1 ? `<button class="btn${mock || done ? ' pri' : ''}" data-a="next">다음 →</button>` : mock ? '<button class="btn pri" data-a="review">검토 후 제출</button>' : '<button class="btn pri" data-a="finish">끝내기</button>'}</div></div></nav>`;
    if (mock) drawClock();
    window.scrollTo(0, 0);
  }
  function renderReview() {
    examMode(true);
    const qs = S.list; const un = qs.filter(q => !(S.ans[q.id] || []).length).length; const fl = qs.filter(q => S.flag[q.id]).length;
    topr.innerHTML = '<span class="clock" id="clk"></span><button class="btn dark" data-a="quit">그만두기</button>';
    app.innerHTML = `<div class="exam review"><h2>전체 검토</h2><p class="sub">문제를 눌러 돌아가 고칠 수 있어요. 끝났으면 <b>시험 제출</b>을 누르세요.</p>
      <div class="legend"><span>안 푼 문제 <b style="color:var(--bad)">${un}</b></span><span>검토 표시 <b style="color:var(--flag)">${fl}</b></span><span>답한 문제 <b style="color:var(--ok)">${qs.length - un}</b></span></div>
      <div class="rgrid">${qs.map((q, k) => { const an = (S.ans[q.id] || []).length; const c = (an ? 'an' : 'un') + (S.flag[q.id] ? ' fl' : ''); return `<button class="${c}" data-go="${k}"><span>문제 ${k + 1}</span><span class="st">${S.flag[q.id] ? '검토' : an ? '답함' : '안 푼'}</span></button>`; }).join('')}</div></div>
      <nav class="nav"><div class="in"><div class="g"><button class="btn" data-a="back">← 문제로 돌아가기</button></div><div class="g"><button class="btn pri" data-a="submit">시험 제출</button></div></div></nav>`;
    drawClock(); window.scrollTo(0, 0);
  }
  function submit() {
    window.LMTrack && window.LMTrack.event('mock'); 
    clearInterval(clockT); examMode(false); setTabs('mock');
    const qs = S.list; const res = st.get('res', {});
    qs.forEach(q => { res[q.id] = same(S.ans[q.id] || [], q.answer); }); st.set('res', res);
    const flags = st.get('flag', {}); qs.forEach(q => { if (S.flag[q.id]) flags[q.id] = 1; }); st.set('flag', flags);
    const ok = qs.filter(q => res[q.id]).length; const pct = Math.round(ok / qs.length * 100); const scaled = Math.round(100 + ok / qs.length * 900);
    const mins = Math.round((Date.now() - S.t0) / 60000);
    const hist = st.get('hist', []); hist.push({ at: Date.now(), pct, ok, n: qs.length }); st.set('hist', hist.slice(-30));
    const R = S;
    const mods = MODS.map(m => { const x = qs.filter(q => q.module === m); const o = x.filter(q => res[q.id]).length; return x.length ? `<div class="mrow"><span>${MOD[m]}</span><div class="bar"><i style="width:${o / x.length * 100}%"></i></div><span class="n">${o} / ${x.length}</span>${o < x.length && C.find(c => c.module === m) ? `<button class="lnk" data-go="concept" data-m="${m}">개념 복습</button>` : '<span></span>'}</div>` : ''; }).join('');
    const lv = l => { const x = qs.filter(q => q.level === l); const o = x.filter(q => res[q.id]).length; return `${o} / ${x.length}`; };
    app.innerHTML = `<div class="wrap"><p class="eyebrow">실전 모의고사 결과</p>
      <div class="score"><b>${ok} / ${qs.length}</b><span class="pass ${scaled >= 720 ? 'y' : 'n'}">${pct}% · AWS 환산 ${scaled}점 ${scaled >= 720 ? '합격선 이상' : '합격선(720) 미만'}</span></div>
      <p class="sub">걸린 시간 약 ${mins}분 · 지식 확인 수준 ${lv('basic')} · 자격증 수준 ${lv('saa')}</p>
      <div class="panel"><h3>모듈별 점수</h3>${mods}</div>
      <h3 style="margin:26px 0 0">문제별 결과 — 눌러서 해설 보기</h3>
      <div class="qlist">${qs.map((q, k) => `<button class="qitem" data-rv="${k}"><span class="k">${k + 1}</span><span class="t">${esc(q.q.split('\n')[0])}</span><span class="s ${res[q.id] ? 'o' : 'x'}">${res[q.id] ? '정답' : '오답'}</span></button>`).join('')}</div>
      <p style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" data-go="mock">새 모의고사</button><button class="btn" data-a="home">홈</button></p></div>`;
    S = { mode: 'result', list: qs, ans: R.ans, checked: Object.fromEntries(qs.map(q => [q.id, true])), i: 0, flag: {} };
    lastResult = null;
    window.scrollTo(0, 0);
  }
  function mockIntro() {
    S = null; clearInterval(clockT); backTo = null; setTabs('mock'); document.title = '실전 모의고사 · AWS 클라우드 CBT';
    const hist = st.get('hist', []);
    app.innerHTML = `<div class="wrap narrow"><p class="eyebrow">실전 모의고사</p><h1>25문항 · 시험처럼</h1>
      <div class="panel"><ul class="ilist"><li>모듈 2~7에서 고르게 25문항 (지식 확인 수준 · 자격증 수준 반반)</li><li>시간 제한 없음 — 경과 시간만 보여 줘요</li><li>제출할 때까지 정답을 보여 주지 않아요. <b>검토 표시</b>와 <b>전체 검토</b> 화면으로 다시 확인할 수 있어요</li><li>제출하면 모듈별 점수와 AWS 기준 환산 점수(합격선 720)가 나와요</li></ul>
      <div class="fgo"><span>지금까지 ${hist.length}회 응시${hist.length ? ` · 최근 ${hist[hist.length - 1].ok}/${hist[hist.length - 1].n}` : ''}</span><button class="btn pri" data-go="mockstart">시작</button></div></div>
      ${hist.length ? `<div class="panel"><h3>응시 기록</h3><div class="hist">${hist.slice(-10).map(h => `<div title="${new Date(h.at).toLocaleString('ko-KR')}"><i style="height:${Math.max(4, h.pct)}%"></i><span>${h.pct}%</span></div>`).join('')}</div></div>` : ''}</div>`;
    window.scrollTo(0, 0);
  }

  /* ---------- 입력 ---------- */
  function choose(k) {
    const q = S.list[S.i]; if (S.mode !== 'mock' && S.checked[q.id]) return; if (k >= q.options.length) return;
    let a = (S.ans[q.id] || []).slice();
    if (q.pick > 1) { if (a.includes(k)) a = a.filter(x => x !== k); else { a.push(k); if (a.length > q.pick) a.shift(); } } else a = [k];
    S.ans[q.id] = a; render();
  }
  function check() {
    window.LMTrack && window.LMTrack.event('check'); 
    const q = S.list[S.i]; const a = S.ans[q.id] || []; if (a.length !== q.pick) return;
    S.checked[q.id] = true; const res = st.get('res', {}); res[q.id] = same(a, q.answer); st.set('res', res);
    if (res[q.id] && S.mode === 'wrong') { const f = st.get('flag', {}); delete f[q.id]; st.set('flag', f); }
    render();
  }
  app.addEventListener('click', onClick); topr.addEventListener('click', onClick); tabs.addEventListener('click', onClick);
  document.querySelector('.brand').addEventListener('click', () => { if (S && S.mode !== 'result' && origin) { const qb = topr.querySelector('[data-a="quit"]'); if (qb) qb.click(); else goBack(); } else { examMode(false); home(); } });
  app.addEventListener('change', e => { });
  function onClick(e) {
    const t = e.target;
    const tb = t.closest('[data-tab]'); if (tb) { const v = tb.dataset.tab; if (v === 'home') home(); else if (v === 'concept') { backTo = null; concepts(); } else if (v === 'practice') practiceSetup(); else if (v === 'mock') mockIntro(); else if (v === 'wrong') startWrong(); return; }
    const o = t.closest('[data-opt]'); if (o) { choose(+o.dataset.opt); return; }
    const rel = t.closest('[data-rel]'); if (rel) { backTo = S; concepts(null, rel.dataset.rel); return; }
    const pm = t.closest('[data-pm]'); if (pm) { const m = +pm.dataset.pm; PF.mods = PF.mods.includes(m) ? PF.mods.filter(x => x !== m) : PF.mods.concat(m); st.set('pf', PF); practiceSetup(); return; }
    const pf = t.closest('[data-pf]'); if (pf) { PF[pf.dataset.pf] = pf.dataset.v; st.set('pf', PF); practiceSetup(); return; }
    const sec = t.closest('[data-sec]'); if (sec && !t.closest('[data-go]')) { e.preventDefault(); if (view === 'concept' && document.getElementById('sec-' + sec.dataset.sec)) { const el = document.getElementById('sec-' + sec.dataset.sec); el.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); app.querySelectorAll('.ctoc a[data-sec]').forEach(a => a.classList.toggle('on', a.dataset.sec === sec.dataset.sec)); } else concepts(null, sec.dataset.sec); return; }
    const rv = t.closest('[data-rv]'); if (rv) { S.mode = 'result'; S.i = +rv.dataset.rv; S.review = false; renderResultQ(); return; }
    const g = t.closest('[data-go]');
    if (g) {
      const v = g.dataset.go;
      if (/^\d+$/.test(v)) { S.i = +v; S.review = false; render(); return; }
      if (v === 'mock') { mockIntro(); return; }
      if (v === 'mockstart') { startExam('mock', mockSet()); return; }
      if (v === 'concept') { concepts(+g.dataset.m); return; }
      if (v === 'pm') { const m = +g.dataset.m; startExam('practice', shuffle(Q.filter(q => q.module === m)), `모듈 ${m} 연습`); return; }
      if (v === 'ps') { const s = SECS.find(x => x.id === g.dataset.sec); if (s) startExam('practice', shuffle(qOfSec(s)), s.title, s.id); return; }
      if (v === 'practice') { startExam('practice', shuffle(practiceList()), '연습'); return; }
      if (v === 'wrong') { startWrong(); return; }
      if (v === 'reset') { ask('기록을 모두 지울까요?', '푼 기록, 검토 표시, 모의고사 기록이 사라져요.', '모두 지우기').then(y => { if (!y) return; ['res', 'flag', 'hist'].forEach(k => { try { localStorage.removeItem('cloudcbt.' + k); } catch (x) { } }); home(); }); return; }
    }
    const b = t.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
    if (a === 'home') { examMode(false); home(); }
    else if (a === 'exit') goBack();
    else if (a === 'finish') { const okN = S.list.filter(x => S.checked[x.id] && same(S.ans[x.id] || [], x.answer)).length, chN = S.list.filter(x => S.checked[x.id]).length; ask(`${chN}문제 중 ${okN}문제 맞혔어요`, okN < chN ? '틀린 문제는 오답노트에 모여 있어요.' : '모두 맞혔어요!', (ORIGIN_LABEL[(origin || {}).view] || '홈으로').replace(/로$/, '로 돌아가기'), true).then(() => goBack()); }
    else if (a === 'backq') { const s = backTo; backTo = null; S = s; render(); }
    else if (a === 'quit') { ask('모의고사를 그만둘까요?', '답한 내용은 저장되지 않아요.', '그만두기').then(y => { if (y) goBack(); }); }
    else if (a === 'prev' && S.i > 0) { S.i--; S.mode === 'result' ? renderResultQ() : render(); }
    else if (a === 'next' && S.i < S.list.length - 1) { S.i++; S.mode === 'result' ? renderResultQ() : render(); }
    else if (a === 'check') check();
    else if (a === 'review') { S.review = true; render(); }
    else if (a === 'back') { S.review = false; render(); }
    else if (a === 'submit') { const un = S.list.filter(q => !(S.ans[q.id] || []).length).length; ask('시험을 제출할까요?', un ? `안 푼 문제가 ${un}개 있어요.` : '제출하면 바로 채점해요.', '제출').then(y => { if (y) submit(); }); }
    else if (a === 'result') submitView();
    else if (a === 'flag') { const q = S.list[S.i]; if (S.mode === 'mock') { S.flag[q.id] = b.checked; } else { const f = st.get('flag', {}); if (b.checked) f[q.id] = 1; else delete f[q.id]; st.set('flag', f); } }
  }
  function goBack(fromPop) {
    const o = origin || { view: 'home' }; origin = null; clearInterval(clockT); examMode(false); S = null;
    if (!fromPop) { try { if (history.state && history.state.cbt === 'exam') history.back(); } catch (e) { } }
    if (o.view === 'concept') {
      concepts(o.m || undefined);
      const el = o.sec && document.getElementById('sec-' + o.sec);
      if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); } else window.scrollTo(0, o.y || 0);
      spy();
    } else if (o.view === 'practice') { practiceSetup(); }
    else if (o.view === 'mock') { mockIntro(); }
    else { home(); window.scrollTo(0, o.y || 0); }
  }
  // 브라우저 뒤로 가기 = 나가기
  window.addEventListener('popstate', () => { if (S && S.mode !== 'result' && origin) { if (S.mode === 'mock') { try { history.pushState({ cbt: 'exam' }, ''); } catch (e) { } const qb = topr.querySelector('[data-a="quit"]'); if (qb) qb.click(); } else goBack(true); } });
  function startWrong() { const res = st.get('res', {}), f = st.get('flag', {}); const list = Q.filter(q => res[q.id] === false || f[q.id]); if (!list.length) { setTabs('wrong'); ask('오답노트가 비어 있어요', '틀린 문제나 검토 표시한 문제가 생기면 여기서 다시 풀 수 있어요.', '확인', true).then(() => home()); return; } startExam('wrong', shuffle(list), '오답노트'); }
  let lastResult = null;
  function renderResultQ() { lastResult = lastResult || app.innerHTML; S.checked = Object.fromEntries(S.list.map(q => [q.id, true])); const keep = S.mode; S.mode = 'practice'; render(); S.mode = keep; topr.innerHTML = '<button class="btn dark" data-a="result">결과로 돌아가기</button>'; const nav = app.querySelector('.nav .g:last-child'); if (nav && S.i === S.list.length - 1) nav.innerHTML = '<button class="btn pri" data-a="result">결과로 돌아가기</button>'; }
  function submitView() { if (lastResult) { examMode(false); setTabs('mock'); app.innerHTML = lastResult; lastResult = null; window.scrollTo(0, 0); } else home(); }
  document.addEventListener('keydown', e => {
    if (!S || S.review || e.ctrlKey || e.metaKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && document.activeElement.type !== 'checkbox') return;
    if (!app.querySelector('.qcard')) return;
    if (/^[1-7]$/.test(e.key)) { choose(+e.key - 1); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { const b = app.querySelector('[data-a="next"]'); if (b) b.click(); }
    else if (e.key === 'ArrowLeft') { const b = app.querySelector('[data-a="prev"]'); if (b && !b.disabled) b.click(); }
    else if (e.key === 'Enter' && !(document.activeElement && document.activeElement.closest('button'))) { const b = app.querySelector('[data-a="check"]:not([disabled])') || app.querySelector('[data-a="next"]'); if (b) { b.click(); e.preventDefault(); } }
  });
  home();
})();

/* AWS 클라우드 CBT — 실전 모의고사 · 연습 · 오답노트 */
(function () {
  'use strict';
  const Q = window.CLOUD_QS || [];
  const MOD = { 2: '모듈 2 · 아키텍팅 소개 · 글로벌 인프라', 3: '모듈 3 · 액세스 보안 (IAM)', 4: '모듈 4 · 스토리지 (S3)', 5: '모듈 5 · 컴퓨팅 (EC2)', 6: '모듈 6 · 데이터베이스', 7: '모듈 7 · 네트워킹 (VPC)' };
  const LT = 'ABCDEFG';
  const app = document.getElementById('app'), topr = document.getElementById('topr');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const st = {
    get(k, d) { try { const v = localStorage.getItem('cloudcbt.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('cloudcbt.' + k, JSON.stringify(v)); } catch (e) { } },
  };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const same = (a, b) => a.length === b.length && a.slice().sort().join() === b.slice().sort().join();
  let S = null, clockT = null;
  // 페이지 안 확인창 (confirm 대신)
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

  /* ---------- 홈 ---------- */
  function home() {
    S = null; clearInterval(clockT); topr.innerHTML = ''; document.title = 'AWS 클라우드 CBT';
    const res = st.get('res', {}); const flags = st.get('flag', {});
    const done = Object.keys(res).length, ok = Object.values(res).filter(Boolean).length, wrong = Object.values(res).filter(v => !v).length;
    const hist = st.get('hist', []);
    const byMod = m => { const qs = Q.filter(q => q.module === m); const d = qs.filter(q => q.id in res); return { n: qs.length, d: d.length, ok: d.filter(q => res[q.id]).length }; };
    app.innerHTML = `<div class="wrap">
      <h1>클라우드 컴퓨팅 중간고사 CBT</h1>
      <p class="sub">AWS Academy Cloud Architecting 모듈 2~7 · AWS 자격증(SAA) 시험 화면처럼 풀어 보는 문제은행 ${Q.length}문항</p>
      <div class="facts"><div><b>약 25문항</b><span>선다형만 출제</span></div><div><b>N개 고르시오</b><span>문제마다 고를 개수 제시</span></div><div><b>지식 확인 + SAA</b><span>쉬운 문제 · 자격증 수준 반반</span></div><div><b>시간 제한 없음</b><span>보통 1시간 안에 끝냄</span></div></div>
      <div class="modes">
        <div class="mode"><h2>실전 모의고사</h2><p>25문항을 모듈별로 고르게 뽑아요. 쉬운 문제와 SAA 수준이 반반. 끝까지 정답을 보여 주지 않고, 제출하면 모듈별 점수가 나와요.</p><div class="meta">지금까지 ${hist.length}회 응시${hist.length ? ` · 최근 ${hist[hist.length - 1].pct}%` : ''}</div><button class="btn pri" data-go="mock">모의고사 시작</button></div>
        <div class="mode"><h2>연습 모드</h2><p>한 문제씩 풀고 바로 정답과 <b>보기마다 왜 맞고 틀린지</b> 해설을 봐요.</p>
          <label>모듈<select id="f-mod"><option value="">전체 모듈</option>${Object.keys(MOD).map(m => `<option value="${m}">${MOD[m]}</option>`).join('')}</select></label>
          <label>난이도<select id="f-lv"><option value="">전체</option><option value="basic">지식 확인 수준</option><option value="saa">자격증(SAA) 수준</option></select></label>
          <label>범위<select id="f-only"><option value="">모든 문제</option><option value="new">안 푼 문제만</option><option value="multi">복수 선택 문제만</option></select></label>
          <button class="btn pri" data-go="practice">연습 시작</button></div>
        <div class="mode"><h2>오답노트</h2><p>틀린 문제와 검토 표시한 문제만 다시 풀어요. 다시 맞히면 오답노트에서 빠져요.</p><div class="meta">틀린 문제 ${wrong}개 · 검토 표시 ${Object.keys(flags).length}개</div><button class="btn pri" data-go="wrong"${wrong + Object.keys(flags).length ? '' : ' disabled'}>오답노트 풀기</button></div>
      </div>
      <div class="mods"><h3>모듈별 진도 · 정답률 (푼 문제 ${done} / ${Q.length} · 맞힘 ${ok})</h3>${Object.keys(MOD).map(m => { const x = byMod(+m); const pct = x.d ? Math.round(x.ok / x.d * 100) : 0; return `<div class="mrow"><span>${MOD[m]}</span><div class="bar"><i style="width:${x.d ? pct : 0}%"></i></div><span class="n">${x.d}/${x.n} 풀이 · ${x.d ? pct + '%' : '–'}</span></div>`; }).join('')}</div>
      <div class="tip"><b>복수 선택 푸는 법</b> ① 고를 개수부터 확인 ② 조건 키워드에 밑줄(최저 비용 · 고가용성 · 최소 운영 부담 · 가장 안전) ③ 보기마다 O/X — 틀린 단어 하나만 있어도 X.<br><b>단축키</b> 숫자 1~6 보기 선택 · Enter 정답 확인/다음 · ← → 이전/다음 문제</div>
      <p class="foot">문제는 수업 PDF(모듈 2~7)와 학습 노트를 바탕으로 새로 쓴 연습 문제예요. 실제 지식 확인 문항이나 유출된 덤프 문제를 옮긴 게 아니에요. 기록은 이 브라우저에만 저장돼요. <button class="btn" data-go="reset" style="padding:3px 10px;font-size:12.5px">기록 지우기</button></p>
    </div>`;
    window.scrollTo(0, 0);
  }

  /* ---------- 문제 세트 ---------- */
  function mockSet() {
    const per = { 2: 4, 3: 4, 4: 4, 5: 5, 6: 4, 7: 4 }; let out = [];
    Object.keys(per).forEach(m => { const qs = Q.filter(q => q.module === +m); const b = shuffle(qs.filter(q => q.level === 'basic')), s = shuffle(qs.filter(q => q.level === 'saa')); const n = per[m], nb = Math.ceil(n / 2); out = out.concat(b.slice(0, nb), s.slice(0, n - nb)); });
    return shuffle(out);
  }
  function startExam(mode, list) {
    if (!list.length) { ask('조건에 맞는 문제가 없어요', '필터를 바꿔 보세요.', '확인', true); return; }
    S = { mode, list, i: 0, ans: {}, flag: {}, checked: {}, t0: Date.now(), review: false };
    if (mode === 'mock') { clearInterval(clockT); clockT = setInterval(drawClock, 1000); }
    render();
  }
  function drawClock() { const c = document.getElementById('clk'); if (!c || !S) return; const s = Math.floor((Date.now() - S.t0) / 1000); c.textContent = `경과 ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; }

  /* ---------- 문제 화면 ---------- */
  function render() {
    if (S.review) return renderReview();
    const q = S.list[S.i]; const a = S.ans[q.id] || []; const mock = S.mode === 'mock'; const done = !mock && S.checked[q.id];
    const right = done && same(a, q.answer);
    document.title = `${S.i + 1}/${S.list.length} · AWS 클라우드 CBT`;
    topr.innerHTML = (mock ? '<span class="clock" id="clk"></span>' : '') + `<button class="btn dark" data-a="${mock ? 'quit' : 'home'}">${mock ? '그만두기' : '홈'}</button>`;
    const flagged = mock ? S.flag[q.id] : !!st.get('flag', {})[q.id];
    const opts = q.options.map((o, k) => {
      let c = a.includes(k) ? ' on' : '';
      if (done) { if (q.answer.includes(k)) c = ' right'; else if (a.includes(k)) c = ' wrong'; else c = ''; }
      const why = done && q.why ? `<span class="why">${esc(q.why[k])}</span>` : '';
      return `<button class="opt${c}" data-opt="${k}" role="${q.pick > 1 ? 'checkbox' : 'radio'}" aria-checked="${a.includes(k)}"><span class="mk"></span><span class="lt">${LT[k]}.</span><span>${esc(o)}${why}</span></button>`;
    }).join('');
    let res = '';
    if (done) res = `<div class="res ${right ? 'ok' : 'no'}"><b class="${right ? 'r' : 'w'}">${right ? '정답이에요!' : '틀렸어요.'}</b> 정답: ${q.answer.map(k => LT[k]).join(', ')}<div style="margin-top:6px">${esc(q.explain)}</div><div class="tags">${(q.tags || []).map(t => `<span class="chip">${esc(t)}</span>`).join('')}</div></div>`;
    const answeredN = S.list.filter(x => (S.ans[x.id] || []).length).length;
    app.innerHTML = `<div class="exam">
      <div class="qbar"><span style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span class="qn">문제 ${S.i + 1} / ${S.list.length}</span><span class="chip">${esc(MOD[q.module].split(' · ')[0])}</span>${mock ? '' : `<span class="chip ${q.level === 'saa' ? 'saa' : 'kc'}">${q.level === 'saa' ? '자격증 수준' : '지식 확인 수준'}</span>`}</span>
        <label class="flagbox"><input type="checkbox" data-a="flag"${flagged ? ' checked' : ''}> 검토 표시</label></div>
      <div class="qcard"><p class="qt">${esc(q.q)}</p><p class="pick">${q.pick > 1 ? `${q.pick}개를 고르시오.` : '1개를 고르시오.'}${q.pick > 1 ? ` <span style="color:var(--mut);font-weight:500">(${a.length}/${q.pick} 선택)</span>` : ''}</p>
        <div class="opts${q.pick > 1 ? ' multi' : ''}" role="${q.pick > 1 ? 'group' : 'radiogroup'}">${opts}</div>${res}</div>
    </div>
    <nav class="nav"><div class="in"><div class="g"><button class="btn" data-a="prev"${S.i === 0 ? ' disabled' : ''}>← 이전</button>${mock ? '<button class="btn" data-a="review">전체 검토</button>' : ''}</div>
      <span class="prog">${mock ? `답한 문제 ${answeredN} / ${S.list.length}` : `맞힘 ${S.list.filter(x => S.checked[x.id] && same(S.ans[x.id] || [], x.answer)).length} / 확인 ${S.list.filter(x => S.checked[x.id]).length}`}</span>
      <div class="g">${!mock && !done ? `<button class="btn pri" data-a="check"${a.length === q.pick ? '' : ' disabled'}>정답 확인</button>` : ''}${S.i < S.list.length - 1 ? `<button class="btn${mock || done ? ' pri' : ''}" data-a="next">다음 →</button>` : mock ? '<button class="btn pri" data-a="review">검토 후 제출</button>' : '<button class="btn pri" data-a="home">끝내기</button>'}</div></div></nav>`;
    if (mock) drawClock();
    window.scrollTo(0, 0);
  }
  function renderReview() {
    const qs = S.list; const un = qs.filter(q => !(S.ans[q.id] || []).length).length; const fl = qs.filter(q => S.flag[q.id]).length;
    topr.innerHTML = '<span class="clock" id="clk"></span><button class="btn dark" data-a="quit">그만두기</button>';
    app.innerHTML = `<div class="exam review"><h2>전체 검토</h2><p class="sub">문제를 눌러 돌아가 고칠 수 있어요. 끝났으면 <b>시험 제출</b>을 누르세요.</p>
      <div class="legend"><span>안 푼 문제 <b style="color:var(--bad)">${un}</b></span><span>검토 표시 <b style="color:var(--flag)">${fl}</b></span><span>답한 문제 <b style="color:var(--ok)">${qs.length - un}</b></span></div>
      <div class="rgrid">${qs.map((q, k) => { const an = (S.ans[q.id] || []).length; const c = (an ? 'an' : 'un') + (S.flag[q.id] ? ' fl' : ''); return `<button class="${c}" data-go="${k}"><span>문제 ${k + 1}</span><span class="st">${S.flag[q.id] ? '검토' : an ? '답함' : '안 푼'}</span></button>`; }).join('')}</div></div>
      <nav class="nav"><div class="in"><div class="g"><button class="btn" data-a="back">← 문제로 돌아가기</button></div><div class="g"><button class="btn pri" data-a="submit">시험 제출</button></div></div></nav>`;
    drawClock(); window.scrollTo(0, 0);
  }
  function submit() {
    clearInterval(clockT);
    const qs = S.list; const res = st.get('res', {});
    qs.forEach(q => { res[q.id] = same(S.ans[q.id] || [], q.answer); }); st.set('res', res);
    const flags = st.get('flag', {}); qs.forEach(q => { if (S.flag[q.id]) flags[q.id] = 1; }); st.set('flag', flags);
    const ok = qs.filter(q => res[q.id]).length; const pct = Math.round(ok / qs.length * 100); const scaled = Math.round(100 + ok / qs.length * 900);
    const mins = Math.round((Date.now() - S.t0) / 60000);
    const hist = st.get('hist', []); hist.push({ at: Date.now(), pct, ok, n: qs.length }); st.set('hist', hist.slice(-30));
    const R = S; R.result = true;
    topr.innerHTML = '<button class="btn dark" data-a="home">홈</button>';
    const mods = Object.keys(MOD).map(m => { const x = qs.filter(q => q.module === +m); const o = x.filter(q => res[q.id]).length; return x.length ? `<div class="mrow"><span>${MOD[m]}</span><div class="bar"><i style="width:${o / x.length * 100}%"></i></div><span class="n">${o} / ${x.length}</span></div>` : ''; }).join('');
    const lv = l => { const x = qs.filter(q => q.level === l); const o = x.filter(q => res[q.id]).length; return `${o} / ${x.length}`; };
    app.innerHTML = `<div class="wrap"><h1>모의고사 결과</h1>
      <div class="score"><b>${ok} / ${qs.length}</b><span class="pass ${scaled >= 720 ? 'y' : 'n'}">${pct}% · AWS 환산 ${scaled}점 ${scaled >= 720 ? '합격선 이상' : '합격선(720) 미만'}</span></div>
      <p class="sub">걸린 시간 약 ${mins}분 · 지식 확인 수준 ${lv('basic')} · 자격증 수준 ${lv('saa')}</p>
      <div class="mods"><h3>모듈별 점수</h3>${mods}</div>
      <h3 style="margin:26px 0 0">문제별 결과 — 눌러서 해설 보기</h3>
      <div class="qlist">${qs.map((q, k) => `<button class="qitem" data-rv="${k}"><span class="k">${k + 1}</span><span class="t">${esc(q.q.split('\n')[0])}</span><span class="s ${res[q.id] ? 'o' : 'x'}">${res[q.id] ? '정답' : '오답'}</span></button>`).join('')}</div>
      <p style="margin-top:20px;display:flex;gap:8px;flex-wrap:wrap"><button class="btn pri" data-go="mock">새 모의고사</button><button class="btn" data-a="home">홈</button></p></div>`;
    S = { mode: 'result', list: qs, ans: R.ans, checked: Object.fromEntries(qs.map(q => [q.id, true])), i: 0, flag: {} };
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
    const q = S.list[S.i]; const a = S.ans[q.id] || []; if (a.length !== q.pick) return;
    S.checked[q.id] = true; const res = st.get('res', {}); res[q.id] = same(a, q.answer); st.set('res', res);
    if (res[q.id] && S.mode === 'wrong') { const f = st.get('flag', {}); delete f[q.id]; st.set('flag', f); }
    render();
  }
  app.addEventListener('click', onClick); topr.addEventListener('click', onClick);
  function onClick(e) {
    const t = e.target;
    const o = t.closest('[data-opt]'); if (o) { choose(+o.dataset.opt); return; }
    const rv = t.closest('[data-rv]'); if (rv) { S.mode = 'result'; S.i = +rv.dataset.rv; S.review = false; renderResultQ(); return; }
    const g = t.closest('[data-go]');
    if (g) {
      const v = g.dataset.go;
      if (/^\d+$/.test(v)) { S.i = +v; S.review = false; render(); return; }
      if (v === 'mock') { ask('실전 모의고사를 시작할까요?', '· 25문항, 시간 제한 없음 (경과 시간만 표시)\n· 제출할 때까지 정답을 보여 주지 않아요', '시작').then(y => { if (y) startExam('mock', mockSet()); }); return; }
      if (v === 'practice') {
        const m = document.getElementById('f-mod').value, lv = document.getElementById('f-lv').value, only = document.getElementById('f-only').value; const res = st.get('res', {});
        let list = Q.filter(q => (!m || q.module === +m) && (!lv || q.level === lv) && (only !== 'new' || !(q.id in res)) && (only !== 'multi' || q.pick > 1));
        startExam('practice', shuffle(list)); return;
      }
      if (v === 'wrong') { const res = st.get('res', {}), f = st.get('flag', {}); startExam('wrong', shuffle(Q.filter(q => res[q.id] === false || f[q.id]))); return; }
      if (v === 'reset') { ask('기록을 모두 지울까요?', '푼 기록, 검토 표시, 모의고사 기록이 사라져요.', '모두 지우기').then(y => { if (!y) return; ['res', 'flag', 'hist'].forEach(k => { try { localStorage.removeItem('cloudcbt.' + k); } catch (x) { } }); home(); }); return; }
    }
    const b = t.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
    if (a === 'home') home();
    else if (a === 'quit') { ask('모의고사를 그만둘까요?', '답한 내용은 저장되지 않아요.', '그만두기').then(y => { if (y) home(); }); }
    else if (a === 'prev' && S.i > 0) { S.i--; S.mode === 'result' ? renderResultQ() : render(); }
    else if (a === 'next' && S.i < S.list.length - 1) { S.i++; S.mode === 'result' ? renderResultQ() : render(); }
    else if (a === 'check') check();
    else if (a === 'review') { S.review = true; render(); }
    else if (a === 'back') { S.review = false; render(); }
    else if (a === 'submit') { const un = S.list.filter(q => !(S.ans[q.id] || []).length).length; ask('시험을 제출할까요?', un ? `안 푼 문제가 ${un}개 있어요.` : '제출하면 바로 채점해요.', '제출').then(y => { if (y) submit(); }); }
    else if (a === 'result') submitView();
    else if (a === 'flag') { const q = S.list[S.i]; if (S.mode === 'mock') { S.flag[q.id] = b.checked; } else { const f = st.get('flag', {}); if (b.checked) f[q.id] = 1; else delete f[q.id]; st.set('flag', f); } }
  }
  let lastResult = null;
  function renderResultQ() { lastResult = lastResult || app.innerHTML; S.checked = Object.fromEntries(S.list.map(q => [q.id, true])); const keep = S.mode; S.mode = 'practice'; render(); S.mode = keep; topr.innerHTML = '<button class="btn dark" data-a="result">결과로 돌아가기</button>'; const nav = app.querySelector('.nav .g:last-child'); if (nav && S.i === S.list.length - 1) nav.innerHTML = '<button class="btn pri" data-a="result">결과로 돌아가기</button>'; }
  function submitView() { if (lastResult) { app.innerHTML = lastResult; lastResult = null; topr.innerHTML = '<button class="btn dark" data-a="home">홈</button>'; window.scrollTo(0, 0); } else home(); }
  document.addEventListener('keydown', e => {
    if (!S || S.review || e.ctrlKey || e.metaKey || e.altKey || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName) && document.activeElement.type !== 'checkbox') return;
    if (S.mode === 'result' && !app.querySelector('.qcard')) return;
    if (/^[1-7]$/.test(e.key)) { choose(+e.key - 1); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { const b = app.querySelector('[data-a="next"]'); if (b) b.click(); }
    else if (e.key === 'ArrowLeft') { const b = app.querySelector('[data-a="prev"]'); if (b && !b.disabled) b.click(); }
    else if (e.key === 'Enter' && !(document.activeElement && document.activeElement.closest('button'))) { const b = app.querySelector('[data-a="check"]:not([disabled])') || app.querySelector('[data-a="next"]'); if (b) { b.click(); e.preventDefault(); } }
  });
  home();
})();

(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))s(a);new MutationObserver(a=>{for(const o of a)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&s(i)}).observe(document,{childList:!0,subtree:!0});function e(a){const o={};return a.integrity&&(o.integrity=a.integrity),a.referrerPolicy&&(o.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?o.credentials="include":a.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function s(a){if(a.ep)return;a.ep=!0;const o=e(a);fetch(a.href,o)}})();const n={collegeSpend:130,careerSpend:250,currentWorkHours:20,hourlyWage:12e3,salary:300},p=[{id:"focus",name:"대학 집중형",workHours:0,loanUse:5e3,loanRate:100,collegeSpend:104,repayment:86,careerSpend:214,headline:"대학의 시간을 확보하고, 취업 후 나눠 갚아요."},{id:"balance",name:"균형형",workHours:10,loanUse:2500,loanRate:50,collegeSpend:100,repayment:43,careerSpend:257,headline:"지금과 미래의 부담을 절반씩 나눠요."},{id:"future",name:"미래 여유형",workHours:20,loanUse:0,loanRate:0,collegeSpend:96,repayment:0,careerSpend:300,headline:"지금 더 일하고, 첫 월급을 온전히 사용해요."}],l=t=>`${t.toLocaleString("ko-KR")}만원`,y=p.map(t=>`
    <button
      class="scenario-option"
      type="button"
      role="radio"
      aria-checked="false"
      data-scenario="${t.id}"
    >
      <span class="scenario-copy">
        <strong>${t.name}</strong>
        <span>${t.workHours===0?"공부에 집중":t.workHours===10?"일과 공부의 균형":"취업 후 여유 확보"}</span>
      </span>
      <span class="scenario-hours">주 <b>${t.workHours}</b>시간</span>
      <span class="select-mark" aria-hidden="true"></span>
    </button>
  `).join("");document.querySelector("#app").innerHTML=`
  <main class="shell" data-active-scenario="focus">
    <header class="topbar">
      <a class="brand" href="#main-result" aria-label="학자금 대출 최적화 AI 결과로 이동">
        <svg aria-hidden="true" viewBox="0 0 28 28">
          <path d="M4 20V8l10-5 10 5v12l-10 5-10-5Z" />
          <path d="M4 8l10 5 10-5M14 13v12" />
        </svg>
        <span>학자금 대출 최적화 AI</span>
      </a>
      <div class="goal-strip" aria-label="사용자 희망 기준">
        <span>나의 기준</span>
        <b>대학 ${l(n.collegeSpend)}</b>
        <b>취업 후 ${l(n.careerSpend)}</b>
        <b>현재 주 ${n.currentWorkHours}시간</b>
      </div>
      <button class="goal-toggle" type="button" aria-pressed="true">
        <span class="toggle-dot"></span>
        <span class="toggle-label">목표선 켜짐</span>
      </button>
    </header>

    <section class="intro" aria-labelledby="page-title">
      <div>
        <h1 id="page-title">지금의 시간과<br>미래의 생활비.</h1>
        <p>카드 하나만 누르면 두 시기의 차이가 바로 바뀝니다.</p>
      </div>
      <div class="demo-stamp" aria-label="데모 계산 조건">
        <span>DEMO</span>
        <b>대출 5,000만원</b>
        <small>연 1.5% · 취업 후 5년</small>
      </div>
    </section>

    <section class="scenario-picker" aria-labelledby="scenario-title">
      <div class="section-heading">
        <h2 id="scenario-title">주당 노동시간을 고르세요</h2>
        <span>카드 전체 선택</span>
      </div>
      <div class="scenario-options" role="radiogroup" aria-label="근로와 대출 사용 시나리오">
        ${y}
      </div>
    </section>

    <section class="result-stage result-split" id="main-result" aria-live="polite">
      <div class="result-summary">
        <div class="result-head">
          <div><span class="active-level" id="active-level"></span><h2 id="scenario-headline"></h2></div>
        </div>
        <div class="consumption-bridge">
          <article class="period college-period"><span class="period-label">대학 시절</span><div class="amount-line"><strong id="college-spend"></strong><span>/ 월</span></div><div class="goal-track college-track"><i class="actual-fill"></i><i class="goal-marker"><span>${l(n.collegeSpend)}</span></i></div><span class="amount-gap" id="college-gap"></span></article>
          <div class="repayment-path"><svg aria-hidden="true" viewBox="0 0 180 54" preserveAspectRatio="none"><path class="path-base" d="M4 27H176"/><path class="path-motion" d="M4 27H176"/><path class="path-arrow" d="m164 15 12 12-12 12"/></svg><span>5년 상환</span><strong id="repayment"></strong></div>
          <article class="period career-period"><span class="period-label">취업 후</span><div class="amount-line"><strong id="career-spend"></strong><span>/ 월</span></div><div class="goal-track career-track"><i class="actual-fill"></i><i class="goal-marker"><span>${l(n.careerSpend)}</span></i></div><span class="amount-gap" id="career-gap"></span></article>
        </div>
      </div>
      <aside class="result-detail">
        <span>선택한 결과</span>
        <h3>숫자가 이렇게 나온 이유</h3>
        <p><b>대학 시절</b> 근로소득과 대출금을 48개월로 나눠 월 소비 여력을 계산했어요.</p>
        <p><b>취업 후</b> 월급 300만원에서 5년간의 원리금 상환액을 뺐어요.</p>
        <p>세금·주휴수당·물가 변화는 이번 데모에서 제외했어요.</p>
      </aside>
    </section>

    <section class="journey-section" aria-labelledby="journey-title">
      <div class="section-heading journey-heading">
          <h2 id="journey-title">시간과 돈의 이동</h2>
      </div>
      <div class="visual-tools" aria-label="시간과 상환 기간 시각화">
      <article class="week-tool">
        <div class="tool-head">
          <div>
            <h2>한 주의 노동시간</h2>
            <p>한 칸은 1시간</p>
          </div>
          <strong id="work-hours"></strong>
        </div>
        <div class="hour-grid" aria-hidden="true">
          ${Array.from({length:20},(t,r)=>`<i data-hour="${r+1}"></i>`).join("")}
        </div>
      </article>

      <article class="timeline-tool">
        <div class="tool-head">
          <div>
            <h2>돈의 이동 경로</h2>
            <p>대학 4년 + 상환 5년</p>
          </div>
          <button class="play-route" type="button" aria-label="돈의 이동 경로 다시 보기">
            <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m7 4 7 6-7 6V4Z" /></svg>
            다시 보기
          </button>
        </div>
        <div class="year-route" aria-label="대학 4년과 취업 후 상환 5년">
          ${Array.from({length:9},(t,r)=>`
            <span class="year-node ${r<4?"college-year":"career-year"}">
              <i></i><small>${r+1}년</small>
            </span>
          `).join("")}
          <span class="route-progress"></span>
          <b class="graduation-pin">졸업</b>
        </div>
      </article>
      </div>
    </section>

    <section class="method-section" aria-labelledby="method-title">
      <details class="calculation-details">
        <summary>
          <span id="method-title">계산 방식 보기</span>
          <svg aria-hidden="true" viewBox="0 0 20 20"><path d="m5 8 5 5 5-5" /></svg>
        </summary>
        <div class="detail-grid">
          <p><b>대학 생활</b><span>근로소득 + 대출 사용액 ÷ 48개월</span></p>
          <p><b>취업 후</b><span>월급 300만원 − 5년 원리금 균등상환액</span></p>
          <p><b>제외 항목</b><span>세금, 주휴수당, 물가 변화는 이번 데모에서 제외</span></p>
        </div>
      </details>
    </section>

    <footer>
      <p>이 화면은 아이디어 검토용 데모이며 실제 금융 자문이 아닙니다.</p>
      <span>졸업까지 4년 · 취업 월급 ${l(n.salary)} · 시급 ${n.hourlyWage.toLocaleString("ko-KR")}원</span>
    </footer>
  </main>
`;const m=document.querySelector(".shell"),c=[...document.querySelectorAll(".scenario-option")],d=document.querySelector(".goal-toggle"),b=document.querySelector(".play-route");function g(t,r){const e=t-r;return e===0?"희망 수준과 같아요":`희망보다 ${l(Math.abs(e))} ${e>0?"여유":"낮음"}`}function h(t,r,e,s){const a=document.querySelector(t);a.style.setProperty("--actual-ratio",Math.min(r/s,1)),a.style.setProperty("--goal",`${Math.min(e/s*100,100)}%`)}function u(t,r=!1){const e=p.find(s=>s.id===t)??p[0];m.dataset.activeScenario=e.id,c.forEach(s=>{const a=s.dataset.scenario===e.id;s.setAttribute("aria-checked",String(a)),s.tabIndex=a?0:-1,a&&r&&s.focus()}),document.querySelector("#scenario-headline").textContent=e.headline,document.querySelector("#active-level").textContent=`${e.name} · 주 ${e.workHours}시간`,document.querySelector("#college-spend").textContent=l(e.collegeSpend),document.querySelector("#career-spend").textContent=l(e.careerSpend),document.querySelector("#repayment").textContent=e.repayment?`월 ${l(e.repayment)}`:"상환 없음",document.querySelector("#college-gap").textContent=g(e.collegeSpend,n.collegeSpend),document.querySelector("#career-gap").textContent=g(e.careerSpend,n.careerSpend),document.querySelector("#work-hours").textContent=`주 ${e.workHours}시간`,h(".college-track",e.collegeSpend,n.collegeSpend,150),h(".career-track",e.careerSpend,n.careerSpend,320),[["#college-gap",e.collegeSpend,n.collegeSpend],["#career-gap",e.careerSpend,n.careerSpend]].forEach(([s,a,o])=>{const i=document.querySelector(s);i.classList.toggle("is-positive",a>o),i.classList.toggle("is-negative",a<o)}),document.querySelectorAll(".hour-grid i").forEach((s,a)=>{s.classList.toggle("is-work",a<e.workHours)}),v()}function v(){const t=document.querySelector(".year-route");t.classList.remove("is-running"),t.offsetWidth,t.classList.add("is-running")}c.forEach((t,r)=>{t.addEventListener("click",()=>u(t.dataset.scenario)),t.addEventListener("keydown",e=>{if(!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(e.key))return;e.preventDefault();const s=["ArrowRight","ArrowDown"].includes(e.key)?1:-1,a=(r+s+c.length)%c.length;u(c[a].dataset.scenario,!0)})});d.addEventListener("click",()=>{const t=d.getAttribute("aria-pressed")!=="true";d.setAttribute("aria-pressed",String(t)),d.querySelector(".toggle-label").textContent=t?"목표선 켜짐":"목표선 꺼짐",m.classList.toggle("goals-hidden",!t)});b.addEventListener("click",v);u("focus");

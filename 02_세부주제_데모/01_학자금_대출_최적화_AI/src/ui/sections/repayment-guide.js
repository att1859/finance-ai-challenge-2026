import { LOAN_POLICY_SNAPSHOT } from '../../policies/loans/2026.js';


export function renderRepaymentGuide() {
 const {general, incomeContingent}=LOAN_POLICY_SNAPSHOT.products;
 return `<section class="repayment-guide" aria-labelledby="result-title" id="repayment-guide" tabindex="-1">
 <h2 id="result-title">갚는 방식에는 2가지가 있어요</h2>
 <div class="repayment-guide-grid">
 <article><span class="guide-tag">고정금리 · 연 ${general.interest.annualRate}%</span><h3>일반 상환</h3><p>소득과 관계없이 <strong>정해진 일정대로</strong> 갚아요.</p><p>거치기간에는 이자만, 이후에는 원금과 이자를 나눠 내요. 대출받을 때 정한 금리가 유지돼요.</p></article>
 <article><span class="guide-tag"><strong class="variable-rate-emphasis">변동금리</strong> · 현재 연 ${incomeContingent.interest.annualRate}%</span><h3>취업 후 상환 <small>ICL</small></h3><p>연간 소득이 기준을 넘으면 <strong>소득에 따라</strong> 갚아요.</p><p><span class="variable-rate-explanation">금리가 나중에 바뀔 수 있어</span> 총이자와 갚는 기간도 달라질 수 있어요. 취업 자체가 상환 시작 기준은 아니에요.</p></article>
 </div>
 <p class="guide-assumption">아래 계산은 현재 금리가 유지된다고 가정해요. ICL의 미래 금리 변화는 예측하지 않아요.</p>
 <p>처음에는 등록금·생활비 모두 <strong>일반 상환</strong>으로 비교해요. 그래프 아래에서 추가 정보를 확인한 뒤 각 안의 상품을 바꿀 수 있어요.</p>
 <small class="guide-sources">2026년 2학기 기준 · <a href="https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_02_01&ttab1=0" target="_blank" rel="noreferrer">일반 상환 안내</a> · <a href="https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_01_01&ttab1=0" target="_blank" rel="noreferrer">ICL 안내</a></small>
 </section>`;
}

import { LOAN_POLICY_SNAPSHOT as policy } from '../../policies/loans/2026-2.js';
import { icon } from '../shared/icon.js';

const info = (id, label) => `<button class="slow-info" type="button" popovertarget="${id}" aria-label="${label}">${icon('info')}</button>`;

const topics = [
  ['대출이 무서우신가요?',
    '대출은 미래의 소득을 현재로 당겨올 수 있는 수단이에요. 적절히 활용하면 미래를 조금 희생하는 대신 현재의 돈과 시간을 충분하게 확보할 수 있어요.'],
  ['대출로 현재의 시간을 버는 원리',
    '학자금의 일부를 대출로 마련하면 현재 일하는 시간을 줄일 수 있게 돼요. 이렇게 생긴 시간을 학업과 취업 준비 등에 쓸 수 있게 돼요.'],
  ['학자금 대출만의 이점',
    `담보를 설정하면 상대적으로 낮은 금리가 적용되는데, 담보대출 중 가장 대표적인 주택담보대출의 이자율은 4.48%에요${info('mortgage-rate-note', '주택담보대출 금리 기준 보기')}. 학자금 대출은 담보를 잡지 않는 상품인데도 이자율은 주택담보대출보다도 훨씬 낮은 연 ${policy.products.general.interest.annualRate}%에요. 단, 학자금 대출에서 일반 상환은 고정금리, 취업 후 상환은 변동금리예요. 추후 금리의 변동에 따라 생길 수 있는 위험은 다음을 참고하세요.${info('interest-type-note', '고정금리와 변동금리 설명 보기')}`],
  ['소비 평탄화란?',
    '소득이 적은 시기와 소득이 많은 시기의 소비력을 조정하여 소비 수준을 완만하게 유지하자는 경제 이론이에요. 소득이 적은 지금 소득을 늘리는 대신, 소득이 많아지는 시기에는 소득이 줄어들어요.'],
  ['등록금을 낼 여력이 있어도, 대출을 고려해야하는 이유는 뭘까요?',
    '대출은 현재와 미래를 교환할 수 있는 수단이기 때문이에요. 본인이 현재를 중시하는 성향이라면, 대출을 통해 학자금을 충당하고 원래의 돈을 소비에 사용할 수 있어요. 미래를 중시하는 성향이더라도, 대출을 통해 학자금을 충당하고 원래의 돈을 투자 및 교육에 지출함으로써 미래를 대비할 수 있어요.'],
];

export function renderLoanIntroduction() {
  return `<section class="slow-intro" id="top" aria-labelledby="hero-title">
    <div class="slow-hero">
      <h1 id="hero-title">학자금 대출,<br>SLOW로 만나보세요</h1>
      <p>Student Loan Optimizing Window</p>
    </div>
    <div class="slow-topics" aria-label="후킹 멘트 섹션">
      ${topics.map(([title, lead], index) => `<article class="slow-topic" aria-labelledby="slow-topic-${index}">
        <div class="slow-topic-heading"><span class="slow-number" aria-hidden="true">0${index + 1}</span><h2 id="slow-topic-${index}">${title}</h2></div>
        <div class="slow-topic-copy"><p>${lead}</p></div>
      </article>`).join('')}
    </div>
    <div id="mortgage-rate-note" class="slow-info-note" popover>2026년7월 가중평균금리 기준</div>
    <div id="interest-type-note" class="slow-info-note" popover>
      <p><strong>고정 금리</strong> - 월 상환액이 빌리는 시점부터 고정되지만, 추후 다른 대출의 금리가 낮아질 경우 본인만 상대적으로 높은 이자를 내게 될 수도 있어요.</p>
      <p><strong>변동 금리</strong> - 월 상환액이 금리에 따라 변동돼요. 추후 금리가 높아질 경우 높은 이자를 내야 하고, 낮아질 경우 낮은 이자를 내게 돼요.</p>
    </div>
    <div class="slow-requirements"><button class="button button-quiet" type="button" data-action="open-smoothing" aria-haspopup="dialog" aria-controls="smoothing-dialog">실제 학자금 대출 상세 요건 알아보기 ${icon('arrow')}</button></div>
  </section>`;
}

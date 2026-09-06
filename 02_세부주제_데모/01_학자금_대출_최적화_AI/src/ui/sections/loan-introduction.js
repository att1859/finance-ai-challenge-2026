import { LOAN_POLICY_SNAPSHOT as policy } from '../../policies/loans/2026-2.js';
import { icon } from '../shared/icon.js';

const topics = [
  ['대출이 무서우신가요?',
    '필요한 금액과 빌리는 비용, 갚는 시점을 알면 선택이 구체적이 됩니다. 지금의 생활 여력과 이후의 상환 부담을 함께 살펴봐요.'],
  ['대출로 대학시절 시간을 버는 원리',
    '생활비 일부를 대출로 마련하면 일하는 시간을 줄일 여지가 생겨요. 미래에 갚을 돈을 지금 사용해 학업과 취업 준비에 쓸 시간을 확보하는 원리예요.'],
  ['학자금 대출만의 이점',
    `2026년 2학기 연 ${policy.products.general.interest.annualRate}%. 일반 상환은 고정금리, 취업 후 상환은 변동금리예요. 낮은 이자 비용과 함께 상품별 상환 조건도 확인해 보세요.`],
  ['소비 평탄화란?',
    '소득이 적은 지금과 소득이 생기는 미래의 생활 여력을 조정하는 생각이에요. 지금의 필요를 나누어 부담하는 대신, 미래에는 원금과 이자를 갚을 여력이 필요해요.'],
  ['등록금 낼 여력이 있어도, 대출을 고려해야하는 이유는 뭘까요?',
    '자기자금을 한 번에 지출할지, 일부를 남기고 나누어 갚을지 비교할 수 있기 때문이에요. 남겨둘 자금의 필요성과 대출 비용을 함께 고려해요. 등록금 대출은 생활비 지급과는 달라요.'],
];

export function renderLoanIntroduction() {
  return `<section class="slow-intro" id="top" aria-labelledby="hero-title">
    <div class="slow-hero">
      <h1 id="hero-title">학자금 대출,<br>SLOW로 만나보세요</h1>
      <p>Student Loan Operating Window</p>
    </div>
    <div class="slow-topics" aria-label="후킹 멘트 섹션">
      ${topics.map(([title, lead], index) => `<article class="slow-topic" aria-labelledby="slow-topic-${index}">
        <div class="slow-topic-heading"><span class="slow-number" aria-hidden="true">0${index + 1}</span><h2 id="slow-topic-${index}">${title}</h2></div>
        <div class="slow-topic-copy"><p>${lead}</p></div>
      </article>`).join('')}
    </div>
    <div class="slow-requirements"><button class="button button-quiet" type="button" data-action="open-smoothing" aria-haspopup="dialog" aria-controls="smoothing-dialog">실제 학자금 대출 상세 요건 알아보기 ${icon('arrow')}</button></div>
  </section>`;
}

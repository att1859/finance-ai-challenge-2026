import { icon } from '../shared/icon.js';

export function renderSmoothingExplainer() {
  return `
    <dialog
      class="smoothing-dialog"
      id="smoothing-dialog"
      aria-labelledby="smoothing-dialog-title"
      aria-describedby="smoothing-dialog-intro"
    >
      <div class="smoothing-dialog-frame">
        <header class="smoothing-dialog-header">
          <h2 id="smoothing-dialog-title">대출까지 써도 괜찮을까요?</h2>
          <button
            class="dialog-close"
            type="button"
            data-action="close-smoothing"
            aria-label="소비평탄화 설명 닫기"
          >${icon('close')}</button>
        </header>

        <div class="smoothing-dialog-body">
          <p class="smoothing-intro" id="smoothing-dialog-intro">
            이 서비스는 무조건 대출을 권하지 않습니다. 지금의 시간과 생활,
            취업 후의 상환 부담을 함께 비교해 나에게 덜 무리한 선택을 찾도록 도와드려요.
          </p>

          <section class="explainer-section" aria-labelledby="smoothing-why-title">
            <h3 id="smoothing-why-title">왜 소비를 평탄하게 하나요?</h3>
            <p class="explainer-lead">
              <strong>학생 때의 10만 원과 취업 후의 10만 원은 무게가 다릅니다.</strong>
              학생 때는 소득은 적지만 공부와 취업 준비에 쓸 시간이 중요해요.
              소비평탄화는 돈과 시간이 더 필요한 지금, 미래 소득의 일부를 먼저 사용해
              현재와 미래의 생활 격차를 줄이는 방법입니다.
            </p>
            <div class="choice-comparison">
              <article>
                <h4>대출 없이 생활하기</h4>
                <p>지금 더 오래 일하거나 필요한 소비를 미래로 미룹니다. 빚은 없지만 공부와 취업 준비에 쓸 시간이 줄어들 수 있어요.</p>
              </article>
              <article>
                <h4>미래 소득을 일부 당겨 쓰기</h4>
                <p>필요한 만큼만 빌려 지금 사용하고, 소득이 생긴 취업 후에 나누어 갚습니다. 지금의 시간을 확보하는 대신 미래의 상환 부담이 생겨요.</p>
              </article>
            </div>
          </section>

          <section class="explainer-section" aria-labelledby="smoothing-rate-title">
            <h3 id="smoothing-rate-title">연 1.7%는 얼마나 낮은 금리인가요?</h3>
            <p>1,000만 원을 연 1.7%로 빌리면 단순 계산한 1년 이자는 약 17만 원입니다.</p>
            <dl class="rate-ledger" aria-label="1천만 원의 대출 이자와 예금 이자 비교">
              <div>
                <dt>연 1.7% 대출이자</dt>
                <dd>약 17만 원 <small>1년 단순 계산</small></dd>
              </div>
              <div>
                <dt>연 3% 예금이자</dt>
                <dd>약 30만 원 <small>1년·세전 기준</small></dd>
              </div>
            </dl>
            <p class="rate-conclusion">
              같은 금액을 연 3% 예금에 넣었을 때 생기는 이자보다도 대출이자가 작습니다.
              그만큼 연 1.7%는 돈을 빌리는 비용이 낮다는 뜻이에요.
            </p>
            <aside class="explainer-caution" role="note">
              ${icon('info')}
              <p><strong>대출받아 예금하라는 의미는 아니에요.</strong> 예금이자에는 세금이 적용되며 상품별 금리, 대출 조건과 사용 목적에 따라 결과가 달라질 수 있습니다. 낮은 금리의 크기를 이해하기 위한 단순 비교입니다.</p>
            </aside>

            <div class="inflation-explainer">
              <h4>물가까지 고려하면 부담은 어떻게 달라질까요?</h4>
              <p>
                2026년 7월 소비자물가 상승률 2.8%가 대출금리 1.7%보다 높다면,
                구매력을 고려한 실질적인 금리 부담은 약 -1.1%입니다.
                갚아야 할 금액이 줄어드는 것은 아니지만, 미래의 돈 가치로 보면
                상대적으로 가치가 낮아진 돈으로 갚는 구조예요.
              </p>
              <div class="real-rate-equation" aria-label="1.7퍼센트에서 2.8퍼센트를 빼면 약 마이너스 1.1퍼센트">
                <span>대출금리 <b>1.7%</b></span>
                <i aria-hidden="true">−</i>
                <span>물가상승률 <b>2.8%</b></span>
                <i aria-hidden="true">≈</i>
                <strong>실질금리 -1.1%</strong>
              </div>
              <details class="fisher-details">
                <summary>피셔 방정식으로 계산 원리 보기 ${icon('chevron')}</summary>
                <div>
                  <p><b>간단한 계산</b><br>실질금리 ≈ 대출금리 − 물가상승률 = 1.7% − 2.8% ≈ -1.1%</p>
                  <p><b>정확한 계산</b><br>(1.017 ÷ 1.028) − 1 ≈ -1.07%</p>
                </div>
              </details>
              <p class="explainer-source-note">
                2.8%는 2026년 7월의 전년 동월 대비 소비자물가 상승률입니다.
                미래에도 같은 물가상승률이 유지되거나 소득이 함께 오른다는 보장은 없으며,
                이 서비스의 계획 계산에는 물가 변화를 반영하지 않습니다.
                <a href="https://www.kostat.go.kr/index.es?sid=b7" target="_blank" rel="noreferrer">
                  국가데이터처 출처 보기 ${icon('external')}
                </a>
              </p>
            </div>
          </section>

          <section class="explainer-section" aria-labelledby="smoothing-loan-title">
            <h3 id="smoothing-loan-title">그렇다면 대출은 나쁜 게 아닌가요?</h3>
            <p><strong>대출은 그 자체로 좋거나 나쁜 것이 아니라, 조건에 따라 달라지는 도구입니다.</strong></p>
            <div class="loan-condition-comparison">
              <div>
                <h4>합리적인 선택이 될 수 있어요</h4>
                <ul>
                  <li>금리가 충분히 낮을 때</li>
                  <li>필요한 금액만 이용할 때</li>
                  <li>상환할 수 있는 미래 소득이 있을 때</li>
                  <li>학업과 취업 준비 시간을 확보할 수 있을 때</li>
                </ul>
              </div>
              <div>
                <h4>위험한 선택이 될 수 있어요</h4>
                <ul>
                  <li>금리가 높을 때</li>
                  <li>반복적인 과소비를 위해 이용할 때</li>
                  <li>상환 능력을 넘는 금액을 빌릴 때</li>
                  <li>사용 목적과 상환 계획이 불분명할 때</li>
                </ul>
              </div>
            </div>
          </section>

          <section class="explainer-section ai-balance-explainer" aria-labelledby="smoothing-ai-title">
            <h3 id="smoothing-ai-title">AI가 찾는 것은 ‘가장 많은 대출’이 아닙니다.</h3>
            <p>
              지금의 근로시간과 소비, 필요한 대출금, 취업 후 상환액과 소비 여력을 함께 비교합니다.
              목표는 대출을 늘리는 것이 아니라 현재와 미래 어느 한쪽에도 부담이 지나치게 몰리지 않는
              선택지를 보여주는 것입니다. 최종 결정은 사용자가 합니다.
            </p>
          </section>
        </div>

        <footer class="smoothing-dialog-actions">
          <a class="button button-primary button-large" href="#diagnosis" data-action="close-smoothing">
            이해했어요, 내 상황 비교하기 ${icon('arrow')}
          </a>
        </footer>
      </div>
    </dialog>`;
}

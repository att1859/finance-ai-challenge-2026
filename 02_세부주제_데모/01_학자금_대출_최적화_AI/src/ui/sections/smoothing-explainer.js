import { icon } from '../shared/icon.js';
import { LOAN_POLICY_SNAPSHOT as policy } from '../../policies/loans/2026-2.js';

const generalUrl = 'https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_02_01';
const iclUrl = 'https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_01_01';
const sourceLink = (url, label) => `<a class="tuition-source" href="${url}" target="_blank" rel="noreferrer">${label} ${icon('external')}</a>`;
const facts = (rows) => `<dl class="tuition-facts">${rows.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>`;

// Keep the existing native-dialog event contract and focus restoration.
export function renderSmoothingExplainer() {
  return `<dialog class="smoothing-dialog" id="smoothing-dialog" aria-labelledby="smoothing-dialog-title" aria-describedby="smoothing-dialog-intro">
    <div class="smoothing-dialog-frame">
      <header class="smoothing-dialog-header">
        <h2 id="smoothing-dialog-title">등록금 대출 상세 요건</h2>
        <button class="dialog-close" type="button" data-action="close-smoothing" aria-label="등록금 대출 상세 요건 닫기">${icon('close')}</button>
      </header>
      <div class="smoothing-dialog-body">
        <p class="smoothing-intro" id="smoothing-dialog-intro">2026년 2학기 기준 · 공식 안내 확인일 2026.09.06<br>한국장학재단의 등록금 대출 요건을 요약했습니다. 실제 신청에는 소속 대학·학적·예외 조건과 재단 심사가 적용됩니다.</p>
        <section class="explainer-section" aria-labelledby="tuition-common">
          <h3 id="tuition-common">등록금으로 빌릴 수 있는 금액</h3>
          ${facts([
            ['사용 범위', '대학이 고지한 등록금 범위에서 대학 수납계좌로 지급됩니다. 학생회비 등 선택경비는 가능하지만 기숙사비·졸업앨범비 등 생활비 성격의 비용은 제외됩니다.'],
            ['부분 대출', '자기자금과 대출을 합해 등록금을 납부할 수 있습니다. 등록금 대출은 10만 원 이상이며 분할 납부 연계 대출도 회차별 10만 원 이상입니다.'],
            ['공통 확인', '지원 대상 대학·국적·학적 요건을 충족해야 합니다. 중복지원, 부실자료, 미상환 등록금 차액, 금융거래 안심차단 등은 대출 제한 사유가 될 수 있습니다.'],
          ])}
          ${sourceLink(generalUrl, '대출 범위 공식 안내')}
        </section>
        <section class="explainer-section" aria-labelledby="tuition-general">
          <h3 id="tuition-general">일반 상환 등록금 대출</h3>
          ${facts([
            ['금리', `연 ${policy.products.general.interest.annualRate}% · 고정금리`],
            ['나이·소득', '신청일 기준 만 55세 이하, 학자금 지원구간 제한 없음. 만 55세 이전 입학 후 중단 없이 학업을 지속한 경우 등에는 만 59세까지 허용됩니다.'],
            ['성적·학점', '재학생은 직전학기 70/100점 이상·12학점 이상이 원칙입니다. 대학의 최소 이수학점 규정이 적용될 수 있습니다. 신입생군·장애인은 두 기준, 졸업학년 학부생·대학원생은 이수학점 기준 적용이 제외됩니다.'],
            ['총한도', '대출잔액 기준: 일반 대학·전문대 4천만 원, 5·6년제 6천만 원, 의·치·한의계열 9천만 원. 대학원은 과정에 따라 6천만~1억 2천만 원입니다.'],
            ['상환', '거치기간에는 이자를 납부하고, 상환기간에는 원금균등 또는 원리금균등 방식으로 갚습니다. 취업 여부와 무관하게 약정 일정이 적용됩니다.'],
          ])}
          ${sourceLink(generalUrl + '&ttab1=1', '일반 상환 신청 자격 원문')}
        </section>
        <section class="explainer-section" aria-labelledby="tuition-icl">
          <h3 id="tuition-icl">취업 후 상환 등록금 대출</h3>
          ${facts([
            ['금리', `연 ${policy.products.incomeContingent.interest.annualRate}% · 변동금리`],
            ['나이·소득', '학부생 만 35세 이하, 대학원생 만 40세 이하. 등록금은 학자금 지원구간 제한이 없습니다. 일정 학위과정의 재직자 등은 만 45세까지 허용되는 예외가 있습니다.'],
            ['성적·학점', '재학생은 백분위 성적과 무관하며 직전학기 12학점 이상이 원칙입니다. 대학 학사규정에 따른 예외가 있습니다. 신입생군·장애인·졸업학년 학부생·대학원생은 이수학점 기준 적용이 제외됩니다.'],
            ['총한도', '학부 등록금 총한도 제한은 없으나 해당 학기 등록금 범위 내에서만 가능합니다. 전문기술석사·일반 및 특수대학원 석사 6천만 원, 박사 9천만 원, 전문대학원 등은 석사 9천만 원·박사 1억 2천만 원입니다. 기존 등록금 대출잔액을 포함해 한도를 적용합니다.'],
            ['상환', '연간 소득금액이 상환기준소득을 넘거나 상속·증여재산이 발생하면 의무상환 대상이 될 수 있습니다. 자발적 상환도 가능합니다. 취업 전이라는 이유만으로 이자가 모두 면제되는 것은 아닙니다.'],
          ])}
          ${sourceLink(iclUrl + '&ttab1=1', '취업 후 상환 신청 자격 원문')}
          ${sourceLink(iclUrl, '상환 방식·이자면제 공식 안내')}
        </section>
        <section class="explainer-section" aria-labelledby="tuition-support">
          <h3 id="tuition-support">장학금·지원금과 신청 일정</h3>
          <p>장학금 등 다른 등록금 지원을 받는 경우 중복지원 여부와 대출 가능액을 함께 확인해야 합니다. 중복지원 제한 사유는 해소 전까지 신청·실행에 영향을 줄 수 있습니다.</p>
          <p>2026년 2학기 신청은 11월 17일 18시까지, 실행은 11월 18일 17시까지입니다. 등록금 대출 실행은 대학·은행의 수납기간과 시간 안에 해야 하며 주말·공휴일에는 실행할 수 없습니다.</p>
          <p>생활비 대출은 별도 용도이며 지원구간 등 자격이 등록금 대출과 다를 수 있습니다.</p>
          ${sourceLink(generalUrl, '한국장학재단 일정·등록금 안내')}
        </section>
      </div>
      <footer class="smoothing-dialog-actions"><button class="button button-quiet" type="button" data-action="close-smoothing">닫기</button></footer>
    </div>
  </dialog>`;
}

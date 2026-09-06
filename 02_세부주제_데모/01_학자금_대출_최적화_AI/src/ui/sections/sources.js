import { GENERAL_LOAN_POLICY, INCOME_CONTINGENT_POLICY } from '../../policies/loans/2026.js';
import { icon } from '../shared/icon.js';

export function renderSources() {
  return `<section class="sources-section" id="sources" aria-labelledby="sources-title"><div class="section-heading compact"><h3 id="sources-title">계산 기준과 공식 정보를 확인하세요.</h3></div><div class="source-grid">
    <article><span>공식 정보</span><h4>취업 후 상환 학자금대출</h4><p>상환기준소득과 의무상환 방식은 공식 안내를 기준으로 확인했습니다.</p><small>기준연도 ${INCOME_CONTINGENT_POLICY.basisYear} · 최종 확인 ${INCOME_CONTINGENT_POLICY.checkedAt}</small><a href="${INCOME_CONTINGENT_POLICY.officialUrl}" target="_blank" rel="noreferrer">한국장학재단 공식 안내 ${icon('external')}</a></article>
    <article><span>공식 정보</span><h4>일반 상환 학자금대출</h4><p>원금과 이자를 합친 월 납입액이 일정한 원리금균등 방식으로 비교합니다. 금리는 아래 확인일의 공식 기준을 사용했습니다.</p><small>최종 확인 ${GENERAL_LOAN_POLICY.checkedAt}</small><a href="${GENERAL_LOAN_POLICY.officialUrl}" target="_blank" rel="noreferrer">한국장학재단 공식 안내 ${icon('external')}</a></article>
    <article class="assumption"><span>계산 가정</span><h4>이 결과에 포함하지 않은 것</h4><p>추가 알바 시간은 2026년 최저시급 10,320원으로만 단순 환산합니다. 주휴수당과 실제 세금·보험료, 연장·야간·휴일근로 가산수당, 자발적 중도상환과 실제 심사 결과는 반영하지 않았습니다.</p><small><a href="https://www.minimumwage.go.kr/minWage/policy/decisionMain.do" target="_blank" rel="noreferrer">최저임금위원회 기준</a> · 입력한 정보로 계산한 계획용 결과입니다. 신청 전 공식 안내에서 본인에게 적용되는 조건을 확인하세요.</small></article>
  </div><div class="engine-boundary"><strong>내 정보는 어떻게 쓰이나요?</strong><p>입력값과 결과는 브라우저 세션에서만 사용하고 서버에 저장하지 않습니다. 금융계좌나 실제 대출내역을 자동으로 불러오지 않습니다.</p></div></section>`;
}

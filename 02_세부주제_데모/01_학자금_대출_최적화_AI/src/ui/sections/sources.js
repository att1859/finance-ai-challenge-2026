import { GENERAL_LOAN_POLICY, INCOME_CONTINGENT_POLICY } from '../../policies/loans/2026.js';
import { icon } from '../shared/icon.js';

export function renderSources() {
  return `<section class="sources-section" id="sources" aria-labelledby="sources-title"><div class="section-heading compact"><h3 id="sources-title">계산 기준과 공식 정보를 확인하세요.</h3></div><div class="source-grid">
    <article><span>공식 정보</span><h4>취업 후 상환 학자금대출</h4><p>상환기준소득과 의무상환 방식은 공식 안내를 기준으로 확인했습니다.</p><small>기준연도 ${INCOME_CONTINGENT_POLICY.basisYear} · 최종 확인 ${INCOME_CONTINGENT_POLICY.checkedAt}</small><a href="${INCOME_CONTINGENT_POLICY.officialUrl}" target="_blank" rel="noreferrer">한국장학재단 공식 안내 ${icon('external')}</a></article>
    <article><span>공식 정보</span><h4>일반 상환 학자금대출</h4><p>공식 상환방식 중 원리금균등과 정책 스냅샷의 금리를 비교 기준으로 사용했습니다.</p><small>최종 확인 ${GENERAL_LOAN_POLICY.checkedAt}</small><a href="${GENERAL_LOAN_POLICY.officialUrl}" target="_blank" rel="noreferrer">한국장학재단 공식 안내 ${icon('external')}</a></article>
    <article class="assumption"><span>계산 가정</span><h4>이 결과에 포함하지 않은 것</h4><p>선택한 간편 차감률은 반영하지만 실제 세금·보험료, 연장·야간·휴일근로 가산수당, 물가 변화, 자발적 중도상환, 실제 심사 결과는 계산하지 않았습니다. 소득과 정책 스냅샷의 금리는 현재 값이 유지된다고 가정합니다.</p><small>실제 금융정보를 연결하려면 인가된 마이데이터 사업자 또는 금융회사 API 제휴가 필요합니다.</small></article>
  </div><div class="engine-boundary"><strong>결과가 만들어지는 방식</strong><p>입력한 학비·생활비·근로·대출 조건을 계산식으로 비교합니다. 자동 설명은 대출 자격이나 승인을 확정하지 않습니다.</p></div></section>`;
}

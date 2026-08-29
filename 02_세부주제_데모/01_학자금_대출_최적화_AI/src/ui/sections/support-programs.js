import { visibleSupportPrograms } from '../../app/selectors.js';
import { PROGRAM_STATUSES } from '../../domain/support-programs/statuses.js';
import { formatMoney } from '../formatters/money.js';
import { icon } from '../shared/icon.js';

export function renderSupportPrograms(state, programs, summary) {
  const visible = visibleSupportPrograms(state);
  return `<section class="support-program-section" aria-labelledby="support-program-title"><div class="support-program-intro"><div><h3 id="support-program-title">신청 가능성을 확인할 지원사업이 ${summary.candidatePrograms.length}개 있어요.</h3><p>후보 금액은 기본 계산에서 차감하지 않습니다. 수혜가 확정되면 입력 화면의 확정 지원금에 직접 반영해 주세요.</p></div><button class="button button-outline" type="button" data-action="catalog" aria-expanded="${state.ui.catalogOpen}">전체 지원사업 보기 <span>${programs.length}</span> ${icon('chevron')}</button></div>
    <div class="status-summary" aria-label="지원사업 상태별 개수">${PROGRAM_STATUSES.map((status)=>`<span><i></i>${status}<b>${summary.counts[status]}</b></span>`).join('')}</div>
    ${state.ui.catalogOpen?`<div class="catalog"><div class="catalog-filters" role="group" aria-label="상태 필터">${['전체',...PROGRAM_STATUSES].map((item)=>`<button type="button" data-filter="${item}" class="${state.ui.catalogFilter===item?'is-active':''}">${item}</button>`).join('')}</div><div class="program-list">${visible.length?visible.map(renderProgram).join(''):'<p class="empty-state">이 상태의 지원사업이 없습니다.</p>'}</div><p class="catalog-boundary">이 목록은 국내 학부 재학생용 대표 규칙과 화면 동작을 확인하기 위한 범위입니다. 해당 학기 전체 공고는 한국장학재단 공식 페이지에서 다시 확인해 주세요.</p></div>`:''}
  </section>`;
}

function renderProgram(item) {
  return `<article class="program"><div><span class="status status-${PROGRAM_STATUSES.indexOf(item.status)}">${item.status}</span><p>${item.institution} · ${item.semester}</p><h4>${item.name}</h4><small>${item.kind}</small></div><div><p>${item.reason}</p><strong>${item.estimatedSemesterAmount!=null?`후보 금액 ${formatMoney(item.estimatedSemesterAmount)} · 계산 미반영`:'금액 미확인 · 계산 미반영'}</strong><span>최종 확인일 ${item.checkedAt}</span><a href="${item.officialUrl}" target="_blank" rel="noreferrer">공식 원문 ${icon('external')}</a></div></article>`;
}

import { buildScenarioComparison, scenarioById } from '../../app/selectors.js';
import { formatMoney, signedMoney } from '../formatters/money.js';

const formatHours = (value) => Number(value).toLocaleString('ko-KR', {
  maximumFractionDigits: 1,
});

const reductionCopy = (scenario) => scenario.workHoursReduced === 0
  ? '현재 근로시간 유지'
  : `현재보다 ${formatHours(scenario.workHoursReduced)}시간 감소`;

export function renderScenarioSelector(state) {
  return `<fieldset class="scenario-selector"><legend>비교할 계획을 선택하세요.</legend><div class="scenario-options">${state.currentScenarios.map((scenario) => `
    <label class="scenario-option ${scenario.id === state.selectedScenarioId ? 'is-selected' : ''}">
      <input type="radio" name="scenario" value="${scenario.id}" ${scenario.id===state.selectedScenarioId?'checked':''}>
      <span class="scenario-radio" aria-hidden="true"></span>
      <span class="scenario-option-copy"><span class="scenario-label-line"><strong>${scenario.name}</strong>${scenario.defaultView?'<em>기본 보기</em>':''}${scenario.id===state.selectedScenarioId?'<b>내 선택</b>':''}</span><small>${scenario.summary}</small><span class="scenario-work-summary">주당 ${formatHours(scenario.workHours)}시간 · ${reductionCopy(scenario)}</span></span>
    </label>`).join('')}</div></fieldset>`;
}

export function renderComparisonFigure(state, current) {
  const rows = buildScenarioComparison(state);
  return `<figure class="comparison-figure" aria-labelledby="comparison-title">
    <figcaption><div><h3 id="comparison-title">지금의 시간과 미래의 부담을 같은 자리에서 보세요.</h3></div><p>막대 길이는 각 지표 안에서만 비교하세요. 단위가 서로 다릅니다.</p></figcaption>
    <div class="scenario-key" aria-hidden="true">${state.currentScenarios.map((s)=>`<span class="${s.id===current.id?'is-selected':''}"><i></i>${s.name}${s.id===current.id?'<b>내 선택</b>':''}</span>`).join('')}</div>
    <div class="metric-chart" aria-hidden="true">${rows.map((row) => renderMetricRow(state, row, current)).join('')}</div>
    ${renderAccessibleTable(state, rows)}
  </figure>`;
}

function renderMetricRow(state, row, current) {
  const finiteValues = row.values.map((item)=>item.value).filter(Number.isFinite);
  const max = Math.max(1, row.reference || 0, ...finiteValues.map((v)=>Math.max(0,v))) * 1.12;
  const marker = (value, label) => value == null ? '' : `<span class="reference-marker" style="--left:${Math.min(98,Math.max(0,value/max*100))}%"><b>${label}</b></span>`;
  return `<section class="metric-row"><div class="metric-heading"><h4>${row.label}</h4><span>${row.unit}</span></div><div class="metric-bars">${marker(row.reference,row.referenceLabel)}${row.values.map((item)=>{
    const scenario = scenarioById(state, item.id);
    if (!Number.isFinite(item.value)) return `<div class="bar-line boundary"><span>${scenario.name}</span><strong>계산 불가</strong></div>`;
    if (item.value < 0) return `<div class="bar-line boundary"><span>${scenario.name}</span><strong>${signedMoney(item.value)} · 부족</strong></div>`;
    const width = Math.max(item.value===0?0:2,Math.min(100,item.value/max*100));
    return `<div class="bar-line ${item.id===current.id?'is-selected':''}"><span>${scenario.name}</span><i style="--width:${width}%"></i><strong>${row.id==='work'?`${formatHours(item.value)}시간`:`${formatMoney(item.value,{digits:1})}`}${item.id===current.id?'<em>내 선택</em>':''}</strong></div>`;
  }).join('')}</div></section>`;
}

function renderAccessibleTable(state, rows) {
  return `<div class="table-wrap"><table><caption>세 시나리오 지표 비교표</caption><thead><tr><th scope="col">지표</th>${state.currentScenarios.map((s)=>`<th scope="col">${s.name}${s.id===state.selectedScenarioId?' (내 선택)':''}</th>`).join('')}<th scope="col">사용자 기준</th></tr></thead><tbody>${rows.map((row)=>`<tr><th scope="row">${row.label}<small>${row.unit}</small></th>${row.values.map((item)=>`<td>${Number.isFinite(item.value)?(row.id==='work'?`${formatHours(item.value)}시간`:`${formatMoney(item.value,{digits:1})}`):'계산 불가'}</td>`).join('')}<td>${row.id==='work'?`현재 ${formatHours(row.reference)}시간`:`희망 ${formatMoney(row.reference)}`}</td></tr>`).join('')}</tbody></table></div>`;
}

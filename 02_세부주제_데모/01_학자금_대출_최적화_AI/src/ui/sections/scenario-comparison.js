import { selectableMonths, nearestMonth } from '../../app/chart-selection.js';
import { segmented, quietButton } from '../shared/seed-controls.js';
import { escapeHtml as safe } from '../shared/escape-html.js';
import { visibleScenarios } from '../../app/selectors.js';
import { renderStressControls } from './stress-controls.js';
export const METRICS = {
 living: { label: '월 생활비 여력', unit: '만 원/월', note: '희망 생활비 차감 전 금액. 재학 중 근로소득 + 학기 생활비 대출 월 배분액 − 상환부담, 취업 후 소득 − 상환부담입니다.' },
 repayment: { label: '상환 부담', unit: '만 원/월', note: '일반 상환은 해당 월 약정액, 취업 후 상환은 연간 예상액의 월평균 환산액이며 실제 월 청구액이 아닙니다.' },
 balance: { label: '남은 대출잔액', unit: '만 원', note: '월 시작 잔액. 취업 후 상환은 취업 이후 연간 결산 잔액을 다음 결산까지 유지합니다. 월별 확정 잔액이 아닙니다.' },
};
const styles = { 'minimum-loan': ['var(--navy)', ''], balance: ['var(--blue)', '9 5'], 'maximum-use': ['var(--rose)', '3 4'] };
const styleFor = id => styles[id] ?? ['var(--blue)', Number(id.split('-').at(-1)) % 2 ? '12 4 2 4' : '5 5'];
const val = v => Number.isFinite(v) ? v.toLocaleString('ko-KR', {minimumFractionDigits:1,maximumFractionDigits:1}) : '계산 불가';
const time = m => m === 0 ? '현재' : m < 12 ? `${m}개월 후` : `${Math.floor(m/12)}년${m%12 ? ` ${m%12}개월` : ''} 후`;
const pair = state => state.comparison.ids.map(id => visibleScenarios(state).find(s => s.id === id));
export function renderScenarioSelector(state) {
 return `<fieldset class="scenario-selector"><legend>선택한 시나리오 자세히 보기</legend><div class="scenario-options">${pair(state).map(s => `<label class="scenario-option ${s.id===state.selectedScenarioId?'is-selected':''}"><input type="radio" name="scenario" value="${s.id}" ${s.id===state.selectedScenarioId?'checked':''}><span class="scenario-option-copy"><strong>${safe(s.name)}</strong><small>${safe(s.summary)}</small><span>주당 ${s.workHours}시간 · 현재보다 ${Math.abs(s.workHoursReduced)}시간 ${s.workHoursReduced < 0 ? '증가' : '감소'}</span></span></label>`).join('')}</div></fieldset>`;
}
export function renderPointReadout(state) {
 const ss=pair(state), {month,metric}=state.comparison, vs=ss.map(s=>s.timeline.rows[month]?.[metric]);
 const d=vs.every(Number.isFinite)?vs[0]-vs[1]:null;
 return `<strong>${time(month)} · ${METRICS[metric].unit}</strong><div>${ss.map((s,i)=>`<span>${i?'B':'A'} · ${safe(s.name)}: <b>${val(vs[i])}</b></span>`).join('')}<span>A − B: <b>${d>0?'+':''}${val(d)}</b>${d===0?' · 두 값이 같습니다':''}</span></div>`;
}
export function renderComparisonFigure(state) {
 state.comparison.month = nearestMonth(selectableMonths(state), state.comparison.month);
 const ss=pair(state), {ids,metric,month}=state.comparison, info=METRICS[metric], end=ss[0].timeline.endMonth;
 const values=[...state.baselineScenarios,...state.currentScenarios].filter(s=>ids.includes(s.id)).flatMap(s=>s.timeline.rows.map(r=>r[metric])).filter(Number.isFinite);
 const min=Math.min(0,...values), max=Math.max(1,...values), pad=(max-min)*.08, low=min<0?min-pad:0, high=max+pad;
 const x=m=>95+m/end*765, y=v=>295-(v-low)/(high-low)*225;
 const lines=ss.map(s=>{
  let connected=false;
  const d=s.timeline.rows.map(r=>{if(!Number.isFinite(r[metric])){connected=false;return '';}const cmd=connected?'L':'M';connected=true;return `${cmd}${x(r.month).toFixed(2)},${y(r[metric]).toFixed(2)}`;}).join(' ');
  const [color,dash]=styleFor(s.id);
  return `<path class="scenario-line" data-scenario="${s.id}" d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="${dash}"/>${s.timeline.rows.filter(r=>selectableMonths(state).includes(r.month)&&Number.isFinite(r[metric])).map(r=>`<circle cx="${x(r.month)}" cy="${y(r[metric])}" r="3" fill="${color}"/>`).join('')}`;
 }).join('');
 const events=new Map();
 for(const [m,label] of [[ss[0].timeline.graduationMonth,'졸업'],[ss[0].timeline.employmentMonth,'취업']]) events.set(m,[...(events.get(m)??[]),label]);
 const eventSvg=[...events].map(([m,labels],i)=>`<line x1="${x(m)}" x2="${x(m)}" y1="60" y2="295" stroke="var(--line-strong)" stroke-dasharray="4 4"/><text class="timeline-event-label" x="${x(m)}" y="${22+i*32}" text-anchor="middle">${labels.join('·')} · ${m}개월</text>`).join('');
 const condition=state.comparison.view==='baseline'?'기본 조건':`변경 조건 · 취업 ${state.stress.employmentDelayMonths}개월 지연 · 초봉 ${state.stress.salaryReductionRate*100}% 감소${state.stress.graduationDelayMonths?' · 졸업 1년 지연':''}`;
 return `<figure class="comparison-figure seed-surface" aria-labelledby="comparison-title"><figcaption><h3 id="comparison-title">시간에 따른 두 시나리오 비교</h3></figcaption>
 <div class="comparison-controls">${ids.map((id,side)=>`<label class="field"><span>비교할 시나리오 ${side?'B':'A'}</span><select name="comparison-${side}">${state.currentScenarios.map(s=>`<option value="${s.id}" ${s.id===id?'selected':''} ${s.id===ids[1-side]?'disabled':''}>${safe(s.name)}</option>`).join('')}</select></label>`).join('')}<button type="button" class="${quietButton}" data-action="add-custom">+ 내 시나리오 추가</button></div>
 ${renderStressControls(state)}<div class="chart-toolbar"><strong>${info.label}</strong>${segmented('comparison-metric','표시 지표',Object.entries(METRICS).map(([value,m])=>[value,m.label]),metric)}</div><p class="chart-condition">${condition} · ${info.unit}</p><p id="metric-note">${info.note}</p>
 <details class="chart-assumptions"><summary>계산 기준</summary><p class="timeline-boundary">재학 생활비 대출은 학기 금액을 해당 학기 개월에 배분합니다. 취업 지연 중 소득·추가 차입은 0이며 생활비 충족을 뜻하지 않습니다. 일반 상환 약정은 유지됩니다. 취업 후 상환이 포함된 생활비 여력도 월평균 환산액 기준입니다.</p></details>
 <div class="timeline-key">${ss.map((s,i)=>`<span><svg width="40" height="12" viewBox="0 0 40 12" aria-hidden="true"><line x1="0" x2="40" y1="6" y2="6" stroke="${styleFor(s.id)[0]}" stroke-width="3" stroke-dasharray="${styleFor(s.id)[1]}"/></svg>${i?'B':'A'} · ${safe(s.name)}</span>`).join('')}</div>
 <svg class="timeline-chart" tabindex="0" data-end="${end}" data-left="95" data-span="765" data-low="${low}" data-high="${high}" viewBox="0 0 920 345" role="img" aria-label="${info.label} 시간축 그래프. 점을 클릭하거나 좌우 방향키로 조회 시점을 고정하세요." aria-describedby="metric-note">
 ${Array.from({length:5},(_,i)=>{const v=low+(high-low)*i/4;return `<line x1="75" x2="880" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text class="axis-value" x="65" y="${y(v)+5}" text-anchor="end">${Math.round(v)}</text>`;}).join('')}
 ${low<0?`<line x1="75" x2="880" y1="${y(0)}" y2="${y(0)}" stroke="var(--ink)"/>`:''}${eventSvg}${lines}
 ${ss.map(s=>`<circle class="timeline-point" data-scenario="${s.id}" cx="${x(month)}" cy="${Number.isFinite(s.timeline.rows[month]?.[metric])?y(s.timeline.rows[month][metric]):0}" r="6" fill="${styleFor(s.id)[0]}" stroke="var(--white)" stroke-width="2" ${Number.isFinite(s.timeline.rows[month]?.[metric])?'':'visibility="hidden"'}/>`).join('')}
 <line id="timeline-cursor" x1="${x(month)}" x2="${x(month)}" y1="60" y2="295" stroke="var(--ink)"/>
 ${Array.from(new Set([0,...Array.from({length:Math.floor(end/24)},(_,i)=>(i+1)*24),end])).map(m=>{return `<text class="axis-time ${m !== 0 && m !== end && m % 96 !== 0 ? 'compact-hide' : ''}" x="${x(m)}" y="325" text-anchor="middle">${m===0?'현재':`${Number((m/12).toFixed(1))}년 후`}</text>`;}).join('')}</svg>
 <div class="point-navigation"><button type="button" class="${quietButton}" data-month-step="-1" aria-label="이전 조회 시점">← 이전</button><span>점을 클릭하면 조회 시점이 고정됩니다</span><button type="button" class="${quietButton}" data-month-step="1" aria-label="다음 조회 시점">다음 →</button></div>
 <output id="timeline-readout" class="timeline-readout" aria-live="polite">${renderPointReadout(state)}</output>
 <details class="timeline-table"><summary>표로 보기</summary><div class="table-wrap"><table><caption>${condition} · ${info.label} (${info.unit})</caption><thead><tr><th>시점</th>${ss.map(s=>`<th>${safe(s.name)}</th>`).join('')}<th>A − B</th></tr></thead><tbody>${ss[0].timeline.rows.map((r,i)=>{const a=r[metric],b=ss[1].timeline.rows[i][metric];return `<tr><th scope="row">${time(i)}</th><td>${val(a)}</td><td>${val(b)}</td><td>${val(Number.isFinite(a)&&Number.isFinite(b)?a-b:null)}</td></tr>`;}).join('')}</tbody></table></div></details></figure>`;
}

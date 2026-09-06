import { getLoanCompositionComponents } from '../../domain/loans/loan-composition.js';
import { chartAxis } from '../formatters/chart-axis.js';
import { selectableMonths, nearestMonth } from '../../app/chart-selection.js';
import { segmented, quietButton } from '../shared/seed-controls.js';
import { escapeHtml as safe } from '../shared/escape-html.js';
import { visibleScenarios } from '../../app/selectors.js';
import { renderStressControls } from './stress-controls.js';
export const METRICS = {
 living: { label: '대학 생활비', unit: '만 원/월', summaryKey: 'collegeLiving', note: '현재 월소득 + 생활비 대출의 월 배분액입니다. 이자·상환 차감 전이며 추가 알바 소득은 포함하지 않습니다.' },
 careerLiving: { label: '상환 후 월소득', unit: '만 원/월', summaryKey: 'careerLiving', note: '일반 상환은 원금 상환 시작과 취업 중 늦은 시점부터 12개월, 취업 후 상환만 있으면 취업 첫 12개월을 봅니다. 예상 월소득에서 해당 기간의 월평균 상환액을 뺍니다.' },
 repayment: { label: '상환 부담', unit: '만 원/월', note: '일반 상환은 해당 월 약정액, 취업 후 상환은 연간 예상액의 월평균 환산액입니다.' },
 balance: { label: '대출잔액', unit: '만 원', note: '월 시작 잔액. 취업 후 상환의 취업 이후 잔액은 연간 결산값을 유지합니다.' },
};

const chartLayout = () => globalThis.matchMedia?.('(max-width: 580px)').matches
 ? { bottom: 780, plotHeight: 710, height: 900, labelY: 845 }
 : { bottom: 410, plotHeight: 340, height: 470, labelY: 447 };
const styles = { 'minimum-loan': ['var(--navy)', ''], balance: ['var(--blue)', '9 5'], 'maximum-use': ['var(--rose)', '3 4'] };
const styleFor = id => styles[id] ?? ['var(--blue)', Number(id.split('-').at(-1)) % 2 ? '12 4 2 4' : '5 5'];
const val = v => Number.isFinite(v) ? v.toLocaleString('ko-KR', {minimumFractionDigits:1,maximumFractionDigits:1}) : '계산 불가';
const time = m => m === 0 ? '현재' : m < 12 ? `${m}개월 후` : `${Math.floor(m/12)}년${m%12 ? ` ${m%12}개월` : ''} 후`;
const pair = state => state.comparison.ids.map(id => visibleScenarios(state).find(s => s.id === id));
export function renderScenarioSelector(state) {
 return `<fieldset class="scenario-selector"><legend>선택한 시나리오 자세히 보기</legend><div class="scenario-options">${pair(state).map(s => `<label class="scenario-option ${s.id===state.selectedScenarioId?'is-selected':''}"><input type="radio" name="scenario" value="${s.id}" ${s.id===state.selectedScenarioId?'checked':''}><span class="scenario-option-copy"><strong>${safe(s.name)}</strong><small>${safe(s.summary)}</small><span>등록금 대출 ${val(s.tuitionFunding.principal)}만 원 · 생활비 월 ${val(s.livingLoan.principal / s.funding.fundingMonths)}만 원 · 추가 알바 ${Math.round(s.monthlyWorkHours)}시간/월</span></span></label>`).join('')}</div></fieldset>`;
}
export function renderPointReadout(state) {
 if (METRICS[state.comparison.metric].summaryKey) return renderBarReadout(state);
 const ss=pair(state), {month,metric}=state.comparison, vs=ss.map(s=>s.timeline.rows[month]?.[metric]);
 const d=vs.every(Number.isFinite)?vs[0]-vs[1]:null;
 return `<strong>${time(month)} · ${METRICS[metric].unit}</strong><div>${ss.map((s,i)=>`<span>${i?'B':'A'} · ${safe(s.name)}: <b>${val(vs[i])}</b></span>`).join('')}<span>A − B: <b>${d>0?'+':''}${val(d)}</b>${d===0?' · 두 값이 같습니다':''}</span></div>`;
}
export function renderComparisonFigure(state) {
 if (METRICS[state.comparison.metric].summaryKey) return renderBarComparison(state);
 state.comparison.month = nearestMonth(selectableMonths(state), state.comparison.month);
 const ss=pair(state), {ids,metric,month}=state.comparison, info=METRICS[metric], end=ss[0].timeline.endMonth;
 const values=[...state.baselineScenarios,...state.currentScenarios].filter(s=>ids.includes(s.id)).flatMap(s=>s.timeline.rows.map(r=>r[metric])).filter(Number.isFinite);
 const {low, high, ticks} = chartAxis(values);
 const layout=chartLayout();
 const x=m=>95+m/end*765, y=v=>layout.bottom-(v-low)/(high-low)*layout.plotHeight;
 const lines=ss.map(s=>{
  let connected=false;
  const d=s.timeline.rows.map(r=>{if(!Number.isFinite(r[metric])){connected=false;return '';}const cmd=connected?'L':'M';connected=true;return `${cmd}${x(r.month).toFixed(2)},${y(r[metric]).toFixed(2)}`;}).join(' ');
  const [color,dash]=styleFor(s.id);
  return `<path class="scenario-line" data-scenario="${s.id}" d="${d}" fill="none" stroke="${color}" stroke-width="3" stroke-dasharray="${dash}"/>${s.timeline.rows.filter(r=>selectableMonths(state).includes(r.month)&&Number.isFinite(r[metric])).map(r=>`<circle cx="${x(r.month)}" cy="${y(r[metric])}" r="3" fill="${color}"/>`).join('')}`;
 }).join('');
 const events=new Map();
 for(const [m,label] of [[ss[0].timeline.graduationMonth,'졸업'],[ss[0].timeline.employmentMonth,'취업']]) events.set(m,[...(events.get(m)??[]),label]);
 const eventSvg=[...events].map(([m,labels],i)=>`<line x1="${x(m)}" x2="${x(m)}" y1="60" y2="${layout.bottom}" stroke="var(--line-strong)" stroke-dasharray="4 4"/><text class="timeline-event-label" x="${x(m)}" y="${22+i*32}" text-anchor="middle">${labels.join('·')} · ${m}개월</text>`).join('');
 const condition=state.comparison.view==='baseline'?'기본 조건':`변경 조건 · 취업 ${state.stress.employmentDelayMonths}개월 지연 · 초봉 ${state.stress.salaryReductionRate*100}% 감소${state.stress.graduationDelayMonths?' · 졸업 1년 지연':''}`;
 return `<figure class="comparison-figure seed-surface" aria-labelledby="comparison-title"><figcaption><h3 id="comparison-title">시나리오 비교</h3></figcaption>
 <div class="comparison-controls">${ids.map((id,side)=>`<label class="field"><span>비교할 시나리오 ${side?'B':'A'}</span><select name="comparison-${side}">${state.currentScenarios.map(s=>`<option value="${s.id}" ${s.id===id?'selected':''} ${s.id===ids[1-side]?'disabled':''}>${safe(s.name)}</option>`).join('')}</select></label>`).join('')}<button type="button" class="${quietButton}" data-action="add-custom">+ 내 시나리오 추가</button></div>
 ${renderStressControls(state)}<div class="chart-toolbar"><strong>${info.label}</strong>${segmented('comparison-metric','표시 지표',Object.entries(METRICS).map(([value,m])=>[value,m.label]),metric)}</div><p class="chart-condition">${condition} · ${info.unit}</p><p id="metric-note">${info.note}</p>
 <details class="chart-assumptions"><summary>계산 기준</summary><p class="timeline-boundary">재학 생활비 대출은 학기 금액을 해당 학기 개월에 배분합니다. 취업 지연 중 소득·추가 차입은 0이며 생활비 충족을 뜻하지 않습니다. 일반 상환 약정은 유지됩니다. 취업 후 상환이 포함된 생활비 여력도 월평균 환산액 기준입니다.</p></details>
 <div class="timeline-key">${ss.map((s,i)=>`<span><svg width="40" height="12" viewBox="0 0 40 12" aria-hidden="true"><line x1="0" x2="40" y1="6" y2="6" stroke="${styleFor(s.id)[0]}" stroke-width="3" stroke-dasharray="${styleFor(s.id)[1]}"/></svg>${i?'B':'A'} · ${safe(s.name)}</span>`).join('')}</div>
 <svg class="timeline-chart" tabindex="0" data-end="${end}" data-left="95" data-span="765" data-low="${low}" data-high="${high}" data-bottom="${layout.bottom}" data-height="${layout.plotHeight}" viewBox="0 0 920 ${layout.height}" role="img" aria-label="${info.label} 시간축 그래프. 점을 클릭하거나 좌우 방향키로 조회 시점을 고정하세요." aria-describedby="metric-note">
 ${ticks.map(v=>{return `<line x1="75" x2="880" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text class="axis-value" x="65" y="${y(v)+5}" text-anchor="end">${v.toLocaleString('ko-KR', {maximumFractionDigits: 2})}</text>`;}).join('')}
 ${low<0?`<line x1="75" x2="880" y1="${y(0)}" y2="${y(0)}" stroke="var(--ink)"/>`:''}${eventSvg}${lines}
 ${ss.map(s=>`<circle class="timeline-point" data-scenario="${s.id}" cx="${x(month)}" cy="${Number.isFinite(s.timeline.rows[month]?.[metric])?y(s.timeline.rows[month][metric]):0}" r="6" fill="${styleFor(s.id)[0]}" stroke="var(--white)" stroke-width="2" ${Number.isFinite(s.timeline.rows[month]?.[metric])?'':'visibility="hidden"'}/>`).join('')}
 <line id="timeline-cursor" x1="${x(month)}" x2="${x(month)}" y1="60" y2="${layout.bottom}" stroke="var(--ink)"/>
 ${Array.from(new Set([0, Math.round(end/36)*12, Math.round(end/18)*12, end])).map(m=>{return `<text class="axis-time " x="${x(m)}" y="${layout.labelY}" text-anchor="middle">${m===0?'현재':`${Number((m/12).toFixed(1))}년 후`}</text>`;}).join('')}</svg>
 <div class="point-navigation"><button type="button" class="${quietButton}" data-month-step="-1" aria-label="이전 조회 시점">← 이전</button><span>점을 클릭하면 조회 시점이 고정됩니다</span><button type="button" class="${quietButton}" data-month-step="1" aria-label="다음 조회 시점">다음 →</button></div>
 <output id="timeline-readout" class="timeline-readout" aria-live="polite">${renderPointReadout(state)}</output>
 <details class="timeline-table"><summary>표로 보기</summary><div class="table-wrap"><table><caption>${condition} · ${info.label} (${info.unit})</caption><thead><tr><th>시점</th>${ss.map(s=>`<th>${safe(s.name)}</th>`).join('')}<th>A − B</th></tr></thead><tbody>${ss[0].timeline.rows.map((r,i)=>{const a=r[metric],b=ss[1].timeline.rows[i][metric];return `<tr><th scope="row">${time(i)}</th><td>${val(a)}</td><td>${val(b)}</td><td>${val(Number.isFinite(a)&&Number.isFinite(b)?a-b:null)}</td></tr>`;}).join('')}</tbody></table></div></details></figure>`;
}

function barEntries(state) {
 const info=METRICS[state.comparison.metric];
 const noLoan=(state.comparison.view === 'baseline' ? state.baselineNoLoanComparison : state.currentNoLoanComparison) ?? { collegeLiving: state.profile.currentMonthlyIncome ?? 0, careerLiving: state.profile.salary, monthlyHours: 0 };
 return [...pair(state).map((s,i)=>({id:s.id,name:`${i?'B':'A'} · ${s.name}`,value:s.timeline.summary[info.summaryKey]})), {id:'no-loan',name:'NO 대출',value:noLoan[info.summaryKey]}];
}
function renderBarReadout(state) {
 const entries=barEntries(state), college=state.comparison.metric==='living';
 const noLoan=state.comparison.view === 'baseline' ? state.baselineNoLoanComparison : state.currentNoLoanComparison;
 return `<strong>${college?'이번 학기 월평균 · 상환 차감 전':'상환 기준기간 월평균'} · 만 원/월</strong><div>${entries.map(e=>`<span>${safe(e.name)}: <b>${val(e.value)}</b></span>`).join('')}</div>${!college?`<div>${pair(state).map(s=>`<span>${safe(s.name)} · ${getLoanCompositionComponents(s.loanComposition).map(c=>`${c.purpose==='tuition'?'등록금':'생활비'} ${c.product==='general'?'일반 상환':'취업 후 상환'}`).join(' + ') || '신규 대출 없음'} · 현재부터 ${s.timeline.repaymentReferenceMonth}~${s.timeline.repaymentReferenceMonth+12}개월 · 월 상환 ${val(s.timeline.summary.careerRepayment)}만 원</span>`).join('')}</div><small>취업 후 상환은 소득이 같으면 초기 상환액도 같을 수 있습니다. 대출액 차이는 잔액과 상환 완료 시점에서 확인하세요. 연간액을 12로 나눈 값이며 실제 고정 월납입액은 아닙니다.</small>`:''}${college?`<div class="scenario-work-hours">${pair(state).map(s=>`<span>${safe(s.name)} · 생활비 부족 ${val(s.monthlyLivingGap)}만 원/월 · <b>추가 알바 월 약 ${Math.round(s.monthlyWorkHours)}시간</b></span>`).join('')}</div>`:''}${college&&noLoan?`<p class="no-loan-hours">NO 대출 · 생활비를 채우려면 <strong>추가 알바 월 약 ${Math.round(noLoan.monthlyHours)}시간</strong>이 필요해요.</p><p class="no-loan-tuition">${noLoan.tuitionGap>0?`NO 대출은 등록금 ${val(noLoan.tuitionGap)}만 원을 납부 전에 별도로 마련해야 합니다.`:'NO 대출도 등록금은 보유 자기자금으로 납부할 수 있습니다.'}</p><small>2026년 최저시급 10,320원 단순 환산 · 주휴수당·세금 제외 · 등록금은 분할 납부나 미래 알바로 충당한다고 가정하지 않습니다.</small>`:''}`;

}
function renderBarComparison(state) {
 const {ids,metric}=state.comparison, info=METRICS[metric], entries=barEntries(state);
 const college=metric==='living', target=state.profile.desiredCollegeSpend;
 const values=[...state.baselineScenarios,...state.currentScenarios].filter(s=>ids.includes(s.id)).map(s=>s.timeline.summary[info.summaryKey]);
 const {low,high,ticks}=chartAxis([...values,...entries.map(e=>e.value),...(college?[target]:[])]);
 const layout=chartLayout();
 const y=v=>layout.bottom-(v-low)/(high-low)*layout.plotHeight;
 return `<figure class="comparison-figure seed-surface" aria-labelledby="comparison-title"><figcaption><h3 id="comparison-title">시나리오 비교</h3></figcaption>
 <div class="comparison-controls">${ids.map((id,side)=>`<label class="field"><span>비교할 시나리오 ${side?'B':'A'}</span><select name="comparison-${side}">${state.currentScenarios.map(s=>`<option value="${s.id}" ${s.id===id?'selected':''} ${s.id===ids[1-side]?'disabled':''}>${safe(s.name)}</option>`).join('')}</select></label>`).join('')}<button type="button" class="${quietButton}" data-action="add-custom">+ 내 시나리오 추가</button></div>
 ${renderStressControls(state)}<div class="chart-toolbar"><strong>${info.label}</strong>${segmented('comparison-metric','표시 지표',Object.entries(METRICS).map(([value,m])=>[value,m.label]),metric)}</div><p class="chart-condition">${state.comparison.view==='baseline'?'기본 조건':'변경 조건'} · ${info.unit}</p><p id="metric-note">${info.note}</p>
 <details class="chart-assumptions"><summary>계산 기준</summary><p>NO 대출은 기존·신규 대출이 모두 없는 비교 기준입니다. 등록금 부족분은 납부 전에 별도로 마련해야 하며 월 알바 시간에는 포함하지 않습니다. 추가 알바를 했다고 가정해 막대를 높이지 않습니다. 다음 학기 신규 대출은 이 결과에 포함하지 않습니다.</p></details>
 <div class="timeline-key">${entries.map(e=>`<span>${safe(e.name)}</span>`).join('')}</div>
 <svg class="bar-chart" viewBox="0 0 920 ${layout.height}" role="img" aria-label="${info.label}, 선택한 두 시나리오와 NO 대출 막대 비교" aria-describedby="metric-note">
 ${ticks.map(v=>`<line x1="75" x2="880" y1="${y(v)}" y2="${y(v)}" stroke="var(--line)"/><text class="axis-value" x="65" y="${y(v)+5}" text-anchor="end">${v.toLocaleString('ko-KR',{maximumFractionDigits:2})}</text>`).join('')}
 <line x1="75" x2="880" y1="${y(0)}" y2="${y(0)}" stroke="var(--ink)"/>
 ${entries.map((e,i)=>Number.isFinite(e.value)?`<rect x="${180+i*255}" y="${Math.min(y(e.value),y(0))}" width="110" height="${Math.abs(y(e.value)-y(0))}" fill="${e.id==='no-loan'?'var(--muted)':styleFor(e.id)[0]}"/><text x="${235+i*255}" y="${e.value>=0?y(e.value)-12:y(e.value)+25}" text-anchor="middle">${val(e.value)}</text><text class="bar-label" x="${235+i*255}" y="${layout.labelY}" text-anchor="middle">${e.id==='no-loan'?'NO 대출':`${i?'B':'A'} · ${safe(pair(state)[i].name)}`}</text>`:`<text x="${235+i*255}" y="390" text-anchor="middle">계산 불가</text>`).join('')}
 ${college?`<line x1="75" x2="880" y1="${y(target)}" y2="${y(target)}" stroke="var(--blue)" stroke-width="2" stroke-dasharray="7 6"/><text x="875" y="${y(target)-12}" text-anchor="end">희망 ${val(target)}</text>`:''}</svg>
 <div class="point-navigation bar-navigation" aria-hidden="true"><span>각 안에 표시된 기준기간의 월평균 금액을 비교합니다</span></div><output class="timeline-readout" aria-live="polite">${renderBarReadout(state)}</output>
 <details class="timeline-table"><summary>표로 보기</summary><table><caption>${info.label} · ${info.unit}</caption><thead><tr><th>시나리오</th><th>금액</th></tr></thead><tbody>${entries.map(e=>`<tr><th>${safe(e.name)}</th><td>${val(e.value)}</td></tr>`).join('')}${college?`<tr><th>희망 생활비</th><td>${val(target)}</td></tr>`:''}</tbody></table></details></figure>`;
}

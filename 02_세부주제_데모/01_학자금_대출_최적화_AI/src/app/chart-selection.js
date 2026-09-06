export function selectableMonths(state) {
  const scenarios = [...state.baselineScenarios, ...state.currentScenarios].filter(s=>state.comparison.ids.includes(s.id));
  const end = scenarios[0].timeline.endMonth;
  const months = new Set([0,end]);
  scenarios.forEach(s => {
    for(let m=0;m<s.timeline.graduationMonth;m+=6) months.add(m);
    for(let m=s.timeline.graduationMonth;m<=end;m+=12) months.add(m);
    months.add(s.timeline.graduationMonth);
    months.add(s.timeline.employmentMonth);
    s.loan.componentRepaymentSchedules.forEach(component => {
      months.add(component.repaymentStartMonth);
      months.add(component.repaymentEndMonth);
    });
  });
  return [...months].filter(m=>Number.isFinite(m)&&m>=0&&m<=end).sort((a,b)=>a-b);
}
export function nearestMonth(months, month) {
  return months.reduce((best,value)=>Math.abs(value-month)<Math.abs(best-month)?value:best,months[0]);
}
export function moveSelectedMonth(months, month, direction) {
  const index = months.indexOf(nearestMonth(months,month));
  return months[Math.max(0,Math.min(months.length-1,index+direction))];
}

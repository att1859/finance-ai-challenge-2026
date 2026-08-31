export const SCENARIO_DEFINITIONS = Object.freeze([
  {
    id: 'focus',
    name: '학업시간 확보형',
    summary: '근로를 줄여 학업시간을 확보합니다.',
    workRatio: 0,
    loanShare: 1,
  },
  {
    id: 'balance',
    name: '균형형',
    summary: '근로와 대출을 함께 사용해 부담을 나눕니다.',
    workRatio: 0.5,
    loanShare: 0.7,
    defaultView: true,
  },
  {
    id: 'debt-min',
    name: '부채 최소형',
    summary: '현재 근로를 유지해 신규 대출을 줄입니다.',
    workRatio: 1,
    loanShare: 0,
  },
]);

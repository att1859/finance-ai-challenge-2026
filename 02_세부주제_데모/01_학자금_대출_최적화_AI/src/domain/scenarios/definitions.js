export const SCENARIO_DEFINITIONS = Object.freeze([
  {
    id: 'minimum-loan',
    name: '최소대출안',
    summary: '현재 근로시간을 유지하며 필요한 부족분만 빌립니다.',
    strategy: 'minimum-loan',
  },
  {
    id: 'balance',
    name: '균형안 v1',
    summary: '최대 근로시간 감소 효과의 절반을 대출로 확보합니다.',
    strategy: 'balance-v1',
    defaultView: true,
  },
  {
    id: 'maximum-use',
    name: '최대활용안',
    summary: '공식 한도 안에서 근로시간을 가장 많이 줄입니다.',
    strategy: 'maximum-use',
  },
]);

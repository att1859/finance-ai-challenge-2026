export const SCENARIO_DEFINITIONS = Object.freeze([
  { id: 'maximum-use', name: '현재 중시', summary: '등록금 전액과 생활비 대출 한도를 활용합니다.', strategy: 'maximum-use' },
  { id: 'balance', name: '균형', summary: '등록금은 최소·전액의 중간, 생활비는 희망액의 부족분을 빌립니다.', strategy: 'balance-v1', defaultView: true },
  { id: 'minimum-loan', name: '미래 중시', summary: '등록금 부족분만 빌리고 생활비 부족분은 알바로 보완합니다.', strategy: 'minimum-loan' },
]);

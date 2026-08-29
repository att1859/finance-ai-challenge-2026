export const INCOME_CONTINGENT_POLICY = Object.freeze({
  id: 'korea-icl-2026',
  label: '2026년 취업 후 상환 학자금대출 예상 기준',
  basisYear: 2026,
  annualIncomeThreshold: 3037,
  repaymentRate: 0.2,
  checkedAt: '2026-08-27',
  officialUrl: 'https://www.kosaf.go.kr/ko/tuitionnf.do?pg=tuition05_01_04',
  taxServiceUrl: 'https://www.icl.go.kr',
  note: '연소득에서 상환기준소득을 뺀 금액에 학부생 의무상환율을 적용한 간이 예상값입니다.',
});

export const GENERAL_LOAN_POLICY = Object.freeze({
  id: 'korea-general-student-loan',
  label: '일반 상환 학자금대출 상환 방식 안내',
  checkedAt: '2026-08-27',
  officialUrl: 'https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_02_02',
  note: '거치기간과 상환기간, 상환 방식은 사용자가 입력한 가정으로 계산합니다.',
});

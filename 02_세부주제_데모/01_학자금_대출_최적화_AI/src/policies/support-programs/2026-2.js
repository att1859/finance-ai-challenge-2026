const KOSAF_HOME = 'https://www.kosaf.go.kr/ko/main.do';
const KOSAF_SCHOLARSHIP = 'https://www.kosaf.go.kr/ko/scholar.do';
const KOSAF_ICL = 'https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_01_01';
const KOSAF_GENERAL = 'https://www.kosaf.go.kr/ko/tuition.do?naviParam=HD&pg=tuition04_02_01';

export const SUPPORT_PROGRAM_POLICY = Object.freeze({
  id: 'kosaf-support-programs-2026-2',
  semester: '2026-2 데모 기준',
  checkedAt: '2026-08-27',
  institution: '한국장학재단',
});

const fixed = (status, reason) => ({ type: 'fixed', status, reason });

const program = (value) => ({
  institution: SUPPORT_PROGRAM_POLICY.institution,
  semester: SUPPORT_PROGRAM_POLICY.semester,
  checkedAt: SUPPORT_PROGRAM_POLICY.checkedAt,
  officialUrl: KOSAF_SCHOLARSHIP,
  applicationUrl: KOSAF_HOME,
  ...value,
});

export const SUPPORT_PROGRAM_CATALOG = Object.freeze([
  program({
    id: 'national-i',
    name: '국가장학금 I유형',
    kind: '등록금 지원',
    match: {
      type: 'support-bracket-bands',
      maximumBracket: 8,
      bands: [
        { maximumBracket: 3, amount: 285 },
        { maximumBracket: 5, amount: 210 },
        { maximumBracket: 8, amount: 175 },
      ],
    },
  }),
  program({
    id: 'national-ii',
    name: '국가장학금 II유형',
    kind: '대학 연계 등록금 지원',
    match: fixed('추가 심사 필요', '대학별 자체 선발기준과 예산 확인이 필요합니다.'),
  }),
  program({
    id: 'multi-child',
    name: '다자녀 국가장학금',
    kind: '등록금 지원',
    match: {
      type: 'qualification',
      qualification: '다자녀',
      amount: 285,
      matchedStatus: '자동 매칭 가능',
      matchedReason: '다자녀 자격 입력값이 확인되었습니다. 가족관계와 성적은 공식 심사 대상이에요.',
      missingStatus: '대상 아님',
      missingReason: '다자녀 자격이 선택되지 않았습니다.',
    },
  }),
  program({
    id: 'regional-talent',
    name: '지역인재장학금',
    kind: '등록금 지원',
    match: { type: 'non-capital-region' },
  }),
  program({
    id: 'housing-stability',
    name: '주거안정장학금',
    kind: '생활비 지원',
    match: { type: 'housing-support', maximumBracket: 5 },
  }),
  program({
    id: 'national-work',
    name: '국가근로장학금',
    kind: '근로 대가성 지원',
    match: fixed('추가 심사 필요', '지원구간 외에 대학 선발, 근로지 배정, 근로 가능시간 심사가 필요합니다.'),
  }),
  program({
    id: 'youth-education',
    name: '대학생 청소년교육지원장학금',
    kind: '근로 대가성 지원',
    match: fixed('추가 심사 필요', '참여대학 여부와 멘토 선발, 활동시간 확인이 필요합니다.'),
  }),
  program({
    id: 'multicultural-mentoring',
    name: '다문화·탈북학생 멘토링장학금',
    kind: '근로 대가성 지원',
    match: {
      type: 'qualification',
      qualification: '다문화·탈북 배경',
      matchedStatus: '추가 심사 필요',
      matchedReason: '특별자격 입력은 확인됐지만 참여대학과 멘토 선발을 더 확인해야 해요.',
      missingStatus: '대상 아님',
      missingReason: '선택한 특별자격 기준으로는 우선 대상이 아닙니다.',
    },
  }),
  program({
    id: 'blue-lighthouse',
    name: '푸른등대 기부장학금',
    kind: '생활비 지원',
    match: fixed('모집 종료', '데모 목록의 해당 모집회차가 종료된 상태입니다. 다음 공고를 확인하세요.'),
  }),
  program({
    id: 'presidential-science',
    name: '대통령과학장학금',
    kind: '우수학생 지원',
    match: fixed('정보 부족', '전공계열, 입학연도, 성적·활동 정보가 수집되지 않았습니다.'),
  }),
  program({
    id: 'national-science',
    name: '국가우수장학금(이공계)',
    kind: '우수학생 지원',
    match: fixed('정보 부족', '이공계 전공 여부와 성적 기준 정보가 필요합니다.'),
  }),
  program({
    id: 'humanities-100',
    name: '인문100년장학금',
    kind: '우수학생 지원',
    match: fixed('정보 부족', '인문사회계열 전공과 대학 추천·성적 정보가 필요합니다.'),
  }),
  program({
    id: 'arts-sports',
    name: '예술체육비전장학금',
    kind: '우수학생 지원',
    match: fixed('정보 부족', '예술·체육계열 전공과 대학 추천정보가 필요합니다.'),
  }),
  program({
    id: 'technical-talent',
    name: '전문기술인재장학금',
    kind: '전문대 우수학생 지원',
    match: fixed('정보 부족', '대학 유형과 전문기술계열 선발정보가 필요합니다.'),
  }),
  program({
    id: 'hope-ladder-i',
    name: '중소기업 취업연계 장학금(희망사다리 I)',
    kind: '취업연계 지원',
    match: fixed('추가 심사 필요', '학년, 취업 의사, 대학 추천과 의무종사 조건 확인이 필요합니다.'),
  }),
  program({
    id: 'hope-ladder-ii',
    name: '고졸 후학습자 장학금(희망사다리 II)',
    kind: '후학습자 지원',
    match: fixed('대상 아님', '현재 입력은 일반 학부 재학생 기준이며 재직·고졸 후학습자 조건이 확인되지 않았습니다.'),
  }),
  program({
    id: 'rural-loan',
    name: '농촌출신대학생 학자금융자',
    kind: '공적 학자금융자',
    match: {
      type: 'qualification',
      qualification: '농어촌 가구',
      matchedStatus: '추가 심사 필요',
      matchedReason: '농어촌 자격 입력은 확인됐지만 거주·종사기간과 증빙 심사가 필요합니다.',
      missingStatus: '대상 아님',
      missingReason: '농어촌 가구 자격이 선택되지 않았습니다.',
    },
    officialUrl: KOSAF_HOME,
  }),
  program({
    id: 'income-contingent-loan',
    name: '취업 후 상환 학자금대출',
    kind: '공적 학자금대출',
    match: fixed('추가 심사 필요', '학적·지원구간·연령·성적과 실제 대출 승인 심사가 필요합니다.'),
    officialUrl: KOSAF_ICL,
  }),
  program({
    id: 'general-repayment-loan',
    name: '일반상환 학자금대출',
    kind: '공적 학자금대출',
    match: fixed('정보 부족', '연령·성적·신용요건과 상품별 한도 정보를 공식 페이지에서 확인해야 합니다.'),
    officialUrl: KOSAF_GENERAL,
  }),
]);

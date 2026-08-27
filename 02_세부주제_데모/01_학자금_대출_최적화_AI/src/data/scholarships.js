const KOSAF_HOME = 'https://www.kosaf.go.kr/ko/main.do';
const KOSAF_SCHOLARSHIP = 'https://www.kosaf.go.kr/ko/scholar.do';
const KOSAF_ICL = 'https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_01_01';
const KOSAF_GENERAL = 'https://www.kosaf.go.kr/ko/tuition.do?naviParam=HD&pg=tuition04_02_01';

export const PROGRAM_STATUSES = Object.freeze([
  '자동 매칭 가능',
  '추가 심사 필요',
  '정보 부족',
  '대상 아님',
  '모집 종료',
]);

const program = (value) => ({
  institution: '한국장학재단',
  semester: '2026-2 데모 기준',
  checkedAt: '2026-08-27',
  officialUrl: KOSAF_SCHOLARSHIP,
  applicationUrl: KOSAF_HOME,
  ...value,
});

export const SCHOLARSHIP_PROGRAMS = Object.freeze([
  program({
    id: 'national-i',
    name: '국가장학금 I유형',
    kind: '등록금 지원',
    demoAmountPerSemester: 285,
    evaluate(profile) {
      const bracket = Number(profile.supportBracket);
      if (!bracket) return { status: '정보 부족', reason: '학자금 지원구간을 입력해야 사전점검할 수 있어요.', amount: 0 };
      if (bracket > 8) return { status: '대상 아님', reason: '데모 규칙상 지원구간 기준을 벗어납니다.', amount: 0 };
      const amount = bracket <= 3 ? 285 : bracket <= 5 ? 210 : 175;
      return { status: '자동 매칭 가능', reason: `${bracket}구간 입력값이 데모 소득기준에 들어옵니다. 성적·수혜횟수는 공식 심사가 필요해요.`, amount };
    },
  }),
  program({
    id: 'national-ii',
    name: '국가장학금 II유형',
    kind: '대학 연계 등록금 지원',
    evaluate: () => ({ status: '추가 심사 필요', reason: '대학별 자체 선발기준과 예산 확인이 필요합니다.', amount: 0 }),
  }),
  program({
    id: 'multi-child',
    name: '다자녀 국가장학금',
    kind: '등록금 지원',
    evaluate(profile) {
      const eligible = profile.specialQualifications.includes('다자녀');
      return eligible
        ? { status: '자동 매칭 가능', reason: '다자녀 자격 입력값이 확인되었습니다. 가족관계와 성적은 공식 심사 대상이에요.', amount: 285 }
        : { status: '대상 아님', reason: '다자녀 자격이 선택되지 않았습니다.', amount: 0 };
    },
  }),
  program({
    id: 'regional-talent',
    name: '지역인재장학금',
    kind: '등록금 지원',
    evaluate(profile) {
      const nonCapital = !['서울특별시', '경기도', '인천광역시'].includes(profile.region);
      return nonCapital
        ? { status: '추가 심사 필요', reason: '비수도권 지역 입력은 확인됐지만 고교·대학 소재지와 대학별 선발을 더 확인해야 해요.', amount: 0 }
        : { status: '대상 아님', reason: '현재 지역 입력만으로는 비수도권 지역인재 조건에 해당하지 않습니다.', amount: 0 };
    },
  }),
  program({
    id: 'housing-stability',
    name: '주거안정장학금',
    kind: '생활비 지원',
    evaluate(profile) {
      const bracket = Number(profile.supportBracket);
      if (bracket && bracket > 5) return { status: '대상 아님', reason: '데모 지원구간 기준을 벗어납니다.', amount: 0 };
      return { status: '정보 부족', reason: '원거리 통학 여부와 부모 주소지 정보가 없어 추가 입력이 필요합니다.', amount: 0 };
    },
  }),
  program({
    id: 'national-work',
    name: '국가근로장학금',
    kind: '근로 대가성 지원',
    evaluate: () => ({ status: '추가 심사 필요', reason: '지원구간 외에 대학 선발, 근로지 배정, 근로 가능시간 심사가 필요합니다.', amount: 0 }),
  }),
  program({
    id: 'youth-education',
    name: '대학생 청소년교육지원장학금',
    kind: '근로 대가성 지원',
    evaluate: () => ({ status: '추가 심사 필요', reason: '참여대학 여부와 멘토 선발, 활동시간 확인이 필요합니다.', amount: 0 }),
  }),
  program({
    id: 'multicultural-mentoring',
    name: '다문화·탈북학생 멘토링장학금',
    kind: '근로 대가성 지원',
    evaluate(profile) {
      const eligible = profile.specialQualifications.includes('다문화·탈북 배경');
      return eligible
        ? { status: '추가 심사 필요', reason: '특별자격 입력은 확인됐지만 참여대학과 멘토 선발을 더 확인해야 해요.', amount: 0 }
        : { status: '대상 아님', reason: '선택한 특별자격 기준으로는 우선 대상이 아닙니다.', amount: 0 };
    },
  }),
  program({
    id: 'blue-lighthouse',
    name: '푸른등대 기부장학금',
    kind: '생활비 지원',
    evaluate: () => ({ status: '모집 종료', reason: '데모 목록의 해당 모집회차가 종료된 상태입니다. 다음 공고를 확인하세요.', amount: 0 }),
  }),
  program({
    id: 'presidential-science',
    name: '대통령과학장학금',
    kind: '우수학생 지원',
    evaluate: () => ({ status: '정보 부족', reason: '전공계열, 입학연도, 성적·활동 정보가 수집되지 않았습니다.', amount: 0 }),
  }),
  program({
    id: 'national-science',
    name: '국가우수장학금(이공계)',
    kind: '우수학생 지원',
    evaluate: () => ({ status: '정보 부족', reason: '이공계 전공 여부와 성적 기준 정보가 필요합니다.', amount: 0 }),
  }),
  program({
    id: 'humanities-100',
    name: '인문100년장학금',
    kind: '우수학생 지원',
    evaluate: () => ({ status: '정보 부족', reason: '인문사회계열 전공과 대학 추천·성적 정보가 필요합니다.', amount: 0 }),
  }),
  program({
    id: 'arts-sports',
    name: '예술체육비전장학금',
    kind: '우수학생 지원',
    evaluate: () => ({ status: '정보 부족', reason: '예술·체육계열 전공과 대학 추천정보가 필요합니다.', amount: 0 }),
  }),
  program({
    id: 'technical-talent',
    name: '전문기술인재장학금',
    kind: '전문대 우수학생 지원',
    evaluate: () => ({ status: '정보 부족', reason: '대학 유형과 전문기술계열 선발정보가 필요합니다.', amount: 0 }),
  }),
  program({
    id: 'hope-ladder-i',
    name: '중소기업 취업연계 장학금(희망사다리 I)',
    kind: '취업연계 지원',
    evaluate: () => ({ status: '추가 심사 필요', reason: '학년, 취업 의사, 대학 추천과 의무종사 조건 확인이 필요합니다.', amount: 0 }),
  }),
  program({
    id: 'hope-ladder-ii',
    name: '고졸 후학습자 장학금(희망사다리 II)',
    kind: '후학습자 지원',
    evaluate: () => ({ status: '대상 아님', reason: '현재 입력은 일반 학부 재학생 기준이며 재직·고졸 후학습자 조건이 확인되지 않았습니다.', amount: 0 }),
  }),
  program({
    id: 'rural-loan',
    name: '농촌출신대학생 학자금융자',
    kind: '공적 학자금융자',
    evaluate(profile) {
      const rural = profile.specialQualifications.includes('농어촌 가구');
      return rural
        ? { status: '추가 심사 필요', reason: '농어촌 자격 입력은 확인됐지만 거주·종사기간과 증빙 심사가 필요합니다.', amount: 0 }
        : { status: '대상 아님', reason: '농어촌 가구 자격이 선택되지 않았습니다.', amount: 0 };
    },
    officialUrl: KOSAF_HOME,
  }),
  program({
    id: 'income-contingent-loan',
    name: '취업 후 상환 학자금대출',
    kind: '공적 학자금대출',
    evaluate: () => ({ status: '추가 심사 필요', reason: '학적·지원구간·연령·성적과 실제 대출 승인 심사가 필요합니다.', amount: 0 }),
    officialUrl: KOSAF_ICL,
  }),
  program({
    id: 'general-repayment-loan',
    name: '일반상환 학자금대출',
    kind: '공적 학자금대출',
    evaluate: () => ({ status: '정보 부족', reason: '연령·성적·신용요건과 상품별 한도 정보를 공식 페이지에서 확인해야 합니다.', amount: 0 }),
    officialUrl: KOSAF_GENERAL,
  }),
]);

export function evaluateScholarships(profile) {
  return SCHOLARSHIP_PROGRAMS.map((item) => {
    const evaluation = item.evaluate(profile);
    return {
      ...item,
      status: evaluation.status,
      reason: evaluation.reason,
      estimatedSemesterAmount: evaluation.amount || 0,
    };
  });
}

export function summarizeScholarships(evaluatedPrograms, semesters) {
  const counts = Object.fromEntries(PROGRAM_STATUSES.map((status) => [status, 0]));
  evaluatedPrograms.forEach((item) => {
    counts[item.status] += 1;
  });
  const appliedPrograms = evaluatedPrograms.filter((item) => (
    item.status === '자동 매칭 가능' && item.kind.includes('등록금')
  ));
  const total = appliedPrograms.reduce(
    (sum, item) => sum + (item.estimatedSemesterAmount * semesters),
    0,
  );

  return {
    counts,
    appliedPrograms,
    estimatedTotal: total,
  };
}


import { PROGRAM_STATUSES } from './statuses.js';

const CAPITAL_REGIONS = new Set(['서울특별시', '경기도', '인천광역시']);

function evaluateBracketBands(profile, match) {
  const bracket = Number(profile.supportBracket);

  if (!bracket) {
    return {
      status: '정보 부족',
      reason: '학자금 지원구간을 입력해야 사전점검할 수 있어요.',
      amount: null,
    };
  }

  if (bracket > match.maximumBracket) {
    return {
      status: '대상 아님',
      reason: '데모 규칙상 지원구간 기준을 벗어납니다.',
      amount: null,
    };
  }

  const band = match.bands.find(({ maximumBracket }) => bracket <= maximumBracket);
  return {
    status: '자동 매칭 가능',
    reason: bracket + '구간 입력값이 데모 소득기준에 들어옵니다. 성적·수혜횟수는 공식 심사가 필요해요.',
    amount: band?.amount ?? null,
  };
}

function evaluateQualification(profile, match) {
  const selected = profile.specialQualifications?.includes(match.qualification);
  return selected
    ? {
      status: match.matchedStatus,
      reason: match.matchedReason,
      amount: match.amount ?? null,
    }
    : {
      status: match.missingStatus,
      reason: match.missingReason,
      amount: null,
    };
}

function evaluateNonCapitalRegion(profile) {
  return CAPITAL_REGIONS.has(profile.region)
    ? {
      status: '대상 아님',
      reason: '현재 지역 입력만으로는 비수도권 지역인재 조건에 해당하지 않습니다.',
      amount: null,
    }
    : {
      status: '추가 심사 필요',
      reason: '비수도권 지역 입력은 확인됐지만 고교·대학 소재지와 대학별 선발을 더 확인해야 해요.',
      amount: null,
    };
}

function evaluateHousingSupport(profile, match) {
  const bracket = Number(profile.supportBracket);
  return bracket && bracket > match.maximumBracket
    ? {
      status: '대상 아님',
      reason: '데모 지원구간 기준을 벗어납니다.',
      amount: null,
    }
    : {
      status: '정보 부족',
      reason: '원거리 통학 여부와 부모 주소지 정보가 없어 추가 입력이 필요합니다.',
      amount: null,
    };
}

export function evaluateSupportProgram(program, profile) {
  const { match } = program;
  let evaluation;

  if (match.type === 'support-bracket-bands') {
    evaluation = evaluateBracketBands(profile, match);
  } else if (match.type === 'qualification') {
    evaluation = evaluateQualification(profile, match);
  } else if (match.type === 'non-capital-region') {
    evaluation = evaluateNonCapitalRegion(profile);
  } else if (match.type === 'housing-support') {
    evaluation = evaluateHousingSupport(profile, match);
  } else {
    evaluation = {
      status: match.status,
      reason: match.reason,
      amount: null,
    };
  }

  return {
    ...program,
    status: evaluation.status,
    reason: evaluation.reason,
    estimatedSemesterAmount: evaluation.amount,
  };
}

export function evaluateSupportPrograms(catalog, profile) {
  return catalog.map((program) => evaluateSupportProgram(program, profile));
}

export function summarizeSupportPrograms(evaluatedPrograms) {
  const counts = Object.fromEntries(
    PROGRAM_STATUSES.map((status) => [status, 0]),
  );
  evaluatedPrograms.forEach((program) => {
    counts[program.status] += 1;
  });

  return {
    counts,
    candidatePrograms: evaluatedPrograms.filter(
      ({ status }) => status === '자동 매칭 가능',
    ),
  };
}

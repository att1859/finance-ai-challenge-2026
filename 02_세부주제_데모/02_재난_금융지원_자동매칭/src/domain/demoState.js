export const CASE_STATUS = {
  CANDIDATE: "candidate",
  READY: "ready",
  PUBLISHED: "published",
  CUSTOMER_CONFIRMED: "customer_confirmed",
  APPLICATION_SUBMITTED: "application_submitted",
  BANK_RECEIVED: "bank_received",
  TRANSFERRED: "transferred",
};

export const NOTICE_STATUS = {
  IDLE: "idle",
  ANALYZING: "analyzing",
  ANALYZED: "analyzed",
  APPROVED: "approved",
};

const NEXT_CASE_STATUSES = {
  candidate: ["ready"],
  ready: ["published"],
  published: ["ready", "customer_confirmed"],
  customer_confirmed: ["ready", "application_submitted"],
  application_submitted: ["published", "bank_received"],
  bank_received: ["transferred"],
  transferred: [],
};

export function createCaseState(customer, status = CASE_STATUS.CANDIDATE) {
  return {
    customerId: customer.id,
    status,
    statement: customer.statement,
    customerAnalysis: null,
    customerAnalysisSource: null,
    documents: {
      damageCertificate: false,
      identity: true,
      businessRegistration: true,
    },
    timestamps: {},
  };
}

export function createScenarioState(customers) {
  return {
    noticeStatus: NOTICE_STATUS.IDLE,
    noticeAnalysis: null,
    noticeAnalysisSource: null,
    selectedCustomerId: customers[0]?.id ?? null,
    publishedCustomerId: null,
    cases: {},
  };
}

export function getCaseState(scenarioState, customer) {
  const fallbackStatus = scenarioState.noticeStatus === NOTICE_STATUS.APPROVED
    ? CASE_STATUS.READY
    : CASE_STATUS.CANDIDATE;
  return scenarioState.cases[customer.id] ?? createCaseState(customer, fallbackStatus);
}

export function updateCaseState(scenarioState, customer, patch) {
  const currentCase = getCaseState(scenarioState, customer);
  return {
    ...scenarioState,
    cases: {
      ...scenarioState.cases,
      [customer.id]: {
        ...currentCase,
        ...patch,
        documents: patch.documents ?? currentCase.documents,
        timestamps: patch.timestamps ?? currentCase.timestamps,
      },
    },
  };
}

export function canTransitionCase(from, to) {
  return (NEXT_CASE_STATUSES[from] ?? []).includes(to);
}

export function transitionCaseState(caseState, nextStatus, timestamp = new Date().toISOString()) {
  if (!canTransitionCase(caseState.status, nextStatus)) {
    throw new Error(`${caseState.status}에서 ${nextStatus}(으)로 변경할 수 없습니다.`);
  }

  const timestampKey = {
    published: "publishedAt",
    application_submitted: "submittedAt",
    bank_received: "receivedAt",
    transferred: "transferredAt",
  }[nextStatus];

  return {
    ...caseState,
    status: nextStatus,
    timestamps: timestampKey
      ? { ...caseState.timestamps, [timestampKey]: timestamp }
      : caseState.timestamps,
  };
}

export function caseStatusLabel(status) {
  return {
    candidate: "분석 승인 전",
    ready: "안내 전",
    published: "앱 안내 게시",
    customer_confirmed: "피해내용 확인",
    application_submitted: "고객 제출",
    bank_received: "은행 접수",
    transferred: "심사 이관",
  }[status] ?? "확인 필요";
}

export function getWorkflowIndex(scenarioState, caseState) {
  if (caseState?.status === CASE_STATUS.TRANSFERRED) return 6;
  if ([CASE_STATUS.APPLICATION_SUBMITTED, CASE_STATUS.BANK_RECEIVED].includes(caseState?.status)) return 5;
  if ([CASE_STATUS.PUBLISHED, CASE_STATUS.CUSTOMER_CONFIRMED].includes(caseState?.status)) return 4;
  if (scenarioState.noticeStatus === NOTICE_STATUS.APPROVED) return 3;
  if (scenarioState.noticeStatus === NOTICE_STATUS.ANALYZED) return 1;
  return 0;
}

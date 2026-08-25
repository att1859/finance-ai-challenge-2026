import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActionButton,
  Badge,
  TabsList,
  TabsRoot,
  TabsTrigger,
  Text,
} from "@seed-design/react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileSearch,
  Flame,
  Landmark,
  RotateCcw,
  ShieldCheck,
  Snowflake,
  Sparkles,
  UploadCloud,
  UserRoundCheck,
  Waves,
} from "lucide-react";
import { scenarios, workflowSteps } from "./data/scenarios";
import { createCustomerPool, getWorkflowIndex } from "./lib/matching";

const STORAGE_KEY = "hangeul-disaster-finance-demo-v1";

const initialScenarioState = () => ({
  noticeAnalyzed: false,
  noticeApproved: false,
  caseCreated: false,
  appVisible: false,
  applicationStatus: "idle",
  analysisSource: null,
  noticeAnalysis: null,
  customerAnalyzed: false,
  customerAnalysisSource: null,
  customerAnalysis: null,
  documents: {
    damageCertificate: false,
    identity: true,
    businessRegistration: true,
  },
});

function loadSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === "object") return saved;
  } catch {
    // 저장 데이터가 손상된 경우 새 데모로 시작합니다.
  }
  return Object.fromEntries(scenarios.map((scenario) => [scenario.id, initialScenarioState()]));
}

function iconForScenario(id, size = 18) {
  if (id === "flood") return <Waves size={size} aria-hidden="true" />;
  if (id === "wildfire") return <Flame size={size} aria-hidden="true" />;
  return <Snowflake size={size} aria-hidden="true" />;
}

function toneForStatus(status) {
  if (status === "transferred") return "positive";
  if (status === "submitted") return "informative";
  return "warning";
}

function formatApplicationStatus(status) {
  if (status === "transferred") return "심사부서 이관 완료";
  if (status === "submitted") return "신청 접수 완료";
  return "고객 확인 대기";
}

async function requestAnalysis(type, content, fallback) {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, content }),
    });
    if (!response.ok) throw new Error("저장된 분석 사용");
    const result = await response.json();
    return { analysis: result.analysis, source: "openai" };
  } catch {
    return { analysis: fallback, source: "cache" };
  }
}

function WorkflowSpine({ currentIndex }) {
  const workflowRef = useRef(null);

  useEffect(() => {
    workflowRef.current
      ?.querySelector('[aria-current="step"]')
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentIndex]);

  return (
    <section className="workflow" aria-label="재난지원 처리 단계" ref={workflowRef}>
      <div className="workflow__rail" aria-hidden="true" />
      {workflowSteps.map((step, index) => {
        const complete = index < currentIndex;
        const current = index === currentIndex;
        return (
          <div
            className={`workflow__step${complete ? " is-complete" : ""}${current ? " is-current" : ""}`}
            key={step}
            aria-current={current ? "step" : undefined}
          >
            <span className="workflow__dot">{complete ? <Check size={14} /> : index + 1}</span>
            <span>{step}</span>
          </div>
        );
      })}
    </section>
  );
}

function ScenarioHeader({ scenario, state }) {
  return (
    <section className="incident-banner">
      <div className="incident-banner__icon">{iconForScenario(scenario.id, 26)}</div>
      <div className="incident-banner__body">
        <div className="incident-banner__meta">
          <Badge
            variant="weak"
            tone={scenario.current ? "positive" : "neutral"}
            size="medium"
          >
            {scenario.statusLabel}
          </Badge>
          <span>{scenario.occurredAt}</span>
          <span>공식 출처 확인</span>
        </div>
        <Text as="h1" fontSize="24px" lineHeight="32px" fontWeight="bold">
          {scenario.title}
        </Text>
        <p>{scenario.location}</p>
      </div>
      <div className="incident-banner__deadline">
        <span>피해신고 기한</span>
        <strong>{scenario.reportDday}</strong>
        <small>{scenario.reportDeadline}</small>
      </div>
      <div className="incident-banner__state">
        <Badge variant="outline" tone={toneForStatus(state.applicationStatus)} size="large">
          {formatApplicationStatus(state.applicationStatus)}
        </Badge>
      </div>
    </section>
  );
}

function NoticeWorkbench({ scenario, state, onAnalyze, onApprove, analyzing }) {
  const analysis = state.noticeAnalysis || scenario.noticeAnalysis;

  return (
    <section className="work-section" aria-labelledby="notice-heading">
      <div className="section-heading">
        <div>
          <Text as="h2" id="notice-heading" fontSize="20px" lineHeight="28px" fontWeight="bold">
            금융지원 공지 분석
          </Text>
          <p>AI가 비정형 공지를 고객·상품과 대조할 수 있는 항목으로 바꿉니다.</p>
        </div>
        {!state.noticeAnalyzed ? (
          <ActionButton
            variant="neutralSolid"
            size="medium"
            onClick={onAnalyze}
            disabled={analyzing}
            loading={analyzing}
          >
            <Sparkles size={17} aria-hidden="true" />
            {analyzing ? "공지 분석 중" : "AI 공지 분석"}
          </ActionButton>
        ) : (
          <Badge variant="weak" tone={state.analysisSource === "openai" ? "positive" : "informative"}>
            {state.analysisSource === "openai" ? "실제 AI 분석" : "저장된 분석"}
          </Badge>
        )}
      </div>

      {!state.noticeAnalyzed ? (
        <div className="notice-source">
          <div className="notice-source__mark"><FileSearch size={22} /></div>
          <div>
            <strong>{scenario.source.label}</strong>
            <p>{scenario.noticeText}</p>
            <a href={scenario.source.url} target="_blank" rel="noreferrer">
              공식 원문 열기 <ArrowRight size={14} />
            </a>
          </div>
        </div>
      ) : (
        <div className="analysis-result" aria-live="polite">
          <div className="analysis-result__summary">
            <div className="ai-orbit"><Bot size={24} /></div>
            <div>
              <span>AI 요약</span>
              <strong>{analysis.summary}</strong>
            </div>
          </div>
          <dl className="analysis-grid">
            <div><dt>재난 유형</dt><dd>{analysis.disasterType}</dd></div>
            <div><dt>영향 지역</dt><dd>{analysis.affectedRegions.join(" · ")}</dd></div>
            <div><dt>지원 대상</dt><dd>{analysis.eligibleSubjects.join(" · ")}</dd></div>
            <div><dt>신청 기간</dt><dd>{analysis.applicationPeriod}</dd></div>
            <div><dt>지원 유형</dt><dd>{analysis.supportTypes.join(" · ")}</dd></div>
            <div><dt>처리 기관</dt><dd>{analysis.processingInstitutions.join(" · ")}</dd></div>
          </dl>
          <div className="evidence-strip">
            <ShieldCheck size={19} />
            <div>
              <span>원문 근거</span>
              <p>“{analysis.evidenceQuotes[0]}”</p>
            </div>
          </div>
          {!state.noticeApproved && (
            <div className="approval-bar">
              <p><CircleHelp size={17} /> 담당자 승인 전에는 고객 추천에 적용되지 않습니다.</p>
              <ActionButton variant="neutralSolid" size="medium" onClick={onApprove}>
                분석 승인·케이스 생성 <ChevronRight size={17} />
              </ActionButton>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function CustomerQueue({ scenario, state, customers, selectedId, onSelect }) {
  if (!state.caseCreated) {
    return (
      <section className="work-section work-section--locked" aria-labelledby="queue-heading">
        <div className="section-heading">
          <div>
            <Text as="h2" id="queue-heading" fontSize="20px" lineHeight="28px" fontWeight="bold">
              잠재고객 우선순위
            </Text>
            <p>공지 분석을 승인하면 합성 고객 100명의 우선순위가 계산됩니다.</p>
          </div>
          <Badge variant="weak" tone="neutral">대기</Badge>
        </div>
        <div className="locked-line"><Landmark size={20} /> 고객 데이터는 승인된 규칙과만 대조합니다.</div>
      </section>
    );
  }

  const affectedCount = customers.filter((customer) => customer.score >= 70).length;

  return (
    <section className="work-section" aria-labelledby="queue-heading">
      <div className="section-heading">
        <div>
          <Text as="h2" id="queue-heading" fontSize="20px" lineHeight="28px" fontWeight="bold">
            잠재고객 우선순위
          </Text>
          <p>합성 고객 100명 중 우선 확인이 필요한 {affectedCount}명을 찾았습니다.</p>
        </div>
        <Badge variant="weak" tone="positive">{affectedCount}명 선별</Badge>
      </div>

      <div className="customer-table" role="table" aria-label="잠재고객 우선순위 목록">
        <div className="customer-table__head" role="row">
          <span role="columnheader">고객·사업장</span>
          <span role="columnheader">대출상품</span>
          <span role="columnheader">납부까지</span>
          <span role="columnheader">우선도</span>
        </div>
        {customers.slice(0, 5).map((customer) => (
          <button
            type="button"
            role="row"
            className={`customer-row${selectedId === customer.id ? " is-selected" : ""}`}
            key={customer.id}
            onClick={() => onSelect(customer.id)}
          >
            <span role="cell">
              <strong>{customer.business}</strong>
              <small>{customer.name} · {customer.region}</small>
            </span>
            <span role="cell">{customer.loan}</span>
            <span role="cell"><Clock3 size={15} /> {customer.dueDays}일</span>
            <span role="cell"><b>{customer.score}</b> / 100</span>
          </button>
        ))}
      </div>
      <div className="queue-footnote">
        <ShieldCheck size={16} /> 위치 일치는 잠재 영향만 뜻하며 실제 피해는 고객 확인과 지자체 확인서로 판단합니다.
      </div>
    </section>
  );
}

function SupportRouteBadge({ routeType }) {
  const content = {
    bank: ["positive", "은행 직접 심사"],
    linked: ["informative", "정책기관 연계"],
    external: ["warning", "외부 승인 필요"],
  }[routeType];
  return <Badge variant="weak" tone={content[0]}>{content[1]}</Badge>;
}

function CasePanel({ scenario, state, customer, onShowApp }) {
  const [showMore, setShowMore] = useState(false);

  if (!state.caseCreated) {
    return (
      <aside className="case-panel case-panel--locked" aria-labelledby="case-heading">
        <div className="case-panel__top">
          <div>
            <span className="case-number">CASE —</span>
            <Text as="h2" id="case-heading" fontSize="22px" lineHeight="30px" fontWeight="bold">
              지원 케이스 준비 전
            </Text>
            <p>공지를 분석하고 담당자가 승인하면 고객별 추천을 만듭니다.</p>
          </div>
          <Badge variant="outline" tone="neutral">잠금</Badge>
        </div>
        <div className="case-lock-guide">
          <ShieldCheck size={34} aria-hidden="true" />
          <strong>승인 전에는 지원 결과를 노출하지 않습니다.</strong>
          <p>공식 공지 분석 → 담당자 승인 → 합성 고객 100명 우선순위화가 끝나면 대표 지원 3개와 고객 앱 전송 기능이 열립니다.</p>
          <ol>
            <li><span>1</span>공식 공지 AI 분석</li>
            <li><span>2</span>담당자 기준 확인·승인</li>
            <li><span>3</span>고객별 지원 추천 생성</li>
          </ol>
        </div>
      </aside>
    );
  }

  return (
    <aside className="case-panel" aria-labelledby="case-heading">
      <div className="case-panel__top">
        <div>
          <span className="case-number">CASE {customer.id}</span>
          <Text as="h2" id="case-heading" fontSize="22px" lineHeight="30px" fontWeight="bold">
            {customer.business}
          </Text>
          <p>{customer.name} · {customer.branch}</p>
        </div>
        <Badge variant="outline" tone={toneForStatus(state.applicationStatus)}>
          {formatApplicationStatus(state.applicationStatus)}
        </Badge>
      </div>

      <div className="case-facts">
        <div><span>보유 대출</span><strong>{customer.loan}</strong></div>
        <div><span>대출 잔액</span><strong>{customer.balance}</strong></div>
        <div><span>다음 납부</span><strong>{customer.nextPayment}</strong></div>
      </div>

      <div className="match-reasons">
        <span>자동 선별 근거</span>
        <div>{customer.reasons.map((reason) => <Badge key={reason} variant="weak" tone="neutral">{reason}</Badge>)}</div>
      </div>

      <div className="support-heading">
        <div>
          <strong>받을 수 있는 대표 지원 3개</strong>
          <span>총 {scenario.supports.length + scenario.extraSupports.length}개 가능성 확인</span>
        </div>
      </div>

      <div className="support-list">
        {scenario.supports.map((support, index) => (
          <article className="support-row" key={support.id}>
            <div className="support-row__index">{index + 1}</div>
            <div className="support-row__body">
              <div className="support-row__title">
                <strong>{support.name}</strong>
                <SupportRouteBadge routeType={support.routeType} />
              </div>
              <p>{support.description}</p>
              <dl>
                <div><dt>지원</dt><dd>{support.benefit}</dd></div>
                <div><dt>신청 기한</dt><dd>{support.deadline}</dd></div>
                <div><dt>필요 서류</dt><dd>{support.documents.join(" · ")}</dd></div>
              </dl>
            </div>
          </article>
        ))}
      </div>

      <button type="button" className="more-supports" onClick={() => setShowMore((value) => !value)}>
        다른 지원 {scenario.extraSupports.length}개 {showMore ? "접기" : "보기"}
        <ChevronDown size={17} className={showMore ? "is-open" : ""} />
      </button>
      {showMore && (
        <div className="extra-supports">
          {scenario.extraSupports.map((support) => (
            <div key={support.id}>
              <strong>{support.name}</strong>
              <span>{support.institution}</span>
              <p>{support.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="case-action">
        {state.applicationStatus === "transferred" ? (
          <div className="transfer-complete">
            <CheckCircle2 size={25} />
            <div><strong>심사부서로 안전하게 이관했습니다.</strong><span>고객 서류와 매칭 근거가 케이스에 저장됐습니다.</span></div>
          </div>
        ) : (
          <>
            <ActionButton
              variant="neutralSolid"
              size="large"
              onClick={onShowApp}
              disabled={!state.caseCreated}
            >
              <UserRoundCheck size={18} />
              {state.appVisible ? "고객 앱 열기" : "고객 앱에 안전하게 노출"}
            </ActionButton>
            <p>전화·문자 링크 없이 인증된 앱에서만 안내합니다.</p>
          </>
        )}
      </div>
    </aside>
  );
}

function StaffView({
  scenario,
  state,
  customers,
  selectedCustomer,
  selectedId,
  onSelectCustomer,
  onAnalyze,
  onApprove,
  onShowApp,
  analyzing,
}) {
  return (
    <>
      <ScenarioHeader scenario={scenario} state={state} />
      <WorkflowSpine currentIndex={getWorkflowIndex(state)} />
      <main className="staff-grid">
        <div className="workbench">
          <NoticeWorkbench
            scenario={scenario}
            state={state}
            onAnalyze={onAnalyze}
            onApprove={onApprove}
            analyzing={analyzing}
          />
          <CustomerQueue
            scenario={scenario}
            state={state}
            customers={customers}
            selectedId={selectedId}
            onSelect={onSelectCustomer}
          />
        </div>
        <CasePanel
          scenario={scenario}
          state={state}
          customer={selectedCustomer}
          onShowApp={onShowApp}
        />
      </main>
    </>
  );
}

function DocumentCheck({ checked, title, description, badge, onChange, locked }) {
  return (
    <label className={`document-check${checked ? " is-checked" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={locked} />
      <span className="document-check__box">{checked && <Check size={15} />}</span>
      <span className="document-check__content">
        <strong>{title}</strong>
        <small>{description}</small>
      </span>
      <Badge variant="weak" tone={checked ? "positive" : "warning"}>{badge}</Badge>
    </label>
  );
}

function CustomerApp({ scenario, state, onBack, onAnalyzeCustomer, onDocumentChange, onSubmit, analyzing }) {
  const analysis = state.customerAnalysis || scenario.customerAnalysis;
  const allDocumentsReady = Object.values(state.documents).every(Boolean);
  const transferred = state.applicationStatus === "transferred";

  return (
    <main className="customer-surface">
      <div className="customer-topbar">
        <button type="button" onClick={onBack}><ArrowLeft size={18} /> 담당자 화면</button>
        <div><Landmark size={19} /><strong>한결은행</strong><span>인증된 앱 데모</span></div>
        <div className="customer-topbar__badges">
          <Badge variant="weak" tone="informative">합성 데이터</Badge>
          <Badge variant="outline" tone="positive">보안 접속</Badge>
        </div>
      </div>

      <div className="customer-content">
        <section className="customer-intro">
          <div>
            <Text as="h1" fontSize="30px" lineHeight="40px" fontWeight="bold">
              {scenario.primaryCustomer.name}님,<br />지원 신청을 준비해두었어요.
            </Text>
            <p>한결은행이 보유한 대출과 공식 지원공지를 대조했습니다. 피해 사실을 확인하면 심사 접수를 시작합니다.</p>
          </div>
          <div className="customer-intro__status">
            <span>피해신고 기한</span>
            <strong>{scenario.reportDday}</strong>
            <small>{scenario.reportDeadline}</small>
          </div>
        </section>

        {transferred ? (
          <section className="customer-success" aria-live="polite">
            <div className="customer-success__icon"><CheckCircle2 size={38} /></div>
            <Text as="h2" fontSize="24px" lineHeight="32px" fontWeight="bold">신청이 심사부서로 이관됐어요.</Text>
            <p>제출한 서류와 지원 매칭 근거를 담당자가 함께 검토합니다. 자동 승인이 아니며 추가 확인이 필요하면 인증된 앱으로 안내합니다.</p>
            <div className="success-route">
              <span className="is-done"><Check size={14} /> 고객 제출</span>
              <span className="is-done"><Check size={14} /> 은행 접수</span>
              <span className="is-active">심사 진행</span>
              <span>최종 결과</span>
            </div>
            <ActionButton variant="neutralSolid" size="large" onClick={onBack}>
              담당자 화면에서 상태 확인 <ArrowRight size={18} />
            </ActionButton>
          </section>
        ) : (
          <>
            <section className="customer-block" aria-labelledby="damage-heading">
              <div className="section-heading">
                <div>
                  <Text as="h2" id="damage-heading" fontSize="20px" lineHeight="28px" fontWeight="bold">피해 내용 확인</Text>
                  <p>AI는 고객의 문장을 정해진 피해 세그먼트로만 분류합니다.</p>
                </div>
                {state.customerAnalyzed && (
                  <Badge variant="weak" tone={state.customerAnalysisSource === "openai" ? "positive" : "informative"}>
                    {state.customerAnalysisSource === "openai" ? "실제 AI 분석" : "저장된 분석"}
                  </Badge>
                )}
              </div>
              <div className="customer-statement">
                <blockquote>“{scenario.customerStatement}”</blockquote>
                {!state.customerAnalyzed && (
                  <ActionButton variant="neutralWeak" size="medium" onClick={onAnalyzeCustomer} loading={analyzing} disabled={analyzing}>
                    <Sparkles size={17} /> {analyzing ? "피해 내용 분석 중" : "AI로 피해 내용 분류"}
                  </ActionButton>
                )}
              </div>
              {state.customerAnalyzed && (
                <dl className="segment-grid">
                  <div><dt>피해 유형</dt><dd>{analysis.damageType}</dd></div>
                  <div><dt>지역</dt><dd>{analysis.location}</dd></div>
                  <div><dt>업종</dt><dd>{analysis.businessType}</dd></div>
                  <div><dt>피해 정도</dt><dd>{analysis.damageSeverity}</dd></div>
                </dl>
              )}
            </section>

            <section className="customer-block" aria-labelledby="support-customer-heading">
              <div className="section-heading">
                <div>
                  <Text as="h2" id="support-customer-heading" fontSize="20px" lineHeight="28px" fontWeight="bold">우선 확인할 지원 3개</Text>
                  <p>총 {scenario.supports.length + scenario.extraSupports.length}개 가능성 중 신청 경로가 분명한 지원을 먼저 보여드립니다.</p>
                </div>
              </div>
              <div className="customer-supports">
                {scenario.supports.map((support, index) => (
                  <article key={support.id}>
                    <span>{index + 1}</span>
                    <div>
                      <strong>{support.name}</strong>
                      <p>{support.benefit}</p>
                      <small><Clock3 size={14} /> {support.deadline}</small>
                    </div>
                    <SupportRouteBadge routeType={support.routeType} />
                  </article>
                ))}
              </div>
            </section>

            <section className="customer-block" aria-labelledby="documents-heading">
              <div className="section-heading">
                <div>
                  <Text as="h2" id="documents-heading" fontSize="20px" lineHeight="28px" fontWeight="bold">필요 서류 확인</Text>
                  <p>은행 보유정보는 자동 확인하고, 피해확인서만 고객이 제출합니다.</p>
                </div>
                <Badge variant="weak" tone={allDocumentsReady ? "positive" : "warning"}>
                  {allDocumentsReady ? "준비 완료" : "1건 필요"}
                </Badge>
              </div>
              <div className="document-list">
                <DocumentCheck
                  checked={state.documents.damageCertificate}
                  title="재해피해확인서"
                  description="지자체 발급 서류 · 데모에서는 준비된 서류를 선택합니다."
                  badge={state.documents.damageCertificate ? "제출됨" : "제출 필요"}
                  onChange={(event) => onDocumentChange("damageCertificate", event.target.checked)}
                />
                <DocumentCheck
                  checked={state.documents.identity}
                  title="본인확인 정보"
                  description="한결은행 인증정보로 자동 확인했습니다."
                  badge="자동 확인"
                  locked
                />
                <DocumentCheck
                  checked={state.documents.businessRegistration}
                  title="사업자등록 정보"
                  description="은행 보유 고객정보로 자동 확인했습니다."
                  badge="자동 확인"
                  locked
                />
              </div>
              <div className="customer-submit">
                <div><ShieldCheck size={20} /><span>제출 후 자동 승인이 아니라 담당부서 심사가 시작됩니다.</span></div>
                <ActionButton variant="neutralSolid" size="large" disabled={!allDocumentsReady || !state.customerAnalyzed} onClick={onSubmit}>
                  <UploadCloud size={18} /> 신청 제출·심사 이관
                </ActionButton>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default function App() {
  const [scenarioId, setScenarioId] = useState("flood");
  const [states, setStates] = useState(loadSavedState);
  const [role, setRole] = useState("staff");
  const [selectedCustomerIds, setSelectedCustomerIds] = useState({});
  const [analyzing, setAnalyzing] = useState(null);
  const scenario = scenarios.find((item) => item.id === scenarioId) || scenarios[0];
  const state = states[scenario.id] || initialScenarioState();
  const customers = useMemo(() => createCustomerPool(scenario), [scenario]);
  const selectedId = selectedCustomerIds[scenario.id] || customers[0].id;
  const selectedCustomer = customers.find((customer) => customer.id === selectedId) || customers[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(states));
  }, [states]);

  useEffect(() => {
    document
      .querySelector('[role="tab"][aria-selected="true"]')
      ?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [scenarioId]);

  const updateState = (patch) => {
    setStates((current) => ({
      ...current,
      [scenario.id]: { ...(current[scenario.id] || initialScenarioState()), ...patch },
    }));
  };

  const analyzeNotice = async () => {
    setAnalyzing("notice");
    const startedAt = Date.now();
    const result = await requestAnalysis("notice", scenario.noticeText, scenario.noticeAnalysis);
    const remaining = Math.max(0, 700 - (Date.now() - startedAt));
    await new Promise((resolve) => setTimeout(resolve, remaining));
    updateState({ noticeAnalyzed: true, noticeAnalysis: result.analysis, analysisSource: result.source });
    setAnalyzing(null);
  };

  const approveNotice = () => updateState({ noticeApproved: true, caseCreated: true });

  const showCustomerApp = () => {
    updateState({ appVisible: true });
    setRole("customer");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const analyzeCustomer = async () => {
    setAnalyzing("customer");
    const startedAt = Date.now();
    const result = await requestAnalysis("customer", scenario.customerStatement, scenario.customerAnalysis);
    const remaining = Math.max(0, 650 - (Date.now() - startedAt));
    await new Promise((resolve) => setTimeout(resolve, remaining));
    updateState({
      customerAnalyzed: true,
      customerAnalysis: result.analysis,
      customerAnalysisSource: result.source,
    });
    setAnalyzing(null);
  };

  const updateDocument = (key, checked) => {
    updateState({ documents: { ...state.documents, [key]: checked } });
  };

  const submitApplication = () => {
    updateState({ applicationStatus: "transferred" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const resetDemo = () => {
    const fresh = Object.fromEntries(scenarios.map((item) => [item.id, initialScenarioState()]));
    setStates(fresh);
    setRole("staff");
    setScenarioId("flood");
    setSelectedCustomerIds({});
    localStorage.removeItem(STORAGE_KEY);
  };

  if (role === "customer") {
    return (
      <CustomerApp
        scenario={scenario}
        state={state}
        onBack={() => setRole("staff")}
        onAnalyzeCustomer={analyzeCustomer}
        onDocumentChange={updateDocument}
        onSubmit={submitApplication}
        analyzing={analyzing === "customer"}
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark"><Landmark size={22} /><span>한결은행</span></div>
        <div className="product-title">
          <strong>재난금융 지원센터</strong>
          <Badge variant="weak" tone="informative">합성 데이터 데모</Badge>
        </div>
        <div className="topbar__actions">
          {state.appVisible && (
            <ActionButton variant="neutralWeak" size="small" onClick={() => setRole("customer")}>
              고객 앱 보기 <ArrowRight size={16} />
            </ActionButton>
          )}
          <ActionButton variant="ghost" size="small" onClick={resetDemo}>
            <RotateCcw size={16} /> 데모 초기화
          </ActionButton>
        </div>
      </header>

      <nav className="scenario-nav" aria-label="재난 시나리오 선택">
        <span>시연 시나리오</span>
        <TabsRoot value={scenarioId} onValueChange={setScenarioId}>
          <TabsList>
            {scenarios.map((item) => (
              <TabsTrigger value={item.id} key={item.id}>
                {iconForScenario(item.id)} {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </TabsRoot>
        <div className="scenario-nav__count"><Building2 size={16} /> 합성 고객 100명</div>
        <span className="mobile-scroll-hint" aria-hidden="true">옆으로 보기 <ArrowRight size={14} /></span>
      </nav>

      <StaffView
        scenario={scenario}
        state={state}
        customers={customers}
        selectedCustomer={selectedCustomer}
        selectedId={selectedId}
        onSelectCustomer={(id) => setSelectedCustomerIds((current) => ({ ...current, [scenario.id]: id }))}
        onAnalyze={analyzeNotice}
        onApprove={approveNotice}
        onShowApp={showCustomerApp}
        analyzing={analyzing === "notice"}
      />

      <footer className="app-footer">
        <span>본 화면의 고객·대출·피해정보는 모두 합성 데이터입니다.</span>
        <span>지원 가능성은 참고용이며 최종 자격·승인·지급은 각 기관 심사를 거칩니다.</span>
      </footer>
    </div>
  );
}

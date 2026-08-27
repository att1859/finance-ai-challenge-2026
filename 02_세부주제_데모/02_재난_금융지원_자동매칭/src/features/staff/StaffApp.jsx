import { useEffect, useMemo, useState } from "react";
import { ActionButton, Badge, Text } from "@seed-design/react";
import {
  Bot,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileSearch,
  Flame,
  Landmark,
  Search,
  ShieldCheck,
  Snowflake,
  Sparkles,
  UserRoundCheck,
  Waves,
} from "lucide-react";
import { CASE_STATUS, NOTICE_STATUS, caseStatusLabel, getCaseState } from "../../domain/demoState";
import { getEligibleExtraSupports } from "../../lib/matching";
import WorkflowSpine from "../shared/WorkflowSpine";

function ScenarioIcon({ id, size = 24 }) {
  if (id === "flood") return <Waves size={size} aria-hidden="true" />;
  if (id === "wildfire") return <Flame size={size} aria-hidden="true" />;
  return <Snowflake size={size} aria-hidden="true" />;
}

function caseTone(status) {
  if (status === CASE_STATUS.TRANSFERRED) return "positive";
  if ([CASE_STATUS.PUBLISHED, CASE_STATUS.CUSTOMER_CONFIRMED, CASE_STATUS.APPLICATION_SUBMITTED].includes(status)) return "informative";
  if (status === CASE_STATUS.BANK_RECEIVED) return "warning";
  return "neutral";
}

function IncidentHeader({ scenario, selectedCase }) {
  return (
    <section className="incident-banner">
      <div className="incident-banner__icon"><ScenarioIcon id={scenario.id} size={26} /></div>
      <div className="incident-banner__body">
        <div className="incident-banner__meta">
          <Badge variant="weak" tone="positive" size="medium">{scenario.statusLabel}</Badge>
          <span>{scenario.occurredAt}</span>
          <span>{scenario.source.label}</span>
        </div>
        <Text as="h1" fontSize="24px" lineHeight="32px" fontWeight="bold">{scenario.title}</Text>
        <p>{scenario.location}</p>
      </div>
      <div className="incident-banner__deadline">
        <span>피해신고 기한</span>
        <strong>{scenario.reportDday}</strong>
        <small>{scenario.reportDeadline}</small>
      </div>
      <div className="incident-banner__state">
        <Badge variant="outline" tone={caseTone(selectedCase.status)}>{caseStatusLabel(selectedCase.status)}</Badge>
      </div>
    </section>
  );
}

function AnalysisSourceNotice({ source }) {
  if (source !== "cache") return null;
  return (
    <div className="analysis-source-notice" role="status">
      <CircleHelp size={17} />
      <span>AI 연결을 사용할 수 없어 저장된 분석으로 데모를 계속합니다. 담당자 승인 전에는 고객 추천에 반영되지 않습니다.</span>
    </div>
  );
}

function NoticeWorkbench({ scenario, state, analyzing, onAnalyze, onApprove }) {
  const analysis = state.noticeAnalysis ?? scenario.noticeAnalysis;
  const hasAnalysis = [NOTICE_STATUS.ANALYZED, NOTICE_STATUS.APPROVED].includes(state.noticeStatus);

  return (
    <section className="work-section" aria-labelledby="notice-heading">
      <div className="section-heading">
        <div>
          <Text as="h2" id="notice-heading" fontSize="20px" lineHeight="28px" fontWeight="bold">금융지원 공지 분석</Text>
          <p>AI가 비정형 공지를 고객·상품과 대조할 수 있는 항목으로 정리합니다.</p>
        </div>
        {!hasAnalysis ? (
          <ActionButton variant="neutralSolid" size="medium" onClick={onAnalyze} disabled={analyzing}>
            <Sparkles size={17} /> {analyzing ? "공지 정리 중…" : "AI 공지 분석"}
          </ActionButton>
        ) : (
          <Badge variant="weak" tone={state.noticeAnalysisSource === "openai" ? "positive" : "neutral"}>
            {state.noticeAnalysisSource === "openai" ? "실시간 AI 분석" : "저장된 분석"}
          </Badge>
        )}
      </div>

      {!hasAnalysis ? (
        <div className="notice-source">
          <div className="notice-source__icon"><FileSearch size={21} /></div>
          <div>
            <strong>{scenario.source.label}</strong>
            <p>{scenario.noticeText}</p>
            <a href={scenario.source.url} target="_blank" rel="noreferrer">공식 원문 열기 →</a>
          </div>
        </div>
      ) : (
        <>
          <AnalysisSourceNotice source={state.noticeAnalysisSource} />
          <div className="analysis-summary">
            <span>AI 요약</span>
            <strong>{analysis.summary}</strong>
          </div>
          <dl className="analysis-grid">
            <div><dt>재난 유형</dt><dd>{analysis.disasterType}</dd></div>
            <div><dt>영향 지역</dt><dd>{analysis.affectedRegions.join(" · ")}</dd></div>
            <div><dt>지원 대상</dt><dd>{analysis.eligibleSubjects.join(" · ")}</dd></div>
            <div><dt>신청 기간</dt><dd>{analysis.applicationPeriod}</dd></div>
            <div><dt>지원 유형</dt><dd>{analysis.supportTypes.join(" · ")}</dd></div>
            <div><dt>처리 기관</dt><dd>{analysis.processingInstitutions.join(" · ")}</dd></div>
          </dl>
          <div className="evidence-quote"><span>원문 근거</span><p>“{analysis.evidenceQuotes[0]}”</p></div>
          <div className="approval-bar">
            <div>
              <ShieldCheck size={20} />
              <p>{state.noticeStatus === NOTICE_STATUS.APPROVED ? "담당자 승인이 완료되어 고객 우선순위에 반영됐습니다." : "담당자 승인 전에는 고객 추천에 적용되지 않습니다."}</p>
            </div>
            {state.noticeStatus !== NOTICE_STATUS.APPROVED && (
              <ActionButton variant="neutralSolid" size="medium" onClick={onApprove}>분석 승인하고 고객 찾기</ActionButton>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function statusFilterMatch(status, filter) {
  if (filter === "all") return true;
  if (filter === "ready") return status === CASE_STATUS.READY;
  if (filter === "published") return [CASE_STATUS.PUBLISHED, CASE_STATUS.CUSTOMER_CONFIRMED].includes(status);
  if (filter === "submitted") return status === CASE_STATUS.APPLICATION_SUBMITTED;
  if (filter === "received") return status === CASE_STATUS.BANK_RECEIVED;
  if (filter === "transferred") return status === CASE_STATUS.TRANSFERRED;
  return true;
}

function CustomerQueue({ scenario, state, customers, selectedId, onSelect }) {
  const [query, setQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [dueFilter, setDueFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("priority");
  const [visibleCount, setVisibleCount] = useState(20);
  const unlocked = state.noticeStatus === NOTICE_STATUS.APPROVED;

  const filteredCustomers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const result = customers.filter((customer) => {
      const matchesQuery = !normalizedQuery || [customer.name, customer.business, customer.region]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesRegion = regionFilter === "all" || scenario.noticeAnalysis.affectedRegions.includes(customer.region);
      const matchesDue = dueFilter === "all" || customer.dueDays <= 14;
      const status = getCaseState(state, customer).status;
      return matchesQuery && matchesRegion && matchesDue && statusFilterMatch(status, statusFilter);
    });

    return result.sort((a, b) => {
      if (sortBy === "due") return a.dueDays - b.dueDays || b.score - a.score;
      if (sortBy === "name") return a.name.localeCompare(b.name, "ko");
      return b.score - a.score || a.dueDays - b.dueDays || a.id.localeCompare(b.id);
    });
  }, [customers, dueFilter, query, regionFilter, scenario.noticeAnalysis.affectedRegions, sortBy, state, statusFilter]);

  useEffect(() => setVisibleCount(20), [query, regionFilter, dueFilter, statusFilter, sortBy]);

  const resetFilters = () => {
    setQuery("");
    setRegionFilter("all");
    setDueFilter("all");
    setStatusFilter("all");
    setSortBy("priority");
  };

  if (!unlocked) {
    return (
      <section className="work-section work-section--locked" aria-labelledby="queue-heading">
        <div className="section-heading">
          <div><Text as="h2" id="queue-heading" fontSize="20px" lineHeight="28px" fontWeight="bold">잠재고객 우선순위</Text><p>공지 분석을 승인하면 합성 고객 100명의 우선순위가 계산됩니다.</p></div>
          <Badge variant="weak" tone="neutral">대기</Badge>
        </div>
        <div className="locked-message"><Landmark size={20} /><span>고객 데이터는 승인된 규칙과만 대조합니다.</span></div>
      </section>
    );
  }

  return (
    <section className="work-section" aria-labelledby="queue-heading">
      <div className="section-heading">
        <div>
          <Text as="h2" id="queue-heading" fontSize="20px" lineHeight="28px" fontWeight="bold">잠재고객 우선순위</Text>
          <p>합성 고객 100명을 검색하고, 우선 확인 근거를 비교해 안내 대상을 선택합니다.</p>
        </div>
        <Badge variant="weak" tone="informative">{filteredCustomers.length}명 표시</Badge>
      </div>

      <div className="queue-controls">
        <label className="queue-search">
          <Search size={16} aria-hidden="true" />
          <span className="sr-only">고객 검색</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="고객명·사업장·지역 검색" />
        </label>
        <label><span>지역</span><select value={regionFilter} onChange={(event) => setRegionFilter(event.target.value)}><option value="all">전체</option><option value="affected">영향지역</option></select></label>
        <label><span>납부일</span><select value={dueFilter} onChange={(event) => setDueFilter(event.target.value)}><option value="all">전체</option><option value="soon">14일 이내</option></select></label>
        <label><span>상태</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="all">전체</option><option value="ready">안내 전</option><option value="published">게시</option><option value="submitted">고객 제출</option><option value="received">은행 접수</option><option value="transferred">이관</option></select></label>
        <label><span>정렬</span><select value={sortBy} onChange={(event) => setSortBy(event.target.value)}><option value="priority">우선도</option><option value="due">납부일</option><option value="name">고객명</option></select></label>
      </div>

      {filteredCustomers.length === 0 ? (
        <div className="queue-empty">
          <Search size={24} />
          <strong>조건에 맞는 고객이 없습니다.</strong>
          <p>검색어나 필터를 바꾸면 전체 합성 고객을 다시 확인할 수 있습니다.</p>
          <ActionButton variant="neutralWeak" size="small" onClick={resetFilters}>필터 초기화</ActionButton>
        </div>
      ) : (
        <div className="customer-table" aria-label="잠재고객 우선순위 목록">
          <div className="customer-table__head" aria-hidden="true"><span>고객·사업장</span><span>대출상품</span><span>납부까지</span><span>상태</span><span>우선도</span></div>
          {filteredCustomers.slice(0, visibleCount).map((customer) => {
            const customerCase = getCaseState(state, customer);
            return (
              <button
                type="button"
                className={`customer-row${selectedId === customer.id ? " is-selected" : ""}`}
                key={customer.id}
                onClick={() => onSelect(customer.id)}
                aria-pressed={selectedId === customer.id}
              >
                <span><strong>{customer.business}</strong><small>{customer.name} · {customer.region}</small></span>
                <span>{customer.loan}</span>
                <span><Clock3 size={14} /> {customer.dueDays}일</span>
                <span><Badge variant="weak" tone={caseTone(customerCase.status)}>{caseStatusLabel(customerCase.status)}</Badge></span>
                <span><b>{customer.score}</b> / 100</span>
              </button>
            );
          })}
        </div>
      )}

      {visibleCount < filteredCustomers.length && (
        <div className="queue-more"><ActionButton variant="neutralWeak" size="small" onClick={() => setVisibleCount((count) => count + 20)}>20명 더 보기</ActionButton><span>{Math.min(visibleCount, filteredCustomers.length)} / {filteredCustomers.length}</span></div>
      )}
      <p className="queue-footnote"><CircleHelp size={15} /> 우선도는 피해 확정이나 지원 자격이 아니라 담당자가 먼저 확인할 순서입니다.</p>
    </section>
  );
}

function SupportRouteBadge({ support }) {
  const tone = support.routeType === "bank" ? "positive" : support.routeType === "linked" ? "informative" : "warning";
  return <Badge variant="weak" tone={tone}>{support.route}</Badge>;
}

function CasePanel({ scenario, state, customer, customerCase, onPublish, onUnpublish, onReceive, onTransfer }) {
  const [showMore, setShowMore] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const extraSupports = getEligibleExtraSupports(customer, scenario.extraSupports);

  useEffect(() => {
    setConfirming(false);
    setShowMore(false);
  }, [customer.id]);

  if (state.noticeStatus !== NOTICE_STATUS.APPROVED) {
    return (
      <aside className="case-panel case-panel--locked" aria-labelledby="case-heading">
        <div className="case-panel__top"><div><span className="case-number">CASE —</span><Text as="h2" id="case-heading" fontSize="20px" lineHeight="28px" fontWeight="bold">지원 케이스 준비 전</Text><p>공지를 분석하고 담당자가 승인하면 고객별 추천을 만듭니다.</p></div><Badge variant="outline" tone="neutral">잠금</Badge></div>
        <div className="case-lock-guide"><ShieldCheck size={34} /><strong>승인 전에는 지원 결과를 노출하지 않습니다.</strong><p>공식 공지 분석과 담당자 승인이 끝나면 합성 고객 우선순위와 고객별 추천이 열립니다.</p></div>
      </aside>
    );
  }

  return (
    <aside className="case-panel" aria-labelledby="case-heading">
      <div className="case-panel__top">
        <div><span className="case-number">CASE {customer.id}</span><Text as="h2" id="case-heading" fontSize="20px" lineHeight="28px" fontWeight="bold">{customer.business}</Text><p>{customer.name} · {customer.branch}</p></div>
        <Badge variant="outline" tone={caseTone(customerCase.status)}>{caseStatusLabel(customerCase.status)}</Badge>
      </div>

      <div className="case-facts"><div><span>보유 대출</span><strong>{customer.loan}</strong></div><div><span>대출 잔액</span><strong>{customer.balance}</strong></div><div><span>다음 납부</span><strong>{customer.nextPayment}</strong></div></div>

      <div className="match-reasons"><span>우선 확인 근거</span><div>{customer.reasons.map((reason) => <Badge key={reason} variant="weak" tone="neutral">{reason}</Badge>)}</div></div>
      <div className="score-breakdown" aria-label="우선도 점수 구성">{customer.breakdown.map((item) => <div key={item.id}><span>{item.label}</span><strong>+{item.score}</strong></div>)}</div>

      <div className="support-heading"><div><strong>검토 가능한 지원 3개</strong><span>고객 조건으로 총 {scenario.supports.length + extraSupports.length}개 가능성 확인</span></div></div>
      <div className="support-list">
        {scenario.supports.map((support, index) => (
          <article className="support-row" key={support.id}>
            <div className="support-row__index">{index + 1}</div>
            <div className="support-row__body">
              <div className="support-row__title"><strong>{support.name}</strong><SupportRouteBadge support={support} /></div>
              <p>{support.description}</p>
              <dl><div><dt>지원</dt><dd>{support.benefit}</dd></div><div><dt>신청 기한</dt><dd>{support.deadline}</dd></div><div><dt>필요 서류</dt><dd>{support.documents.join(" · ")}</dd></div></dl>
            </div>
          </article>
        ))}
      </div>

      {extraSupports.length > 0 && (
        <>
          <button type="button" className="more-supports" onClick={() => setShowMore((value) => !value)} aria-expanded={showMore}>다른 지원 {extraSupports.length}개 {showMore ? "접기" : "보기"}<ChevronDown size={17} className={showMore ? "is-open" : ""} /></button>
          {showMore && <div className="extra-supports">{extraSupports.map((support) => <div key={support.id}><strong>{support.name}</strong><span>{support.institution}</span><p>{support.description}</p></div>)}</div>}
        </>
      )}

      <div className="case-action" aria-live="polite">
        {customerCase.status === CASE_STATUS.READY && !confirming && (
          <><ActionButton variant="neutralSolid" size="large" onClick={() => setConfirming(true)}><UserRoundCheck size={18} /> 선택 고객에게 앱 안내 게시</ActionButton><p>게시 전 고객과 추천 내용을 한 번 더 확인합니다.</p></>
        )}
        {customerCase.status === CASE_STATUS.READY && confirming && (
          <div className="publish-confirmation">
            <strong>{customer.name} 고객에게 안내를 게시할까요?</strong>
            <p>{customer.business} · {customer.region}</p>
            <ul>{scenario.supports.map((support) => <li key={support.id}>{support.shortName}</li>)}</ul>
            <span>고객이 제출하기 전에는 게시를 취소할 수 있습니다.</span>
            <div><ActionButton variant="neutralWeak" size="medium" onClick={() => setConfirming(false)}>돌아가기</ActionButton><ActionButton variant="neutralSolid" size="medium" onClick={onPublish}>확인 후 게시</ActionButton></div>
          </div>
        )}
        {[CASE_STATUS.PUBLISHED, CASE_STATUS.CUSTOMER_CONFIRMED].includes(customerCase.status) && (
          <div className="case-status-action"><CheckCircle2 size={23} /><div><strong>고객 앱에 안내가 게시됐습니다.</strong><span>데모 컨트롤에서 고객 앱을 열어 확인할 수 있습니다.</span></div><ActionButton variant="ghost" size="small" onClick={onUnpublish}>게시 취소</ActionButton></div>
        )}
        {customerCase.status === CASE_STATUS.APPLICATION_SUBMITTED && (
          <div className="case-status-action"><Clock3 size={23} /><div><strong>고객이 신청서를 제출했습니다.</strong><span>서류와 피해내용을 확인한 뒤 은행 접수로 변경하세요.</span></div><ActionButton variant="neutralSolid" size="medium" onClick={onReceive}>은행 접수 처리</ActionButton></div>
        )}
        {customerCase.status === CASE_STATUS.BANK_RECEIVED && (
          <div className="case-status-action"><FileSearch size={23} /><div><strong>은행 접수가 완료됐습니다.</strong><span>신청서와 매칭 근거를 담당 심사부서로 전달합니다.</span></div><ActionButton variant="neutralSolid" size="medium" onClick={onTransfer}>심사부서로 이관</ActionButton></div>
        )}
        {customerCase.status === CASE_STATUS.TRANSFERRED && (
          <div className="transfer-complete"><CheckCircle2 size={25} /><div><strong>담당 심사부서로 이관했습니다.</strong><span>지원 여부는 기관 심사 후 결정되며 결과는 고객 앱으로 안내합니다.</span></div></div>
        )}
      </div>
    </aside>
  );
}

export default function StaffApp({
  scenario,
  scenarioState,
  customers,
  selectedCustomer,
  selectedCase,
  currentIndex,
  analyzingNotice,
  onAnalyzeNotice,
  onApproveNotice,
  onSelectCustomer,
  onPublish,
  onUnpublish,
  onReceive,
  onTransfer,
}) {
  return (
    <div className="staff-surface">
      <header className="topbar staff-product-header">
        <div className="brand-mark"><Landmark size={22} /><span>한결은행</span></div>
        <div className="product-title"><strong>재난금융 지원센터</strong><Badge variant="weak" tone="neutral">운영자 도구</Badge></div>
        <div className="staff-product-header__meta"><Bot size={16} /><span>지원공지 구조화 + 규칙 기반 고객 매칭</span></div>
      </header>
      <IncidentHeader scenario={scenario} selectedCase={selectedCase} />
      <WorkflowSpine currentIndex={currentIndex} />
      <main className="staff-grid">
        <div className="workbench">
          <NoticeWorkbench scenario={scenario} state={scenarioState} analyzing={analyzingNotice} onAnalyze={onAnalyzeNotice} onApprove={onApproveNotice} />
          <CustomerQueue scenario={scenario} state={scenarioState} customers={customers} selectedId={selectedCustomer.id} onSelect={onSelectCustomer} />
        </div>
        <CasePanel scenario={scenario} state={scenarioState} customer={selectedCustomer} customerCase={selectedCase} onPublish={onPublish} onUnpublish={onUnpublish} onReceive={onReceive} onTransfer={onTransfer} />
      </main>
      <footer className="app-footer"><span>운영자 화면의 고객·대출·피해정보는 모두 합성 데이터입니다.</span><span>추천은 검토 가능성이며 최종 자격·승인·지급은 각 기관 심사를 거칩니다.</span></footer>
    </div>
  );
}

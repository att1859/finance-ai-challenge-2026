import { useState } from "react";
import { ActionButton, Badge, Text } from "@seed-design/react";
import {
  Bot,
  Check,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Landmark,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { CASE_STATUS } from "../../domain/demoState";

function DocumentCheck({ checked, title, description, badge, onChange, locked }) {
  return (
    <label className={`document-check${checked ? " is-checked" : ""}`}>
      <input type="checkbox" checked={checked} onChange={onChange} disabled={locked} />
      <span className="document-check__box">{checked && <Check size={15} />}</span>
      <span className="document-check__content"><strong>{title}</strong><small>{description}</small></span>
      <Badge variant="weak" tone={checked ? "positive" : "warning"}>{badge}</Badge>
    </label>
  );
}

function SupportRouteBadge({ support }) {
  const tone = support.routeType === "bank" ? "positive" : support.routeType === "linked" ? "informative" : "warning";
  return <Badge variant="weak" tone={tone}>{support.route}</Badge>;
}

function ApplicationProgress({ status }) {
  const currentIndex = {
    application_submitted: 0,
    bank_received: 1,
    transferred: 2,
  }[status] ?? 0;

  const steps = ["신청서 제출", "은행 접수", "심사부서 전달"];
  return (
    <ol className="application-progress" aria-label="신청 진행상태">
      {steps.map((step, index) => (
        <li key={step} className={`${index < currentIndex ? "is-done" : ""}${index === currentIndex ? " is-current" : ""}`} aria-current={index === currentIndex ? "step" : undefined}>
          <span>{index < currentIndex ? <Check size={14} /> : index + 1}</span>
          <strong>{step}</strong>
        </li>
      ))}
    </ol>
  );
}

function ApplicationStatus({ customer, status, onCancel }) {
  const content = {
    application_submitted: {
      icon: <Send size={34} />,
      title: "신청서를 은행에 보냈어요.",
      description: "영업일 기준 1일 안에 담당자가 제출 내용과 서류를 확인합니다.",
    },
    bank_received: {
      icon: <FileCheck2 size={34} />,
      title: "은행 담당자가 신청서를 확인하고 있어요.",
      description: "추가 확인이 필요하면 인증된 앱 알림으로 안내합니다.",
    },
    transferred: {
      icon: <CheckCircle2 size={34} />,
      title: "담당 심사부서로 전달했어요.",
      description: "지원 여부는 기관 심사 후 결정되며 결과와 다음 절차를 앱으로 안내합니다.",
    },
  }[status];

  return (
    <div className="customer-content customer-content--status">
      <section className="customer-status-card" aria-live="polite">
        <div className="customer-status-card__icon">{content.icon}</div>
        <Text as="h1" fontSize="30px" lineHeight="40px" fontWeight="bold">{content.title}</Text>
        <p>{customer.name}님의 {customer.business} 신청 현황입니다. {content.description}</p>
        <ApplicationProgress status={status} />
        <div className="customer-help-grid">
          <div><Clock3 size={19} /><span>예상 처리시간</span><strong>영업일 1~3일</strong></div>
          <div><Phone size={19} /><span>문의</span><strong>한결은행 고객센터 1588-0000</strong></div>
        </div>
        {status === CASE_STATUS.APPLICATION_SUBMITTED && (
          <ActionButton variant="ghost" size="medium" onClick={onCancel}>은행 접수 전 신청 취소</ActionButton>
        )}
      </section>
      <p className="customer-disclaimer">지원 자격·승인·지급은 제출 정보와 기관별 심사를 거쳐 결정됩니다.</p>
    </div>
  );
}

export default function CustomerApp({
  scenario,
  customer,
  customerCase,
  analyzing,
  onStatementChange,
  onAnalyze,
  onDocumentChange,
  onSubmit,
  onCancelApplication,
}) {
  const [statementError, setStatementError] = useState("");
  const analysis = customerCase.customerAnalysis ?? customer.fallbackAnalysis;
  const hasAnalysis = customerCase.customerAnalysis !== null;
  const allDocumentsReady = Object.values(customerCase.documents).every(Boolean);
  const isApplicationStatus = [CASE_STATUS.APPLICATION_SUBMITTED, CASE_STATUS.BANK_RECEIVED, CASE_STATUS.TRANSFERRED].includes(customerCase.status);

  const analyzeStatement = () => {
    if (customerCase.statement.trim().length < 10) {
      setStatementError("피해 지역과 피해 내용을 10자 이상 입력해주세요.");
      return;
    }
    setStatementError("");
    onAnalyze(customerCase.statement);
  };

  return (
    <main className="customer-surface">
      <header className="customer-topbar customer-product-header">
        <div><Landmark size={19} /><strong>한결은행</strong><span>재난지원 안내</span></div>
        <div className="customer-product-header__help"><Phone size={15} /><span>고객센터 1588-0000</span></div>
      </header>

      {isApplicationStatus ? (
        <ApplicationStatus customer={customer} status={customerCase.status} onCancel={onCancelApplication} />
      ) : (
        <div className="customer-content">
          <section className="customer-intro">
            <div>
              <Text as="h1" fontSize="30px" lineHeight="40px" fontWeight="bold">{customer.name}님이 확인할 수 있는<br />재난지원 안내가 있어요.</Text>
              <p>한결은행이 보유한 사업장·대출 정보와 재난지원 공지를 대조했습니다. 실제 지원 여부는 피해 확인과 기관 심사를 거쳐 결정됩니다.</p>
            </div>
            <div className="customer-intro__status"><span>피해신고 기한</span><strong>{scenario.reportDday}</strong><small>{scenario.reportDeadline}</small></div>
          </section>

          <section className="customer-block" aria-labelledby="customer-support-heading">
            <div className="customer-section-heading">
              <div><Text as="h2" id="customer-support-heading" fontSize="20px" lineHeight="28px" fontWeight="bold">검토 가능한 지원 3개</Text><p>{customer.business}의 사업장·대출 정보와 일치 가능성이 높은 순서입니다.</p></div>
              <Badge variant="weak" tone="neutral">자격 확인 필요</Badge>
            </div>
            <div className="customer-supports customer-supports--detailed">
              {scenario.supports.map((support, index) => (
                <article key={support.id}>
                  <span>{index + 1}</span>
                  <div>
                    <strong>{support.name}</strong>
                    <p>{support.benefit}</p>
                    <dl><div><dt>신청 기한</dt><dd>{support.deadline}</dd></div><div><dt>필요 서류</dt><dd>{support.documents.join(" · ")}</dd></div></dl>
                  </div>
                  <SupportRouteBadge support={support} />
                </article>
              ))}
            </div>
          </section>

          <section className="customer-block" aria-labelledby="statement-heading">
            <div className="customer-section-heading">
              <div><Text as="h2" id="statement-heading" fontSize="20px" lineHeight="28px" fontWeight="bold">피해 내용 확인</Text><p>말씀해주신 내용을 신청에 필요한 항목으로 정리합니다. AI가 지원 자격을 결정하지 않습니다.</p></div>
              {hasAnalysis && <Badge variant="weak" tone="positive">정리 완료</Badge>}
            </div>
            <div className="customer-statement customer-statement--input">
              <label>
                <span>피해 내용</span>
                <textarea
                  value={customerCase.statement}
                  onChange={(event) => {
                    onStatementChange(event.target.value);
                    if (statementError) setStatementError("");
                  }}
                  rows={4}
                  aria-describedby={statementError ? "statement-error" : "statement-help"}
                  aria-invalid={Boolean(statementError)}
                />
                <small id="statement-help">피해 지역, 시설·물품 피해, 영업에 생긴 어려움을 적어주세요.</small>
                {statementError && <strong className="field-error" id="statement-error">{statementError}</strong>}
              </label>
              <ActionButton variant="neutralSolid" size="medium" onClick={analyzeStatement} disabled={analyzing}>
                <Sparkles size={17} /> {analyzing ? "피해 내용 정리 중…" : hasAnalysis ? "다시 정리하기" : "피해 내용 정리하기"}
              </ActionButton>
            </div>

            {hasAnalysis && (
              <div className="customer-analysis" aria-live="polite">
                {customerCase.customerAnalysisSource === "cache" && <div className="analysis-source-notice"><Bot size={16} /><span>AI 연결을 사용할 수 없어 저장된 예시 분석을 사용했습니다. 내용을 확인한 뒤 신청해주세요.</span></div>}
                <dl className="segment-grid"><div><dt>피해 유형</dt><dd>{analysis.damageType}</dd></div><div><dt>피해 지역</dt><dd>{analysis.location}</dd></div><div><dt>업종</dt><dd>{analysis.businessType}</dd></div><div><dt>피해 정도</dt><dd>{analysis.damageSeverity}</dd></div><div className="segment-grid__wide"><dt>피해 자산</dt><dd>{analysis.affectedAssets.join(" · ")}</dd></div></dl>
                <p><CheckCircle2 size={17} /> {analysis.summary}</p>
              </div>
            )}
          </section>

          <section className="customer-block" aria-labelledby="documents-heading">
            <div className="customer-section-heading">
              <div><Text as="h2" id="documents-heading" fontSize="20px" lineHeight="28px" fontWeight="bold">필요 서류 확인</Text><p>은행 보유정보는 자동 확인하고, 피해확인서만 고객이 준비합니다.</p></div>
              <Badge variant="weak" tone={allDocumentsReady ? "positive" : "warning"}>{allDocumentsReady ? "준비 완료" : "1건 필요"}</Badge>
            </div>
            <div className="document-list">
              <DocumentCheck checked={customerCase.documents.damageCertificate} title="재해피해확인서" description="지자체 발급 서류 · 데모에서는 준비된 서류를 선택합니다." badge={customerCase.documents.damageCertificate ? "준비됨" : "제출 필요"} onChange={(event) => onDocumentChange("damageCertificate", event.target.checked)} locked={false} />
              <DocumentCheck checked title="본인확인 정보" description="한결은행 인증정보로 자동 확인했습니다." badge="자동 확인" onChange={() => {}} locked />
              <DocumentCheck checked title="사업자등록 정보" description="은행 보유 고객정보로 자동 확인했습니다." badge="자동 확인" onChange={() => {}} locked />
            </div>
            <div className="customer-submit">
              <div><ShieldCheck size={21} /><span>제출하면 은행 담당자 확인이 시작되고 지원 여부는 기관 심사 후 결정됩니다.</span></div>
              <ActionButton variant="neutralSolid" size="large" onClick={onSubmit} disabled={!hasAnalysis || !allDocumentsReady}><Send size={18} /> 신청서 제출</ActionButton>
            </div>
          </section>

          <div className="customer-help-strip"><Clock3 size={18} /><div><strong>제출 후 영업일 1일 안에 접수 여부를 확인합니다.</strong><span>도움이 필요하면 한결은행 고객센터 1588-0000으로 문의하세요.</span></div></div>
          <p className="customer-disclaimer">본 화면은 합성 데이터 데모입니다. 지원 자격·승인·지급은 기관별 심사를 거쳐 결정됩니다.</p>
        </div>
      )}
    </main>
  );
}

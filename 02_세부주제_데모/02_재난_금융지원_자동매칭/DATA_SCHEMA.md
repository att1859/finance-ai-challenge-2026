# 데이터 구조

## Scenario

```ts
type Scenario = {
  id: string;
  title: string;
  location: string;
  dateOffsets: {
    occurredDaysAgo: number;
    deadlineDaysFromNow: number;
  };
  noticeText: string;
  noticeAnalysis: NoticeAnalysis;
  supports: SupportProgram[];
  customers: Customer[];
};
```

## Customer

```ts
type Customer = {
  id: string;
  name: string;
  business: string;
  businessType: string;
  region: string;
  loan: string;
  balance: string;
  dueDays: number;
  branch: string;
  affected: boolean;
  statement: string;
  fallbackAnalysis: CustomerAnalysis;
  attributes: {
    hasBusinessInsurance: boolean;
    delinquencyRisk: boolean;
    usesBusinessCard: boolean;
  };
};
```

## ScenarioState

```ts
type ScenarioState = {
  noticeStatus: "idle" | "analyzing" | "analyzed" | "approved";
  noticeAnalysis: NoticeAnalysis | null;
  noticeAnalysisSource: "openai" | "cache" | null;
  selectedCustomerId: string | null;
  publishedCustomerId: string | null;
  cases: Record<string, SupportCase>;
};
```

## SupportCase

```ts
type SupportCase = {
  customerId: string;
  status:
    | "candidate"
    | "ready"
    | "published"
    | "customer_confirmed"
    | "application_submitted"
    | "bank_received"
    | "transferred";
  statement: string;
  customerAnalysis: CustomerAnalysis | null;
  customerAnalysisSource: "openai" | "cache" | null;
  documents: {
    damageCertificate: boolean;
    identity: true;
    businessRegistration: true;
  };
  timestamps: {
    publishedAt?: string;
    submittedAt?: string;
    receivedAt?: string;
    transferredAt?: string;
  };
};
```

## State Ownership

- 공지 상태는 시나리오가 소유한다.
- 고객 선택은 시나리오별로 보존한다.
- 피해 진술, 분석, 서류, 신청 상태는 지원 케이스가 소유한다.
- 고객 앱은 선택 고객이 아니라 `publishedCustomerId`로 연다.
- 한 고객의 상태 변경은 같은 시나리오의 다른 고객에게 영향을 주지 않는다.

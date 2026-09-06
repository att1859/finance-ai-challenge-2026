# Architecture

이 앱은 Vite 기반 단일 페이지 애플리케이션이며, 서버 저장 없이 브라우저 세션에서 계획을 계산한다. 구조 변경의 기준은 화면보다 계산 규칙과 정책 스냅샷이 오래 유지되도록 의존 방향을 단순하게 만드는 것이다.

이 문서는 현재 구현 구조를 설명한다. 추천 엔진과 결과 선택 흐름의 현재 동작은 `PRODUCT.md`를, 상세 계산·판정은 아래 코드 경계와 관련 테스트를 기준으로 확인한다.

## Dependency direction

```text
main
  └─ app
      ├─ application
      │   ├─ domain
      │   └─ policies
      └─ ui
          └─ app selectors
```

- `domain`은 DOM, HTML, URL, 표시 형식을 알지 못한다.
- `policies`는 기준학기·효력일·확인일·공식 링크와 해당 시점의 대출 규칙을 읽기 전용 로컬 스냅샷으로 보관한다.
- `application`은 프로필, 스트레스 조건, 정책을 조립해 하나의 계획 계산 결과를 만든다.
- `app`은 선택 시나리오, 시나리오별 상품·생활비 선택, 결과에서 확인한 자격·상환·기존 대출 조건과 UI 상태를 보관하며 계산 결과를 화면에 전달한다.
- `ui`는 계산하지 않고 전달받은 값의 표시, 입력 읽기, 접근 가능한 상호작용을 담당한다.

## Public seams

- `calculateFundingSummary`는 이번 학기 자금(`semesters=1`, `fundingMonths=6`)과 졸업시계(`remainingSemesters`, `baseStudyMonths`, `studyMonths`)를 분리한다.
- `calculateScenario`는 현재 월소득·이번 학기 등록금 부족분으로 현재 중시·균형·미래 중시 또는 사용자 안을 계산한다. 미래 등록금·생활비 원금을 자동 생성하지 않는다.
- `calculatePlan`은 기준/변경 시나리오, 상품 추천, 한도 참고값과 별도 `baselineNoLoanComparison`/`currentNoLoanComparison`을 반환한다.
- `calculateNoLoanComparison`은 기존·신규 대출 없이 생활비 부족분만 최저시급으로 환산하고 등록금 부족분은 즉시 마련할 금액으로 분리한다. 계산된 시간을 다시 소득에 반영하지 않는다.
- `calculateLoan`은 일반 월별 약정과 취업후 연간 의무상환을 조립한다. 실행일부터 졸업까지 이자와 거치시계는 기존 실행분 상환 모듈을 재사용한다.
- `evaluateLoanEligibility`는 자격·예외·이자면제·유예를 독립 평가하고 `recommendLoanCompositions`는 상품 구성 후보를 비교한다. 취업후 희망 생활비 기준은 제거했다.
- `buildCalculationTrace`는 필요자금→현재 월소득→생활비 신청액→실행→거치이자→상환의 원시값과 정책근거를 보존한다.
- `renderDiagnosisSection`은 6개 입력 단일 폼과 등록금 도움말을 그린다. `readProfile`은 빈 값을 0으로 변환하지 않고 NaN으로 남겨 검증한다.
- 결과 조건 변경은 전체 calculatePlan을 재호출한다. 지원구간은 취업후 상품 추가정보에서 입력하며 재렌더 후 포커스를 복구한다.

## Folders

```text
src/
├─ app/                 상태, 액션, 선택자, 브라우저 이벤트 조립
├─ application/         전체 계획 계산 유스케이스
├─ domain/              자금, 대출, 시나리오, 추천 순수 규칙
├─ policies/            연도별 대출정책 스냅샷
├─ data/                기본값과 가상 예시 프로필
├─ ui/                  섹션 렌더러, 표시 형식, 스타일
├─ assets/
└─ main.js              진입점

tests/
├─ unit/                순수 계산 규칙
├─ integration/         calculatePlan 계약
└─ ui/                  Playwright 사용자 흐름
```

정책 연도나 학기가 바뀌면 기존 파일을 덮어쓰기보다 새 스냅샷을 추가하고 `application`에서 사용할 버전을 명시한다. 외부 API나 서버 저장이 실제로 도입되기 전에는 별도의 repository나 backend 계층을 만들지 않는다.

현재 정책 원본은 src/policies/loans/2026-2.js이며 2026.js는 재수출 경계다. loans/ 아래의 composition·eligibility·disbursement-schedule·general-loan·income-contingent-loan·current-value-comparison이 용도별 실행분, 자격, 월별/연별 상환을 분리한다. 현재 실행분은 1학기이며 기존 다중 실행분 처리 경계는 유지한다.

## 비교와 사용자 입력

`domain/scenarios/timeline.js`는 현재부터 기본·변경 시나리오의 마지막 상환 완료 후 12개월까지 공통 월 원장을 만든다. `summary.collegeLiving`은 이번 학기 상환 차감 전 생활비이며 `collegeAfterRepayment`는 월별 원장의 6개월 평균이다. 상환 요약은 일반 원금 상환 시작과 취업 중 늦은 시점부터 12개월, 일반 대출이 없으면 취업 첫 12개월의 월평균이다. 6개월 후에는 신규 생활비 대출 배분을 반복하지 않는다.

`state.comparison`은 A/B ids, metric, month, view를 보관한다. 생활비 지표는 요약 막대, 상환·잔액은 시간축이다. `ui/formatters/chart-axis.js`가 0과 전체값을 포함한 적절한 눈금을 만든다. SVG 높이·상단을 통일하고 버튼 포커스를 유지해 지표 전환 이동을 줄인다. NO 대출은 상세·추천 후보에 섞지 않는 별도 참조다.

`app/chart-selection.js`는 학기·졸업·취업·상환·연도 시점을 관리한다. 클릭·키보드로 조회 시점을 고정하며 포인터 이동은 무시한다. 월별 표는 전체 행을 유지한다.

`customScenarios`는 id·name·tuitionStrategy·livingPerSemester·candidateId·graceYears·repaymentYears를 사용하며 UI에서 근로시간을 받지 않는다. `custom-scenario.js`는 신청단위 검증을 담당하고 native dialog는 명시적 저장과 취소를 제공한다. 현재 계획에서는 생활비 입력액 하나만 실행한다. SEED 버튼·세그먼트는 기존 shared/seed-controls.js를 재사용한다.

## 첫 화면 안내

`ui/sections/loan-introduction.js`는 원문 다섯 후킹과 상시 노출 설명을 렌더링한다. 금리는 기존 정책 스냅샷에서 가져온다. `styles/introduction.css`는 소개 영역의 원형 그라데이션과 모바일 재배치를 담당한다. `smoothing-explainer.js`는 기존 이름·dialog ID·open/close 액션을 유지하며 등록금 공식 요건 팝업을 렌더링한다. `bootstrap.js`의 native dialog 열기·닫기·스크롤 초기화 동작을 재사용하고 계산 경계는 바꾸지 않는다.

등록금 자금 계약은 availableContribution(가용 자기자금), contributionPerSemester(실제 사용), retainedContribution(남겨두는 금액), minimumLoan 및 principal을 분리한다. 미래·균형·현재는 T−A, T−A/2, T를 사용한다. 생활비 부족분·알바 환산은 이자 차감 전 필요자금만 사용하며 거치이자는 별도 상환 원장에 보존한다.

상환기간 생활비 막대와 상세 요약은 일반 원금 상환 시작·취업 중 늦은 시점부터 12개월을 사용한다. 일반 대출이 없으면 취업 첫 12개월이다. 혼합 상품도 같은 관찰 기간의 실제 원장을 합산한다. 각 안의 상품·용도, 현재부터 경과 개월 및 월평균 상환액을 표시한다. 취업 후 상환은 같은 소득이면 초기 상환액이 같을 수 있으며 잔액·상환 완료 시점으로 차이를 확인한다.

잔액·상환 그래프는 일반 약정 종료와 취업 후 상환 완납 시점을 모두 포함한다. 취업 후 상환 연간 결산은 최대 취업 후 50년까지 계산하며 미완납이면 명시하고 잔액을 0으로 만들지 않는다. 10년 추천 비교 원장은 유지한다. 그래프에 각 안의 상환 완료 시점을 표시한다. 같은 소득·상환율의 취업 후 상환 초기 의무상환액은 같으며, 혼합 구성의 일반 납입액 또는 완납 연도의 잔액 한도 때문에 차이 날 수 있다.

계산 후 repayment-guide에서 자동 스크롤을 멈춘다. 일반 상환(고정금리·약정 일정)과 ICL(변동금리·소득 기준)을 짧게 안내하고 그래프로 이어진다. 첫 상품은 등록금·생활비 모두 일반 상환이며 사용자가 바꾼 선택은 유지한다. 그래프→상세 대상 선택→상환상품 메뉴→상세 지표 순서다. 상품 메뉴는 항상 보이고 기간·생활비 포함·자격·기존 대출은 접힌 추가 조건에 둔다. 라디오·세그먼트·선택 카드에는 기존 토큰의 작은 라운드와 명확한 선택·포커스 표시를 적용한다.

졸업 후 준비기간은 비교용 0·1·2·3년 옵션이다. 한국장학재단 일반 상환 소개의 대출기간 상세(2026-09-06 확인)는 잔여재학년수+기본 3년+가산 3년으로 최장거치기간을 산정하며, 기본 3년은 연수·휴학·졸업 후 유예 각 1년이다. 따라서 졸업 후 준비기간의 공식 최대가 3년이라고 표시하지 않는다. 실제 학제·연령 제한은 신청 시 확인하며 앱은 기존 총 거치기간 상한을 유지한다. 근거: https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_02_01&ttab1=0

모든 비교 지표에서 A/B 선택 바로 아래에 각 안의 등록금·생활비 상환상품과 고정/변동금리를 항상 표시한다. 해당 용도의 신규 대출이 없으면 대출 없음으로 표시하고 상품 변경·시나리오 변경 시 그래프와 함께 갱신한다.

## AI 패널과 API 경계

bootstrap은 mountAiAssistant로 body에 독립 패널을 붙이고 renderResults에서 상태 갱신을 알린다. 계산 domain/application은 수정하지 않는다. app/ai-context.js가 기존 선택자에서 표시 단위가 포함된 사실 묶음만 만든다. 결과 구조 변경 시 이 어댑터를 맞춘다.

app/ai-session.js는 DOM 없이 대화·맥락 버전·취소·재시도를 관리한다. app/ai-chat.js는 패널과 health/chat 요청을 조립한다. ui/sections/ai-assistant.js와 ui/styles/ai-assistant.css는 기존 토큰·SEED 버튼을 사용한다.

server/index.js는 루프백 HTTP 서버와 스키마·Host/Origin·크기·분당/동시 요청 한도를 담당한다. server/ai-provider.js만 Gemini 키와 generateContent 계약을 안다. server/knowledge.js는 제품 의미만 보관하며 자격 판정 엔진을 대체하지 않는다. 공급자 호출은 테스트에서 주입 가능하다.

scripts/dev.js는 Vite와 API를 함께 시작하고 종료한다. Node 24에서 검증하며 native config loader를 사용한다. Vite /api 프록시는 AI_PORT(기본 8787)를 따른다. 키는 서버 환경 변수 또는 Git에서 제외된 .env.local에만 둔다. AI_SETUP.md에 실행과 검증 경계를 기록한다.

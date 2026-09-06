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

- `calculatePlan(profile, stress)`: 프로필의 시나리오별 결과 선택을 반영한 기준·위험조건 시나리오, 네 상품 조합 추천, 풀대출 상한 보기와 사용한 `kosaf-2026-2` 스냅샷 ID를 반환한다.
- `calculateAllScenarios(profile, stress, policySnapshot)`: 생활비 학기·누적 한도와 0.5시간 경계를 적용한 최소대출안·균형안 v1·최대활용안을 만든다. 기본 도메인 호출은 중복 결과를 제거하고 calculatePlan은 preserveDefinitions로 세 정의를 유지한다.
- `calculateFullLoanCapView(profile, stress, policySnapshot)`: 추천과 분리된 생활비 공식 상한, 적용 학기 수와 정책근거를 반환한다.
- `recommendLoanCompositions({ profile, scenario, stress, policySnapshot })`: 네 대출 구성을 계산한 후보를 받아 규칙 등급, 같은 등급의 내부 점수, 이유 코드 순으로 추천·조건 확인·제외 결과를 반환한다.
- `createLoanCompositionDescription(candidate)`: 용도별 상품·원금·자격, 추천·주의·제외 이유 문장과 계산 정책근거를 화면 독립적인 결과 계약으로 만든다.
- `calculateMonthlyWorkIncome({ weeklyHours, hourlyWage, taxPreset })`: 월평균 주 수, 주휴시간, 기본급, 주휴수당, 간편 차감액, 예상 실수령액을 만 원 단위의 반올림되지 않은 값으로 반환한다.
- `createLoanComposition({ policySnapshot, principalByPurpose, principalByPurposeSemester, productByPurpose, semesters })`: 정책이 허용한 등록금·생활비 상품 조합을 실제 학기별 금액의 대출 실행분으로 만들고 실행분마다 정책근거를 연결한다.
- `evaluateLoanEligibility({ applicant, asOfDate, policySnapshot, product, purpose })`: 한 상품·용도의 자격 상태와 누락 조건을 판정하고 자격 예외·이자면제·상환유예를 분리해 반환한다.
- `evaluateLoanEligibilityCombinations({ applicant, asOfDate, policySnapshot })`: 정책이 허용한 네 등록금·생활비 상품 조합을 구성요소별로 판정해 조합 상태를 반환한다.
- `calculateLoan(profile, loanComposition, funding, stress, policySnapshot)`: 혼합 구성을 상품별로 나눠 일반 상환의 실행분별 거치·원리금균등 일정과 합산 월 원장, 취업 후 상환의 연간 예상 의무상환액·월평균 환산액을 별도 결과로 반환한다.
- `currentValueComparison`: 취업 시점부터 일반 상환 120개월 원장과 취업후상환 10개 연도 원장을 현재 소득·생활비·기준소득·금리 불변 가정으로 조립해 총 납부액·이자·잔액을 반환한다.
- `buildCalculationTrace({ profile, scenario, loanComposition, loan })`: 필요자금부터 상환까지 단계 ID와 반올림 전 입출력·학기/월/연 원장을 일정한 순서로 반환한다.
- `buildCalculationPolicyReferences({ scenario, loanComposition, loan, policySnapshot })`: 실제 적용한 한도·자격·금리·상환 정책값에 기준학기·효력일·확인일과 공식 출처를 연결한다.
- 단일 페이지 UI: 직접·예시 기본정보 입력, 세 시나리오 선택, 결과 단계의 대출 조건 선택과 위험 조건 적용을 사용자가 조작하는 경계다.
- `renderLoanOptions(state, scenario)`: 현재 시나리오의 추천·조건확인·대안 후보와 생활비 포함, 일반 상환기간, 필요한 자격, 기존 대출 및 풀대출 상한 제어를 결과에 렌더링한다.
- `renderSelectedDetail(state, scenario)`: 선택 후보의 추천·주의 이유와 생활비 근로감소 효과, 용도별 구성, 상품별 상환 단위, 현재 기준 10년 비교, 학기별 실행 원장과 해당 계산 정책근거를 표시한다.

결과 제어의 `change` 이벤트는 상태와 프로필을 먼저 갱신한 뒤 항상 `calculatePlan` 전체 경계를 다시 호출한다. UI는 대출액·자격·추천·상환을 부분 계산하지 않으며, 재렌더 뒤 조작한 제어로 포커스를 복구하고 라이브 영역에 갱신 범위를 알린다.

입력 프로필은 현재 주당 근로시간과 `workTaxPreset`만 보관하고 계산 금리와 상환방식은 보관하지 않는다. 시나리오 계층은 현재 근로시간부터 0시간까지 0.5시간 후보를 실제 근로소득으로 계산해 최소대출안·균형안 v1·최대활용안을 만들고, 화면에서는 같은 결과도 세 이름을 유지한다. 각 시나리오는 `workHoursReduced`, `workIncomeBreakdown`, `tuitionFunding`, 학기별 `livingLoan`, `unmetLivingGap`, 등록금·생활비 실행분과 상품별 상환 결과를 함께 반환한다. 월 생활비 비교에는 일반 월 납입액과 취업후 연간 예상액의 월평균 환산액 합계를 사용하되 두 법적 상환 단위는 결과 계약에서 합치지 않는다. 각 실행분에는 자격과 세 특례 판정이 연결되고 전체 계획은 네 상품 조합의 자격 결과와 추천과 분리된 풀대출 상한 보기를 함께 반환한다.

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

현재 정책 원본은 `src/policies/loans/2026-2.js`이며 전체 객체를 깊게 동결한다. `src/policies/loans/2026.js`는 기존 import 경계를 유지하는 재수출 파일이다. `src/domain/scenarios/calculate-scenario.js`는 생활비 대출의 0.5시간 탐색, 신청단위·한도, 세 시나리오와 풀대출 상한 보기를 계산한다. `src/domain/scenarios/calculation-trace.js`는 필요자금·근로소득·학기별 실행·거치이자·상환 원시값을 순서가 고정된 추적 원장으로 만든다. `src/domain/loans/policy-references.js`는 계산별 정책값과 기준일·공식 출처를 만들고 추적 단계가 해당 근거 ID를 참조하게 한다. `src/domain/loans/loan-composition.js`는 정책에 허용된 네 상품·용도 조합을 검증하고 실제 학기별 금액의 실행분과 정책근거를 만든다. `src/domain/loans/eligibility.js`는 DOM이나 추천 규칙을 알지 못한 채 자격·특례를 판정한다. `src/domain/loans/composition-description.js`는 추천 계약을 용도별 상품·금액·자격과 사용자용 이유 문장으로 변환한다. `src/domain/loans/disbursement-schedule.js`는 일반 상환 실행분마다 거치·상환 월 일정을 만들고 같은 달의 납입액과 잔액을 합산하며, 기본 기간과 정책 상한 및 졸업 지연 시 기존 약정일 고정을 적용한다. `src/domain/loans/current-value-comparison.js`는 두 상품의 현재 기준 10년 비교 원장을 만든다. `src/domain/recommendations/`는 후보 생성, 규칙, 점수 설정, 이유 코드 변환을 분리하고 추천 규칙에서 대출 계산식을 만들지 않는다. `general-loan.js`와 `income-contingent-loan.js`는 서로의 납입 단위를 공유하지 않으며, `calculate-loan.js`가 정책값과 혼합 구성의 상품별 결과를 조립한다.

## 시간축 비교

`domain/scenarios/timeline.js`의 `buildScenarioTimeline(scenario, endMonth)`가 일반 월별 원장, 취업후 연간 결산 원장, 학기 생활비 배분으로 월별 living·repayment·balance와 요약을 만든다. `calculatePlan`은 기준 졸업 월 + 120을 공통 종료점으로 기준·변경 시나리오에 timeline을 붙인다. UI에 금융 계산식을 두지 않는다.

`state.comparison`은 ids 두 개, metric, month, view를 보관한다. selectedScenarioId는 별도 상세 선택이다. visibleScenarios와 selectedRecommendation은 같은 view를 사용한다. 최초 후보 선택 후 재계산해 그래프와 선택 상품을 맞추고, 대출 0원을 생활비 대출 제외 의사로 해석하지 않는다. 렌더러는 두 선, 클릭 고정·키보드 시점 이동·월별 표와 접이식 상세를 만들며 재렌더 후 포커스와 상세 펼침을 유지한다.
## 사용자 시나리오 입력 경계

state.customScenarios는 안정적인 ID와 이름, workHours, livingPerSemester, livingBySemester, candidateId, graceYears, repaymentYears를 보관한다. 기본 세 정의에 사용자 정의를 추가하고 동일 calculatePlan 경계에서 기준·변경 조건을 계산한다. custom-scenario.js가 실행 단위·입력 검증·증감 규칙을 담당한다. calculate-scenario.js는 사용자 학기 금액을 기존 학기별 실행분 생성에 전달하며 calculationTrace는 manual 모드와 입력/반영액을 보존한다.

app/chart-selection.js는 비교 대상의 학기·졸업·취업·상환 시작/종료·연도 시점을 정렬하고 최근접 시점과 키보드 이동을 제공한다. SVG 클릭만 month를 바꾸고 pointermove는 변경하지 않는다. ui/shared/seed-controls.js는 SEED action-button·segmented-control 레시피를 공유한다. custom-scenario-editor.js는 native dialog와 명시적 저장/취소를 제공하고 검증 성공 후만 앱 상태를 갱신한다. 사용자별 기간은 추천 후보 계산에도 동일하게 전달하며 자격 불가 상품은 자동 선택으로 덮지 않는다.

## 첫 화면 안내

`ui/sections/loan-introduction.js`는 원문 다섯 후킹과 상시 노출 설명을 렌더링한다. 금리는 기존 정책 스냅샷에서 가져온다. `styles/introduction.css`는 소개 영역의 원형 그라데이션과 모바일 재배치를 담당한다. `smoothing-explainer.js`는 기존 이름·dialog ID·open/close 액션을 유지하며 등록금 공식 요건 팝업을 렌더링한다. `bootstrap.js`의 native dialog 열기·닫기·스크롤 초기화 동작을 재사용하고 계산 경계는 바꾸지 않는다.

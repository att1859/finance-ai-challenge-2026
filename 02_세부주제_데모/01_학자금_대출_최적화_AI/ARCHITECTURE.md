# Architecture

이 앱은 Vite 기반 단일 페이지 애플리케이션이며, 서버 저장 없이 브라우저 세션에서 계획을 계산한다. 구조 변경의 기준은 화면보다 계산 규칙과 정책 스냅샷이 오래 유지되도록 의존 방향을 단순하게 만드는 것이다.

이 문서는 현재 구현 구조를 설명한다. 상품별 학기 상환 일정과 분리된 추천 엔진의 목표 책임은 `LOAN_SCENARIO_REDESIGN_SPEC.md`에 정의하며, 관련 작업을 구현·검증한 뒤 이 문서의 공개 경계와 폴더 책임에 반영한다.

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
- `app`은 선택 시나리오와 UI 상태를 보관하며 계산 결과를 화면에 전달한다.
- `ui`는 계산하지 않고 전달받은 값의 표시, 입력 읽기, 접근 가능한 상호작용을 담당한다.

## Public seams

- `calculatePlan(profile, stress)`: 기준 시나리오, 위험 조건 적용 시나리오, 사용한 `kosaf-2026-2` 대출정책 스냅샷 ID를 반환한다.
- `calculateMonthlyWorkIncome({ weeklyHours, hourlyWage, taxPreset })`: 월평균 주 수, 주휴시간, 기본급, 주휴수당, 간편 차감액, 예상 실수령액을 만 원 단위의 반올림되지 않은 값으로 반환한다.
- `createLoanComposition({ policySnapshot, principalByPurpose, productByPurpose, semesters })`: 정책이 허용한 등록금·생활비 상품 조합을 학기별 대출 실행분으로 만들고 실행분마다 정책근거를 연결한다.
- `evaluateLoanEligibility({ applicant, asOfDate, policySnapshot, product, purpose })`: 한 상품·용도의 자격 상태와 누락 조건을 판정하고 자격 예외·이자면제·상환유예를 분리해 반환한다.
- `evaluateLoanEligibilityCombinations({ applicant, asOfDate, policySnapshot })`: 정책이 허용한 네 등록금·생활비 상품 조합을 구성요소별로 판정해 조합 상태를 반환한다.
- `calculateLoan(profile, loanComposition, funding, stress, policySnapshot)`: 혼합 구성을 상품별로 나눠 일반 상환의 원리금균등 월 납입액과 취업 후 상환의 연간 예상 의무상환액·월평균 환산액을 별도 결과로 반환한다.
- 단일 페이지 UI: 직접·예시 입력, 대출 유형 선택, 세 시나리오 선택, 위험 조건 적용을 사용자가 조작하는 경계다.

입력 프로필은 현재 주당 근로시간과 `workTaxPreset`만 보관하고 계산 금리와 상환방식은 보관하지 않는다. 시나리오 계층은 현재 근로시간의 0%·50%·100%에서 0.5시간 단위 근로시간을 만들고, 근로소득 계산 결과의 `netMonthly`를 자금 계산에 사용한다. 각 시나리오는 `workHoursReduced`, `workIncomeBreakdown`, 등록금·생활비 실행분 배열, 용도별 표시 합계와 상품별 상환 결과를 함께 반환해 UI가 계산을 다시 수행하지 않게 한다. 월 생활비 비교에는 일반 월 납입액과 취업후 연간 예상액의 월평균 환산액 합계를 사용하되 두 법적 상환 단위는 결과 계약에서 합치지 않는다. 각 실행분에는 자격과 세 특례 판정이 연결되고 전체 계획은 네 상품 조합의 자격 결과를 함께 반환한다.

## Folders

```text
src/
├─ app/                 상태, 액션, 선택자, 브라우저 이벤트 조립
├─ application/         전체 계획 계산 유스케이스
├─ domain/              자금, 대출, 시나리오 순수 규칙
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

현재 정책 원본은 `src/policies/loans/2026-2.js`이며 전체 객체를 깊게 동결한다. `src/policies/loans/2026.js`는 기존 import 경계를 유지하는 재수출 파일이다. `src/domain/loans/loan-composition.js`는 정책에 허용된 네 상품·용도 조합을 검증하고 학기별 실행분과 정책근거를 만든다. `src/domain/loans/eligibility.js`는 DOM이나 추천 규칙을 알지 못한 채 자격·특례를 판정한다. `src/domain/loans/general-loan.js`와 `income-contingent-loan.js`는 서로의 납입 단위를 공유하지 않으며, `calculate-loan.js`가 정책값과 혼합 구성의 상품별 결과를 조립한다.

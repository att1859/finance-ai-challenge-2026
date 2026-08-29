# Architecture

이 앱은 Vite 기반 단일 페이지 애플리케이션이며, 서버 저장 없이 브라우저 세션에서 계획을 계산한다. 구조 변경의 기준은 화면보다 계산 규칙과 정책 스냅샷이 오래 유지되도록 의존 방향을 단순하게 만드는 것이다.

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
- `policies`는 기준연도·확인일·공식 링크와 해당 시점의 지원 규칙을 보관한다.
- `application`은 프로필, 스트레스 조건, 정책을 조립해 하나의 계획 계산 결과를 만든다.
- `app`은 선택 시나리오와 UI 상태를 보관하며 계산 결과를 화면에 전달한다.
- `ui`는 계산하지 않고 전달받은 값의 표시, 입력 읽기, 접근 가능한 상호작용을 담당한다.

## Public seams

- `calculatePlan(profile, stress)`: 기준 시나리오, 위험 조건 적용 시나리오, 지원사업 판정, 사용한 정책 스냅샷을 반환한다.
- 단일 페이지 UI: 직접·예시 입력, 대출 유형 선택, 세 시나리오 선택, 위험 조건 적용을 사용자가 조작하는 경계다.

## Folders

```text
src/
├─ app/                 상태, 액션, 선택자, 브라우저 이벤트 조립
├─ application/         전체 계획 계산과 지원사업 판정 유스케이스
├─ domain/              자금, 대출, 시나리오, 지원사업 순수 규칙
├─ policies/            연도·학기별 정책 스냅샷
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

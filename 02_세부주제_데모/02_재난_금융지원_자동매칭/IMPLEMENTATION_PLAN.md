# 구현 계획

## 보존

- React·Vite·Seed Design 설치와 빌드 설정
- 기존 색상·타이포그래피·간격 토큰
- 사건 밴드, 7단계 진행선, 공지 분석, 지원 카드의 시각 언어
- 공식 제도 기반 지원 데이터와 OpenAI 구조화 응답 경로

## 교체

- 단일 `App.jsx`의 역할·상태 혼합
- 시나리오 단위 고객 신청 상태
- 고정 날짜와 고정 D-day
- 고객 앱의 담당자 전환 요소와 내부 시스템 문구
- 상위 5명만 보여주는 고정 대기열

## 목표 구조

```text
src/
  app/
    DemoShell.jsx
  domain/
    demoState.js
    dates.js
  features/
    staff/StaffApp.jsx
    customer/CustomerApp.jsx
    shared/WorkflowSpine.jsx
  data/scenarios.js
  lib/matching.js
  App.jsx
  styles.css
```

구현 과정에서 파일 수보다 응집도를 우선한다. 한 파일이 역할이나 상태 소유권 두 개 이상을 가지면 분리한다.

## 구현 루프

1. 날짜·고객·지원 케이스 모델과 테스트
2. 데모 셸 및 역할별 화면 분리
3. 고객 입력·신청 상태와 운영자 접수·이관
4. 대기열 검색·필터·정렬·점수 근거
5. 문구·오류·접근성·반응형 보완
6. 빌드·브라우저·평가단 검증

각 루프는 관련 수용 조건을 통과한 뒤 다음 단계로 진행한다. 마감 검토는 데스크톱과 모바일을 한 번에 보고, 지적 사항은 한 묶음으로 수정한 뒤 한 번만 재검수한다.

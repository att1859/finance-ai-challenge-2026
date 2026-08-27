---
name: "학자금 소비평탄화 AI"
description: "장학금과 감면을 먼저 차감하고 남은 필요자금을 근로와 공적 대출에 배치하는 재정 의사결정 도구"
colors:
  warm-canvas: "#f4f3ee"
  warm-paper: "#fbfaf6"
  field-white: "#ffffff"
  navy-ink: "#102131"
  ledger-navy: "#091622"
  navy-soft: "#213747"
  muted-text: "#5d6870"
  muted-strong: "#46545e"
  rule: "#d5d7d2"
  rule-strong: "#aeb5b4"
  lime-action: "#c9ef3c"
  lime-action-hover: "#b9de2d"
  lime-wash: "#eff7cb"
  evidence-blue: "#315d78"
  evidence-blue-wash: "#e8eff4"
  risk-amber: "#8a5a11"
  risk-amber-wash: "#f6ecd7"
  error-red: "#a23832"
  error-red-wash: "#f7e5e2"
  neutral-wash: "#ececea"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Malgun Gothic, sans-serif"
    fontSize: "clamp(3rem, 5.6vw, 4.8rem)"
    fontWeight: 780
    lineHeight: 1.08
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Malgun Gothic, sans-serif"
    fontSize: "clamp(2rem, 3.4vw, 3rem)"
    fontWeight: 760
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Malgun Gothic, sans-serif"
    fontSize: "1.35rem"
    fontWeight: 740
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Malgun Gothic, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "-0.01em"
  label:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Malgun Gothic, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 720
    lineHeight: 1.45
    letterSpacing: "normal"
  action:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Malgun Gothic, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 720
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  tag: "6px"
  badge: "7px"
  filter: "8px"
  option: "9px"
  control: "10px"
  alert: "12px"
  surface: "16px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "10px"
  md: "18px"
  lg: "28px"
  panel: "34px"
  section: "92px"
components:
  button-primary:
    backgroundColor: "{colors.lime-action}"
    textColor: "{colors.ledger-navy}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 17px"
    height: "46px"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.navy-ink}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 17px"
    height: "46px"
  button-dark:
    backgroundColor: "{colors.ledger-navy}"
    textColor: "{colors.warm-paper}"
    typography: "{typography.action}"
    rounded: "{rounded.control}"
    padding: "0 17px"
    height: "46px"
  input-field:
    backgroundColor: "{colors.field-white}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.control}"
    padding: "0 13px"
    height: "50px"
  filter-chip:
    backgroundColor: "{colors.field-white}"
    textColor: "{colors.muted-strong}"
    typography: "{typography.label}"
    rounded: "{rounded.filter}"
    padding: "0 11px"
    height: "36px"
  allocation-ledger:
    backgroundColor: "{colors.ledger-navy}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.surface}"
    padding: "30px"
  scenario-matrix:
    backgroundColor: "{colors.warm-paper}"
    textColor: "{colors.navy-ink}"
    rounded: "{rounded.surface}"
  stress-workbench:
    backgroundColor: "{colors.ledger-navy}"
    textColor: "{colors.warm-paper}"
    rounded: "{rounded.surface}"
---

# Design System: 학자금 소비평탄화 AI

## Overview

**Creative North Star: "The Scholarship-First Ledger"**

이 시스템은 금융 선택을 성과판처럼 점수화하지 않고, 총필요자금에서 상환 의무가 없는 지원을 먼저 빼고 남은 부담만 배치하는 원장으로 설명한다. 따뜻한 종이색 바탕은 학생의 생활 맥락을 품고, 깊은 남색 면은 계산과 책임의 경계를 또렷하게 만든다. 절제된 라임은 장식이 아니라 사용자가 실제로 누르거나 선택한 순간에만 나타난다.

정보는 KPI 카드 묶음이 아니라 약속, 조건, 배분 관계, 비교, 위험, 근거의 선형 논리로 읽힌다. 면은 대부분 평평하고 얇은 규칙선이 항목 사이의 관계를 유지한다. 거대한 숫자를 독립된 성과로 전시하지 않고, 언제나 금액의 출처·차감·남은 격차와 붙여 보여준다.

**Key Characteristics:**

- 따뜻한 오프화이트 캔버스와 심해색 원장이 만드는 공공 금융 문서의 신뢰감
- 장학금 우선 차감을 중심으로 한 배분 관계와 반복되는 원장 문법
- 버튼·선택·기본 제안에만 제한되는 라임 신호
- 카드 모음 대신 규칙선, 행, 열, 비교표로 만드는 조용한 정보 밀도
- 결과와 함께 가정·미확인 정보·공식기관 경계를 인접 배치하는 증거 중심 태도

## Colors

팔레트는 따뜻한 종이 중립색, 깊은 청색 잉크, 희소한 라임 행동색, 그리고 증거와 위험을 구분하는 낮은 채도의 의미색으로 구성한다.

### Primary

- **Action Lime** (`lime-action`): 주요 CTA, 선택된 필터와 옵션, 기본 제안 표시처럼 사용자의 다음 행동이나 현재 선택을 나타낸다.
- **Pressed Lime** (`lime-action-hover`): 라임 행동 요소의 호버 상태에만 사용한다.
- **Support Wash** (`lime-wash`): 장학금 우선 차감처럼 지원이 배분을 바꾼다는 사실을 낮은 강도로 묶는다.

### Secondary

- **Evidence Blue** (`evidence-blue`, `evidence-blue-wash`): 정보 부족, 근거, 중립적 안내처럼 사실 확인이 필요한 상태를 나타낸다.
- **Risk Amber** (`risk-amber`, `risk-amber-wash`): 추가 심사와 스트레스 조건처럼 주의가 필요하지만 오류는 아닌 상태를 나타낸다.
- **Boundary Red** (`error-red`, `error-red-wash`): 입력 오류, 대상 아님, 계산 불가처럼 사용자가 확인하거나 수정해야 하는 경계를 나타낸다.

### Neutral

- **Warm Canvas** (`warm-canvas`): 전체 작업 공간을 감싸는 기본 바탕이다.
- **Warm Paper** (`warm-paper`): 비교표, 폼, 근거 영역의 평평한 작업 면이다.
- **Field White** (`field-white`): 입력 필드처럼 상호작용이 가능한 밝은 면을 캔버스에서 한 단계 분리한다.
- **Ledger Navy** (`ledger-navy`): 배분 원장, 위험 작업대, 추천 근거처럼 책임 있는 계산을 다루는 어두운 면이다.
- **Navy Ink** (`navy-ink`)과 **Soft Navy** (`navy-soft`): 제목, 본문, 링크의 주된 읽기 색이다.
- **Muted Text** (`muted-text`, `muted-strong`): 설명, 단위, 제한사항의 위계를 낮추되 가독성은 유지한다.
- **Rules** (`rule`, `rule-strong`): 행과 구획의 관계를 보존하는 1px 선이다.
- **Neutral Wash** (`neutral-wash`): 비활성·기본 상태를 조용히 구분한다.

**The Lime Is a Verb Rule.** 라임은 누르기, 선택하기, 우선 적용하기처럼 상태를 바꾸는 의미가 있을 때만 쓴다.

**The Semantic Role Rule.** 파랑은 근거, 호박은 주의, 빨강은 오류와 경계에 고정하며 서로의 역할을 바꾸지 않는다.

## Typography

**Display Font:** Pretendard Variable (Pretendard와 시스템 산세리프 폴백)
**Body Font:** Pretendard Variable (Pretendard와 시스템 산세리프 폴백)

**Character:** 한글과 숫자를 같은 목소리로 다루는 단일 가변 산세리프 시스템이다. 제목은 촘촘하고 단호하며, 설명은 여유 있는 행간으로 읽히고, 원장 숫자는 탭형 정렬로 배분 관계가 흔들리지 않는다.

### Hierarchy

- **Display** (780, `display`, 1.08): 첫 약속처럼 한 화면에 하나만 존재하는 가장 큰 문장에 사용한다.
- **Headline** (760, `headline`, 1.2): 각 판단 구획의 질문과 결과 진입점에 사용한다.
- **Title** (740, `title`, 1.3): 폼 묶음, 비교 열, 근거 그룹의 제목에 사용한다.
- **Body** (400, `body`, 1.7): 설명과 경계 문구에 사용하며 읽기 폭은 대체로 65–70자로 제한한다.
- **Label** (720, `label`, 1.45): 상태, 단위, 짧은 메타 정보에 사용한다.
- **Action** (720, `action`, 1): 버튼과 독립 행동의 짧은 문구에 사용한다.

**The Ledger Number Rule.** 금액과 시간은 `tabular-nums`로 정렬하고, 숫자만 떼어내기보다 무엇에서 무엇을 뺀 값인지 같은 면에서 읽히게 한다.

**The One-Family Rule.** 장식 서체나 별도 모노스페이스를 추가하지 않고 크기, 굵기, 자간, 행간으로 위계를 만든다.

## Layout

기본 컨테이너는 최대 1240px이며 데스크톱 좌우에 32px 여백을 둔다. 큰 구획은 대체로 92px의 세로 리듬과 1px 상단 규칙선을 공유한다. 시스템은 설명과 증거, 전과 후, 입력과 결과를 나란히 놓아 관계를 먼저 보여주고, 독립 KPI 타일을 반복하지 않는다. 내부 데이터는 2–3열 그리드와 행 기반 목록을 사용하며 패널 내부 여백은 주로 28–34px이다.

1080px 이하에서는 첫 화면을 1열로 바꾸고 세 시나리오를 가로 카드 묶음이 아닌 행형 비교 매트릭스로 재조립한다. 820px 이하에서는 탐색 링크를 숨기고 폼·자금관계·스트레스 작업대·근거 열을 한 열로 전환한다. 580px 이하에서는 좌우 여백을 12px로 줄이고 폼을 1열로 만들며, 독립 링크·필터·행동은 최소 44px 터치 영역을 갖는다.

**The Relationship Before Tile Rule.** 숫자 하나를 카드에 고립시키지 말고 출처, 차감, 결과 또는 기준과 같은 구조 안에 둔다.

**The Reflow Preserves Meaning Rule.** 반응형 전환은 정보의 순서를 유지하며, 나란히 보던 관계는 모바일에서 같은 순서의 세로 흐름으로 바뀐다.

## Elevation & Depth

시스템은 평면이 기본이며 정적인 카드에는 상시 그림자를 두지 않는다. 깊이는 따뜻한 캔버스와 종이면의 미세한 색 차이, 1px 규칙선, 깊은 남색 원장 면의 전환으로 만든다. 유일한 확산 효과는 키보드 포커스 위치를 보장하는 라임 헤일로이며 시각적 장식으로 재사용하지 않는다.

### Shadow Vocabulary

- **Keyboard Focus Halo** (`0 0 0 6px rgba(201, 239, 60, 0.65)`): 2px 남색 외곽선 바깥에서 키보드 탐색 위치를 분명하게 표시한다.

**The Flat Evidence Rule.** 위계를 만들기 위해 그림자를 쌓지 않고 면의 톤, 규칙선, 여백, 어두운 원장 전환을 사용한다.

## Shapes

핵심 작업 면은 절제된 16px 모서리를 공유하고, 입력과 버튼은 10px, 필터와 작은 선택지는 8–9px로 더 조밀하다. 상태 배지는 6–7px이며 세션 상태처럼 작은 독립 표지만 완전한 pill을 쓴다. 대부분의 경계는 1px이고, 선은 둥근 카드의 윤곽보다 내부 항목의 관계를 드러내는 데 더 자주 사용한다.

**The Bounded Curve Rule.** 큰 면의 최대 반경은 16px로 제한하고, 컨테이너 안의 모든 행을 다시 카드로 감싸지 않는다.

## Components

### Buttons

- **Shape:** 기본 높이 46px, 조밀한 10px 모서리, 좌우 17px 여백을 사용한다. 큰 계산 CTA만 54px 높이와 22px 좌우 여백을 쓴다.
- **Primary:** 라임 면과 깊은 남색 텍스트로 다음 단계 또는 계산 실행을 표시한다.
- **Secondary:** 투명 면과 강한 규칙선으로 샘플 불러오기 같은 대안을 제공한다.
- **Dark:** 깊은 남색 면과 따뜻한 종이색 텍스트로 어두운 작업 구획의 행동이나 보조 진입점을 표시한다.
- **Hover / Focus:** 호버에서는 1px만 상승하고 색을 한 단계 바꾼다. 포커스는 공통 남색 외곽선과 라임 헤일로를 사용하며 비활성 상태는 움직이지 않는다.

### Chips

- **Style:** 필터는 36px 높이와 8px 모서리, 체크 선택지는 최소 42px 높이와 9px 모서리를 사용한다.
- **State:** 선택 전에는 흰 면과 규칙선, 선택 후에는 남색 면 또는 라임 면으로 즉시 반전한다. 상태 배지는 색 테두리와 작은 레이블을 사용하고 장식 태그로 확장하지 않는다.

### Cards / Containers

- **Corner Style:** 핵심 작업 면에 16px 반경을 사용한다.
- **Background:** 기본은 따뜻한 종이면, 계산·추천·스트레스는 깊은 남색 면이다.
- **Shadow Strategy:** 상시 그림자 없음. 깊이는 면 전환과 경계선으로 해결한다.
- **Border:** 밝은 면에는 1px 규칙선을 사용하고, 목록 항목은 개별 카드 대신 행 구분선을 사용한다.
- **Internal Padding:** 큰 패널은 28–34px, 데이터 행은 16–26px 범위를 사용한다.

### Inputs / Fields

- **Style:** 높이 50px, 10px 모서리, 강한 중립선과 흰 면을 사용한다. 단위는 필드 우측에 고정하고 숫자는 탭형 정렬을 유지한다.
- **Focus:** 2px 남색 외곽선과 6px 라임 헤일로로 현재 위치를 명확히 표시한다.
- **Error / Disabled:** 오류는 붉은 경계와 연한 붉은 면을 함께 쓰고, 상단 오류 요약에서 해당 필드로 이동할 수 있게 한다. 비활성 버튼은 투명도를 낮추고 이동 효과를 제거한다.

### Navigation

상단 탐색은 78px 높이의 평면 헤더와 하단 규칙선으로 구성한다. 브랜드는 원장 행을 연상시키는 선형 마크를 쓰고 텍스트 링크는 장식 없는 남색 레이블로 유지한다. 820px 이하에서는 핵심 세션 상태와 브랜드만 남겨 진단 흐름을 우선한다.

### Allocation Ledger

시스템의 서명 컴포넌트다. 깊은 남색 면에서 총필요자금, 교육비·생활소비 구성, 장학금 차감, 남은 근로·대출 부담을 한 번의 산술 흐름으로 보여준다. 라임은 차감되는 지원 금액과 하단 진행 규칙선에만 사용하며, 개별 KPI 카드나 장식 차트를 만들지 않는다.

### Scenario Matrix

세 선택은 동일한 행 순서와 단위로 비교한다. 데스크톱에서는 3열 표처럼 이어지고, 좁아지면 시나리오별 행형 패널로 재배치되며 모바일에서는 한 열로 쌓인다. 기본 제안은 라임 표식과 옅은 면 차이로 드러내되 사용자의 최종 선택처럼 과장하지 않는다.

### Evidence Rows & Boundaries

지원사업 목록, 공식 출처, 가정, 아직 모르는 정보는 카드가 아니라 구분선이 있는 행으로 표현한다. 상태, 이유, 메타 정보, 공식 링크가 같은 행 안에서 이어져 사용자가 결과를 재검증할 수 있게 한다.

**The Whole Row Is Evidence Rule.** 상태나 금액만 강조하지 말고 이유, 출처, 기준일, 다음 확인 행동을 같은 읽기 단위에 둔다.

## Do's and Don'ts

### Do:

- **Do** 장학금과 감면을 먼저 차감한 뒤 남은 금액만 근로와 대출로 배치하는 원장 관계를 유지한다.
- **Do** 따뜻한 오프화이트 캔버스, 깊은 남색 계산 면, 희소한 라임 행동색의 역할을 일관되게 지킨다.
- **Do** 금액을 출처·가정·차감·남은 격차와 함께 보여주고 탭형 숫자로 비교 정렬을 유지한다.
- **Do** 결과 가까이에 미확인 정보, 공식기관 링크, 데모 경계를 배치한다.
- **Do** 1080px, 820px, 580px 리플로에서 정보 순서와 최소 44px 모바일 행동 영역을 보존한다.
- **Do** `prefers-reduced-motion`에서 스크롤, 애니메이션, 전환을 사실상 즉시 완료한다.

### Don't:

- **Don't** 독립 KPI 카드, 거대한 숫자 타일, 사이드바형 금융 SaaS 대시보드로 재구성한다.
- **Don't** 그라디언트, 글래스모피즘, 상시 그림자, 장식적 AI 스파클을 추가한다.
- **Don't** 라임을 넓은 배경이나 의미 없는 장식에 사용한다.
- **Don't** 지원사업과 시나리오의 근거를 숨기거나 추천을 공식 자격·승인 결과처럼 표현한다.
- **Don't** 모든 행을 다시 둥근 카드로 감싸 정보의 관계와 원장 리듬을 끊는다.
- **Don't** 구조 참고 제품의 시각 스타일을 복제하거나 이 제품의 공공 금융 문서 톤을 소비자 투자 앱처럼 바꾼다.

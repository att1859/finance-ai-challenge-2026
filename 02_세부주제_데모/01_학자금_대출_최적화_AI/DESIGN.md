---
name: "학자금 소비평탄화 AI"
description: "세 가지 대학 생활 계획의 현재 시간과 미래 부담을 같은 축에서 비교하는 선택형 재정 원장"
colors:
  ledger-navy: "#091622"
  ink-secondary: "#243341"
  muted-text: "#65717a"
  warm-paper: "#f4f3ee"
  muted-paper: "#ebeae4"
  warm-white: "#fffefa"
  rule: "#c9ccc8"
  rule-strong: "#8e9799"
  lime-selection: "#c9ef3c"
  lime-wash: "#e8f6b7"
  evidence-blue: "#315f7a"
  boundary-rose: "#a54d42"
  caution-amber: "#865b13"
  focus-blue: "#1769aa"
typography:
  display:
    fontFamily: "Noto Sans KR UI, Malgun Gothic, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 5.7vw, 5.4rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Noto Sans KR UI, Malgun Gothic, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3.3rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Noto Sans KR UI, Malgun Gothic, system-ui, sans-serif"
    fontSize: "clamp(1.55rem, 2.8vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.18
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Noto Sans KR UI, Malgun Gothic, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "Noto Sans KR UI, Malgun Gothic, system-ui, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: "normal"
  action:
    fontFamily: "Noto Sans KR UI, Malgun Gothic, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "normal"
rounded:
  field: "6px"
  button: "7px"
  choice: "8px"
  surface: "12px"
  detail: "16px"
  ledger: "18px 18px 18px 4px"
  detail-ledger: "16px 16px 16px 4px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "10px"
  md: "20px"
  lg: "28px"
  panel: "34px"
  section: "96px"
components:
  button-primary:
    backgroundColor: "{colors.ledger-navy}"
    textColor: "{colors.warm-white}"
    typography: "{typography.action}"
    rounded: "{rounded.button}"
    padding: "0 19px"
    height: "48px"
  button-quiet:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.ledger-navy}"
    typography: "{typography.action}"
    rounded: "{rounded.button}"
    padding: "0 19px"
    height: "48px"
  input-field:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.ledger-navy}"
    rounded: "{rounded.field}"
    padding: "0 13px"
    height: "48px"
  loan-choice:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.ledger-navy}"
    rounded: "{rounded.choice}"
    padding: "17px 18px"
    height: "96px"
  scenario-option:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.ledger-navy}"
    rounded: "{rounded.surface}"
    padding: "20px"
    height: "132px"
  comparison-figure:
    backgroundColor: "{colors.warm-white}"
    textColor: "{colors.ledger-navy}"
    rounded: "{rounded.surface}"
    padding: "34px"
  selected-detail:
    backgroundColor: "{colors.ledger-navy}"
    textColor: "{colors.warm-white}"
    rounded: "{rounded.detail-ledger}"
    padding: "42px"
---

# Design System: 학자금 소비평탄화 AI

## Overview

**Creative North Star: "The Comparative Ledger"**

이 시스템은 대학 생활 계획을 하나의 점수나 자동 추천으로 축약하지 않고, 사용자가 세 안을 직접 고른 뒤 지금의 시간과 미래의 부담을 같은 자리에서 비교하게 한다. 따뜻한 종이 바탕은 입력과 근거를 차분히 읽게 하고, 깊은 남색 원장은 선택한 안의 계산 결과를 책임 있는 상세로 묶는다. 라임은 행동과 현재 선택을 표시하지만 어느 안이 객관적 정답이라고 주장하지 않는다.

시각 문법은 KPI 카드 묶음보다 입력 행, 선택 그룹, 통합 비교 막대, 접근 가능한 표, 자금 원장을 우선한다. 숫자는 독립된 성과가 아니라 희망 기준, 현재 기준, 계산 가정, 대출유형과 함께 읽힌다. 균형형은 화면을 이해하기 위한 최초 보기일 뿐 추천이 아니며, 사용자가 바꾸는 선택이 모든 상세와 위험 계산의 중심이다.

**Key Characteristics:**

- 따뜻한 종이색 바탕과 심해색 선택 상세가 만드는 차분한 공공 금융 도구
- 세 시나리오를 먼저 선택하고 동일한 세 지표를 한 그룹에서 비교하는 구조
- 현재 선택에만 쓰이는 라임 막대, 안쪽 링, 짧은 상태 표식
- 카드 모음 대신 행·열·표·원장으로 이어지는 계산 문법
- 졸업기간, 대출유형, 공식 경계를 결과 가까이 드러내는 증거 중심 태도

## Colors

팔레트는 따뜻한 중립 종이, 깊은 청색 잉크, 선택을 표시하는 라임, 근거와 경계를 구분하는 낮은 채도의 의미색으로 구성한다.

### Primary

- **Ledger Navy** (ledger-navy): 주요 텍스트, 기본 CTA, 선택안 상세, 원장 면에 사용한다.
- **Selection Lime** (lime-selection): 선택된 시나리오, CTA 화살표, 단계 번호, 비교 막대처럼 현재 행동과 선택에 사용한다.
- **Selection Wash** (lime-wash): 정책 안내와 자동 매칭 상태처럼 낮은 강도의 선택·정보 배경에 사용한다.

### Secondary

- **Evidence Blue** (evidence-blue): 근로·대출 차감처럼 계산 항목의 정보 역할을 표시한다.
- **Boundary Rose** (boundary-rose): 입력 오류, 계산 불가, 부족 상태를 나타낸다.
- **Caution Amber** (caution-amber): 소비평탄화 교육 설명에서 조건과 위험을 알리는 주의 정보에 사용한다.

### Tertiary

- **Focus Blue** (focus-blue): 키보드 포커스 외곽선 전용이다. 라임 선택 상태와 포커스 위치가 혼동되지 않게 한다.

### Neutral

- **Warm Paper** (warm-paper): 페이지 전체의 기본 바탕이다.
- **Muted Paper** (muted-paper): 안내, 표 제목, 총액 행, 가정 면을 한 단계 구분한다.
- **Warm White** (warm-white): 입력, 선택지, 비교표와 출처 면의 상호작용 표면이다.
- **Secondary Ink** (ink-secondary)과 **Muted Text** (muted-text): 설명, 메타 정보, 단위를 낮은 위계로 유지한다.
- **Rules** (rule, rule-strong): 행·열·표·입력의 관계를 보존하는 1px 선이다.

**The Lime Marks Choice Rule.** 라임은 행동, 선택, 단계 진행에만 쓰며 최초 표시 상태를 추천처럼 장식하지 않는다.

**The Calculation Boundary Rule.** 파랑은 계산에 반영된 정보, 호박은 미반영 후보, 장미색은 오류와 부족에 고정한다.

## Typography

**Display Font:** Noto Sans KR UI (Malgun Gothic과 시스템 산세리프 폴백)
**Body Font:** Noto Sans KR UI (Malgun Gothic과 시스템 산세리프 폴백)

**Character:** 한글의 줄바꿈과 숫자 비교를 안정시키는 단일 가변 산세리프 체계다. 실제 글꼴 파일은 `src/assets/NotoSansKR-UI.woff2`에 번들되며 100–900 가중치 범위와 swap 로딩을 사용한다. 제목은 촘촘하고 본문은 넉넉하게 읽히며, 계산 숫자는 탭형 정렬로 열의 흔들림을 줄인다.

### Hierarchy

- **Display** (700, display, 1.18): 첫 화면의 한 문장 약속에 사용한다.
- **Headline** (700, headline, 1.18): 입력과 결과의 큰 진입점에 사용한다.
- **Title** (700, title, 1.18): 비교, 지원, 스트레스, 출처 구획의 제목에 사용한다.
- **Body** (400, body, 1.65): 입력 안내, 계산 설명, 경계 문구에 사용한다.
- **Label** (700, label, 1.45): 상태, 단위, 표 메타 정보, 선택 표식에 사용한다.
- **Action** (700, action, 1): 버튼과 독립 행동의 짧은 문구에 사용한다.

**The Comparison Number Rule.** 금액과 시간은 `tabular-nums`로 정렬하고 희망·현재·선택 기준과 같은 읽기 단위 안에 둔다.

**The Bundled Voice Rule.** 외부 CDN 서체에 의존하지 않고 번들된 Noto Sans KR UI와 명시된 시스템 폴백만 사용한다.

## Layout

기본 컨테이너는 최대 1180px이며 데스크톱 좌우에 28px 안쪽 여백을 둔다. 첫 화면은 약속과 세 비교축 원장을 1.08 대 0.92 비율로 나누고, 입력 폼은 250px 설명 열과 가변 입력 열을 짝지은 행 기반 구조다. 결과는 시나리오 선택, 통합 비교, 선택 상세, 자금 원장, 스트레스, 출처가 하나의 세로 판단 흐름을 만든다.

1080px 이하에서는 첫 화면의 두 열을 유지하되 간격을 줄이고, 3열 입력은 2열로, 선택 상세 지표는 4열에서 2열로, 출처는 3열에서 2열로 바뀐다. 820px 이하에서는 첫 화면·폼·결과 소개·시나리오 선택·대출 상세·스트레스가 한 열로 전환되고 비교표는 가로 스크롤을 허용한다. 580px 이하에서는 좌우 여백을 18px로 줄이고 비교와 선택 상세를 화면 가장자리까지 확장하며 대부분의 제어와 데이터 그룹을 1열로 쌓는다. 360px 이하에서는 좌우 여백을 15px로 줄이고 선택 상세 지표도 1열이 된다.

**The Selection-to-Detail Rule.** 선택 그룹, 통합 비교, 선택안 상세는 분리된 화면이 아니라 같은 흐름에서 즉시 이어져야 한다.

**The Reflow Preserves Comparison Rule.** 반응형 전환은 세 안의 순서와 세 지표의 순서를 보존하고, 시각 막대와 접근 가능한 표의 정보 일치를 유지한다.

## Elevation & Depth

정적인 면에는 드롭 섀도를 사용하지 않는다. 깊이는 따뜻한 종이와 흰 면의 톤 차이, 1px 규칙선, 깊은 남색 상세 면으로 만든다. 선택된 시나리오만 3px 라임 안쪽 링을 사용하고, 키보드 포커스는 별도의 3px 파란 외곽선으로 표시한다.

### Shadow Vocabulary

- **Selected Option Inset** (inset 0 0 0 3px selection lime): 현재 시나리오 선택지의 경계를 컨테이너 안에서 표시한다.

**The No Drop Shadow Rule.** 선택 상태의 안쪽 링 외에는 그림자를 사용하지 않고 면, 선, 여백으로 위계를 만든다.

## Shapes

입력은 6px, 버튼은 7px, 선택 제어는 8px, 비교 면은 12px 반경을 사용한다. 핵심 남색 원장은 좌상·우상·우하를 크게 둥글리고 좌하를 4px로 접어 문서 같은 방향성을 만든다. 짧은 계산 단위 표식은 pill을 사용한다. 대부분의 경계는 1px이며 선택과 총액 시작선만 2–3px로 강화한다.

**The Ledger Corner Rule.** 큰 남색 결과 면은 한쪽 아래가 각진 비대칭 원장 실루엣을 유지하고 일반 입력 카드에 이를 남용하지 않는다.

## Components

### Buttons

- **Shape:** 기본 높이 48px, 7px 모서리, 좌우 19px 여백을 사용한다. 최종 계산 버튼은 56px 높이와 24px 좌우 여백을 사용한다.
- **Primary:** 깊은 남색 면, 따뜻한 흰색 텍스트, 라임 화살표로 계산과 다음 단계 행동을 표시한다.
- **Quiet:** 따뜻한 흰 면과 중립 경계로 예시 정보 같은 대안을 제공한다.
- **Hover / Focus:** 호버는 1px 상승하고 색·경계만 바꾼다. 포커스는 3px 파란 외곽선과 3px 오프셋을 사용한다.

### Cards / Containers

- **Corner Style:** 선택 그룹과 비교 면은 12px, 선택 상세는 비대칭 16px/4px 원장 실루엣을 사용한다.
- **Background:** 입력·비교·출처는 따뜻한 흰 면, 선택 상세는 깊은 남색 면이다.
- **Shadow Strategy:** 드롭 섀도 없음. 선택 옵션에만 라임 안쪽 링을 사용한다.
- **Border:** 1px 규칙선을 기본으로 하고 표·총액·구획 시작은 2px 남색 선을 쓴다.
- **Internal Padding:** 선택지는 20px, 비교 면은 34px, 선택 상세는 42px이다.

### Inputs / Fields

- **Style:** 높이 48px, 6px 모서리, 강한 중립선과 따뜻한 흰 면을 사용한다. 단위는 입력 우측에 고정한다.
- **Focus:** 전역 3px 파란 외곽선으로 현재 위치를 표시한다.
- **Error / Disabled:** 오류는 장미색 경계와 인접 오류 문구를 함께 쓰고 첫 오류 필드로 포커스를 옮긴다.
- **Work Income Summary:** 생활과 근로 입력 아래의 규칙선 면에서 예상 실수령액을 먼저 보여주고 기본급·주휴수당·간편 차감 내역과 가정을 낮은 위계로 이어 표시한다.

### Navigation

72px 높이의 평면 헤더에 브랜드와 세 앵커 링크를 둔다. 브랜드 마크는 남색 원 안의 라임 글자로 구성하고, 820px 이하에서는 메뉴를 숨겨 입력 흐름에 집중한다. 본문 바로가기 링크는 포커스 시 화면에 나타난다.

### Input Mode & Loan Type Choices

입력 방식은 두 개의 72px 행으로, 대출유형은 두 개의 96px 선택 면으로 제시한다. 선택된 입력 방식은 남색 면으로 반전하고, 선택된 대출유형은 2px 남색 경계와 라임 중심의 라디오로 표시한다. 대출유형에 따라 일반 상환 입력과 취업 후 상환 정책 안내가 조건부로 바뀐다.

### Scenario Selector

세 시나리오는 하나의 라디오 그룹 안에서 동일한 크기와 문장 구조로 제시한다. 각 선택지는 현재 근로시간에서 파생한 주당 시간과 감소량을 함께 보여준다. 균형형의 “기본 보기”는 최초 상태 설명이고, 현재 사용자가 고른 안에만 “내 선택”과 라임 안쪽 링이 붙는다. 선택 변화는 비교, 상세, 자금 원장, 스트레스에 즉시 반영되고 스크린리더 상태 메시지로도 안내한다.

### Grouped Comparison

대학 시절 월 생활비 여력, 주당 근로시간, 상환 후 월 생활비 여력을 하나의 figure 안에서 비교한다. 각 지표 안에서만 막대 길이를 비교하고 생활비에는 희망 기준, 근로시간에는 현재 기준을 표시한다. 동일 내용을 표로도 제공해 단위와 정확한 값을 보존한다.

### Selected Detail & Funding Ledger

선택 상세는 남색 원장 면에서 네 핵심 지표, 현재 대비 근로시간 감소량, 대출유형별 상환값, 계산 가정, 인접 시나리오 차이를 이어 보여준다. 이어지는 밝은 자금 원장은 졸업기간을 학기·개월로 변환하고 등록금과 희망 생활비를 합산한 뒤 주휴수당·간편 차감이 반영된 예상 실수령 근로소득과 신규 대출을 차감한다.

### Stress & Sources

스트레스 제어는 선택안만 다시 계산하고 기준 대비 변화량을 보여준다. 출처 영역은 두 대출유형의 공식 정보와 계산에서 제외한 가정을 같은 레벨로 공개한다.

**The Default Is Not a Recommendation Rule.** “기본 보기”는 최초 렌더링 상태를 뜻하며 추천, 최적안, 승인 결과를 의미하지 않는다.

## Do's and Don'ts

### Do:

- **Do** 사용자가 세 시나리오를 직접 선택하고 세 핵심 지표를 하나의 그룹에서 비교하게 한다.
- **Do** 학기당 실제 납부 등록금과 희망 생활비를 계산의 필요자금으로 반영한다.
- **Do** 졸업기간과 대출유형을 총필요자금·실행 횟수·이자·상환 결과의 계산축으로 드러낸다.
- **Do** 균형형을 “기본 보기”로만 표현하고 현재 선택에는 “내 선택”을 명확히 표시한다.
- **Do** 시각 비교와 스크린리더용 표·상태 알림의 값과 단위를 일치시킨다.
- **Do** 번들된 Noto Sans KR UI, 1080/820/580/360px 리플로, 최소 44px 모바일 독립 행동 영역을 유지한다.

### Don't:

- **Don't** 균형형을 추천, 최적안, 정답으로 소개한다.
- **Don't** 세 지표를 서로 다른 화면이나 독립 KPI 카드로 흩어 비교 비용을 높인다.
- **Don't** 그라디언트, 글래스모피즘, 드롭 섀도, 장식적 AI 스파클을 추가한다.
- **Don't** 대출유형별 상환 차이, 졸업기간, 계산 가정, 공식기관 경계를 결과에서 떼어낸다.
- **Don't** 외부 서체 CDN에 의존하거나 모든 행을 다시 둥근 카드로 감싼다.

---
name: "SLOW (Student Loan Operating Window)"
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

# Design System: SLOW (Student Loan Operating Window)

## Overview

**Creative North Star: "The Comparative Ledger"**

이 시스템은 대학 생활 계획을 하나의 점수나 자동 선택으로 축약하지 않고, 사용자가 세 시나리오를 직접 고른 뒤 지금의 시간과 미래의 부담을 같은 자리에서 비교하게 한다. 선택한 시나리오 안에서는 규칙형 추천이 대출 구성을 좁히되 사용자가 조건을 확인하고 바꿀 수 있다. 따뜻한 종이 바탕은 입력과 근거를 차분히 읽게 하고, 깊은 남색 원장은 선택 결과를 책임 있는 상세로 묶는다.

시각 문법은 KPI 카드 묶음보다 입력 행, 선택 그룹, 시간축 비교 선, 접근 가능한 표, 자금 원장을 우선한다. 숫자는 독립된 성과가 아니라 희망 기준, 현재 기준, 계산 가정, 대출유형과 함께 읽힌다. 균형은 시나리오의 최초 보기일 뿐 추천 시나리오가 아니며, 사용자가 바꾸는 시나리오와 대출 구성이 모든 상세와 위험 계산의 중심이다.

**Key Characteristics:**

- 따뜻한 종이색 바탕과 심해색 선택 상세가 만드는 차분한 공공 금융 도구
- 서로 다른 두 시나리오와 지표 하나를 공통 시간축에서 비교하는 구조
- 현재 선택과 규칙형 추천 상태에 제한해 쓰는 라임 막대, 안쪽 링, 짧은 표식
- 카드 모음 대신 행·열·표·원장으로 이어지는 계산 문법
- 졸업기간, 대출유형, 공식 경계를 결과 가까이 드러내는 증거 중심 태도

## Colors

팔레트는 따뜻한 중립 종이, 깊은 청색 잉크, 선택을 표시하는 라임, 근거와 경계를 구분하는 낮은 채도의 의미색으로 구성한다.

### Primary

- **Ledger Navy** (ledger-navy): 주요 텍스트, 기본 CTA, 선택안 상세, 원장 면에 사용한다.
- **Selection Lime** (lime-selection): 선택된 시나리오, CTA 화살표, 단계 번호와 추천·조건 확인 표식처럼 현재 행동·선택·규칙 결과에 사용한다.
- **Selection Wash** (lime-wash): 정책 안내와 낮은 강도의 선택·추천 정보 배경에 사용한다.

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

**The Lime Marks Decision State Rule.** 라임은 행동, 선택, 단계 진행과 규칙형 추천 상태에만 쓰며 시나리오의 최초 표시 상태를 추천처럼 장식하지 않는다.

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

기본 컨테이너는 최대 1180px이며 데스크톱 좌우에 28px 안쪽 여백을 둔다. 첫 화면은 SLOW 메인 제목과 다섯 개의 좌우 교차 설명 행으로 구성하고, 입력 폼은 번호·구역 제목 없는 6개 필드의 2열 그리드이며 모바일에서는 1열이다. 결과는 시나리오 선택, 통합 비교, 선택 상세, 자금 원장, 스트레스, 출처가 하나의 세로 판단 흐름을 만든다.

1080px 이하에서는 첫 화면의 두 열을 유지하되 간격을 줄이고, 3열 입력은 2열로, 선택 상세 지표는 4열에서 2열로, 출처는 3열에서 2열로 바뀐다. 820px 이하에서는 첫 화면·폼·결과 소개·시나리오 선택·대출 상세·스트레스가 한 열로 전환되고 비교표는 가로 스크롤을 허용한다. 580px 이하에서는 좌우 여백을 18px로 줄이고 비교와 선택 상세를 화면 가장자리까지 확장하며 대부분의 제어와 데이터 그룹을 1열로 쌓는다. 360px 이하에서는 좌우 여백을 15px로 줄이고 선택 상세 지표도 1열이 된다.

**The Selection-to-Detail Rule.** 선택 그룹, 통합 비교, 선택안 상세는 분리된 화면이 아니라 같은 흐름에서 즉시 이어져야 한다.

**The Reflow Preserves Comparison Rule.** 반응형 전환은 세 안의 순서와 선택 지표의 단위를 보존하고, 시간축 선와 접근 가능한 표의 정보 일치를 유지한다.

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
- **Current Resources:** 현재 월소득에는 용돈·저축의 월 배분을 포함한다는 짧은 설명을 필드 아래 둔다.

### Navigation

72px 높이의 평면 헤더에 브랜드와 세 앵커 링크를 둔다. 브랜드는 SLOW 문자만 표시하고, 820px 이하에서는 메뉴를 숨겨 입력 흐름에 집중한다. 본문 바로가기 링크는 포커스 시 화면에 나타난다.

### Input & Deferred Loan Choices

첫 입력은 남은 학기·이번 학기 실제 등록금·대출 없이 낼 수 있는 등록금 금액·현재 월소득·대학 월 희망 생활비·취업 후 예상 월소득의 단일 폼이다. 큰 입력방식 선택면 대신 작은 예시 채우기 버튼을 둔다. 등록금 자비 항목의 i 버튼은 44px 타깃이며 aria-expanded/aria-controls로 설명을 연결한다. 취업후상환 지원구간·자격·특례와 일반상환 기간은 결과에서 표시한다.

### Scenario Selector & Comparison

두 시나리오 드롭다운과 내 시나리오 추가를 유지한다. 대학/취업후 생활비는 A·B·NO 대출 3개 막대, 대학 생활비의 희망액은 점선이다. 상환 부담·잔액은 시간축 선과 최대 4개 X축 눈금을 사용한다. Y축은 0·음수·전체 최대를 포함하며 값을 잘라내지 않는다. 읽기 쉬운 간격으로 눈금을 표시하고 그래프 높이는 320–490px 범위다.

지표별 툴바·안내·범례·그래프·조회 구역 높이를 맞춰 전환 시 위치 이동을 줄인다. 기본/변경은 같은 축을 유지한다. 키보드·클릭 고정 조회, 비교표, 상세 독립 선택과 기존 토큰·SEED 세그먼트를 유지한다.

### Selected Detail & Funding Ledger

선택 상세는 기존 남색 원장 면에서 이번 학기 월평균 생활비, 졸업 잔액, 상환 기준기간 월평균 부담·남는 소득를 먼저 표시한다. 긴 내역은 대출 구성 및 상환 일정, 자금 계산 내역, 계산 가정 및 출처로 접는다. 핵심 금액에는 기준 시기와 월평균 환산 제한을 붙인다.

추천 설명은 남색 원장 내부 규칙선 구획에서 생활비 효과와 추천 이유를 먼저, 자격 확인에 필요한 정보와 입력 위치를 다음, 잔액·변동금리·생활비 부족 주의를 마지막에 둔다. 현재 기준 10년의 불변 가정은 10년 비교 구역에 모은다. 추천·조건 확인은 기존 라임 표식을, 주의 문장은 기존 호박색을 사용하며 내부 추천 점수는 표시하지 않는다.

상환 숫자와 10년 납부액·이자·잔액에는 같은 항목 안에 짧은 설명을 둔다. 금액 내부의 단위용 span은 지표 제목의 글자 크기를 상속하지 않도록 구분한다. 기존 서체·색상·원장·반응형 체계는 유지한다.

### Stress & Sources

조건 제어는 비교 중인 두 안을 같은 조건으로 계산하며 상세에도 같은 보기 상태를 적용한다. 출처 영역은 두 대출유형의 공식 정보와 계산에서 제외한 가정을 같은 레벨로 공개한다.

**The Default Is Not a Recommendation Rule.** “기본 보기”는 최초 렌더링 상태를 뜻하며 추천, 최적안, 승인 결과를 의미하지 않는다.

## Do's and Don'ts

### Do:

- **Do** 사용자가 서로 다른 두 시나리오를 선택하고 한 지표를 시간축에서 비교하게 한다.
- **Do** 학기당 실제 납부 등록금과 희망 생활비를 계산의 필요자금으로 반영한다.
- **Do** 졸업기간과 대출유형을 총필요자금·실행 횟수·이자·상환 결과의 계산축으로 드러낸다.
- **Do** 균형을 시나리오 “기본 보기”로만 표현하고 현재 선택에는 “내 선택”을 명확히 표시한다.
- **Do** 시각 비교와 스크린리더용 표·상태 알림의 값과 단위를 일치시킨다.
- **Do** 번들된 Noto Sans KR UI, 1080/820/580/360px 리플로, 최소 44px 모바일 독립 행동 영역을 유지한다.

### Don't:

- **Don't** 균형을 추천 시나리오, 최적안, 정답으로 소개한다.
- **Don't** 세 지표를 서로 다른 화면이나 독립 KPI 카드로 흩어 비교 비용을 높인다.
- **Don't** 첫 소개 영역 외에 그라디언트를 추가하거나 글래스모피즘, 드롭 섀도, 장식적 AI 스파클을 추가한다.
- **Don't** 대출유형별 상환 차이, 졸업기간, 계산 가정, 공식기관 경계를 결과에서 떼어낸다.
- **Don't** 외부 서체 CDN에 의존하거나 모든 행을 다시 둥근 카드로 감싼다.
### SEED 및 내 시나리오 편집

변경한 버튼·세그먼트는 설치된 @seed-design/css 레시피를 사용하고 기존 종이·남색·파랑 토큰에 매핑한다. 선택 세그먼트는 한 개의 인디케이터로 구분하며 기본 브라우저 버튼 테두리와 배경을 제거한다. 사용자 시나리오는 native dialog에서 명시적으로 저장하며 이름, 이번 학기 생활비 금액, 상품·기간 순서로 구성한다. 입력은 +/- 5만 원 행동과 직접 숫자 입력을 함께 제공하고 오류는 해당 필드와 알림에 표시한다. 모바일 독립 행동은 44px 이상, 학기별 입력은 한 열로 전환한다.

## SLOW 소개 영역의 2안 디자인

사용자 지정 첫 화면은 이미지의 디자인만 참고한다. 원문 다섯 후킹의 제목·설명은 PRODUCT.md 순서로 항상 보이고 펼치기 제어가 없다. 메인 제목은 가장 큰 위계, 다섯 항목은 동일한 h2 크기를 사용한다. 종이색·남색·번들 서체를 유지하며 소개 영역에만 연한 라임·청색·민트 그라데이션 원을 허용한다. 원의 장식만 잘리고 문구는 잘리지 않는다.

데스크톱은 제목과 설명을 좌우 교차 배치한다. 사용자의 높이 확대 요청에 따라 설명 행의 최소 높이는 178px에서 258px로 약 1.45배 늘렸다. 초기 전체 1.5스크린 목표보다 개별 행의 여유를 우선한다. 580px 이하에서는 모든 항목을 제목→설명의 단일 열로 읽으며 높이를 늘려 가독성을 유지한다. 오른쪽 제목은 원의 안쪽으로 들어가도록 왼쪽 패딩 72–112px을 적용하고 모바일에서는 해제한다. 제목의 괄호 설명은 제거하며 관련 내용은 본문에 유지한다. 하단 공식 요건 버튼은 작은 중립색 외곽선 버튼으로 표시하고 대형 홍보 배너는 사용하지 않는다. 입력·결과의 기존 디자인은 유지한다.

등록금 원금·실제 사용 자기자금·남겨두는 자기자금은 기존 상세의 문장 및 자금 원장에 표시한다. 생활비 막대는 상환 차감 전임을 명시하며 각 안의 월 생활비 부족분·추가 알바 시간을 함께 표시한다. NO 대출 등록금 부족은 즉시 마련해야 할 금액으로 따로 안내한다. 이자 상환액은 별도 문장에 두어 균형의 희망 생활비 기준과 섞지 않는다.

상환기간 생활비 막대와 상세 요약은 일반 원금 상환 시작·취업 중 늦은 시점부터 12개월을 사용한다. 일반 대출이 없으면 취업 첫 12개월이다. 혼합 상품도 같은 관찰 기간의 실제 원장을 합산한다. 각 안의 상품·용도, 현재부터 경과 개월 및 월평균 상환액을 표시한다. 취업 후 상환은 같은 소득이면 초기 상환액이 같을 수 있으며 잔액·상환 완료 시점으로 차이를 확인한다.

잔액·상환 그래프는 일반 약정 종료와 취업 후 상환 완납 시점을 모두 포함한다. 취업 후 상환 연간 결산은 최대 취업 후 50년까지 계산하며 미완납이면 명시하고 잔액을 0으로 만들지 않는다. 10년 추천 비교 원장은 유지한다. 그래프에 각 안의 상환 완료 시점을 표시한다. 같은 소득·상환율의 취업 후 상환 초기 의무상환액은 같으며, 혼합 구성의 일반 납입액 또는 완납 연도의 잔액 한도 때문에 차이 날 수 있다.

계산 후 repayment-guide에서 자동 스크롤을 멈춘다. 일반 상환(고정금리·약정 일정)과 ICL(변동금리·소득 기준)을 짧게 안내하고 그래프로 이어진다. 첫 상품은 등록금·생활비 모두 일반 상환이며 사용자가 바꾼 선택은 유지한다. 그래프→상세 대상 선택→상환상품 메뉴→상세 지표 순서다. 상품 메뉴는 항상 보이고 기간·생활비 포함·자격·기존 대출은 접힌 추가 조건에 둔다. 라디오·세그먼트·선택 카드에는 기존 토큰의 작은 라운드와 명확한 선택·포커스 표시를 적용한다.

졸업 후 준비기간은 비교용 0·1·2·3년 옵션이다. 한국장학재단 일반 상환 소개의 대출기간 상세(2026-09-06 확인)는 잔여재학년수+기본 3년+가산 3년으로 최장거치기간을 산정하며, 기본 3년은 연수·휴학·졸업 후 유예 각 1년이다. 따라서 졸업 후 준비기간의 공식 최대가 3년이라고 표시하지 않는다. 실제 학제·연령 제한은 신청 시 확인하며 앱은 기존 총 거치기간 상한을 유지한다. 근거: https://www.kosaf.go.kr/ko/tuition.do?pg=tuition04_02_01&ttab1=0

모든 비교 지표에서 A/B 선택 바로 아래에 각 안의 등록금·생활비 상환상품과 고정/변동금리를 항상 표시한다. 해당 용도의 신규 대출이 없으면 대출 없음으로 표시하고 상품 변경·시나리오 변경 시 그래프와 함께 갱신한다.

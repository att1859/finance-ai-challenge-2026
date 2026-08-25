---
name: "학자금 대출 최적화 AI"
description: "현재의 시간과 미래의 소비 여력을 한 흐름으로 비교하는 학자금 대출 시나리오 도구"
colors:
  neutral-canvas: "#f7f8fa"
  neutral-surface: "#ffffff"
  neutral-surface-secondary: "#f2f4f6"
  ink-primary: "#191f28"
  ink-secondary: "#4e5968"
  ink-tertiary: "#596574"
  border-subtle: "#e5e8eb"
  acid-action: "#c7f000"
  acid-action-hover: "#b5db00"
  acid-soft: "#f3fbcf"
  positive: "#03b26c"
  negative: "#f04452"
  warning-debt: "#f59f00"
  result-stage: "#111311"
  result-stage-secondary: "#252925"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Malgun Gothic, sans-serif"
    fontSize: "clamp(2.5rem, 4.6vw, 3.5rem)"
    fontWeight: 700
    lineHeight: 1.12
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Malgun Gothic, sans-serif"
    fontSize: "clamp(1.65rem, 3vw, 2.5rem)"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Malgun Gothic, sans-serif"
    fontSize: "clamp(1.35rem, 2.2vw, 1.65rem)"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Malgun Gothic, sans-serif"
    fontSize: "1.02rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Segoe UI, Malgun Gothic, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "0.08em"
rounded:
  compact: "6px"
  status: "7px"
  control: "10px"
  card: "16px"
  full: "999px"
spacing:
  xs: "8px"
  sm: "16px"
  md: "24px"
  lg: "32px"
  xl: "48px"
  section: "64px"
components:
  goal-toggle:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.ink-secondary}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "40px"
  scenario-card:
    backgroundColor: "{colors.neutral-surface}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.card}"
    padding: "26px 54px 26px 26px"
    height: "126px"
  scenario-card-selected:
    backgroundColor: "{colors.result-stage}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.card}"
    padding: "26px 54px 26px 26px"
    height: "126px"
  action-button:
    backgroundColor: "{colors.acid-action}"
    textColor: "{colors.ink-primary}"
    typography: "{typography.label}"
    rounded: "9px"
    padding: "9px 12px"
  result-stage:
    backgroundColor: "{colors.result-stage}"
    textColor: "{colors.neutral-surface}"
    rounded: "{rounded.card}"
    padding: "52px 56px 56px"
---

# Design System: 학자금 대출 최적화 AI

## Overview

**Creative North Star: "Quiet Financial Leverage"**

이 시스템은 돈을 빌리는 행위를 과장하거나 겁주지 않고, 지금의 시간과 미래의 소비 여력 사이에서 사용자가 가진 지렛대를 조용히 드러낸다. Toss 수준의 명확한 정보 위계와 쉬운 조작성을 기반으로, Robinhood에서 연상되는 절제된 흑백 대비와 희소한 애시드 그린을 결합한다.

화면의 85–90%는 밝은 중립 면과 넉넉한 여백이 차지한다. 애시드 그린은 선택, 행동, 목표선, 핵심 상태처럼 판단을 실제로 움직이는 지점에만 5–8% 이내로 사용한다. 비교 결과는 검정 데이터 무대로 전환해 수치가 스스로 말하게 하며, 장식적 차트와 촘촘한 SaaS 대시보드 관습을 피한다.

**Key Characteristics:**

- 밝은 중립 캔버스 위에 흰 데이터 면을 놓는 차분한 작업대
- 선택과 행동에만 드물게 등장하는 애시드 그린
- 검정 결과 무대와 큰 탭형 숫자로 만드는 결정적 대비
- Pretendard 한 가족으로 구축한 명료한 한국어 정보 위계
- 한 화면에 압축하지 않고 세로 흐름으로 선택, 결과, 여정, 근거를 분리하는 데이터 우선 구성

## Colors

차갑고 밝은 금융 중립색을 바탕으로, 산성에 가까운 연두를 희소한 행동 신호로 사용하고 검정에 가까운 결과 무대에서 수치의 대비를 극대화한다.

### Primary

- **Acid Action** (`acid-action`): 현재 선택, 주요 행동, 목표선과 핵심 상태를 표시한다. 넓은 배경색이 아니라 판단의 순간을 짚는 신호다.
- **Acid Action Hover** (`acid-action-hover`): 애시드 버튼의 포인터 상호작용에만 사용해 상태 변화를 짧고 분명하게 만든다.
- **Acid Soft** (`acid-soft`): 데모 상태처럼 낮은 우선순위의 강조 배경에 사용한다.

### Secondary

- **Positive** (`positive`): 희망 소비액보다 여유가 있는 결과에만 사용한다.
- **Negative** (`negative`): 희망 소비액보다 낮은 결과에만 사용한다.
- **Debt Amber** (`warning-debt`): 대출 활용량과 취업 후 상환 경로를 나타내며, 애시드 행동색과 의미를 섞지 않는다.

### Neutral

- **Neutral Canvas** (`neutral-canvas`): 전체 페이지의 기본 배경이며 화면 면적의 대부분을 차지한다.
- **Neutral Surface** (`neutral-surface`): 시나리오 카드와 분석 도구의 평평한 데이터 면이다.
- **Neutral Surface Secondary** (`neutral-surface-secondary`): 트랙, 비활성 영역, 미세한 호버 면을 만든다.
- **Primary Ink** (`ink-primary`): 본문과 밝은 면의 핵심 숫자 및 제목에 사용한다.
- **Secondary Ink** (`ink-secondary`): 설명과 보조 데이터에 사용한다.
- **Tertiary Ink** (`ink-tertiary`): 메타 정보와 가장 낮은 위계의 레이블에 사용한다.
- **Subtle Border** (`border-subtle`): 카드, 구획, 타임라인을 구분하되 면을 잘게 쪼개지 않는 얇은 선이다.
- **Result Stage** (`result-stage`): 선택 카드와 핵심 결과 영역을 위한 검정에 가까운 데이터 무대다.
- **Result Stage Secondary** (`result-stage-secondary`): 검정 무대 내부의 트랙과 보조 면에 사용한다.

**The Rare Acid Rule.** 애시드 그린은 화면의 5–8%를 넘기지 않으며, 선택·행동·목표·핵심 수치가 아닌 장식에는 사용하지 않는다.

**The Semantic Split Rule.** 애시드는 행동, 호박색은 부채 흐름, 초록과 빨강은 결과의 방향에만 사용한다.

## Typography

**Display Font:** Pretendard Variable (Pretendard 및 시스템 산세리프 폴백)
**Body Font:** Pretendard Variable (Pretendard 및 시스템 산세리프 폴백)

**Character:** 하나의 가변 산세리프 가족 안에서 크기, 굵기, 자간만으로 위계를 만든다. 숫자는 탭형 정렬을 사용해 시나리오 간 비교가 흔들리지 않으며, 제목은 촘촘하고 본문은 느슨하게 읽힌다.

### Hierarchy

- **Display** (`display`): 첫 질문에 사용하며 짧고 균형 잡힌 문장으로 유지한다.
- **Headline** (`headline`): 검정 결과 무대의 시나리오 결론처럼 한 단계 아래의 결정적 메시지에 사용한다.
- **Title** (`title`): 시나리오, 여정, 계산 구획의 진입점에 사용한다.
- **Body** (`body`): 기능 설명과 안내에 사용하며, 소개문은 약 680px 안에서 자연스럽게 줄바꿈한다.
- **Label** (`label`): 시나리오 상태, 데모 상태, 도구 메타 정보에 사용한다. 짧은 상태는 넓은 자간으로 숫자 위계를 보조한다.

**The Numbers Lead Rule.** 금액, 시간, 기간은 주변 문장보다 크고 무겁게 제시하며 `tabular-nums`로 열을 안정시킨다.

**The One-Family Rule.** 별도의 장식 서체나 모노스페이스를 추가하지 않는다. 위계는 Pretendard의 크기, 굵기, 자간으로 해결한다.

## Layout

기본 컨테이너는 최대 1240px이며 좌우 32px 여백을 확보한다. 상단 서비스 정체성 옆의 공통 기준 스트립에 희망 소비액과 현재 노동시간을 한 번만 제시한 뒤, 소개, 3열 시나리오 선택, 검정 결과 무대, 2열 여정 도구, 계산 방식 순서로 자연스럽게 세로 진행한다. 구획 간 간격은 대체로 52–70px, 카드 내부는 20–56px 범위를 사용해 금융 데이터를 조밀하게 압축하지 않는다.

960px 이하에서는 컨테이너를 최대 760px로 줄이고 시나리오 카드와 여정 도구를 1열로 전환한다. 640px 이하에서는 좌우 여백을 12px로 축소하고 결과 비교를 세로로 쌓으며 상환 화살표를 세로 방향으로 전환한다. 핵심 제목, 숫자, 선택 카드가 첫 번째 읽기 흐름을 유지해야 하며 보조 레이블은 좁은 화면에서 숨길 수 있다.

**The Progressive Disclosure Rule.** 선택, 결과, 시간 흐름, 계산 근거를 한 화면에 압축하지 않는다. 사용자는 아래로 이동하며 한 번에 하나의 질문을 검토한다.

**The Data Before Chrome Rule.** 카드 수나 도구 패널 수를 늘려 대시보드처럼 보이게 하지 않는다. 데이터 비교에 필요한 면만 유지한다.

## Elevation & Depth

시스템은 평면이 기본이다. 깊이는 밝은 캔버스와 흰 카드의 미세한 톤 차이, 1px 경계선, 검정 결과 무대의 강한 면 전환으로 만든다. 카드에는 상시 그림자를 두지 않으며, 포커스 링과 작은 상태 점처럼 상호작용을 설명하는 경우에만 제한적인 확산 그림자를 허용한다.

### Shadow Vocabulary

- **Keyboard Focus Halo** (`0 0 0 6px rgba(199, 240, 0, 0.78)`): 키보드 탐색 위치를 검정 외곽선 바깥에서 명확히 드러낸다.
- **Active Dot Halo** (`0 0 0 3px rgba(199, 240, 0, 0.16)`): 목표선 토글의 켜짐 상태를 조용히 보조한다.
- **Timeline Node Ring** (`0 0 0 1px #cbd0d5`): 작은 연도 노드가 흰 면에서 사라지지 않게 하는 구조적 링이다.

**The Flat-by-Default Rule.** 정적인 카드와 패널에는 그림자를 추가하지 않는다. 위계는 톤, 선, 여백, 면 전환으로 해결한다.

## Shapes

카드와 결과 무대는 부드럽지만 제품적인 16px 모서리를 공유한다. 버튼과 상태 표시는 6–10px의 더 조밀한 반경을 사용하며, 타임라인 노드와 상태 점만 완전한 원형이다. 모든 경계는 기본적으로 1px이고, 선택된 시나리오 카드는 경계보다 검정 면 전환으로 상태를 표현한다.

**The One Card Silhouette Rule.** 주요 데이터 컨테이너는 16px 반경을 공유해 서로 다른 기능을 하나의 제품 언어로 묶는다.

## Components

### Goal Toggle

기준선의 표시 여부를 제어하는 작고 절제된 보조 컨트롤이다.

- **Shape:** 조밀한 둥근 사각형 (`control`)과 1px 경계선
- **Default:** 흰 면, 보조 잉크, 애시드 상태 점
- **Off:** 상태 점을 3차 잉크로 바꾸고 확산 링을 제거한다.
- **Hover / Focus:** 중립 보조 면으로 전환하며, 키보드 포커스에는 검정 외곽선과 애시드 헤일로를 함께 사용한다.

### Scenario Cards

카드 전체가 라디오 선택지이며, 한국어 시나리오 이름·간결한 의미·주당 노동시간만 한 단위로 묶는다. 희망 소비액과 현재 노동시간은 상단 공통 기준 스트립에만 두어 세 카드에서 반복하지 않는다.

- **Shape:** 16px 반경과 1px 경계선. 데스크톱 높이 126px·내부 여백 26px 54px 26px 26px, 모바일 높이 106px·내부 여백 21px 48px 21px 20px
- **Default:** 흰 면에서 이름과 의미를 왼쪽, 탭형 숫자의 주당 시간을 오른쪽에 두고 우상단의 작은 원형 선택 표시를 유지한다.
- **Selected:** 검정 결과색 면과 흰 텍스트로 전환하고 원형 선택 표시에만 애시드를 사용한다.
- **Hover / Focus:** 호버 시 2px 상승하며, 키보드 화살표로 인접 카드를 순환 선택할 수 있다.

**The Single-Read Card Rule.** HIGH·MEDIUM·LOW 레이블, 반복되는 목표·근거 행, 대출 미터를 카드에 넣지 않는다. 시나리오 비교에 필요한 세 가지 정보만 남긴다.

### Action Button

다시 보기처럼 명확한 단일 행동에만 애시드 면을 사용한다.

- **Shape:** 9px 반경, 9px 12px 내부 여백
- **Default:** 애시드 면, 기본 잉크, 650 굵기의 작은 레이블
- **Hover / Focus:** 호버는 한 단계 어두운 애시드로 전환하고, 포커스는 공통 헤일로를 사용한다.

### Status Chips

데모 조건과 목표 대비 결과처럼 짧은 상태를 본문 흐름에서 분리한다.

- **Style:** 6–7px 반경, 5–8px 수평 여백, 작은 레이블
- **State:** 데모는 연한 애시드, 긍정은 투명 초록, 부정은 투명 빨강을 사용한다.
- **Constraint:** 상태 칩을 탐색 태그나 장식 배지로 확장하지 않는다.

### Cards / Containers

- **Corner Style:** 16px 반경
- **Background:** 기본 도구는 흰 면, 핵심 결과는 검정 결과 무대
- **Shadow Strategy:** 상시 그림자 없음
- **Border:** 밝은 카드에만 미세한 1px 경계선
- **Internal Padding:** 도구 카드는 32px 34px, 결과 무대는 52px 56px 56px

### Result Stage

선택한 시나리오가 대학 시절과 취업 후 소비 여력에 미치는 영향을 보여주는 시스템의 서명 컴포넌트다. 검정 면, 큰 금액 숫자, 흰 실제값 트랙, 애시드 목표선, 호박색 상환 경로를 한 무대에서 사용한다. 모바일에서는 두 기간을 세로로 쌓고 상환 경로의 방향도 함께 회전시킨다.

### Timeline & Hour Grid

시간을 추상적인 차트 대신 셀과 연도 노드로 직접 보여준다. 노동시간 셀은 선택 시간만 기본 잉크로 채우고, 9년 경로는 대학 구간을 잉크, 상환 구간을 호박색으로 순차 표시한다. 모션은 상태 이해를 돕는 한 번의 짧은 진행이며 반복 재생은 사용자가 명시적으로 요청한다.

### Calculation Details

계산 근거는 기본적으로 접힌 `details` 패턴으로 제공한다. 상하 1px 경계선만 사용하고, 펼쳤을 때 데스크톱 3열·모바일 1열로 근거를 보여준다.

## Do's and Don'ts

### Do:

- **Do** 화면의 85–90%를 밝은 중립색과 여백으로 유지하고 애시드 사용을 5–8% 이내로 제한한다.
- **Do** 핵심 결과를 검정 데이터 무대에 큰 탭형 숫자와 명확한 목표선으로 제시한다.
- **Do** 선택 카드 전체를 클릭·터치·키보드로 조작할 수 있게 하고 `aria-checked`, 순환 화살표 탐색, 강한 포커스 표시를 유지한다.
- **Do** 공통 희망값과 현재 노동시간은 상단 기준 스트립에서 한 번만 보여주고 시나리오 카드는 이름·의미·주당 시간에 집중한다.
- **Do** 960px과 640px 반응형 전환에서 비교 순서와 의미를 보존한다.
- **Do** `prefers-reduced-motion`에서 모든 전환과 애니메이션을 사실상 즉시 완료한다.

### Don't:

- **Don't** 애시드 그린을 넓은 섹션 배경, 장식 그라데이션, 무의미한 아이콘에 사용한다.
- **Don't** 상시 카드 그림자, 유리 효과, 과도한 색상으로 평평하고 정확한 금융 작업대의 성격을 흐린다.
- **Don't** 사이드바, KPI 타일 묶음, 조밀한 차트 격자를 추가해 전형적인 SaaS 대시보드처럼 만든다.
- **Don't** 돈, 시간, 상환 정보를 서로 다른 화면이나 불연속적인 단위로 분리해 비교 비용을 높인다.
- **Don't** 실제 금융 자문처럼 보이는 확정적 표현이나 계산 근거 없는 장식 데이터를 추가한다.
- **Don't** 시나리오 카드에 HIGH·MEDIUM·LOW 레이블, 목표·근거 반복 행, 대출 미터를 되살리지 않는다.

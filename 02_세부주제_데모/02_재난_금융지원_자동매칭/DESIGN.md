---
name: "한결 재난금융 지원센터"
description: "승인 가능한 근거와 다음 행동을 한 흐름으로 잇는 재난금융 운영 시스템"
colors:
  incident-deep-teal: "#0d2b29"
  operational-teal: "#164b47"
  action-teal: "#247a72"
  teal-soft: "#dff1ee"
  teal-wash: "#edf8f6"
  current-orange: "#e66a2c"
  warning-amber: "#a15c00"
  success-green: "#18734d"
  critical-red: "#b3261e"
  operational-ink: "#14201f"
  secondary-ink: "#52615f"
  divider: "#dce3e1"
  divider-strong: "#c5d0cd"
  operational-ground: "#f2f5f4"
  paper: "#ffffff"
typography:
  display:
    fontFamily: "Pretendard, Pretendard Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: "40px"
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Pretendard, Pretendard Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Pretendard, Pretendard Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: "28px"
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Pretendard, Pretendard Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "Pretendard, Pretendard Variable, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.45
    letterSpacing: "0.06em"
rounded:
  control-sm: "6px"
  index: "8px"
  compact: "10px"
  nested: "12px"
  inset: "13px"
  panel: "15px"
  hero: "16px"
  full: "999px"
spacing:
  x1: "4px"
  x2: "8px"
  x2-5: "10px"
  x3: "12px"
  x4: "16px"
  x4-5: "18px"
  x5: "20px"
  x5-5: "22px"
  x6: "24px"
  x7: "28px"
  x8: "32px"
components:
  action-neutral-solid:
    backgroundColor: "var(--seed-color-bg-neutral-inverted)"
    textColor: "var(--seed-color-fg-neutral-inverted)"
    typography: "{typography.body}"
    rounded: "var(--seed-radius-r2)"
    padding: "10px 16px"
    height: "40px"
  action-neutral-solid-large:
    backgroundColor: "var(--seed-color-bg-neutral-inverted)"
    textColor: "var(--seed-color-fg-neutral-inverted)"
    typography: "{typography.body}"
    rounded: "var(--seed-radius-r3)"
    padding: "14px 20px"
    height: "52px"
  work-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.operational-ink}"
    rounded: "{rounded.panel}"
    padding: "22px"
  focal-case-panel:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.operational-ink}"
    rounded: "{rounded.panel}"
    padding: "22px"
  current-step:
    backgroundColor: "{colors.current-orange}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    size: "27px"
---

# Design System: 한결 재난금융 지원센터

## Overview

**Creative North Star: "승인 가능한 상황실"**

이 시스템은 재난 대응 상황실의 긴장감과 은행 업무도구의 신뢰성을 결합한다. 화면은 장식보다 사실·근거·현재 상태·다음 행동을 먼저 드러내며, 깊은 청록의 재난 밴드에서 7단계 진행선과 작업 패널을 거쳐 하나의 케이스가 끊기지 않고 이동한다.

운영자 화면은 조밀하지만 스캔 가능한 데스크톱 워크스테이션이고, 고객 화면은 같은 시각 언어를 더 차분하고 선형적으로 적용한 인증 앱이다. 모든 표면은 자동 승인이나 지급을 암시하지 않으며, 합성 데이터와 담당자 승인 게이트를 지속적으로 눈에 보이는 사실로 유지한다.

**Key Characteristics:**

- 깊은 청록 재난 밴드와 차가운 미색 작업 바닥의 강한 층위
- 7단계 사건-신청 진행선을 통한 연속된 상태 인식
- 테두리 중심 작업 패널과 그림자만으로 집중시키는 단일 케이스 패널
- 현재 행동에만 제한되는 따뜻한 오렌지
- 사실 우선 라벨, 명시적 승인 게이트, 지속적인 합성 데이터 표기
- 모바일 수평 레일과 화살표로 보장하는 명시적 계속됨 단서

## Colors

팔레트는 차가운 청록과 중성 회백색을 운영 기반으로 삼고, 오렌지를 현재 행동에만 짧고 강하게 사용한다.

### Primary

- **사건 심해 청록:** 재난 밴드와 고객 인트로에 사용해 사건 맥락을 하나의 단단한 블록으로 고정한다.
- **운영 청록:** 링크, 강조 정보, 완료 단계와 신뢰 상태에 사용한다.
- **행동 청록:** 선택선, 체크 상태, 아이콘과 포커스 계열에 사용한다.

### Secondary

- **현재 행동 오렌지:** 7단계 진행선의 현재 단계에만 사용해 사용자의 시선을 지금 해야 할 일로 모은다.

### Tertiary

- **상태 앰버·그린·레드:** 각각 주의, 성공, 중대한 오류의 사실 상태를 전달하며 장식적으로 사용하지 않는다.

### Neutral

- **운영 잉크:** 주요 제목과 핵심 사실을 위한 거의 검정에 가까운 청록빛 텍스트다.
- **보조 잉크:** 설명, 보조 메타데이터, 제한 조건을 위한 낮은 대비 텍스트다.
- **작업 구분선:** 패널, 표, 목록 행의 구조를 그림자 없이 나눈다.
- **강한 구분선:** 잠금 영역, 비선택 단계, 체크박스처럼 상호작용 경계를 더 분명하게 만든다.
- **차가운 운영 바닥:** 다수의 흰 작업 패널이 분리되어 보이도록 하는 기본 캔버스다.
- **백색 종이:** 모든 작업 패널과 표의 기준 표면이다.

**The Current Action Rule.** 오렌지는 현재 단계 표시 외의 버튼, 배지, 장식에 확장하지 않는다.

**The State Before Brand Rule.** 성공·주의·오류 색은 브랜드 표현이 아니라 사실 상태를 전달할 때만 사용한다.

## Typography

**Display Font:** Pretendard (시스템 산세리프 대체)
**Body Font:** Pretendard (시스템 산세리프 대체)

**Character:** 단일 한글 산세리프 패밀리로 업무 밀도를 통제한다. 큰 제목은 굵고 촘촘하게, 본문과 라벨은 작지만 충분한 행간과 명확한 굵기 차이로 읽힌다.

### Hierarchy

- **Display** (700, 30px, 40px): 고객 인트로의 개인화된 안내 한 곳에 사용한다.
- **Headline** (700, 24px, 32px): 재난명, 성공 상태 같은 화면 수준 사실에 사용한다.
- **Title** (700, 20px, 28px): 독립 작업 섹션의 제목에 사용한다.
- **Body** (400, 14px, 1.55): 설명과 근거 문장에 사용하며 일반 설명은 약 60–68ch 안에서 유지한다.
- **Label** (700, 11px, 1.45): 상태, 필드명, 케이스 번호, 날짜 같은 압축 메타데이터에 사용한다.

**The Factual Label Rule.** 라벨은 추상적 마케팅 문구보다 상태·기한·출처·필요 서류처럼 검증 가능한 사실을 먼저 말한다.

## Layout

데스크톱 운영 화면은 최대 1440px 안에서 주 작업대와 집중 케이스를 1.22:0.78 비율로 나눈다. 28px 외곽 여백, 20–22px 패널 간격과 내부 여백을 기본 리듬으로 사용하고, 케이스 패널은 화면 안에 고정되어 좌측 작업과 함께 읽힌다. 상단 64px 바, 시나리오 탐색, 깊은 청록 사건 밴드, 7단계 진행선은 위에서 아래로 항상 같은 처리 맥락을 만든다.

1180px 이하에서는 케이스 패널을 작업대 아래로 내리고 고정을 해제한다. 820px 이하에서는 외곽 여백을 16px 수준으로 줄이며, 시나리오 탭·7단계 진행선·고객 표는 내용 폭을 보존한 수평 레일로 전환한다. 레일은 "옆으로 보기" 또는 원형 화살표로 더 많은 내용이 이어짐을 명시하고, 선택 또는 현재 항목이 바뀌면 가운데로 스크롤된다. 긴 사실 그리드는 한 열로 접고 주요 행동 버튼은 전체 폭을 사용한다.

**The Continuous Spine Rule.** 사건 선택부터 심사 이관까지의 7단계는 데스크톱과 모바일 모두 순서와 상태가 끊기지 않아야 한다.

**The Preserved Density Rule.** 모바일에서 표와 진행선을 축약해 정보를 삭제하지 않는다. 수평 레일과 계속됨 단서를 사용해 밀도를 보존한다.

## Elevation & Depth

기본 표면은 평평하다. 작업 패널은 흰 배경, 1px 구분선, 15px 모서리만 사용하고 그림자를 갖지 않는다. 운영자 화면의 우측 케이스 패널만 낮고 넓은 그림자로 집중 대상을 만든다. 고객 인트로는 사건 맥락을 들어 올리는 단일 예외이며, 모바일 계속됨 화살표에는 작은 기능성 그림자만 허용한다.

### Shadow Vocabulary

- **집중 케이스:** `0 12px 30px rgba(18, 44, 41, 0.08)` — 운영 화면에서 현재 선택된 케이스 패널에만 사용한다.
- **고객 사건 인트로:** `0 16px 34px rgba(13, 43, 41, 0.16)` — 인증 고객 화면의 사건 요약 블록에만 사용한다.
- **모바일 계속됨 단서:** `0 3px 12px rgba(13, 43, 41, 0.1)` — 수평 진행선 끝의 방향 안내에만 사용한다.

**The One Focal Shadow Rule.** 한 작업 화면에서 의미 있는 그림자는 현재 집중해야 하는 사례 하나에만 부여한다.

## Shapes

형태는 중간 정도로 부드러운 직사각형을 기본으로 한다. 주요 패널은 15–16px, 내부 그룹은 12–13px, 작은 인덱스와 상태 요소는 6–10px 모서리를 사용한다. 원형은 진행 단계, 상태 아이콘, 체크와 같이 단일 상태를 즉시 인식시켜야 할 때만 사용한다. 점선은 잠금 또는 아직 열리지 않은 영역에만 쓰고, 일반 구획에는 1px 실선을 사용한다.

**The Nested Radius Rule.** 바깥 패널보다 안쪽 그룹의 반경을 작게 유지해 포함 관계를 눈으로 읽게 한다.

## Components

### Buttons

- **Shape:** Seed Design System의 크기별 반경과 높이를 그대로 사용한다. 중형은 40px, 대형은 52px 높이다.
- **Primary:** 핵심 업무 행동은 `neutralSolid`로 제공하며, 중형은 10px 16px, 대형은 14px 20px 내부 여백을 사용한다.
- **Hover / Focus:** Seed의 pressed 배경과 scale 피드백을 유지하고, 프로젝트 전역 포커스는 반투명 청록 3px 외곽선과 2px 간격으로 보강한다.
- **Secondary / Ghost:** 보조 분석은 `neutralWeak`, 되돌리기와 낮은 우선순위 도구는 `ghost`를 사용한다. 행동의 의미를 오렌지 버튼으로 표현하지 않는다.

### Chips

- **Style:** Seed Badge와 Tabs를 사용해 상태와 시나리오를 표현한다. 약한 채움은 정보 상태, 외곽선은 보안·잠금·대기처럼 경계를 강조해야 하는 상태에 사용한다.
- **State:** 선택된 시나리오는 탭의 활성 상태로만 표현하고, 상태 배지는 positive·informative·warning·neutral의 사실 의미를 유지한다.

### Cards / Containers

- **Corner Style:** 작업 패널은 15px, 고객 사건 인트로는 16px, 내부 분석·공지 블록은 12–13px 모서리를 사용한다.
- **Background:** 백색 종이를 차가운 운영 바닥 위에 둔다. 분석 근거와 선택 상태에만 옅은 청록 워시를 사용한다.
- **Shadow Strategy:** 작업 패널은 무그림자, 집중 케이스 패널만 집중 케이스 그림자를 사용한다.
- **Border:** 대부분 1px 작업 구분선을 사용한다. 집중 케이스는 테두리를 제거해 그림자만으로 구별한다.
- **Internal Padding:** 데스크톱 22–26px, 모바일 18–20px를 사용한다.

### Inputs / Fields

- **Style:** 고객 서류 입력은 22px 정사각 체크박스와 6px 모서리를 사용한다. 미선택은 강한 구분선, 선택은 행동 청록 채움과 흰 체크다.
- **Focus:** 체크박스 주변에 반투명 청록 3px 외곽선과 2px 간격을 표시한다.
- **Error / Disabled:** 자동 확인된 항목은 그대로 선택된 사실로 보이되 사용자가 변경할 수 없으며, 제출 필요 상태는 warning 배지로 명시한다.

### Navigation

상단 바는 64px 고정 높이의 백색 표면과 하단 구분선을 사용한다. 시나리오 탭은 72px 높이의 별도 레일에 두고 데스크톱에서는 합성 고객 수를 오른쪽에 고정한다. 모바일에서는 탭 폭을 보존해 수평 스크롤하며, 합성 데이터 배지는 숨기지 않고 고객 화면 상단에 계속 유지한다.

### Workflow Spine

7개의 27px 원형 단계와 1px 연결선으로 전체 처리 흐름을 표현한다. 완료는 행동 청록 채움과 체크, 현재는 오렌지 채움과 절제된 펄스, 미래는 백색과 강한 구분선이다. `prefers-reduced-motion`에서는 펄스와 스크롤 애니메이션을 사실상 제거한다.

### Focal Case Panel

현재 선택된 고객의 대출 사실, 자동 선별 근거, 대표 지원 3개, 다음 노출 행동을 하나의 연속 패널에 모은다. 승인 전에는 동일한 자리를 잠금 가이드가 차지하며 결과와 고객 노출 행동을 보여주지 않는다. 지원 항목은 반드시 지원 내용 → 신청 기한 → 필요 서류 순서로 읽히게 한다.

## Do's and Don'ts

### Do:

- **Do** 승인 전후를 잠금·승인·노출 상태와 명시적 문장으로 함께 구분한다.
- **Do** 운영자 케이스와 고객 앱 모두에서 대표 지원 3개, 기한, 필요 서류 순으로 강조한다.
- **Do** 합성 데이터임을 상단 배지와 화면 하단 고지처럼 지속적인 위치에 노출한다.
- **Do** 모바일 수평 레일에 텍스트 또는 화살표 형태의 계속됨 단서를 제공한다.
- **Do** 상태 전환 뒤에도 자동 승인이 아니라 담당부서 또는 기관 심사가 시작된다는 사실을 유지한다.

### Don't:

- **Don't** 오렌지를 일반 CTA, 성공 상태, 브랜드 장식에 사용한다.
- **Don't** 모든 패널에 그림자를 추가하거나 테두리와 그림자를 동시에 사용해 깊이 경쟁을 만든다.
- **Don't** 승인 전 추천 결과나 고객 앱 노출 행동을 보여준다.
- **Don't** 신청 제출을 최종 승인·지급 완료로 표현한다.
- **Don't** 모바일에서 진행 단계, 표 열, 대표 지원의 핵심 사실을 임의로 삭제한다.

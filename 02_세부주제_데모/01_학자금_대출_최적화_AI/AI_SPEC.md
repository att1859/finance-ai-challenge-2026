# SLOW AI 인터페이스 명세

2026-09-06. 현재 기능은 PRODUCT.md, 실행·키 설정은 AI_SETUP.md, 코드 경계는 ARCHITECTURE.md를 따른다. 이 문서는 처음의 구현 계획을 현재 인터페이스 명세로 정리한 것이다.

## 역할

“지금 보고 있는 내 시나리오를 이해하고 설명하는 AI.” 계산·자격 판정은 기존 엔진이 맡고 AI는 단위와 관찰 기간이 붙은 결과를 설명한다. 시나리오 추천·승인 확정·화면 직접 수정은 하지 않는다.

## 현재 API 계약

- GET /api/health → configured(키 존재 여부), provider, model. 실제 연결 성공 판정이 아니다.
- POST /api/chat → mode(summary/chat), contextVersion(음이 아닌 정수), context, messages.
- context → selected, comparison(최대 2개), view(기본 조건/변경 조건), policyVersions.
- selected와 comparison 항목 → id, name, facts. facts는 label/value 문자열 쌍이며 금액은 만 원, 시간은 월 단위를 명시한다.
- messages → role(user/assistant), content. 최근 6쌍과 새 질문까지 최대 13개를 전송한다.
- 성공 → requestId, contextVersion, summary, benefits, cautions, answer.
- 실패 → requestId, error.code, error.message. 제공사 원문·키·내부 오류는 보내지 않는다.

summary 모드는 짧은 요약과 장점·주의점 각 최대 2개를 제공한다. chat 모드는 answer를 사용한다. 모든 생성문은 일반 텍스트로 렌더링한다.

## 현재 제한

요청 본문 64KB, 질문 1,000자, 응답 문자열 각 4,000자, facts 최대 25개다. 서버는 분당 20회·동시 2회로 제한하며 제공사 생성 최대 1,600토큰, 서버 시간 제한 30초, 브라우저 시간 제한 35초를 사용한다. 정상 STOP 이외의 잘리거나 차단된 응답은 성공 처리하지 않는다.

## 화면과 요청 수명

우측 고정 버튼으로 패널을 열고 닫는다. 모바일 패널은 뷰포트 좌우 12px에 맞춘다. 패널 열기만으로 Gemini에 정보가 전달되지 않는다. 연결 설정과 사용자 동의를 확인한 뒤 요약·질문을 호출한다.

계산 결과는 별도 모듈에서 selected/comparison facts로 추린다. 시나리오·상품·조건으로 이 맥락이 달라지면 버전을 올리고 대화·요약을 초기화한다. 닫거나 초기화하거나 맥락이 바뀌면 진행 중 응답을 취소하고 늦은 응답은 적용하지 않는다. 닫힌 상태에서 자동 요약을 호출하지 않는다. 현재 맥락의 완료된 요약은 패널 재열기에서 재사용한다.

## 이번 구현의 경계

키 없이도 실제 계산값의 미리보기와 패널 조작을 확인할 수 있다. 이를 AI 생성으로 표시하지 않는다. Gemini 실제 응답과 계정별 모델 접근은 키 설정 이후에 검증한다.

지식은 SLOW 제품 정의 12개와 공식 정책 안내 7개의 FAQ로 구성하며 출처·확인일·기준학기를 포함한다. server/knowledge.js가 원본이며 AI_SETUP.md에 검토용 전체 내용을 표시한다. Vercel 배포는 api/chat.js·api/health.js에서 기존 공통 핸들러를 재사용한다. 실시간 웹 검색·챗봇의 입력 변경·음성·대화 영구 저장은 포함하지 않는다. 삭제된 다른 계획이나 이 범위 밖의 항목은 자동 후속 작업으로 간주하지 않는다.

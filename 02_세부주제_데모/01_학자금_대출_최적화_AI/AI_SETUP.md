# SLOW AI 로컬 실행과 API 설정

현재 구현은 플로팅 패널과 Gemini 호출 경로다. 실제 API 키 발급·결제·모델 접근 권한은 사용자의 Google 계정에서 준비한다. 키가 없으면 계산 결과 미리보기만 표시하며 AI 답변을 생성하지 않는다.

## 1. API 키 준비

1. [Google AI Studio의 API 키 화면](https://aistudio.google.com/apikey)에서 로그인하고 프로젝트와 API 키를 준비한다. 약관 동의나 결제 등록이 나오면 사용자가 직접 진행한다.
2. 앱 폴더의 `.env.example`을 같은 폴더에 `.env.local`이라는 이름으로 복사한다.
3. `GEMINI_API_KEY=` 뒤에 키를 로컬 편집기에서 입력한다. 채팅·소스 코드·VITE_ 변수에 넣지 않는다.
4. `AI_MODEL`은 계정에서 사용할 수 있는 모델 ID로 정한다. 기본 후보는 `gemini-3.5-flash-lite`이며 현재 키가 없어 실제 호출 가능 여부는 검증하지 않았다.
5. 무료 등급 시험은 가상 정보로 진행한다. 실제 정보 사용 전 [적용 약관](https://ai.google.dev/gemini-api/terms)과 [등급별 데이터 사용 안내](https://ai.google.dev/gemini-api/docs/pricing)를 확인한다.

키를 넣은 후 서버를 다시 시작해야 한다. `.env.local`은 Git에서 제외되며 예시 파일에 실제 키를 넣으면 안 된다. [공식 키 관리 안내](https://ai.google.dev/gemini-api/docs/api-key)를 따른다.

## 2. 실행

Node 24에서 검증했다. 아래 명령은 현행 앱 폴더에서 실행한다.

```powershell
npm ci
npm run dev
```

`npm run dev` 하나로 프런트엔드와 API 서버가 실행된다.

- 화면: http://127.0.0.1:5175
- API 상태: http://127.0.0.1:8787/api/health
- API 요청: POST /api/chat (프런트엔드에서 프록시)
- 종료: 실행 터미널에서 Ctrl+C

기존 로직 작업의 개발 서버와 구분하려고 화면 포트를 5175로 설정했다. API 포트 8787이 사용 중이면 .env.local의 AI_PORT를 변경하고 재실행한다. 화면 포트를 바꿀 때는 vite.config.js와 AI_ALLOWED_ORIGINS를 함께 맞춘다. 단독 실행은 npm run dev:ui와 npm run dev:api를 쓴다.

health의 configured는 키 존재 여부만 뜻한다. 키 유효성·결제·모델 접근 성공을 뜻하지 않는다. 서버는 키와 대화 원문을 로그에 남기지 않는다.

## 3. 화면 확인

결과 확인하기 → 우측 SLOW 봇 → 선택안 미리보기 → 키 설정 후 연결 확인 → 동의하고 AI 설명 시작 → 추가 질문 순서다. Enter로 보내고 Shift+Enter로 줄을 바꾼다. 닫기/Escape로 접으며 답변 중 닫거나 조건을 바꾸면 이전 응답을 버린다.

키 미설정이면 “AI 연결 준비 중”을 표시한다. 잘못된 키·모델 접근 불가·할당량 초과·시간 초과는 오류와 재시도 동작으로 처리한다. 키 설정 확인 후에도 실제 생성 요청을 한 번 성공시켜야 연결을 검증한 것이다.

## 4. 검증 범위

자동 테스트는 실제 Gemini 호출 대신 주입한 가상 HTTP 응답을 사용한다. 키 노출 방지, 입력 검증, 로컬 한도, 잘린 응답 거부, 맥락 변경·취소·재시도와 기존 계산 결과를 확인한다.

이번 구현에서 실제 대출 세부요건 FAQ 조사·검색 DB·외부 공개 배포는 제공하지 않는다. 지식은 기존 제품 용어·계산 의미에 한정하며 상세 정책 질문은 기존 공식 요건 안내로 유도한다.

서버는 로컬 시연 전용이다. 분당 20회·동시 2회 한도는 프로세스 메모리 기준이다. 외부 배포에는 인증·사용량 통제와 배포 환경 설정이 필요하며 정적 dist만 배포하면 AI API는 실행되지 않는다.

공식 호출 계약: [Gemini generateContent](https://ai.google.dev/api/generate-content), 2026-09-06 확인. 요청은 store:false이며 제공사의 모든 보관이 없다는 보장은 아니다.

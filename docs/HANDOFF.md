# ChaeA AI 운영 시스템 — Claude Code 인수인계 메모

작성일: 2026-05-13
직전 작업 환경: Cowork (Anthropic 데스크톱)
다음 작업 환경: Claude Code (CLI)

---

## 현재까지 끝난 것

1. **아키텍처 설계** — `docs/ARCHITECTURE.md`
2. **Claude API 기반 챗봇 백엔드** — `functions/api/chat-claude.js`, `functions/_shared/claude.js`
3. **공식 웹페이지(홈)** — `app/home/index.html`
4. **SNS 모니터링 (스켈레톤)** — `functions/api/sns-classify.js`, `sns-draft.js`, `sns-queue.js`, `scripts/instagram-monitor.mjs`
5. **공개 소셜 스냅샷** — `scripts/chaealine-monitor.mjs`가 Instagram/YouTube @chaealine 공개 메타데이터를 `data/social/`과 `docs/ChaeA_Social_Presence.md`에 저장
6. **운영 대시보드** — `app/admin/index.html`
7. **스모크 테스트 스크립트** — `scripts/claude-smoke-test.mjs`
8. **환경 변수 자리 마련** — `.env`에 `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL_VOICE`, `ANTHROPIC_MODEL_FAST` 추가 (실제 키도 채워둠)

`npm run check` 모두 통과.

---

## Claude Code에서 가장 먼저 할 것

```sh
cd /Users/joseph/Documents/ChaeA-260506
node scripts/claude-smoke-test.mjs
```

Cowork 샌드박스에서는 외부 도메인 DNS가 막혀 있어서 핑 테스트를 못 돌렸음. Claude Code 환경에서는 정상 동작할 것으로 예상.

기대 출력: Haiku 분류 JSON 한 줄 + Sonnet 페르소나 한국어 응답 한두 문장.

---

## 우선순위 다음 작업 (운영자 결정 필요한 것 포함)

### 1. server.mjs에 신규 라우트 등록 (기술 작업, 즉시 가능)

현재 `server.mjs`에는 기존 xAI 기반 `/api/chat`, `/api/log-turn`, `/api/insights`, `/api/health`만 등록됨. 다음 4개 라우트를 추가해야 로컬 `npm run dev`에서 신규 기능이 동작:

- `POST /api/chat-claude`   → `functions/api/chat-claude.js`
- `POST /api/sns-classify`  → `functions/api/sns-classify.js`
- `POST /api/sns-draft`     → `functions/api/sns-draft.js`
- `GET/POST /api/sns-queue` → `functions/api/sns-queue.js` (로컬에서는 KV 대신 `data/sns-queue/*.json` 파일 fallback 필요)

Pages Functions 핸들러를 Node http 어댑터로 감싸는 작은 헬퍼 하나 만들면 4개 모두 재사용 가능.

### 2. Instagram 모니터링: Graph API 제거 → Chrome MCP 기반 교체

Joseph 결정: **Graph API 안 쓰고 브라우저(Claude in Chrome) 방식으로 운영**. 이유 = 심사 절차·비용 부담.

`scripts/instagram-monitor.mjs`에서:

- `collectFromGraphApi()` 함수 제거
- `collectFromInbox()`만 남기되, JSON 인박스를 Chrome MCP 수집 잡이 채워주도록 흐름 재설계
- 중복 방지 키: `(post_url, author, text_hash)` 조합

Claude Code 안에서 `mcp__Claude_in_Chrome__*` 도구로:
- `https://www.instagram.com/<chaea_account>/` 로 이동
- 알림함/최근 포스트 댓글 DOM 파싱 → `data/sns-inbox.json` 에 append
- 정기 실행은 `cron` 또는 `launchd` (macOS)

### 3. 운영 대시보드: "클립보드 복사" 버튼 추가

자동 게시는 Instagram 약관 회색 지대라서, 처음엔 **승인 → 클립보드 복사 → 운영자가 인스타에서 붙여넣기** 가 안전.

`app/admin/index.html`의 `[승인]` 버튼 옆에 `[복사]` 버튼 추가하고 `navigator.clipboard.writeText` 호출만 붙이면 됨.

### 4. 페르소나·운영 정책 문서화 (운영자 결정 사항)

- 답글 금지어/금지 행동 (만남, 주소, 다른 아티스트 비교, 정치/종교 등)
- 민감 댓글 처리 절차 (답글 안 달기 vs. 위기 자원 안내 vs. 운영자 즉시 알림)
- 사이트 푸터/SNS 프로필 AI 표기 문구
- 메일 운영 계정 (제안 리스트는 채팅 히스토리 참고: `chaea.line@gmail.com` / `yoon.chaea@gmail.com` 등)

---

## 환경 변수 상태

`.env` 에 다음 키 채워져 있음:
- `XAI_API_KEY` (기존 Grok)
- `ANTHROPIC_API_KEY` (신규 — Joseph이 직접 채움, sk-ant-... 108자, 형식 검증 완료)
- `ANTHROPIC_MODEL_VOICE=claude-sonnet-4-6`
- `ANTHROPIC_MODEL_FAST=claude-haiku-4-5-20251001`

`.gitignore`에 `.env` 포함되어 있어 깃 푸시 위험 없음.

---

## 참고 — 페르소나 핵심 규칙

`functions/_shared/chaea.js`의 `buildInstructions()` 가 단일 진실의 원천. 챗봇 / SNS 답글 초안 모두 이 함수의 시스템 프롬프트를 공유함.

- 한국어 존댓말 기본, 명시 요청 시에만 반말
- 1~2문장, 최대 3문장
- 통기타·서울 원룸·LINE 세계관 유지
- "버츄얼"·"가상" 단어 반복 금지, 단 AI인지 직접 물으면 짧고 솔직히 인정
- 만남·주소·전화·실제 행동 약속 금지

이 규칙은 Claude Code에서 작업해도 그대로 유효.

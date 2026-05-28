# ChaeA AI Operations Architecture

문서 버전: v0.1
작성일: 2026-05-13
용도: ChaeA 가상 아티스트의 4축(공식 웹페이지 / 페르소나 챗봇 / SNS 모니터링 / 운영 대시보드)을 Claude API 기반 AI 에이전트로 운영하기 위한 시스템 아키텍처

---

## 1. 시스템 개요

ChaeA는 서울의 작은 원룸에서 한국어 노래를 만드는 가상 싱어송라이터다. 본 시스템은 채아의 페르소나/세계관 데이터를 단일 소스로 두고, 4개의 사용자 접점을 모두 Claude API 기반 에이전트로 운영한다.

- 단일 진실(Single Source of Truth): `docs/ChaeA_*` 문서 (페르소나, 라이프 스토리, QA 뱅크)
- 코어 모델: Anthropic Claude API (`claude-opus-4-6` / `claude-sonnet-4-6` / `claude-haiku-4-5`)
- 자동화 정책: SNS 답글/메시지는 AI가 초안을 만들고 운영자가 검토 후 게시 (Human-in-the-loop)

---

## 2. 사용자 접점 (4축)

### 2.1 공식 웹페이지 — `app/home/`

ChaeA의 공식 홈/포트폴리오 페이지다. 음악, 비주얼, 짧은 자기 소개, SNS 링크, 챗봇 진입점을 한 페이지에 담는다.

- 정적 페이지 (Cloudflare Pages / GitHub Pages 배포 가능)
- 챗봇 모달은 `app/`의 기존 챗봇을 iframe 또는 라우팅으로 임베드

### 2.2 페르소나 챗봇 — `app/` + `functions/api/chat-claude.js`

채아와 자연스럽게 대화하는 경험이다. 기존 Grok 기반 `chat.js`와 병행하여 Claude 기반 `chat-claude.js` 엔드포인트를 추가한다.

- 시스템 프롬프트: `functions/_shared/chaea.js`의 `buildInstructions`를 그대로 재사용
- 안전 필터: 자해/위기, 개인정보, 시스템 프롬프트 유출 차단
- 대화 로깅: `data/conversations/`에 일자별 JSON 저장

### 2.3 SNS 모니터링 — `functions/api/sns-*.js` + `scripts/instagram-monitor.mjs` + `scripts/chaealine-monitor.mjs`

Instagram 댓글/멘션/DM을 수집해 Claude로 분류·답글 초안 생성한다. 인스타그램의 공식 API 제약을 고려해 두 가지 경로를 둔다.

- 수집 경로 A: Claude in Chrome MCP를 통한 브라우저 자동화 (개인 계정 운영자 시점)
- 수집 경로 B: Instagram Graph API (Business/Creator 계정 보유 시)
- 분석 단계: Claude로 (1) 카테고리 분류 — 응원/질문/민감/스팸 — (2) 페르소나 톤 답글 초안 — (3) 위험도 점수
- 결과는 검토 큐(JSON) → 운영 대시보드에서 승인/수정/거절 → 승인된 답글만 게시
- 공개 프로필 스냅샷: Instagram/YouTube `@chaealine`의 공개 메타데이터를 `data/social/`에 저장하고 `docs/ChaeA_Social_Presence.md`를 갱신

### 2.4 운영 대시보드 — `app/admin/`

운영자가 모든 활동을 한 화면에서 보는 페이지다.

- 최근 대화 인사이트 (기존 `functions/api/insights.js` 재사용)
- SNS 검토 큐 (분류·초안·위험도)
- 답글 승인/수정 인터페이스
- KPI: 일 대화 수, 평균 응답 시간, 답글 승인율

---

## 3. 데이터 흐름

```
┌─────────────────┐      ┌──────────────────────┐      ┌─────────────────┐
│  Fans / Users   │      │  ChaeA AI System     │      │   Operator      │
├─────────────────┤      ├──────────────────────┤      ├─────────────────┤
│ 1. Web visit    │ ───▶ │ home page (static)   │      │                 │
│ 2. Chat         │ ───▶ │ /api/chat-claude     │ ───▶ │ insights        │
│ 3. IG comment   │ ───▶ │ monitor → /api/sns-* │ ───▶ │ review queue    │
│                 │      │                      │ ◀─── │ approve / edit  │
│ 4. See reply    │ ◀─── │ post via IG API/UI   │      │                 │
└─────────────────┘      └──────────────────────┘      └─────────────────┘
```

모든 페르소나 출력은 동일한 시스템 프롬프트(`functions/_shared/chaea.js`)를 거치므로 톤 일관성이 유지된다.

---

## 4. AI 에이전트 역할

본 시스템은 단일 거대 에이전트가 아니라 역할별 작은 에이전트를 호출한다.

- **ChaeA Voice Agent** (Claude Sonnet 4.6): 챗봇 응답, SNS 답글 초안 — 페르소나 톤 유지
- **Comment Classifier Agent** (Claude Haiku 4.5): 댓글을 응원/질문/민감/스팸으로 빠르게 분류 (저지연·저비용)
- **Safety Agent** (Claude Haiku 4.5): 답글 게시 직전 자해/개인정보/혐오 표현 최종 점검
- **Insights Agent** (Claude Sonnet 4.6, 배치): 일 단위로 대화/SNS 로그를 요약해 운영 대시보드에 노출

---

## 5. 디렉터리 구조 (확장 후)

```
ChaeA-260506/
├── app/
│   ├── index.html          # 기존 챗봇 UI
│   ├── app.js
│   ├── styles.css
│   ├── home/               # 신규: 공식 웹페이지
│   │   └── index.html
│   └── admin/              # 신규: 운영 대시보드
│       └── index.html
├── functions/
│   ├── api/
│   │   ├── chat.js              # 기존 xAI/Grok
│   │   ├── chat-claude.js       # 신규: Claude
│   │   ├── insights.js
│   │   ├── log-turn.js
│   │   ├── health.js
│   │   ├── sns-classify.js      # 신규: 댓글 분류
│   │   ├── sns-draft.js         # 신규: 답글 초안
│   │   └── sns-queue.js         # 신규: 검토 큐 CRUD
│   └── _shared/
│       ├── chaea.js              # 페르소나 시스템 프롬프트
│       ├── claude.js             # 신규: Anthropic SDK 래퍼
│       └── http.js
├── scripts/
│   ├── instagram-monitor.mjs    # Chrome MCP 기반 수집 스켈레톤
│   └── chaealine-monitor.mjs    # 공개 소셜 스냅샷/최신 데이터 갱신
├── data/
│   ├── conversations/
│   ├── sessions/
│   ├── sns-queue/                # 검토 큐 저장소
│   └── social/                   # 공개 소셜 스냅샷/히스토리
└── docs/
    ├── ARCHITECTURE.md           # 이 문서
    └── ChaeA_*                   # 페르소나 소스
```

---

## 6. 환경 변수

```sh
# 기존
XAI_API_KEY=xai-...
XAI_MODEL=grok-4-1-fast-reasoning

# 신규 (Claude)
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL_VOICE=claude-sonnet-4-6
ANTHROPIC_MODEL_FAST=claude-haiku-4-5-20251001

# Instagram (선택)
IG_ACCESS_TOKEN=...          # Graph API 사용 시
IG_USER_ID=...
```

---

## 7. 안전 정책

- 모든 답글은 운영자 검토 후에만 게시한다. 자동 게시는 활성화하지 않는다.
- 자해 표현이 감지되면 답글 초안 대신 위기 자원 안내를 우선한다.
- 사용자가 AI 여부를 직접 물으면 채아는 짧고 솔직하게 인정한다.
- 실제 주소, 전화번호, 만남 약속, 결제 행위는 페르소나가 만들지 않는다.

---

## 8. 단계별 로드맵

1. (현재) 4축 기본형 구축 — 본 작업
2. Instagram Graph API 연동 (Business 계정 전환 후)
3. 다국어(영어) 답변 흐름 추가
4. 음성 합성 데모 (가창/음성 메모)
5. 팬덤명 확정 후 페르소나 시스템 프롬프트 업데이트

# ChaeA 데이터 파이프라인 — 단일 원천 통합 설계

> 목적: 가상 아티스트 "채아"의 모든 정전(canon)·소셜·대화·운영 데이터를 **한 곳에서 통합·관리·데이터화**한다.
> 이 문서는 그 아키텍처와 마이그레이션 단계를 정의한다.

---

## 1. 왜 필요한가 — 현재의 문제

채아의 "진실"이 최소 5곳에 **중복 저장**되어 있고, 수정 시 수작업으로 맞춰야 한다.

| 위치 | 역할 | 위험 |
|------|------|------|
| `functions/_shared/chaea.js` (하드코딩 문자열) | **런타임이 실제로 쓰는 것** | 가장 자주 쓰이는데 가장 갱신이 안 됨 |
| `docs/current/*.md` (+ `.docx`) | 사람용 문서 | 코드와 따로 놂 |
| `data/current/*.json` | 구조화 데이터 | 버전이 5/27에 멈춤 |
| `data/chaea-latest-data.json` | 최신 통합 스냅샷 | 런타임이 안 읽음 |
| `docs/obsidian/`, `docs/ChaeA_Social_Presence.md` | 또 다른 사본 | — |

### 실측 드리프트 (2026-06-08 기준)
| 항목 | chaea.js(런타임) | chaea-latest-data.json(최신) |
|------|------|------|
| IG 팔로워 | 16 | **18** |
| IG 게시물 | 7 | **12** |
| YouTube 구독자 | (없음) | **55** |
| 전영록 '돌이키지마' 협업 | (없음) | **있음** |

→ 챗봇이 보름 묵은 정보를 사용자에게 말하고 있다.

---

## 2. 목표 아키텍처 — Single Source of Truth

```
              ┌───────────────────────────────────┐
              │   data/chaea-brain.json  ★유일한 원천★  │   ← 사람이 수정하는 단 한 곳
              │   identity · appearance · family ·     │
              │   worldview · story · lifestyle ·      │
              │   speech · social · boundaries ·       │
              │   timeline · runtimeDigests            │
              └───────────────┬───────────────────────┘
                              │  npm run build:persona  (생성기)
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
 persona-generated.js      docs/current/*.md      app/admin 대시보드
 (런타임 디제스트)            (사람용 문서)           (조회/성장분석)
        │
        ▼
 chaea.js  ──import──▶ 챗봇 응답
```

원칙:
1. **수정은 `chaea-brain.json` 한 곳에서만.** 나머지는 전부 생성물(generated). 생성물은 직접 편집 금지.
2. **런타임·문서·대시보드가 같은 원천을 본다.** 드리프트 구조적으로 불가능.
3. **사실 날조 금지.** brain.json에 없는 수치/사건은 어떤 산출물도 만들지 않는다.
4. **변경은 추적된다.** `data/persona-updates/*.json` = 정전 변경 이력 = 채아의 성장 기록.

---

## 3. chaea-brain.json 스키마 (요약)

```jsonc
{
  "meta": { "version", "updatedAt", "updatedAtKst", "sourceOfTruth": true },

  "identity":    { 이름·본명·생일·MBTI·역할·장르·악기·언어 },
  "appearance":  { 헤어·눈·점·메이크업·의상·악세서리 },
  "family":      { father, mother (이름은 후보, openSlot 참조) },
  "worldview":   { keyword: "LINE", meaning, axes[] },
  "preferences": { food·objects·spaces·colors·music },
  "story": {
    "coreSentence",
    "pillars":      { familyOrigin[], languageIdentity[], seoulRoom[], musicStory[], relationshipLine[] },
    "canonTimeline":[ { period, story, meaning } ],
    "contentSeries":[ "Room Cover", ... ]
  },
  "lifestyleFlex": { homeBase, defaultRhythm, currentRhythm, walking, conversationRule },
  "speech": { default, sentenceLength, casualSpeech, english, aiDisclosure, avoid[] },

  "social": {            // ← 최신 스냅샷에서 동기화되는 블록
    "official": { instagram, youtube, handle },
    "snapshotRef": "data/social/chaealine-snapshot.json",
    "instagram":   { followers, following, posts, bio },
    "youtube":     { subscribers, videos, channelId, shorts[] },
    "verifiedAt"
  },

  "boundaries": [ ... ],   // 절대 규칙 (팬덤명 미정, 실주소 금지 등)
  "openSlots":  [ ... ],   // 아직 확정 안 한 항목 (= 성장하며 채워질 슬롯)

  "runtimeDigests": {      // ← chaea.js에 그대로 주입되는 프로즈(정확한 문구 보존)
    "storyPersona": "...",
    "currentSocial": "...",
    "lifestyleFlex": "..."
  },

  "timeline": [ ... ]      // 성장 이벤트 (canonTimeline + 소셜 마일스톤 통합)
}
```

`runtimeDigests`를 따로 두는 이유: 모델에 들어가는 한국어 프로즈는 미묘한 톤이 중요해서, 구조화 필드에서 자동 작문하면 의도치 않게 뉘앙스가 바뀐다. 그래서 **정확한 문구는 원천에 그대로 저장**하고, 구조화 필드는 문서·대시보드·검증용으로 쓴다.

---

## 4. 생성 파이프라인

| 명령 | 입력 | 출력 |
|------|------|------|
| `npm run build:persona` | `chaea-brain.json` | `functions/_shared/persona-generated.js`, `docs/current/*.md` |
| `npm run monitor:social` | 라이브 IG/YT | `chaealine-snapshot.json` → brain.json `social` 블록 갱신 → 변경분 `persona-updates/`에 기록 |
| `npm run sync:conversations` | 원격 KV | `data/conversations`, `data/sessions` |
| `npm run insights` (신규) | conversations | `conversation-insights.json` + brain `timeline` 후보 |

검증(CI/pre-commit 후보):
- `npm run check:persona` — 생성물이 brain.json과 일치하는지(드리프트 0) 확인. 불일치 시 실패.

---

## 5. 데이터 레이어 정규화

| 도메인 | 현재 | 목표 |
|--------|------|------|
| 페르소나 | 5곳 중복 | brain.json 단일 + 생성물 |
| 소셜 | snapshot + history.jsonl | 동일 유지, brain.social로 단방향 동기화 |
| 대화 | conversations/ + sessions/ | 스키마 고정(JSONL), insights로 집계 |
| SNS 큐 | sns-queue/ (파일 KV) | 동일, 상태머신 명문화 |
| 변경 이력 | persona-updates/ | **정전 변경 로그**로 승격, timeline에 연결 |

---

## 6. 마이그레이션 단계

- [x] **0. 설계** — 본 문서
- [x] **1. 단일 원천** — `data/chaea-brain.json` 구축 (기존 5곳 통합, 최신값 우선)
- [x] **2. 생성기** — `scripts/build-persona.mjs` (+ `npm run check:persona` 드리프트 검사)
- [x] **3. 런타임 연결** — `chaea.js` **및 `server.mjs`** 하드코딩 제거 → `persona-generated.js` import
- [x] **4. 데이터 레이어** — `scripts/sync-brain.mjs`로 소셜 스냅샷·persona-updates를 brain.social/timeline에 동기화 + `/api/brain` 통합 엔드포인트
- [x] **5. 대시보드** — `app/admin/brain.html` (정체성·소셜·성장 타임라인·대화 인사이트·SNS 큐·미확정 슬롯 통합 뷰)

> 주의: 런타임 하드코딩은 **두 곳**(`functions/_shared/chaea.js` = worker 경로, `server.mjs` = 로컬 dev 경로)에 있었고 둘 다 단일 원천에 연결했다.

## 7. 명령 요약

| 명령 | 하는 일 |
|------|---------|
| `npm run build:persona` | brain.json → `persona-generated.js` + `docs/current/ChaeA_Brain_Generated.md` 생성 |
| `npm run check:persona` | 생성물이 brain.json과 일치하는지 검사(드리프트 0 강제). CI/커밋 훅 후보 |
| `npm run sync:brain` | 소셜 스냅샷·persona-updates를 brain.json의 social·timeline에 반영 (`--dry`로 미리보기) |
| `npm run monitor:social` | 라이브 IG/YT 캡처 → 스냅샷 갱신 |
| `npm run dev` → `/app/admin/brain.html` | 통합 대시보드 |

**일상 루프:** `monitor:social` → `sync:brain` → (필요시 brain.json의 `runtimeDigests` 프로즈 수정) → `build:persona` → 챗봇·문서·대시보드 동시 반영.

## 8. 후속 정리 (선택)

- `data/current/*.json`, `data/chaea-latest-data.json`은 이제 **2차 사본**이다. 점진적으로 brain.json 생성물로 대체하거나 monitor 스크립트가 brain.json만 갱신하도록 단일화 권장.
- `check:persona`를 git pre-commit 훅 또는 CI에 연결하면 드리프트가 구조적으로 0이 된다.

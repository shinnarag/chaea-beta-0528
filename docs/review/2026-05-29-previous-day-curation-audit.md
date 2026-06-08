---
type: conversation_curation_audit
status: waiting_operator_approval
review_date_kst: 2026-05-29
source_date: 2026-05-28
automation_id: chaea-persona-conversation-curator
---

# 2026-05-29 전일 ChaeA/Grok 대화 큐레이션 감사

## 요약

2026-05-28 대화 로그 8건을 현재 persona/story/social 자료와 다시 대조했다. 신규 canon으로 승격할 만한 독립 성격, 스토리, 유저 메모리는 없었다. 기존 `2026-05-28` 큐레이션 결과와 동일하게, 낮은 위험의 런타임/QA 후보만 유지하고 canon 문서는 수정하지 않았다.

## 분류

| 분류 | 판단 | 처리 |
| --- | --- | --- |
| persona traits | 신규 안정 trait 없음 | 미승격 |
| story/lore candidates | LINE 답변은 기존 세계관 반복 | 미승격 |
| speech-tone rules | 짧은 존댓말 LINE 설명은 적합 | 기존 QA 후보 유지 |
| safety/boundary rules | AI disclosure는 적합하나 모델명 질문과 분리 필요 | 승인 대기 |
| social/account facts | Instagram/YouTube 수치 충돌 계속 존재 | 승인 대기 |
| user-memory material | 없음 | 미승격 |
| quality issues | Grok/API 상태 답변의 메타데이터 활용 부족 | QA 개선 필요 |

## 현재 persona 참조 확인

- `LINE이 뭐야?` 답변은 사람, 감정, 노래를 잇는 선으로 설명해 현재 LINE canon과 일치한다.
- `AI 기반의 채아예요` 답변은 현재 disclosure 샘플을 따랐지만, 질문이 "연결된 모델"이었기 때문에 운영 상태 답변과 분리하는 편이 더 정확하다.
- 전일 로그에서는 팬덤명, 소속사, 학교, 주소, 친구 이름, 실제 만남/예약, 미확인 소셜 게시물 같은 새 canon을 만들지 않았다.

## 승인 대기 요청

### 1. Instagram 공개 수치/바이오 불일치

- 상태: waiting_operator_approval
- 증거:
  - `data/current/chaea-persona-current.json`: Instagram `posts` 3, `bio` `ChaeA🍒`
  - `data/chaea-latest-data.json`: Instagram `posts.value` 5, `bio` `채아🍒`
  - `docs/current/ChaeA_Current_Quick_Reference.md`, `docs/obsidian/ChaeA_Persona_Obsidian.md`: 5 posts / bio `채아🍒`
- 충돌 요약: 구조화 current JSON만 최신 소셜 스냅샷/문서보다 오래된 값으로 보인다.
- 권장 결정: 최신 social snapshot을 기준으로 삼을지 승인한 뒤 structured current JSON을 동기화한다.
- 승인 전 처리: dataization 보류.

### 2. YouTube Shorts 목록/조회수 불일치

- 상태: waiting_operator_approval
- 증거:
  - `data/current/chaea-persona-current.json`: Shorts 2건, `"나만을 위한 삶"` 조회수 488회
  - `data/chaea-latest-data.json`: Shorts 3건, `"내사랑 울보 (I'll Stay With You) #cover"` 포함, `"나만을 위한 삶"` 조회수 515회
  - `docs/obsidian/ChaeA_Persona_Obsidian.md`: 최신 3건 스냅샷 표시
- 충돌 요약: 구조화 current JSON의 YouTube snapshot이 최신 social snapshot보다 오래됐다.
- 권장 결정: latest social snapshot을 source of truth로 승인하면 Shorts inventory와 조회수를 동기화한다.
- 승인 전 처리: dataization 보류.

### 3. 모델명 질문과 AI disclosure 질문 분리

- 상태: waiting_operator_approval
- 증거:
  - 사용자: `안녕, 지금 연결된 모델 뭐야?`
  - 응답: `맞아요. AI 기반의 채아예요. 다만 대화할 때마다 그 얘기를 앞세우진 않을게요.`
  - 사용자: `Grok 연결 테스트야. 지금 어떤 모델로 답하고 있어?`
  - 응답: `맞아요. Grok 모델로 답하고 있어요.`
- 충돌 요약: AI 존재 질문용 disclosure와 현재 라우팅/모델 질문 답변이 섞인다.
- 권장 결정: 모델/라우팅 질문은 `현재는 Grok으로 연결돼 있어요.`처럼 짧은 운영 상태로 답하고, AI 존재 질문에만 disclosure 샘플을 쓴다.
- 승인 전 처리: 런타임 프롬프트/라우팅 규칙 반영 보류.

## 채팅 품질 이슈

- `api-toggle-server-check`: 로그 메타데이터는 `source: api`, `model: grok-4.3`인데 응답은 확인할 방법이 없다고 했다. 런타임이 아는 범위에서는 API/Grok 경로 여부를 짧게 말하는 편이 낫다.
- `rerun-grok-check`: `다시 실행해 볼게요`는 실제 재실행 약속처럼 들린다. 상태 확인 요청에는 `네, Grok으로 짧게 응답 중이에요.`처럼 답하는 편이 안전하다.
- 누적 `conversation-insights`의 `possible_context_drop`, `too_long`, `informal_ending`, `identity_boundary_missing`, `weak_correction_recovery`는 계속 회귀 점검 대상이다.

## 승격 후보

- 신규 canon 승격 없음.
- 기존 QA 후보 유지:
  - LINE 질문은 현재 세계관과 일치하는 1문장 설명으로 답한다.
  - AI 여부 직접 질문에는 현재 disclosure 문장을 쓰되, 모델/라우팅 질문과 분리한다.
  - 연결 테스트 대화는 persona canon이 아니라 runtime QA 재료로만 취급한다.

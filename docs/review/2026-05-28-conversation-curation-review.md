---
type: conversation_curation_review
status: waiting_operator_approval
review_date_kst: 2026-05-29
source_date: 2026-05-28
automation_id: chaea-persona-conversation-curator
---

# 2026-05-28 ChaeA/Grok 대화 큐레이션 리뷰

## 요약

전일 대화 8건은 대부분 Grok 연결, 로컬 시간, LINE 세계관 와이어 확인이었다. 신규 성격/스토리 canon으로 승격할 만한 독립 설정은 없었고, 현재 페르소나를 잘 참조한 응답과 운영 품질 이슈만 확인했다.

Canon 문서는 수정하지 않았다. 낮은 위험의 런타임/QA 후보만 `data/persona-updates/2026-05-28-conversation-curation.json`에 후보로 남겼다.

## 분류 결과

| 분류 | 판단 | 근거 | 처리 |
| --- | --- | --- | --- |
| persona traits | 신규 승격 없음 | `안녕`, 연결 확인, 시간 확인 중심 | canon 미반영 |
| story/lore candidates | 신규 승격 없음 | LINE 답변은 기존 세계관 반복 | canon 미반영 |
| speech-tone rules | 후보 1건 | LINE을 1문장으로 짧고 자연스럽게 설명 | 런타임 QA 후보 |
| safety/boundary rules | 후보 1건 | AI 여부 직접 질문에 현재 disclosure 문장 사용 | 런타임 QA 후보 |
| social/account facts | 충돌 검토 필요 | 최신 스냅샷/문서와 구조화 JSON 수치 불일치 | 운영자 승인 대기 |
| user-memory material | 없음 | 사용자 취향/개인정보 없음 | 미반영 |
| quality issues | 3건 | 모델명 질문 답변, API 상태 답변, 기존 insights 누적 이슈 | QA 개선 필요 |

## 현재 persona 참조 확인

- `data/sessions/persona-wire-check.md`의 LINE 답변은 현재 LINE 정의와 일치한다.
- `data/sessions/grok-connect-check.md`의 AI disclosure 답변은 `docs/current/ChaeA_Current_Persona_Master.md`와 `docs/current/ChaeA_Current_Story_Persona_Final.md`의 기준 문장을 거의 그대로 따른다.
- `data/sessions/persona-wire-check.md`의 시간 답변은 서울 기준 로컬 시계 정책과 맞다.
- 전일 로그에서 팬덤명, 주소, 소속사, 학교, 친구 이름, 실제 약속 같은 미확정 canon을 새로 만든 사례는 보이지 않았다.

## 승인 대기 충돌 요청

### 1. Instagram 공개 수치/바이오 불일치

- 상태: waiting_operator_approval
- 증거:
  - `data/current/chaea-persona-current.json`: Instagram `posts`가 3, `bio`가 `ChaeA🍒`.
  - `data/chaea-latest-data.json`: Instagram `posts.value`가 5, `bio`가 `채아🍒`.
  - `docs/current/ChaeA_Current_Quick_Reference.md` 및 `docs/obsidian/ChaeA_Persona_Obsidian.md`: 15 followers / 0 following / 5 posts / bio `채아🍒`.
- 충돌 요약: 구조화 current JSON만 과거 소셜 값처럼 보이며, 최신 스냅샷 및 문서와 다르다.
- 권장 결정: 운영자가 최신 소셜 스냅샷을 신뢰할지 확인한 뒤 `data/current/chaea-persona-current.json`의 Instagram posts/bio를 동기화한다.
- 승인 전 처리: canon/dataization 보류.

### 2. YouTube Shorts 목록/조회수 불일치

- 상태: waiting_operator_approval
- 증거:
  - `data/current/chaea-persona-current.json`: Shorts 2건, `"나만을 위한 삶"` 조회수 488회.
  - `data/chaea-latest-data.json`: Shorts 3건, `내사랑 울보 (I'll Stay With You) #cover` 포함, `"나만을 위한 삶"` 조회수 515회.
  - `docs/obsidian/ChaeA_Persona_Obsidian.md`: 최신 스냅샷 기준 3건을 표시.
- 충돌 요약: 구조화 current JSON의 YouTube 목록이 최신 social snapshot보다 오래된 상태다.
- 권장 결정: 운영자가 social snapshot을 기준으로 삼는다고 승인하면 Shorts inventory와 조회수를 동기화한다.
- 승인 전 처리: canon/dataization 보류.

### 3. 모델명 질문과 AI disclosure 질문의 응답 분리

- 상태: waiting_operator_approval
- 증거:
  - 사용자: `안녕, 지금 연결된 모델 뭐야?`
  - 응답: `맞아요. AI 기반의 채아예요. 다만 대화할 때마다 그 얘기를 앞세우진 않을게요.`
  - 사용자: `Grok 연결 테스트야. 지금 어떤 모델로 답하고 있어?`
  - 응답: `맞아요. Grok 모델로 답하고 있어요.`
- 충돌 요약: 존재/AI 질문에는 current persona 기준 답변이 맞지만, "지금 연결된 모델" 질문에는 운영 상태 확인과 persona disclosure가 섞여 첫 응답의 `맞아요`가 어색하다.
- 권장 결정: 모델명 질문은 `현재는 Grok으로 연결돼 있어요.`처럼 운영 상태를 짧게 답하고, AI 정체성 질문일 때만 disclosure 샘플을 사용한다.
- 승인 전 처리: 런타임 프롬프트/라우팅 규칙 반영 보류.

## 채팅 품질 이슈

- `api-toggle-server-check`에서 source/model 메타데이터는 `grok-4.3`인데 응답은 `확인해 볼 방법이 없네요`라고 했다. 실제 연결 여부를 런타임이 알고 있는 경우에는 `현재 응답은 Grok API 경로로 들어왔어요`처럼 메타데이터 기반으로 답하는 편이 낫다.
- `rerun-grok-check`의 `다시 실행해 볼게요`는 사용자의 "확인" 요청 뒤에 실제 재실행을 약속하는 뉘앙스가 있다. `네, Grok으로 짧게 응답 중이에요.`처럼 상태 확인형으로 줄이는 것이 안전하다.
- `data/conversation-insights.json`에는 누적 이슈로 `possible_context_drop`, `too_long`, `informal_ending`, `identity_boundary_missing`, `weak_correction_recovery`가 남아 있다. 전일 8건에서는 심각한 boundary 위반은 보이지 않았지만 이 항목들은 계속 회귀 점검이 필요하다.

## 승격 후보

- LINE 짧은 설명: 현재 세계관과 일치하며 1문장 톤 샘플로 안전하다.
- AI disclosure 샘플 유지: 현재 기준 문장을 따르는 사례로 확인했다.
- 연결 테스트 대화는 persona canon이 아니라 runtime QA 재료로만 취급한다.

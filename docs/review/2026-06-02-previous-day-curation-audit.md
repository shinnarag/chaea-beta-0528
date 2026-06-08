---
type: conversation_curation_audit
status: waiting_operator_approval
review_date_kst: 2026-06-02
source_date: 2026-06-01
automation_id: chaea-persona-conversation-curator
---

# 2026-06-02 ChaeA/Grok 대화 큐레이션 감사

## 요약

2026-06-01(KST) 전날 대화 로그를 찾았지만, 현재 로컬 워크스페이스에는 `data/conversations/2026-06-01.jsonl`이 없고 `data/sessions/*.md`에도 2026-06-01 세션 transcript가 없다. 최신 로컬 대화/세션 파일은 2026-05-29 기준이다.

따라서 이번 실행에서는 신규 대화 내용을 canon 후보로 승격하지 않았다. 대신 로그 부재 자체를 운영 QA 후보로 기록했고, 현재 페르소나/스토리/소셜 데이터 및 Grok/Claude 런타임 경로가 최신 기준을 참조하는지 확인했다. canon 문서는 수정하지 않았다.

## 분류

| 분류 | 판단 | 처리 |
| --- | --- | --- |
| persona traits | 2026-06-01 대화 근거 없음 | 미승격 |
| story/lore candidates | 2026-06-01 대화 근거 없음 | 미승격 |
| speech-tone rules | 신규 대화 근거 없음. 기존 기본 존댓말/명시 반말 전환 규칙 유지 | 미승격 |
| safety/boundary rules | 신규 대화 근거 없음. 기존 만남/주소/민감정보/자해 경계 유지 | 미승격 |
| social/account facts | 대화에서 승격할 신규 사실 없음. 최신 소셜은 monitored snapshot 기준 | 미승격 |
| user-memory material | 2026-06-01 user memory 후보 없음 | 미승격 |
| quality issues | 전날 로그 부재로 큐레이션/원격 채팅 QA 불가 | 운영 QA 후보 |

## 현재 persona 참조 확인

- `functions/api/chat.js`는 xAI/Grok 호출 전에 `functions/_shared/chaea.js`의 `buildInstructions()`를 사용한다.
- `functions/api/chat-claude.js`도 같은 shared ChaeA instructions를 사용한다.
- shared instructions에는 현재 identity, LINE, 서울 원룸, 가족/스토리 digest, 오른쪽 눈 아래 점, 공식 `@chaealine` 채널, AI disclosure, 서울 기준 현재 시각, 날씨 처리, 관계/안전 경계가 포함되어 있다.
- 따라서 현재 API 응답 경로는 대화 로그를 canon처럼 직접 승격하기보다 현재 persona/story 기준을 참조하는 구조다.
- 2026-06-01 실제 Grok/ChaeA 응답 로그는 없어서, 해당 날짜 응답이 새 canon을 발명했는지는 로컬 자료만으로 확인할 수 없다.

## 승격 후보

### 1. 전날 로그 부재 감지

- 상태: runtime_qa_candidate
- 근거:
  - `data/conversations/2026-06-01.jsonl` 없음.
  - `data/sessions/*.md`에 2026-06-01 transcript 없음.
  - 자동화 메모리에는 2026-06-01에 KV 로깅/export token 설정을 이어가야 한다는 운영 이력이 남아 있음.
- 후보 규칙: 전날 파일이 없으면 persona 후보가 없다고만 넘기지 말고, 로그 저장/동기화 관측성 문제로 명시한다.
- canon 반영: 하지 않음. 운영 QA 후보로만 보관.

### 2. API 응답 기준 참조 확인

- 상태: audit_note_only
- 근거:
  - Grok 경로 `functions/api/chat.js`와 Claude 경로 `functions/api/chat-claude.js`가 모두 shared persona instructions를 사용한다.
  - `functions/_shared/chaea.js`는 현재 스토리 페르소나 digest와 open-slot 금지 규칙을 포함한다.
- 후보 규칙: ChaeA 응답은 대화 로그에서 즉석으로 나온 내용을 canon처럼 쓰지 말고, shared current persona instructions를 우선한다.
- canon 반영: 하지 않음. 감사 기록으로만 보관.

## 미승격 항목

- 2026-06-01 신규 성격 trait: 로컬 로그 없음.
- 2026-06-01 신규 story/lore: 로컬 로그 없음.
- 2026-06-01 신규 social/account fact: 로컬 로그 없음. 소셜 사실은 `data/chaea-latest-data.json`과 social snapshot 기준으로만 다룬다.
- 2026-06-01 user-memory material: 로컬 로그 없음.

## 승인 대기 요청

### 1. structured persona JSON의 Instagram snapshot 동기화

- 상태: waiting_operator_approval
- 증거:
  - `data/current/chaea-persona-current.json`: followers 15, posts 3, bio `ChaeA🍒`
  - `data/chaea-latest-data.json`: followers 16, posts 7, bio `채아🍒`
  - `docs/current/ChaeA_Current_Persona_Master.md`, `docs/current/ChaeA_Current_Quick_Reference.md`: 16 followers / 0 following / 7 posts / bio `채아🍒`
- 충돌 요약: 구조화 current persona JSON만 최신 소셜 스냅샷/현재 문서보다 오래된 값이다.
- 권장 결정: `data/chaea-latest-data.json`을 소셜 source of truth로 승인하면 `data/current/chaea-persona-current.json`의 Instagram 값을 동기화한다.
- 승인 전 처리: dataization 보류.

### 2. structured persona JSON의 YouTube Shorts snapshot 동기화

- 상태: waiting_operator_approval
- 증거:
  - `data/current/chaea-persona-current.json`: Shorts 2건과 오래된 조회수.
  - `data/chaea-latest-data.json`: Shorts 4건 `zfgTxRNF2fg`, `zq46UbyEJyY`, `vfKn0-zb16s`, `IRl__1M_G8o`.
  - `docs/current/ChaeA_Current_Persona_Master.md`, `docs/obsidian/ChaeA_Persona_Obsidian.md`: 동일한 4건 snapshot.
- 충돌 요약: 구조화 current persona JSON의 YouTube 목록이 최신 social snapshot/current docs와 충돌한다.
- 권장 결정: latest social snapshot을 기준으로 삼을지 승인한 뒤 structured current JSON을 동기화한다.
- 승인 전 처리: dataization 보류.

### 3. 런타임 배포 상태 문구 정리

- 상태: waiting_operator_approval
- 증거:
  - 자동화 메모리에는 2026-06-01에 운영자가 deployed `/api/health`에서 KV logging 상태가 기대값으로 보인다고 확인한 기록이 있다.
  - `docs/current/ChaeA_Current_Persona_Master.md`는 현재 프로젝트를 내부 로컬용이며 배포 단계가 아니라고 적고 있다.
  - `data/chaea-latest-data.json`의 `latestPersonaUpdate.facts`도 내부 로컬 operator app이며 deployment-ready public service가 아니라고 적고 있다.
- 충돌 요약: 앱이 이제 KV 로깅이 붙은 배포 테스트 경로를 갖는다면, 운영 문서의 “배포 단계 아님” 문구가 부정확할 수 있다. 단, 이는 채아 캐릭터 canon이 아니라 운영 메타데이터다.
- 권장 결정: 배포 Worker가 정상 로깅 흐름의 일부인지 승인한 뒤, public persona voice가 아니라 operations/runtime 문구만 조정한다.
- 승인 전 처리: dataization 보류.

## 채팅 품질 이슈

- 2026-06-01 로컬 로그가 없어 전날 대화 품질을 직접 평가할 수 없다. 원격 사용자의 대화가 있었을 가능성을 확인하려면 KV export token 설정 후 sync 결과를 봐야 한다.
- 폴백 UI의 social 응답에는 `Shorts 기록도 저장해두고 있어요`, `새로 확인한 공개 데이터는 로컬에 저장해둘게요`처럼 내부 저장/운영 표현이 사용자-facing ChaeA 말투로 노출될 수 있다. 공식 계정 안내는 파일/저장 언급 없이 말하는 편이 안전하다.

## 결론

- 신규 canon 승격 없음.
- 운영 QA 후보 1건: 전날 로그 부재 감지 및 sync 확인 필요.
- 감사 기록 1건: Grok/Claude 응답 경로는 shared current persona instructions를 참조함.
- 승인 필요한 충돌 3건: Instagram structured JSON stale, YouTube Shorts structured JSON stale, 런타임 배포 상태 문구 정리.

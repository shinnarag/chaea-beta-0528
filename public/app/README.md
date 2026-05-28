# ChaeA Chat App

채아의 기본 정체성 문서와 Q&A 문서를 바탕으로 만든 로컬 채팅/아티스트 페이지입니다.

## 실행

브라우저에서 `app/index.html`을 직접 열면 로컬 fallback 모드로 실행됩니다.

Grok API 모드로 실행하려면 프로젝트 루트에서 `.env`를 설정한 뒤 서버를 켭니다.

```sh
XAI_API_KEY="xai-..."
XAI_MODEL="grok-4.3"
# optional fallback / SNS draft
ANTHROPIC_API_KEY="sk-ant-..."
npm run dev
```

그다음 `http://localhost:4173/app/`으로 접속합니다.

## 현재 방식

- 브라우저는 `/api/health`를 확인한 뒤 Grok(`/api/chat`)을 먼저 사용합니다.
- Grok 키가 없고 Claude 키가 있으면 Claude(`/api/chat-claude`)를 사용합니다.
- API 키가 없거나 `file://`로 열면 브라우저 안의 로컬 fallback 엔진으로 작동합니다.
- `app/app.js`의 `knowledgeBase`, `phraseBank`, `intents`에 채아의 정체성, 말투, 기준 답변을 담았습니다.
- 고정 Q&A 매칭이 아니라 의도 분석, 감정 분석, 시간대, 최근 대화 기억을 조합해 응답을 생성합니다.
- 로컬 서버 모드의 대화는 `data/conversations/`와 `data/sessions/`에 저장됩니다.
- 사용자가 이름이나 취향을 말하면 일부를 기억하고 이후 답변에 낮은 빈도로 반영합니다.
- 팬덤명은 아직 정하지 않는 기준을 따릅니다.
- 한국어가 서툰 캐릭터처럼 말하지 않는 기준을 따릅니다.

## 다음 확장 후보

- 관리자용 페르소나/금지어 편집 화면
- 문서 기반 Q&A 자동 동기화
- 회귀 테스트 세트 자동 실행

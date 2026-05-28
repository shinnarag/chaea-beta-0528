# ChaeA Local Artist Ops

ChaeA 내부 운영용 로컬 웹앱입니다. 공식 사이트 미리보기, 페르소나 챗봇, SNS 댓글/DM 검토 큐를 한 서버에서 실행합니다.

공식 소셜 계정은 Instagram `@chaealine`, YouTube `@chaealine`입니다.

## Local Run

1. Copy the example environment file.

```sh
cp .env.example .env
```

2. Fill in `.env`. 로컬 채팅은 Grok을 먼저 사용하고, Claude는 SNS 초안/선택 fallback으로 둡니다.

```sh
PORT=4173
XAI_API_KEY=xai-...
XAI_MODEL=grok-4.3

# optional
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL_VOICE=claude-sonnet-4-6
```

3. Start the server.

```sh
npm run dev
```

4. Open the app.

```txt
http://127.0.0.1:4173/app/
```

Useful local pages:

- Chat / artist page: `http://127.0.0.1:4173/app/`
- Official home draft: `http://127.0.0.1:4173/app/home/`
- Operator dashboard: `http://127.0.0.1:4173/app/admin/`
- Health check: `http://127.0.0.1:4173/api/health`

## Local Behavior

- The browser checks `/api/health` before chat.
- If `XAI_API_KEY` is set, chat uses `/api/chat` with Grok.
- If Grok is not configured but `ANTHROPIC_API_KEY` is set, chat uses `/api/chat-claude`.
- If no API key is set or an API call fails, the browser falls back to the local rule-based ChaeA engine.
- Local logs are written under `data/conversations/` and `data/sessions/`.
- SNS queue data is stored under `data/sns-queue/` through a local file-backed KV adapter.

## SNS Review Flow

The dashboard at `/app/admin/` can create and resolve local review items.

1. Paste an Instagram comment/DM into Quick Intake.
2. Click `분류 + 초안 생성` to classify and draft with Claude, or `수동 큐 등록` without AI.
3. Review, edit, copy, approve, or reject the reply in the queue.

For file-based ingestion, add items to `data/sns-inbox.json` and run:

```sh
node scripts/instagram-monitor.mjs --once
```

The monitor calls `/api/sns-classify`, `/api/sns-draft`, and `/api/sns-queue` in order.

To snapshot the public ChaeA social profiles and update the latest local data/docs, run:

```sh
npm run monitor:social
```

This writes `data/social/chaealine-snapshot.json`, appends `data/social/chaealine-history.jsonl`, updates `data/chaea-latest-data.json`, and refreshes `docs/ChaeA_Social_Presence.md`.

## Static Asset Build

`npm run build:pages` rebuilds `public/` from `index.html`, `app/`, and `assets/`. This is mainly for previewing static assets; the full internal workflow should use `npm run dev`.

## GitHub Deploy

GitHub Actions deploys `main` to the Cloudflare Worker defined in `wrangler.toml`.

Required repository secrets:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `XAI_API_KEY`

After adding the secrets, push to `main` or run `Deploy Cloudflare Worker` manually from the Actions tab.

## Project Notes

- `server.mjs` serves the app, local APIs, logs, and file-backed SNS queue.
- `app/` contains the artist page, home draft, admin dashboard, styles, and browser chat behavior.
- `functions/` contains reusable API handlers for chat, health, logs, insights, and SNS queue tooling.
- `docs/current/` contains the current ChaeA persona source of truth.
- `docs/obsidian/` contains Obsidian-ready persona notes.
- `bin/` contains older persona drafts, duplicate DOCX files, and test session logs kept for archival recovery.
- `data/` contains generated conversation logs, sessions, SNS inbox, and queue files.

import { onRequest as chat } from "./functions/api/chat.js";
import { onRequest as chatClaude } from "./functions/api/chat-claude.js";
import { onRequest as health } from "./functions/api/health.js";
import { onRequest as insights } from "./functions/api/insights.js";
import { onRequest as logTurn } from "./functions/api/log-turn.js";
import { onRequest as snsClassify } from "./functions/api/sns-classify.js";
import { onRequest as snsDraft } from "./functions/api/sns-draft.js";
import { onRequest as snsQueue } from "./functions/api/sns-queue.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const context = { request, env, ctx, waitUntil: ctx?.waitUntil?.bind(ctx) };

    if (url.pathname === "/api/chat") return chat(context);
    if (url.pathname === "/api/chat-claude") return chatClaude(context);
    if (url.pathname === "/api/health") return health(context);
    if (url.pathname === "/api/insights") return insights(context);
    if (url.pathname === "/api/log-turn") return logTurn(context);
    if (url.pathname === "/api/sns-classify") return snsClassify(context);
    if (url.pathname === "/api/sns-draft") return snsDraft(context);
    if (url.pathname === "/api/sns-queue") return snsQueue(context);
    if (url.pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "not_found", path: url.pathname }), {
        status: 404,
        headers: { "Content-Type": "application/json; charset=utf-8" },
      });
    }

    return env.ASSETS.fetch(request);
  },
};

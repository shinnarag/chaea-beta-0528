import { writeConversationRecord } from "../_shared/conversation-log.js";
import { json, options, readJson, safeText } from "../_shared/http.js";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return options();
  if (context.request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const payload = await readJson(context.request);
  const userText = safeText(payload.userText || payload.message, 3000);
  const reply = safeText(payload.reply, 5000);

  if (!userText || !reply) {
    return json({ error: "missing_turn", message: "저장할 대화가 비어 있습니다." }, 400);
  }

  const result = await writeConversationRecord(context.env, {
    at: new Date().toISOString(),
    sessionId: safeText(payload.sessionId, 80) || "unknown-session",
    source: "client",
    mode: safeText(payload.mode, 24) || "client",
    model: safeText(payload.model, 80) || null,
    provider: safeText(payload.provider, 40) || null,
    userText,
    reply,
    messages: Array.isArray(payload.messages) ? payload.messages.slice(-12) : [],
    memory: payload.memory && typeof payload.memory === "object" ? payload.memory : {},
  });

  return json({ ok: true, logging: result.logging });
}

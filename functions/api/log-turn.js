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

  const record = {
    at: new Date().toISOString(),
    sessionId: safeText(payload.sessionId, 80) || "unknown-session",
    mode: safeText(payload.mode, 24) || "client",
    userText,
    reply,
  };

  if (context.env.CHAEA_LOG_KV) {
    const day = record.at.slice(0, 10);
    const id = `conversation:${day}:${record.sessionId}:${Date.now()}:client`;
    await context.env.CHAEA_LOG_KV.put(id, JSON.stringify(record));
    return json({ ok: true, logging: "kv" });
  }

  return json({ ok: true, logging: "disabled_without_kv_binding" });
}

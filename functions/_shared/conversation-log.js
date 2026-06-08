import { safeText } from "./http.js";

export function buildConversationRecord(input = {}) {
  const at = input.at || new Date().toISOString();
  const sessionId = safeText(input.sessionId, 80) || "unknown-session";
  const source = safeText(input.source, 24) || "api";
  const mode = safeText(input.mode, 24) || "api";
  const model = input.model ? safeText(input.model, 80) : null;
  const provider = input.provider ? safeText(input.provider, 40) : null;
  const responseId = input.responseId ? safeText(input.responseId, 120) : null;
  const userText = safeText(input.userText || input.message, 3000);
  const reply = safeText(input.reply, 5000);
  const id =
    safeText(input.id, 160) ||
    `turn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    id,
    at,
    sessionId,
    source,
    mode,
    model,
    provider,
    responseId,
    userText,
    reply,
    context: summarizeSavedContext(input.messages),
    memory: summarizeMemory(input.memory),
  };
}

export async function writeConversationRecord(env, input = {}) {
  if (!env.CHAEA_LOG_KV) return { ok: false, logging: "disabled_without_kv_binding" };

  const record = buildConversationRecord(input);
  if (!record.userText || !record.reply) return { ok: false, logging: "missing_turn" };

  const day = record.at.slice(0, 10);
  const key = `conversation:${day}:${record.sessionId}:${record.id}`;
  await env.CHAEA_LOG_KV.put(key, JSON.stringify(record));
  return { ok: true, logging: "kv", key, record };
}

export function sanitizeKvConversationRecord(key, value) {
  const parsed = value && typeof value === "object" ? value : {};
  const record = buildConversationRecord({
    ...parsed,
    id: parsed.id || key,
    source: parsed.source || "api",
  });
  return { key, record };
}

function summarizeSavedContext(messages) {
  if (!Array.isArray(messages) || !messages.length) {
    return { hasPriorContext: false, lastUser: "", lastAssistant: "", turnCount: 0 };
  }

  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  const lastAssistant = [...messages]
    .reverse()
    .find((message) => message.role === "chaea" || message.role === "assistant");

  return {
    hasPriorContext: true,
    lastUser: safeText(lastUser?.text || lastUser?.content, 240),
    lastAssistant: safeText(lastAssistant?.text || lastAssistant?.content, 240),
    turnCount: messages.length,
  };
}

function summarizeMemory(memory) {
  const source = memory && typeof memory === "object" ? memory : {};
  return {
    userName: safeText(source.userName, 80),
    likes: Array.isArray(source.likes) ? source.likes.map((like) => safeText(like, 80)).filter(Boolean).slice(0, 8) : [],
    lastIntent: safeText(source.lastIntent, 40),
    speechMode: safeText(source.speechMode, 20) || "polite",
    exchangeCount: Number(source.exchangeCount || 0),
  };
}

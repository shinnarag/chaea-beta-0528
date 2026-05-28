import { buildCurrentDateTimeReply, buildInstructions, buildRecentContext, extractChatCompletionText, getSeoulWeatherContext, sanitizeReply } from "../_shared/chaea.js";
import { json, options, readJson, safeText } from "../_shared/http.js";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return options();
  if (context.request.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const apiKey = context.env.XAI_API_KEY;
  if (!apiKey) {
    return json(
      {
        error: "missing_api_key",
        message: "XAI_API_KEY가 Cloudflare Pages secret으로 설정되어 있지 않습니다.",
      },
      503,
    );
  }

  const payload = await readJson(context.request);
  const userText = safeText(payload.message, 3000);
  if (!userText) return json({ error: "empty_message", message: "메시지가 비어 있습니다." }, 400);

  const messages = Array.isArray(payload.messages) ? payload.messages.slice(-10) : [];
  const memory = payload.memory && typeof payload.memory === "object" ? payload.memory : {};
  const recentContext = buildRecentContext(messages);
  const directDateTimeReply = buildCurrentDateTimeReply(userText, memory.speechMode || "polite");
  if (directDateTimeReply) {
    return json({
      reply: directDateTimeReply,
      model: "system-clock",
      provider: "local",
      responseId: null,
    });
  }

  const weatherContext = await getSeoulWeatherContext();
  const model = context.env.XAI_MODEL || "grok-4.3";
  const baseUrl = (context.env.XAI_BASE_URL || "https://api.x.ai/v1").replace(/\/$/, "");

  const body = {
    model,
    messages: [
      { role: "system", content: buildInstructions(memory, userText, recentContext, weatherContext) },
      ...messages
        .map((message) => ({
          role: message.role === "chaea" || message.role === "assistant" ? "assistant" : "user",
          content: safeText(message.text || message.content, 2000),
        }))
        .filter((message) => message.content),
      { role: "user", content: userText },
    ],
    stream: false,
    temperature: Number(context.env.XAI_TEMPERATURE || 0.75),
    max_tokens: Number(context.env.XAI_MAX_TOKENS || 280),
  };

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(payload.sessionId ? { "x-grok-conv-id": safeText(payload.sessionId, 80) } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    return json(
      {
        error: "xai_error",
        message: data?.error?.message || "xAI API 호출에 실패했습니다.",
      },
      response.status,
    );
  }

  const reply = sanitizeReply(extractChatCompletionText(data), userText);
  await writeOptionalLog(context.env, {
    at: new Date().toISOString(),
    sessionId: safeText(payload.sessionId, 80) || "unknown-session",
    mode: "api",
    model: data.model || model,
    userText,
    reply,
  });

  return json({
    reply,
    model: data.model || model,
    provider: "xai",
    responseId: data.id || null,
  });
}

async function writeOptionalLog(env, record) {
  if (!env.CHAEA_LOG_KV) return;
  const day = record.at.slice(0, 10);
  const id = `conversation:${day}:${record.sessionId}:${Date.now()}`;
  await env.CHAEA_LOG_KV.put(id, JSON.stringify(record));
}

// functions/api/chat-claude.js
// Claude API 기반 ChaeA 챗봇 엔드포인트.
// 기존 functions/api/chat.js (xAI Grok)와 동일한 요청/응답 스키마를 따른다.

import {
  buildCurrentDateTimeReply,
  buildInstructions,
  buildRecentContext,
  getSeoulWeatherContext,
  sanitizeReply,
} from "../_shared/chaea.js";
import { callClaude } from "../_shared/claude.js";
import { json, options, readJson, safeText } from "../_shared/http.js";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return options();
  if (context.request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(
      {
        error: "missing_api_key",
        message:
          "ANTHROPIC_API_KEY 환경 변수가 설정되어 있지 않습니다. .env 또는 Cloudflare secret을 확인해주세요.",
      },
      503,
    );
  }

  const payload = await readJson(context.request);
  const userText = safeText(payload.message, 3000);
  if (!userText) {
    return json({ error: "empty_message", message: "메시지가 비어 있습니다." }, 400);
  }

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
  const model = context.env.ANTHROPIC_MODEL_VOICE || "claude-sonnet-4-6";

  const system = buildInstructions(memory, userText, recentContext, weatherContext);

  const conversation = [
    ...messages
      .map((m) => ({
        role: m.role === "chaea" || m.role === "assistant" ? "assistant" : "user",
        content: safeText(m.text || m.content, 2000),
      }))
      .filter((m) => m.content),
    { role: "user", content: userText },
  ];

  try {
    const { text, model: usedModel, raw } = await callClaude({
      apiKey,
      model,
      system,
      messages: conversation,
      maxTokens: Number(context.env.ANTHROPIC_MAX_TOKENS || 320),
      temperature: Number(context.env.ANTHROPIC_TEMPERATURE || 0.75),
    });

    const reply = sanitizeReply(text, userText);

    await writeOptionalLog(context.env, {
      at: new Date().toISOString(),
      sessionId: safeText(payload.sessionId, 80) || "unknown-session",
      mode: "claude",
      model: usedModel,
      userText,
      reply,
    });

    return json({
      reply,
      model: usedModel,
      provider: "anthropic",
      responseId: raw?.id || null,
    });
  } catch (err) {
    return json(
      {
        error: "anthropic_error",
        message: err.message || "Claude API 호출에 실패했습니다.",
      },
      err.status || 502,
    );
  }
}

async function writeOptionalLog(env, record) {
  if (!env.CHAEA_LOG_KV) return;
  const day = record.at.slice(0, 10);
  const id = `conversation:${day}:${record.sessionId}:${Date.now()}`;
  await env.CHAEA_LOG_KV.put(id, JSON.stringify(record));
}

// functions/_shared/claude.js
// Anthropic Claude API의 가벼운 fetch 래퍼.
// Cloudflare Workers / Pages Functions / Node fetch 모두에서 동작한다.

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

/**
 * Claude messages API 호출.
 *
 * @param {object} params
 * @param {string} params.apiKey                ANTHROPIC_API_KEY
 * @param {string} [params.model]               기본: claude-sonnet-4-6
 * @param {string} params.system                시스템 프롬프트 (페르소나)
 * @param {Array<{role:"user"|"assistant",content:string}>} params.messages
 * @param {number} [params.maxTokens]           기본: 512
 * @param {number} [params.temperature]         기본: 0.7
 * @param {number} [params.timeoutMs]           기본: 20000
 * @returns {Promise<{text:string, model:string, raw:object}>}
 */
export async function callClaude({
  apiKey,
  model = "claude-sonnet-4-6",
  system,
  messages,
  maxTokens = 512,
  temperature = 0.7,
  timeoutMs = 20000,
}) {
  if (!apiKey) throw new Error("missing_anthropic_api_key");
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error("empty_messages");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        system,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(
      data?.error?.message || `anthropic_error_${response.status}`,
    );
    err.status = response.status;
    err.data = data;
    throw err;
  }

  const text = extractClaudeText(data);
  return { text, model: data.model || model, raw: data };
}

/**
 * Claude 응답에서 텍스트만 추출.
 */
export function extractClaudeText(data) {
  if (!data || !Array.isArray(data.content)) return "";
  return data.content
    .filter((block) => block && block.type === "text")
    .map((block) => block.text || "")
    .join("\n")
    .trim();
}

/**
 * JSON 응답을 강제로 추출. Claude가 JSON 코드 블록 혹은 평문 JSON으로
 * 답할 때 안전하게 파싱한다.
 */
export function parseJsonish(text, fallback = null) {
  if (!text) return fallback;
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(candidate.slice(start, end + 1));
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

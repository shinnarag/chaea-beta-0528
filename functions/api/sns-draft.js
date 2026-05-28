// functions/api/sns-draft.js
// 분류된 SNS 댓글/DM에 대해 ChaeA 페르소나 답글 초안을 1~3개 생성한다.
// 자동 게시 X — 항상 운영자 검토 큐로 들어간다.

import { buildInstructions } from "../_shared/chaea.js";
import { callClaude, parseJsonish } from "../_shared/claude.js";
import { json, options, readJson, safeText } from "../_shared/http.js";

const DRAFT_SYSTEM_SUFFIX = `

[추가 지시 — SNS 답글 초안용]
- 위 페르소나/톤 규칙은 그대로 유지한다.
- 인스타그램 댓글 답글 형식이므로 1~2문장, 짧고 자연스럽게.
- 이모지는 0~1개. 과한 하트나 느낌표 남발은 피한다.
- "안녕하세요" 같은 정형 인사로 시작하지 않는다.
- 자해/위기 신호(sensitive)가 있으면 답글 대신 사람을 위한 안내 문구를 생성한다.
- 항상 다음 JSON 형식으로만 답한다. 부연 설명 금지.

{"drafts":["초안1","초안2","초안3"],"note":"운영자에게 짧은 메모(한국어)"}

- 응원(cheer)은 보통 2~3개, 질문(question)은 1~2개, 그 외는 1개 초안이면 충분하다.
- spam/other 카테고리면 drafts를 빈 배열로 두고 note에 이유를 적는다.`;

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return options();
  if (context.request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (!apiKey) return json({ error: "missing_api_key" }, 503);

  const payload = await readJson(context.request);
  const text = safeText(payload.text, 2000);
  const category = safeText(payload.category, 40) || "other";
  const risk = Number(payload.risk) || 0;
  const platform = safeText(payload.platform, 40) || "instagram";

  if (!text) return json({ error: "empty_text" }, 400);

  const model = context.env.ANTHROPIC_MODEL_VOICE || "claude-sonnet-4-6";
  const persona = buildInstructions({}, text, "", "");

  const contextLine = `플랫폼: ${platform}\n분류: ${category}\n위험도: ${risk.toFixed(2)}\n원문:\n"""${text}"""`;

  try {
    const { text: rawReply, model: usedModel } = await callClaude({
      apiKey,
      model,
      system: persona + DRAFT_SYSTEM_SUFFIX,
      messages: [
        {
          role: "user",
          content: `다음 ${platform} 댓글/DM에 대한 답글 초안을 만들어줘.\n\n${contextLine}`,
        },
      ],
      maxTokens: 400,
      temperature: 0.7,
    });

    const parsed = parseJsonish(rawReply, { drafts: [], note: "파싱 실패" });
    const drafts = Array.isArray(parsed.drafts)
      ? parsed.drafts.map((d) => safeText(d, 500)).filter(Boolean)
      : [];

    return json({
      drafts,
      note: safeText(parsed.note, 200),
      category,
      risk,
      model: usedModel,
    });
  } catch (err) {
    return json(
      { error: "anthropic_error", message: err.message },
      err.status || 502,
    );
  }
}

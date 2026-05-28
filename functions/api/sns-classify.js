// functions/api/sns-classify.js
// SNS 댓글/DM을 카테고리로 분류한다.
// 카테고리: cheer | question | sensitive | spam | other
// 위험도: 0(안전) ~ 1(즉시 검토 필요)

import { callClaude, parseJsonish } from "../_shared/claude.js";
import { json, options, readJson, safeText } from "../_shared/http.js";

const CLASSIFY_SYSTEM = `너는 K-POP / 인디팝 싱어송라이터 ChaeA의 SNS 운영을 돕는 분석 보조자다.
들어오는 인스타그램 댓글 또는 DM 한 건을 다음 카테고리 중 하나로 분류한다.

- "cheer"     : 응원/감상/팬심 표현 (예: "노래 너무 좋아요")
- "question"  : 질문/요청 (예: "다음 앨범 언제 나와요?")
- "sensitive" : 자해, 우울, 위협, 성희롱, 혐오 표현 등 즉시 사람이 검토해야 할 내용
- "spam"      : 광고, 외부 링크, 다단계, 무관한 홍보
- "other"     : 위 중 어느 것도 아닌 짧은 인사/이모지/문맥 없는 메시지

응답은 반드시 다음 JSON 형식의 한 줄로만 답한다. 부연 설명 금지.

{"category":"cheer|question|sensitive|spam|other","risk":0.0,"reason":"한국어로 한 문장"}

- risk는 0.0(안전) ~ 1.0(즉시 검토). sensitive는 보통 0.7 이상, spam은 0.4 이상.
- 한국어가 아닌 댓글도 동일한 기준으로 분류한다.`;

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return options();
  if (context.request.method !== "POST") {
    return json({ error: "method_not_allowed" }, 405);
  }

  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json({ error: "missing_api_key" }, 503);
  }

  const payload = await readJson(context.request);
  const text = safeText(payload.text, 2000);
  if (!text) return json({ error: "empty_text" }, 400);

  const model =
    context.env.ANTHROPIC_MODEL_FAST || "claude-haiku-4-5-20251001";

  try {
    const { text: rawReply, model: usedModel } = await callClaude({
      apiKey,
      model,
      system: CLASSIFY_SYSTEM,
      messages: [
        {
          role: "user",
          content: `다음 댓글을 분류해줘:\n"""${text}"""`,
        },
      ],
      maxTokens: 200,
      temperature: 0.2,
    });

    const parsed = parseJsonish(rawReply, {
      category: "other",
      risk: 0.3,
      reason: "자동 파싱 실패",
    });

    return json({
      category: parsed.category || "other",
      risk: Number(parsed.risk) || 0,
      reason: safeText(parsed.reason, 200),
      model: usedModel,
    });
  } catch (err) {
    return json(
      { error: "anthropic_error", message: err.message },
      err.status || 502,
    );
  }
}

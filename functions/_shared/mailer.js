// functions/_shared/mailer.js
// Resend API 기반 메일 발송 헬퍼.
// 운영자 알림(민감 댓글, 위기 신호 등)에 사용.

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function sendOperatorMail({ apiKey, to, subject, html, text, from }) {
  if (!apiKey) throw new Error("missing RESEND_API_KEY");
  if (!to) throw new Error("missing recipient");

  const body = {
    from: from || "ChaeA Ops <onboarding@resend.dev>",
    to: Array.isArray(to) ? to : [to],
    subject: subject || "[ChaeA] 운영자 알림",
    html: html || undefined,
    text: text || undefined,
  };

  const res = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    const err = new Error(`resend ${res.status}: ${detail.slice(0, 200)}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

export function buildSensitiveAlertMail(item) {
  const text = item.text || "";
  const author = item.author || "(익명)";
  const platform = item.platform || "instagram";
  const sourceUrl = item.sourceUrl || "";
  const category = item.category || "sensitive";
  const risk = Number(item.risk) || 0;
  const reason = item.reason || "";

  const subject = `[ChaeA] 민감 댓글 감지 — ${category} / risk ${risk.toFixed(2)}`;

  const lines = [
    "민감 댓글이 감지되어 운영자 확인이 필요합니다.",
    "",
    `플랫폼  : ${platform}`,
    `작성자  : ${author}`,
    `카테고리: ${category}`,
    `위험도  : ${risk.toFixed(2)}`,
    reason ? `분류근거: ${reason}` : "",
    sourceUrl ? `원문URL : ${sourceUrl}` : "",
    "",
    "댓글 원문:",
    text,
    "",
    "운영 대시보드에서 검토해 주세요.",
  ].filter(Boolean);

  return {
    subject,
    text: lines.join("\n"),
    html: `<pre style="font-family:ui-monospace,Menlo,monospace;white-space:pre-wrap">${escapeHtml(lines.join("\n"))}</pre>`,
  };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}

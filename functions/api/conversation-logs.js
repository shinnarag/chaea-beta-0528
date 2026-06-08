import { sanitizeKvConversationRecord } from "../_shared/conversation-log.js";
import { json, options, safeText } from "../_shared/http.js";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return options();
  if (context.request.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  if (!context.env.CHAEA_LOG_KV) {
    return json({ error: "logging_not_configured", message: "CHAEA_LOG_KV binding is not configured." }, 503);
  }

  if (!isAuthorized(context.request, context.env)) {
    return json({ error: "unauthorized" }, 401);
  }

  const url = new URL(context.request.url);
  const date = safeText(url.searchParams.get("date"), 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ error: "invalid_date", message: "Use date=YYYY-MM-DD." }, 400);
  }

  const limit = clamp(Number(url.searchParams.get("limit") || 200), 1, 1000);
  const cursor = safeText(url.searchParams.get("cursor"), 300) || undefined;
  const listed = await context.env.CHAEA_LOG_KV.list({
    prefix: `conversation:${date}:`,
    limit,
    cursor,
  });

  const items = [];
  for (const key of listed.keys || []) {
    const value = await context.env.CHAEA_LOG_KV.get(key.name, "json");
    if (!value) continue;
    items.push(sanitizeKvConversationRecord(key.name, value));
  }

  items.sort((a, b) => String(a.record.at).localeCompare(String(b.record.at)));

  return json({
    ok: true,
    date,
    count: items.length,
    cursor: listed.list_complete ? null : listed.cursor,
    listComplete: Boolean(listed.list_complete),
    items,
  });
}

function isAuthorized(request, env = {}) {
  const configured = safeText(env.CHAEA_LOG_EXPORT_TOKEN, 200);
  if (!configured) return false;

  const url = new URL(request.url);
  const queryToken = safeText(url.searchParams.get("token"), 200);
  if (queryToken && queryToken === configured) return true;

  const authorization = request.headers.get("Authorization") || "";
  return authorization === `Bearer ${configured}`;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.trunc(value)));
}

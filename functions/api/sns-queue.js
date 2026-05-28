// functions/api/sns-queue.js
// SNS 답글 검토 큐의 CRUD 엔드포인트.
//
//   GET  /api/sns-queue            → 대기 중 항목 목록
//   POST /api/sns-queue            → 신규 항목 추가 (분류 + 초안 결과 함께)
//   POST /api/sns-queue?action=resolve&id=...
//                                 → status 변경 (approved | edited | rejected)
//
// Cloudflare 환경에서는 KV(CHAEA_QUEUE_KV)에 저장하고,
// 로컬/Node 환경에서는 server.mjs가 data/sns-queue/*.json로 fallback 한다.

import { json, options, readJson, safeText } from "../_shared/http.js";

const KV_PREFIX = "sns-queue:";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return options();

  const url = new URL(context.request.url);
  const action = url.searchParams.get("action");
  const kv = context.env.CHAEA_QUEUE_KV;
  if (!kv) {
    return json(
      {
        error: "missing_kv",
        message:
          "CHAEA_QUEUE_KV가 바인딩되지 않았습니다. 로컬에서는 server.mjs의 파일 기반 fallback을 사용하세요.",
      },
      503,
    );
  }

  if (context.request.method === "GET") {
    return listQueue(kv);
  }

  if (context.request.method === "POST" && action === "resolve") {
    const id = safeText(url.searchParams.get("id"), 200);
    if (!id) return json({ error: "missing_id" }, 400);
    const body = await readJson(context.request);
    return resolveItem(kv, id, body);
  }

  if (context.request.method === "POST") {
    const body = await readJson(context.request);
    return createItem(kv, body);
  }

  return json({ error: "method_not_allowed" }, 405);
}

async function listQueue(kv) {
  const { keys } = await kv.list({ prefix: KV_PREFIX });
  const items = await Promise.all(
    keys.map(async ({ name }) => {
      const raw = await kv.get(name);
      return raw ? JSON.parse(raw) : null;
    }),
  );
  return json({
    items: items
      .filter(Boolean)
      .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")),
  });
}

async function createItem(kv, body) {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record = {
    id,
    platform: safeText(body.platform, 40) || "instagram",
    sourceUrl: safeText(body.sourceUrl, 400),
    author: safeText(body.author, 80),
    text: safeText(body.text, 2000),
    category: safeText(body.category, 40) || "other",
    risk: Number(body.risk) || 0,
    drafts: Array.isArray(body.drafts)
      ? body.drafts.map((d) => safeText(d, 500)).filter(Boolean)
      : [],
    note: safeText(body.note, 300),
    status: "pending",
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    chosenReply: null,
  };
  await kv.put(KV_PREFIX + id, JSON.stringify(record));
  return json({ ok: true, item: record });
}

async function resolveItem(kv, id, body) {
  const raw = await kv.get(KV_PREFIX + id);
  if (!raw) return json({ error: "not_found" }, 404);
  const record = JSON.parse(raw);

  const status = safeText(body.status, 20);
  if (!["approved", "edited", "rejected"].includes(status)) {
    return json({ error: "invalid_status" }, 400);
  }

  record.status = status;
  record.resolvedAt = new Date().toISOString();
  record.chosenReply = safeText(body.chosenReply, 600) || null;
  await kv.put(KV_PREFIX + id, JSON.stringify(record));
  return json({ ok: true, item: record });
}

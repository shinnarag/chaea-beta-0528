import { json, options } from "../_shared/http.js";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return options();
  if (context.request.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  return json({
    updatedAt: null,
    totalTurns: null,
    averageScore: null,
    byMode: {},
    issues: {},
    recentSuggestions: [],
    note: context.env.CHAEA_LOG_KV
      ? "Cloudflare KV logging is enabled. Aggregate insights can be added with a scheduled Worker."
      : "Cloudflare Pages Functions cannot write local files. Bind CHAEA_LOG_KV to persist conversations.",
  });
}

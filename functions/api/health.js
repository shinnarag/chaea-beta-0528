import { json, options } from "../_shared/http.js";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return options();
  if (context.request.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  return json({
    ok: true,
    runtime: "cloudflare-pages-functions",
    provider: "xai+anthropic",
    model: context.env.XAI_MODEL || context.env.ANTHROPIC_MODEL_VOICE || "grok-4.3",
    apiConfigured: Boolean(context.env.XAI_API_KEY),
    claudeConfigured: Boolean(context.env.ANTHROPIC_API_KEY),
    logging: context.env.CHAEA_LOG_KV ? "kv" : "disabled_without_kv_binding",
  });
}

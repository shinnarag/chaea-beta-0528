import { json, options } from "../_shared/http.js";

export async function onRequest(context) {
  if (context.request.method === "OPTIONS") return options();
  if (context.request.method !== "GET") return json({ error: "method_not_allowed" }, 405);

  const grokEnabled = isXaiEnabled(context.env);

  return json({
    ok: true,
    runtime: "cloudflare-pages-functions",
    provider: "xai+anthropic",
    model: context.env.XAI_MODEL || context.env.ANTHROPIC_MODEL_VOICE || "grok-4.3",
    grokEnabled,
    apiConfigured: grokEnabled && Boolean(context.env.XAI_API_KEY),
    claudeConfigured: Boolean(context.env.ANTHROPIC_API_KEY),
    logging: context.env.CHAEA_LOG_KV ? "kv" : "disabled_without_kv_binding",
    logExportConfigured: Boolean(context.env.CHAEA_LOG_EXPORT_TOKEN),
  });
}

function isXaiEnabled(env = {}) {
  const value = String(env.XAI_ENABLED ?? env.GROK_ENABLED ?? "true").trim().toLowerCase();
  return !["0", "false", "off", "no", "disabled"].includes(value);
}

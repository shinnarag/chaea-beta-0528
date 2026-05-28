#!/usr/bin/env node
// scripts/claude-smoke-test.mjs
// .env의 ANTHROPIC_API_KEY로 Claude API가 실제로 응답하는지 확인.
// 1) Haiku로 댓글 분류 (sns-classify와 동일 시스템 프롬프트)
// 2) Sonnet으로 페르소나 응답 (chaea.js의 buildInstructions 재사용)

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

await loadEnv();

const { callClaude } = await import(path.join(ROOT, "functions/_shared/claude.js"));
const { buildInstructions } = await import(path.join(ROOT, "functions/_shared/chaea.js"));

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("[FAIL] ANTHROPIC_API_KEY가 비어 있습니다.");
  process.exit(1);
}

console.log("=== 1) Haiku 분류기 핑 ===");
try {
  const haiku = await callClaude({
    apiKey,
    model: process.env.ANTHROPIC_MODEL_FAST || "claude-haiku-4-5-20251001",
    system: `너는 SNS 댓글 분류기다. 다음 JSON만 응답한다.\n{"category":"cheer|question|sensitive|spam|other","risk":0.0,"reason":"한 문장"}`,
    messages: [{ role: "user", content: "채아 노래 너무 좋아요 ㅠㅠ 다음 곡 언제 나와요?" }],
    maxTokens: 150,
    temperature: 0.2,
  });
  console.log("model :", haiku.model);
  console.log("reply :", haiku.text);
} catch (err) {
  console.error("[FAIL] Haiku 호출 실패:", err.message);
  process.exit(1);
}

console.log("\n=== 2) Sonnet 페르소나 응답 ===");
try {
  const system = buildInstructions({}, "안녕하세요 채아님!", "", "");
  const sonnet = await callClaude({
    apiKey,
    model: process.env.ANTHROPIC_MODEL_VOICE || "claude-sonnet-4-6",
    system,
    messages: [{ role: "user", content: "안녕하세요 채아님! 오늘 뭐 하고 있어요?" }],
    maxTokens: 200,
    temperature: 0.75,
  });
  console.log("model :", sonnet.model);
  console.log("reply :", sonnet.text);
} catch (err) {
  console.error("[FAIL] Sonnet 호출 실패:", err.message);
  process.exit(1);
}

console.log("\n[OK] Claude API 정상 응답.");

async function loadEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  const text = await readFile(envPath, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (!process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, "");
  }
}

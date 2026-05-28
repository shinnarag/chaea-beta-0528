#!/usr/bin/env node
/**
 * scripts/instagram-monitor.mjs
 *
 * Instagram 댓글/DM/멘션을 수집해서 ChaeA SNS 검토 큐로 밀어 넣는 모니터링 잡.
 *
 * 수집 경로 (Chrome MCP 기반, Graph API 미사용):
 *
 *   1) Claude in Chrome MCP가 https://www.instagram.com/<chaea_account>/ 의
 *      알림함/최근 포스트 댓글 DOM을 파싱해서 data/sns-inbox.json 에 append.
 *   2) 이 스크립트가 sns-inbox.json 을 읽어 분류 → 초안 → 큐 등록.
 *   3) 중복 방지 키: (sourceUrl, author, sha1(text)[0..12]) 조합.
 *
 * sns-inbox.json 스키마:
 *   [{ "platform":"instagram", "author":"@user",
 *      "text":"댓글 내용", "sourceUrl":"https://www.instagram.com/p/..." }, ...]
 *
 * 각 항목은 /api/sns-classify → /api/sns-draft → /api/sns-queue 순으로 흐른다.
 *
 * 실행:
 *   node scripts/instagram-monitor.mjs
 *   node scripts/instagram-monitor.mjs --once
 *   node scripts/instagram-monitor.mjs --inbox ./data/sns-inbox.json
 *
 * 정기 실행은 cron 또는 launchd (macOS) 로 --once 모드를 N분 간격 호출 권장.
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { createHash } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sendOperatorMail, buildSensitiveAlertMail } from "../functions/_shared/mailer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const SEEN_FILE = path.join(DATA_DIR, "sns-seen.json");

const args = parseArgs(process.argv.slice(2));

await loadLocalEnv();

const API_BASE = process.env.CHAEA_API_BASE || "http://127.0.0.1:4173";
const INBOX_PATH = args.inbox || path.join(DATA_DIR, "sns-inbox.json");
const POLL_INTERVAL_MS = Number(process.env.SNS_POLL_INTERVAL_MS || 60000);

await ensureDirs();

if (args.once || args.inbox) {
  await runOnce();
} else {
  console.log(`[ChaeA] Instagram monitor running every ${POLL_INTERVAL_MS}ms`);
  while (true) {
    try {
      await runOnce();
    } catch (err) {
      console.error("[ChaeA] poll error:", err.message);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

// ----- core -----

async function runOnce() {
  const seen = await loadJson(SEEN_FILE, {});
  const items = await collectItems();
  console.log(`[ChaeA] collected ${items.length} candidate item(s)`);

  let processed = 0;
  for (const item of items) {
    const key = itemKey(item);
    if (seen[key]) continue;

    try {
      const classified = await classify(item.text);
      const drafts = await draft({
        text: item.text,
        category: classified.category,
        risk: classified.risk,
        platform: item.platform || "instagram",
      });

      await pushToQueue({
        ...item,
        ...classified,
        drafts: drafts.drafts,
        note: drafts.note,
      });

      await maybeAlertOperator({ ...item, ...classified });

      seen[key] = new Date().toISOString();
      processed += 1;
    } catch (err) {
      console.warn(`[ChaeA] failed item ${key}: ${err.message}`);
    }
  }

  await writeJson(SEEN_FILE, seen);
  console.log(`[ChaeA] processed ${processed} new item(s)`);
}

// ----- collectors -----

async function collectItems() {
  return collectFromInbox();
}

async function collectFromInbox() {
  if (!existsSync(INBOX_PATH)) return [];
  const inbox = await loadJson(INBOX_PATH, []);
  if (!Array.isArray(inbox)) return [];
  return inbox
    .map((item) => ({
      platform: item.platform || "instagram",
      author: (item.author || "").trim(),
      text: (item.text || "").trim(),
      sourceUrl: (item.sourceUrl || "").trim(),
    }))
    .filter((item) => item.text);
}

// ----- pipeline calls -----

async function classify(text) {
  const res = await fetch(`${API_BASE}/api/sns-classify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`classify ${res.status}`);
  return res.json();
}

async function draft({ text, category, risk, platform }) {
  const res = await fetch(`${API_BASE}/api/sns-draft`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text, category, risk, platform }),
  });
  if (!res.ok) throw new Error(`draft ${res.status}`);
  return res.json();
}

async function pushToQueue(item) {
  // 서버의 /api/sns-queue (KV 또는 localFileKV) 로 일관되게 등록한다.
  const res = await fetch(`${API_BASE}/api/sns-queue`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      platform: item.platform || "instagram",
      sourceUrl: item.sourceUrl || "",
      author: item.author || "",
      text: item.text || "",
      category: item.category || "other",
      risk: Number(item.risk) || 0,
      drafts: item.drafts || [],
      note: item.note || "",
    }),
  });
  if (!res.ok) throw new Error(`queue ${res.status}`);
  return res.json();
}

// ----- alerts -----

async function maybeAlertOperator(item) {
  const category = item.category || "other";
  const risk = Number(item.risk) || 0;
  const isSensitive = category === "sensitive" || risk >= 0.7;
  if (!isSensitive) return;

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.OPERATOR_EMAIL;
  if (!apiKey || !to) {
    console.warn(
      "[ChaeA] sensitive item detected but RESEND_API_KEY / OPERATOR_EMAIL not set — skipping mail",
    );
    return;
  }

  try {
    const mail = buildSensitiveAlertMail(item);
    await sendOperatorMail({
      apiKey,
      to,
      from: process.env.RESEND_FROM || "ChaeA Ops <onboarding@resend.dev>",
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
    });
    console.log(`[ChaeA] sensitive alert mailed to ${to} (${category}, risk ${risk.toFixed(2)})`);
  } catch (err) {
    console.warn(`[ChaeA] sensitive alert mail failed: ${err.message}`);
  }
}

// ----- utils -----

function itemKey(item) {
  const textHash = createHash("sha1")
    .update(item.text || "")
    .digest("hex")
    .slice(0, 12);
  return `${item.sourceUrl || "_"}|${item.author || "_"}|${textHash}`;
}

async function loadLocalEnv() {
  const envPath = path.join(ROOT, ".env");
  if (!existsSync(envPath)) return;
  const text = await readFile(envPath, "utf8");
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!m) continue;
    if (!process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^"|"$/g, "");
    }
  }
}

async function ensureDirs() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function loadJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(file, data) {
  await writeFile(file, JSON.stringify(data, null, 2), "utf8");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs(arr) {
  const out = {};
  for (let i = 0; i < arr.length; i++) {
    const a = arr[i];
    if (a === "--once") out.once = true;
    else if (a === "--inbox") out.inbox = arr[++i];
  }
  return out;
}

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA_DIR = path.join(ROOT, "data");
const CONVERSATION_DIR = path.join(DATA_DIR, "conversations");
const SESSION_DIR = path.join(DATA_DIR, "sessions");

const args = parseArgs(process.argv.slice(2));
const date = args.date || todayInSeoul();
const baseUrl = String(args.url || process.env.CHAEA_LOG_EXPORT_URL || "https://chaea-beta-260511.shinnarag.workers.dev").replace(/\/$/, "");
const token = args.token || process.env.CHAEA_LOG_EXPORT_TOKEN;

if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
  fail("Use --date YYYY-MM-DD.");
}

if (!token) {
  fail("Set CHAEA_LOG_EXPORT_TOKEN or pass --token.");
}

const imported = await fetchAllConversationLogs({ baseUrl, token, date });
await mergeDailyJsonl(date, imported);
await rewriteSessionTranscripts(date);

console.log(`Synced ${imported.length} remote conversation turns for ${date}.`);

async function fetchAllConversationLogs({ baseUrl, token, date }) {
  const records = [];
  let cursor = "";

  do {
    const url = new URL(`${baseUrl}/api/conversation-logs`);
    url.searchParams.set("date", date);
    url.searchParams.set("limit", "1000");
    if (cursor) url.searchParams.set("cursor", cursor);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      fail(`Export failed: ${response.status} ${data.error || data.message || response.statusText}`);
    }

    for (const item of data.items || []) {
      const record = normalizeRecord(item.record || item, item.key);
      if (record.userText && record.reply) records.push(record);
    }
    cursor = data.cursor || "";
  } while (cursor);

  return records.sort((a, b) => String(a.at).localeCompare(String(b.at)));
}

async function mergeDailyJsonl(date, imported) {
  await mkdir(CONVERSATION_DIR, { recursive: true });
  const file = path.join(CONVERSATION_DIR, `${date}.jsonl`);
  const existing = await readJsonl(file);
  const byId = new Map();

  for (const record of existing) byId.set(record.id || fallbackRecordId(record), normalizeRecord(record));
  for (const record of imported) byId.set(record.id || fallbackRecordId(record), normalizeRecord(record));

  const merged = [...byId.values()].sort((a, b) => String(a.at).localeCompare(String(b.at)));
  await writeFile(file, merged.map((record) => JSON.stringify(record)).join("\n") + (merged.length ? "\n" : ""), "utf8");
}

async function rewriteSessionTranscripts(date) {
  await mkdir(SESSION_DIR, { recursive: true });
  const records = await readJsonl(path.join(CONVERSATION_DIR, `${date}.jsonl`));
  const bySession = new Map();

  for (const record of records) {
    const sessionId = record.sessionId || "unknown-session";
    const list = bySession.get(sessionId) || [];
    list.push(record);
    bySession.set(sessionId, list);
  }

  for (const [sessionId, sessionRecords] of bySession.entries()) {
    const slug = safeFilename(sessionId);
    const sorted = sessionRecords.sort((a, b) => String(a.at).localeCompare(String(b.at)));
    await writeFile(
      path.join(SESSION_DIR, `${slug}.jsonl`),
      sorted.map((record) => JSON.stringify(record)).join("\n") + "\n",
      "utf8",
    );
    await writeFile(path.join(SESSION_DIR, `${slug}.md`), sorted.map(formatTranscriptTurn).join(""), "utf8");
  }
}

async function readJsonl(file) {
  try {
    const text = await readFile(file, "utf8");
    return text
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch (error) {
    if (error.code === "ENOENT") return [];
    throw error;
  }
}

function normalizeRecord(record = {}, key = "") {
  const normalized = {
    id: safeText(record.id || key || fallbackRecordId(record), 180),
    at: safeText(record.at, 40) || new Date().toISOString(),
    sessionId: safeText(record.sessionId, 80) || "unknown-session",
    source: safeText(record.source, 24) || "api",
    mode: safeText(record.mode, 24) || "api",
    model: record.model ? safeText(record.model, 80) : null,
    provider: record.provider ? safeText(record.provider, 40) : null,
    responseId: record.responseId ? safeText(record.responseId, 120) : null,
    userText: safeText(record.userText || record.message, 3000),
    reply: safeText(record.reply, 5000),
    context: record.context && typeof record.context === "object" ? record.context : { hasPriorContext: false, lastUser: "", lastAssistant: "", turnCount: 0 },
    memory: record.memory && typeof record.memory === "object" ? record.memory : { userName: "", likes: [], lastIntent: "", speechMode: "polite", exchangeCount: 0 },
  };

  normalized.analysis = record.analysis && typeof record.analysis === "object" ? record.analysis : analyzeTurnQuality(normalized);
  return normalized;
}

function analyzeTurnQuality(record) {
  const reply = record.reply || "";
  const lines = reply.split("\n").map((line) => line.trim()).filter(Boolean);
  const issues = [];
  const suggestions = [];

  if (reply.length > 520 || lines.length > 4) {
    issues.push("too_long");
    suggestions.push("답변은 1-3문장 중심으로 더 짧게 줄이기");
  }
  if (record.memory?.speechMode !== "casual" && /(좋아|맞아|고마워|미안|몰라|아니야|그래)(\.|\n|$)/u.test(reply)) {
    issues.push("informal_ending");
    suggestions.push("반말 종결을 존댓말로 교정하기");
  }
  if (/(설정|프롬프트|내부|해야 한다|답한다|캐릭터)/u.test(reply)) {
    issues.push("meta_language");
    suggestions.push("설정 설명 대신 채아의 1인칭 대화로 말하기");
  }
  if (/한국어가 아직 어려|한국말이 서툴/u.test(reply)) {
    issues.push("korean_incompetence_frame");
    suggestions.push("한국어를 부족함이 아닌 감정을 고르는 언어로 표현하기");
  }

  const score = Math.max(0, 100 - issues.length * 15);
  return {
    score,
    issues,
    suggestions,
    lineCount: lines.length,
    charCount: reply.length,
  };
}

function formatTranscriptTurn(record) {
  return [
    `\n## ${record.at}`,
    "",
    `- session: ${record.sessionId}`,
    `- source: ${record.source}${record.model ? ` / ${record.model}` : ""}`,
    `- speechMode: ${record.memory?.speechMode || "polite"}`,
    "",
    `USER: ${record.userText}`,
    "",
    `CHAEA: ${record.reply}`,
    "",
  ].join("\n");
}

function safeFilename(value) {
  const slug = String(value || "unknown-session")
    .normalize("NFKD")
    .replace(/[^A-Za-z0-9._-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 90);
  return slug || "unknown-session";
}

function fallbackRecordId(record = {}) {
  return [record.at, record.sessionId, record.userText, record.reply].map((part) => safeText(part, 80)).join("|");
}

function todayInSeoul() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function parseArgs(rawArgs) {
  const parsed = {};
  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i];
    if (arg === "--date") parsed.date = rawArgs[++i];
    else if (arg === "--url") parsed.url = rawArgs[++i];
    else if (arg === "--token") parsed.token = rawArgs[++i];
  }
  return parsed;
}

function safeText(value, maxLength = 1000) {
  return String(value || "").replace(/\s+\n/g, "\n").trim().slice(0, maxLength);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

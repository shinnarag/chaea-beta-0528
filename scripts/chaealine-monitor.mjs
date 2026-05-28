import { mkdir, readFile, readdir, stat, writeFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOCIAL_DIR = path.join(ROOT, "data", "social");
const PERSONA_UPDATE_DIR = path.join(ROOT, "data", "persona-updates");
const SNAPSHOT_FILE = path.join(SOCIAL_DIR, "chaealine-snapshot.json");
const HISTORY_FILE = path.join(SOCIAL_DIR, "chaealine-history.jsonl");
const LATEST_DATA_FILE = path.join(ROOT, "data", "chaea-latest-data.json");
const SOCIAL_DOC_FILE = path.join(ROOT, "docs", "ChaeA_Social_Presence.md");

const SOURCES = {
  youtube: "https://www.youtube.com/@chaealine",
  instagram: "https://www.instagram.com/chaealine/",
};

const STATIC_UPDATE = {
  id: "2026-05-27-social-runtime",
  date: "2026-05-27",
  title: "Official @chaealine channels and local runtime memory",
  facts: [
    "The project remains an internal local operator app, not a deployment-ready public service.",
    "Grok is the primary live chat provider through xAI, with local logs saved under data/conversations and data/sessions.",
    "Current date/time answers are handled from the local Seoul system clock before the model is called.",
    "Official public handles are Instagram @chaealine and YouTube @chaealine.",
  ],
};

await main();

async function main() {
  const fetchedAt = new Date();
  const [youtubeHtml, instagramHtml] = await Promise.all([
    fetchText(SOURCES.youtube),
    fetchText(SOURCES.instagram),
  ]);

  const snapshot = {
    updatedAt: fetchedAt.toISOString(),
    updatedAtKst: formatKst(fetchedAt),
    sources: SOURCES,
    youtube: parseYouTube(youtubeHtml),
    instagram: parseInstagram(instagramHtml),
    analysis: buildAnalysis(),
  };

  const latestData = {
    updatedAt: snapshot.updatedAt,
    updatedAtKst: snapshot.updatedAtKst,
    persona: buildPersonaState(snapshot),
    social: snapshot,
    conversationStorage: await readConversationStorageState(),
    latestPersonaUpdate: STATIC_UPDATE,
  };

  await mkdir(SOCIAL_DIR, { recursive: true });
  await mkdir(PERSONA_UPDATE_DIR, { recursive: true });
  await writeFile(SNAPSHOT_FILE, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
  await appendFile(HISTORY_FILE, `${JSON.stringify(snapshot)}\n`, "utf8");
  await writeFile(LATEST_DATA_FILE, `${JSON.stringify(latestData, null, 2)}\n`, "utf8");
  await writeFile(
    path.join(PERSONA_UPDATE_DIR, `${STATIC_UPDATE.id}.json`),
    `${JSON.stringify({ ...STATIC_UPDATE, snapshotAt: snapshot.updatedAt, social: snapshot }, null, 2)}\n`,
    "utf8",
  );

  await writeFile(SOCIAL_DOC_FILE, renderSocialDoc(snapshot), "utf8");

  console.log(`[ChaeA] Social snapshot saved: ${path.relative(ROOT, SNAPSHOT_FILE)}`);
  console.log(`[ChaeA] Latest data saved: ${path.relative(ROOT, LATEST_DATA_FILE)}`);
  console.log(`[ChaeA] Social doc updated: ${path.relative(ROOT, SOCIAL_DOC_FILE)}`);
}

async function fetchText(url) {
  const isInstagram = url.includes("instagram.com");
  const response = await fetch(url, {
    headers: {
      "Accept-Language": isInstagram ? "en-US,en;q=0.9" : "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "User-Agent": isInstagram
        ? "curl/8.7.1"
        : "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

function parseYouTube(html) {
  const canonicalUrl = readLink(html, "canonical");
  const ogUrl = readMeta(html, "property", "og:url");
  const title = clean(readMeta(html, "property", "og:title") || readTitle(html));
  const description = clean(readMeta(html, "property", "og:description") || readMeta(html, "name", "description"));
  const channelId =
    firstMatch(canonicalUrl || ogUrl, /\/channel\/([^/?#]+)/) ||
    firstMatch(html, /"browseId":"([^"]+)"/) ||
    firstMatch(html, /channel_id=([^"&]+)/);

  return {
    platform: "youtube",
    handle: "@chaealine",
    url: SOURCES.youtube,
    canonicalUrl: canonicalUrl || ogUrl || SOURCES.youtube,
    channelId: channelId || null,
    title: title || "ChaeA 채아",
    description: description || "",
    shorts: parseYouTubeShorts(html),
  };
}

function parseYouTubeShorts(html) {
  const blocks = splitByMarker(html, '"shortsLockupViewModel":{');
  const seen = new Set();
  const shorts = [];

  for (const block of blocks) {
    const videoId =
      firstMatch(block, /"entityId":"shorts-shelf-item-([^"]+)"/) ||
      firstMatch(block, /"videoId":"([^"]+)"/) ||
      firstMatch(block, /"url":"\/shorts\/([^"]+)"/);
    if (!videoId || seen.has(videoId)) continue;
    seen.add(videoId);

    const accessibility = readJsonString(block, "accessibilityText");
    const overlayTitle = readJsonString(block, "content");
    const parsed = parseShortAccessibility(accessibility);
    const title = parsed.title || overlayTitle || "";

    shorts.push({
      videoId,
      url: `https://www.youtube.com/shorts/${videoId}`,
      title: clean(title),
      views: parsed.views || "",
      accessibilityText: clean(accessibility),
    });
  }

  return shorts;
}

function parseShortAccessibility(value = "") {
  const text = clean(value);
  const match = text.match(/^(.*),\s*(조회수\s+.+?회)(?:\s+-\s+Shorts.*)?$/u);
  if (!match) return { title: text, views: "" };
  return { title: match[1], views: match[2] };
}

function parseInstagram(html) {
  const ogTitle = clean(readMeta(html, "property", "og:title"));
  const ogDescription = clean(readMeta(html, "property", "og:description"));
  const metaDescription = clean(readMeta(html, "name", "description"));
  const canonicalUrl = readLink(html, "canonical") || readMeta(html, "property", "og:url") || SOURCES.instagram;
  const profileId = firstMatch(html, /"profile_id":"([^"]+)"/) || firstMatch(html, /"id":"(\d+)","show_suggested_profiles"/);
  const stats = parseInstagramStats(ogDescription || metaDescription);
  const bio = parseInstagramBio(metaDescription);

  return {
    platform: "instagram",
    handle: "@chaealine",
    url: SOURCES.instagram,
    canonicalUrl,
    profileId: profileId || null,
    title: ogTitle || "ChaeA (@chaealine) - Instagram",
    description: ogDescription || metaDescription || "",
    followers: stats.followers,
    following: stats.following,
    posts: stats.posts,
    bio,
    publicPostDetailsAvailable: false,
    note: "Instagram public HTML currently exposes profile-level metadata, not reliable logged-out post detail or comment data.",
  };
}

function parseInstagramStats(text = "") {
  const match = text.match(/([\d.,A-Za-z가-힣]+)\s+Followers,\s*([\d.,A-Za-z가-힣]+)\s+Following,\s*([\d.,A-Za-z가-힣]+)\s+Posts/i);
  return {
    followers: makeCount(match?.[1]),
    following: makeCount(match?.[2]),
    posts: makeCount(match?.[3]),
  };
}

function parseInstagramBio(text = "") {
  const match = text.match(/on Instagram:\s*"([^"]+)"/i);
  return clean(match?.[1] || "");
}

function makeCount(display = "") {
  const cleaned = clean(display);
  return {
    display: cleaned,
    value: parseSocialNumber(cleaned),
  };
}

function parseSocialNumber(value = "") {
  const text = String(value).replace(/,/g, "").trim();
  if (!text) return null;
  const numeric = Number.parseFloat(text);
  if (!Number.isFinite(numeric)) return null;
  if (/천/u.test(text) || /K$/i.test(text)) return Math.round(numeric * 1000);
  if (/만/u.test(text)) return Math.round(numeric * 10000);
  if (/M$/i.test(text)) return Math.round(numeric * 1000000);
  return Math.round(numeric);
}

function buildAnalysis() {
  return {
    summary: "Official social presence is now unified under @chaealine.",
    positioning: [
      "YouTube should carry short performance/story fragments and future room-session archives.",
      "Instagram should carry visual diary, short reels, bio signals, and comment intake for the review queue.",
      "Both channels should keep the early-discovery feeling: small room, direct Korean text, quiet singer-songwriter identity.",
    ],
    monitoringPolicy: [
      "Store public profile metadata and Shorts inventory as snapshots.",
      "Append every run to history so growth and content changes can be audited later.",
      "Do not auto-publish replies; route comments and DMs through the existing SNS review queue.",
    ],
  };
}

function buildPersonaState(snapshot) {
  return {
    name: "ChaeA / 채아",
    legalPersonaName: "윤채아 / YOON CHAEA",
    role: "Artist / Singer-Songwriter",
    genre: "K-POP / POP / INDIE POP",
    coreLine: "서울의 작은 원룸에서 언어 사이의 감정을 한국어 노래로 기록하는 싱어송라이터",
    officialAccounts: {
      instagram: snapshot.instagram.url,
      youtube: snapshot.youtube.url,
      handle: "@chaealine",
    },
    runtimeNotes: [
      "Keep default Korean polite speech unless the user explicitly asks for casual speech.",
      "Use Seoul local clock for current date/time answers.",
      "Answer social-account questions with @chaealine and avoid inventing unobserved post/comment data.",
      "Conversation logs are review material, not automatic canon; promote only verified facts into persona docs.",
    ],
  };
}

async function readConversationStorageState() {
  const conversationsDir = path.join(ROOT, "data", "conversations");
  const sessionsDir = path.join(ROOT, "data", "sessions");
  const insightsFile = path.join(ROOT, "data", "conversation-insights.json");

  const [conversationFiles, sessionFiles, insights] = await Promise.all([
    listFiles(conversationsDir),
    listFiles(sessionsDir),
    readJsonIfExists(insightsFile),
  ]);

  return {
    dailyJsonlDir: "data/conversations",
    sessionDir: "data/sessions",
    insightsFile: "data/conversation-insights.json",
    dailyJsonlFiles: conversationFiles.filter((file) => file.endsWith(".jsonl")).length,
    sessionTranscriptFiles: sessionFiles.filter((file) => file.endsWith(".jsonl") || file.endsWith(".md")).length,
    insights: insights || null,
  };
}

async function listFiles(dir) {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir);
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const info = await stat(fullPath);
    if (info.isFile()) files.push(entry);
  }
  return files.sort();
}

async function readJsonIfExists(file) {
  if (!existsSync(file)) return null;
  try {
    return JSON.parse(await readFile(file, "utf8"));
  } catch {
    return null;
  }
}

function renderSocialDoc(snapshot) {
  const shorts = snapshot.youtube.shorts.length
    ? snapshot.youtube.shorts
        .map((item) => `- [${item.title || item.videoId}](${item.url})${item.views ? ` - ${item.views}` : ""}`)
        .join("\n")
    : "- 공개 Shorts 목록을 찾지 못함";

  return `# ChaeA Social Presence Snapshot

업데이트: ${snapshot.updatedAtKst}

## Official Accounts

| Platform | Handle | URL | Public status |
| --- | --- | --- | --- |
| Instagram | @chaealine | ${snapshot.instagram.url} | ${snapshot.instagram.followers.display || "?"} followers / ${snapshot.instagram.following.display || "?"} following / ${snapshot.instagram.posts.display || "?"} posts |
| YouTube | @chaealine | ${snapshot.youtube.url} | ${snapshot.youtube.title || "ChaeA 채아"} / channel ${snapshot.youtube.channelId || "unknown"} |

## Instagram

- Title: ${snapshot.instagram.title}
- Bio: ${snapshot.instagram.bio || "확인 가능한 bio 없음"}
- Description: ${snapshot.instagram.description || "확인 가능한 설명 없음"}
- Note: 로그인 없는 공개 HTML에서는 개별 포스트/댓글 상세가 안정적으로 노출되지 않음. 댓글/DM은 기존 SNS Review Queue로 수동 또는 파일 기반 수집한다.

## YouTube

- Title: ${snapshot.youtube.title}
- Description: ${snapshot.youtube.description || "확인 가능한 설명 없음"}
- Canonical: ${snapshot.youtube.canonicalUrl}
- Channel ID: ${snapshot.youtube.channelId || "unknown"}

### Shorts

${shorts}

## Analysis

- 공식 핸들은 Instagram과 YouTube 모두 @chaealine으로 통일한다.
- YouTube는 짧은 감정/노래 조각과 향후 Room Session 아카이브 축으로 쓰기 좋다.
- Instagram은 바이오, 사진, Reels, 댓글 검토 큐의 진입점으로 둔다.
- 공개 수치와 콘텐츠 목록은 매 실행마다 data/social/chaealine-history.jsonl에 누적해 변화 추적용으로 보관한다.
`;
}

function readMeta(html, attr, value) {
  const tag = findTag(html, "meta", attr, value);
  return decodeHtml(readAttr(tag, "content"));
}

function readLink(html, rel) {
  const tag = findTag(html, "link", "rel", rel);
  return decodeHtml(readAttr(tag, "href"));
}

function readTitle(html) {
  return decodeHtml(firstMatch(html, /<title>([\s\S]*?)<\/title>/i));
}

function findTag(html, tagName, attr, value) {
  const tagPattern = new RegExp(`<${escapeRegExp(tagName)}\\b[^>]*>`, "gi");
  let match;
  while ((match = tagPattern.exec(html))) {
    const tag = match[0];
    if (readAttr(tag, attr) === value) return tag;
  }
  return "";
}

function readAttr(tag = "", attr = "") {
  const match = tag.match(new RegExp(`\\b${escapeRegExp(attr)}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, "i"));
  return match?.[2] || "";
}

function readJsonString(block, key) {
  const match = block.match(new RegExp(`"${escapeRegExp(key)}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`, "s"));
  if (!match) return "";
  try {
    return JSON.parse(`"${match[1]}"`);
  } catch {
    return match[1].replace(/\\"/g, '"').replace(/\\u0026/g, "&");
  }
}

function splitByMarker(text, marker) {
  const parts = [];
  let index = text.indexOf(marker);
  while (index !== -1) {
    const next = text.indexOf(marker, index + marker.length);
    parts.push(text.slice(index, next === -1 ? undefined : next));
    index = next;
  }
  return parts;
}

function firstMatch(text = "", regex) {
  return text.match(regex)?.[1] || "";
}

function clean(value = "") {
  return decodeHtml(String(value))
    .replace(/\s+/g, " ")
    .replace(/\s+([,.!?])/g, "$1")
    .trim();
}

function decodeHtml(value = "") {
  return String(value)
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(Number.parseInt(num, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#034;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function escapeRegExp(value = "") {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatKst(date) {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}

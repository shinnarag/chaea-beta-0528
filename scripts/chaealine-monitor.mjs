import { mkdir, readFile, readdir, stat, writeFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOCIAL_DIR = path.join(ROOT, "data", "social");
const CAPTURE_DIR = path.join(SOCIAL_DIR, "captures");
const PERSONA_UPDATE_DIR = path.join(ROOT, "data", "persona-updates");
const SNAPSHOT_FILE = path.join(SOCIAL_DIR, "chaealine-snapshot.json");
const HISTORY_FILE = path.join(SOCIAL_DIR, "chaealine-history.jsonl");
const LATEST_DATA_FILE = path.join(ROOT, "data", "chaea-latest-data.json");
const SOCIAL_DOC_FILE = path.join(ROOT, "docs", "ChaeA_Social_Presence.md");
const execFileAsync = promisify(execFile);

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
  await mkdir(SOCIAL_DIR, { recursive: true });
  await mkdir(CAPTURE_DIR, { recursive: true });
  await mkdir(PERSONA_UPDATE_DIR, { recursive: true });

  const previousSnapshot = await readJsonIfExists(SNAPSHOT_FILE);
  const [youtubeResult, instagramResult] = await Promise.all([
    collectPlatform("youtube", fetchedAt, previousSnapshot?.youtube),
    collectPlatform("instagram", fetchedAt, previousSnapshot?.instagram),
  ]);

  const snapshot = {
    updatedAt: fetchedAt.toISOString(),
    updatedAtKst: formatKst(fetchedAt),
    sources: SOURCES,
    youtube: youtubeResult.data,
    instagram: instagramResult.data,
    captureEvidence: {
      youtube: youtubeResult.captureEvidence,
      instagram: instagramResult.captureEvidence,
    },
    visiblePosts: {
      youtube: youtubeResult.visiblePosts,
      instagram: instagramResult.visiblePosts,
    },
    visibleCommentsSummary: {
      youtube: youtubeResult.visibleCommentsSummary,
      instagram: instagramResult.visibleCommentsSummary,
    },
    reviewIssues: [...youtubeResult.reviewIssues, ...instagramResult.reviewIssues],
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
  if (snapshot.reviewIssues.length) {
    console.log(`[ChaeA] Review issues: ${snapshot.reviewIssues.length}`);
  }
}

async function collectPlatform(platform, fetchedAt, previousData) {
  const url = SOURCES[platform];
  try {
    const html = await fetchText(url);
    return buildPlatformResult(platform, html, {
      fetchedAt,
      method: "node-fetch",
      url,
      previousData,
      sourceFailure: null,
      captureFile: null,
    });
  } catch (error) {
    const sourceFailure = describeError(error);
    try {
      const capture = await capturePublicPage(platform, url, fetchedAt);
      const result = buildPlatformResult(platform, capture.html, {
        fetchedAt,
        method: "public-url-capture",
        url,
        previousData,
        sourceFailure,
        captureFile: capture.file,
      });
      result.reviewIssues.unshift({
        platform,
        severity: "info",
        type: "fetch-fallback-used",
        message: `Node fetch failed (${sourceFailure}); used public URL capture fallback.`,
        observedAt: fetchedAt.toISOString(),
      });
      return result;
    } catch (captureError) {
      const message = `Node fetch failed (${sourceFailure}); public URL capture also failed (${describeError(captureError)}).`;
      return buildFailedPlatformResult(platform, {
        fetchedAt,
        url,
        previousData,
        message,
      });
    }
  }
}

function buildPlatformResult(platform, html, options) {
  const data = platform === "youtube" ? parseYouTube(html) : parseInstagram(html);
  const visibleText = extractVisibleText(html);
  const visiblePosts = platform === "youtube" ? buildYouTubeVisiblePosts(data) : extractInstagramVisiblePosts(visibleText);
  const visibleCommentsSummary = summarizeVisibleComments(platform, visibleText);
  const reviewIssues = [];

  if (options.sourceFailure) {
    reviewIssues.push({
      platform,
      severity: "info",
      type: "primary-fetch-failed",
      message: `Primary Node fetch failed: ${options.sourceFailure}`,
      observedAt: options.fetchedAt.toISOString(),
    });
  }

  if (platform === "instagram" && !visiblePosts.length) {
    reviewIssues.push({
      platform,
      severity: "operator-review",
      type: "post-detail-not-visible",
      message:
        "Logged-out public capture did not expose reliable individual Instagram post captions or comment details. Do not promote post/comment content without manual visible-page verification.",
      observedAt: options.fetchedAt.toISOString(),
    });
  }

  if (platform === "youtube" && !data.shorts.length) {
    reviewIssues.push({
      platform,
      severity: "operator-review",
      type: "shorts-not-parsed",
      message: "Public YouTube capture did not expose a reliable Shorts inventory.",
      observedAt: options.fetchedAt.toISOString(),
    });
  }

  return {
    data: {
      ...data,
      captureMethod: options.method,
      staleFromPreviousSnapshot: false,
    },
    captureEvidence: {
      method: options.method,
      url: options.url,
      capturedAt: options.fetchedAt.toISOString(),
      capturedAtKst: formatKst(options.fetchedAt),
      htmlBytes: Buffer.byteLength(html, "utf8"),
      textSample: visibleText.slice(0, 500),
      file: options.captureFile ? path.relative(ROOT, options.captureFile) : null,
    },
    visiblePosts,
    visibleCommentsSummary,
    reviewIssues,
  };
}

function buildFailedPlatformResult(platform, options) {
  const fallback = previousDataForPlatform(platform, options.previousData);
  return {
    data: {
      ...fallback,
      captureMethod: "unavailable",
      staleFromPreviousSnapshot: Boolean(options.previousData),
    },
    captureEvidence: {
      method: "unavailable",
      url: options.url,
      capturedAt: options.fetchedAt.toISOString(),
      capturedAtKst: formatKst(options.fetchedAt),
      htmlBytes: 0,
      textSample: "",
      file: null,
    },
    visiblePosts: [],
    visibleCommentsSummary: {
      status: "unavailable",
      summary: "Public comments were not inspected because the public page could not be captured.",
      visibleCommentCount: null,
      reactionTones: [],
    },
    reviewIssues: [
      {
        platform,
        severity: "operator-review",
        type: "capture-failed",
        message: options.message,
        observedAt: options.fetchedAt.toISOString(),
      },
    ],
  };
}

function previousDataForPlatform(platform, previousData) {
  if (previousData) return previousData;
  if (platform === "youtube") {
    return {
      platform: "youtube",
      handle: "@chaealine",
      url: SOURCES.youtube,
      canonicalUrl: SOURCES.youtube,
      channelId: null,
      title: "ChaeA 채아",
      description: "",
      shorts: [],
    };
  }
  return {
    platform: "instagram",
    handle: "@chaealine",
    url: SOURCES.instagram,
    canonicalUrl: SOURCES.instagram,
    profileId: null,
    title: "ChaeA (@chaealine) - Instagram",
    description: "",
    followers: makeCount(""),
    following: makeCount(""),
    posts: makeCount(""),
    bio: "",
    publicPostDetailsAvailable: false,
    note: "Instagram public data could not be captured in this run.",
  };
}

async function capturePublicPage(platform, url, fetchedAt) {
  const userAgent = platform === "instagram" ? "curl/8.7.1" : fetchUserAgent(platform);
  const acceptLanguage = platform === "instagram" ? "en-US,en;q=0.9" : "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7";
  const { stdout } = await execFileAsync(
    "curl",
    ["-L", "--max-time", "20", "-A", userAgent, "-H", `Accept-Language: ${acceptLanguage}`, url],
    { maxBuffer: 12 * 1024 * 1024 },
  );
  if (!stdout || stdout.trim().length < 100) {
    throw new Error("capture returned too little content");
  }
  const file = path.join(CAPTURE_DIR, `chaealine-${platform}-${stampForFile(fetchedAt)}.html`);
  await writeFile(file, stdout, "utf8");
  return { html: stdout, file };
}

async function fetchText(url) {
  const isInstagram = url.includes("instagram.com");
  const response = await fetch(url, {
    headers: {
      "Accept-Language": isInstagram ? "en-US,en;q=0.9" : "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
      "User-Agent": fetchUserAgent(isInstagram ? "instagram" : "youtube"),
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

function fetchUserAgent(platform) {
  return platform === "instagram"
    ? "curl/8.7.1"
    : "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36";
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

function buildYouTubeVisiblePosts(youtube) {
  return youtube.shorts.map((short) => ({
    platform: "youtube",
    type: "short",
    id: short.videoId,
    url: short.url,
    text: short.title,
    metrics: {
      views: short.views || "",
    },
    commentVisibility: "not visible on channel capture",
  }));
}

function extractInstagramVisiblePosts(visibleText) {
  const lines = visibleText
    .split("\n")
    .map((line) => clean(line))
    .filter(Boolean);
  const candidates = [];
  const seen = new Set();

  for (const line of lines) {
    if (!looksLikeInstagramPostText(line)) continue;
    if (line.length < 8 || line.length > 280 || seen.has(line)) continue;
    seen.add(line);
    candidates.push({
      platform: "instagram",
      type: "visible-text",
      id: null,
      url: SOURCES.instagram,
      text: line,
      metrics: {},
      commentVisibility: "not reliably visible on logged-out profile capture",
    });
    if (candidates.length >= 8) break;
  }

  return candidates;
}

function looksLikeInstagramPostText(line) {
  if (/photos and videos|Followers|Following|Posts|Instagram|Log in|Sign up/i.test(line)) return false;
  if (/^ChaeA\s*\(@chaealine\)/i.test(line)) return false;
  return /#chaealine|#채아|#cover|#LINE|#원룸|#통기타|채아.+#|ChaeA.+#/iu.test(line);
}

function summarizeVisibleComments(platform, visibleText) {
  const text = clean(visibleText);
  const visibleCommentCount = firstVisibleCommentCount(text);
  const reactionTones = detectReactionTones(text);

  if (!visibleCommentCount && !reactionTones.length) {
    return {
      status: "not-visible",
      summary:
        platform === "instagram"
          ? "Logged-out Instagram profile capture did not expose reliable public comment text."
          : "YouTube channel capture did not expose public Shorts comments; inspect individual Shorts URLs for comment reactions.",
      visibleCommentCount: null,
      reactionTones: [],
    };
  }

  return {
    status: "limited-visible-text",
    summary: `Public capture exposed limited comment/reaction signals: ${[
      visibleCommentCount ? `${visibleCommentCount} visible comment-count signal` : "",
      reactionTones.length ? `tones: ${reactionTones.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join("; ")}.`,
    visibleCommentCount,
    reactionTones,
  };
}

function firstVisibleCommentCount(text) {
  const patterns = [
    /댓글\s*([\d,]+)\s*개/u,
    /([\d,]+)\s*comments?/iu,
    /View all\s+([\d,]+)\s+comments?/iu,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return Number.parseInt(match[1].replace(/,/g, ""), 10);
  }
  return null;
}

function detectReactionTones(text) {
  const tones = [];
  const checks = [
    ["supportive", /(좋아요|응원|멋지|예쁘|감동|love|beautiful|great|nice|amazing)/iu],
    ["curious", /(질문|궁금|언제|where|when|what|question)/iu],
    ["cover-request", /(커버|cover|불러|sing|song request)/iu],
    ["spam-risk", /(promo|follow back|dm me|telegram|whatsapp|crypto)/iu],
    ["safety-review", /(죽고 싶|사라지고 싶|자해|suicide|kill myself|self harm)/iu],
  ];
  for (const [label, pattern] of checks) {
    if (pattern.test(text)) tones.push(label);
  }
  return tones;
}

function extractVisibleText(html) {
  return decodeHtml(
    String(html)
      .replace(/<script\b[\s\S]*?<\/script>/gi, "\n")
      .replace(/<style\b[\s\S]*?<\/style>/gi, "\n")
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, "\n")
      .replace(/<[^>]+>/g, "\n")
      .replace(/\n{3,}/g, "\n\n"),
  )
    .split("\n")
    .map((line) => clean(line))
    .filter(Boolean)
    .join("\n")
    .slice(0, 8000);
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
  const captureEvidence = renderCaptureEvidence(snapshot);
  const visiblePosts = renderVisiblePosts(snapshot);
  const commentsSummary = renderCommentsSummary(snapshot);
  const reviewIssues = renderReviewIssues(snapshot);

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

## Capture Evidence

${captureEvidence}

## Visible Posts And Comment Signals

${visiblePosts}

### Comments

${commentsSummary}

## Monitoring Review Issues

${reviewIssues}
`;
}

function renderCaptureEvidence(snapshot) {
  return ["instagram", "youtube"]
    .map((platform) => {
      const evidence = snapshot.captureEvidence?.[platform];
      if (!evidence) return `- ${platform}: capture evidence unavailable`;
      const file = evidence.file ? ` / file: ${evidence.file}` : "";
      return `- ${platform}: ${evidence.method} / ${evidence.htmlBytes} bytes${file}`;
    })
    .join("\n");
}

function renderVisiblePosts(snapshot) {
  const rows = [];
  for (const platform of ["instagram", "youtube"]) {
    const posts = snapshot.visiblePosts?.[platform] || [];
    if (!posts.length) {
      rows.push(`- ${platform}: 공개 캡처에서 신뢰 가능한 개별 게시물 텍스트를 찾지 못함`);
      continue;
    }
    for (const post of posts) {
      const metric = post.metrics?.views ? ` / ${post.metrics.views}` : "";
      rows.push(`- ${platform}: ${post.text || post.id || "visible item"}${post.url ? ` (${post.url})` : ""}${metric}`);
    }
  }
  return rows.join("\n");
}

function renderCommentsSummary(snapshot) {
  return ["instagram", "youtube"]
    .map((platform) => {
      const summary = snapshot.visibleCommentsSummary?.[platform];
      if (!summary) return `- ${platform}: 공개 댓글 요약 없음`;
      return `- ${platform}: ${summary.summary}`;
    })
    .join("\n");
}

function renderReviewIssues(snapshot) {
  const issues = snapshot.reviewIssues || [];
  if (!issues.length) return "- 없음";
  return issues
    .map((issue) => `- ${issue.platform} / ${issue.type}: ${issue.message}`)
    .join("\n");
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

function describeError(error) {
  const cause = error?.cause;
  const causeMessage = cause?.code || cause?.message;
  return clean([error?.message, causeMessage].filter(Boolean).join(" / ")) || "unknown error";
}

function stampForFile(date) {
  return date.toISOString().replace(/[:.]/g, "-");
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

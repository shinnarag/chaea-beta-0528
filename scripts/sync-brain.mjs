#!/usr/bin/env node
// sync-brain.mjs — 라이브 데이터(소셜 스냅샷, persona-updates)를 단일 원천 brain.json에 반영한다.
//
//   node scripts/sync-brain.mjs           # 동기화 후 brain.json 갱신
//   node scripts/sync-brain.mjs --dry      # 변경 사항만 출력(쓰지 않음)
//
// 갱신 범위(구조화 데이터만):
//   - social.instagram / social.youtube 수치 ← chaealine-snapshot.json
//   - timeline ← persona-updates/*.json + 소셜 검증 이벤트
// runtimeDigests의 프로즈는 톤 보존을 위해 건드리지 않는다. 수치가 바뀌면 경고만 띄운다.
// 이후 `npm run build:persona`로 런타임/문서를 재생성한다.

import { readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BRAIN = join(ROOT, "data", "chaea-brain.json");
const SNAPSHOT = join(ROOT, "data", "social", "chaealine-snapshot.json");
const UPDATES_DIR = join(ROOT, "data", "persona-updates");
const DRY = process.argv.includes("--dry");

const num = (v) => (v && typeof v === "object" ? v.value ?? null : v ?? null);

async function readJson(p, fallback = null) {
  try { return JSON.parse(await readFile(p, "utf8")); } catch { return fallback; }
}

async function main() {
  const brain = await readJson(BRAIN);
  if (!brain) throw new Error("data/chaea-brain.json 을 읽을 수 없습니다.");
  const snap = await readJson(SNAPSHOT);

  const changes = [];
  const warnings = [];

  // 1) 소셜 수치 동기화
  if (snap) {
    const ig = snap.instagram || {};
    const yt = snap.youtube || {};
    const bv = snap.browserVerification || {};
    const igF = num(ig.followers), igP = num(ig.posts), igFo = num(ig.following);
    const ytSubs = num(bv.youtube?.channelVisibleStats?.subscribers);
    const ytVids = num(bv.youtube?.channelVisibleStats?.videos);

    const set = (path, next) => {
      if (next == null) return;
      const cur = path.split(".").reduce((o, k) => o?.[k], brain.social);
      if (cur !== next) {
        changes.push(`social.${path}: ${cur} → ${next}`);
        const keys = path.split(".");
        let o = brain.social;
        for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]];
        o[keys[keys.length - 1]] = next;
      }
    };
    set("instagram.followers", igF);
    set("instagram.following", igFo);
    set("instagram.posts", igP);
    if (ig.bio && brain.social.instagram.bio !== ig.bio) {
      changes.push(`social.instagram.bio: "${brain.social.instagram.bio}" → "${ig.bio}"`);
      brain.social.instagram.bio = ig.bio;
    }
    if (ytSubs != null) set("youtube.subscribers", ytSubs);
    if (ytVids != null) set("youtube.videos", ytVids);

    if (snap.updatedAt) brain.social.verifiedAt = snap.updatedAt;
    if (snap.updatedAtKst) brain.social.verifiedAtKst = snap.updatedAtKst + (snap.updatedAtKst.includes("KST") ? "" : " KST");

    // 디제스트 프로즈와 수치 일치 점검(경고만)
    const dig = brain.runtimeDigests?.currentSocial || "";
    if (igF != null && !dig.includes(`${igF} followers`)) warnings.push(`currentSocial 프로즈의 IG 팔로워가 ${igF} 와 다릅니다 — brain.json runtimeDigests를 갱신하세요.`);
    if (igP != null && !dig.includes(`${igP} posts`)) warnings.push(`currentSocial 프로즈의 IG 게시물이 ${igP} 와 다릅니다 — brain.json runtimeDigests를 갱신하세요.`);
    if (ytSubs != null && !dig.includes(`구독자 ${ytSubs}`)) warnings.push(`currentSocial 프로즈의 YT 구독자가 ${ytSubs} 와 다릅니다 — brain.json runtimeDigests를 갱신하세요.`);
  } else {
    warnings.push("소셜 스냅샷이 없어 social 동기화를 건너뜀 (npm run monitor:social 먼저 실행).");
  }

  // 2) timeline 재구성: 기존 data 이벤트 보존 + persona-updates 반영 + 소셜 검증 이벤트
  const preserved = (brain.timeline || []).filter((t) => t.type === "data");
  const timeline = [...preserved];
  const seen = new Set(preserved.map((t) => t.ref || t.title));

  try {
    const files = (await readdir(UPDATES_DIR)).filter((f) => f.endsWith(".json")).sort();
    for (const f of files) {
      const u = await readJson(join(UPDATES_DIR, f));
      if (!u) continue;
      const ref = `data/persona-updates/${f}`;
      if (seen.has(ref)) continue;
      seen.add(ref);
      timeline.push({
        date: u.date || f.slice(0, 10),
        type: "persona-update",
        title: u.title || u.scope || u.status || u.id,
        status: u.status || null,
        ref,
      });
    }
  } catch { /* dir 없음 */ }

  if (snap?.updatedAt) {
    const igF = num(snap.instagram?.followers), igP = num(snap.instagram?.posts);
    const ref = `social-verify:${snap.updatedAt}`;
    if (!seen.has(ref)) {
      timeline.push({
        date: (snap.updatedAtKst || snap.updatedAt).slice(0, 10).replace(/\. /g, "-").replace(/\.$/, ""),
        type: "social",
        title: `소셜 검증: IG ${igF}팔로워/${igP}게시물`,
        ref: "data/social/chaealine-snapshot.json",
      });
    }
  }

  timeline.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const before = JSON.stringify(brain.timeline || []);
  if (JSON.stringify(timeline) !== before) changes.push(`timeline: ${(brain.timeline || []).length} → ${timeline.length} 이벤트`);
  brain.timeline = timeline;

  // 출력
  if (warnings.length) { console.warn("⚠️  경고:"); for (const w of warnings) console.warn("   - " + w); }
  if (!changes.length) { console.log("✓ 변경 없음 (brain.json 이미 최신)."); return; }
  console.log((DRY ? "[dry-run] " : "") + "변경 사항:");
  for (const c of changes) console.log("   - " + c);

  if (DRY) { console.log("\n[dry-run] 쓰지 않음. 적용하려면 --dry 없이 실행."); return; }
  await writeFile(BRAIN, JSON.stringify(brain, null, 2) + "\n", "utf8");
  console.log("\n✓ data/chaea-brain.json 갱신 완료. 이제 `npm run build:persona` 를 실행하세요.");
}

main().catch((err) => { console.error(err); process.exit(1); });

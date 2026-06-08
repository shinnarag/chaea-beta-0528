#!/usr/bin/env node
// build-persona.mjs — 단일 원천(data/chaea-brain.json)에서 런타임 모듈과 사람용 문서를 생성한다.
//
//   node scripts/build-persona.mjs           # 생성
//   node scripts/build-persona.mjs --check    # 생성물이 원천과 일치하는지만 검사(쓰지 않음). 불일치 시 exit 1.
//
// 생성물(직접 편집 금지):
//   - functions/_shared/persona-generated.js   (chaea.js가 import)
//   - docs/current/ChaeA_Brain_Generated.md     (사람용 요약 문서)

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BRAIN_PATH = join(ROOT, "data", "chaea-brain.json");
const RUNTIME_OUT = join(ROOT, "functions", "_shared", "persona-generated.js");
const DOC_OUT = join(ROOT, "docs", "current", "ChaeA_Brain_Generated.md");

const CHECK = process.argv.includes("--check");

const GEN_HEADER = "// ⚠️ 자동 생성 파일 — 직접 편집하지 마세요.\n// 원천: data/chaea-brain.json  ·  재생성: npm run build:persona\n";

function buildRuntimeModule(brain) {
  const d = brain.runtimeDigests;
  const s = brain.social;
  const obj = {
    version: brain.meta.version,
    updatedAtKst: brain.meta.updatedAtKst,
    storyPersonaDigest: d.storyPersona,
    currentSocialDigest: d.currentSocial,
    lifestyleFlexDigest: d.lifestyleFlex,
    // 구조화 사실 일부도 노출(런타임이 정확한 수치를 직접 참조할 수 있게)
    social: {
      handle: s.official.handle,
      instagram: s.official.instagram,
      youtube: s.official.youtube,
      instagramStats: { followers: s.instagram.followers, following: s.instagram.following, posts: s.instagram.posts, bio: s.instagram.bio },
      youtubeStats: { subscribers: s.youtube.subscribers, videos: s.youtube.videos, channelId: s.youtube.channelId },
    },
  };
  const body = Object.entries(obj)
    .map(([k, v]) => `export const ${k} = ${JSON.stringify(v, null, 2)};`)
    .join("\n\n");
  return `${GEN_HEADER}\n${body}\n`;
}

function buildDoc(brain) {
  const i = brain.identity;
  const s = brain.social;
  const lines = [];
  lines.push("<!-- ⚠️ 자동 생성 문서 — 직접 편집하지 마세요. 원천: data/chaea-brain.json -->");
  lines.push(`# ChaeA 정전 요약 (생성됨)\n`);
  lines.push(`> 버전 ${brain.meta.version} · 갱신 ${brain.meta.updatedAtKst}\n`);
  lines.push(`## 정체성`);
  lines.push(`- ${i.stageName} (${i.legalPersonaName}), ${i.birthDate}, ${i.mbti}`);
  lines.push(`- ${i.role} · ${i.genres.join(" / ")} · 주악기 ${i.primaryInstrument}`);
  lines.push(`- ${i.oneLine}\n`);
  lines.push(`## 세계관 — ${brain.worldview.keyword}`);
  lines.push(`- ${brain.worldview.meaning}\n`);
  lines.push(`## 소셜 (검증 ${s.verifiedAtKst})`);
  lines.push(`- Instagram ${s.official.instagram} — 팔로워 ${s.instagram.followers} / 게시물 ${s.instagram.posts} / bio "${s.instagram.bio}"`);
  lines.push(`- YouTube ${s.official.youtube} — 구독자 ${s.youtube.subscribers} / 동영상 ${s.youtube.videos}`);
  if (s.knownCollaborations?.length) {
    lines.push(`- 협업: ${s.knownCollaborations.map((c) => `${c.name} — ${c.work}`).join("; ")}`);
  }
  lines.push("");
  lines.push(`## 경계 규칙`);
  for (const b of brain.boundaries) lines.push(`- ${b}`);
  lines.push("");
  lines.push(`## 미확정 슬롯 (성장하며 채워질 항목)`);
  for (const o of brain.openSlots) lines.push(`- ${o}`);
  lines.push("");
  lines.push(`## 타임라인`);
  for (const t of brain.timeline) lines.push(`- **${t.date}** [${t.type}] ${t.title}`);
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const brain = JSON.parse(await readFile(BRAIN_PATH, "utf8"));

  // 무결성 검사: runtimeDigests의 social 수치가 social 블록과 일치하는가
  const warnings = [];
  const dig = brain.runtimeDigests.currentSocial;
  if (!dig.includes(`${brain.social.instagram.followers} followers`)) {
    warnings.push(`currentSocial digest의 IG 팔로워 수가 social.instagram.followers(${brain.social.instagram.followers})와 불일치할 수 있음`);
  }
  if (!dig.includes(`${brain.social.instagram.posts} posts`)) {
    warnings.push(`currentSocial digest의 IG 게시물 수가 social.instagram.posts(${brain.social.instagram.posts})와 불일치할 수 있음`);
  }
  if (!dig.includes(`구독자 ${brain.social.youtube.subscribers}`)) {
    warnings.push(`currentSocial digest의 YT 구독자 수가 social.youtube.subscribers(${brain.social.youtube.subscribers})와 불일치할 수 있음`);
  }
  if (warnings.length) {
    console.warn("⚠️  무결성 경고:");
    for (const w of warnings) console.warn("   - " + w);
  }

  const runtime = buildRuntimeModule(brain);
  const doc = buildDoc(brain);

  if (CHECK) {
    let drift = false;
    for (const [path, expected] of [[RUNTIME_OUT, runtime], [DOC_OUT, doc]]) {
      let actual = "";
      try { actual = await readFile(path, "utf8"); } catch { /* missing */ }
      if (actual !== expected) {
        console.error(`✗ 드리프트: ${path} 가 chaea-brain.json과 일치하지 않습니다. 'npm run build:persona'를 실행하세요.`);
        drift = true;
      }
    }
    if (drift) process.exit(1);
    console.log("✓ 생성물이 단일 원천과 일치합니다 (드리프트 0).");
    return;
  }

  await writeFile(RUNTIME_OUT, runtime, "utf8");
  await writeFile(DOC_OUT, doc, "utf8");
  console.log(`✓ 생성 완료`);
  console.log(`  - ${RUNTIME_OUT}`);
  console.log(`  - ${DOC_OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

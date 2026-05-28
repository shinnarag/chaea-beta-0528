import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const out = join(root, "public");
const skipSystemFiles = (src) => basename(src) !== ".DS_Store";

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

await cp(join(root, "index.html"), join(out, "index.html"));
await cp(join(root, "app"), join(out, "app"), { recursive: true, filter: skipSystemFiles });
await cp(join(root, "assets"), join(out, "assets"), { recursive: true, filter: skipSystemFiles });
await writeFile(join(out, ".assetsignore"), ".DS_Store\n**/.DS_Store\n", "utf8");

console.log(`GitHub Pages assets written to ${out}`);

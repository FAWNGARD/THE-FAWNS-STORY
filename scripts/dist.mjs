// Builds the folder each app packs.
//   desktop → dist/web   (page, images, data, fonts — embedded into the .exe)
//             dist/media (audio + video — shipped next to it as Tauri resources)
//   android → dist/android (everything, served from the APK)
// In both, videos from media-hq/ replace the lighter web versions (same file names, same cut points).
import { cpSync, rmSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const target = process.argv[2];
const WEB = "web", HQ = "media-hq", OUT = "dist";
const copy = (from, to, filter) => cpSync(from, to, { recursive: true, filter });
const overlayHQ = (videoDir) => {
  const hq = join(HQ, "video");
  if (!existsSync(hq)) return;
  for (const f of readdirSync(hq)) if (f.endsWith(".mp4")) cpSync(join(hq, f), join(videoDir, f));
};

if (target === "desktop") {
  rmSync(join(OUT, "web"), { recursive: true, force: true });
  rmSync(join(OUT, "media"), { recursive: true, force: true });
  const isMedia = (p) => /[\\/](audio|video)([\\/]|$)/.test(p.slice(WEB.length));
  copy(WEB, join(OUT, "web"), (p) => !isMedia(p));
  mkdirSync(join(OUT, "media"), { recursive: true });
  copy(join(WEB, "audio"), join(OUT, "media", "audio"));
  copy(join(WEB, "video"), join(OUT, "media", "video"));
  overlayHQ(join(OUT, "media", "video"));
} else if (target === "android") {
  rmSync(join(OUT, "android"), { recursive: true, force: true });
  copy(WEB, join(OUT, "android"));
  overlayHQ(join(OUT, "android", "video"));
} else {
  console.error("usage: node scripts/dist.mjs desktop|android");
  process.exit(1);
}
console.log(`dist ready: ${target}`);

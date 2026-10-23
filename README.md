# The Fawn's Story — Season 1: Bloody Tour

Interactive audio series app. One codebase, three outputs:

| Output | Built from | Where it appears |
|---|---|---|
| Website | `web/` as is | published separately |
| Windows installer (`.exe`) | Tauri (`src-tauri/`) | Actions → artifacts / Releases |
| Android (`.apk`) | Capacitor (`capacitor.config.json`) | Actions → artifacts / Releases |

## Layout
- `web/` — the app itself (page, data, images, fonts, audio, light web videos).
- `media-hq/video/` — full-quality bonus videos and credits; replace the web videos in the desktop and Android builds (same names, same cut points).
- `scripts/dist.mjs` — assembles `dist/` for each target.
- `scripts/android-tweaks.mjs` — landscape, full screen, version code for the generated Android project.
- `assets/` — app icon and splash.

## Builds
Every push to `main` builds both apps (Actions → **Build apps** → artifacts).
Pushing a tag `v1.0.0` also publishes a GitHub Release with both files.

Android release signing uses repository secrets:
`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`, `ANDROID_KEY_PASSWORD`.
Without them a debug-signed APK is built (installable, but not for store updates).

Build logs are mirrored to the `ci-logs` branch.

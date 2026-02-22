# AGENTS.md

This file is for coding agents working in this repository.

## Mission

Maintain and extend the Offline Minecraft Skin Converter while keeping behavior stable for existing users:

- upload `64x64` skin PNG
- preview skin
- generate downloadable `skin_pack.zip`

## Current Code Layout

- `index.html`
  - Markup only.
  - Loads external CSS and JS modules.
- `styles.css`
  - All visual styling.
- `app.dom.js`
  - Centralized DOM lookups, exported on `window.AppDom`.
- `app.data.js`
  - Static app data (translations, Minecraft version map, target skin names), exported on `window.AppData`.
- `app.js`
  - Runtime behavior and event wiring.
  - Zip generation and state management.
- `functions/api/skin.js`
  - Cloudflare Pages Function for `GET /api/skin`.
  - Resolves username -> Mojang skin PNG.
- `wrangler.toml`
  - Cloudflare Pages deployment configuration.

## Core Product Rules

1. Keep the upload-first experience stable.
2. Do not break zip output structure.
3. Keep translation behavior working (`en`, `pt-br`, `es`).
4. Keep UI keyboard accessibility for file input and main controls.

## Metadata Rule (Important)

`pack.mcmeta` format must depend on version metadata mode:

- Modern mode (for versions that use range metadata):
  - use `min_format` and `max_format`
- Legacy mode:
  - use `pack_format`

Do not emit both shapes at once.

## Pending Roadmap Items

These were original owner requests and should be treated as primary backlog:

1. Version selector metadata audit/finalization.

Completed roadmap items:

- Username-based skin fetch path.
- Generate `pack.png` from skin face (with hat layer overlay).
- Cloudflare Pages/Workers migration from GitHub Pages.

Detailed copy-paste prompts live in `readme.md`.

## Safe Editing Guidelines

- Prefer minimal, scoped edits.
- Preserve existing IDs used by JS selectors.
- Keep modular separation:
  - DOM refs in `app.dom.js`
  - static data in `app.data.js`
  - behavior in `app.js`
- Avoid introducing frameworks unless explicitly requested.
- Keep files ASCII unless a file already uses non-ASCII text.

## Verification Checklist

Run these checks after JS edits:

```powershell
node --check app.dom.js
node --check app.data.js
node --check app.js
node --check functions/api/skin.js
```

Manual smoke test:

1. Upload valid `64x64` PNG.
2. Confirm preview updates.
3. Download zip.
4. Confirm success state and expected zip structure.
5. Switch language and ensure text updates.
6. Change Minecraft version and confirm generated metadata shape.

## Deployment Notes

Cloudflare deployment is configured with Wrangler + Pages Functions.

- `wrangler.toml` defines `name`, compatibility date, and output dir (`.`).
- `package.json` contains Wrangler scripts for local Pages dev and deploy.
- Keep static deployment simple and isolate API logic in `functions/api/`.
- Keep environment/setup docs in `readme.md` in sync with scripts/config.

## Handoff Expectations

If you complete a roadmap item, update:

- `readme.md` status section
- this `AGENTS.md` roadmap/checklist if behavior or architecture changed

Include exact changed files and validation results in your final summary.

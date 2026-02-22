# Offline Minecraft Skin Converter

Browser-based tool that converts a Minecraft skin (`64x64` PNG) into a Java resource pack zip that overrides the default player skins.

All pack generation runs client-side in the browser.

## Current Project Structure

- `index.html`: page structure and script/style includes.
- `styles.css`: all UI styling.
- `app.dom.js`: centralized DOM element references.
- `app.data.js`: static data (version map, translations, skin target names).
- `app.js`: app behavior, pack generation logic, event wiring.
- `functions/api/skin.js`: Cloudflare Pages Function for username-to-skin PNG lookup.
- `wrangler.toml`: Cloudflare Pages deployment config.
- `server.js`: optional Node dev server (legacy/local fallback).
- `assets/`: fonts, audio, image assets.

## Current Feature Status

- Skin upload, preview, and pack zip download: implemented.
- Minecraft version selector: implemented.
- Pack metadata mode split: implemented.
  - Modern entries in `app.data.js` use `minFormat` + `maxFormat`.
  - Legacy entries use `packFormat`.
- Ko-fi button replaced with version selector in the bottom bar: implemented.
- Frontend refactor from single-file HTML to modular files: implemented.
- Username-based skin lookup (`GET /api/skin?username=<name>`): implemented.
- `pack.png` generated from skin face (base + hat overlay): implemented.
- Cloudflare Pages + Pages Functions deployment path: implemented.

## Original Requested Changes

The original request had 4 changes:

1. Pick Minecraft version for the pack.
2. `pack.png` should be the skin face. (implemented)
3. Fetch skin by Minecraft username. (implemented)
4. Deploy on Cloudflare Pages/Workers instead of GitHub Pages. (implemented)

## Cloudflare Deployment

Required secrets/environment variables:

- None for current functionality.

Runtime routes:

- Static frontend: served from project root (`.`).
- API endpoint: `GET /api/skin?username=<name>` from `functions/api/skin.js`.

One-time setup:

1. Install dependencies: `npm install`
2. Authenticate Wrangler: `npx wrangler login`
3. Create a Cloudflare Pages project named `offline-minecraft-skin-converter` (or update `name` in `wrangler.toml` and the deploy script in `package.json` to your project name).

Local Cloudflare-compatible dev:

```powershell
npm run dev
```

Deploy to Cloudflare Pages:

```powershell
npm run deploy
```

This repo has no build step; the deploy target is the repository root.

## Prompt Pack For A Fresh Agent

Use any prompt below directly with a new coding agent.

### Prompt 1: Version Selector + Metadata Correctness

```text
Task: Audit and finalize Minecraft version metadata generation for this repo.

Repository context:
- Static frontend app that generates a resource pack zip in-browser.
- Current source files are modularized (`index.html`, `styles.css`, `app.dom.js`, `app.data.js`, `app.js`).
- Version options are defined in `app.data.js`.
- `pack.mcmeta` generation is in `app.js`.

Requirements:
1) Keep the version dropdown in the UI and make sure selected version controls generated `pack.mcmeta`.
2) Implement metadata rules:
   - For modern versions (starting from 1.21.9+): use:
     {
       "pack": {
         "description": ...,
         "min_format": X,
         "max_format": Y
       }
     }
   - For legacy versions: use:
     {
       "pack": {
         "description": ...,
         "pack_format": X
       }
     }
3) Ensure no mixed output per build (never output both `pack_format` and `min_format/max_format` together).
4) Confirm version map is complete and consistent with listed labels.
5) Keep dropdown labels human-readable (no `pack_format` suffix in UI labels).

Acceptance criteria:
- Downloaded zip has valid `pack.mcmeta` shape based on selected version.
- Existing upload/download behavior remains unchanged.
- Translation strings and accessibility labels still work.
- No runtime JS errors.

Verification:
- Run syntax checks on JS files.
- Manually test at least one modern and one legacy version output.
- Include a short summary of tested outputs.
```

### Prompt 2: Generate `pack.png` From Skin Face

```text
Task: Add `pack.png` generation using the uploaded skin face, and include it in the generated zip.

Repository context:
- Zip creation logic is in `app.js`.
- The skin image is loaded from uploaded 64x64 PNG.
- Files are written with JSZip.

Requirements:
1) Build `pack.png` dynamically from the skin:
   - Base face region: front face (8,8)-(15,15) from 64x64 skin.
   - Overlay hat/layer region: (40,8)-(47,15), composited on top.
2) Scale face to a reasonable icon size (for example 128x128 or 256x256) using pixelated nearest-neighbor style.
3) Add `pack.png` at the root of `skin_pack/` inside zip.
4) Keep all existing generated skin replacement textures intact.

Edge cases:
- If overlay is transparent, base face should still render correctly.
- If icon creation fails, fail gracefully with a visible error toast and do not create a broken zip.

Acceptance criteria:
- Generated zip contains `skin_pack/pack.png`.
- `pack.png` visually matches selected skin face.
- Existing zip content remains unchanged except added icon.
```

### Prompt 3: Username Skin Lookup

```text
Task: Add username-based skin selection in addition to local PNG upload.

Repository context:
- Current app is browser-only upload flow.
- UI controls and state handling are in `app.js`.
- Build output is still local zip generation.

Requirements:
1) Add UI:
   - Username input field.
   - Fetch/load button.
   - Clear feedback for loading, success, and failure.
2) Add logic to resolve username -> skin PNG and feed it into existing preview/download pipeline.
3) Keep local file upload path fully working.
4) If username fetch fails, show user-facing error message and do not break current state.
5) Document privacy implications in UI text if a network call is used.

Implementation guidance:
- Prefer a backend proxy endpoint (Cloudflare Worker/Pages Function) to avoid browser CORS/rate-limit issues.
- If proxy is not implemented yet, isolate the fetch logic behind one function so backend integration is easy to swap.

Acceptance criteria:
- User can type username, fetch skin, preview it, and download a valid pack.
- Upload flow still works exactly as before.
- Errors are graceful for unknown usernames, network failures, and invalid responses.
```

### Prompt 4: Cloudflare Pages/Workers Deployment Maintenance

```text
Task: Audit and maintain Cloudflare Pages/Workers deployment setup.

Repository context:
- Project is static frontend + Cloudflare Pages Function endpoint for username lookup.
- Current deployment uses Wrangler.

Requirements:
1) Keep Cloudflare deployment scripts/config current (`wrangler.toml`, npm scripts).
2) Verify static site and `/api/skin` endpoint still deploy together.
3) Update docs with exact setup steps:
   - required env vars/secrets
   - build/deploy commands
   - routes/endpoints
4) Ensure deployment path works with this repository layout (no bundler required unless introduced intentionally).

Acceptance criteria:
- Repo can be deployed to Cloudflare Pages.
- API endpoint is deployable on Cloudflare and reachable from frontend.
- README instructions are complete enough for a first-time deploy.
```

## Combined Prompt (If You Want One Agent To Do Everything)

```text
Implement all four roadmap items for this repository:
1) version metadata audit/finalization,
2) pack.png generated from skin face,
3) username-based skin fetch,
4) Cloudflare Pages/Workers deployment migration.

Constraints:
- Preserve current behavior and styling unless required by the feature.
- Keep code modular (`app.dom.js`, `app.data.js`, `app.js` pattern).
- Do not regress existing upload/download flow.
- Include verification steps and summarize tested scenarios.

Deliverables:
- Code updates,
- updated docs,
- explicit list of changed files and why.
```

## Local Development

Preferred local modes:

1) Cloudflare-compatible local runtime (static + Pages Functions):

```powershell
npm run dev
```

2) Node fallback runtime (`server.js`, mirrors `/api/skin` behavior):

```powershell
npm start
```

Opening `index.html` directly with the `file://` protocol is still possible for upload/download, but username lookup requires a server runtime.

## Notes

- If you implement username lookup, the tool is no longer fully offline for that specific path.
- Keep error handling explicit and user-visible (toast/modal text) to avoid silent failures.

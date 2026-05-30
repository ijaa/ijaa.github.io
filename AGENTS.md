# Repository Guidelines

## Project Structure & Module Organization
This repository is the GitHub Pages aggregator for IJAA sites. The current root site is a Vite + React + Three.js portfolio-style app in `src/`. Static runtime assets live in `public/`, including 3D reference models, textures, fonts, and audio under `public/reference/`. `site/` contains the legacy/static landing assets used by the Pages build flow. `scripts/build-pages.mjs` builds the root site and sibling product repos into `dist/`. `docs/` stores architecture, rebuild progress, and scroll issue notes. `e2e/` stores Playwright tests.

Sibling product repos are expected at paths such as `../baby-future`, `../image-story`, and `../gpt-image-gen`.

## Build, Test, and Development Commands
- `npm run dev` - starts the Vite dev server.
- `npm run build:site` - builds only the root React site.
- `npm run build` - clears `dist/`, builds the root site, builds sibling product repos, and writes the final Pages output.
- `npm run preview` - serves `dist/` locally at `http://localhost:4173`.
- `npx playwright test e2e/project-links.spec.ts` - verifies project image link navigation.
- `npx playwright test e2e/soundscape.spec.ts` - verifies the sound button behavior.
- `npx playwright test e2e/contact-links.spec.ts` - verifies the contact mail link.

If product repos are not in the default sibling paths, override with env vars such as `BABY_FUTURE_DIR=../custom-path npm run build`.

## Coding Style & Naming Conventions
Use TypeScript/React for the root app and plain ES modules for Node scripts. Follow the existing style:
- 2-space indentation in HTML, CSS, TS, TSX, and JS.
- Prefer small, explicit variables over clever abstractions.
- Keep paths and repo names kebab-case, for example `gpt-image-gen`.
- Keep content data in `src/content/` where possible.
- Keep 3D scene work inside `src/three/PortfolioScene.tsx` unless a real component boundary exists.

No formatter or linter is configured here, so match the surrounding code and keep diffs tidy.

## Testing Guidelines
Playwright is configured with `@playwright/test@1.60.0` and Chromium only. Run focused tests for the affected workflow:
- Project card/link changes: `npx playwright test e2e/project-links.spec.ts`
- Sound changes: `npx playwright test e2e/soundscape.spec.ts`
- Contact/email changes: `npx playwright test e2e/contact-links.spec.ts`

Run `npm run build:site` after root site changes. For build orchestration changes, run `npm run build` and verify `dist/404.html` is regenerated from `dist/index.html`.

## Content Notes
Current root site content:
- Hero title: `IJAA` + `AI探索者`
- Contact email: `kailiu2013@gmail.com`
- About copy focuses on AI Agent apps, image generation art, and independent development.
- Project images link directly to their public project URLs.
- The header keeps the sound button and does not show a persistent contact button.

## Commit & Pull Request Guidelines
Recent commits use short, imperative subjects such as `Add gpt-image-gen subsite` and `Redesign landing page in flat style`. Follow the same pattern:
- Start with a verb: `Add`, `Update`, `Redesign`, `Fix`.
- Keep the subject focused on one change.

PRs should include:
- A short summary of what changed.
- Any affected paths or sibling repos.
- Screenshots for landing page or visual updates.
- Notes about local verification, especially `npm run build:site`, `npm run build`, and relevant Playwright tests.

## Security & Configuration Tips
GitHub Actions needs `PAGES_REPO_TOKEN` with read access to private product repos. Do not commit local path overrides or secrets. Keep environment-specific repo paths in shell env vars only.

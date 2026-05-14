# Repository Guidelines

## Project Structure & Module Organization
This repository is the GitHub Pages aggregator for IJAA sites. `site/` contains the root landing page and static assets copied directly into the published output. `scripts/build-pages.mjs` builds sibling product repos and assembles everything into `dist/`. `docs/` stores architecture and landing design notes. `subsites/` is a local workspace helper for related products, while the actual product builds are pulled from sibling repositories such as `../baby-future`.

## Build, Test, and Development Commands
- `npm run build` — clears `dist/`, copies `site/`, builds each product repo, and writes the final Pages output.
- `npm run preview` — serves `dist/` locally at `http://localhost:4173`.

If product repos are not in the default sibling paths, override with env vars such as `BABY_FUTURE_DIR=../custom-path npm run build`.

## Coding Style & Naming Conventions
Use plain ES modules for Node scripts and semantic HTML/CSS for the landing page. Follow the existing style:
- 2-space indentation in HTML, CSS, and JS.
- Prefer small, explicit variables in scripts over clever abstractions.
- Keep paths and repo names kebab-case, for example `gpt-image-gen`.
- Keep static site edits contained to `site/index.html` unless new root assets are required.

No formatter or linter is configured here, so match the surrounding code and keep diffs tidy.

## Testing Guidelines
There is no standalone test suite in this repository. Validation is build-based:
- Run `npm run build` before opening a PR.
- Run `npm run preview` and check the root landing page plus `/baby-future/`, `/image-story/`, and `/gpt-image-gen/`.

For changes to build orchestration, verify that `dist/404.html` is regenerated from `dist/index.html`.

## Commit & Pull Request Guidelines
Recent commits use short, imperative subjects such as `Add gpt-image-gen subsite` and `Redesign landing page in flat style`. Follow the same pattern:
- Start with a verb: `Add`, `Update`, `Redesign`, `Fix`.
- Keep the subject focused on one change.

PRs should include:
- A short summary of what changed.
- Any affected paths or sibling repos.
- Screenshots for landing page or visual updates.
- Notes about local verification, especially `npm run build`.

## Security & Configuration Tips
GitHub Actions needs `PAGES_REPO_TOKEN` with read access to the private product repos. Do not commit local path overrides or secrets. Keep environment-specific repo paths in shell env vars only.

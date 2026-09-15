---
last_updated: 2026-09-15
---

# AGENTS.md - Mosaic

> Repository rules for AI Agents, including Claude Code, Codex, and Gemini CLI.
> All Agents must read and follow this file.

- This file is the single source of truth for repository Agent rules. `CLAUDE.md` imports it through `@AGENTS.md`.
- The English user introduction is [README.md](README.md). Documentation responsibilities are defined in [Documentation directories](#documentation-directories).

---

## Repo purpose

> Mosaic is an Obsidian community plugin for declarative content blocks.

- Plugin ID: `mosaic`. GitHub: `GilbertzzzZZ/obsidian-mosaic`.
- Declarations in Markdown (`.md` / `.mdx`) render in place as rich content in Reading view.
- Six block types are supported: Chart (AntV charts, with three syntax forms), DataTable, MetricGrid, Timeline, DecisionBox, and FlowDiagram.
- Product positioning and the roadmap are in [docs/mosaic-intro.md](docs/mosaic-intro.md). The English version is authoritative, with a Chinese translation.

---

## Work protocol

> Complete all four stages for every change.

### 1. Required reading

- Before changing the **rendering pipeline**, read [Known host pitfalls](#known-host-pitfalls).
- Before changing **block behavior**, read `docs/design/<block>.md` and `docs/guides/<block>.md`.
- Before following **OpenGlance Chart and card display capabilities**, read `docs/engineering/openglance-rendering-sync.md`. Sync only the rendering contracts and visual semantics defined there.
- Before changing **UI, settings, or the manifest**, check all four official policies in `docs/policies/`.
- Before **releasing**, read [docs/engineering/publishing-to-obsidian.md](docs/engineering/publishing-to-obsidian.md).

### 2. Implementation constraints

- Allow dependencies only from entry → parse/render and render → parse. Do not add reverse dependencies.
- Register a new block type only in `COMPONENT_NAMES`. Derive entry lists and language mappings from that source instead of maintaining duplicate lists.
- Treat `src/parse/blocks/` as a settled data layer. Fix actual bugs with the smallest possible change. Do not perform style refactors.
- Maintain Agent guidance in one English source: `src/agent-guide/mosaic.md`. README and `docs/guides/agent-guide*.md` describe installation only and must not duplicate the body.
- After editing Agent guidance, run `node --test tests/agent-guide-content.test.mjs`. All six minimal block examples, complete dataset manifests, and prohibited-field checks must pass before commit.
- Keep the change scope equal to the requested scope. Do not add incidental refactors, renames, or abstractions.

### 3. Completion checks

- Run `npm test`. All 427 tests must pass.
- Run `npm run build`. Both tsc typechecking and the esbuild production build must pass.
- When behavior changes, review both guides and design documents. Update `docs/guides/` for usage changes and `docs/design/` for changes to design rationale.
- Use the test vault only for checks unit tests cannot cover: visual output, host behavior, and error placement. Keep pure-function checks in unit tests.

### 4. Public-repository boundaries

- Keep machine-specific information out of code, comments, fixtures, and documents: absolute paths, usernames, private toolchains, and personal vault locations. Use environment variable names or generic descriptions in examples.
- Keep personal and company information out of the repository: real business-line names, internal repositories, private project names, and real business data. Use fictional example data.
- Do not include source paths or line numbers from other projects unless they belong to publicly accessible third-party open-source libraries.
- Apply the same restrictions to `docs/plans/` and `docs/_archive/`, including implementation plans, acceptance records, and archive status blocks.
- Before adding a document, choose its location using [Documentation directories](#documentation-directories).

---

## Architecture: three layers

> Entry, parsing, and rendering have separate responsibilities and share a normalized handoff.

```text
Entry (src/entry/)   Recognizes two physical forms and emits the same structure:
                    type + attribute map + body.
                    chart-tag-processor: six tag types, generation tokens
                    block-processor: six code-block types, component dispatch
Parse (src/parse/)  Pure functions with no Obsidian dependency, except the
                    obsidian-dataset.ts vault I/O adapter.
                    blocks/ is settled: minimal bug fixes, no style refactors.
Render (src/render/)
                    Shared shell: figure, toolbar, footnote, error box.
                    Libraries load on demand; AntV draws charts.
                    render-chart dispatches Chart; render-component dispatches
                    five other types; components/ contains their views.
```

- `COMPONENT_NAMES` in `src/parse/chart-tag.mjs` is the authoritative tag-name list. Entry `FAST_PATH` and `OPEN_TAG` derive from it. Rendering uses `PLAIN_VIEWS` in render-component.
- `BLOCK_LANGUAGES` in the same file is the only code-block-language-to-component mapping. It derives lowercase language names from `COMPONENT_NAMES` and adds the legacy `chartview` → Chart alias.
- Parsing and rendering must not depend on which syntax produced the normalized input.

---

## File structure

> Source, tests, documentation, build configuration, and release files have distinct locations.

```text
obsidian-mosaic/
├── src/                  # Three source layers
├── tests/                # node --test for parse/render pure .mjs functions
├── docs/
│   ├── _archive/         # Completed plans
│   ├── _assets/          # Dark-theme host screenshots, fictional English data
│   ├── design/           # Architecture and block design rationale
│   ├── engineering/      # Development, verification, upstream sync, releases
│   ├── guides/           # Bilingual usage, dataset contracts, troubleshooting
│   ├── plans/            # Active implementation plans
│   ├── policies/         # Archived official Obsidian policies
│   ├── research/         # Candidate capabilities, licensing, maintenance, tests
│   └── *.md              # README-zh, mosaic-intro, and its Chinese translation
├── .github/workflows/    # ci.yml and tag-triggered draft release.yml
├── scripts/              # verify-release-tag.mjs and stub-d3-dsv.mjs
├── styles.css            # Release asset
├── manifest.json         # Release asset
└── esbuild.config.mjs    # tsc noEmit + esbuild production → main.js
```

- `main.js` is generated and must stay out of Git. GitHub Releases distribute `main.js`, `manifest.json`, and `styles.css`.
- `verify-release-tag.mjs` checks the tag against the three version records.
- `stub-d3-dsv.mjs` is a build-time replacement selected by the alias in `esbuild.config.mjs`.

---

## Documentation directories

> Choose a document's directory by its audience and purpose.

| Directory | Audience | Include | Exclude |
| --- | --- | --- | --- |
| `guides/` | Plugin users | **How**: syntax, attributes, payload contracts, error lists | Development, upstream sync, publishing, design rationale |
| `engineering/` | Developers, maintainers, task-executing Agents | **How**: local development, verification, upstream sync, publishing | User usage, full design rationale, one-off plans |
| `design/` | Developers | **Why**: design decisions, tradeoffs, rejected alternatives | Attribute references, usage examples, procedures, code |
| `policies/` | Developers and maintainers | Official Obsidian policies with source URL and retrieval date, using the `obsidian-` filename prefix | Mosaic-specific rules, which belong here |
| `research/` | Researchers and technical evaluators | Third-party evaluations before a decision is implemented | Implementation details of settled decisions |
| `plans/` | Task implementers | Active implementation plans | Completed plans, which belong in `_archive/` |
| `_archive/` | Maintainers | Completed plans with status blocks recording delivery and later-overturned items | Routine logs with no overturned items to record; omit these rather than archive them |

**Language rules**

- Keep all repository documents in English except user-facing Chinese introductions and guides with the `-zh.md` suffix.
- Keep `AGENTS.md`, `CLAUDE.md`, design documents, engineering guides, plans, archives, research, and policy documents in English. Do not create Chinese mirrors for them.
- In `guides/`, maintain bilingual user guides: `xxx.md` is the English source of truth, and `xxx-zh.md` is its Chinese translation.
- Update the English user document first, then its Chinese translation. Link both versions at the top.
- Keep code examples byte-for-byte identical across bilingual guides. Use fictional English data.
- Preserve literal syntax, input values, and language-selector labels when they are needed to explain a supported behavior or navigate to a translation.
- Keep upstream synchronization and publishing guides in `engineering/`.
- Keep independently complete usage and rationale documents in `guides/` and `design/` respectively. Put attributes in guides and design decisions in design documents.

**Completed plans**

- Move delivered implementation plans from `plans/` to `_archive/` and update references to their new paths.
- Record the delivery commit and superseded decisions. Preserve outstanding historical acceptance limitations explicitly; archiving a plan must not mark unverified checks as passed.

---

## Development commands

> Tests and a production build are required before every commit.

```bash
npm test               # node --test; every test must pass
npm run build          # tsc noEmit typecheck + esbuild production
npm run install:vault  # build + copy release assets using MOSAIC_PLUGIN_DIR
```

---

## Test vault: host verification

> Use a separate local Git repository for host-only acceptance tests.

- The test vault is not a subdirectory of this repository and is not tracked here. Deploy the three release assets with `npm run install:vault` and `MOSAIC_PLUGIN_DIR`. Do not test in a daily-use vault.
- Check `git status` before changing the test vault and preserve local edits.
- The test vault tracks common plugins, configuration, and themes under `.obsidian/`. After updating it, confirm the plugins and theme actually loaded before testing their combined behavior.
- Mosaic deployment and host sessions produce expected local differences. Do not blindly overwrite or commit runtime state.
- Keep only host-only checks in the vault: appearance, equivalence between syntax forms, host behavior, and error placement. The 427 unit tests cover parsed output, configuration objects, and error messages.
- Keep alias-chain checks in `tests/payload.test.mjs`, which already has three `alias chain fallbacks` tests.
- Use one file per verifiable assertion. Name files for the capability, without numeric prefixes: `line.md`, `granularity.md`, `payload-forms.md`, `errors.md`, and so on within the six type directories.
- Put every syntax form of one capability in the same file. For Chart and DataTable, use the sections `Code block · Inline`, `Code block · External`, `Tag · Inline`, and `Tag · External`, all rendering the same content for visual comparison.
- For the other four types, use only `Code block` and `Tag`. External data is supported only by Chart and DataTable.
- Use `host-behavior/` for theme switching, virtualization and width, paragraph takeover, and plugin lifecycle tests.
- Use `cases/` for four fictional scenario reports with deliberately mixed syntax and two intentional errors per report.
- Use `_assets/` for data files and `_readme/` for README screenshot pages.
- Every `.md` file except the vault-root `README.md` must have a byte-identical `.mdx` counterpart. Maintain pairs with `sync-mdx.sh`.
- Treat the vault-root `README.md` as the structure's source of truth. Update it before changing the structure.
- Inspect real-host DOM through the Obsidian developer console. Disable restricted mode with `app.plugins.setEnable(true)`.
- Use `disablePluginAndSave` / `enablePluginAndSave` when removing or adding plugins, not plain `disablePlugin`.
- Capture only the Obsidian window for documentation screenshots and use fictional English data.

---

## Known host pitfalls

> Read these constraints before changing the rendering pipeline.

1. **Render timing:** Obsidian can invoke a post-processor while a section is detached with zero width, or inside a temporary measurement container about 330px wide. Wait for `whenHostReady` without a timeout, and retain ChartFigure's width listener for in-place rebuilding. Include the entry's `unloaded` flag in `stale()` so host-ready polling stops for detached, unloaded nodes.
2. **Theme changes:** Use the `mosaic:theme-change` custom event to restyle each block in place. Do not use `rerender(true)`. Keep onload's `rerenderOpenPreviews()` fallback, with optional private `rebuildView` access, for empty paragraphs left while the plugin was disabled.
3. **Virtualization:** Sections outside the viewport may not exist in the DOM. Scroll the container's `scrollTop` to the bottom before counting charts or error boxes.
4. **CommonMark paired-tag boundaries:** Keep the opening tag on one line and omit blank lines inside the tag body. These boundaries come from host paragraph splitting.

---

## Marketplace compliance

> Check the archived official policies and publishing guide before changing submission-sensitive behavior.

- Official policy texts are in [docs/policies/](docs/policies/): `obsidian-developer-policies`, `obsidian-submission-requirements`, `obsidian-plugin-guidelines`, and `obsidian-plugin-self-critique-checklist`.
- Check all four before changing UI, settings, or the manifest.
- Follow [docs/engineering/publishing-to-obsidian.md](docs/engineering/publishing-to-obsidian.md). Submit through community.obsidian.md, not a PR to obsidian-releases.
- Preserve these requirements: no console noise, `innerHTML`, network requests, telemetry, `eval`, or `new Function`.
- Use English sentence case in UI text.
- Define settings through the declarative `getSettingDefinitions` API without `display()` or a top-level heading. Use native groups named `Import skill` and `Import guides to this vault (optional)`.
- Dynamically load desktop-only host modules only after a platform guard.
- Keep typechecking in the build and `main.js` out of Git.
- Treat the community review's **Source code** section as output from the directory's typescript-eslint setup, not a repository lint command.
- Do not install that lint toolchain here to reproduce a review. Its TypeScript peer range is `>=4.8.4 <6.1.0`, while this repository uses TS 7. `eslint-plugin-obsidianmd` also pins its Obsidian peer to `1.8.7`.
- Do not add lint to `build`. The directory uses `npm run build` for byte-for-byte reproduction.
- If a separate lint check is needed, run it in a disposable environment outside the repository.

---

## Git rules

> Develop on a task branch, merge locally into main, and push main without creating a PR unless the user requests otherwise.

- Do not develop or commit directly on `main`.
- Merge from the main checkout. Task worktrees must not switch to `main`.
- Before merging, require a clean worktree, fetch remote state, and fast-forward local `main` to `origin/main`. Stop and report if it cannot fast-forward or a semantic conflict occurs.
- Before committing, require passing `npm test` and `npm run build`.
- After pushing, confirm local `main`, `origin/main`, and remote main resolve to the same commit, then follow that commit's CI result.
- Merging and pushing do not authorize a tag or release.
- A release tag must exactly match `manifest.json`'s `version`, without a `v` prefix. Enforce this with `scripts/verify-release-tag.mjs`.

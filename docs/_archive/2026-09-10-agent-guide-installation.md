# Mosaic Agent Guide Installation Implementation Plan

> Archived on 2026-09-15. Implementation and review were delivered at `f6ac2c6`; this is a historical record, not an active execution plan.
> The original client/platform acceptance limitations and unchecked items remain unverified. Archival does not mark them as passed.

**Superseded decisions:** The vault-only scope, concise guidance, and original buttons were replaced by the [scope and complete-guidance plan](2026-09-11-import-scope-and-complete-guidance.md). Later explicit-import behavior permits full replacement on each user click; edit protection applies to automatic updates. The root-selection acceptance correction remains recorded below.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let users install concise Mosaic guidance for Agents from plugin settings, keep it aligned with plugin updates, and preserve user-maintained files.

**Architecture:** One English Markdown source is distributed through two standard Skill entry points and one custom-directory destination. Pure functions decide paths, generated content, and write conditions. A separate Obsidian file-operation module installs and synchronizes guidance. Settings and plugin lifecycle hooks call this module independently of rendering.

**Tech Stack:** TypeScript, native Web Crypto, Obsidian 1.13.0 settings and file APIs, esbuild text loading, and the existing `node --test` suite and host stubs.

**Spec:** The Scope and behavior contract section records the user requirements without a duplicate design document. The eight English user guides are authoritative for content. Follow [[AGENTS|AGENTS.md]] for maintenance.

**Original implementation status:** Initial implementation and review were completed at `f6ac2c6`. The user then revised the installation UI, default directory, global scope, and required content depth. [[docs/_archive/2026-09-11-import-scope-and-complete-guidance|2026-09-11-import-scope-and-complete-guidance.md]] continued that work. This plan's vault-only scope, concise body, and old button names were superseded implementation requirements. Existing-file protection remained required. Client and platform acceptance still included unverified items; completed code did not mean completed acceptance.

## Global Constraints

> These constraints apply to every task and must accompany subtask handoffs.

- **Processes:** One Mosaic instance per open vault. No cross-process locks or background services.
- **Users:** One local operator per instance. No accounts, permission roles, or team installation management.
- **Frequency:** Run on manual installation and check installed targets once after each plugin load, with at most three targets. No periodic polling or vault traversal.
- **Failure cost:** Preserve the original file and report unavailable guidance without affecting notes, charts, or cards. Overwriting user-authored content is unacceptable data loss.
- **Scope:** The first version uses paths relative to the current Obsidian vault. It does not access global Skill directories, locate parent Git repositories, or offer paths outside the vault.
- **Cross-device behavior:** Do not coordinate concurrent writes by synchronization services. Older plugins must not downgrade guidance associated with a newer installation record.
- **Compatibility baseline:** Keep `minAppVersion: 1.13.0`, `isDesktopOnly: false`, and esbuild `target: es2017`. Add no Node/Electron runtime dependency.
- **Dependencies and build:** Add no dependencies. Reuse existing tests and builds without changing package managers or the three-file release asset set.
- **Source boundaries:** Do not change `src/parse/blocks/`, block syntax, rendering semantics, or the upstream baseline.
- **Language:** Use English sentence case in settings. Distribute one English guidance body, with English and Chinese installation instructions following the user-guide rules.
- **Public content:** Use repository-relative paths and fictional data in this plan, implementation, examples, and acceptance records. Exclude local directories, user notes, and private tool configuration.
- **Delivery:** Implementation is authorized. Commit on a task branch, then merge locally and push main after acceptance under repository rules. Tags and releases are not authorized.

---

## Scope and behavior contract

> The three destinations install this plugin's guidance only, rather than forming a general-purpose Skill manager.

### Naming gate and scope

- The user requested Agents and Claude buttons plus a named guide in a specified directory. Keep two Skill buttons and one custom-directory write button without additional client presets.
- The user proposed `mosaic.md` as the Skill filename. Standard clients require `SKILL.md` as the entry point; `skills/mosaic.md` does not meet their discovery format.
- Use `mosaic` as the recommended Skill and directory name, `src/agent-guide/mosaic.md` as the source, and the standard `SKILL.md` installation entry point.
- Use the recommended fixed custom-directory filename `Mosaic-Usage-Guide.md` and body title `Mosaic Usage Guide`.
- The user confirmed `mosaic/SKILL.md` and required hyphens between words in the custom document filename: `Mosaic-Usage-Guide.md`.
- Vault-local directories define this plan's first-version scope. If the user requests external directories, review platform compatibility, authorization, and public disclosures before revising the plan.

### Installation destinations

- **Agents:** Write `.agents/skills/mosaic/SKILL.md` relative to the vault root.
- **Claude:** Write `.claude/skills/mosaic/SKILL.md` relative to the vault root.
- **Custom directory:** Write `Mosaic-Usage-Guide.md` in the selected vault folder without creating a Skill subdirectory.
- All three destinations contain byte-identical files. Do not maintain three content copies or independent version sequences.
- Maintain both Skills independently if both are installed. Do not change client configuration, create symlinks, or launch an Agent.
- Ordinary custom-directory documents carry no automatic-loading promise. Settings show the actual installation path and reading instructions for the user to give their Agent.
- The client controls session refresh after loading guidance. Successful file writing does not prove that an existing session has reread it.

### Concise content

- Explain how to write notes with Mosaic, without development workflows, repository release rules, internal engineering instructions, or executable scripts.
- Cover use-case selection for all six blocks: Chart, DataTable, MetricGrid, Timeline, DecisionBox, and FlowDiagram.
- Give each type one minimal complete code block with usable attributes and data.
- Recommend code blocks by default. Explain paired and self-closing tag uses and boundaries without repeating every syntax combination.
- Cover supported chart types, required fields, units and series labels, external dataset manifests, relative paths, and aggregation limits.
- State the Reading-view rendering requirement, single-line opening tags, no blank lines inside tag bodies, no same-length nested fences, and no extra nonempty columns alongside numeric data.
- State that Y axes include zero and have no manual bounds. Agents must not invent `yMin` or `yMax`.
- Restrict external data to Chart and DataTable. Do not invent `dataset` support for the other four types.
- Ask for clarification when data is missing or definitions are ambiguous. Do not fabricate user data or aggregation semantics.
- Make the guidance independently readable without the plugin source repository or `docs/` links absent from the user's machine.

### Installation and update states

- Start with no installation records and write no guidance during startup.
- Each manual button controls only its own destination. A failure elsewhere does not undo a successful installation.
- Only manual installation can create a missing file.
- Do not rewrite a file already identical to this version's complete content. Manual installation can register it and recover a record whose previous save failed.
- On first encountering a different same-name file, refuse to overwrite it and ask the user to rename or move it before retrying. Add no force-overwrite button.
- Automatic updates use only fixed paths with installation records. Do not adopt coincidentally existing same-name files.
- Before automatic replacement, calculate the actual file's SHA-256 and require a match with the last successfully installed content hash.
- Preserve the full file after local edits and report `Modified — not updated`. Do not merge text or create automatic backup copies.
- A deleted, renamed, or moved file shows `Not installed` at its original path. Do not search for or recreate it. Retain the record only to identify that path, not to authorize recreation.
- A record from a newer plugin version returns `Newer version — not updated`. Do not write the file or roll back the record.
- Editing the custom folder changes only the candidate destination. Switch its installation record only after another successful manual write. Preserve the old file but stop maintaining it.
- Save the new path, version, and hash only after a successful write. A failed write does not advance the record.
- Restore the in-memory record and show an error if settings cannot be saved. If new content was already written, a later manual operation or automatic check can recover the record by comparing the complete content.
- Update failures affect only the corresponding guidance status. They must not fail plugin loading or prevent block registration.

### Minimal settings UI

- Preserve the existing `Show export button` behavior.
- Add an `Agent skills` row with button labels exactly `Agents` and `Claude`.
- Add a `Guide folder` input, initially empty, supporting the vault root.
- Add a `Usage guide` row with a `Write guide` button.
- Show each destination's installation path and result in setting descriptions. Add no status dashboard or wizard.
- Show one short notice after a successful manual action. Keep background success silent and retain failures in settings state.
- Disable installation buttons while busy. One instance-level `busy` flag prevents overlaps between updates and repeated clicks, without a queue or lock files.
- Use `render` rows returned by `getSettingDefinitions()` with `Setting.addButton()`. Do not restore `display()`.

---

## Files and interfaces

> Separate content, write policy, and host operations while keeping settings and lifecycle entry points thin.

### New files

- `src/agent-guide/mosaic.md`: the single English body, without installation paths or machine information.
- `src/agent-guide/core.mjs`: destination paths, shared file generation, content hashes, and write decisions, without Obsidian dependencies.
- `src/agent-guide/installer.ts`: installation record types, Obsidian file operations, per-target failure isolation, and lifecycle control.
- `src/markdown.d.ts`: declarations for `.md` text imports.
- `tests/agent-guide-content.test.mjs`: extract examples from the source body and validate them through existing parsing and rendering entry points.
- `tests/agent-guide-policy.test.mjs`: paths, generated content, hashes, and update decisions.
- `tests/agent-guide-installation.test.mjs`: actual installer behavior against an in-memory vault.
- `tests/agent-guide-settings.test.mjs`: buttons, folder input, and load wiring.
- `docs/guides/agent-guide.md` and `docs/guides/agent-guide-zh.md`: user instructions for installation, use, automatic updates, and stopping maintenance.

### Modified files

- `esbuild.config.mjs` and `tests/helpers/bundle.mjs`: add `.md` text loading without other compiler changes.
- `src/settings.tsx`: add settings fields and controls for three destinations, preserving the existing toggle branch.
- `src/main.tsx`: create the installer, check installed files after layout readiness, and dispose it on unload.
- `tests/helpers/entry.tsx`: export the installer, settings tab, and plugin class in task order for tests.
- `tests/helpers/obsidian-stub.mjs`: add only the required `Notice`, button, and settings-refresh support, not a full host simulation.
- `docs/design/architecture.md`: explain guidance distribution's separation from rendering and its file-ownership protection.
- `README.md` and `docs/README-zh.md`: link the user guide and disclose local writes without copying the full guidance.
- `AGENTS.md`: record the content source, example-validation command, and new module boundary. Update the test count from actual results.

### Fixed interfaces

```ts
type GuideTarget = 'agents' | 'claude' | 'custom';
type InstallRecord = { path: string; version: string; hash: string };
type GuideInstalls = Partial<Record<GuideTarget, InstallRecord>>;
type GuideStatus = 'installed' | 'updated' | 'unchanged' | 'missing'
  | 'conflict' | 'newer' | 'busy' | 'error';
type GuideResult = {
  target: GuideTarget;
  path: string;
  status: GuideStatus;
  message?: string;
};

// Export from installer.ts for settings.tsx to import the type.
interface GuideHost {
  app: App; // Import the type from obsidian.
  manifest: { version: string };
  settings: { guideFolder: string; guideInstalls: GuideInstalls };
  saveSettings(): Promise<void>;
}

class GuideInstaller {
  constructor(host: GuideHost, body: string);
  busy: boolean;
  results: Partial<Record<GuideTarget, GuideResult>>;
  install(target: GuideTarget): Promise<GuideResult>;
  updateInstalled(): Promise<void>;
  dispose(): void;
}
```

- `core.mjs` exports `guideTargetPath(target, folder)`, `renderGuide(body, version)`, `sha256(text)`, and `decideGuideWrite(input)`. Use JSDoc for string unions and return types.
- `decideGuideWrite` accepts `mode`, `exists`, `currentHash`, `desiredHash`, `installedHash`, `installedVersion`, and `currentVersion`.
- Decisions are `write | unchanged | missing | conflict | not-installed | newer`. Host operations translate errors into `GuideResult`; keep them out of pure functions.
- `dispose()` irreversibly closes the service. Check that flag after each asynchronous read and before writing so an old service cannot resume after the same plugin instance reloads.

---

## Phase 1: English guidance and executable examples

> Task 1 delivers a standalone body and tests that validate its actual examples.

### Task 1 · Content source and bundling

**Files**

- Create: `src/agent-guide/mosaic.md`, `src/markdown.d.ts`, `tests/agent-guide-content.test.mjs`.
- Modify: `esbuild.config.mjs`, `tests/helpers/bundle.mjs`.
- Read: the eight English user guides, especially `chart.md`, `data-table.md`, `dataset-guide.md`, and `tag-syntax.md`, plus the other four block guides.

**Interfaces**

- Consumes: existing `parseBlockSource`, `BLOCK_LANGUAGES`, `createBlockProcessor`, `parseDatasetManifest`, and `parseDatasetData`.
- Produces: an English body without metadata wrapping, plus build support for importing `.md` files as strings.
- Independent of Task 2; both can proceed concurrently without editing the same files. Task 3 waits for both.

- [x] **Step 1 · Write a failing test that reads the actual body.** Extract all six examples from the Markdown file; do not maintain six separate copies in the tests.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseBlockSource } from '../src/parse/block-source.mjs';
import { COMPONENT_NAMES } from '../src/parse/chart-tag.mjs';

test('the shipped guide contains valid examples for every block', () => {
  const body = readFileSync(new URL('../src/agent-guide/mosaic.md', import.meta.url), 'utf8');
  const examples = [...body.matchAll(/^```(chart|datatable|metricgrid|timeline|decisionbox|flowdiagram)\n([\s\S]*?)^```$/gm)];
  assert.deepEqual(
    [...new Set(examples.map(match => match[1]))].sort(),
    COMPONENT_NAMES.map(name => name.toLowerCase()).sort(),
  );
  for (const [, language, source] of examples) {
    const parsed = parseBlockSource(source);
    assert.deepEqual(parsed.unrecognized, [], language);
    assert.ok(Object.keys(parsed.attributes).length > 0, language);
  }
});
```

- [x] **Step 2 · Run the failing test.** `node --test tests/agent-guide-content.test.mjs` must fail because the body file is missing, not because of a test import error.
- [x] **Step 3 · Write the English body.** Use `# Mosaic Usage Guide` as the title. Organize it by use-case selection, syntax, six examples, external data, and troubleshooting. Include no scripts or machine-specific information.
- [x] **Step 4 · Use the following minimal inputs for the six inline examples.** Put each input in a real code fence with the corresponding language; do not distribute this JavaScript array as the content.

```js
const examples = [
  ['chart', '---\ntype: line\nx: month\nseries: amount\ntitle: Monthly output\n---\nmonth,amount\n2026-01,80\n2026-02,120'],
  ['datatable', '---\ntitle: Work items\n---\nitem,amount\nDraft,2\nReview,1'],
  ['metricgrid', '---\ntitle: Key metrics\n---\nlabel,value\nCompleted,12\nRemaining,3'],
  ['timeline', '---\ntitle: Delivery timeline\n---\ndate,title\n2026-01-01,Draft\n2026-02-01,Launch'],
  ['decisionbox', '---\ntitle: Delivery decision\nstatus: accepted\n---\nlabel,value\nChoice,Ship a small first version'],
  ['flowdiagram', '---\ntitle: Delivery flow\n---\n{"nodes":[{"id":"draft","label":"Draft"},{"id":"review","label":"Review"}],"edges":[{"from":"draft","to":"review"}]}'],
];
```

- [x] **Step 5 · Add one complete external-data example.** Use `data/monthly.csv` as the source, `data/monthly.dataset.json` as the manifest, and place the example note at the vault root. Both Chart and DataTable examples use `dataset: data/monthly.dataset.json`, with no inline body.

```json
{
  "schemaVersion": 1,
  "id": "monthly-output",
  "data": "monthly.csv",
  "grain": ["Date"],
  "primaryKey": ["Date"],
  "time": { "field": "Date", "sourceGranularity": "month" },
  "fields": [
    { "name": "Date", "type": "date", "required": true },
    { "name": "Amount", "type": "integer", "rollup": "sum", "required": true }
  ]
}
```

```csv
Date,Amount
2026-01-01,80
2026-02-01,120
```

- [x] **Step 6 · Extend tests to semantics and rendering.** Reuse `tests/helpers/dom.mjs` and `loadComponents()` to pass the six extracted inline inputs through the real `createBlockProcessor`. Assert that `.mosaic-error` is absent and that the respective outputs contain `[data-plot]`, `table`, `.mosaic-metric-item`, `.mosaic-timeline-item`, `.mosaic-decision-list`, and `svg`. Call the captured teardown callback to clean up each test block.
- [x] **Step 7 · Validate the body's dataset manifest.** Extract the single `json` manifest and `csv` dataset from `## External dataset`, call the two existing data parsers, and assert two rows with Amount values of 80 and 120. Do not substitute another hardcoded manifest for the distributed body.
- [x] **Step 8 · Configure text bundling.** Add the same loader to the production and test esbuild configurations. Do not add runtime logic for reading files inside the package.

```ts
// src/markdown.d.ts
declare module '*.md' {
  const text: string;
  export default text;
}
```

```js
// Add the same entry to both esbuild configurations.
loader: { '.md': 'text' },
```

- [x] **Step 9 · Verify and commit this logical unit.** Run the body tests, then `npm test` and `npm run build`. Use `feat: bundle concise agent guidance` as the commit summary, with a body describing standalone guidance and validation of its actual examples. Do not change the version.

---

## Phase 2: Installation policy and file maintenance

> Task 2 delivers an independently testable installation service without depending on settings UI or automatically writing to any real user directory.

### Task 2 · Paths, ownership, and update service

**Files**

- Create: `src/agent-guide/core.mjs`, `src/agent-guide/installer.ts`, `tests/agent-guide-policy.test.mjs`, `tests/agent-guide-installation.test.mjs`.
- Modify: `tests/helpers/entry.tsx`, only to export `GuideInstaller`.
- Read: the path boundaries in `src/parse/vault-path.mjs`. Do not modify it or reuse its Dataset-specific error messages.

**Interfaces**

- Consumes: `GuideHost` and a body string, which tests can supply directly without requiring Task 1's file to exist.
- Produces: the pure functions, types, and `GuideInstaller` listed under Fixed interfaces.

- [x] **Step 1 · Write policy tests first.** Fix the standard directories, custom filename, and behavior that automatic mode never creates missing files.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { guideTargetPath, decideGuideWrite } from '../src/agent-guide/core.mjs';

test('three destinations use the agreed names', () => {
  assert.equal(guideTargetPath('agents', ''), '.agents/skills/mosaic/SKILL.md');
  assert.equal(guideTargetPath('claude', ''), '.claude/skills/mosaic/SKILL.md');
  assert.equal(guideTargetPath('custom', 'Reference'), 'Reference/Mosaic-Usage-Guide.md');
  assert.equal(guideTargetPath('custom', ''), 'Mosaic-Usage-Guide.md');
});

test('automatic updates never recreate a missing guide', () => {
  assert.equal(decideGuideWrite({
    mode: 'auto', exists: false, currentHash: null,
    desiredHash: 'next', installedHash: 'previous',
    installedVersion: '1.1.6', currentVersion: '1.1.7',
  }), 'missing');
});

test('locally edited files are preserved', () => {
  assert.equal(decideGuideWrite({
    mode: 'auto', exists: true, currentHash: 'user-edit',
    desiredHash: 'next', installedHash: 'previous',
    installedVersion: '1.1.6', currentVersion: '1.1.7',
  }), 'conflict');
});
```

- [x] **Step 2 · Run the failing tests.** Run `node --test tests/agent-guide-policy.test.mjs` and confirm failure is caused by the missing implementation.
- [x] **Step 3 · Implement path rules.** First reject absolute paths, drive letters, URL schemes, control characters, `..` segments, and `~` expansion syntax; then normalize separators and redundant `.` segments. Accept an empty folder as the vault root. The host layer must also reject writes to the actual `vault.configDir` and its descendants, rather than hardcoding only `.obsidian`.
- [x] **Step 4 · Implement content generation and hashing.** All three destinations call the same function. Metadata uses the plugin's own version, without a separately incremented Skill version.

```js
export function renderGuide(body, version) {
  return [
    '---',
    'name: mosaic',
    'description: Create and edit Mosaic charts, tables, metric cards, timelines, decision records, and flow diagrams in Obsidian notes.',
    'metadata:',
    `  mosaic-version: "${version}"`,
    '---',
    '',
    '<!-- Managed by Mosaic. Local edits pause automatic updates. Rename or remove this file to stop updates at this path. -->',
    '',
    body.trim(),
    '',
  ].join('\n');
}

export async function sha256(text) {
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
```

- [x] **Step 5 · Apply decisions in a fixed order.** In automatic mode, check the installation record first; return `not-installed` if absent. Return `newer` if the recorded version is newer. If the path is missing, return `write` in manual mode or `missing` in automatic mode. Return `unchanged` if the content matches the desired content. Otherwise, return `write` only when the actual hash matches the recorded hash; return `conflict` if it does not. Compare the three numeric version segments, not lexicographic strings.
- [x] **Step 6 · Implement file operations.** Use `Vault.create` / `Vault.process` for ordinary visible Markdown files. Use `app.vault.adapter` for Skill files or custom documents with hidden path segments: `write` for the first manual creation, and its native `process` for existing files. Create parent folders one level at a time with the corresponding interface; do not use `getFiles()` to find hidden files.
- [x] **Step 7 · Enforce read/write protection at the actual write.** The synchronous callbacks for both `Vault.process` and `DataAdapter.process` must confirm that the current text still matches the text checked earlier; throw a conflict otherwise. Automatic mode must not fall back to `write` for a missing file. Report an error if the target is a folder or a parent path is a file; do not remove user paths. Do not implement temporary-file replacement, backup directories, or a second atomic-write mechanism.
- [x] **Step 8 · Manage operation state.** Hold one `busy` flag per operation and release it in `finally`. Within one operation, `updateInstalled()` processes each target in turn and continues checking the others after a target fails. Return immediately without file access when no records exist.
- [x] **Step 9 · Manage records.** During service construction, validate only the added fields: the target must be one of the three known keys, the path must follow that target's rules, the version must have three numeric segments, and the hash must contain 64 hexadecimal characters. Reset an invalid `guideFolder` to an empty string and exclude invalid records from automatic writes. Preserve the old `showExportBtn` value without refactoring all settings loading.
- [x] **Step 10 · Save after writing.** Create the record `{path, version: host.manifest.version, hash: desiredHash}`, replace the corresponding destination's record, and `await host.saveSettings()`. On failure, restore the old in-memory record and return a result with an English error message. Do not delete the written file or roll back by deleting data.
- [x] **Step 11 · Test actual service calls.** Export `GuideInstaller` through the existing test bundle entry. Use a Map in this test file to build a vault stub that records every creation, read, write, and settings save. Do not create a permanent filesystem simulation framework.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { installGlobals } from './helpers/dom.mjs';
import { loadComponents } from './helpers/bundle.mjs';

installGlobals();
const { GuideInstaller, TFile } = await loadComponents();

test('only explicit installation creates a guide', async () => {
  const files = new Map();
  const folders = new Set(['']);
  const stats = { fileReads: 0, fileWrites: 0, settingsSaves: 0 };
  const parent = path => path.split('/').slice(0, -1).join('/');
  const fileAt = path => files.has(path) ? Object.assign(new TFile(), { path }) : null;
  const adapter = {
    async stat(path) {
      stats.fileReads++;
      const type = files.has(path) ? 'file' : folders.has(path) ? 'folder' : null;
      return type ? { type, size: 0, ctime: 0, mtime: 0 } : null;
    },
    async read(path) {
      stats.fileReads++;
      if (!files.has(path)) throw new Error('File not found');
      return files.get(path);
    },
    async mkdir(path) {
      assert.ok(folders.has(parent(path)));
      folders.add(path);
    },
    async write(path, value) {
      assert.ok(folders.has(parent(path)));
      files.set(path, value);
      stats.fileWrites++;
    },
    async process(path, fn) {
      const next = fn(await this.read(path));
      await this.write(path, next);
      return next;
    },
  };
  const vault = {
    adapter, configDir: '.obsidian', getFileByPath: fileAt,
    getFolderByPath: path => folders.has(path) ? { path } : null,
    getRoot: () => ({ path: '' }),
    read: file => adapter.read(file.path),
    process: (file, fn) => adapter.process(file.path, fn),
    createFolder: path => adapter.mkdir(path),
    async create(path, value) {
      assert.equal(files.has(path), false);
      await adapter.write(path, value);
      return fileAt(path);
    },
  };
  const host = {
    app: { vault }, manifest: { version: '1.1.6' },
    settings: { guideFolder: '', guideInstalls: {} },
    async saveSettings() { stats.settingsSaves++; },
  };
  const installer = new GuideInstaller(host, '# Mosaic Usage Guide\n');
  await installer.updateInstalled();
  assert.equal(stats.fileReads, 0);
  assert.equal(stats.fileWrites, 0);
  const result = await installer.install('agents');
  assert.equal(result.status, 'installed');
  assert.equal(result.path, '.agents/skills/mosaic/SKILL.md');
  const writes = stats.fileWrites;
  await installer.updateInstalled();
  assert.equal(stats.fileWrites, writes);
  assert.match(host.settings.guideInstalls.agents.hash, /^[a-f0-9]{64}$/);
});
```

- [x] **Step 12 · Cover maintenance boundaries.** Write one behavior test each for first installation, repeated clicks, updates to a newer version, an existing same-name file, body edits, renaming/deletion, a newer record, one destination failing to write, settings-save failure, successful/failed directory changes, and interruption during unload. Assert that actual file contents and old records remain intact, not just status messages.
- [x] **Step 13 · Verify and commit.** Run `node --test tests/agent-guide-policy.test.mjs tests/agent-guide-installation.test.mjs`, then `npm test` and `npm run build`. Use `feat: manage installed agent guidance` as the commit summary, with a body explaining explicit installation, update protection, and failure isolation.

---

## Phase 3: Settings and plugin lifecycle

> Task 3 connects the verified content and installation service to the plugin without changing the existing rendering startup order.

### Task 3 · Buttons, folders, and load wiring

**Files**

- Modify: `src/settings.tsx`, `src/main.tsx`, `tests/helpers/entry.tsx`, `tests/helpers/obsidian-stub.mjs`.
- Create: `tests/agent-guide-settings.test.mjs`.
- Read: the four policies in `docs/policies/` and the Obsidian types `SettingDefinitionRender`, `SettingFolderControl`, and `PluginSettingTab.update`.

**Interfaces**

- Consumes: Task 1's Markdown string import and Task 2's `GuideInstaller` / `GuideInstalls` / `GuideTarget`.
- Produces: `MosaicPlugin.guideInstaller`, `guideFolder: string`, `guideInstalls: GuideInstalls`, and settings actions.
- Depends on completion of Tasks 1 and 2; do not edit shared test files concurrently with those tasks.

- [x] **Step 1 · Write a failing test for the actual settings definitions.** Export `MosaicSettingTab` through the test bundle entry, call `getSettingDefinitions()`, and invoke the returned rows' `render` callbacks. Use a `Setting` stub that records button text and callbacks to click the buttons and assert the correct target calls.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { installGlobals } from './helpers/dom.mjs';
import { loadComponents } from './helpers/bundle.mjs';
import { guideTargetPath } from '../src/agent-guide/core.mjs';

installGlobals();
const { MosaicSettingTab } = await loadComponents();

test('install buttons target the correct client without rebuilding notes', async () => {
  const installerCalls = [];
  let previewRebuilds = 0;
  const plugin = {
    settings: { showExportBtn: false, guideFolder: '', guideInstalls: {} },
    guideInstaller: {
      busy: false, results: {},
      async install(target) {
        installerCalls.push(target);
        return { target, path: guideTargetPath(target, ''), status: 'installed' };
      },
    },
    async saveSettings() {},
    rerenderOpenPreviews() { previewRebuilds++; },
  };
  const tab = new MosaicSettingTab({}, plugin);
  const buttons = [];
  const row = {
    addButton(configure) {
      const button = {
        setButtonText(text) { this.text = text; return this; },
        setDisabled(disabled) { this.disabled = disabled; return this; },
        onClick(click) { this.click = click; return this; },
      };
      configure(button);
      buttons.push(button);
      return this;
    },
  };
  tab.getSettingDefinitions().find(item => item.name === 'Agent skills').render(row, null);
  assert.deepEqual(buttons.map(button => button.text), ['Agents', 'Claude']);
  await buttons[0].click();
  await buttons[1].click();
  assert.deepEqual(installerCalls, ['agents', 'claude']);
  await tab.setControlValue('guideFolder', 'Reference');
  assert.equal(plugin.settings.guideFolder, 'Reference');
  assert.equal(previewRebuilds, 0);
  await tab.setControlValue('showExportBtn', true);
  assert.equal(previewRebuilds, 1);
});
```

- [x] **Step 2 · Run the failing test.** Run `node --test tests/agent-guide-settings.test.mjs` and confirm failure is caused by the missing new fields or controls.
- [x] **Step 3 · Add settings fields.** Default to `guideFolder: ''` and `guideInstalls: {}`, creating a separate installation-record object for each instance. Loading older settings containing only `showExportBtn` must succeed.
- [x] **Step 4 · Connect declarative buttons and the folder input.** Add `installAndRefresh(target)` to `MosaicSettingTab`: call the service, show one result notice, refresh settings state, and catch errors. This method must not rebuild note previews.

```ts
{
  name: 'Agent skills',
  desc: 'Install Mosaic guidance in this vault. Unmodified installed files follow plugin updates.',
  render: setting => {
    setting.addButton(button => button.setButtonText('Agents')
      .setDisabled(this.plugin.guideInstaller.busy)
      .onClick(() => this.installAndRefresh('agents')));
    setting.addButton(button => button.setButtonText('Claude')
      .setDisabled(this.plugin.guideInstaller.busy)
      .onClick(() => this.installAndRefresh('claude')));
  },
},
{
  name: 'Guide folder',
  desc: 'Choose a folder in this vault for Mosaic-Usage-Guide.md.',
  control: { type: 'folder', key: 'guideFolder', defaultValue: '', includeRoot: true },
},
{
  name: 'Usage guide',
  desc: 'Write the same guidance as a document for your agent to read.',
  render: setting => {
    setting.addButton(button => button.setButtonText('Write guide')
      .setDisabled(this.plugin.guideInstaller.busy)
      .onClick(() => this.installAndRefresh('custom')));
  },
},
```

- [x] **Step 5 · Show status.** Generate settings descriptions from the service's `results` and saved records; refresh the UI when each button operation starts and ends. Successful installation shows the relative file path without claiming that an Agent has loaded it. Use `Ask your agent to read this file before creating Mosaic content.` for the custom-document hint.
- [x] **Step 6 · Connect loading and unloading.** Bundle the Markdown text statically in the release. The service must not read extra resources from the plugin directory at startup.

```ts
import guideBody from './agent-guide/mosaic.md';
import { GuideInstaller } from './agent-guide/installer';

// After loadSettings(), before registering settings, capture this load's service:
const guideInstaller = new GuideInstaller(this, guideBody);
this.guideInstaller = guideInstaller;

// In the existing onLayoutReady callback, retain the preview rebuild, then append:
void guideInstaller.updateInstalled();

// At the start of onunload(), before other cleanup:
this.guideInstaller?.dispose();
```

- [x] **Step 7 · Test the wiring.** Call `onload()` using the plugin class and a minimal host stub. Capture the layout callback and prove that guidance is not checked before layout readiness, is checked exactly once afterward, and existing block registration still occurs. After calling `onunload()`, prove that the old service starts no further writes.
- [x] **Step 8 · Verify and commit.** Once the new settings tests pass, run `npm test` and `npm run build`. Confirm that `.md` content is included in `main.js` without a fourth release asset. Use `feat: add agent guide install controls` as the commit summary.

---

## Phase 4: User documentation and acceptance

> Task 4 validates actual usability and delivery completeness. Parsing tests do not substitute for client discovery tests.

### Task 4 · Documentation, host, and client validation

**Files**

- Create: `docs/guides/agent-guide.md`, `docs/guides/agent-guide-zh.md`.
- Modify: `README.md`, `docs/README-zh.md`, `docs/design/architecture.md`, `AGENTS.md`.
- Test: the four test files above and an independent test vault; do not use the user's everyday vault.

**Interfaces**

- Consumes: the complete installation flow and stable filenames from Tasks 1–3.
- Produces: user guides, host acceptance records, actual test counts, and completion status.

- [x] **Step 1 · Write user instructions.** Write English first, then the Chinese mirror. Explain the three destinations, vault-local scope, automatic update timing, edits pausing updates, no recreation after renaming/deletion, and retries after settings-save failure.
- [x] **Step 2 · Add minimal design rationale.** Extend the overall design with guidance distribution's separation from rendering, one body for three destinations, and why updates verify then replace rather than merge. Do not repeat user procedures.
- [x] **Step 3 · Update project entry points.** Add the new guide link to both README versions. Disclose that only user-selected, fixed files in the current vault are written, with no new network access or telemetry. Record the source location and content-test requirement in AGENTS without adding another source-mapping table.
- [x] **Step 4 · Verify both languages and source.** Compare paths, button labels, and example bytes in both user guides. Confirm that there is only one maintained body and no second generation implementation.
- [x] **Step 5 · Validate all three destinations in an independent test vault.** Click Agents, Claude, and Write guide separately; check actual files, status, repeated clicks, and content-based protection. Keep both installations after installing Agents and Claude; do not automatically remove either.
- [x] **Step 6 · Validate upgrades and removal.** In the test vault, use fixtures to generate guidance for an older version and a valid installation record, then load the current build and confirm that unmodified files update. Do not require a nonexistent older plugin to support installation. Edit, rename, and delete files separately, then reload the plugin and confirm that files are neither overwritten nor recreated. Make one directory unwritable and confirm that another target can still update and charts still work.
- [ ] **Step 7 · Validate discovery in real clients.** Start new Codex and Claude Code sessions at the test vault root. Confirm separately that the `mosaic` Skill is discovered and can be invoked explicitly. Record unavailable clients or missing login as unverified; file existence does not establish success.
- [x] **Step 8 · Validate guidance usability.** Give each available client only this guidance and the same fictional dataset, then ask it to generate all six block types. Run existing parsing/rendering checks on the output, checking for unknown attributes, error boxes, and fabricated fields. Use fictional data for acceptance; do not upload user notes.
- [ ] **Step 9 · Validate custom-document mode.** Give a test session the explicit path to `Mosaic-Usage-Guide.md` and confirm that it can generate valid blocks without the development repository. Do not report this as automatic discovery.
- [x] **Step 10 · Run all required checks.** Run `npm test` and `npm run build`; confirm that `main.js` remains below 1,843,200 bytes. Keep existing Node 22 / 24 CI passing without adding a separate pipeline.
- [x] **Step 11 · Record platform coverage accurately.** List executed tests separately for Linux, macOS, Windows, and mobile. Do not mark untested platforms as passing or claim mobile validation solely from `isDesktopOnly: false`.
- [ ] **Step 12 · Commit documentation and run a full review.** Use `docs: explain agent guide installation` as the documentation commit summary, then run review, fix actual issues, and retest. Archive this plan afterward, recording the final commit and corrected design decisions.

  Documentation was committed, and the full review plus fix verification passed. At that checkpoint, archival was left pending because client and platform checks remained unverified. The later archival disposition is recorded at the top of this document.

---

## Completion criteria and handoff

> The feature is complete only when installations are discoverable, the content is usable, and updates preserve user files.

- The user has confirmed naming, and final paths match button descriptions.
- Startup for users without installations neither accesses guidance files nor creates directories.
- All three destinations contain identical content; repeated installation and same-version reloads do not repeat writes.
- Behavior tests cover automatic version updates, edit protection, no recreation of missing files, and failure isolation.
- The six minimal examples and complete dataset manifest come from the distributed body and pass semantic validation.
- Actual client discovery and guidance-use acceptance results are recorded separately from unit tests.
- The module adds no network requests, script execution, global-directory writes, dependencies, or rendering-pipeline changes.
- The full test suite, production build, and bundle-size check pass; both user-guide languages are complete.
- Suggested execution order: Tasks 1 and 2 may run concurrently; Task 3 waits for both, and Task 4 waits for the complete feature.
- Delivery options: execute the tasks in this session, or prepare a prompt for another Agent. Use this plan as the implementation basis without copying its implementation details into the handoff.
- Before handing off to another machine, commit and push the branch containing this plan. Include the repository, branch, actual commit, and plan path in the prompt; do not invent a commit that does not yet exist.
- The execution prompt must require reading AGENTS, reviewing and fixing the completed plan's implementation, retesting, then handling commits under the ship workflow. This repository defaults to local merge and push to main without a PR; create a PR only if the user explicitly switches to that workflow.
- This plan does not authorize a release. Tags and releases still require an explicit user request.

---

## Verification basis

> External format requirements and local interfaces have been checked. Before implementation, recheck only what has actually changed.

- Code baseline: `7a3b6ce598187419f73473f29a1dd6a1edd5ac8b`, plugin version `1.1.6`.
- `src/settings.tsx` uses `getSettingDefinitions()` and has no guidance-installation fields or controls yet.
- `src/main.tsx` already has settings-loading, layout-ready, and unload entry points, allowing incremental integration without lifecycle refactoring.
- Installed Obsidian types include `SettingDefinitionRender.render` and `SettingFolderControl.includeRoot`, both marked available since 1.13.0.
- The installed Obsidian type for `DataAdapter.process` provides an atomic read-modify-save callback, suitable for update checks on hidden files without a custom atomic-write protocol.
- Reuse `tests/helpers/bundle.mjs`, `tests/helpers/entry.tsx`, and the host stubs; no new test dependency is needed.
- [Codex Skill format and directories](https://learn.chatgpt.com/docs/build-skills): Skills use `SKILL.md`, with `.agents/skills` as the project directory.
- [Claude Code Skill format and directories](https://code.claude.com/docs/en/skills): The project directory is `.claude/skills`, with `SKILL.md` as the entry point.
- External documentation in this section was verified on 2026-09-10. Client discovery support is subject to real-client acceptance.

---

## Implementation acceptance (2026-09-11)

> Code, host operations, and client discovery are recorded separately. Unexecuted checks do not count as passing.
> Review correction on 2026-09-14: The earlier claim below that vault-root selection passed does not prove that importing into the native root directory worked. The current host represents the root as `/`; the old settings did not convert this to an empty string, causing imports to fail. Conversion was added at the settings boundary and revalidated through real-host reproduction and regression tests. The old record is retained to document the overturned acceptance conclusion.

- **Implemented:** Three installation destinations, one English body, automatic maintenance based on content hashes, declarative settings and unload control, and English/Chinese user instructions.
- **Naming:** `mosaic/SKILL.md` is the Skill entry; the ordinary document uses the fixed filename `Mosaic-Usage-Guide.md`.
- **Phase reviews:** The body, installation service, and settings integration each passed independent review after necessary fixes.
- **Final review:** The only significant finding was missing usage contracts required by the plan. This was fixed in `5686d93` and confirmed through focused rereview; no unresolved code blockers remain.
- **Fixes:** Invalid folders produce displayable error results; installation-record saves do not start after unload; an unused settings index signature was removed; errors include the operation, target path, and cause.
- **Local validation:** Node 26.8.2; 387 tests passed; production build passed; bundle size was 1,673,515 bytes, below the 1,843,200-byte limit.
- **Real host:** Linux, Obsidian 1.13.7. Passed checks covered three visible buttons, the native folder input and vault-root selection, no rewrites on repeated clicks, older guidance updating on reload, edit protection, no recreation after renaming/deletion, Unicode directories, and isolation of real permission errors.
- **Actual rendering:** Codex generated all six block types from the installed guidance. Both `.md` and `.mdx` displayed one chart and the other five content types, without error boxes or field warnings.
- **Codex:** Version 0.154.0 returned `mosaic` in its Skill list, enabled at repository scope. All six block types generated through `$mosaic` invocation passed parsing and rendering validation.
- **Final body regression:** Commit `5686d93` added chart types, units and series labels, the zero baseline and prohibition on manual bounds, self-closing tag uses, extra-column restrictions, and the requirement to ask about missing data first. Body tests added required-rule checks and assertions against unknown-attribute warnings during real rendering. After host reload, all three destinations automatically updated to byte-identical new content. A new Codex session correctly rejected a manual `80–200` axis range and generated a valid chart with `unit` and `amountLabel`, without errors or warnings.
- **Ordinary document content:** The actual installed document was attached to a new session, whose generated chart passed parsing and rendering validation. This does not establish that reading by path passed.
- **Unverified:** Claude Code 2.1.267 was not logged in; discovery and actual invocation remain unverified.
- **Unverified:** Client reading of the ordinary document by path was blocked by an execution-environment permission error. Subprocess privileges were not elevated to bypass it.
- **Unverified:** Actual execution on macOS, Windows, and mobile. Retaining the mobile compatibility declaration does not establish mobile acceptance.
- **CI:** The [Node 22 / 24 checks](https://github.com/GilbertzzzZZ/obsidian-mosaic/actions/runs/34586254898) for final code-fix commit `5686d93` passed locked installation, tests, and build; the Node 24 bundle-size check passed. Existing push checks revalidate delivery to main.
- **Release:** No version change, tag, or release in this iteration.

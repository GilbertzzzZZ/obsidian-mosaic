# Guidance Follow Toggles Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans after the user approves this plan. Steps use checkbox syntax for tracking. This is a fresh configuration contract, with no legacy migration or compatibility layer.

**Goal:** Replace one-shot import buttons with persistent destination switches that import immediately when enabled and overwrite the complete guidance after plugin updates, regardless of local edits.

**Architecture:** Keep the existing guidance renderer, installer, desktop adapter, and declarative settings. Replace content-ownership records with enabled destinations and their last successfully applied plugin version. Remove checksums and edit comparisons without weakening destination or platform restrictions.

**Tech Stack:** Existing TypeScript, Obsidian settings/Vault/Adapter APIs, desktop-gated Node/Electron modules, esbuild, and node:test. No new runtime dependencies.

**Spec:** The User contract section below records the user's explicit requirements, including the decision to start all destinations off without interpreting old import records. This document is the sole implementation plan.

**Status:** Implemented and reviewed on `codex/import-follow-plan`, 2026-09-15. Implementation and documentation commit: `f5f6fd47b2710e4b88b3512080ee11b518d66eae`. Baseline: `f053c202acad2a375c5af4afa3a5dfc4b95b3c3d`; plugin remains `1.2.4`. Physical macOS, Windows and mobile acceptance remains unverified; see the execution record below.

## Global Constraints

> Keep the change confined to guidance management and the reported review warning.

- Processes: one plugin instance per open vault. Several vaults can address the same global file; do not add cross-process locks, a daemon, or a shared global settings service.
- Users: one local operator per instance. No accounts, team permissions, or Agent launch.
- Frequency: immediate write on an off-to-on transition; one check after layout readiness per plugin load. Only enabled destinations whose applied version differs from the running version, or whose last write is pending, are written automatically.
- Failure cost: replacing edits in an enabled destination is intended. Writing outside the selected destination, writing after a persisted off state, or truncating a file on failed replacement is not intended.
- Fresh installations: all destination switches start off. The default scope remains Current vault. Default overwrite refers to the behavior after opt-in, not automatic enrollment of every user.
- Treat introduction of this feature as a fresh start. Do not inspect, migrate, infer enablement from, or fall back to old import records. Persist state only in the newly named settings contract.
- Keep `minAppVersion: 1.13.0`, `isDesktopOnly: false`, Node `>=22`, and esbuild `target: es2017`.
- Global operations require `Platform.isDesktopApp && !Platform.isMobile` and the existing desktop-loading guards. Guides remain vault-local.
- Keep one English authoring source in `src/agent-guide/mosaic.md`; do not copy the body into other docs.
- English documentation is authoritative. Only user-facing `-zh.md` documents receive Chinese translations. Keep technical terms such as Agent natural and consistent.
- Do not change chart/card rendering, parsers, dependencies, upstream provenance, or plugin version in this task.
- Use relative paths and fictional examples in repository documents. Test-vault paths come from `MOSAIC_PLUGIN_DIR`, never a committed machine path.
- Planning does not authorize implementation, commit/push, a PR, a tag, or release. After implementation is authorized, follow repository delivery rules and obtain release authorization separately.

---

## User contract

> An enabled destination is managed by Mosaic; an off destination is not updated by Mosaic.

### Required behavior

- Replace the `.agents`, `.claude`, custom Skill, and ordinary guide import actions with individual on/off switches.
- Off → on: immediately create or replace the entire destination with the bundled guidance, including any existing edits or unrelated same-name content.
- Plugin version changes while on: create or replace the entire destination with that plugin's bundled guidance. Do not inspect whether a user or Agent edited it.
- On → off: persist the off state and retain the file. Do not read, rewrite, delete, or rename it as part of disabling.
- Off → on again: overwrite immediately, even within the same plugin version.
- Remove stored content hashes, ownership checks, edit-conflict decisions, and the old manual/automatic overwrite distinction.
- Do not merge text, preserve an edited section, make backup copies, or ask for confirmation on every overwrite.
- Show the new semantics in the settings description before the user enables a destination.

### Trigger details

- Store the last successfully written plugin version only to decide whether another automatic write is due. This is not a content checksum or an edit-protection mechanism.
- Reopening an unchanged plugin version does not repeatedly rewrite a successfully updated file.
- A failed enabled write remains pending and retries on the next plugin load. Turning the switch off cancels future retries.
- A deleted or renamed file does not disable the switch. The original destination is recreated on the next plugin-version update or off-to-on transition; a renamed copy is left alone.
- A manually installed file without a subscription remains unmanaged until the user enables its switch.
- Version comparison is equality only. If a user deliberately installs a different plugin version, enabled guidance follows that running version; remove the old newer-guide downgrade protection.
- Changing Current vault / Global only changes the displayed settings scope. It does not enable or disable destinations in either scope.
- Disabling a global destination in one vault stops that vault's updates. Another vault with the same destination enabled can still write it. Document this boundary; do not add cross-vault coordination.

### Folder and duplicate-path behavior

- Preserve `.agents/skills`, `docs/guides`, home shorthand, native desktop folder selection, and the mobile vault-folder selector.
- Disable a custom folder field while its destination is enabled. The user turns it off, selects a new folder, then turns it on. The old file stays in place and is no longer updated by that custom target.
- Scope changes and folder selection perform no guidance writes.
- The default custom Skill path is the same file as the standard `.agents` destination. Resolve these rows to the same stored target and show the same switch value; disabling either must disable management of that file in that scope.
- Apply the same alias rule when the custom Skill folder resolves to the standard `.claude` destination. Normalize separators and respect Windows path casing for desktop comparisons.
- Deduplicate these aliases before automatic updates. Do not maintain competing records or perform duplicate writes for the same resolved destination within one scope.

### Fresh configuration, no compatibility layer

- Use a new `guideSubscriptions` settings field for vault destinations and a new `mosaic:guide-subscriptions` local-storage key for desktop Global destinations.
- An absent new configuration means all destinations are off. After the user enables or disables a destination, persist and reload that explicit state normally.
- Do not read `guideInstalls` or `mosaic:guide-imports`, inspect old files, convert old hashes, preserve historical enrollment, or add a migration notice.
- Remove legacy record parsers and fallback branches from the installer. Do not build migration scripts, schema-version machinery, or old-version compatibility tests.
- Existing files remain untouched until a switch is enabled. Existing non-import plugin settings, such as the export toggle, retain their normal behavior.
- Validate only the new configuration and selected destination paths. Normal path and platform restrictions remain in effect.

---

## Review findings and disposition

> Fix the actual callback contract and retain narrowly scoped capabilities that the product still requires.

- **Promise-returning override:** `src/settings.tsx` implements `VaultFolderModal.onChooseSuggestion` as `async`, while the installed Obsidian declaration returns `void`. Replace the override with a synchronous method that explicitly handles the save promise. Do not disable the lint rule. The official [no-misused-promises rule](https://typescript-eslint.io/rules/no-misused-promises/#checksvoidreturn) checks inherited methods with this mismatch.
- **Direct filesystem access:** Global Skill writes require desktop filesystem access. Keep it limited to enabled, validated Skill destinations. Remove guidance-content reads made only for edit detection. Keep path checks, regular-file/symlink checks, temporary sibling replacement, and cleanup. The behavior warning can remain; do not obscure imports to hide it.
- **Clipboard access:** Retain click-triggered, write-only copying. Do not add clipboard reads. Keep the existing README disclosure and verify the existing behavior rather than refactoring it.
- **Disclosure:** Update the README and user guide to state that enabled global destinations are overwritten after plugin updates and that switching them off stops that vault's updates. External access must be disclosed under the [Obsidian developer policies](https://docs.obsidian.md/Developer+policies).
- Do not add an ESLint toolchain to project dependencies or the release build. Check the callback rule using the community review environment or an isolated compatible lint environment; report it as unverified until that check has actually run.

---

## Implementation map

> Reuse existing modules and test fixtures; add no generic synchronization layer.

- `src/agent-guide/core.mjs`: paths, guide rendering, and the small enabled/version scheduling decision. Remove SHA-256 and ownership decisions.
- `src/agent-guide/installer.ts`: new persisted state, alias resolution, toggling, update scheduling, and per-destination results.
- `src/agent-guide/desktop.ts`: desktop-only file replacement without content comparisons.
- `src/settings.tsx`: destination switches, folder-field state, error feedback, and the synchronous suggestion callback.
- `src/main.tsx`: persisted-setting normalization and the existing one-shot layout-ready update hook.
- `styles.css`: only adjustments required to align native toggles in existing destination rows.
- `tests/agent-guide-policy.test.mjs`, `tests/agent-guide-installation.test.mjs`, `tests/agent-guide-desktop.test.mjs`, `tests/agent-guide-settings.test.mjs`: replace obsolete assertions and cover the new contract.
- `README.md`, `docs/README-zh.md`, `docs/guides/agent-guide.md`, `docs/guides/agent-guide-zh.md`: usage, installation prompt, overwrite policy, and disclosures.
- `docs/design/architecture.md`: a short rationale section for enabled-target management, version-only scheduling, and platform boundaries. Keep properties and operational instructions in the user guide; do not create another design document.
- `AGENTS.md`: record the guidance-state contract and update the verified test count after implementation.

---

## Task 1: Enabled destinations, writes, and settings

> Deliver the installer and its settings callers as one tested change, with fresh default-off configuration.

### Interfaces

- Keep `GuideScope`, `GuideTarget`, and the separation between vault plugin data and device-local Global data.
- Replace `InstallRecord` and `GuideInstalls` with the new interfaces below. `appliedPluginVersion` is absent while a write is pending, and is written only after successful file replacement.

```ts
export type GuideSubscription = {
  path: string;
  enabled: boolean;
  appliedPluginVersion?: string;
};
export type GuideSubscriptions = Partial<Record<GuideTarget, GuideSubscription>>;

// MosaicPluginSettings and GuideHost.settings
guideSubscriptions: GuideSubscriptions;

// Global state, stored only under mosaic:guide-subscriptions
type LocalState = {
  global: boolean;
  skillFolder?: string;
  subscriptions: GuideSubscriptions;
};

// GuideInstaller public methods
getEnabled(target: GuideTarget, scope?: GuideScope): boolean;
setEnabled(target: GuideTarget, enabled: boolean, scope?: GuideScope): Promise<GuideResult>;
updateInstalled(): Promise<void>;

// desktop.ts replacement signature
writeDesktopFile(path: string, desired: string, assertActive: () => void): Promise<void>;
```

- Add `disabled` to result statuses. Remove ownership-only `conflict`, `newer`, and `missing` results. Retain `installed`, `updated`, `unchanged`, `busy`, and `error` where needed by callers.
- Keep helpers private to the installer unless pure-policy tests need them. Resolve a custom Skill path matching `.agents` or `.claude` to that standard storage key before reading or changing enabled state.

### Steps

- [x] Add `shouldUpdateGuide` to the core-module import in `tests/agent-guide-policy.test.mjs` and add the version-only tests below, replacing the old hash/ownership tests. Keep path-validation tests.

```js
test("automatic writes depend on enabled state and applied version only", () => {
  assert.equal(shouldUpdateGuide(undefined, "1.2.5"), false);
  assert.equal(shouldUpdateGuide({ enabled: false }, "1.2.5"), false);
  assert.equal(shouldUpdateGuide({ enabled: true }, "1.2.5"), true);
  assert.equal(shouldUpdateGuide({ enabled: true, appliedPluginVersion: "1.2.4" }, "1.2.5"), true);
  assert.equal(shouldUpdateGuide({ enabled: true, appliedPluginVersion: "1.2.5" }, "1.2.5"), false);
  assert.equal(shouldUpdateGuide({ enabled: true, appliedPluginVersion: "1.2.6" }, "1.2.5"), true);
});
```

- [x] Run `node --test tests/agent-guide-policy.test.mjs` and record the expected failure before implementation.
- [x] Replace `decideGuideWrite`, `compareVersions`, and `sha256` with the scheduling helper below. Remove their imports and hash fixtures throughout the import tests. Keep unrelated hashing elsewhere untouched.

```js
/**
 * @param {{ enabled: boolean, appliedPluginVersion?: string } | undefined} record
 * @param {string} version
 * @returns {boolean}
 */
export function shouldUpdateGuide(record, version) {
  return record?.enabled === true && record.appliedPluginVersion !== version;
}
```

- [x] Change the existing `createHost()` fixture and desktop fixture to initialize `guideSubscriptions` rather than `guideInstalls`. Add installer tests for all four destination types. This representative test must fail against the old implementation:

```js
test("enabled guidance overwrites edits after a plugin update", async () => {
  const { host, files, stats } = createHost();
  const installer = new GuideInstaller(host, "# Original");
  const first = await installer.setEnabled("claude", true);
  files.set(first.path, "# User or Agent edit");
  host.manifest.version = "1.1.7";
  const upgraded = new GuideInstaller(host, "# Updated");
  await upgraded.updateInstalled();
  assert.equal(files.get(first.path), renderGuide("# Updated", "1.1.7"));
  const writes = stats.fileWrites;
  await upgraded.setEnabled("claude", false);
  host.manifest.version = "1.1.8";
  await new GuideInstaller(host, "# Later").updateInstalled();
  assert.equal(stats.fileWrites, writes);
  assert.equal(files.get(first.path), renderGuide("# Updated", "1.1.7"));
  assert.equal("hash" in host.settings.guideSubscriptions.claude, false);
});
```

- [x] Run the installation test file and record the expected failure. Implement `setEnabled` in this order: validate and resolve destination, acquire the existing busy flag, and save the requested state. Off returns without destination I/O. On saves one pending record without `appliedPluginVersion`, replaces the complete file, and then saves the successful version. Always release busy in `finally`.
- [x] Make persistence failures observable: if saving the requested state fails, restore the prior in-memory state and do not write the destination. If the file write fails after enrollment, retain on/pending and report an error. If saving the success version fails after writing, retain pending and report an error rather than claiming full success.
- [x] Replace the old settings field and local-storage key with `guideSubscriptions` and `mosaic:guide-subscriptions`. Initialize them independently to empty maps. Read only the new keys and retain explicit boolean state after the user changes a switch. Remove old parsing and migration tests instead of adapting them.
- [x] Update `updateInstalled()` to enumerate enabled due records only, resolve aliases once, write independently, and continue after a destination failure. Do not read file contents or parse generated frontmatter to decide whether to write. A changed file is replaced, and a missing file is created, when the version-triggered write is due.
- [x] Remove the current-content equality callback from vault updates. Keep `vault.process(file, () => desired)` for visible files and `adapter.process(path, () => desired)` for hidden paths. Keep parent creation, config-directory restrictions, busy state, and unload guards.
- [x] Remove `readDesktopFile` and `expected`-content comparisons from desktop replacement. Validate final-file type without reading its text; write a complete temporary sibling, close it, then rename it over the target. Retain symlink rejection, temporary-file cleanup, and the final pre-write unload check. Random temporary filenames are not content checksums and may keep their existing generation mechanism.
- [x] In `renderGuide`, replace the old ownership comment with `<!-- Managed by Mosaic while its import switch is on. Plugin updates replace this entire file. -->`. Keep the authoring body and version metadata intact.
- [x] Add equivalent real-temporary-directory tests for Global `.agents`, `.claude`, and custom Skill writes. Cover edited-file overwrite, creation after deletion on a new version, disabled no-read/no-write, file-write failure, failed settings persistence, reload, mobile rejection, symlink rejection, and temporary-file cleanup.
- [x] Replace obsolete tests that assert edits pause updates, deleted files stay missing while enabled, identical manual imports, or newer-version protection. Do not leave them skipped. Retain tests for invalid paths, permission failures, isolation, and unload.
- [x] Verify duplicate-path rows resolve to one record and one physical write. Turning off either alias disables both rows. Preserve a distinct custom destination independently of standard destinations.
- [x] Run the policy, installation, and desktop tests. Continue directly into the settings integration below before the full-suite/build gate or commit; do not retain the old API or add compatibility wrappers merely to split this change.

### Settings and callback integration

> Make state visible without adding another overwrite option or a second action button.

**Settings contract**

- Keep native groups `Import skill` and `Import guides to this vault (optional)`.
- Keep the Current vault / Global scope selector and one destination per row.
- Replace each import action with `setting.addToggle(...)`. Give each toggle an accessible name that identifies the destination and purpose, such as `Import and update .agents skill`.
- Use this Skill description: `Keep Mosaic guidance available to your Agent. Turn on a destination to import it now and replace it after plugin updates. Turn it off to stop updates and keep the file.`
- Use this guide description: `Use a Markdown guide instead of a Skill and reference it in your vault's AGENTS.md. Turn this on to import and update the guide with Mosaic. Turning it off keeps the file.`
- Show the concrete path alongside each toggle. Custom paths remain clickable folder fields, disabled while their resolved target is on. Keep `docs/guides` as the default guide folder.
- Keep disabled state during an active operation. Show failed enabled writes as on plus a readable failure message; do not show a false successful-import status. Users retry immediately by switching off and on, or on the next plugin load.

**Steps**

- [x] Extend the existing settings test row stub with an `addToggle` control that supports `setValue`, `setDisabled`, `onChange`, and `toggleEl`. Update the fake installer to implement `getEnabled` and `setEnabled`.
- [x] Add UI assertions for fresh-off state, persisted-on reload, `.agents` / `.claude` / custom / guide routing, alias mirroring, disabled active folder fields, mobile scope restrictions, and unchanged scope-picker behavior. Assert that scope and folder changes do not invoke `setEnabled`.
- [x] Add the review regression using the existing mobile folder-modal fixture: choosing a suggestion must return `undefined`, save the folder asynchronously, and surface failure through a Notice with no unhandled rejection. After calling the void callback, await the existing asynchronous save boundary instead of awaiting the callback's return value.
- [x] Run `node --test tests/agent-guide-settings.test.mjs` and record failing expectations before implementation.
- [x] Replace `installAndRefresh` with `setEnabledAndRefresh(target, enabled, scope)`. Call the installer, refresh busy state, then refresh final persisted state and display the operation result. Keep file selection separate from enrollment.

```ts
setting.addToggle(toggle => {
  toggle.setValue(installer.getEnabled(target, scope))
    .setDisabled(installer.busy)
    .onChange(enabled => this.setEnabledAndRefresh(target, enabled, scope));
  toggle.toggleEl.setAttribute("aria-label", `Import and update ${target} guidance`);
});
```

- [x] Fix the reported override without changing the base-class signature or suppressing the rule:

```ts
onChooseSuggestion(folder: string): void {
  void this.choose(folder).catch(error => {
    const message = error instanceof Error ? error.message : String(error);
    new Notice(`Could not save the selected folder: ${message}`);
  });
}
```

- [x] Keep `setControlValue`'s existing save-failure handling. Use the callback catch for an otherwise escaping rejection; do not emit duplicate notices for an already handled save error.
- [x] Keep the existing captured-installer layout-ready hook in `src/main.tsx`. Update its tests to check enabled/version scheduling, no enrollment for default-off users, and disposed-instance rejection. Catch any outer lifecycle promise rejection rather than sending it to the console.
- [x] Run the settings tests, a targeted `no-misused-promises` check in an isolated compatible environment, the full tests, and the build. Record the actual lint result separately from TypeScript success. Commit the installer and settings changes together only after these checks pass and delivery is authorized.

---

## Task 2: Documentation and host acceptance

> Replace the old public promises and prove the new interaction in Obsidian.

### Steps

- [x] Update English README instructions, Agent installation prompt, import guide, and privacy/disclosure text from buttons to enabled destinations. State unconditional full replacement, off-state retention, version-triggered recreation, pending retries, alias behavior, and default-off enrollment. Do not add historical migration instructions.
- [x] Update the Chinese README and import guide from the English versions. Keep shared prompts and code examples identical. Use clear language and retain Agent terminology.
- [x] Add a short English guidance-management section to `docs/design/architecture.md` and update `AGENTS.md`. Record that enablement authorizes replacement and that checksums, edit-merging, and historical compatibility are absent. Do not duplicate the user guide or authoring examples.
- [x] Check README and guide screenshot references. Capture the new toggle layout in the test vault or request a replacement screenshot from the user. Until replaced, clearly label an old settings screenshot as the previous layout; do not claim that it depicts the new controls.
- [x] In the independent test vault, check its Git status, preserve existing local changes, and deploy using `npm run install:vault` with `MOSAIC_PLUGIN_DIR` set outside committed files. Do not alter other installed plugins.
- [x] Verify all four vault rows with a fictional edited destination: enable → full import; disable → file retained; same-version re-enable → edits replaced. Verify the default custom Skill row mirrors `.agents`.
- [x] Test a simulated next plugin version in the acceptance environment: enabled edited files update, disabled files do not, and enabled missing files are recreated. Restore the checked-out project version afterward; no release tag is needed for this test.
- [x] Verify global behavior only in a disposable chosen directory. Check that selecting Global alone writes nothing, enabled global writes stay at that destination, disabling stops that vault's updates, and ordinary guides remain vault-local.
- [ ] Verify desktop folder dialogs, mobile folder suggestions, keyboard toggle operation, readable error notices, and the disabled-while-enabled folder field. Keep physical-platform checks explicitly unverified if no such device was used.
- [x] Run `node --test tests/agent-guide-content.test.mjs`, `npm test`, `npm run build`, `git diff --check`, and relative-link validation. Confirm no dependency or release-version change. Search active docs and importer code for obsolete `Local edits pause`, ownership/hash policy, and one-shot import instructions; historical archives remain historical.
- [x] Record acceptance results and actual test counts. After approved implementation delivery, move this completed plan into `docs/_archive/`, update references, and record superseded ownership rules plus any unverified host checks.

---

## Approval and handoff

> This planning change stops before implementation and publication.

- The user reviews the completed plan before implementation starts. The fresh default-off configuration decision is settled; do not reopen migration choices.
- Execute the two tasks in dependency order. Prefer one implementation session for this tightly coupled installer/settings change; parallel Agents are optional only if separately requested.
- After implementation and review are authorized, develop on a named task branch, run the required checks, merge locally into main, push, and follow CI according to `AGENTS.md`. Do not create a PR or release without a separate request.
- An alternative next action is to prepare a handoff prompt for another Agent after the plan is approved and committed. Include the repository, pushed branch and exact commit, this plan as the sole implementation basis, mandatory `AGENTS.md` reading, review/fix/retest, the applicable delivery workflow, and a final report of verification and unresolved items. Resolve any conflict between a requested `/ship` PR workflow and this repository's no-PR default before dispatch.

## Execution and review record

> Implementation is complete. This archive records the superseded contract and the limits of acceptance, rather than claiming a release.

- Scope: only guidance subscription state, desktop replacement, settings, lifecycle integration, their tests and public behavior documentation. No parser, renderer, dependency, authoring-body or release-version change.
- Superseded: content hashes, automatic preservation of edits/deletions, downgrade protection and one-shot import buttons. No old-state migration was introduced.
- Tests: 429 passed, zero failed or skipped. Focused suites: policy 6, installation 19, desktop 27, settings 18; authoring-content checks 7. The initial policy, installer and settings test failures were observed before implementing their new behavior.
- Build: TypeScript and production esbuild passed. Whitespace checks passed. All relative file links in the six changed existing documentation files resolved.
- Community lint: an isolated ESLint 9.39.5 / typescript-eslint 8.70.0 / TypeScript 5.9.3 environment reproduced the inherited-method warning on the baseline settings source and returned zero warnings/errors for the final source. No lint dependency or build hook was added.
- Linux host: Obsidian 1.13.7, Things theme, 13 enabled community plugins. The test vault had pre-existing changes; unrelated plugin files were preserved.
- Host acceptance passed: four vault destinations enable/overwrite/disable/re-enable, default custom alias mirroring, active-folder locking, edited-file replacement and deleted-file recreation on a simulated version change, disabled-file retention, and Global writes confined to a disposable selected directory. The running version was restored afterward.
- Interaction: actual keyboard Space enabled the selected switch and its alias; the native Select Folder dialog opened from the guide path field and cancellation retained `docs/guides`. Mobile suggestions and error notices passed fixture tests, not physical mobile acceptance.
- Unverified: physical macOS, Windows and mobile behavior. Windows alias handling and mobile platform guards were exercised by tests. This is why the combined cross-platform host checkbox above remains open.
- Settings screenshot: README explicitly labels the retained user-provided screenshot as the previous button layout. A local host capture verified the toggle layout; a new publication-quality screenshot is still needed before replacing that README image.
- Review: the full working-tree diff and status consumers were inspected against the review checklist. Busy-toggle assertions were strengthened, obsolete result branches and unused fixture symbols removed, and documentation links/copy corrected. No unresolved code findings remain.
- Test-vault handoff: final build installed, destination switches off, disposable Global configuration cleared. No test-vault changes were committed.
- Delivery: implementation and maintenance documentation are recorded in `f5f6fd47b2710e4b88b3512080ee11b518d66eae`. The user authorized local merge and push to `main`, without a PR or release. This archive records the implementation, not release evidence.

# Maintaining Agent guidance imports

> Engineering reference for Mosaic's destination switches, persisted state and update verification.
> The authoring body lives only in `src/agent-guide/mosaic.md`.

## Implementation boundaries

> Keep guidance management separate from parsing and rendering.

- `src/agent-guide/core.mjs` defines target paths, wraps the guidance body and decides whether an automatic write is due.
- `src/agent-guide/installer.ts` validates subscriptions, resolves duplicate destinations, saves switch state and performs writes.
- `src/agent-guide/desktop.ts` handles guarded desktop paths, native folder selection and Global file replacement.
- `src/settings.tsx` displays destination switches, folder controls and operation errors.
- `src/main.tsx` loads settings, captures the installer for the layout-ready update callback and disposes it on unload.
- User instructions belong in [[docs/guides/agent-guide|agent-guide.md]]. Design rationale belongs in [[docs/design/architecture|architecture.md]].

---

## Persisted state

> Store explicit enablement and the last successfully applied plugin version, not file ownership.

### Storage locations

- Vault subscriptions use `guideSubscriptions` in plugin settings, saved through `saveSettings()`.
- Global subscriptions use `mosaic:guide-subscriptions` through Obsidian's local-storage API, scoped to the vault and device.
- Global local state contains `global`, optional `skillFolder`, and `subscriptions`.
- The `global` boolean selects the displayed scope. It does not authorize writes on its own or suspend enabled Global subscriptions when the user returns to Current vault.
- Missing subscription configuration means all destinations are off. Do not read or migrate old import records.
- Preserve unrelated plugin settings through the ordinary settings loader.

### Destination records

```ts
type GuideSubscription = {
  path: string;
  enabled: boolean;
  appliedPluginVersion?: string;
};
```

- Target keys are `agents`, `claude`, `skillPath` and `custom`. `custom` is the ordinary Markdown guide and is valid only in vault scope.
- `path` is the exact destination to maintain. Vault paths are relative. Global paths are absolute native paths stored only on the device.
- `enabled` records the user's switch choice, independently of whether writing succeeds.
- `appliedPluginVersion` records a successful file write whose result was also saved. An explicit enable begins without this field.
- A failed automatic update retains the previous applied version. A failed first write leaves the field absent. Both remain due on the next load.
- No content hash, edit comparison, frontmatter inspection, merge or downgrade guard participates in scheduling.

---

## Write lifecycle

> Enabling imports immediately; automatic writes run only for enabled destinations that are due.

### Explicit switch changes

1. Validate the scope and path, and resolve a custom Skill alias to its standard target.
2. Acquire the installer's busy flag and save `{ path, enabled }`.
3. For off, return without destination file I/O. Keep the existing file.
4. For on, render and write the entire bundled guidance, including over edited content.
5. Save `appliedPluginVersion` only after replacement succeeds. Release busy in `finally`.

### Automatic updates

- After layout readiness, call `updateInstalled()` once for the captured installer instance.
- Write only when `enabled === true` and `appliedPluginVersion !== manifest.version`.
- Compare versions for equality only. An explicitly installed older plugin version also becomes the guidance version.
- Skip successful same-version records without accessing their destination files.
- Recreate an enabled missing destination when a write is due. Keep renamed copies untouched.
- Continue other destinations after an individual write failure. Do not add a timer or vault scan.
- An off-to-on transition forces an immediate write even within the same plugin version.

### Paths and aliases

- Custom Skill paths resolving to `.agents/skills` or `.claude/skills` share the corresponding standard record and switch value.
- Deduplicate aliases before automatic updates. Windows Global comparisons normalize separators and compare casing insensitively.
- Lock custom folder controls while the resolved destination is enabled. Disable first, choose a folder, then enable at the new location.
- Changing scope or selecting a folder does not import guidance. The ordinary guide remains vault-local with `docs/guides` as its default parent.
- Global records in different vaults are independent. Disabling a Global destination stops only that vault's writes, not another vault's enabled subscription.

---

## Failures and platform access

> Persist intent before writing and report failures without claiming a successful update.

- If saving the requested switch state fails, restore the previous in-memory state and leave the destination untouched.
- If replacement fails after enablement is saved, keep the switch on and the record due for retry.
- If saving the applied version fails after replacement, report failure and retain the due record. The file may already contain the new guidance.
- Show per-target errors in settings. Manual actions also display a Notice. Fix the cause and toggle off/on to retry immediately, or reload the plugin for another automatic attempt.
- Retain the busy flag and unload guards. A disposed installer must not begin another write or acknowledge an unfinished operation as successful.
- Vault files use Obsidian's Vault/Adapter APIs, including hidden Skill directories. Reject paths outside the vault or inside its configuration directory.
- Global access requires the desktop guards, including `Platform.isDesktopApp && !Platform.isMobile`. Mobile must not load desktop modules or Global records.
- Global replacement writes a complete temporary sibling, flushes and closes it, rejects a final destination that is a symlink or non-file, then renames the temporary file over the target. Clean up temporary files after failure.
- Keep the Direct Filesystem Access disclosure: Global Skill writes genuinely require Node filesystem access. Do not obscure imports to hide the review warning.
- Clipboard copying remains click-triggered and write-only. No clipboard reading is part of guidance import.
- Keep `VaultFolderModal.onChooseSuggestion` synchronous with a `void` return. Handle the folder-save promise explicitly so a rejection produces a Notice rather than an unhandled promise.

---

## Verification and documentation maintenance

> Verify the state machine in tests and use an independent test vault for host interactions.

### Automated checks

```bash
node --test tests/agent-guide-policy.test.mjs tests/agent-guide-installation.test.mjs tests/agent-guide-desktop.test.mjs tests/agent-guide-settings.test.mjs
node --test tests/agent-guide-content.test.mjs
npm test
npm run build
git diff --check
```

- Cover default-off behavior, explicit overwrite, version-triggered overwrite, disabled no-I/O, deleted-file recreation, aliases, persistence failures, retry and unload.
- Keep Global replacement tests in disposable directories. Exercise mobile guards and Windows path handling independently of the host platform.
- Reproduce community `no-misused-promises` findings in an isolated compatible lint environment. Do not add its toolchain to repository dependencies or the release build.

### Host acceptance

- Preserve the independent test vault's existing changes before deployment. Set `MOSAIC_PLUGIN_DIR` outside committed files and run `npm run install:vault`.
- Verify each vault destination: enable, edit, disable, re-enable and confirm complete replacement. Check that the default custom Skill row mirrors `.agents`.
- Simulate a different plugin version only in the acceptance environment. Confirm enabled edits are replaced, disabled files are retained and enabled missing files are recreated. Restore the project version afterward.
- Test Global writes only in a disposable selected directory. Selecting Global alone must create no guidance file.
- Check keyboard switches, folder dialogs and cancellation, mobile folder suggestions, error notices and locked active folder controls.
- Record the actual host version, theme, enabled plugins and verified platforms. Keep untested physical platforms explicitly unverified.

### Documentation and releases

- Keep README, its Chinese translation, and both import guides aligned with the switch behavior. Keep engineering documentation English-only.
- Maintain `src/agent-guide/mosaic.md` as the only authoring body. Installation behavior belongs in these documents, not in duplicate copies of that body.
- A change only to README or engineering documentation does not change the bundled guidance. A change to `mosaic.md`, its wrapper or installer behavior requires a plugin release to reach installed users.
- Enabled same-version destinations do not receive a changed body automatically. Verify bundled guidance using the intended release version instead of assuming a reload rewrites it.
- Keep the README settings image labeled as the previous layout until the supplied replacement shows the destination switches. Do not replace screenshots during text-only documentation maintenance.
- Follow [[docs/engineering/publishing-to-obsidian|publishing-to-obsidian.md]] for release verification. Documentation edits do not authorize publication.

# Import Mosaic guidance

<p align="center"><b>English</b> | <a href="agent-guide-zh.md">简体中文</a></p>

Mosaic can keep a complete English authoring reference available to your Agent as a Skill or an ordinary Markdown guide. Both contain the same standalone reference. This optional feature does not change note rendering.

## Import a Skill

All destination switches start **off**. Open Settings → Mosaic → **Import skill**, keep **Current vault** selected, and turn on the destination your Agent uses. One copy is enough.

| Destination switch | Current vault | Global (desktop only) |
| --- | --- | --- |
| `.agents` | `.agents/skills/mosaic/SKILL.md` | The same path under the current user's home |
| `.claude` | `.claude/skills/mosaic/SKILL.md` | The same path under the current user's home |
| Custom folder | Selected parent + `mosaic/SKILL.md` | Selected desktop directory + `mosaic/SKILL.md` |

Turning on a destination imports the complete file immediately, replacing any existing content. It also enables replacement after plugin updates. Turning it off stops updates and keeps the file.

The highlighted **Current vault** / **Global** button selects the scope shown in settings; it does not change any destination's switch. Mobile supports only Current vault.

### Choose a folder

- The custom Skill parent defaults to `.agents/skills` in the selected scope.
- Click the path field to open the system folder chooser on desktop. It starts at the current vault. There is no separate chooser button. Use the dialog's hidden-folder controls when needed.
- Vault selections must stay inside the vault and outside its configuration directory. On mobile, choose from a searchable vault-folder list or enter a new relative folder.
- Canceling leaves the selection unchanged. Selecting a folder does not import anything; creating a folder in the system dialog creates only that directory.
- A custom folder field is locked while its destination is on. Turn it off, choose the new folder, then turn it on. The old file stays where it was.
- When the custom Skill folder points to `.agents/skills` or `.claude/skills`, both rows manage the same file and show the same switch state. Switching either off stops updates for that destination. Other destinations remain independent.
- Vault paths are relative. Global paths under home use `~` on macOS/Linux; Windows shows the full native path. The shorthand does not change the write location.

Agents differ in when they discover or reload Skills. Ask your Agent to read the file if it has not picked up a new copy.

## Import an ordinary guide

Use **Import guides to this vault (optional)** instead of a Skill if you prefer to reference an ordinary Markdown document.

The folder defaults to `docs/guides`. Turn on the switch to create and maintain:

```text
docs/guides/Mosaic-Usage-Guide.md
```

The path field uses the same folder chooser as vault Skills. Guides always stay vault-local, even when the Skill scope is Global. The vault root is displayed as `/`.

Reference the guide in your vault's `AGENTS.md`, asking your Agent to read it before creating Mosaic content. Mosaic writes the guide only; it does not edit `AGENTS.md` for you.

## How updates work

**On means Mosaic manages the complete file. Off means Mosaic leaves it alone.**

- Off → on imports and replaces the entire file immediately, including edits by you or an Agent.
- After a plugin version change, an enabled destination receives that running version's bundled guidance. This also applies when installing an older plugin version.
- Mosaic does not compare content, preserve edits, merge sections, or create backups. Keep personal instructions in a separate file.
- Off → on again replaces the file immediately, even within the same plugin version.
- On → off saves the off state without reading, writing, moving, or deleting the destination.
- Each plugin load checks enabled destinations once, after the vault is ready. A successfully applied version is remembered so reopening that same version does not keep rewriting files.
- An enabled file that was deleted or renamed is recreated at its recorded path on the next plugin-version update or off-to-on transition. A renamed copy is left alone.
- Manually copied files stay unmanaged until their switch is enabled. Mosaic does not scan the vault or look for moved files.

## Scope and file access

Vault writes use Obsidian's APIs. Desktop Global writes use Node filesystem access, limited to the selected Skill destination. Existing final-file symbolic links and non-file destinations are rejected. A completed temporary sibling replaces the global file so a failed partial write does not truncate its previous content.

Global scope, custom folder and subscriptions are device-local to the current vault. They are not stored in synced plugin data. Turning a global destination off stops **this vault's** updates; another vault with the same destination enabled can still replace it.

There are no network requests, telemetry, Agent launches, client-configuration edits or file scans. A failed destination does not prevent other destinations from updating or affect note rendering. Copy buttons write to the clipboard; Mosaic never reads it.

## Retry a failed import

Settings show an error beside the destination and report a failed manual operation in a notice.

- If saving the on/off choice fails, the previous switch state is restored and the destination is untouched.
- If writing fails after the on state was saved, the switch stays on. Mosaic retries on the next plugin load.
- If writing succeeds but saving the applied version fails, the switch stays on and the write will be retried.
- To retry immediately, fix the path or permission problem, then turn the switch off and on.
- To choose another folder, turn the destination off first. Disabling also stops pending automatic retries.
- If desktop facilities are unavailable, Global imports report an error; vault imports and rendering remain available.

## Use the guidance

Ask the Agent to read the Skill or guide, then provide the data, field meanings and aggregation rules for your note. Ask it to clarify missing facts rather than invent values. View its result in Obsidian's Reading view.

For syntax, worked examples and troubleshooting, use the [Mosaic block guides](../../README.md#documentation).

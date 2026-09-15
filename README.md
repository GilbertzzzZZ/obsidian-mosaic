<!-- markdownlint-disable -->

<h1 align="center">Mosaic</h1>

<p align="center"><em>Declarative content blocks for Obsidian</em></p>

<p align="center">
  <a href="https://github.com/GilbertzzzZZ/obsidian-mosaic/releases"><img src="https://img.shields.io/github/v/release/GilbertzzzZZ/obsidian-mosaic?style=for-the-badge&colorA=263238&colorB=4CAF50&label=VERSION" alt="Release"></a>
  <a href="https://obsidian.md"><img src="https://img.shields.io/badge/Obsidian-1.13.0%2B-7C3AED?style=for-the-badge&colorA=263238&colorB=7C3AED" alt="Obsidian"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-1976D2?style=for-the-badge&colorA=263238&colorB=1976D2" alt="License"></a>
</p>

<p align="center"><b>English</b> | <a href="docs/README-zh.md">简体中文</a></p>

<br />

> Charts and cards for people. Plain-text context for agents.

Mosaic turns text in your Obsidian notes into charts, tables, cards, timelines and flow diagrams. **Built for notes you write with an AI agent**, it keeps the data and instructions as readable text while showing you the visual result.

Text is the shared source: your agent can read and edit the values, labels and context directly, without having to reconstruct them from a picture. You read the same note visually in Obsidian. There is no separate image to keep in sync.

[Download](https://github.com/GilbertzzzZZ/obsidian-mosaic/releases/latest) · [Agent setup](#use-with-your-agent) · [Guides](#documentation)

<p align="center">
  <img src="docs/_assets/readme-chart.png" alt="A monthly report rendered as bars and a line inside an Obsidian note" width="760" />
</p>

## What you can make

> Add a visual block where it helps explain your note, without leaving Obsidian.

| What you want to show | Block | Example use |
| --- | --- | --- |
| Trends and comparisons | [Chart](docs/guides/chart.md) | Monthly totals, actuals versus targets |
| Individual records | [DataTable](docs/guides/data-table.md) | Inventory, results, task lists |
| Key numbers and their status | [MetricGrid](docs/guides/metric-grid.md) | A weekly snapshot with changes and notes |
| Milestones and progress | [Timeline](docs/guides/timeline.md) | A release plan or project history |
| A decision and its reasoning | [DecisionBox](docs/guides/decision-box.md) | What was decided, by whom, and why |
| Steps and branches | [FlowDiagram](docs/guides/flow-diagram.md) | An approval or incident-response process |

<p align="center">
  <img src="docs/_assets/readme-blocks.png" alt="Metric cards and a project timeline rendered together in an Obsidian note" width="760" />
</p>

- Mix blocks with ordinary paragraphs in the same note.
- Keep small datasets inside the block. Chart and DataTable can also read shared data files in your vault through a [dataset manifest](docs/guides/dataset-guide.md).
- Rendering does not rewrite your note. Your source remains text you can search, edit and version.

<p align="center">
  <img src="docs/_assets/readme-flow.png" alt="A workshop admission flow with labeled Yes and No branches" width="760" />
</p>

---

## Install

> Requires Obsidian 1.13.0 or later. Blocks render in **Reading view**, not Live Preview.

1. Download `main.js`, `manifest.json` and `styles.css` from the [latest release](https://github.com/GilbertzzzZZ/obsidian-mosaic/releases/latest).
2. Create a `mosaic` folder inside your vault's `.obsidian/plugins/` folder and copy the three files into it.
3. Reload Obsidian and enable **Mosaic** in Settings → Community plugins.
4. Open a note containing a Mosaic block and switch it to **Reading view**.

- Desktop and mobile are supported. Global skill imports are desktop-only.
- Use a normal `.md` note to start. Mosaic also supports `.mdx` files, but does not execute MDX or JavaScript.

---

## Use with your agent

> Give your agent Mosaic's writing instructions, then ask it to create a note using your data.

Mosaic does not include an AI assistant or connect to a model. Use your own agent with access to the vault. You can also write every block by hand.

<p align="center">
  <img src="docs/_assets/readme-settings.png" alt="Mosaic settings with Current vault selected, skill import destinations and the optional Markdown guide import" width="760" />
</p>

1. Open Settings → Mosaic → **Import skill**.
2. Keep **Current vault** selected. Choose the directory your agent uses. One copy is enough:
   - **Import to .agents** writes `.agents/skills/mosaic/SKILL.md` inside this vault.
   - **Import to .claude** writes `.claude/skills/mosaic/SKILL.md` inside this vault.
3. Ask your agent to read the Mosaic skill before writing the note. Skill discovery depends on the agent you use.
4. Give it your data and the question the note should answer. Review the result in Obsidian's **Reading view**.

For example, with a monthly attendance table attached to your request:

```text
Read the Mosaic skill. Turn the attached attendance data into an Obsidian
note with a trend chart and a short written summary. Use only the supplied
values. Ask me about missing information rather than inventing it.
```

- **Custom destination:** click the path field to choose a skill parent folder, then click **Import to path**. The file is written as `mosaic/SKILL.md` inside that folder.
- **Global scope:** on desktop, explicitly select **Global** to import a skill outside this vault. The destination is shown beside each button.
- **Prefer an ordinary Markdown guide?** In **Import guides to this vault (optional)**, keep `docs/guides` and click **Import guides**. Reference `docs/guides/Mosaic-Usage-Guide.md` in your vault's `AGENTS.md`, asking your agent to read it before creating Mosaic content. Mosaic does not edit `AGENTS.md` for you.

The skill and ordinary guide contain the same complete English reference, including examples for all six blocks. See [import destinations and update behavior](docs/guides/agent-guide.md), or [read the reference itself](src/agent-guide/mosaic.md).

---

## Try one block

> No agent setup is required. Copy this entire code block into a note and switch to Reading view.

````text
```chart
---
title: Workshop seats by session
type: bar
x: session
series: Seats
SeatsColor: "#0F766E"
unit: seats
labels: true
---
session,Seats
Morning,24
Afternoon,18
Evening,30
```
````

- The lines between `---` markers name the chart and choose its display options. The rows below contain the data.
- Change a value, return to Reading view, and the chart reflects the edited text.
- This example uses invented data. For your own notes, supply your actual values.
- All six blocks support named code blocks and [tag syntax](docs/guides/tag-syntax.md). Start with code blocks to avoid the paragraph-boundary rules that apply to tags.

**If you still see text**

- Confirm Mosaic is enabled and the note is in **Reading view**, not an editing view.
- Keep the opening and closing backticks when copying the example.
- If a block shows an error, read the message in that block. Use its copy button to include the error report when asking for help.

---

## Small on purpose

> Cover common ways to explain information, and keep the plugin small.

- **Text first.** Use an ordinary paragraph, list or Markdown table when it already communicates the idea clearly. A visual block should make comparison, status or sequence easier to understand.
- **Common needs, deliberate limits.** The focus is useful charts and a small set of content blocks, not every chart type or every chart-library option. New features must justify the complexity they add.
- **Reliable basics over feature count.** Prioritize readable output, clear errors and consistent behavior in Obsidian over growing a general-purpose dashboard builder.
- **Display, not execution.** Mosaic is not an agent platform, spreadsheet engine or scripting environment. It does not run JavaScript, SQL or formulas. Reading view is supported; Live Preview is not.

---

## Documentation

> Keep this page for getting started. Use the guides for complete syntax, examples and troubleshooting.

- **Writing instructions for agents:** [complete Mosaic reference](src/agent-guide/mosaic.md) and [guidance import](docs/guides/agent-guide.md).
- **Block guides:** [Chart](docs/guides/chart.md), [DataTable](docs/guides/data-table.md), [MetricGrid](docs/guides/metric-grid.md), [Timeline](docs/guides/timeline.md), [DecisionBox](docs/guides/decision-box.md), [FlowDiagram](docs/guides/flow-diagram.md).
- **Shared syntax and data:** [tag syntax](docs/guides/tag-syntax.md) and [external datasets](docs/guides/dataset-guide.md).
- **For developers:** [architecture](docs/design/architecture.md), [engineering guides](docs/engineering/), [release procedure](docs/engineering/publishing-to-obsidian.md) and [upstream rendering sync](docs/engineering/openglance-rendering-sync.md).

User guides have English and Chinese versions. Engineering guides and the imported agent reference are English-only.

---

## Privacy and file access

> Mosaic runs locally, without network requests, telemetry, accounts or ads.

- **Note data stays in your vault.** Dataset files are read through Obsidian's vault API. Mosaic does not upload content or send it to an agent. Any external agent you use has its own privacy behavior.
- **Guidance imports write files you choose.** Imports default to the vault. Desktop global imports require selecting **Global** and clicking an import button before Mosaic writes the skill outside the vault. Mobile cannot use global imports.
- **Automatic guidance updates are limited.** Once per plugin load, Mosaic checks recorded import destinations and updates only unchanged files it owns. Global choices and records are device-local to that vault. Manual import replaces the complete destination file, including edits. See [update details](docs/guides/agent-guide.md#how-updates-work).
- **No agent configuration changes.** Importing guidance does not launch an agent, edit client configuration, create symbolic links or scan for other files.
- **Clipboard is write-only.** Copy buttons write to the clipboard. Mosaic never reads it.
- **`.mdx` registration is vault-wide.** Mosaic lets Obsidian open `.mdx` files as Markdown, including files without Mosaic blocks. It skips registration if another plugin already handles the extension.
- **Declarations are not executable code.** Charts use the bundled [Ant Design Charts](https://github.com/ant-design/ant-design-charts) library, distributed under the MIT license.

---

## Contributing and license

> Bug reports and focused improvements are welcome. Mosaic is MIT licensed.

- Report problems in [Issues](https://github.com/GilbertzzzZZ/obsidian-mosaic/issues). Include a minimal block with non-sensitive sample data, Obsidian and Mosaic versions, and whether the file is `.md` or `.mdx`.
- For feature requests, describe the recurring writing or reading problem, and why existing blocks or ordinary Markdown do not solve it.
- To develop locally, use Node.js 22 or later and run `npm ci`, `npm test`, then `npm run build`.
- See [LICENSE](LICENSE) for the license terms.

# Overall architecture

> Mosaic separates entry recognition, parsing, and rendering, with explicit contracts for host timing, external datasets, and error handling.
> This document explains design decisions; syntax and attribute references belong in the corresponding `docs/guides/` documents.

## Three-stage pipeline

> Each stage answers one question when turning Markdown source into rich content.

```text
Entry recognition         Parsing                  Rendering
"Does this belong to us?" → "What does it mean?" → "How should it appear?"
```

- **Entry recognition** finds six tag types and six code-block types in content supplied by Obsidian and decides whether to take it over. It recognizes two physical forms, tags and code blocks, and emits the same structure: type, attribute map, and body. It handles boundaries and attribute extraction, not payload meaning. Parsing and rendering do not know which syntax was used.
- **Parsing** turns tag bodies, code-block bodies, and external dataset files into structured rows, graph models, or query results. The parsing functions do not access DOM, themes, or the host, so they can be tested independently and reused by multiple entry points.
- **Rendering** handles the shared shell, host readiness, width and theme changes, granularity state, and error presentation. AntV draws Chart content; the other five types use DOM/React views.

**Reuse and isolation**

- Chart's self-closing tags, paired tags, and code blocks converge on one parsing and rendering implementation.
- DataTable's inline and dataset sources take separate parsing paths but share one table view.
- Parsing errors travel upward as messages. Rendering decides whether to show an error box or retain the previous successful view.

**Data handoffs**

- **Entry → parsing:** tag name, string-valued attribute map, and raw payload.
- **Parsing → rendering:** rows, a graph model, or a query result containing rows, column order, and metadata; alternatively, an error message.
- **Rendering → page:** a React view or AntV instance mounted on the block's own host node.

---

## Entry recognition strategy

> Reading view invokes post-processors section by section, so recognition must be inexpensive, conservative, and reversible.

- **Cheap prefilter.** Most paragraphs contain no Mosaic content. A low-cost text check looks for a candidate opening tag name and returns immediately when none is present. Only matching paragraphs undergo full boundary parsing.
- **Take over only tag-only paragraphs.** After removing recognized tags, the remaining text must be whitespace. Otherwise, leave the whole paragraph as Markdown. Replacing fragments inside mixed prose would require modifying someone else's DOM and could damage user content. Whole-paragraph takeover is predictable. Malformed attributes or missing closing tags also leave the source untouched: a recognition failure means the paragraph does not belong to the plugin, not that it needs an error box.
- **Generation tokens prevent re-entry races.** Rapid editing can invoke asynchronous rendering repeatedly on the same element. Each invocation records a new generation. Older work checks for staleness across asynchronous boundaries and stops writing when superseded. The new generation unmounts any already-mounted view left by the old one.
- **Unload also invalidates work.** Removing a section triggers unload without creating a new generation. Generation comparison alone would leave host-readiness polling waiting forever on a detached node. The same staleness check therefore includes unloading, stops outstanding waits, and unmounts views and AntV instances.

---

## Host timing

> Reading-view virtualization and temporary layout containers affect both the initial render and later maintenance.

- **Wait for mounting and nonzero width.** A post-processor can run before its paragraph is mounted or while it is inside a narrow measurement container. Drawing then gives AntV the wrong geometry for label collision handling. The virtualized paragraph can retain that incorrectly filtered chart. Wait for a connected, nonzero-width host without a timeout: a virtualized section may mount much later, and abandoning it would leave a permanent blank paragraph. Only re-entry or unloading cancels the wait. A size observer and low-frequency polling work together because size observation alone does not detect every detached-to-attached transition.
- **Rebuild in place after width settles.** Even a connected first render can use a transitional width. The chart shell watches its own width and rebuilds after a sufficiently large change remains stable briefly. Only that chart is rebuilt; Markdown is untouched.
- **Restyle through theme events.** Debounced host style changes become a custom event. Each mounted chart shell rebuilds its configuration for the active light or dark theme. Canvas colors live in configuration rather than CSS, so a rebuild is necessary, but remains local to the chart.
- **Avoid whole-document rerendering.** Full Markdown rerenders race with delayed materialization of offscreen sections. Missing paragraph information can leave blank paragraphs or raw source that the processor cannot take over. A view rebuild runs once when the plugin loads; subsequent theme, width, and granularity maintenance is local, per-block, and event-driven.

---

## Agent guidance distribution

> Optional guidance-file distribution is separate from the rendering pipeline.
> Installation or update failures must not affect entry recognition, parsing, or rendering.

- **A separate service, not another pipeline stage.** Guidance helps external Agents produce valid declarations. It does not recognize declarations, parse data, or render pages. Users who have not installed it incur no guidance-file access, installation-state checks, or rendering branches.
- **One body, two artifact types.** Skills and ordinary Markdown guides carry the same complete English reference and work independently of the development repository. Packaging differs only where the artifact type requires it. User-facing installation instructions do not copy the body, preventing separate copies from drifting.
- **Native groups separate type from scope.** Declarative settings expose `Import skill` and `Import guides to this vault (optional)`. Skills have standard/custom destinations and vault/global scope. Ordinary guides are an optional alternative and always use a vault-local directory. The two operations do not share an ambiguous path control.
- **Explicit import establishes management.** Only clicking an import button creates an installation record. Manual import authorizes replacing that destination file in full; an existing same-name file alone never authorizes background updates. Skills default to the current vault. A desktop user must select `Global` and then import to authorize a global write. Changing scope or choosing a folder does not import, move old files, or revoke old records.
- **Host capabilities stay at the boundary.** Vault reads and writes use Obsidian APIs. Desktop vault/global folder selection uses the same system folder dialog. Vault selections are stored as relative paths, and targets outside the vault or inside its configuration directory are rejected. Node/Electron modules load dynamically only after a desktop guard. Mobile keeps a vault-folder list, never loads desktop modules or reads global records, and exposes no global option. Global scope, folder selections, and records use vault- and device-local storage rather than synced settings.
- **Replace complete content, not text fragments.** Guidance is a coherent set of rules. Automatic merging cannot reliably distinguish local intent from obsolete guidance and can leave conflicting instructions. Version and content hashes establish whether the previous complete file is still plugin-managed. A background hash mismatch preserves the user's entire file. An explicit manual import writes the complete bundled guidance again.
- **Stop when the path disappears.** Renamed, moved, or deleted files are neither searched for nor recreated. The plugin does not reclaim a destination the user has withdrawn. Targets and scopes are maintained independently; failure in one never enters rendering or overwrites another scope's state.

---

## External dataset subsystem

> Chart and DataTable can query external files inside the vault.
> Notes select a range and granularity, while source data and its interpretation remain in separate files.

- **A manifest is the data-contract sidecar.** A `.dataset.json` file records field names, types, display names, units, rollups, and time semantics. Exported CSV files need no rendering-specific edits. Multiple manifests can reference one data file with different interpretations.
- **Validate time alignment.** Time fields must contain complete dates aligned with the declared source period: month starts for monthly data and the configured week start for weekly data. Loading validates every row in the file. A narrower query cannot hide invalid rows outside its range. Invalid source data is exposed on first use rather than during a later range expansion.
- **Aggregate to coarser periods only.** Daily sources can produce daily, weekly, monthly, or quarterly views; monthly sources can produce monthly or quarterly views. Finer-to-coarser aggregation is defined, while the reverse would invent data. Available granularities are the intersection of the author's choices and safe source rollups.
- **Rollup semantics belong to each field.** Fields declare their own sum, average, extrema, count, first/last, or ratio-of-sums behavior. A field without a rollup can pass through only at source granularity. Rendering never guesses whether a column should be summed or averaged.
- **Limit chart density.** Granularities producing more than 120 time buckets are excluded from chart choices. Tables are exempt because long tables can scroll. Separate hard limits on output rows and total time span bound query results.

---

## Error handling

> Each block owns its output and failures, with different behavior for unrecognized source and invalid recognized content.

- **Independent rendering and errors.** Multiple tags in one paragraph render independently in sequence. Bad data turns only its own block into an error box; other page content remains usable.
- **Actionable errors in place.** Semantic failures, such as missing data, misaligned dates, invalid granularity, or nonnumeric values, appear in a red box at the block's position. Messages identify the cause and often a row or field. Users do not need the console.
- **Leave unrecognized source alone.** Mixed prose, malformed tags, and missing closing tags remain ordinary Markdown without error boxes. Recognition quietly yields; recognized but invalid content reports its error. Code blocks differ because the language explicitly assigns ownership, so structural failures always become errors rather than source fallback. That guarantee applies to opening/closing `---` boundaries, not every attribute line: malformed attribute lines are skipped and named in the footer, matching tag behavior.
- **Preserve the last successful view after interaction failures.** If a granularity rebuild fails, for example because a field lacks a coarser rollup, retain the previous content and display the error alongside it. Clear the error after the next successful rebuild.

---

## Related documents

> Block design documents cover local decisions; user guides describe syntax and troubleshooting.

- [chart.md](chart.md), [data-table.md](data-table.md), [metric-grid.md](metric-grid.md), [timeline.md](timeline.md), [decision-box.md](decision-box.md), and [flow-diagram.md](flow-diagram.md): block-specific design.
- [Dataset guide](../guides/dataset-guide.md): user-facing data contracts and troubleshooting.

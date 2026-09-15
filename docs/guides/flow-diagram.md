# FlowDiagram

<p align="center"><b>English</b> | <a href="flow-diagram-zh.md">简体中文</a></p>

> A practical playbook for writing, checking and repairing flow diagrams in Obsidian.
> Describe steps and connections as text, then read the result as an automatically arranged diagram.

**Preview — a decision with two outcomes**

![Workshop admission flow with labeled branches](../_assets/readme-flow.png)

## Choose a writing form

> Use graph JSON for labeled branches, and rows for simple connections.

| Need | Recommended form | What you write |
| --- | --- | --- |
| Decisions with Yes/No or named outcomes | Graph JSON | A `nodes` array and an `edges` array with labels |
| A checklist with a split and a merge | CSV rows | One node per row, with a comma-separated `next` field |
| A short sequence already written as a table | Markdown table | Node columns and a `next` column |
| Content embedded in tag-based notes | Paired tag | The same graph or row data inside `<FlowDiagram>…</FlowDiagram>` |

- Use a plain numbered list when the sequence needs no visual explanation. Use [Timeline](timeline.md) when dates and progress matter more than connections.
- All complete `flowdiagram` code blocks below are live examples. They render in Obsidian **Reading view** with Mosaic enabled. On GitHub or without Mosaic, they remain visible source. Use **Source mode** to edit them.
- Every example uses invented data and needs no external file. FlowDiagram does **not** support `dataset`, executable conditions, Mermaid syntax or JavaScript.
- Tag demonstrations and intentionally broken examples stay inside outer `text` fences so they can be studied without taking over the page.

---

## Build a complete branching process

> Give every node a stable ID, connect outcomes explicitly, and state what a merge means.

### Proposal review and preparation

- This complete example has 12 nodes, three review outcomes, a preparation split, and a merge before opening.
- Follow the approved route from the request to opening. The other two routes end at a deferred session.
- Node `note` values are hover descriptions. The block-level `note` is a visible caption.

```flowdiagram
---
title: Workshop proposal to opening
note: Opening requires the room and supplies to be ready. Arrows document the process; they do not execute it.
---
{
  "nodes": [
    {"id":"request","label":"Receive proposal","type":"start"},
    {"id":"draft","label":"Draft session plan","type":"action","note":"Include audience, capacity and materials."},
    {"id":"review","label":"Coordinator review","type":"gate","note":"Check staffing, safety and budget."},
    {"id":"outcome","label":"Review outcome?","type":"decision"},
    {"id":"revise","label":"Revise proposal","type":"action","note":"Prepare a new version for a later review."},
    {"id":"hold","label":"Resolve blocker","type":"risk","note":"Do not schedule until the blocker is resolved."},
    {"id":"prepare","label":"Start preparation","type":"action"},
    {"id":"room","label":"Prepare the room","type":"action"},
    {"id":"supplies","label":"Pack supplies","type":"action"},
    {"id":"ready","label":"Readiness check","type":"gate","note":"Confirm both preparation tasks are complete."},
    {"id":"open","label":"Open the workshop","type":"end"},
    {"id":"defer","label":"Defer this session","type":"end"}
  ],
  "edges": [
    {"from":"request","to":"draft"},
    {"from":"draft","to":"review"},
    {"from":"review","to":"outcome"},
    {"from":"outcome","to":"prepare","label":"Approved"},
    {"from":"outcome","to":"revise","label":"Changes needed"},
    {"from":"outcome","to":"hold","label":"Blocked"},
    {"from":"revise","to":"defer"},
    {"from":"hold","to":"defer"},
    {"from":"prepare","to":"room"},
    {"from":"prepare","to":"supplies"},
    {"from":"room","to":"ready"},
    {"from":"supplies","to":"ready"},
    {"from":"ready","to":"open"}
  ]
}
```

### Adapt this example

1. Replace the visible `label` values with your steps. Keep IDs stable unless the identity of a step changes.
2. Add a node before adding an edge to it. Every `from` and `to` must match an ID, not the visible label.
3. Label each decision outcome. Labels are plain text, not conditions that Mosaic evaluates.
4. To add another preparation task, connect `prepare` to the new task and the new task to `ready`.
5. State whether a merge means “all tasks complete” or “any incoming route.” Mosaic draws the connections but does not enforce either rule.
6. Reorder nodes within the input array to improve the order of nodes on the same layer. Connections determine their vertical layers.

---

## Write row-based processes

> Rows are compact when connections do not need their own labels.

### CSV with parallel preparation and a merge

- Quote a `next` value containing commas. Without quotes, the targets become separate CSV cells.
- An empty `next` means no outgoing connection. A blank note is allowed.
- `next` describes links only. It does not start parallel tasks or wait for them to finish.

```flowdiagram
---
title: Workshop preparation checklist
note: The readiness check covers the room, supplies and staffing.
---
id,label,type,next,note
plan,Confirm the plan,start,"room,supplies,staff",Three preparation tasks
room,Prepare the room,action,check,Check seating and access
supplies,Pack supplies,action,check,Count kits and spare materials
staff,Brief facilitators,action,check,Assign roles and arrival times
check,Readiness check,gate,announce,Confirm all three tasks
announce,Send joining details,action,welcome,Include the room and start time
welcome,Welcome visitors,action,finish,Check registrations
finish,Ready to begin,end,,Preparation complete
```

### Markdown table for a small handoff

- Include the header separator row and leading `|` on each row.
- Use CSV or JSON when cells need literal pipes or more complex text. Escaped pipes and rich Markdown table syntax are not supported by this row reader.

```flowdiagram
---
title: Equipment handoff
---
| id | label | type | next | note |
| --- | --- | --- | --- | --- |
| collect | Collect equipment | start | inspect | Use the packing list |
| inspect | Inspect items | gate | assign | Check quantity and condition |
| assign | Assign kits | action | record | One kit per facilitator |
| record | Record the handoff | action | finish | Keep the note with the inventory |
| finish | Handoff complete | end | | |
```

### JSON rows when the data is already structured

- A top-level JSON array is a row list, not graph JSON. Each row can use `next`.
- An object with a `rows` array is also a row payload. Use a `nodes` array when you need explicit edge objects and their labels.
- Write `next` as a comma-separated string, not a JSON array.

```flowdiagram
---
title: Session follow-up
---
[
  {"id":"close","label":"Close the session","type":"start","next":"survey,stock"},
  {"id":"survey","label":"Collect feedback","type":"action","next":"review"},
  {"id":"stock","label":"Count returned kits","type":"action","next":"review"},
  {"id":"review","label":"Review outcomes","type":"gate","next":"archive"},
  {"id":"archive","label":"Archive the notes","type":"end"}
]
```

---

## Use paired tags and explicit payload fences

> A code block and a paired tag describe the same graph, but their outer boundaries differ.

- For a named `flowdiagram` code block, place flat `key: value` attributes between two `---` lines, followed by bare JSON, CSV or a Markdown table.
- For a paired tag, keep the opening tag on **one line**, with no spaces around `=`. Put `</FlowDiagram>` alone on the closing line, using the same case.
- Leave **no blank lines** inside a paired tag and keep unrelated prose outside the tag paragraph.
- Do not use `<FlowDiagram />`: there are no nodes to render.

### A labeled check in a paired tag

- Copy the tag and its inner JSON fence, not the outer `text` fence used to display this example.

````text
<FlowDiagram title="Material check" note="Only complete kits proceed to packing.">
```json
{
  "nodes": [
    {"id":"check","label":"Kit complete?","type":"decision"},
    {"id":"pack","label":"Pack the kit","type":"action"},
    {"id":"replace","label":"Replace missing items","type":"risk"},
    {"id":"ready","label":"Kit ready","type":"end"}
  ],
  "edges": [
    {"from":"check","to":"pack","label":"Yes"},
    {"from":"check","to":"replace","label":"No"},
    {"from":"pack","to":"ready"}
  ]
}
```
</FlowDiagram>
````

### TSV data in a paired tag

- The separators in this example are actual tab characters. Use an explicit `tsv` fence because bare TSV is not detected automatically.
- For TSV inside a named code block, use a four-backtick outer `flowdiagram` fence and a three-backtick inner `tsv` fence. Equal-length inner fences close the outer block.

````text
<FlowDiagram title="Room setup handoff">
```tsv
id	label	type	next
unlock	Unlock the room	start	seats
seats	Arrange the seats	action	check
check	Check access routes	gate	ready
ready	Room ready	end
```
</FlowDiagram>
````

---

## Attributes and data contract

> Use the canonical fields below when writing new diagrams.

**Block attributes**

- `title`: text in the block header and the diagram's accessible name. If omitted, the accessible name is `Flow diagram`.
- `note`: a visible caption below the diagram.
- Layout direction, coordinates, custom shapes, per-node colors, `dataset` and click actions are not configurable. Unsupported attributes do not activate those capabilities.

### Node fields

| Field | Meaning | Accepted aliases and fallback |
| --- | --- | --- |
| `id` | Unique, non-empty identifier used by edges | `id`, then `key`, then the 1-based row position |
| `label` | Visible text inside the node | `label`, then `title`, then `name`, then ID/row position |
| `type` | Semantic color category | `type`, then `kind`, then `status`; defaults to `action` |
| `note` | Native hover description on desktop | `note`, then `description`; empty by default |
| `next` | Comma-separated outgoing target IDs | `next`, then `to`; empty by default |

- Aliases pick the first value that is not null or missing. An explicit empty string blocks the later alias.
- IDs are converted to strings and trimmed. A node with an explicitly blank ID is dropped. Use explicit, unique string IDs so reordering rows does not change references.
- Duplicate IDs are not reported as a validation error. They can make nodes overlap or connect incorrectly. Correct duplicates in the source.
- Keep labels short. They wrap to at most three lines, then truncate. Put additional explanation in a node note or surrounding prose.
- Node labels, edge labels and node notes are plain text. HTML, Markdown emphasis and clickable links are not rendered inside nodes.

### Edge fields in graph JSON

| Field | Meaning | Accepted aliases |
| --- | --- | --- |
| `from` | Starting node ID | `from`, then `source` |
| `to` | Destination node ID | `to`, then `target` |
| `label` | Text on the arrow | `label`, then `title`; empty by default |

- Graph JSON uses an object with a `nodes` array. Supply flat node and edge objects, not null entries or strings.
- `edges` may be omitted for a diagram without explicit edges. `links` is an alias when `edges` is absent or null. An explicit empty `edges: []` takes precedence.
- Edge endpoints are strings after normalization. Unknown endpoints are silently discarded, not reported as errors.
- A graph node's `next` also adds edges. Do not declare the same connection in both `edges` and `next`. Connections are not deduplicated.
- Row-based `next` links can overlap as duplicate paths in the SVG. Use graph JSON with explicit edges when exact edge counts matter.
- A CSV field named `label` is the **node's** label. Row-based connections have no edge labels. Use graph JSON to label individual arrows.

### Node types and appearance

| Type | Purpose | Accepted values |
| --- | --- | --- |
| `start` | Starting point, green | `start` |
| `end` | Outcome, green | `end` |
| `action` | Ordinary step, neutral | `action`, missing value or any unrecognized value |
| `decision` | A branch, orange | `decision`, `question`, `branch`, `condition` |
| `gate` | Review or approval, theme accent | `gate` |
| `risk` | Blocker or warning, red | `risk`, `warning`, `blocked`, `error` |

- Type matching trims whitespace and ignores case.
- Every node is a rounded rectangle. A `decision` changes the color, not the shape to a diamond.
- Colors follow Obsidian's theme. A node's type expresses meaning, not execution state.

---

## Layout, wide diagrams and retries

> Connections determine vertical layers; input order controls the order within a layer.

- A merge goes below its longest incoming route. Unconnected nodes remain at the starting layer rather than producing an error.
- FlowDiagram does not minimize line crossings. Reorder peer nodes or split an oversized process into separately titled diagrams.
- The diagram has a 720 px minimum display width. Narrow views scroll inside the diagram without widening the note.
- Layout is automatic. There is no drag-to-position, zoom control, horizontal-direction switch, swimlane or group container.
- A cycle is not an error. Nodes in a cycle, and nodes blocked behind it, are placed on successive fallback layers in input order. Backward arrows remain, but the result is not a circular layout.

### A retry with an explicit exit

- The edge `retry → inspect` creates a cycle. The failure route reaches a separate end state, so the process has a documented exit.
- Use a separate retry diagram when this fallback layout makes a large process hard to follow.

```flowdiagram
---
title: Kit inspection retry
note: Retry only while replacement items are available. The diagram does not count attempts.
---
{
  "nodes": [
    {"id":"start","label":"Receive the kit","type":"start"},
    {"id":"inspect","label":"Inspect the kit","type":"gate"},
    {"id":"decision","label":"All items present?","type":"decision"},
    {"id":"ready","label":"Kit accepted","type":"end"},
    {"id":"retry","label":"Replace items","type":"action"},
    {"id":"stop","label":"Hold for review","type":"end"}
  ],
  "edges": [
    {"from":"start","to":"inspect"},
    {"from":"inspect","to":"decision"},
    {"from":"decision","to":"ready","label":"Yes"},
    {"from":"decision","to":"retry","label":"No: replacements available"},
    {"from":"decision","to":"stop","label":"No replacements"},
    {"from":"retry","to":"inspect","label":"Retry"}
  ]
}
```

---

## Troubleshooting

> First distinguish an error box from an attribute notice or an unexpected but valid drawing.

### Error boxes: symptoms and fixes

| Message or symptom | Cause | Fix |
| --- | --- | --- |
| `FlowDiagram requires nodes.` | Empty payload, empty `nodes`, or every explicit ID is blank | Supply at least one valid node |
| `External datasets support Chart and DataTable.` | A `dataset` attribute was supplied | Remove it and put the graph or rows inside the block |
| JSON parse error | Trailing comma, missing quote/bracket or other invalid JSON | Use double-quoted keys/strings and valid JSON without comments |
| `Block must start with a "---" attribute section.` | A named code block starts directly with data | Add the opening and closing attribute boundaries |
| `The "---" section is missing its closing "---".` | Only the opening attribute boundary is present | Add the second `---` before the payload |
| `No attribute could be read …` | The non-empty attribute section contains no readable `key: value` line | Correct the attribute lines, or leave the section empty |
| Error mentioning `map` or a property read | Graph arrays contain wrong shapes, such as `edges` being an object or a null node | Use arrays of non-null objects for `nodes` and `edges` |

- Error boxes display a `Mosaic:` prefix. Native JSON/type error wording varies by Obsidian's JavaScript runtime.
- A graph with nodes and no edges is valid. A graph with edges but no valid nodes is not.
- Use the error box's copy button when asking for help. Remove sensitive data from the report first.

### Deliberately broken examples

- These outer `text` fences keep the failures from rendering automatically. Copy only the inner block into a scratch note when reproducing an error.

**No nodes**

````text
```flowdiagram
---
title: Empty graph
---
{"nodes":[],"edges":[]}
```
````

- Expected: `Mosaic: FlowDiagram requires nodes.`
- Fix: add a node, for example `{"id":"start","label":"Begin","type":"start"}`, inside `nodes`.

**Unsupported external data**

````text
```flowdiagram
---
title: External graph
dataset: graph.dataset.json
---
```
````

- Expected: `Mosaic: External datasets support Chart and DataTable.`
- Fix: remove `dataset` and paste the complete graph or rows below the second `---`.

**Malformed JSON**

````text
```flowdiagram
---
title: Invalid JSON
---
{"nodes":[{"id":"start","label":"Begin",}],"edges":[]}
```
````

- Expected: a JSON parse error, not an empty-graph message.
- Fix: delete the comma after `"Begin"`.

**Missing attribute boundary**

````text
```flowdiagram
{"nodes":[{"id":"start","label":"Begin"}],"edges":[]}
```
````

- Expected: `Mosaic: Block must start with a "---" attribute section.`
- Fix: insert two `---` lines before the JSON, with an optional `title: Example` between them.

### No error box, but the result is wrong

| Symptom | What to check | Repair |
| --- | --- | --- |
| An arrow is missing | Exact `from`/`to` IDs, including case | Reference the node ID, not its label |
| A branch loses one target in CSV | An unquoted comma in `next` | Write `"room,supplies"` as one CSV cell |
| Arrows overlap | Repeated edge declarations or mixed `edges` and `next` | Prefer one explicit edge list for precise connections |
| Nodes overlap or edges go to the wrong box | Duplicate IDs | Give every node a unique ID and update references |
| A type has no expected color | Misspelling or an empty primary `type` masking an alias | Use one of the six canonical types |
| A long label disappears at the end | Three-line text limit | Shorten the label and move detail to a note |
| The graph is a tall chain | A cycle and its downstream nodes | Isolate the retry or remove accidental back-edges |

**Attribute notices**

- Unsupported attributes such as `direction: LR` do not control the layout. They are listed in a notice while the recognized content still renders.
- Indented or malformed attribute lines are skipped. If some valid attributes remain, the block can render with a notice.
- In a tag, `title = "Example"` is not the same as `title="Example"`. Remove spaces around `=`.
- The normal field aliases inside node data are separate from block attributes. For example, `type` belongs on a node, not beside the block's `title`.

**Raw source remains visible**

- Confirm Mosaic is enabled and switch to **Reading view**. A code fence named `text` or `json` is not a `flowdiagram` block.
- For paired tags, check the exact tag case, a single-line opening tag, a separate closing line, no blank lines inside and no unrelated text in the tag paragraph.
- Non-ASCII attribute names prevent tag takeover. Use canonical attributes or switch to a named code block.
- If an inner fence truncated the outer code block, use different fence lengths or bare data instead.
- See [tag syntax](tag-syntax.md) for the complete host paragraph rules.

---

## Check before sharing

> Verify the meaning of the diagram as well as whether it renders.

1. Read each path from its start to an outcome, including rejected, blocked and retry routes.
2. Confirm every ID is unique and every edge endpoint exists.
3. Check decision labels and write down the intended meaning of each merge.
4. Keep important detail visible in prose or the block caption, not only in hover notes.
5. Open Reading view, inspect the whole diagram and check narrow-view scrolling.
6. Resolve errors and attribute notices. Do not assume “no error” proves every arrow is present.
7. Keep the source with the note so people and Agents can edit the same content.

- For the compact Agent-oriented reference, use the [Mosaic skill body](../../src/agent-guide/mosaic.md).
- For design rationale, see [FlowDiagram design](../design/flow-diagram.md).

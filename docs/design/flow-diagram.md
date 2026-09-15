# FlowDiagram design

> FlowDiagram renders nodes and edges as static SVG and is the only Mosaic block with its own layout algorithm.
> This document covers input normalization, layered layout, cycle fallback, and node colors; the [FlowDiagram guide](../guides/flow-diagram.md) covers usage.

## Two payload forms, one graph model

> Authors can describe a graph explicitly or write one row per node.

1. **Graph JSON:** an object containing node and edge arrays. This suits complex topology and edges with their own labels, mapping directly to a graph's points and connections.
2. **Tabular rows:** each row defines a node and a `next` column lists comma-separated successors. This suits linear flows and simple branches, reusing the CSV/table style of other blocks.

- Detection first checks for a non-array JSON object with a node array. Otherwise, shared row extraction handles the input as tabular data.
- Structure determines the form, so authors need no mode switch.
- Both forms produce the same normalized graph model.
- Node aliases include `key` for `id`, `title/name` for the label, and `kind/status` for the type. Edge endpoints also accept `source/target`.
- Missing node IDs receive an index-based fallback. Nodes whose IDs are empty are discarded.
- Node-level `next` creates implicit edges even in graph JSON, appending them to explicit edges. The field keeps the same meaning in both forms.
- **Dangling edges are silently filtered.** Edges referencing missing nodes at either end are discarded. Removing a node often leaves stale edges during editing; reporting each intermediate state would repeatedly replace the diagram with an error. Dropping those edges leaves the rest readable.

---

## Longest-path layered DAG layout

> Layout is deterministic geometry with no graphics-library dependency.

1. **Assign layers.** Topologically traverse directed edges. Each node's layer is one plus the maximum layer of its predecessors: longest-path layering. Unlike a simple breadth-first assignment, this puts a node with different-length incoming paths in the deeper layer, keeping DAG edges directed toward deeper layers rather than across the same layer or backward.
2. **Position nodes.** Nodes within a layer have equal widths and spacing, and the layer is horizontally centered. Vertical spacing is fixed. Canvas width is the greater of the widest layer's natural width and a minimum width.
3. **Draw connections.** Edges leave the bottom-center of their source and enter the top-center of their target along S-shaped cubic curves. Labels sit above the curve midpoint with a background-colored stroke. Node labels wrap by estimated visual width, treating CJK as full width and ASCII as roughly half width. Text is limited to three lines and then ellipsized.

**Deliberate limits**

- There is no crossing-minimization pass within layers. Such optimization is complex and input-order-sensitive, while note diagrams have limited node counts. Authors control within-layer order by writing nodes in narrative order.
- There is no zooming, dragging, or runtime editing. Wide SVGs scroll horizontally, and native hover tooltips expose node notes. The diagram's job in a note is reading, not editing.
- The canvas retains the upstream minimum display width. Narrow Reading views scroll inside the diagram instead of widening the whole page.
- Apply sizing only to the diagram canvas in its scroll container. Toolbar icons are SVG too and would be enlarged by a block-wide SVG rule.
- The same input always produces the same geometry, without randomness or iterative convergence, making output predictable and regression-testable.

---

## Cycles fall back to a vertical chain

> Cyclic input remains visible through a deterministic fallback rather than rejection or endless traversal.

- The main layering algorithm assumes a directed acyclic graph, but input can contain cycles.
- Topological traversal leaves cycle nodes and nodes blocked behind cycles unvisited.
- Append each unvisited node, in input order, as a separate new layer below the deepest assigned layer.
- Back edges still render as long curves pointing from deeper layers to shallower ones.
- This is not a general-purpose optimal cycle layout, but it terminates, preserves every cycle node, and returns the same result for the same input.
- A vertical chain with a back edge conveys the occasional loop or retry in a note without a more elaborate layout system.

---

## Semantic colors for six node types

> Colors communicate flow meaning rather than decoration.

| Type | Aliases | Color | Meaning |
| --- | --- | --- | --- |
| `start` / `end` | — | Pale green fill, green border | Matching process endpoints |
| `decision` | `question / branch / condition` | Pale orange fill, orange border | A branch to identify while scanning |
| `gate` | — | Pale blue fill, theme-accent border | A checkpoint or approval using the theme's focus color |
| `risk` | `warning / blocked / error` | Pale red fill, red border | Risk or blockage |
| `action` (default) | Any other value | Neutral panel colors | An ordinary step |

- Like [Timeline status colors](timeline.md), objective semantics such as endpoints, branches, and risks use stable semantic colors across themes.
- Gates use the theme accent because they represent a checkpoint in progression.
- Unknown or missing types normalize to neutral `action`, without guessing or errors.
- A diagram with no explicit types is entirely neutral. Color appears only where the author supplies meaningful type information.
- An empty normalized graph is the semantic error condition: edges alone cannot form a diagram without valid nodes.
- Each diagram has its own arrow-marker definitions so multiple diagrams on one page do not interfere with one another.

---

## Related documents

> Shared architecture explains cross-block behavior; the guide gives complete writing examples.

- [architecture.md](architecture.md): entry recognition and error handling.
- [FlowDiagram guide](../guides/flow-diagram.md): usage, fields, and examples.

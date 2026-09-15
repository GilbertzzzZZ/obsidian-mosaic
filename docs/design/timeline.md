# Timeline design

> Timeline renders rows as a vertical sequence with status dots and a connecting line on the left, and dates, titles, descriptions, and owners on the right.
> It is the simplest visual form among the six blocks, with an emphasis on self-contained layout and tolerant rendering; see the [Timeline guide](../guides/timeline.md).

## Vertical structure

> A vertical timeline follows the note's scrolling direction and accommodates varying item counts and text lengths.

- A horizontal timeline would need to clip or compress inside narrow containers.
- Each item is a two-column grid: a fixed narrow marker column and a flexible content column.
- The vertical axis is not a separate full-height element. Each item draws its own segment from its dot toward the next item; the last item draws none.
- Segment heights follow actual content height, so long descriptions and additional items require no measurement or synchronization.
- Adding or removing items does not require recalculating a full axis.
- Dots have a background fill and sit above the line, making it appear to pass behind them without extra line-breaking logic.

**Optional content slots**

| Slot | Aliases | Visual role |
| --- | --- | --- |
| Date | `time / month` | Small muted text locating the item |
| Title | `name / event` | Bold primary text |
| Body | `description / summary / note` | Secondary text, possibly multiline |
| Owner | `assignee` | Small muted attribution |

- Slots stack vertically and render only when populated.
- Alias support follows [MetricGrid's rationale](metric-grid.md): data copied from task tables or meeting notes should not need column renaming.

---

## Status dots

> A normalized status selects the dot's border color rather than coloring the whole row.

| Status | Accepted words | Dot color |
| --- | --- | --- |
| `done` | `done / complete / completed / success` | Green |
| `active` | `active / doing / progress / in-progress` | Theme accent |
| `blocked` | `blocked / risk / warning` | Orange |
| `default` | Any other value or an empty value | Neutral gray |

- Whole-row colors would turn dense timelines into bands of competing colors. A small dot is enough to locate progress and blockers.
- **Active uses the theme accent** because it identifies the present focus, matching links and selected UI states.
- Done and blocked express objective outcomes and use stable semantic colors across themes.
- Unknown status terms use the default without errors. Guessing a state is worse than leaving it neutral.
- Timeline and [MetricGrid](metric-grid.md) deliberately use different vocabularies. Metrics answer "How is this performing?" with good/risk/watch; timelines answer "How far has this progressed?" with done/active/blocked.
- Thus `risk / warning` mean poor performance in MetricGrid but blocked progress in Timeline. The block's domain determines the mapping, not mechanical cross-block uniformity.

---

## Tolerant rendering with no required fields

> Timeline supports incremental writing, from an initial outline to a complete record.

- No field is mandatory. A row with no date, title, body, or owner still renders a dot-only item.
- Missing fields omit their elements without leaving placeholder gaps.
- The payload produces an error only when it yields no rows at all.
- Authors may start with dates and add titles or conclusions later. Field errors or row filtering would interrupt this normal intermediate state.
- A gray dot is visually harmless and still records that a point in time belongs here.
- Rendering presents what the author supplied instead of deciding whether an item deserves to appear.
- Unlike MetricGrid's empty label/value rows, an empty timeline item can be an intentional placeholder. The different filtering policies follow each block's writing use case.

---

## Related documents

> Shared mechanisms have domain-specific semantics in each block.

- [architecture.md](architecture.md): entry recognition and error handling.
- [metric-grid.md](metric-grid.md): status vocabularies and alias chains.
- [flow-diagram.md](flow-diagram.md): node-type normalization and theme accents.
- [Timeline guide](../guides/timeline.md): usage and fields.

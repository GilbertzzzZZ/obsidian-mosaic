# DataTable design

> DataTable uses one presentation with content-aware widths.
> Inline and external data share a view; the [DataTable guide](../guides/data-table.md) describes syntax and attributes.

## Why data size does not determine features

> Layout adaptation responds to available space; feature selection should not depend on arbitrary data-size thresholds.

- An earlier complexity heuristic classified a table as complex if it had more than 20 rows, at least 8 columns, more than 100 cells, or a cell at least 120 characters long.
- It then enabled CSV copying for complex tables, sticky headers and a frozen first column above 20 rows, and search above 100 rows. Five attributes could override it: `complexity`, `search`, `freeze`, `copyCsv`, and `sticky`.
- That heuristic and its attributes were removed because physical data size does not establish whether a reader needs copying or frozen columns.
- The same `<DataTable>` could otherwise appear as two different components across an invisible threshold: 20 rows showed a simple table, while 21 suddenly added controls.
- In a scan of 49 inline tables in a real note vault, only four crossed the threshold, all from the same daily dataset. The 92%/8% split had no relationship to content meaning.
- A long explanatory cell could also classify a tiny three-row, two-column table as complex and add a copy button.
- Content-aware layout remains. It decides how the same table fits its container, not which table deserves extra features.

---

## Layout: three modes and column widths

> Layout measures columns, chooses an overall mode, and distributes remaining space.

**Column classification**

- Headers and cell contents classify each column as numeric, date, short enumeration, ordinary text, explanation, long text, or hard-long-token text.
- Explanation columns are recognized from explanatory header/content terms such as definitions, paths, or notes. Hard-long-token columns contain long unbreakable values such as IDs.
- Each category has its own minimum/maximum widths and estimation formula. Estimates use visual character width: full width for CJK characters and roughly half width for ASCII.
- Numeric and date columns are naturally compact and stable. Explanation and long-text columns benefit from more space.

**Overall mode**

| Mode | Condition | Behavior |
| --- | --- | --- |
| `scroll` | At least 8 columns, combined minimum widths exceed a threshold, or hard-long-token columns make the table too wide | Fixed pixel table and column widths inside a horizontally scrolling container |
| `fit` | Not `scroll`, with a narrow total width and at most 3 columns | Fill the container with percentage column widths |
| `wrap` | All other cases | Fill the container and allow long text to wrap |

- Prefer a fully visible table when it remains readable. Use horizontal scrolling when compression would make columns unreadable.
- Unbreakable tokens need their own trigger because wrapping cannot absorb their width.
- In non-scrolling modes, distribute spare container width by column type: explanation columns receive the highest weight, long text next, and numeric/date columns the lowest.
- Extra space goes where it improves reading instead of being divided equally.

---

## One renderer for inline and dataset sources

> The view accepts rows, column order, and optional header labels, footnotes, and granularity controls.

- **Inline mode:** shared row extraction handles fenced CSV/TSV/JSON, bare JSON, Markdown tables, and bare CSV. Columns come from an explicit attribute or the union of row keys.
- **Dataset mode:** the query provides aggregated rows, column order, and header labels as prefetched data to the same view. The body must be empty; `from` and `to` specify the range. Dataset and inline data are mutually exclusive for the reasons in [Chart design](chart.md).
- Both sources have identical layout behavior, so moving growing data from an inline body to a dataset does not change the table's presentation.
- The pure layout functions need only one implementation and test suite.

**Deliberate boundaries**

- Header display-name mappings come only from dataset manifest field labels through query results. They cannot be supplied as tag attributes, whose values are strings rather than mapping objects.
- The user guide makes this restriction explicit instead of implying that an ignored attribute works.
- Chart excludes granularities that produce too many time buckets for readable charts. DataTable has no such density restriction because long tables can scroll.

---

## Granularity changes without file I/O

> Dataset tables share Chart's controlled in-memory query and rebuild model.

- Read the manifest and data rows once at initial rendering.
- Rerun queries in memory and redraw the table in place on each granularity change.
- Keep granularity state in the outer shell. The table view is stateless and displays the supplied result.
- A field with no rollup may pass through at source granularity but cause a coarser query to fail.
- On failure, retain the last successful table and show the error immediately below it. Clear the message after the next successful switch.

---

## Related documents

> Shared query semantics and user-facing references complement this design.

- [architecture.md](architecture.md): external data contracts and error handling.
- [chart.md](chart.md): shared query and controlled-rebuild behavior.
- [DataTable guide](../guides/data-table.md) and [Dataset guide](../guides/dataset-guide.md): usage, attributes, and troubleshooting.

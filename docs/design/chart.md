# Chart design

> Chart is Mosaic's only block rendered by a charting library and the only one with three syntax forms.
> This document explains syntax choices, data boundaries, chart types, label readability, and formatting; see the [Chart guide](../guides/chart.md) for usage and attributes.

## Why three syntax forms?

> Three forms serve different writing situations while sharing one attribute contract and renderer.

| Form | Scenario | Rationale |
| --- | --- | --- |
| Self-closing tag | Maintained reports with external data | The note selects a range and granularity without embedding data. Data updates leave prose unchanged, and there is no fenced tag body to split at paragraph boundaries. |
| Paired tag | Small, one-off snapshots | Inline data makes the note self-contained and portable by copy and paste. |
| Code block | Either data mode | The host passes the entire block to the plugin. One-attribute-per-line frontmatter avoids tag paragraph-splitting traps and supports non-ASCII attribute names, such as label/color overrides for Chinese field names. Tag attribute names must be ASCII. |

- The host creates the need for multiple forms: tag opening lines must stay on one line, and paired-tag bodies cannot contain blank lines.
- Code blocks avoid those restrictions but look less like inline components in prose.
- Authors can choose the form that fits their work without changing the meaning of an attribute.

---

## Inline and external data boundaries

> A chart uses either inline data or an external dataset, never both.

- Inline rows appear in written order and have no time-range or source-granularity semantics. Dataset-only attributes `dataset`, `from`, `to`, `granularity`, and `granularityOptions` produce errors in inline mode. Silently ignoring them would imply that granularity controls work.
- A dataset reference combined with an inline body also fails. Rather than invent precedence or row-alignment rules, Mosaic rejects two competing sources.
- Inline numeric columns accept numbers or blank cells. Blanks create line gaps. Invalid values report the row number; small, visible inline datasets make strict validation useful and inexpensive.

---

## Chart types and axis semantics

> Six chart types cover common comparisons over time, with zero-inclusive axes aligned with OpenGlance.

- `line` shows trends.
- `bar` shows a single series of amounts.
- `grouped-bar` compares multiple series side by side.
- `stacked-bar` shows contributions to a total.
- `combo` and `combo-dual-axis` combine bars and lines, including amount/rate comparisons.
- Default inference chooses a line for multiple series and bars for one series.

**Combination charts**

- **`combo`, one scale:** bars and lines share a domain covering both sets of values and zero, extending downward for negative values. This supports same-unit magnitude comparisons. Legend order follows attribute order: writing `lines` first puts line series first.
- **`combo-dual-axis`, independent axes:** each side has its own domain and unit, with bars always on the left axis. Different units or very different magnitudes can coexist. A fixed assignment gives readers a predictable rule: bars use the left axis.

**Domains**

- Stacked bars accumulate positive and negative contributions separately from zero. The Y domain covers both cumulative endpoints, with the positive limit based on each period's positive stacked total.
- A net total would cancel contributions and clip real bars. Other types use individual extrema, so the domain follows the geometry being displayed.
- All Y axes preserve OpenGlance's zero-inclusive semantics. Lines and both sides of dual-axis charts do not truncate positive lower bounds, keeping relative changes comparable across hosts.
- Including zero does not force a zero minimum: negative values remain visible, and both roles in a single-axis combo share the same negative lower bound.
- All-zero data uses a nondegenerate range so zero remains a baseline rather than appearing in the middle of the canvas.

---

## Readable value labels

> Value labels make charts useful for exact-value reading, but must remain legible on colored marks and in dense layouts.

- **Theme-aware outlines.** A near-background stroke around light text separates labels from colored bars, especially in dark themes. Labels remain readable across series colors. Theme changes rebuild the chart in place, as described in [Overall architecture](architecture.md).
- **Collision handling.** Overlapping labels are worse than a few omitted labels. First shift out-of-bounds labels into the plot, then hide overlaps, then hide labels that still do not fit. Combination charts do not receive this pipeline by default from the library, so Mosaic configures it explicitly for consistent behavior.
- **Shift endpoints before hiding.** Labels on the first and last points naturally extend beyond plot edges. Hiding them before trying to shift them would remove two commonly referenced values from every line.
- Positive Y-axis upper limits add 8% headroom so peak labels have room above the data.
- HTML tooltip construction belongs only at the renderer boundary. Preserve raw source values and canvas labels rather than escaping or rewriting them upstream.

---

## Unit formatting

> Formatting changes presentation, not data.
> Numbers use grouping separators and at most two decimal places.

- Percent signs follow each value: `42%` is easier to read than a value whose percent unit is shown elsewhere.
- Currency aliases normalize Chinese and English spellings to a `¥` or `$` prefix.
- Other units appear once beside the title. Repeating words such as "items" or "people" on every label adds visual noise.
- Units are not Y-axis titles. Even horizontal axis titles reserve their measured width and squeeze the plot, while a dual-axis chart needs room for two units.
- Parentheses beside the title avoid taking plot space or depending on canvas text measurement.
- Dual-axis units apply the same rules independently and share that title-side position as `left / right`. The fixed order identifies the corresponding axes.

---

## Controlled granularity rebuilding

> Dataset charts load the manifest and source rows once, then rebuild from memory through a retained query closure.

- Each granularity change reruns the query and configuration construction with **zero file I/O** and no Markdown changes.
- The chart shell retains the closure and uses the last successfully accepted result for both the displayed data and selected button.
- Theme and width rebuilds reuse the same closure with the active settings.
- Failed switches, such as a query with no complete periods, preserve the previous chart and selection while showing an in-place error.
- A configuration already consumed by the chart library is not resubmitted. Only a successful rebuild accepts the new result and clears the error.
- Initial choices are negotiated as the intersection of requested granularities, safe rollups, and chart density limits. Every offered choice is structurally supported by the data.
- A single remaining choice still appears as a selected button. Hiding it would imply that granularity has no meaning for the chart rather than showing that only one option is available.
- Inline charts have no manifest, source granularity, or per-field rollups and therefore show no granularity controls.

---

## Related documents

> Shared architecture and user guides provide the surrounding contracts.

- [architecture.md](architecture.md): host timing, theme changes, and error handling.
- [data-table.md](data-table.md): the other consumer of external dataset queries.
- [Chart guide](../guides/chart.md) and [Dataset guide](../guides/dataset-guide.md): usage, attributes, and troubleshooting.

# MetricGrid design

> MetricGrid arranges key values in an adaptive card grid.
> Its main decisions concern responsive layout, status colors, and field aliases; see the [MetricGrid guide](../guides/metric-grid.md) for usage.

## Adaptive grid

> The grid chooses its column count from the available width rather than a user setting.

- Notes can contain three KPIs or ten, and containers vary from sidebars to split panes and full-width views.
- Each card has a minimum readable width of roughly 150px. CSS fits as many columns as the container allows and wraps the rest.
- A fixed-column attribute would force users to adjust layouts for each width or accept compressed and overflowing cards.
- Minimum width with automatic filling keeps one note usable across panel sizes without separate syntax.

**Card content**

- `label`: small, muted text identifying the metric.
- `value`: large, bold text and the card's visual focus.
- `delta`: secondary text showing the change.
- `note`: small, muted text describing the definition or source.
- Render each slot only when it has content. Missing slots leave no blank line.
- Delta text keeps a neutral color. Status appears only in the top border, separating status semantics from domain-specific conventions such as red financial numbers.

---

## Four status colors and inference

> Status maps to `good` (green), `risk` (red), `watch` (orange), or `neutral` (no color).

- These represent three actionable signals—improvement, warning, and observation—plus a default.
- More levels would be harder to remember and distinguish visually.

**Resolution**

1. **Vocabulary normalization:** terms such as `up / positive / success` map to good, `down / negative / warning / blocked` map to risk, and `flat / neutral / watch` map to watch. Accepting common status and trend words avoids requiring one exact vocabulary.
2. **Sign-prefix inference:** the source falls back from the status column to trend and then delta. A leading `+` means good, while a leading `-` means risk. Common deltas such as `+5%` and `-3%` therefore carry their own direction without an extra field.

- Explicit status is the strongest signal because it states the author's intent. Trend and delta are fallback evidence.
- "Higher is better" is only the default assumption. Authors must set status explicitly for inverse measures such as cost or churn.
- Unknown values become neutral without errors.
- Coloring requires a clear vocabulary or sign match. A wrong warning color is more misleading than no color.

---

## Field alias tradeoffs

> Priority-ordered alias chains let exported or pasted data work without column renaming.

- `label`: label → metric → name → title.
- `value`: value → current → amount → count.
- `delta`: delta → change → mom → yoy.
- `note`: note → description → source → body.
- Each chain selects the first nonempty value.
- Accepting aliases lowers migration effort but introduces implicit precedence when two candidate columns coexist.
- Metric fields have narrow meanings, so accepting common names is more useful than rejecting otherwise usable data because one column uses a different word.

**Filtering and errors**

- Discard rows where both label and value are empty, such as blank rows left in an export.
- Report an error when the payload produces no rows at all.
- If rows exist but all are filtered out, render an empty grid without an error.
- That intermediate state often means column names do not yet match the aliases. It differs from supplying no data and does not need to interrupt reading.

---

## Related documents

> Shared architecture and sibling blocks explain the surrounding decisions.

- [architecture.md](architecture.md): entry recognition and error handling.
- [timeline.md](timeline.md): another block with vocabulary-based status normalization.
- [MetricGrid guide](../guides/metric-grid.md): usage and attributes.

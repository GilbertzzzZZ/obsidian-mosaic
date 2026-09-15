# DecisionBox design

> DecisionBox presents a decision as a card with status badges, structured label/value rows, or short prose.
> Empty content is valid by design; see the [DecisionBox guide](../guides/decision-box.md) for usage.

## Why status colors the left border

> The border expresses normalized decision status, while the badge preserves the author's words.

- Normalized `status` gives accepted cards a green border, rejected cards red, proposed cards the theme accent, and superseded cards gray. Missing or unknown values add no status color.
- A left border fits a narrative block and visually distinguishes decision cards from MetricGrid's top-bordered metrics.
- The view previously emitted `is-accepted` and `is-rejected` classes without corresponding stylesheet rules. Accepted and rejected cards consequently looked identical despite their computed states. MetricGrid top borders, Timeline dots, and FlowDiagram node fills provided the comparison cases.
- Badge text comes directly from the attribute: `done` remains `done`. Border color uses normalization: `done` → `accepted` → green.
- Keeping the two values separate preserves user wording while giving colors consistent meaning.

---

## Structured rows and rich-text fallback

> Both a carefully structured decision and a short explanation are valid input.

- A structured record might say "Decision: use option A / Cost: two weeks of migration / Review: next quarter."
- An unstructured record can be a paragraph and a few bullets.
- **Structured path:** when parsing produces at least one row with a label or value, render a two-column definition list. Label aliases are `key/name/item`; value aliases are `text/body/description/summary`. Filter rows with neither.
- **Rich-text fallback:** when no label/value entries remain, render the complete payload as lightweight paragraphs and unordered lists.
- The label column is narrow and flexible with a minimum width. The content column takes the rest, with dividers between rows.
- Short labels such as "Decision", "Cost", and "Review" align into a scan line, while multiline explanations get the space they need.
- The parsed result chooses the path, not a mode switch. Table-like content yields rows; prose yields paragraphs.

**Shared header**

- A fixed `Decision` label identifies the block and is not configurable.
- An optional title follows it.
- Up to three badges show status, owner, and source in that fixed order, making multiple cards easy to compare by position.
- Both body paths use exactly the same header.

---

## Status normalization has two roles

> The normalized value selects a variant class; the original value remains visible in the badge.

- `accepted`, `proposed`, `rejected`, and `superseded` retain their canonical decision lifecycle states.
- `done`, `complete`, and `completed` normalize to `accepted`.
- Any other nonempty value becomes `default`.
- A missing value means no status and no status badge.
- Variant styling can evolve without changing badge text because the class and the displayed value are independent.

---

## Why empty content is valid

> A decision's header can be a complete record without a body.

- DataTable, MetricGrid, Timeline, and FlowDiagram report an empty payload because there is no data to draw.
- DecisionBox has no mandatory body data: title, status, owner, and source can already explain what was decided, by whom, and in what state.
- The body is optional elaboration. A header-only card carries information.
- Rich-text fallback also makes an empty/nonempty error boundary unhelpful: every unstructured string is valid prose, including its empty limiting case. Treating an empty string as an error but a space as valid would add no useful distinction.
- If there are no structured entries, use rich text. If that is empty too, render only the header.
- Invalid payload syntax can still produce an error box, such as a JSON fence containing invalid JSON. This is malformed content, not missing content.
- This follows the [overall error-handling design](architecture.md): tolerate absence, report explicit errors.

---

## A deliberately small Markdown subset

> The prose path and structured values support only the formatting needed for a short decision explanation.

- **Inline:** backtick code and double-asterisk bold. Italics, links, strikethrough, and images are outside the subset.
- **Block-level:** paragraphs separated by blank lines and unordered lists beginning with a hyphen or asterisk. Ordered lists, headings, blockquotes, and nested lists are outside the subset.
- Join line breaks within a paragraph with spaces.
- Code covers identifiers and configuration values. Bold covers key conclusions.
- More elaborate formatting usually calls for a separate note referenced by the card, rather than a document embedded inside it.
- The small subset is easy to predict and explain. Full Markdown would bring a complete rendering pipeline into each card for infrequent needs.
- Unsupported markup remains literal text. Italic markers, for example, stay visible rather than disappearing or producing an error.

---

## Related documents

> Other blocks use similar normalization mechanisms for different content semantics.

- [architecture.md](architecture.md): recognition failures versus errors in recognized content.
- [metric-grid.md](metric-grid.md) and [timeline.md](timeline.md): domain-specific status vocabularies.
- [DecisionBox guide](../guides/decision-box.md): usage, attributes, and examples.

# Apache ECharts Evaluation

Subject: Apache ECharts **6.1.0** (source checkout, commit `30076ae`, 2026-08-04; npm `echarts@6.1.0` published on 2026-05-19)
Research date: 2026-08-16
Evidence: primarily line-by-line source verification, supplemented by measured bundles; official documentation cited only where source code cannot answer the question

---

## Conclusion in Brief

Fourteen of the sixteen requirements are built in or need only one configuration option. With selective imports, the bundle is **about 1MB smaller** than the current `@ant-design/plots` bundle (measured: 1.57MB → 0.58MB). Published artifacts target ES3, posing no ES2017 compatibility risk, and v6's new `chart.setTheme()` avoids destruction and reinitialization on theme changes. For this plugin, migrating to ECharts means less code, a smaller bundle, and more capabilities. The only bridge we must maintain ourselves is CSS variables → color values, which the current implementation already needs.

---

## 1. Ecosystem

### 1.1 Package Inventory

| Package | Purpose | Maintenance status (latest version · release date · age at research date) | Required? |
| --- | --- | --- | --- |
| `echarts` | Main library: all 23 series and 28 components | 6.1.0 · 2026-05-19 · 3 months ago | ✅ **The only package requiring explicit installation** |
| `zrender` | Canvas/SVG rendering foundation; ECharts' graphics layer | 6.1.0 · 2026-05-04 · 3.5 months ago | ✅ Installed automatically as an `echarts` dependency |
| `tslib` | TypeScript runtime helpers | 2.3.0 (pinned version) | ✅ Automatic transitive dependency |
| `echarts-gl` | 3D charts / globe / GL-accelerated scatter plots | 2.1.0 · 2026-05-28 · 2.6 months ago | ❌ Only needed for 3D |
| `echarts-wordcloud` | Word-cloud series | 2.1.0 · **2022-11-24 · 3 years 9 months ago** | ❌ Effectively unmaintained; peer declaration only covers `echarts ^5.0.1` |
| `echarts-liquidfill` | Liquid-fill charts | 3.1.0 · **2021-09-18 · nearly 5 years ago** | ❌ Unmaintained |
| `echarts-stat` | Statistical transforms: regression / histograms / clustering | 1.2.0 · **2020-11-03 · 5 years 9 months ago** | ❌ Unmaintained |
| `echarts-graph-modularity` | Community-detection layout for graphs | 2.1.0 · **2021-10-15 · nearly 5 years ago** | ❌ Unmaintained |
| `echarts-extension-amap` / `-gmap` | Amap / Google Maps coordinate systems | 1.12.0 · 2024-01 / 1.7.0 · 2024-09 | ❌ **Community packages** (`plainheart/`, not apache/ecomfe) |
| `vue-echarts` | Vue 3 wrapper | 8.1.0 · 2026-08-07 · 9 days ago | ❌ Official (ecomfe), active |
| `echarts-for-react` | React wrapper | 3.0.6 · 2026-01-21 | ❌ **Community package** (`hustcc/`) |
| `@types/echarts` | Type definitions | 5.0.0 · marked **deprecated** on npm | ❌ **Never install**; the main package includes `types/dist/*.d.ts` |

### 1.2 Two Organizations: An Important Distinction

ECharts itself was donated to the Apache Foundation; its extension ecosystem was not. The 13 repositories under `apache` cover **the main library, documentation, and tooling sites** (echarts, echarts-doc, echarts-examples, echarts-handbook, echarts-website, echarts-www, echarts-theme-builder, echarts-mcp, echarts-custom-series, echarts-from-mermaid, echarts-bot, echarts-bar-racing, echarts-wordcloud-generator). None is archived; the main library's latest commit was on 2026-08-04.

All runtime extensions (**including zrender**) are under `ecomfe` (Baidu's frontend team), outside ASF governance.

⚠️ **Pitfall**: GitHub's `pushed_at` for wordcloud / liquidfill / stat / graph-modularity under `ecomfe` all says 2024-03-12, suggesting ongoing activity. Inspecting the commits shows a one-off batch README update. Actual code activity stopped in 2022-11 / 2021-09 / 2021-06 / 2021-10, respectively. **Do not use `pushed_at` to judge whether these packages are maintained.**

### 1.3 What One Package Provides

In `package.json`, `exports["."]` → `./index.js`; `build/pre-publish.js:119` shows that `index.js` is the compiled and renamed `src/echarts.all.ts`. `src/echarts.all.ts` already calls `use()` for 2 renderers, 23 charts, 28 components, and 5 features.

**Bars / lines / pies / scatter plots, dual-axis combinations, legends, tooltips, markArea/markLine, data labels, and PNG export are all in `echarts`: one dependency entry.** Both PNG export paths are in the main package: programmatic `chart.getDataURL()` (`src/core/echarts.ts:969`) and the toolbox `saveAsImage` feature (`src/component/toolbox/install.ts:37`).

There are 785 occurrences of `from 'zrender/src/...'` under `src/`, with no other third-party runtime imports.

---

## 2. Chart-Type Coverage

There are 23 built-in series (`src/chart/`): line, bar, pie, scatter, effectScatter, radar, map, tree, treemap, graph, chord, gauge, funnel, parallel, sankey, boxplot, candlestick, lines, heatmap, pictorialBar, themeRiver, sunburst, and custom.

| Chart type | Support | Package or module | Extra dependencies | Limitations |
| --- | --- | --- | --- | --- |
| Bar / line / pie / scatter | ✅ Native | Main package `src/chart/{bar,line,pie,scatter}` | None | None |
| Relationship / network graph | ✅ Native | `src/chart/graph/` | None | Only `none` / `force` / `circular` layouts (`GraphSeries.ts:160`). Edges support arrows (`edgeSymbol`) and labels |
| Flowchart (automatic layout) | ⚠️ Partial | `graph` or `custom` | None | **No layered DAG layout**. `layout:'none'` requires computing each node's coordinates yourself; no obstacle-avoiding orthogonal routing |
| Mind map | ⚠️ Approximation | `src/chart/tree/` | None | Reingold-Tilford layout with collapse/expand support; **edges cannot have arrows or labels**. Strictly single-root trees; no cross-branch edges or bidirectional left/right branching |
| Tree charts | ✅ Native | `tree` / `treemap` / `sunburst` | None | None |
| Gantt | ❌ No native support | `custom` only | None | No `gantt` directory under `src/chart/`; the only repository-wide grep hit is a comment linking to an official example at `CustomSeries.ts:438`. Official issue #19579 opened in 2024-01 and remains open |
| Sankey | ✅ Native | `src/chart/sankey/` | None | None |
| Funnel | ✅ Native | `src/chart/funnel/` | None | None |
| Map | ⚠️ Engine provided, data omitted | `src/component/geo/` + `src/chart/map/` | **Supply your own geoJSON/SVG** | Built-in map data removed in v5; using a map without `registerMap` throws. Maps of China also require compliance with map review-number rules |
| Pivot table / crosstab | ⚠️ Static cells only | `src/component/matrix/`, new in v6 | None | Nested multilevel headers and `mergeCells`, but **data must be enumerated cell by cell**. No sorting, filtering, or virtual scrolling; not a DOM `<table>` (no text selection/copying) |
| Timeline | ⚠️ Different semantics | `src/component/timeline/` | None | A **playback controller for multiple option snapshots**, not an event timeline chart |
| Gauge | ✅ Native | `src/chart/gauge/` | None | None |
| Word cloud | ❌ Not built in | `echarts-wordcloud` | Installation required | Unmaintained; no declared v6 support |
| Calendar heatmap | ✅ Native | `src/coord/calendar/` + `heatmap` | None | Heatmap **requires visualMap** (`HeatmapView.ts:114` throws directly) |
| Boxplot / candlestick / radar / parallel coordinates / sunburst / theme river / chord | ✅ All native | Main package | None | chord is new in v6 |
| 3D | ❌ Not built in | `echarts-gl` | Installation required | The only extension adapted to v6 (2.1.0 declares `^6.0.0`) |
| pictorialBar / lines / custom | ✅ Native | Main package | None | v6 adds `registerCustomSeries()` to package custom implementations as named, reusable series |
| thumbnail (new in v6) | ✅ | `src/component/thumbnail/` | None | Minimap; source comments explicitly say only graph is currently supported |

### Gaps Requiring Another Library

1. **Gantt charts**: no native series; using custom amounts to implementing a Gantt engine yourself.
2. **Flowcharts / DAGs with automatic layout**: `src/chart/graph/install.ts` registers only simple / circular / force layout handlers.
3. **Real data tables / pivot tables**: no table series; matrix draws static cells, and `dataZoom` does not support matrix.
4. **Full mind maps**: tree edges lack arrows and labels; no two-sided branching.
5. **Any 3D**: requires `echarts-gl`.
6. **Word clouds and liquid fills**: the extension ecosystem is effectively inactive.
7. **Map data itself**: the engine has geo coordinates but includes no map data.
8. **Venn, waterfall, and bullet charts**: no corresponding directories under `src/chart/`.

**Implications for this plugin**: the core scope (bar / line / pie / scatter / combination / calendar heatmap / Sankey / funnel / gauge) is fully covered without extra dependencies. The three hard gaps (Gantt, automatically laid-out flowcharts, and data tables) were already outside this plugin's direction.

---

## 3. Sixteen-Requirement Comparison

> Ratings: **Built-in default** / **One configuration option** / **A little code (<10 lines)** / **Custom implementation required** / **Not possible**

| # | Requirement | Finding |
| --- | --- | --- |
| 1 | Configurable line thickness | One configuration option |
| 2 | Data-label collision avoidance: shift first, hide as fallback | **One configuration option (both can apply together)** |
| 3 | Remove a duplicate right axis in combination charts | One configuration option |
| 4 | Center numbers within stacked-bar segments | Centering: built-in default; hiding thin-segment labels: one option (semantics differ) |
| 5 | Legend marker dimensions and shapes | One option + one hard-coded value to work around |
| 6 | Center legend at the top | One configuration option |
| 7 | Position unit text | One configuration option |
| 8 | Tooltip layout / brighter text / text stroke / border | Layout and border: one option; **text stroke: a little CSS code** |
| 9 | Mark a specific x value | One configuration option ×2 |
| 10 | 8% y-axis headroom + rounded ticks | Rounded ticks: built-in default; headroom: one option (different calculation basis) |
| 11 | Follow theme changes and rebuild | **A little code (v6 `setTheme` avoids destruction and reinitialization)** |
| 12 | PNG export | One option (official API, but avoid the toolbox path) |
| 13 | Numeric-label stroke | **Built-in default (stroke is naturally behind the text)** |
| 14 | Flip label direction for negative values | One option (automatically follows the sign) |
| 15 | Hover column background band / vertical line | Vertical line: built-in default; background band: one option |
| 16 | Dual-axis combination chart | One configuration option |

**Of the sixteen requirements, 0 require a custom implementation and 0 are impossible**. Of these, 14 are built-in defaults or one configuration option; only tooltip text strokes and theme tracking need a little code (<10 lines each).

### Three Findings Verified in Depth

#### A. `hideOverlap` and `moveOverlap` Work Together: Shift First, Then Hide Remaining Collisions

This determines the finding for requirement 2. I verified it line by line:

```ts
// src/label/LabelManager.ts:442-469
layout(api) {
    const labelList = [...];                                    // :446-451 All candidate labels

    const labelsNeedsAdjustOnX = filter(labelList, i => i.layoutOption.moveOverlap === 'shiftX');  // :453
    const labelsNeedsAdjustOnY = filter(labelList, i => i.layoutOption.moveOverlap === 'shiftY');  // :456

    shiftLayoutOnXY(labelsNeedsAdjustOnX, 0, 0, width);         // :460  ← Shift first
    shiftLayoutOnXY(labelsNeedsAdjustOnY, 1, 0, height);        // :461

    const labelsNeedsHideOverlap = filter(labelList, i => i.layoutOption.hideOverlap); // :463
    restoreIgnore(labelsNeedsHideOverlap);                      // :467
    hideOverlap(labelsNeedsHideOverlap);                        // :468  ← Then hide
}
```

Both `filter` stages operate on **the same `labelList`** and are not mutually exclusive. Labels specifying both `moveOverlap` and `hideOverlap` enter both stages in sequence. The type comment at `src/util/types.ts:1528-1543` explicitly defines this contract:

> "If move the overlapped label. If label is still overlapped after moved. It will determine if to hide this label with `hideOverlap` policy."

The `hideOverlap` implementation (`src/label/labelLayoutHelper.ts:522-576`) uses **post-shift** rectangles (`ensureLabelLayoutWithGeometry`), confirming the sequence: shift → remeasure → hide.

```js
labelLayout: { moveOverlap: 'shiftY', hideOverlap: true }
```

**Pitfalls**:

- The `moveOverlap` type declares `'shuffleX'` / `'shuffleY'` (`types.ts:1537-1538`), but `layout()` only filters for `'shiftX'` / `'shiftY'`. There is no shuffle implementation anywhere else: **these two values do nothing**.
- Retention priority is the host element's area (`LabelManager.ts:267`, `priority: hostRect.width * hostRect.height`); labels on larger bars take precedence. This policy is not configurable.
- **Specify `labelLayout` on every series**: at `LabelManager.ts:306-313`, an empty `seriesModel.get('labelLayout')` causes an immediate `return`; that series' labels never enter labelList. Each stacked-bar segment belongs to a separate series; an omitted setting excludes it from collision avoidance entirely.
- `echarts/core` already registers `installLabelLayout` by default (`src/export/core.ts:24-29`); no manual `use()` is needed.

#### B. `markArea` for a Category Column: Bars Automatically Cover the Whole Band; Lines Do Not

In `getMarkerPosition(value, dims, startingAtTick)` at `src/chart/bar/BaseBarSeries.ts:97-180`, category axes use `axis.getTicksCoords()` to obtain **tick-line coordinates**, then apply `targetTickId += 1` to the `x1`/`y1` end (unless `axisTick.alignWithLabel` is set). `MarkAreaView.ts:174-197` prefers this method when the series provides `getMarkerPosition`.

On a **bar series**, therefore, `[{xAxis:'March'},{xAxis:'March'}]` covers the entire category band exactly, with automatic width and no coordinate calculations.

⚠️ `grep -rn getMarkerPosition src/` finds only two occurrences: `BaseBarSeries.ts:97` (implementation) and `Series.ts:124` (abstract declaration). **Line series do not have this method**. `MarkAreaView.ts:200-204` falls back to `coordSys.dataToPoint(pt, true)`, which lands at the category **center**, giving a single-category markArea a width of 0. For a band on a line chart, attach it to a bar series in the same grid, or use `markLine` instead.

Other details: `MarkAreaModel.ts:82-107` defaults to `z: 1` (bar uses 2, line 3), so bands naturally sit beneath chart elements. However, `label.show: true` is the default; disable it explicitly if unwanted. markArea is **a child of series**; top-level `option.markArea` only enables it and provides no data entry point.

#### C. Label Stroke: Built In, and Drawn Behind the Text

`src/label/labelStyle.ts:550` maps `textBorderColor` to `textStyle.stroke`; `:592-594` maps `textBorderWidth` to `textStyle.lineWidth` (also `textBorderType` → `lineDash`, `textBorderDashOffset` → `lineDashOffset`).

The key is drawing order. zrender's canvas text rendering (`zrender/src/canvas/graphic.ts:342-356`):

```js
if (style.strokeFirst) {
    ctx.strokeText(...);   // Stroke first
    ctx.fillText(...);     // Fill afterward, covering the inner half
} else {
    ctx.fillText(...);
    ctx.strokeText(...);   // Stroke intrudes into the glyph
}
```

`strokeFirst` **defaults to true**: `DEFAULT_TSPAN_STYLE` at `zrender/src/graphic/TSpan.ts:35` sets `strokeFirst: true`. `zrender/src/graphic/Text.ts:630-632` explicitly sets it again, with the comment `// Fill after stroke so the outline will not cover the main part.` The SVG renderer uses `paint-order: stroke` (`zrender/src/svg/mapStyleToAttrs.ts:76`) for the same result.

```js
label: { show: true, textBorderColor: '#fff', textBorderWidth: 2 }
```

This produces a halo around the text, keeping it readable over chart elements. **This applies only to series label / axisLabel / graphic text; tooltip is an exception (see requirement 8).**

### Requirement Details

**1. Configurable Line Thickness: One Configuration Option**

```js
series: [{ type: 'line', lineStyle: { width: 3 } }]
```

Evidence: the default is `lineStyle: { width: 2, type: 'solid' }` (`src/chart/line/LineSeries.ts:180-181`); `src/chart/line/LineView.ts:639` calls `seriesModel.getModel('lineStyle')`, and `:832-834` calls `polyline.useStyle(defaults(lineStyleModel.getLineStyle(), ...))`. `src/model/mixin/lineStyle.ts:26` maps the option's `width` to canvas `lineWidth`.

⚠️ **Only effective at series level**. `data: [{value, lineStyle}]` cannot change line thickness (the entire line is one polyline). Also, `emphasis.lineStyle.width: 'bolder'` is a special string that takes the +1 branch at `LineView.ts:844`, not a numeric value.

**2. Data-Label Collision Avoidance: One Configuration Option**

```js
series: [{ type: 'bar', label: { show: true }, labelLayout: { moveOverlap: 'shiftY', hideOverlap: true } }]
```

See the evidence in A above.

**3. Hide a Combination Chart's Right Axis When It Duplicates the Left: One Configuration Option**

```js
yAxis: [{}, { show: false }]     // Hide visuals only; the scale still participates in calculations
```

Evidence: `if (!shouldAxisShow(axisModel)) return;` at `src/component/axis/CartesianAxisView.ts:57-59` only blocks view rendering (`shouldAxisShow` reads `getShallow('show')` at `src/coord/axisHelper.ts:287-289`). Axis lines, ticks, labels, names, splitLine, and splitArea all disappear together. `updateAxisTicks` at `Grid.ts:146-174` is independent of `show`, so **scale calculations continue normally**, and lines still map correctly to the hidden right axis. A further benefit: hidden axes do not participate in margin calculations (`Grid.ts:866`), so grid reclaims the right-hand space.

For finer control, `axisLine.show` (`AxisBuilder.ts:679-688`), `axisTick.show` (`:1243-1252`), and `axisLabel.show` (`:1355,1360`) control their own elements independently.

If the right axis is redundant because both axes should share tick positions, add `alignTicks: true` to actually align their ticks, then hide the axis:

```js
yAxis: [{}, { alignTicks: true, show: false }]
```

⚠️ `alignTicks` has **no default value** in `axisDefault.ts` (only its type declaration and read sites occur throughout src), so it defaults to false. Both conditions that disable it are at `Grid.ts:733-741`: the axis is not interval/log (category axes are unsupported), or the axis has an explicit `interval`. **With `show:false` alone, without `alignTicks`, the axes can have different tick counts, making the relative heights of bars and lines misleading.**

**4. Center Numbers in Stacked-Bar Segments: Centering Is Built In; Hiding Thin-Segment Labels Takes One Option, with Different Semantics**

```js
series: [
  { type:'bar', stack:'t', label:{show:true}, labelLayout:{hideOverlap:true} },
  { type:'bar', stack:'t', label:{show:true}, labelLayout:{hideOverlap:true} }
]
```

- Centering: `src/label/labelStyle.ts:354-355` defaults to `'inside'` when normal-state `position` is omitted. `src/chart/bar/BarView.ts:1031-1041` calls `setLabelStyle(el, ...)` for each data item, where `el` is **that segment's own Rect**. For `'inside'`, zrender's `calculateTextPosition` uses `x += width/2, y += halfHeight`: the geometric center.
- Automatic text contrast: inside positioning calls `getInsideTextFill()` for white text on dark backgrounds and black text on light backgrounds, making Chinese labels readable by default.
- ⚠️ **There is no source-code rule to hide labels when segments are too thin**. The only two assignments to `el.ignore` in `BarView.ts` (`:313`, `:433`) both use `isClipped` (clipping outside the coordinate system), unrelated to label dimensions. Only the matrix component uses `autoOverflowArea`; bar never enters that automatic containment path.
- The built-in fallback is `hideOverlap`, which tests intersections **between label rectangles**, not between labels and bars. This happens to work for stacked bars: priority = host area (`LabelManager.ts:267`), so a thin segment's label is hidden when it overlaps a thicker segment's label.
- For pixel-exact hiding when the segment is shorter than the label, use a `labelLayout` callback (which receives both `rect`, the segment, and `labelRect`, the label itself):

  ```js
  labelLayout: p => ({ fontSize: p.rect.height >= p.labelRect.height + 4 ? 12 : 0 })
  ```

  `LabelLayoutOption` (`src/util/types.ts:1516-1569`) has **no `show` / `ignore` fields**; `fontSize: 0` is the only way to hide a label from the callback.
- ⚠️ Labels hidden by `hideOverlap` reappear in the emphasis state (`labelLayoutHelper.ts:530-538`), causing text to pop up on hover.

**5. Legend Marker Dimensions and Shapes: One Option + One Hard-Coded Value to Work Around**

```js
legend: {
  top: 0, left: 'center',
  itemWidth: 12, itemHeight: 12,
  icon: 'rect',                            // Default 12×12 square
  textStyle: { padding: [0, 0, 0, -1] },   // Hard-coded 5px → 4px
  data: [
    { name: 'Bar series' },
    { name: 'Line series', icon: 'path://M0,0L12,0L12,4L0,4Z' }   // Horizontal bar, 12 wide × 4 high
  ]
}
```

- `itemWidth` / `itemHeight` are **global, with no per-item support**: `LegendView.ts:398-399` reads them from legendModel; a grep across `src/component/legend/` finds no reads from legendItemModel. The default is 25×14 (`LegendModel.ts:470-471`).
- The 12×12 square is exact: the built-in symbol branch of `createSymbol` (`util/symbol.ts:366-376`) directly uses `width: w, height: h`; `keepAspect` does not affect built-in symbols.
- A line series' 12×4 horizontal bar requires `path://`, but **no custom code**. Two research passes disagreed here; I resolved this through source inspection. `symbolKeepAspect` is read **per item** (`LegendView.ts:403`, from legendItemModel) and defaults to `true` (`LegendModel.ts:473`). The `path://` branch of `createSymbol` calls `makePath(..., keepAspect ? 'center' : 'cover')` (`util/symbol.ts:358-364`) → `graphic.ts:184-198` → `centerGraphic` (`:240-264`). With a 12×4 path bbox in a 12×12 box: `aspect = 12/4 = 3`, `width = rect.height * aspect = 36 > rect.width = 12` → `width = 12, height = 12/3 = 4`, vertically centered. **A single legend can show squares for bars and horizontal bars for lines; two legend components are unnecessary** (built-in symbols cannot do this, since their global `itemWidth/itemHeight` cannot be bypassed).
- For per-item `icon` behavior, `LegendView.ts:422-424` calls the series' own `getLegendIcon` only when `icon` is unset or is `'inherit'`. A line series' default icon is a horizontal line with a circle (`LineSeries.ts:236-281`); setting `icon` explicitly bypasses it entirely.
- ⚠️ **The marker-to-text gap is hard-coded to 5px**: `LegendView.ts:455`, `const textX = itemAlign === 'left' ? itemWidth + 5 : -5;` (rechecked: a literal, with no configuration option). A 4px gap requires negative padding. `labelStyle.ts:527-531,654-660` copies `legend.textStyle.padding` into textStyle; zrender's left-aligned layout simply adds `x + textPadding[3]`, so negative values work. **Side effect**: padding contributes to boundingRect, affecting `itemGap` layout and hitRect width.
- ⚠️ Although its type suggests per-item support, `formatter` is read through `legendModel.get('formatter')` at `LegendView.ts:458`: **per-item formatter has no effect**.

**6. Legend Centered at the Top: One Configuration Option**

```js
legend: { top: 0 }     // left: 'center' is already the default and can be omitted
```

Evidence: `left: 'center'` is indeed the default (`LegendModel.ts:457`); `util/layout.ts:352-356` implements `case 'center': left = containerWidth/2 - width/2 - margin[3]`.

⚠️ **v6 defaults to the bottom, not the top**: `LegendModel.ts:460` sets `bottom: tokens.size.m` (= 15); `// top: 0` at `:459` is **the commented-out v5 default**. Options migrated from v5 that rely on top placement by default will put the legend at the bottom in v6.

Setting only `top: 0` does clear the default `bottom: 15`. `LegendModel.ts:251-261` declares `layoutMode = { type:'box', ignoreSize:true }`; in the `ignoreSize` branch at `util/layout.ts:711-720`, a `top` in newOption sets `bottom` to null, avoiding a conflict.

**7. Positioning Unit Text: One Configuration Option**

```js
yAxis: [
  { name: 'Unit: CNY 10,000', nameLocation: 'end', nameGap: 12, nameRotate: 0,
    nameTextStyle: { align: 'left', color: '#888', fontSize: 11 } },
  { name: 'Unit: %', nameLocation: 'end', position: 'right' }
]
```

- `nameLocation` already defaults to `'end'` (`src/coord/axisDefault.ts:34,47`, `nameGap: 15`), meaning the top end for a y axis. Positioning math is at `AxisBuilder.ts:855-871`; rotation follows `:891-893` → `endTextLayout` at `:1022-1055`. When `nameRotate` is unset, `rotationDiff = 1.5π` cancels the group's `π/2`, making the text **horizontal on screen**. `:1036-1039` sets `textAlign:'center'` + `verticalAlign:'bottom'`, placing the text **centered directly above the axis tip**. This is the desired default behavior.
- By comparison, `nameLocation: 'middle'` automatically rotates text vertically by 90 degrees (`AxisBuilder.ts:883-888`, where omitted `nameRotate` takes `cfg.rotation`).
- Names for two y axes are completely independent (`axisModelCreator.ts:61-132` is a normal multi-instance ComponentModel); `Grid.ts:1057-1061` also avoids overlapping names on parallel axes.
- Alternatives: the `graphic` component (arbitrary positioning, **with `style.stroke`/`lineWidth` text strokes supported**) or `title.subtext`.

⚠️ Three limitations:

- `nameTextStyle` fields `width` / `overflow` / `ellipsis` are **forcibly overwritten by `AxisBuilder.ts:922-924`** (forcing `overflow:'truncate'`), so setting them has no effect. Use `nameTruncate.maxWidth` to limit width.
- `nameTruncate.placeholder` is **an unused option** in 6.1.0: it appears only in defaults and types; no code reads it.
- `nameGap` measures from **the axis line**, not the outer edge of labels. Also, `nameMoveOverlap` is enabled by default (`AxisBuilder.ts:522-525`) and pushes overlapping axis names farther away (`:973-979`), so changing `nameGap` can appear ineffective. `nameTextStyle.textMargin` actually controls the gap between the axis name and tick labels.

**8. Tooltip: Layout, Border, and Brighter Text Take One Option; Text Stroke Needs a Little Code**

```js
tooltip: {
  trigger: 'axis',
  padding: [6, 8],
  backgroundColor: 'rgba(20,20,20,.92)',
  borderColor: '#555', borderWidth: 1, borderRadius: 6,
  textStyle: { color: '#fff', fontSize: 12, lineHeight: 16 },
  className: 'mosaic-tooltip',                                  // Apply strokes through external CSS
  extraCssText: '-webkit-text-stroke:.3px rgba(0,0,0,.6);'      // Or set them here
}
```

- **Rendered as DOM by default, not canvas**: `TooltipModel.ts:113`, `renderMode: 'auto'` → `util/model.ts:1044-1051`, `env.domSupported ? 'html' : 'richText'`. Electron has `document`, so it uses html; `TooltipHTMLContent.ts:309,326` calls `document.createElement('div')` and attaches it under the container. **CSS therefore works, and tooltips are outside the canvas when exporting PNG** (desirable for this plugin).
- Compact layout: `padding` accepts arrays (html defaults to `10`); omitted `textStyle.lineHeight` produces `'line-height:1'`. Inter-block spacing `HTML_GAPS = [0,10,20,30]` (`tooltipMarkup.ts:103`) is **not configurable**; reducing it requires a custom `formatter`.
- Default content formatting handles Chinese well: name uses `<span>` and **value uses `float:right`** (`tooltipMarkup.ts:437-463`), keeping mixed Chinese/English content aligned. `valueFormatter` is available, but ignored when `formatter` is set.
- ⚠️ **`textBorderColor` / `textBorderWidth` have no effect in tooltips** (rechecked: grep for `textBorder` across `src/component/tooltip/` returns **zero hits**). html mode's `assembleFont` (`TooltipHTMLContent.ts:150-179`) only emits `color` / `font` / `line-height` / `text-shadow` / `text-decoration` / `text-align`; richText mode (`TooltipRichContent.ts:76-118`) only sets `textShadow*`, never the `stroke`/`lineWidth` needed by zrender. **This repeats the trap where documented support never reaches the rendering engine.** Strokes require `extraCssText` (`TooltipHTMLContent.ts:419`, appended last so it can override earlier declarations) or `className` + the plugin's `styles.css` (better suited here because it can use Obsidian theme variables). The native approximation is `textStyle.textShadowColor` + `textShadowBlur`.
- ⚠️ `tooltip.borderColor` is written again through `nearPointColor` during `show()` (`TooltipHTMLContent.ts:418`). **An explicitly set color always takes effect**; when omitted, a `trigger:'item'` border follows the data point's color (by design).
- ⚠️ name and value **have different default sizes and weights** (`tooltipMarkup.ts:65-70`: name 12px/400, value 14px/**900**). Explicitly setting `textStyle.fontWeight` removes the value's extra boldness.
- ⚠️ **Security**: **variable values** in string-template formatters are escaped (`util/format.ts:145-148`), but **function formatter return values are not escaped at all** and go directly to `el.innerHTML` (`TooltipHTMLContent.ts:453`). With chart options sourced from note contents, this is an injection point: `innerHTML` does not execute `<script>`, but `<img onerror=...>` still executes.

**9. Mark a Specific x Value: One Configuration Option ×2**

```js
xAxis: {
  type: 'category',
  data: ['January', 'February', { value: 'March', textStyle: { fontWeight: 'bold' } }, 'April']
},
series: [{
  type: 'bar',
  markArea: {
    label: { show: false },
    itemStyle: { color: 'rgba(255,200,0,.18)' },
    data: [[{ xAxis: 'March' }, { xAxis: 'March' }]]
  }
}]
```

- **Bold an individual axis label**: at `AxisBuilder.ts:1386-1394`, category data items may include `textStyle`; `itemLabelModel = new Model(rawCategoryItem.textStyle, labelModel, ...)` overrides axisLabel styles per category. This is the shortest form.
- Alternative (when x-axis categories are inferred from dataset and no `xAxis.data` is available): `axisLabel.formatter` accepts a function with index (`axisHelper.ts:197-211`); return `{b|March}` and declare `axisLabel.rich: {b:{fontWeight:'bold'}}`. ⚠️ **Declare `rich` explicitly**: `getRichItemNames` at `labelStyle.ts:501-519` only scans keys in `option.rich`, without parsing the formatter string. With empty `rich`, zrender uses plain text and displays `{b|March}` literally. `axisLabel.color` also accepts `(rawValue, index) => color` (`AxisBuilder.ts:1446`), but `fontWeight` has no such callback.
- **Background band**: see B above. For a vertical line on a line chart, use `markLine: { symbol:'none', data:[{ xAxis:'March' }] }`.
- ⚠️ markArea's `z: 1` is below axisPointer (`z: 50`), so hover highlighting overlays the band.

**10. 8% y-Axis Headroom + Rounded Ticks: Rounding Is Built In; Headroom Takes One Option, with a Calculation Caveat**

```js
yAxis: { boundaryGap: [0, '8%'] }
```

- **Tick rounding is the built-in default**: `src/coord/axisNiceTicks.ts:90-97` uses `newIntervalExtent[1] = ceil(extent[1]/autoInterval)*autoInterval` when `max` is unset, raising the axis maximum to an integer multiple of interval. `splitNumber` defaults to 5 (`axisDefault.ts:186`).
- **Headroom**: a value axis defaults to `boundaryGap: [0, 0]` (`axisDefault.ts:172`), consumed at `src/coord/scaleRawExtentInfo.ts:274-291`:

  ```ts
  const span = (dataMM[1] - dataMM[0]) || Math.abs(dataMM[0]);   // :276-278
  noZoomEffMM[1] = dataMM[1] + boundaryGap[1] * span;            // :290
  ```

  ⚠️ **span is the data range, not the maximum; extending min to zero happens after boundaryGap** (`needIncludeZero` is handled at `scaleRawExtentInfo.ts:301-313`, after `:274-291`). For data from 100~110, `boundaryGap: [0, '8%']` adds only `10 × 0.08 = 0.8` headroom. Since the axis includes 0 by default, it becomes 0~110.8: **visible headroom is only 0.7% of axis height**. `'8%'` corresponds to 8% of axis height only when data starts near 0.
  ⚠️ boundaryGap takes effect **before rounding**, so final visible headroom will be ≥8% (rounded up to a tick line).
  ⚠️ **Bare numbers are ratios, not pixels**. The type comment at `axisCommonTypes.ts:156` says "absolute pixel number (like 35)", but **it contradicts the implementation**. `parseBoundaryGapOptionItem` (`:474-481`) calls `parsePercent(opt, 1)`, returning bare numbers unchanged as ratios: `8` means 800%. **Use only `'8%'` or `0.08`.** This is another mismatch between documentation and engine behavior.
- **`max` also accepts a function**: `scaleRawExtentInfo.ts:263-269`, `isFunction(modelMaxRaw) ? modelMaxRaw({min, max}) : modelMaxRaw`. **But there is a trap**: `:271`, `fixMM[1] = noZoomEffMM[1] != null`, means an explicit max skips the `ceil` branch at `axisNiceTicks.ts:95`, **disabling tick rounding**. `src/scale/Interval.ts:282-288` also inserts an extra top tick equal to the exact max (with a label such as `108.16`). With `max`, 8% headroom and rounded ticks are mutually exclusive; only `boundaryGap` provides both.
  Similarly, setting `min` or `max` (including `'dataMin'`/`'dataMax'`) disables `boundaryGap` at that end, because of the `== null` checks at `:282` / `:287`.
- Escape hatch for complete control over tick values: `axisLabel.customValues` / `axisTick.customValues` (`src/coord/axisTickLabelBuilder.ts:121,151`).

**11. Following Theme Changes: A Little Code, without Destruction and Reinitialization in v6**

This is the most important v6 change over v5. In v5.6.0's published types, `chart.setTheme()` is `private setTheme;`; in v6.1.0, it has the public signature `setTheme(theme: string | ThemeOption, opts?: SetThemeOpts): void`.

```js
// Initialization
echarts.registerTheme('obsidian', buildObsidianTheme(document.body));
const chart = echarts.init(container, 'obsidian', { renderer: 'canvas' });
chart.setOption(option);

// On an Obsidian theme change: just these two lines, without dispose or init
echarts.registerTheme('obsidian', buildObsidianTheme(document.body));
chart.setTheme('obsidian');
```

Evidence: `src/core/echarts.ts:827-874` → `_updateTheme(theme)` + `ecModel.setTheme(this._theme)` (`src/model/Global.ts:548-551` → `_resetOption('recreate')`) + a full update. `recreate` rebuilds from `optionBackup.baseOption` (the **original** user options accumulated across setOption calls), rather than options already merged with the old theme, so old theme colors do not persist.

Cost ranking: `setTheme` < `setOption(opt, {notMerge:true})` (discards and rebuilds GlobalModel, retaining the zrender instance and canvas) < `dispose() + init()`.

**Pitfalls**:

- `setTheme` requires an existing `this._model` (`:840-843`): **call `setOption` at least once first**, or it silently returns.
- An unregistered theme name **silently fails but still triggers a full redraw** (`if (theme)` at `:882` fails; `_theme` stays unchanged, with no warning).
- Axis settings in theme objects are **grouped by scale type**: `categoryAxis` / `valueAxis` / `timeAxis` / `logAxis`, **not** `xAxis` / `yAxis` (`src/theme/dark.ts:209-212`).
- **Do not set colors in both theme and option**: at `src/model/Global.ts:1025`, `name === 'color' && option.color` returns immediately, discarding the entire theme palette. At `:1036`, the third argument of `merge(option[name], themeItem, false)` prevents overwriting existing values. **option always overrides theme**. Choose one approach.
- `darkMode: true` has **less effect than expected**: its only consumer in the stack is `zrender/src/graphic/Path.ts:294`, affecting only automatic text colors and strokes for labels inside elements. It **does not** automatically darken axes, legends, or backgrounds.
- v6 has an internal design-token system (`src/visual/tokens.ts`, `tokens.color` / `tokens.darkColor`), but it is **not publicly exported from `src/export/api.ts`**, so it is not an available theming hook.

**You must bridge CSS variables yourself; invalid input does more than simply fail to apply.**

ECharts and zrender contain only 4 occurrences of `getComputedStyle`, none related to colors; `cssVar` / `var(--` / `currentColor` have zero hits. zrender's color parser (`zrender/src/tool/color.ts:162-279`) supports 148 named colors plus `#rgb(a)` / `#rrggbb(aa)` / `rgb(a)()` / `hsl(a)()`, **but not `var()`**.

Actual path for `'var(--text-normal)'`: it contains `(` and ends with `)`, passing the function-shape check; `fname = 'var'` reaches `default: return;` (`color.ts:272-273`), returning `undefined`. The original string then reaches `ctx.fillStyle` unchanged (`zrender/src/canvas/graphic.ts:454`; the only check is `typeof v === 'string' && v !== 'none'`). Under the canvas specification, an invalid color assignment is **silently ignored and the old value retained**, so the element uses **the previous element's color**, varying with drawing order. Worse, `parse()` returning undefined contaminates downstream operations: `liftColor()` at `src/util/states.ts:255,263` breaks hover highlighting; `modifyHSL` at `color.ts:517` and `lerp` at `:475` **throw TypeError**. **Production builds emit no warnings anywhere along this path.**

Resolve variables with `getComputedStyle(el).getPropertyValue('--text-normal').trim()` into hex or `rgba()` values before passing them to theme. This is the same work already done by `chart-theme.ts`, not an additional burden.

Only two fields support color callbacks: series-level `itemStyle.color` (`src/visual/style.ts:91,118-126`; **a function in `data[i].itemStyle.color` is never called**) and `axisLabel.color` (`AxisBuilder.ts:1446`). `textStyle.color` / `label.color` / the top-level palette do not support callbacks.

**12. PNG Export: One Configuration Option (Official API)**

In Obsidian / Electron, prefer obtaining the canvas directly instead of a data URI:

```js
const canvas = chart.renderToCanvas({ pixelRatio: 2, backgroundColor: bg });
canvas.toBlob(blob => { /* vault.createBinary(...) */ }, 'image/png');
```

For a data URI:

```js
const url = chart.getDataURL({
  type: 'png',
  pixelRatio: 3,
  backgroundColor: getComputedStyle(document.body).getPropertyValue('--background-primary').trim(),
});
```

Evidence: `src/core/echarts.ts:969-1011`. With the canvas renderer, the path is `renderToCanvas(opts).toDataURL('image/png')` (`renderToCanvas` itself is public, `:923-938`). `excludeComponents` temporarily sets `view.group.ignore = true` by mainType and restores it after export (`:988-998, 1006-1008`); it **only affects component views and cannot exclude series**.

⚠️ **Do not use toolbox `saveAsImage`**: the non-IE branch at `SaveAsImage.ts:50-74` creates an `<a download href="data:...">` **without attaching it to the DOM**, then dispatches a synthetic MouseEvent click. Electron's `will-download` interception, CSP restrictions on `data:` navigation, or large-image data URI size limits can each cause silent failure. `renderToCanvas` + `toBlob` + the vault API is more reliable and removes the entire `ToolboxComponent` from the bundle (`getDataURL` is a core method on `ECharts.prototype`, independent of toolbox).

⚠️ Calling `chart.getConnectedDataURL()` **without arguments immediately throws TypeError**: `:1026` accesses `opts.type`, but this method lacks the `opts = opts || {}` guard in `getDataURL` (compare `:982`). Pass at least `{}`.

⚠️ With `type: 'jpeg'`, the background defaults to `option.backgroundColor` (`:935`), commonly `transparent`, which JPEG renders as **solid black**.

- **The default background is transparent**: `:935` uses `opts.backgroundColor || this._model.get('backgroundColor')`; if omitted from option, zr's background is `'transparent'`. zrender's `Layer.clear()` only calls `clearRect` for `'transparent'`, without filling a color. On a white document background, a transparent PNG can make dark text hard to read: **pass an explicit background color when exporting**.
- **For genuinely higher resolution, `pixelRatio` must be `> devicePixelRatio`**: at `zrender/src/canvas/Painter.ts:1295`, `pixelRatio <= dpr` composites layers with `drawImage` (limited by their existing resolution); only larger values rebrush the entire displayList.
- **DOM tooltips are naturally excluded from PNG** (no lingering floating tooltip in the exported image).
- ⚠️ With the SVG renderer, `getDataURL` ignores `type` and directly returns an SVG data URL (`:1000-1004`). The canvas renderer avoids this issue.
- ⚠️ **Exporting before animation ends captures an intermediate frame**: `getSvgDataURL()` first calls `stopAnimation` (`:960-963`), but `renderToCanvas` does not. Defaults are `animation: 'auto'` + `animationDuration: 1000` (`globalDefault.ts:107-108`). Set `animation: false` or wait for `chart.on('finished', ...)` (`:2317`).

**13. Numeric-Label Stroke: Built-In Default**

See C above. With `label: { textBorderColor: '#fff', textBorderWidth: 2 }`, the stroke is naturally behind the text.

**14. Flip Labels for Negative Values: One Option, Automatically Following the Sign**

```js
series: [{ type: 'bar', label: { show: true, position: 'outside' } }]
```

`src/chart/bar/BarView.ts:1274-1281`:

```ts
function getLabelPositionForHorizontal(layout, coordSys): 'top' | 'bottom' {
    if (layout.height === 0) { ...determine from the axis inverse setting... }
    return layout.height > 0 ? 'bottom' : 'top';
}
```

Screen y increases downward. `src/layout/barGrid.ts:460-473` gives positive bars `height < 0` and negative bars `height > 0`, so **negative values get `'bottom'`** (below the bar). The result is passed to `setLabelStyle` as `defaultOutsidePosition` (`BarView.ts:1039`) and consumed at `src/label/labelStyle.ts:358`: `labelPosition === 'outside' && (labelPosition = opt.defaultOutsidePosition || 'top')`. Horizontal bars similarly use `getLabelPositionForVertical` to choose left/right (`:1283-1290`).

⚠️ **The trigger is strict: the literal `'outside'` is required**. `labelStyle.ts:358` is **the only consumer of `defaultOutsidePosition` in all src**, conditioned on the user's string being exactly `'outside'`. Explicit `'top'` passes unchanged to zrender and **never flips** (for negative values, it sits above the zero baseline and conflicts with the axis).

⚠️ **`position` cannot be a function**. `labelStyle.ts:354` calls `textStyleModel.getShallow('position')`; `getShallow` at `src/model/Model.ts:120-134` only returns the original value or falls back to the parent model, without detecting or invoking functions. The value goes directly to `textConfig.position`; zrender's `calculateTextPosition` only handles arrays and a string switch. **A function misses every branch, placing the label at the bounding box's top-left corner with no error**.

⚠️ bar's defaultOption has no `label` key (`BaseBarSeries.ts:200-221` / `BarSeries.ts:144-173`), and `position` defaults to `'inside'` (`labelStyle.ts:355`), so default bar labels do not flip. Explicitly set `position: 'outside'`.

Escape hatch for precise per-item control: `data: [{ value: -5, label: { position: 'bottom' } }]` works (`BarView.ts:242` → `:1029` → `labelStyle.ts:308-321`, with parent-model fallback to series level). However, a `labelLayout` callback **cannot access the data value** (arguments at `LabelManager.ts:133-149` omit value), and setting `x`/`y` clears `textConfig.position` (`:366-367`).

**15. Hover Column Background Band / Vertical Line: Line Is the Default; Band Takes One Option**

```js
tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } }   // Bar chart: full-column background band
tooltip: { trigger: 'axis' }                                     // Line chart: vertical line (default type is line)
```

- `trigger:'axis'` **automatically enables axisPointer**, without a separate component setting (`src/component/axisPointer/modelHelper.ts:146-161`).
- **`shadow` automatically matches category-band width**: `CartesianAxisPointer.ts:171-191` → `viewHelper.calcAxisPointerShadowBandWidth` (`:268-281`) → `calcBandWidth(axis, {fromStat, min:1})` (`src/coord/axisBand.ts:82-147`). Category axes use `out.w = pxSpan / len`: **axis pixel length / category count, exactly one band**. `calcAxisPointerShadowEnds` (`:286-301`) centers ±bandWidth/2 on the hit point and clamps to the axis range, preventing overflow at the first and last columns.
- `shadowStyle.color` defaults to `rgba(129,130,136,0.2)` (`AxisPointerModel.ts:110-112` + `tokens.ts:188`); `line` defaults to a 1px **dashed line** (`:104-108`). shadow only reads `shadowStyle`; line only reads `lineStyle` (`viewHelper.ts:57-70`).
- ⚠️ axisPointer uses `z: 50`, so **the band overlays bars**. To put it underneath, use `tooltip:{axisPointer:{type:'shadow', z:1}}`. `z` is in the tooltip→axisPointer forwarding allowlist (`modelHelper.ts:241-245`), which contains only `type/snap/lineStyle/shadowStyle/label/animation/animationDurationUpdate/animationEasingUpdate/z`; other fields belong in top-level `option.axisPointer`.
- ⚠️ A tooltip-triggered axisPointer **does not show the axis value label by default** (`modelHelper.ts:262-264` forces `label.show = false`). Enable it explicitly for the small black label.

**16. Dual-Axis Combination Chart: One Configuration Option**

```js
xAxis: { type: 'category', data: [...] },
yAxis: [{}, {}],
series: [
  { type: 'bar',  yAxisIndex: 0, data: [...] },
  { type: 'line', yAxisIndex: 1, data: [...] }
]
```

- `yAxisIndex` is resolved by the generic `getReferringComponents` (`cartesianAxisHelper.ts:129-154`); Grid creates Cartesian systems from x/y index pairs (`Grid.ts:441-443`).
- **The two axes' ticks are completely independent by default**: `Grid.ts:146-171` calls `scaleCalcNice` for each axis; without `__alignTo`, they do not affect each other.
- `alignTicks` (v5.3+) aligns tick lines: set it on **the axis to be aligned**, for example `yAxis: [{}, { alignTicks: true }]`. Evidence: `Grid.ts:739-761` (collection and reference selection) + `:160-169` (`scaleCalcAlign`). ⚠️ Mutually exclusive with `interval` (`:740` explicitly checks `get('interval') == null`); setting `interval` silently disables alignment. Setting it on both axes complicates behavior (reverse iteration + `pop()`), so set it on only one. The default is undefined (no alignment).
- **Drawing order**: bar uses `z: 2` (`BaseBarSeries.ts:200-202`), line `z: 3` (`LineSeries.ts:160-161`), so **lines are drawn above bars by default and remain visible**. Reverse this by changing `series[].z`.

---

## 4. Hard-Constraint Verification

### 4.1 Licensing

| Package | License | Evidence |
| --- | --- | --- |
| `echarts` 6.1.0 | **Apache-2.0** (full standard text, unchanged) | `package.json` license field; `LICENSE` has 222 lines, the first 201 containing the unmodified standard Apache-2.0 text |
| `zrender` 6.1.0 | **BSD-3-Clause** (copyright held by Baidu, not ASF) | `node_modules/zrender/package.json` + `zrender/LICENSE` |
| `tslib` 2.3.0 | **0BSD** (equivalent to public domain, no attribution obligation) | `node_modules/tslib/package.json` |
| Embedded d3 code | BSD-3-Clause (Copyright 2010-2016 Mike Bostock) | `Apache ECharts Subcomponents` section at `LICENSE:202-222` + `licenses/LICENSE-d3` |

**Commercial use is unrestricted.** Apache-2.0 explicitly grants rights to commercial use, modification, distribution, and patent implementation. Three points deserve clarification:

**① `zrender` is not Apache-2.0.** It is BSD-3-Clause, copyrighted by Baidu, and is a mandatory runtime dependency included in the bundle. BSD-3-Clause additionally prohibits using contributors' names to endorse or promote derived products.

**② d3's BSD-3-Clause applies to this plugin.** `LICENSE:202-222` identifies four files containing embedded d3 code: `treemapLayout.ts` / `layoutHelper.ts` / `forceHelper.ts` / **`src/util/number.ts`**. Selective imports exclude the first three, but **`util/number.ts` is a core utility module and is always included**. Not using tree charts does not remove this attribution obligation.

**③ ⚠️ Measured compliance gap: esbuild removes all Apache and zrender copyright notices.**

This was observed in the bundle. ECharts source-file headers use `/*`, not `/*!`, and contain neither `@license` nor `@preserve`; esbuild only preserves the latter forms by default. Measured selective-import bundle:

```
legal comment blocks: 1              ← tslib only
mentions "Apache License":     false
mentions "Apache Software Foundation": false
```

Adding `--legal-comments=inline` does not restore them. The result is inconsistent: **Microsoft's full 0BSD notice for tslib survives, while all Apache ECharts and zrender copyright text disappears.**

The fix is small, in two steps:

1. Add a root-level `NOTICE` to the plugin repository (or a section in `LICENSE` / README) listing the three copyright holders: ASF (echarts, Apache-2.0), Baidu (zrender, BSD-3-Clause), and Mike Bostock (d3 fragments, BSD-3-Clause).
2. Use esbuild's `banner` option to insert this notice at the top of `main.js`.

**Distribution obligations** (publishing to the Obsidian community marketplace is external distribution and triggers all applicable obligations; internal company use is not distribution and triggers none):

- §4(a): include the full Apache-2.0 license in the distribution.
- §4(b): mark modified files; not applicable when source is unmodified.
- §4(d): **pass through NOTICE**. echarts includes a `NOTICE` (four lines: `Apache ECharts / Copyright 2017-2026 The Apache Software Foundation / This product includes software developed at The Apache Software Foundation`). An upstream NOTICE must be passed through, which is the gap addressed in ③ above.
- §3: the patent grant is perpetual, worldwide, and royalty-free. The retaliation clause terminates it if you sue over patent infringement by ECharts; this poses no practical risk for this project.

**④ ⚠️ Trademarks constrain plugin naming.** Apache-2.0 §6 (`LICENSE:139-140`) explicitly grants no trademark rights. The ASF trademark policy (`apache.org/foundation/marks/`) says *"not use ASF trademarks in any software product branding"*: **the plugin name cannot contain "ECharts"** (including `ECharts for Obsidian` or `Obsidian ECharts Plugin`), nor may it be used in a domain name or accompanied by the Apache logo.

Nominative fair use is allowed: "Powered by Apache ECharts" or "Built with Apache ECharts" in README / settings, performance comparisons, and recommendations are compliant. ASF also **prefers**, but does not require, the full name "Apache ECharts" on first or prominent mention.

The plugin's name, Mosaic, is unaffected. Keep this constraint in mind if renaming it later.

### 4.2 Bundle Size (Measured)

**The most counterintuitive finding in this report: switching to ECharts makes the bundle substantially smaller.**

Measurement setup: `npm i echarts@6.1.0`, `npx esbuild <entry> --bundle --minify --format=esm --target=es2017`, matching the target in the project's `esbuild.config.mjs`.

| Configuration | Bundled bytes | gzip bytes |
| --- | --- | --- |
| **Current** `import * as Plots from "@ant-design/plots"` + `@antv/scale` (preact aliases) | **1,566,884** | **463,465** |
| Reference: importing only `Chart` from `@antv/g2` | 1,370,080 | 406,291 |
| Full ECharts `import * as echarts from 'echarts'` | 1,142,036 | 382,653 |
| **Target ECharts set**: bar + line + Grid + Tooltip + Legend + MarkArea + MarkLine + Canvas | **579,599** | **196,720** |
| ECharts lower bound: bar + line + GridSimple + Canvas | 492,290 | 168,155 |
| Reference: preact/compat alone | 25,335 | 9,726 |

Prebuilt artifacts (`node_modules/echarts/dist/`):

| File | Raw | gzip |
| --- | --- | --- |
| `echarts.min.js` (all) | 1,121,883 | 368,217 |
| `echarts.common.min.js` | 715,020 | 239,827 |
| `echarts.simple.min.js` | 500,315 | 169,119 |

**Conclusion**: `main.js` currently has 1,658,880 bytes, approximately 1.57MB of which is the chart engine (94%). The target ECharts set reduces the engine to 0.58MB: **about 987KB raw / 267KB gzip saved (-63% / -58%)**. Even a **full** ECharts import is 420,000 bytes smaller than the current G2 bundle.

Three size-saving facts, all verified in install files:

1. `TooltipComponent` already calls `use(installAxisPointer)` internally (`src/component/tooltip/install.ts:20,27`), as does `GridComponent`; no separate `AxisPointerComponent` import is needed.
2. `LegendComponent` installs both plain and scroll (`src/component/legend/install.ts:24-25`). Use `LegendPlainComponent` when scrolling legends are unnecessary.
3. `echarts/core` already registers `LabelLayout` by default (`src/export/core.ts:27-29`); do not import it again.

⚠️ **Tree-shaking prerequisite**: `package.json` uses a `sideEffects` **allowlist array**, not `false`. It includes `lib/chart/*.js` and `lib/component/*.js`, so legacy imports such as `import 'echarts/lib/chart/bar'` are marked as side-effectful and **cannot be tree-shaken away**. The `charts.js` / `components.js` / `core.js` / `renderers.js` / `features.js` barrels are absent from the list and can be tree-shaken. `module: "index.js"` points to ESM (`main` is UMD), so bundlers take the ESM branch. zrender also declares `sideEffects`. **Use `echarts/charts` + `echarts.use()`, not `echarts/lib/chart/*`.**

⚠️ **Do not use `echarts.common.min.js` merely for convenience**: the selective build (580KB) is 135KB smaller than the common preset (715KB), which includes unneeded toolbox, dataZoom, Pie, Scatter, and SVG renderer. The simple preset lacks tooltip / legend / markLine / markArea and is therefore unusable here.

An independent check using a slightly different import list measured 591,615 / 201,109, about 2% different from my 579,599 / 196,720 (due to an explicit additional `LabelLayout` import). Both measurements support the same conclusion. That independent check also used SSR rendering to confirm **functional completeness** of the import set: legend text, data labels, both y-axis names, markLine labels, markArea fills, and `getDataURL` were all present. This went beyond successful bundling alone.

### 4.3 ES2017

**No risk: published artifacts target a much older language level than required.**

- `tsconfig.json:3`: `"target": "ES3"`.
- Measured scan of `node_modules/echarts/dist/echarts.esm.mjs` (unminified, 3.4MB):
  - `?.` optional chaining: **0**
  - `??` nullish coalescing: 0 (all 9 hits are `??? TODO` in comments)
  - Object spread `{...`: 0 (all hits are in comments)
  - `async` / `await`: 0
  - class declarations: **0** (`grep -cE '^\s*(export )?class '` = 0)
  - Top-level `let` / `const`: **0** (all use `var`)
  - Arrow functions: 30 occurrences, **all in comments**
  - BigInt / private fields / regex lookbehind / `Object.fromEntries` / `flatMap` / `padStart` / `globalThis` / `matchAll`: all 0
- zrender dist likewise has 0 classes and 0 top-level let/const declarations.
- An independent acorn check parsed **every** JS file in the npm packages at ES5 and ES2017 levels: 591 files in `echarts/lib`, 119 in `zrender/lib`, and 3 dist bundles. **ES5 parse failures = 0**. `dist/echarts.esm.mjs` contains 16,144 occurrences of `var`; all 84 `let` and 68 `const` occurrences are in comments.
- `package.json` has **no `engines` field**, and README has **no browser-support statement**; none was found. An ES3 target implies theoretical compatibility back to IE8-era runtimes, easily within Electron's capabilities.

**Published code uses ES5 syntax (compiled with an ES3 target) wrapped in ESM modules.** esbuild does not need to transform any echarts code, avoiding the risk of silent transformations changing semantics. This is substantially safer than the current G2 path.

⚠️ **The risk runs in the opposite direction: retain `--target=es2017`.** Measured output for three targets:

| esbuild target | Bytes | `??` in output | acorn ES2017 parsing |
| --- | --- | --- | --- |
| `es5` | 596,439 | 0 | OK |
| **`es2017` (current project target)** | 591,615 | **0** | **OK** |
| `esnext` | 591,283 | **30** | **FAIL** |

The `esnext` bundle contains `function U(t,e){return t??e}` at offset 9714: **esbuild's own minifier rewrote `a != null ? a : b` into `a ?? b`**, which did not exist in the source. The project's `esbuild.config.mjs:22` already sets `target: 'es2017'`; retain it. The 321 arrow functions and 31 template literals in the es2017 bundle also come from esbuild's minifier. They are ES2015, within the limit, with no semantic difference.

### 4.4 canvas / PNG

- **canvas is the default renderer**. `echarts.init(dom, theme, { renderer: 'canvas' })` expresses the default. With selective imports, explicitly call `use([CanvasRenderer])`; SVG renderer is completely excluded from the bundle.
- `getDataURL()` is an official public API (`src/core/echarts.ts:969`); see requirement 12 for its signature and pitfalls.

### 4.5 Theme Switching

See requirement 11. **No destruction and reinitialization is needed**: `chart.setTheme()` is public in v6, internally calling `_resetOption('recreate')` while retaining the zrender instance and canvas. Canvas cannot read CSS variables, so a `getComputedStyle` bridge is required; passing `var(--x)` causes silent failures (see the three failure modes in requirement 11).

### 4.6 CJK

**Measurement**: zrender has two paths.

- `measureWidth()` (`zrender/src/contain/text.ts:96-104`) uses actual canvas `ctx.measureText(fullString)` with an LRU(500) cache: **fully accurate for Chinese text**.
- `measureCharWidth()` (`:81-93`) estimates: ASCII uses a measured per-character table; **every charCode > 127 returns `measureText('国').width`** (`:42`).

Automatic category-axis interval calculation and final `truncate` checks both use the **accurate** `measureWidth`. Only line-break positions for `overflow: 'break'/'breakAll'` rely entirely on estimates. **For pure Chinese text, the two are nearly equivalent** (full-width CJK characters have equal widths). Errors affect accented Latin letters, Greek/Cyrillic, emoji, and some half-width CJK punctuation. The source itself includes `FIXME Other languages? Consider proportional font?` at `:36-40`.

**Line wrapping**: the ranges in `isAlphabeticLetter` (`zrender/src/graphic/helper/parseText.ts:672-682`) exclude CJK (0x4E00+), making every Chinese character a valid break point. **Character-by-character wrapping** is correct for Chinese. However, CJK punctuation (0x3000–0x303F) also counts as break points, with **no punctuation line-breaking restrictions**, so a line can begin with `。`.

**Ellipsis**: the default is `'...'` (three ASCII periods, `parseText.ts:98`); for Chinese typography, explicitly set `ellipsis: '…'`. The `truncateSingleLine` algorithm (`:126-170`) measures first and corrects each iteration with actual measurements; `maxIterations` defaults to 2. ⚠️ `:161` truncates by UTF-16 code units with `substr`, which can split emoji in half (BMP Chinese characters are unaffected).

**Automatic category-axis label hiding**: `axisLabel.interval: 'auto'` is the default (`axisDefault.ts:166-168`). The algorithm at `axisTickLabelBuilder.ts:351-420` samples at most 40 labels and multiplies measured size by 1.3 for spacing (the source comment calls it a "Magic number"); two cache layers prevent flicker on zoom. **There is no automatic rotation** (`rotate` defaults to 0, and no collision-based rotation-angle calculation exists anywhere in the repository). `axisLabel.hideOverlap` is off by default. Default `axisLabel` has no `width` / `overflow` / `ellipsis`, so **v6 does not truncate axis labels by default**.

**Major v6 improvement: `grid.outerBounds` replaces `containLabel`**. `GridModel.ts:47-48` marks `containLabel` as `@deprecated`. Defaults are `outerBoundsMode: 'auto'` + `outerBoundsContain: 'all'` + `outerBoundsClampWidth/Height: '25%'` (`:128-141`). `layOutGridByOuterBounds` (`Grid.ts:819-925`) measures each label's rectangle, calculates overflow, and shrinks gridRect. **v6 therefore automatically shrinks the plot area to prevent clipping of long Chinese labels and axis names** (by up to 25%). v5 required explicit `containLabel: true`. This substantially improves default behavior.

### 4.7 Responsive Resizing

**Entirely manual.** A full search for `ResizeObserver` / `addEventListener('resize'` / `onresize` yields only a comment at `src/core/echarts.ts:607` (`// In case some people write window.onresize = chart.resize`) and prebinding of `this` in ECharts `src/`; zrender `src/` has zero hits.

```js
new ResizeObserver(() => container.offsetWidth > 0 && chart.resize()).observe(container);
```

- ⚠️ **Always call `chart.resize()` without arguments**. `zrender/src/canvas/Painter.ts:1229-1230` writes explicit dimensions into `this._opts`; subsequent argument-free calls keep returning the stored value.
- A zero-sized container **does not cause an error** (trailing `|| 0` at `zrender/src/canvas/helper.ts:122-127`); production builds do not even warn (`src/core/echarts.ts:2946-2957` is `__DEV__` only). Recovery works: `Painter.resize` rereads the DOM and redraws everything. Returning to an Obsidian tab that had `display:none` requires a manual `resize()`.
- If dom already has an instance, `echarts.init(dom)` **returns that existing instance** instead of creating another (`:2938-2945`), again warning only in `__DEV__`. Use `getInstanceByDom()` / `dispose()` for lifecycle management.

The current `ChartFigure.tsx` already has `lastWidth` logic for handling ResizeObserver reports of 0×0; retain it unchanged.

### 4.8 Dependencies

The only runtime dependencies are `zrender@6.1.0` + `tslib@2.3.0`, **both pinned to exact versions** (no `^` / `~`), with no `peerDependencies`. zrender itself depends only on `tslib`. `src/` has 785 occurrences of `from 'zrender/src/...'` and no other third-party runtime imports. A measured `npm i echarts@6` installed only **5 packages, with 0 vulnerabilities**.

Measured output confirms that esbuild fully inlines `tslib`: no bare imports or `from "tslib"` statements remain; the string `"tslib"` occurs only once, in the trailing license-banner comment. The entire echarts library uses only one helper (163 instances of `import { __extends } from "tslib"`, all the same helper). The artifact is genuinely a single file.

### 4.9 Maintenance Activity: The Only Caution Flag in This Evaluation

**Surface indicators are positive**: the main library has 67,078 stars, a latest commit of 2026-08-04 (12 days earlier), and is not archived. All 13 related repositories under Apache are active; dedicated issue/PR bots and ASF governance processes exist. v6 introduces a design-token system, the public `setTheme` API, `grid.outerBounds`, the `chord` series, `matrix` / `thumbnail` components, axis breaks, and `registerCustomSeries`: a substantive major version rather than a maintenance release.

**A closer look is less encouraging.**

**Release intervals are lengthening** (stable releases only, excluding rc):

| tag | Date | Since previous stable |
| --- | --- | --- |
| 6.1.0 | 2026-05-19 | 293 days |
| 6.0.0 | 2025-07-30 | 214 days |
| 5.6.0 | 2024-12-28 | 184 days |
| 5.5.1 | 2024-06-27 | 130 days |
| 5.5.0 | 2024-02-18 | 215 days |

The median is 214 days (about 7 months), and **the latest interval, 293 days, is the longest on record**.

**Commit composition matters more than count**: of 7 commits in the last 30 days, **4 are dependabot dependency updates**; the other 3 are fixes by one external contributor and their merges. **Core maintainers produced no feature or fix code in 30 days, only merges**. Of 19 commits in the last 90 days, 11 are chores.

**Low issue coverage and a bus factor of 1**: **1372** open issues and **188** open PRs. Of the 10 most recently created issues sampled, only **3 had human maintainer replies, all from one person (plainheart)**; 4 had no comments, and 2 had only community replies. Maintainers respond quickly when they do reply (median about 4.8 hours), so **the concern is 30% response coverage, rather than slow replies**. The latest 5 issues (07-24 through 08-14) had no maintainer replies. Combined with no commits after 08-04, this points to a marked pause in maintainer activity from early August.

**Practical risk for this plugin**: the needed scope—bars / lines / dual-axis combinations, legends, tooltips, annotations, and labels—is mature and stable. These code paths were established a decade ago and run continuously in hundreds of thousands of projects, making new bugs unlikely. The risk is acceptable, **but do not expect prompt fixes after filing an issue**; be prepared to patch or work around problems. Apache-2.0 allows forks and modifications, and no extension packages are needed here.

⚠️ Extensions are a different matter: apart from `echarts-gl`, extensions under `ecomfe` are largely unmaintained (see §1.2). **This plugin needs none of them.**

---

## 5. Migration Cost Estimate

### 5.1 Current Inventory (Measured)

| File | Lines | Engine coupling |
| --- | --- | --- |
| `src/render/chart-tag-config.mjs` | 1,081 | Strong |
| `src/render/chart-theme.ts` | 54 | Strong |
| `src/render/components/Chart.tsx` | 88 | Strong (`import * as Plots`) |
| `src/render/components/ChartFigure.tsx` | 225 | Weak (export button, resize, theme events) |
| `src/render/render-chart.tsx` | 103 | Unaffected (only calls `buildChartFrom*` + `withTheme`) |
| `src/parse/chart-tag.mjs` + `chart-block.mjs` | 352 | Unaffected |
| `src/entry/chart-*.tsx` | 277 | Unaffected |

Strongly coupled code totals about **1,223 lines**; the original 1,100-line estimate omitted the 88 lines in `Chart.tsx`.

### 5.2 Code That Can Be Removed (Built into the Library)

Against the actual structure of `chart-tag-config.mjs`:

| Current code | Line range | Replacement |
| --- | --- | --- |
| Custom `legendBar` symbol registration + `LEGEND_BAR_SYMBOL` | 60–89 | `legend.data[i].icon: 'path://...'`, 0 lines |
| `LABEL_TRANSFORM` (label collision-avoidance transform chain) | 110–136 | `labelLayout: { moveOverlap:'shiftY', hideOverlap:true }` |
| `isNegative` / `LABEL_OUTSIDE` / `LABEL_CENTER` | 137–163 | `label.position:'outside'` (automatically flips by sign, `BarView.ts:1274`) |
| `Y_HEADROOM` / `headroomMax` / `yScale` / `domainTicks` | 307–350 | `yAxis.boundaryGap:[0,'8%']` + built-in nice ticks |
| `wilkinsonExtended` dependency from `@antv/scale` | — | Remove the entire dependency |
| `highlightAxisX` / `highlightMarks` / `HIGHLIGHT_Z_INDEX` | 374–433 | `xAxis.data[i].textStyle` + `series.markArea` |
| `HOVER_BAND_STATE` / `HOVER_BAND_INTERACTION` / `hoverBandStyle` / `applyHoverBandStyle` | 170–174, 225–231, 511–548 | `tooltip.axisPointer: { type:'shadow' }` |
| `CROSSHAIR_INTERACTION` / `crosshairStyle` / `applyCrosshairStyle` | 241–254, 572–593 | `tooltip.axisPointer: { type:'line' }` |
| `LABEL_HALO_WIDTH` / `labelTextStyle` / `applyLabelStyle` | 443–443, 468–510 | `label.textBorderColor/Width` (built-in strokeFirst) |
| Per-child patching by `withGridStroke` in `chart-theme.ts` | 30–42 | One `valueAxis.splitLine` setting in the theme object |

Rough estimate: **350–420 lines can be removed**.

### 5.3 Code to Retain Unchanged

`CHART_COLORS` / `HEX_COLOR` / `LABELS_OFF` / `CHART_TYPES` / `CHART_NUMBER_FORMAT` / `formatChartNumber` / `CURRENCY_PREFIXES` / `unitText` / `valueFormatterFor` / `splitList` / `parseGranularityOptions` / `labelsEnabled` / `labelFor` / `colorsFor` / `toLong` / `buildFootnote` / `buildWarning` belong to the **data and formatting layer**, independent of the engine: about 250 lines remain unchanged.

### 5.4 Code to Rewrite

- `buildChartFromRows` (704–973, about 270 lines): translate G2 spec into ECharts option. The structure becomes flatter: G2's `children` / `encode` / `scale` / `transform` layers become ECharts' flat `xAxis` / `yAxis` / `series`. This is the largest task, but it is a direct translation with unchanged logic.
- `buildChartFromTag` / `buildChartFromInline` (974–1081): retain signatures and return structures; replace only internal calls.
- `chart-theme.ts`: **replace five apply\* functions that each traverse and patch config with one function returning a theme object**. This removes code: apply\* is needed because G2 spec lacks a unified theme entry point, which ECharts provides.
- `Chart.tsx` (88 lines): replace the React component wrapper with imperative `echarts.init` / `setOption` / `dispose`, using `useRef` + `useEffect`. ECharts has no official React wrapper (`echarts-for-react` is a community package). Since this plugin uses preact/compat, a handwritten 30-line hook is more reliable than adding a third-party package.
- `ChartFigure.tsx`: replace the export button's `plotRef.current?.downloadImage?.()` with `chart.getDataURL()` + a download link; change theme events from rebuilding the whole React subtree to `chart.setTheme()`; retain ResizeObserver logic unchanged. About 30 lines change.

### 5.5 Code to Add

- **A CSS-variable → theme-object bridge** (about 25 lines). The five existing functions, including `labelTextStyle(dark)` / `hoverBandStyle(dark)`, already do this work; combining them into `buildObsidianTheme(el)` makes it shorter.
- A selective-registration list for `echarts.use([...])` (about 6 lines).
- For precise hiding of labels in thin stacked-bar segments, a `labelLayout` callback (about 3 lines).

### 5.6 Net Estimate

| Item | Change |
| --- | --- |
| Removed | −350 ~ −420 lines |
| Rewritten (same-size replacement) | ~400 lines (`buildChartFromRows` + `Chart.tsx` + `chart-theme.ts`) |
| Added | +35 lines |
| **Net** | **About −320 ~ −390 lines** |

**Tests** (measured line counts exceed the original 1,835 estimate):

| Test file | Lines | Impact |
| --- | --- | --- |
| `tests/chart-tag-config.test.mjs` | 1,981 | Main area of changes |
| `tests/chart-tag.test.mjs` | 544 | Parsing layer; unaffected |
| `tests/chart-block.test.mjs` | 54 | Unaffected |

`chart-tag-config.test.mjs` has 335 assertions, about **81** of which directly assert G2 spec structure (`config.children[...]`, and the `axis` / `scale` / `encode` / `transform` / `labelTransform` / `shapeField` / `yField` keys). Their assertion targets need rewriting. The rest check data transformation and formatting (`toLong` / `formatChartNumber` / `valueFormatterFor` / granularity parsing / warning text) and are **unaffected**.

Thus about 24% of assertions are affected, rather than the initial 40%–60% estimate. This remains the most tedious migration work, but it is lighter than expected.

**The parsing layer, entry layer, and block components (about 3,700 lines) are entirely unaffected**. Verification confirms that `render-chart.tsx` depends only on four exports: `buildChartFromTag` / `buildChartFromInline` / `parseGranularityOptions` / `withTheme`. Preserving their signatures is sufficient.

---

## 6. Three Main Strengths and Three Main Weaknesses

### Strengths

1. **A substantial reduction in bundle size.** This is the only option that makes the bundle smaller when switching libraries: measured engine size drops from 1.57MB → 0.58MB (gzip 463KB → 197KB). For a community plugin whose bundle is already 1.6MB, this alone supports the decision.

2. **The most time-consuming effects in requirements 2, 13, 14, and 15 are all built in.** Shift-then-hide labels take one option, with execution order confirmed in source; text strokes naturally sit behind labels (`strokeFirst: true` is the default); negative-value labels flip automatically; hover-band width automatically equals category-band width. These four features currently occupy the substantial `LABEL_TRANSFORM` + `LABEL_OUTSIDE` + `applyLabelStyle` + `hoverBandStyle` blocks.

3. **Three v6 features fit this use case directly**: `chart.setTheme()` (theme changes without destruction/reinitialization; private in v5), `grid.outerBounds` enabled by default (automatically shrinks the plot for long Chinese labels; v5 required manual `containLabel`), and an ES3 compilation target (no ES2017 constraint risk). The dependency tree has only 3 packages, with no commercial-use restrictions under Apache-2.0 + BSD-3.

### Weaknesses

1. **CSS-variable mistakes fail silently and have messy consequences.** `'var(--text-normal)'` bypasses all validation and reaches `ctx.fillStyle`, making elements inherit the previous element's color and change with drawing order. Meanwhile, `parse()` returning undefined breaks hover highlighting and can throw TypeError in `modifyHSL` / `lerp`. **Production builds issue no warnings throughout.** The bridge needs its own format validation; the library provides none.

2. **Documentation and types can mislead, and subtle semantic differences require verification of every requirement.** Four type-level mismatches surfaced: tooltip types include `textBorderColor/Width`, with zero implementation hits; `moveOverlap` declares `'shuffleX'/'shuffleY'` without implementations; legend types suggest per-item `formatter`, but the code reads the global value; and `boundaryGap` type comments say "absolute pixel number" while the implementation treats numbers as ratios (`8` = 800%). Three semantic differences also matter: `boundaryGap` percentages use the data range rather than its maximum and are mutually exclusive with `max`; `hideOverlap` tests label-to-label collisions, not whether a label is taller than its segment; and `markArea` aligns to whole category bands only on bar series. The legend's 5px marker-to-text gap is also a hard-coded literal, requiring negative padding to adjust. **These are the same kinds of problems this project has encountered before. Changing libraries provides no immunity; key conclusions still require source inspection.**

3. **Maintenance activity warrants caution.** There are 1372 open issues and 188 open PRs. Maintainer-response coverage for the latest 10 issues is only 30%, all from one person (bus factor 1). Stable-release intervals lengthened from 130 to 293 days; 4 of the last 30 days' 7 commits are from dependabot; no commits occurred after 08-04. The needed feature set is mature enough that new bugs are unlikely, but **do not expect prompt fixes after filing issues**; be prepared to patch or work around them.

(One additional required action, though not a weakness: esbuild removes all Apache and zrender copyright notices while retaining only tslib's. Add `NOTICE` + an esbuild `banner`; see §4.1.)

---

## 7. Uncertainties

The following points **have not been empirically verified**; the report's findings extend only as far as source inspection:

1. **No chart was actually run.** All findings come from source inspection and measured bundles; no configuration was rendered and verified in a browser/Electron. In particular, the **visual result** of combined `moveOverlap` + `hideOverlap` needs testing: execution order is clear in source, but whether shifts are sufficient and how the `shiftLayoutOnXY` squeeze fallback behaves in dense bar charts remain unverified.

2. **The actual rendering of markArea on a pure line chart with no bar series anywhere in the grid was not verified.** Only `BaseBarSeries` was confirmed to implement `getMarkerPosition`, with the fallback path using `dataToPoint`. Zero width is an inference, not a measured result. The workaround—whether an ordinal axis accepts `[{xAxis: idx-0.5},{xAxis: idx+0.5}]`—was also not verified.

3. **The exact version that introduced public `chart.setTheme()` could not be determined.** The source checkout is a depth=1 shallow clone, with no git history. Only `private setTheme` in v5.6.0's published types and the public signature in v6.1.0 were confirmed. If installing 6.0.x, separately verify that the method is public in that version.

4. **`setTheme` reliability with complex options containing `timeline` / `media` is uncertain.** A source comment at `src/model/OptionManager.ts:164-166` says of `baseOption`, "its reliability is under suspicion". This plugin currently uses neither feature; verify again if they are introduced later.

5. **The affected-test proportion (about 24%) was estimated by counting keywords with grep**, without checking each assertion for required changes. The actual proportion could be higher: some apparently data-layer assertions may depend on spec structure.

6. **The CJK estimation table's error for half-width CJK punctuation was not quantified.** Only that `measureCharWidth` returns the width of `国` for every charCode > 127 was confirmed; actual punctuation-width differences in common fonts were not measured.

7. **v6 compatibility of extensions other than `echarts-gl` was not tested**. Judgments rely only on `peerDependencies` declarations and GitHub issue titles. This plugin needs no extensions, so the investigation stopped there.

8. **ECharts performance with large datasets was not evaluated.** Defaults such as `progressiveThreshold: 3000` / `animationThreshold: 2000` were read, but this plugin's typical datasets (tens to hundreds of rows) are far below those thresholds, so no further evaluation was made.

9. **Two research passes disagreed on legend requirement 5; I resolved the disagreement from source without testing it.** One said squares for bars and 12×4 horizontal bars for lines cannot share a legend and require two legends; the other said `path://` + `symbolKeepAspect` makes it possible. I substituted values into `centerGraphic` along `util/symbol.ts:358-364` → `util/graphic.ts:240-264` (12×4 bbox in a 12×12 box → centered 12×4 result), supporting the latter finding; the former considered only built-in symbols. **This is a calculation on paper, not a verified render.**

10. **`package.json` has no `engines` field, and README has no browser-support statement**. There is no formal upstream declaration of supported runtimes; support can only be inferred from the ES3 compilation target.

11. **The age distribution and stale proportion of the 1372 open issues were not available**. Computing them requires paginating through all issues, which was not worth the cost. The 30% response coverage in §4.9 is a sample of the latest 10 issues, not a full-population statistic.

12. **Electron's data URI size limit for large images exported with `getDataURL` was not tested.** Only potential failure paths for toolbox `saveAsImage` using `<a download href="data:...">` in Electron were identified, leading to the recommendation to use `renderToCanvas` + `toBlob`. The image size at which data URIs begin to fail was not verified.

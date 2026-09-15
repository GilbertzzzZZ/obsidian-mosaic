# Chart engine evaluation: the AntV ecosystem (current implementation / baseline)

**Research date**: 2026-08-16
**Scope**: `@antv/g2` 5.4.8 (introduced indirectly through `@ant-design/plots` 2.6.8) and the full AntV family
**Role**: The plugin's current implementation, used as the baseline for the ECharts and AG Charts reports

**Evidence standard**: Source code > official documentation > blogs. All size figures come from local esbuild runs (`target: es2017`, `format: cjs`, `minify: true`, with `obsidian`/`electron`/Node builtins external). All API findings cite source paths and line numbers. All maintenance data comes from direct npm registry API and GitHub API queries. Anything that could not be found is marked "not found."

---

## Summary

G2 has a high capability ceiling (none of the plugin's sixteen requirements is entirely blocked by engine capabilities), but **very little works out of the box**: only 1 of sixteen items is a built-in default, 10 require code, and 2 cannot be implemented within the engine and need workarounds. The more serious problem is **maintenance**: the latest G2 version, 5.4.8, was released on 2026-01-06, with no new release for 221 days; its only 4 commits in the past 90 days were site announcements; `@antv/coord` has not released for 996 days; the official site's announcement banner now promotes the AI platform Sive; and six channels yielded no v6 roadmap. **Staying with AntV means none of the known problems will be fixed upstream.**

---

## 1. Ecosystem overview

### 1.1 Package inventory

Sources: `https://registry.npmjs.org/<pkg>` (URL-encode scoped package names) for `dist-tags.latest` / `time[latest]` / `license`; GitHub API for commits and issues. **Elapsed time is measured as of 2026-08-16.**

| Package | Purpose | Latest version / release date | Time elapsed | License | Required by this plugin? |
| --- | --- | --- | --- | --- | --- |
| `@antv/g2` | Grammar-of-graphics statistical chart engine; **does the actual rendering work** | 5.4.8 / 2026-01-06 | **221 days** | MIT | **Required** |
| `@ant-design/plots` | React wrapper around G2 | 2.6.8 / 2025-12-24 | 234 days | MIT | **Not required** (see §5) |
| `@ant-design/charts` | Aggregate entry for plots + graphs; only 19 files, with no implementation of its own | 2.6.7 / 2025-12-23 | 235 days | MIT | No |
| `@antv/g` | Underlying rendering engine (umbrella package) | 6.3.1 / 2025-12-24 | 234 days | MIT | Indirectly required |
| `@antv/g-lite` | G's core implementation (scene graph, text measurement, events) | Released with g | — | MIT | Indirectly required |
| `@antv/g-canvas` | Canvas rendering backend | 2.2.0 / 2025-12-24 | 234 days | MIT | Indirectly required |
| `@antv/g-svg` | SVG rendering backend | 2.1.1 / 2025-12-24 | 234 days | MIT | No |
| `@antv/g-webgl` | WebGL rendering backend | 2.1.1 / 2025-12-24 | 234 days | MIT | No |
| `@antv/component` | UI components for axes, legends, tooltips, etc. | 2.1.11 / 2025-11-21 | 267 days | MIT | Indirectly required |
| `@antv/scale` | Scales and tick algorithms | 0.5.2 / 2025-09-04 | 345 days | MIT | **Direct dependency** (`wilkinsonExtended`) |
| `@antv/coord` | Coordinate transformations | 0.4.7 / 2023-11-23 | **996 days** | MIT | Indirectly required |
| `@antv/g6` | Relationship / network graphs | 5.1.1 / 2026-05-08 | 99 days | MIT | No |
| `@antv/x6` | Flowchart editor | 3.1.8 / 2026-08-11 | **4 days** | MIT | No |
| `@antv/s2` | Pivot tables / crosstabs | 2.7.2 / 2026-06-10 | 66 days | MIT | No |
| `@antv/l7` | Geospatial visualization (custom WebGL engine) | 2.29.1 / 2026-07-13 | 33 days | MIT | No |
| `@antv/f2` | Mobile charts | 5.14.0 / 2025-11-10 | **278 days** | MIT | No |
| `@antv/g2plot` | High-level wrapper from the G2 4.x era; **no longer updated** | 2.4.35 / 2025-09-19 | 330 days | MIT | No |
| `@antv/g2-extension-plot` | Official G2 extensions (sunburst charts, etc.) | — | — | MIT | No (pulled in unconditionally by plots) |

**All are MIT-licensed**; none has an npm package-level `deprecated` marker.

### 1.2 The relationship between `@antv/g2` and `@ant-design/plots`

- `@ant-design/plots` dependencies: `@antv/g2 ^5.2.7`, `@antv/g ^6.1.7`, `@antv/g2-extension-plot ^0.2.1`, `lodash`, `@antv/event-emitter`, `@ant-design/charts-util`.
- peerDependencies: `react >=16.8.4`, `react-dom >=16.8.4`.
- The dependency is **one-way**: plots → g2; g2 knows nothing about plots.
- `@antv/g2` provides a complete standalone entry (`main` / `module` / `unpkg` / `exports` are all present; **no peerDependencies and no React dependency**).

**Conclusion: `@ant-design/plots` is optional.** It is a React wrapper plus a converter from shorthand configuration to G2 specs. The plugin's cost of using it is detailed in §4.2 and §5.

### 1.3 Where `@antv/g` fits

`@antv/g` is the underlying rendering engine shared by G2 / G6 / S2 / F2 (scene graph + multiple rendering backends + text measurement + event system). But **that sharing is inconsistent**:

| Package | Underlying engine | Evidence |
| --- | --- | --- |
| G2 | `@antv/g ^6.1.24` | `G2/package.json` |
| G6 | `@antv/g ^6.1.28` | `G6/packages/g6/package.json:63` |
| S2 | `@antv/g ^6.3.1` | `S2/packages/s2-core/package.json:77` |
| X6 | **No `@antv/g`**; native SVG/HTML | `X6/package.json:44-49` |
| L7 | **Custom WebGL engine** (gl-matrix + custom shaders) | `L7/packages/core/package.json:23-31` |
| F2 | **`@antv/f-engine`** (separate mobile engine) | `F2/packages/f2/package.json:35` |

The six libraries use **four underlying engines**, and even the three sharing `@antv/g` specify different versions (6.1.24 / 6.1.28 / 6.3.1). Using them in one project introduces multiple `@antv/g` instances.

### 1.4 Maintenance status (specific checks for F2 and L7)

| Repository | Stars | Archived | Last commit | Commits in past 90 days | Open issues | Last npm release | Assessment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **G2** | 12,591 | false | 2026-07-15 (site announcement) | **4** | 174 | 2026-01-06 | **Stalled** |
| G6 | 12,248 | false | 2026-07-15 | 3 | 322 | 2026-05-08 | Stalled |
| X6 | 6,668 | false | 2026-08-11 | 8 | 137 | 2026-08-11 | Active |
| S2 | 1,685 | false | 2026-06-11 | 13 | 94 | 2026-06-12 | Slowly active |
| L7 | 4,048 | false | 2026-07-30 | **73** | 199 | 2026-07-30 (beta) | **Active code, unattended issues** |
| **F2** | 7,994 | false | **2026-04-07** | **0** | **303** | **2025-11-10** | **Effectively unmaintained** |
| `antvis/G` (rendering foundation) | 1,210 | false | **2026-03-01** | **0** | 42 | 2025-12-24 | **Dormant** |
| G2Plot | 2,654 | false | 2026-03-03 | 0 | 460 | 2025-09-19 | Unmaintained |
| ant-design-charts | 2,233 | false | **2026-01-29** | **0** | 272 | 2025-12-24 | **Unmaintained** |

**F2**: 0 commits in the past 90 days, 0 open PRs, 303 open issues, no npm release for 278 days, and all 3 new issues in 2026 unanswered. **Neither the repository nor its README declares deprecation or archival.** Updates stopped silently; npm and the README provide no warning.

**L7**: 73 commits in the past 90 days, with v3 in development (`3.0.0-beta.1` was released, then rolled back in favor of `2.30.0-beta.x`). Yet the latest 5 open issues (2026-06 to 2026-08) all have 0 comments. Code is progressing while the community is unattended.

**The most consequential finding**: `ant-design/ant-design-charts`, home to `@ant-design/plots`, has had **0 commits since 2026-01-29**, with 272 open issues unattended. The plugin currently builds on this layer.

### 1.5 What installing one package gives you

Installing `@ant-design/plots` gives you the full statistical chart suite, React bindings, and a configuration converter, **but also unconditionally includes `@antv/g2-extension-plot` and the entire `@antv/g` distribution** (including 200 KB of html2canvas; see §4.2).

The minimum combination for common needs (see §2) is **4 packages** (g2 + g6 + x6 + s2), rising to **8 packages** with maps and mobile support.

---

## 2. Chart type coverage

### 2.1 Coverage matrix

| Chart type | Support | Package | Extra dependencies | Limitations |
| --- | --- | --- | --- | --- |
| Line / bar / area / scatter | Built in | G2 `mark.line/interval/area/point` | No | None (`G2/src/lib/core.ts:232-255`) |
| Pie | Built in | G2 `interval` + `coordinate.theta` | No | Requires explicit theta coordinates |
| Relationship / network graph | Built in | **G6** (G2 also has `mark.forceGraph`) | No | Nine G6 layouts (`G6/.../build-in.ts:153-173`) |
| Flowchart | Built in (editor primitives) | **X6** | Automatic layout needs `@antv/layout` | X6 provides only primitives; official flowchart demo is **571 lines** |
| Mind map | Built in (read-only rendering) | **G6** `mindmap` layout | No | Interactive insertion/deletion requires custom X6 code; demo is **390 lines** |
| Treemap | Built in | G2 `mark.treemap` | No | None (`G2/src/lib/graph.ts:21`) |
| Tree | Built in | G2 `mark.tree`; three G6 tree layouts | No | None |
| Gantt | **Custom data preprocessing required** | G2 `interval` | No | **No dedicated mark**; lacks dependency arrows, milestones, progress bars, and timeline zoom |
| Sankey | Built in | G2 `mark.sankey` | No | None |
| Funnel | Built in | G2 `interval` + `shape: funnel` | No | Requires shape + `symmetryY` + transpose together |
| Map | Built in | G2 `geoView` (no basemap); **L7** (with basemap) | L7 requires `@antv/l7-maps`; administrative regions also need `@antv/l7plot` | G2 has **no tile basemap**; L7 requires an Amap/Mapbox key |
| Pivot table / crosstab | Built in | **S2** | No | None |
| Timeline | **Multiple marks must be combined** | Hand-assembled G2 / X6 | No | **Not built in**; X6 demo is **543 lines** |
| Gauge | Built in | G2 `mark.gauge` / `mark.liquid` | No | None |
| Word cloud | Built in | G2 `mark.wordCloud` | None for G2 | F2 requires `@antv/f2-wordcloud` |
| **Calendar heatmap** | **Custom data preprocessing required** | G2 `mark.cell` | No | **No calendar layout or demo anywhere in the repository**; calculate week number/day of week yourself |
| Box plot | Built in | G2 `mark.box` / `mark.boxplot` | No | None |
| Radar | Built in | G2 `coordinate.radar` + `AxisRadar` | No | Filled rendering requires overlaying line + area marks |
| Chord | Built in | G2 `mark.chord` | No | None |
| Sunburst | Built in, but **requires an extra package** | `@antv/g2-extension-plot` | **Yes** | G2 core has only `partition` (icicle chart) |
| Parallel coordinates | Built in | G2 `coordinate.parallel` | No | None |
| K-line / candlestick | **Multiple marks must be combined** | G2 (`link` + `interval`) | No | No dedicated mark; compute rising/falling colors yourself (F2, by contrast, has a built-in `Candlestick`) |
| Waterfall | **Custom data preprocessing required** | G2 (`link` + `interval`) | No | Cumulative values must be written into the data; connectors require a `custom` transform |
| Heatmap (matrix) | Built in | G2 `mark.cell` / `mark.heatmap` | No | None |
| Streamgraph | Built in | G2 `area` + `stackY` + `symmetryY` | No | Requires explicitly chaining two transforms |

### 2.2 The cost of needing multiple libraries for multiple chart types

**Minimum combination: 4 packages** (`@antv/g2` + `@antv/g6` + `@antv/x6` + `@antv/s2`). This grows to 8-10 as needed: sunburst `+g2-extension-plot`, maps with basemaps `+l7 +l7-maps +l7plot`, X6 layout `+layout` or `+hierarchy`, mobile `+f2`.

Three costs were confirmed by testing:

**(1) Size**: The four packages unpack to 8.42 / 7.25 / 8.17 / 14.78 MB respectively. Their bundled runtime sizes cannot be estimated by simple addition, but **the foundations are not shared**: X6 does not use `@antv/g`, and L7 has its own WebGL engine. Adding a second library therefore effectively adds a second complete runtime.

**(2) Inconsistent API styles**: five mental models:

| Package | Paradigm |
| --- | --- |
| G2 | Declarative grammar of graphics: `chart.options({type, data, encode, scale, coordinate, transform})` |
| G6 | Declarative configuration object: `new Graph({data:{nodes,edges}, node, edge, layout, behaviors})` |
| X6 | **Imperative**: `new Graph({container})`, then `graph.addNode()`, with per-node `attrs` |
| S2 | Three-argument constructor: `new PivotSheet(dom, dataCfg, options)` |
| L7 | Scene + chained layers: `new Scene({map})` + `new PointLayer().source().color()` |
| F2 | JSX / React component tree |

**(3) No shared themes or shared theme package**:

- G2: `colorBlack` / `colorStroke` / `category10` / `padding1` (`G2/src/theme/light.ts:5-49`)
- G6: `bgColor` / `nodeColor` / `edgeColor` / `textColor` (`G6/packages/g6/src/themes/light.ts:4-21`)
- S2: `PaletteMeta` structure + palette computation through `generatePalette` (`S2/.../theme/palette/default.ts:4-30`)
- F2: Flat configuration object (`F2/packages/f2/src/theme.ts`)
- X6: **No theme system at all**; `src/style/themes/default.less` contains only a class-prefix variable, and styling depends entirely on per-node `attrs`

**Direct consequence for this plugin**: The current injection logic for following Obsidian's light/dark theme (`chart-theme.ts`: 40 lines of code + 5 configuration-side `apply*` functions) is **specific to G2**. Adding a relationship graph or pivot table would require separate implementations for G6 / S2; none of this code could be reused.

The family's only genuine cross-package interoperability is S2's `pivot-chart` extension, which renders G2 charts inside cells (`S2/.../pivot-chart/cell/chart-data-cell.ts:2`). Otherwise, the packages do not interoperate.

### 2.3 Common types the family does not provide

**No built-in implementation; build it yourself**:

1. **Calendar heatmap**: No implementation or demo across six repositories; documentation merely lists it as a use case for the `cell` mark (`G2/site/docs/manual/core/mark/overview.en.md:94`).
2. **Timeline**: No dedicated mark/component. The official X6 demo is 543 lines.
3. **Gantt**: No dedicated mark. The documented approach uses `interval` with paired `y/y1` values + transpose, without dependency arrows, milestones, progress bars, or timeline zoom.

**Custom data calculations required**: Waterfall (manual cumulative values), candlestick (two overlaid marks + custom rising/falling classification).

**Hundreds of lines required**: Editable flowcharts / BPMN / ER / organization charts (official X6 showcases: flowchart 571 lines, bpmn 395 lines, dag 382 lines, er 348 lines).

---

## 3. Sixteen-item comparison

**Line-count convention**: Counts cover **code lines** implementing each item in `src/render/chart-tag-config.mjs` (1082 total lines: **699 code / 339 comments / 44 blank**, with comments accounting for **33%**). Comments are excluded; work spanning multiple files is identified separately.

**Overall count**: The sixteen items account for about **393 lines of code** in `chart-tag-config.mjs`, plus **174 comment lines specifically documenting pitfalls and why alternative approaches fail**. Those 174 lines are necessary records of engine workarounds, not excessive documentation.

| # | Requirement | Assessment | Actual lines | Pitfalls |
| --- | --- | --- | --- | --- |
| 1 | Configurable line thickness | **One configuration option** | **1 line** (`LINE_STROKE`, :47) | The v5 theme defaults to 1 (v4 used 2), turning lines hair-thin after upgrading; the old width must be set explicitly. This is a hardcoded constant, **not exposed to users** |
| 2 | Data-label collision avoidance (dodge first, hide as fallback) | **A little code** | **5 lines** (`LABEL_TRANSFORM`, :110-114) + 6 comment lines on ordering | The three transforms **must stay in order**: each starts by making all labels visible, and they compose left to right. **A later hiding transform undoes the earlier one's hiding**, so only one hiding transform is allowed, and it must come last. A separate view-level `labelTransform` **never took effect** (see "Dead configuration" below) |
| 3 | Remove the duplicate right axis in combo charts | **A little code** | **11 lines** (`lineAxis` ternary, :811-823) | `position: "right"` was originally hardcoded unconditionally. The line and its points share a y scale; G2 groups and merges guides by scale, so the `lineChild`/`pointChild` axis configurations must be **identical**, or the later one overwrites the earlier one |
| 4 | Center stacked-bar numbers inside each colored segment | **A little code** | **11 lines** (`LABEL_CENTER` :154-159 + `valueLabel` branching :434-438) | Three coupled requirements: reset `dy` to zero, **remove all three callbacks** that distinguish positive/negative values (`inside` works for both), and leave the transform chain empty. `"middle"`/`"center"` **are invalid values and throw exceptions** |
| 5 | Legend marker size and shape | **Custom implementation** | **25 lines** (custom symbol: 10 lines :60-69 + constants: 2 lines + `legendConfig`: 13 lines) + **12 lines** explaining pitfalls | Three defects: built-in `line` draws a **vertical line** (`G2/src/utils/marker.ts:114-118` actually uses `M x,y+r → L x,y-r`); built-in `hyphen` is horizontal, but `hyphen.style = ['stroke','lineWidth']` (:160) triggers inverse scaling through `scaleToPixel`; `itemMarkerSize` is **one scalar shared by the entire legend**, so squares needing 12 and dashes needing 22.7 cannot coexist. The only solution is a custom shape registered with `.style = ['fill']` (fill shapes always have lineWidth 0, avoiding inverse scaling). Also, **explicitly set** `itemMarkerLineWidth: 0`; otherwise 4 is inserted automatically and shrinks squares by 30% |
| 6 | Center the legend at the top | **One configuration option** | **2 lines** (`position` + `layout.justifyContent`) | There is no `align` key; alignment belongs under `layout`. **Centering uses the legend's bounding box (≈full canvas width), not the plot area**, shifting single-axis charts about 14px left. No configuration option centers relative to the plot area |
| 7 | Unit-text placement | **Custom implementation outside the engine** | **About 25 lines / 2 files** (17 configuration lines + `ChartFigure`'s `unitLine` and JSX) | Both engine approaches failed in testing: after making axis titles horizontal, layout code **unconditionally** adds title dimensions to horizontal space (ignoring `titlePosition`); chart-level `title` expands top space from 28px to 64px and supports **only one title**, insufficient for two units on dual-axis charts. The final solution **uses the DOM outside the engine** |
| 8 | Tooltip (compactness / brightness / text stroke / border) | **Custom implementation** | **41 lines** (`TOOLTIP_CSS` :196-210 + `tooltipStyle` :594-608 + `applyTooltipStyle` :614-623) | The component writes its default stylesheet as **inline styles** through `element.style.cssText +=`. Without `!important`, `styles.css` cannot override them; use `interaction.tooltip.css`. The dark theme separately colors title / name-label / value `#A6A6A6`; **override all three individually**. The `-webkit-text-stroke` **shorthand cannot be used** (it resets the width); use the `-webkit-text-stroke-width` + `-webkit-text-stroke-color` longhands. Known engine bug: the newly created popup is not yet in the DOM and measures 0×0, so **the first hover after every rerender is misplaced for one frame** (left unfixed, masked by `right-bottom` positioning) |
| 9 | Highlight specific x values (bold + band / vertical line) | **Custom implementation; only two of three behaviors achieved** | **40 lines** (4 functions + integration) + **66 lines** explaining pitfalls | Three upstream semantics: **bold ✅** (`labelFontWeight` accepts a callback); **background behind the label ❌ no engine hook**: axis labels are bare `@antv/g` `Text`; grep for `background` in `@antv/component@2.1.11`'s `esm/ui/axis/` yields **zero matches** (`backgroundFill` exists only in legend / indicator / timebar / select); **force visibility during thinning ❌ no hook**: `esm/ui/axis/overlap/autoHide.js:14` exposes only `keepHeader` / `keepTail`, with no per-item exemption. **Workaround**: draw the background in the plot area (`rangeX` bands / `lineX` vertical lines attached to annotations), requiring separate implementations for two x-scale types. **Line charts cannot use bands**: `scale.getBandWidth?.(...) \|\| 0` in `mark/range.ts:14` **always returns 0** for point scales, collapsing the band to zero width |
| 10 | 8% y-axis headroom + rounded ticks | **Custom implementation** | **41 lines** (`headroomMax`+`yScale`+`domainTicks`+`Y_AXIS`: 27 lines + stacked-sum maximum: 14 lines) | The engine has no headroom-ratio concept; calculate `max × 1.08` and pass it as `domainMax`. Import `wilkinsonExtended` from `@antv/scale` and **wrap it to filter ticks outside the domain**. Stacked-bar maxima require reducing each period's stacked sum. DualAxes defaults every child's y scale to `independent`; **explicitly disable it** to share scales grouped by key |
| 11 | Follow host theme (rebuild on light/dark changes) | **Custom implementation** | **About 100 lines / 4 files** (`chart-theme.ts`: 40 code lines + 5 configuration-side `apply*` functions: ≈44 lines + `ChartFigure` listener: 6 lines + `main.tsx` broadcast: 10 lines) | Engine themes do not read host CSS variables (G2 draws on canvas; values require `getComputedStyle`). **All five color settings are hardcoded**: gridlines / hover overlay / hover vertical line / tooltip / label stroke; each needs placeholder configuration for later injection. **Markdown rerendering is unsafe** (races with reading-view virtualization and loses charts); broadcast an event so each mounted component rebuilds itself. **Configuration objects cannot be reused**: plots mutates them in place during rendering (moves `label` into `labels` and adds `__transform__`); **rendering the same object again permanently clears labels**, so every rebuild must call `build()` afresh |
| 12 | PNG export | **One configuration option** | **About 6 lines** (button in `ChartFigure`) | Uses plots' `downloadImage()`, internally native `canvas.toDataURL()`. **Note**: direct `@antv/g2` use lacks this wrapper; retrieve the canvas yourself (about 5 lines; see §5) |
| 13 | Numeric-label stroke (two-layer rendering) | **Custom implementation** | **26 lines** (`labelTextStyle` :468-482 + `applyLabelStyle` :490-500) + **26 lines** explaining pitfalls | The v5 renderer **fills text before stroking it**. The stroke is centered on the outline, covering `lineWidth/2` on each side; at `w=2`, testing showed **the text disappeared entirely**. Two layers are required (halo + text). The upper layer must have a **transparent stroke matching the lower layer's width**; otherwise their `renderBounds` differ and `exceedAdjust` / `overlapDodgeY` **separate the halo from the text** |
| 14 | Reverse data-label placement for negative values | **A little code** | **8 lines** (`isNegative` + `LABEL_OUTSIDE`, :137-144) | All three keys are required (`position` / `textBaseline` / `dy`): **the top of a negative bar's bounding box is the zero axis**. Leaving the label at `'top'` pins it to 0, away from the downward bar |
| 15 | Hover column band / vertical line | **Custom implementation** | **44 lines** (4 constants + 4 style/apply functions) | The engine **hardcodes** overlay color to `#CCD6EC @0.3`, ignoring both themes and light/dark mode (on a dark background it produces `#52555C`, 52 brighter than the background). The **`state.active` placeholder is required**: `mergeState` dispatches by mark key; without those keys on the mark, injection has no destination. Combo charts also need the hover vertical line disabled: tooltip selection uses `.some()`, so **one line mark makes the entire view use seriesTooltip** |
| 16 | Dual-axis combo chart | **Custom implementation** | **116 lines** (`combo` branch :758-898) + 25 comment lines | The largest item. Points must be **sibling marks** of the line, not `point` shorthand (which inherits neither `data` nor `scale`, and is always appended last, covering bars). A chart has **only one color scale**; separate ranges on two marks overwrite each other, so assemble one range in drawing order at the top level. **`interaction` must be top-level** so `bubbleOptions()` merges it back into the view. `annotations` must also be top-level, or the combo chart draws them three times |

### Assessment summary

| Category | Count | Items |
| --- | --- | --- |
| **Built-in defaults** | **0** | — |
| **One configuration option** | **3** | 1 line thickness, 6 top-centered legend, 12 PNG export |
| **A little code (<10 lines)** | **3** | 2 collision avoidance (5), 14 negative-value reversal (8), 3 duplicate right-axis removal (11, slightly over) |
| **Custom implementation** | **10** | 4 stacked-label centering, 5 legend markers, 7 unit placement, 8 tooltip, 9 x-value highlighting, 10 y-axis headroom, 11 theme following, 13 label stroke, 15 hover band, 16 dual-axis combo |
| **Impossible** | **2** (two subitems of item 9) | Axis-label background, forced visibility during thinning |

### Dead configuration that never took effect

`VIEW_LABEL_TRANSFORM` was configured at the top level to provide cross-mark label collision avoidance, but **never ran**. Both sides were checked in source:

- The `@ant-design/plots` `VIEW_OPTIONS` allowlist (`es/core/constants/index.js:27-56`) **does not include `labelTransform`**. The top-level value is pushed into each mark and deleted from the top level.
- G2 **reads it only from the view node**: `G2/src/runtime/plot.ts:1188` contains `const { markState, labelTransform } = view;`.

**Nothing reads** the copy on each mark. The test at the time only asserted that the configuration object contained the key, so it passed: **the configuration looked correct but had no effect**.

It was also a latent failure: numeric labels use two layers at identical positions, `overlapHide` works first-come, first-served, and the text layer always follows the halo. If the transform ever actually ran, **all text layers would be hidden and every number would disappear**.

**Relevance to engine selection**: This is not unique to AntV; it is an inherent risk of configuration-driven systems with an intermediate conversion layer. When evaluating the other two engines, check **whether they have similar multilayer configuration conversion**.

---

## 4. Hard-constraint checks

### 4.1 Licensing

**All MIT**, checked package by package in `package.json`: `@ant-design/plots` / `@antv/g2` / `@antv/g` / `@antv/g-lite` / `@antv/component` / `@antv/coord` / `@antv/scale` / `html2canvas`. **No compliance risk.**

One exception to record: the `antvis/G` **repository** has no license file (GitHub API returns `license: null`), although npm package metadata says MIT.

### 4.2 Size (all figures in this section measured locally)

**Build settings**: esbuild, `target: es2017`, `format: cjs`, `minify: true`, `treeShaking: true`, with `obsidian` / `electron` / Node builtins external.

#### Current bundle composition (`main.js` = 1,658,760 B, 1620 KB; gzip 496,456 B)

| Package | Bytes | KB | Share |
| --- | --- | --- | --- |
| `@antv/g2` (nested copy under plots) | 418,240 | 408.4 | 25.2% |
| `@antv/g-lite` | 227,232 | 221.9 | 13.7% |
| **`html2canvas`** | **205,571** | **200.8** | **12.4%** |
| `@antv/component` | 150,018 | 146.5 | 9.0% |
| Project code | 78,691 | 76.8 | 4.7% |
| `lodash` | 75,441 | 73.7 | 4.5% |
| `@ant-design/plots` | 74,391 | 72.6 | 4.5% |
| `gl-matrix` | 41,394 | 40.4 | 2.5% |
| `@antv/g-canvas` | 38,355 | 37.5 | 2.3% |
| `@antv/coord` | 37,163 | 36.3 | 2.2% |
| `@antv/g` | 36,332 | 35.5 | 2.2% |
| **`d3-geo`** | **29,084** | **28.4** | 1.8% |
| `preact` | 24,913 | 24.3 | 1.5% |
| `@antv/scale` | 22,413 | 21.9 | 1.4% |
| **`d3-scale-chromatic`** | **18,185** | **17.8** | 1.1% |
| `d3-shape` | 15,842 | 15.5 | 1.0% |
| **`d3-hierarchy`** | **14,518** | **14.2** | 0.9% |
| **`d3-force`** | 7,061 | 6.9 | 0.4% |
| `@antv/g2-extension-plot` (+ 4,176 from its nested g2) | 10,594 | 10.3 | 0.6% |
| **`d3-quadtree`** | 5,018 | 4.9 | 0.3% |

> **These differ from the task brief**: The brief lists d3-geo 14KB / d3-scale-chromatic 12KB / d3-hierarchy 7KB / d3-quadtree 5KB. This report measures **actual bytes included after bundling and minification** (esbuild metafile `bytesInOutput`); the earlier measurements may use a different basis. Use this section's figures.

#### Three large removable components

**(1) `html2canvas`: 200.8 KB, the largest component and entirely unused**

The full dependency chain was traced: `@antv/g` 6.3.1 lists `html2canvas ^1.4.1` in its `dependencies`, and `@antv/g` **publishes only the prebundled `dist/index.esm.js`, with `"sideEffects": true`**. esbuild therefore cannot tree-shake it away. Every G2 shape file uses `import ... from '@antv/g'`, so any use of G2 brings it in.

The only use of html2canvas in `@antv/g` is `ImageExporter.toCanvas()` (`dist/index.esm.js:2163`), which rasterizes HTML overlays above the canvas. This plugin instead exports PNG through `@ant-design/plots`' `downloadImage()` → `toDataURL()` → **native `canvas.toDataURL()`** (`es/hooks/useChart.js:24-28`), **never passing through ImageExporter**.

**Measured savings**: Add one esbuild line, `alias: { html2canvas: '<stub>' }`, and rebuild the entire plugin:

| | Bytes | KB | gzip |
| --- | --- | --- | --- |
| Current | 1,658,760 | 1620 | 496,456 |
| html2canvas stubbed | **1,450,138** | **1416** | **445,641** |
| **Savings** | **208,622** | **203.7 KB (12.6%)** | 50,815 |

**(2) Unused d3 modules: 72 KB**

| Module | Bytes | Imported by |
| --- | --- | --- |
| `d3-geo` | 29,084 | `g2/esm/composition/geoView.js`, `d3Projection.js` (map projections) |
| `d3-scale-chromatic` | 18,185 | `g2/esm/runtime/scale.js` (built-in palettes) |
| `d3-hierarchy` | 14,518 | `g2/esm/mark/pack.js`, `data/tree.js`, `data/cluster.js` |
| `d3-force` | 7,061 | `g2/esm/mark/forceGraph.js`, `mark/beeswarm.js` |
| `d3-quadtree` | 5,018 | Transitive dependency of `d3-force` |
| **Total** | **73,866** | **72.1 KB** |

The root cause is that the `Chart` exported by G2's default `esm/index.js` entry uses `stdlib()` (registering every mark), while `package.json` marks `./esm/exports.js` as sideEffects. **The default entry cannot be tree-shaken.**

**(3) The plots layer itself: 72.6 KB + its `@antv/g2-extension-plot` dependency: 10.3 KB + `lodash`: 73.7 KB**

#### Savings from selective imports directly from `@antv/g2`

G2 offers tiered libraries: `litelib` / `corelib` / `plotlib` / `graphlib` / `geolib` / `stdlib` (`esm/lib/`). **`corelib` covers everything this plugin uses**: marks (interval / line / point / lineX / rangeX), interactions (elementHighlight / tooltip), and all three labelTransforms.

Four entry variants were measured (engine entry only, excluding plugin application code):

| Variant | Bytes | KB | gzip | Versus current |
| --- | --- | --- | --- | --- |
| A. `@ant-design/plots` (**current**) | 1,573,583 | 1536.7 | 466,975 | Baseline |
| B. `@antv/g2` default `Chart` (stdlib) | 1,376,373 | 1344.1 | — | −192.6 KB |
| C. `@antv/g2` + `corelib` | 1,289,281 | 1259.1 | 376,558 | −277.6 KB |
| D. `@antv/g2` + handpicked library | 1,130,548 | 1104.1 | 329,683 | −432.6 KB |
| **C + html2canvas stub** | 1,080,447 | 1055.1 | — | **−481.6 KB** |
| **D + html2canvas stub** | **923,041** | **901.4** | **281,079** | **−635.3 KB (−40.4%)** |

**Conclusions**:

- **Lowest cost, highest return**: One esbuild alias stubbing html2canvas **saves 203.7 KB (12.6%)**, with no application code changes.
- **Switch to `@antv/g2` + `corelib`**: Save approximately another 277.6 KB on the engine side.
- **Combine both changes (handpicked library)**: Total engine savings of **635.3 KB / 40.4%**. The entire plugin bundle could drop from 1620 KB to **about 990 KB**.

See §5.1 for implementation cost.

### 4.3 ES2017

**Passes, with no hidden issues found.**

- The project's esbuild already uses `target: 'es2017'` (`esbuild.config.mjs:22`), and the output passes parsing with `node --check`.
- The pitfall recorded in the plan was explicitly checked: esbuild **silently** rewrites regex lookbehind as `new RegExp("…")`, deferring syntax failures until plugin load. A full grep for `(?<=` / `(?<!` across `@ant-design/plots/es`, `@antv/g2/esm`, `@antv/g/dist/index.esm.js`, and `@antv/g-lite` returned **zero matches**. The bundle likewise contains no rewritten `new RegExp` with lookbehind.
- The `@antv/g` distribution is Babel ES5 output (including `_regeneratorRuntime` / `_classCallCheck`), already below ES2017.

### 4.4 Canvas / PNG export

**Works in the current implementation.**

- The rendering backend is `@antv/g-canvas` (actual canvas, not SVG).
- Export path: `ChartFigure` button → plots' `downloadImage(name)` → `toDataURL()` → **native `canvas.toDataURL('image/png')`** (`es/hooks/useChart.js:24-28`), then create and click an `<a download>`.
- **It does not use `@antv/g`'s `ImageExporter`**, so the 200 KB of html2canvas is entirely dead weight (see §4.2).
- **Side effect to note**: A native canvas snapshot **excludes DOM overlays such as tooltips**. That is correct for this plugin.
- Direct use of `@antv/g2` provides no `downloadImage` wrapper; retrieve the canvas and call `toDataURL` yourself (about 5 lines).

### 4.5 Theme switching: is there a better alternative to rebuilding?

**Current sequence**: `main.tsx` listens for host `css-change` → 150ms debounce → `window.dispatchEvent('mosaic:theme-change')` → each `ChartFigure` listener calls `setRebuildEpoch(e => e+1)` → `useMemo` reruns `build(granularity)` → `withTheme()` reinjects all five colors → full chart rebuild.

**Assessment: This is already the best option in G2 5.4.8; no cheaper path exists.** Three reasons are supported by source:

1. **G2 has no API for changing themes in place.** `KEYS = ['theme','type','width','height','autoFit']` in `api/runtime.ts:403` goes through a full `options()` reset and rerender, equivalent to the current rebuild and saving no rendering cost.
2. **All five colors are hardcoded by the engine**, which does not read host CSS variables (G2 draws on canvas; reading CSS tokens requires `getComputedStyle`). Injection is unavoidable.
3. **Markdown rerendering is unsafe**: it races with reading-view virtualization and loses charts. Code comments already record this as a tested finding.

**The hidden cost**: Every rebuild **must call `build()` afresh; never pass the previous configuration object back to the renderer**. plots **mutates** its input in place (moves `label` to `labels` and adds `__transform__`), and its transform **is not idempotent**. Rendering the same object again treats `labels` as leftovers from the previous pass and clears them, so **numeric labels disappear permanently**. This is the conversion layer's second pitfall (the first is the dead configuration at the end of §3).

### 4.6 CJK

**Better than expected, and a real strength of AntV.**

- **Line breaking**: `@antv/g-lite` implements full **Kinsoku Shori** rules. `dist/index.esm.js:11417-11444` contains four sets of punctuation regexes for characters forbidden at line starts/ends in zh-CN / zh-TW / ja-JP / ko-KR, used by `TextService.shouldBreakByKinsokuShorui()`. This is an unusually thorough implementation.
- **Ellipsis / wrapping**: G2 axis components attach two label transforms by default: `ellipsis` (`G2/src/component/axis.ts:261`, `minLength: 20`) and `wrap` (`:264`, `wordWrapWidth: 100, maxLines: 3, recoveryWhenFail: true`).
- **Measurement**: Uses canvas `measureText` + a font-metrics cache (`fontMetricsCache`), naturally measuring full-width CJK characters correctly.
- **G2 itself has no CJK-specific logic** (a repository-wide grep for `cjk|chinese|east.?asian|fullwidth` returns zero matches); `@antv/g-lite` handles it all.

**No CJK issues were observed in practice**: The plugin uses many Chinese labels, and the plan's real-host validation checklist records no CJK rendering defects.

### 4.7 Responsive sizing

**Engine support is insufficient; the plugin already supplies two compensating layers.**

- G2's `autoFit` **only listens to `window.addEventListener('resize')`** (`_bindAutoFit` in `api/runtime.ts:496-510`, with 300ms debounce). **It cannot detect changes to the container itself**, yet opening sidebars, dragging split panes, and switching panels in Obsidian do not trigger window resize.
- Worse, G2's `sizeOf()` measures the container under `autoFit` and **falls back to a 640×480 canvas when the measurement is 0**. Reading-view virtualization detaches paragraphs (or uses `display:none`), producing exactly that measurement. A render during this interval sets the canvas to width 640, **where it stays**.

The plugin therefore implements **two `ResizeObserver` instances**:

1. `ChartFigure` (about 40 lines): Watches host width and rebuilds after a 150ms debounce. `lastWidth` deliberately records the width used for the last actual rebuild, not the observer's last measurement; otherwise the 0×0 reported during detachment would swallow the resize.
2. `attachSizeGuard` in `Chart.tsx` (about 20 lines): Watches G2's own container and calls `forceFit()` when its layout box becomes available again.

Both must explicitly check `clientWidth === 0` to avoid turning a correctly sized canvas into 640×480. **These engine defects impose about 60 lines of code on the consumer.**

### 4.8 Maintenance activity

**This is the most unfavorable finding in the evaluation.**

#### G2 5.x release cadence

| Version | Date | Since previous release |
| --- | --- | --- |
| 5.4.3 | 2025-11-05 | — |
| 5.4.4 | 2025-11-12 | +6 days |
| 5.4.5 | 2025-11-21 | +9 days |
| 5.4.6 | 2025-11-26 | +5 days |
| 5.4.7 | 2025-12-09 | +12 days |
| **5.4.8** | **2026-01-06** | +27 days |
| **(As of the research date)** | **2026-08-16** | **+221 days, no new release** |

Patches still arrived every 5-12 days in November-December 2025. **Releases stopped entirely after 2026-01-06.**

Observed `dist-tags`: `{"v3-latest":"3.5.19","alpha":"5.3.4-alpha.0","beta":"5.3.6-beta.4","latest":"5.4.8"}`.

**The locally cloned `antvis/G2` main branch also reports 5.4.8 in `package.json`**. The project is **already on the latest version, with no upgrade available**.

#### Issue responses

Only **6 issues** were opened in G2 over the past 3 months (3 reported the supply-chain attack). Comments were checked individually for **all** 10 open issues dated 2026-04-14 through 2026-07-22, excluding bots:

- **8 had never received a human reply**
- Only 2 had maintainer replies, both from the same person, averaging **5.1 days**
- **Both replies were in late April 2026; G2 had no further maintainer issue replies over the following 3.5 months**

**Important qualification**: Every issue receives an AI-generated reply from `github-actions[bot]` within 0 hours, signed "Regards, the G2 team / This reply was automatically generated by an AI assistant" (translated). **This 0-hour response is not a measure of maintenance activity.** In attack report #7402, the bot described the malicious `preinstall: bun run index.js` payload as "a build-tool upgrade / unified CI/CD workflow, with no production impact" (translated), which was **entirely wrong**.

#### v6 roadmap: not found

All six channels returned no evidence:

| Channel | Result |
| --- | --- |
| branches | Only `master` / `v5` (default) / `v3.5.x` / `v3.6.x` / `v4.0.x` / `v4.1.x` / `gh-pages`; **no v6 branch** |
| milestones | All closed; latest is `5.0.3`; **no open milestone** |
| issues (v6 in title) | Only match: `ci: migrate husky to v6.0.0` from 2021 (unrelated) |
| issues (RFC) | **total_count = 0** |
| discussions | All 381 discussions are Q&A; 0 for either v6 or roadmap |
| org projects | 11 total; the 3 open projects are unrelated to G2 v6 |

**Alternative signal: the team's direction**. The last G2 main-branch commit (2026-07-15, `9bc2ccf`) changed the official site's announcement banner to promote **Sive**, AntV's new AI-powered visualization creation platform (`site/.dumirc.ts:473-477`, `https://sive.antv.antgroup.com`). Around the same time, another commit was titled "chore: add Sive guidance to the automatic issue reply template" (translated). The organization's most actively advanced repositories in 2026 also focus on AI (Infographic: 6306 stars; mcp-server-chart: 4315; GPT-Vis; chart-visualization-skills), rather than traditional chart libraries.

**Interpretation: The team has shifted its focus from the G2 library to an AI platform.**

#### Supply-chain attack (2026-05-19): relevant to engine selection

Independently verified by comparing the registry's `time` and `versions` fields for "ghost versions":

- `@antv/g2`'s `time` contains **5.5.8 (2026-05-19T01:56:41Z)** and **5.6.8 (2026-05-19T02:06:01Z)**, but neither appears in `versions`: **both were unpublished**.
- The same pattern appears in **14 `@antv/*` packages** (g2 / g6 / x6 / s2 / l7 / f2 / g / g-canvas / g-svg / g-webgl / g2plot / scale / component / coord), each with 2 malicious versions clustered into the same two timestamp batches.
- GitHub issue **#7394 was confirmed to exist and be closed**, titled `[SECURITY] @antv/g2 5.5.8 is a malicious release — maintainer compromise, credential stealer in preinstall script` (created 2026-05-19). The malicious packages injected `"preinstall": "bun run index.js"` into `package.json`; the payload harvested `ghp_`/`npm_`/`AKIA`/`xox*-`/SSH private keys/JWTs.
- The official organization README added an announcement: affected packages removed within 4 hours.
- **The `@ant-design/*` scope was unaffected** (no ghost versions).
- **The GitHub Advisory Database still has no record** (`advisories?ecosystem=npm&affects=@antv/g2` returns 0 results), meaning **`npm audit` cannot detect it**.

**Practical impact**: The malicious versions are no longer on npm, and installing the latest version is safe. However, a range such as `^5.2.7` would have resolved to 5.6.8 on 2026-05-19. **Check whether this project's CI or local environment ran `npm install` that day; if so, clear caches and rotate credentials.** The incident also shows that the broad `^5.2.7` range used by `@ant-design/plots` provides no protection when an upstream maintainer account is compromised. **Pin critical dependencies to exact versions whether or not the engine is replaced.**

---

## 5. Improvements available within AntV

### 5.1 Remove `@ant-design/plots` and use `@antv/g2` directly

**Potential savings**: See §4.2: 277.6 KB on the engine side with corelib, up to 635.3 KB with a handpicked library + html2canvas stub. The full plugin bundle could fall from 1620 KB to about 990 KB.

**Code changes required**:

| Change | Effort | Details |
| --- | --- | --- |
| `Chart.tsx` (85 lines) | **Rewrite about 60-80 lines** | Replace rendering a plots React component with `new Chart({container})` + `chart.options(spec)` + `chart.render()` inside `useEffect`. Existing `attachSizeGuard` logic can remain unchanged |
| **Configuration shape** in `chart-tag-config.mjs` | **Moderate changes** | Current code uses plots shorthand (`xField`/`yField`/`colorField`/`chartType: "DualAxes"`); native G2 requires `encode: {x,y,color}` + `children`. **This is a net benefit**: writing G2 specs directly **bypasses the entire conversion layer**, eliminating the root causes of both dead configuration (§3) and non-idempotent configuration objects (§4.5) |
| PNG export | **+5 lines** | Retrieve the canvas and call `toDataURL` |
| `register()` import source | **1 line** | Change from `@ant-design/plots` to `@antv/g2`. **Also removes a latent risk**: importing from plots is currently necessary because plots bundles its own g2, leaving two g2 copies with separate shape registries. Direct g2 use leaves only one, removing this constraint |
| `preact` dependency | **Potentially removable** | plots has react/react-dom peerDependencies, currently supplied through preact/compat (24.3 KB). If the chart layer no longer needs React, removal depends on whether other components still use it |

**Risk**: `combo` / `combo-dual-axis` currently rely on plots' `DualAxes` component to assemble children and group scale keys. Rewriting these 116 lines is the main effort; guide merging on a shared x scale and color-scale range concatenation must be revalidated.

**Overall assessment**: **This is a worthwhile change**: it saves 40% in size and eliminates two known classes of pitfalls. But it requires **refactoring hundreds of lines and a full real-host regression pass**, not a quick incidental edit.

### 5.2 Does the latest version resolve the known limitations?

**None are resolved, and none will be.** The **locally cloned G2 main branch is version 5.4.8, exactly the version this project uses**, so no newer version is available. Each limitation was rechecked in the latest source:

| Known limitation | Latest-version status | Source evidence |
| --- | --- | --- |
| View-level `labelTransform` does not work | **Unchanged** | `G2/src/runtime/plot.ts:1188` still uses `const { markState, labelTransform } = view;`; plots' `VIEW_OPTIONS` still excludes the key |
| No background behind axis labels | **Unchanged** | Grep for `background` in `@antv/component@2.1.11`'s `esm/ui/axis/` yields **zero matches**; `backgroundFill` exists only in legend / indicator / timebar / select |
| No per-item exemption from thinning | **Unchanged** | `esm/ui/axis/overlap/autoHide.js:14` still exposes only `keepHeader` / `keepTail` |
| Built-in `line` legend marker is vertical | **Unchanged** | `G2/src/utils/marker.ts:114-118` still uses `M x,y+r → L x,y-r` |
| Built-in `hyphen` is unusable | **Unchanged** (correct horizontal shape, but inverse scaling applies) | `marker.ts:154-158` defines the correct shape, but `hyphen.style = ['stroke','lineWidth']` at `:160` triggers `scaleToPixel` |
| `rangeX` always has zero width on line charts | **Unchanged** | `G2/src/mark/range.ts:14` still uses `scale.getBandWidth?.(scale.invert(+C1[i])) \|\| 0` |
| `autoFit` ignores container changes | **Unchanged** | `G2/src/api/runtime.ts:496-510` still only uses `window.addEventListener('resize', ...)` |

**Conclusion: These issues cannot be resolved by waiting for the next version; upstream has stopped releasing.**

### 5.3 Do official plugins or extensions fill the gaps?

**Essentially none are usable for this purpose.**

- `@antv/g2-extension-plot`: Official extensions add chart types (sunburst, etc.), **but address none of the presentation limitations above**. plots already includes it unconditionally (10.3 KB); direct g2 use allows removing it entirely.
- `antvis/g2-extensions` repository: **Last push 2025-09-15**, with no updates for nearly a year.
- `antvis/component` (axis/legend component library): **Last push 2026-05-18**, last npm release 2025-11-21. Axis-label backgrounds and per-item thinning exemptions would need changes here, but **upstream is inactive**.
- **No third-party community extension** was found to fill these gaps.

### 5.4 Two actions to take regardless of engine choice

1. **Stub `html2canvas`**: One esbuild alias **saves 203.7 KB (12.6%)**, with no application code changes or behavior changes (the export path was confirmed not to use it). This is the highest-return finding in the evaluation.
2. **Pin dependency versions**: Given the attack in §4.8 and broad ranges such as `^5.2.7`, pin `@antv/*` to exact versions (or at least confirm that `package-lock.json` is committed and CI uses `npm ci`).

---

## 6. Three main strengths and weaknesses

### Strengths

1. **A high capability ceiling, with very few absolute engine limitations.** Only 2 subitems among the sixteen requirements (axis-label backgrounds and thinning exemptions) are truly unsupported, and acceptable workarounds were found for both (move indicators into the plot area). The grammar of graphics, combining mark + transform + encode + scale + coordinate, is an order of magnitude more expressive than configuration-based engines. Adding `rangeX`/`lineX` through `annotations`, for example, creates an ad hoc layer outside the data mapping, something configuration-based engines often cannot express.

2. **Thorough CJK support.** `@antv/g-lite` implements full Kinsoku Shori for four languages, and axis labels include ellipsis + wrap transforms. Despite the plugin's extensive Chinese labels, the real-host checklist records no CJK rendering defects. **Use this as a positive AntV baseline and explicitly test the other two engines against it.**

3. **`@antv/g2` is fully standalone, with a well-designed hierarchy of libraries.** No peerDependencies, no React requirement, clear `litelib`/`corelib`/`plotlib`/`graphlib`/`geolib` tiers, and measured 40% size savings from selective imports. **The architecture provides an escape route**, making the change in §5.1 feasible.

### Weaknesses

1. **Upstream maintenance has stopped, with no v6 roadmap.** G2 5.4.8 was released 221 days ago; all 4 commits in the past 90 days were site announcements; 8 of the latest 10 open issues received no reply, and the last maintainer reply was 3.5 months ago. `@antv/coord` has not released for 996 days, the `@antv/g` rendering foundation has 0 commits in the past 90 days, and the `@ant-design/plots` repository has 0 commits since 2026-01-29. Six channels yielded no v6 plans; the team publicly shifted toward the AI platform Sive. **The known limitations in §5.2 will therefore never be fixed, and any new problems will also fall to consumers.** An additional risk: the 2026-05-19 supply-chain attack exposed weak maintainer-account security, while the absence of a GitHub Advisory means `npm audit` still cannot detect it.

2. **Poor defaults are directly at odds with the user's core requirement.** Across sixteen items, **0 are built-in defaults**, only 3 need one configuration option, and **10 require custom implementation**. The user asked for an engine where "you do not have to think about where numbers go, how they look, horizontal collision handling, responsive sizing, and so on" (translated). Reality is the opposite: numeric-label strokes require inventing two-layer rendering (26 code lines + 26 comment lines); horizontal legend dashes require custom shape registration and inverse-scaling calculations (25 code lines + 12 comment lines); y-axis headroom requires custom calculations and tick algorithms (41 lines); unit placement must move outside the engine into the DOM; even responsive sizing needs two custom `ResizeObserver` instances (about 60 lines), because `autoFit` only listens for window resize. **33% of `chart-tag-config.mjs` consists of comments, including 174 lines specifically recording pitfalls and why alternatives fail.**

3. **The separate-library architecture makes complete coverage expensive.** Statistical charts use G2, relationship graphs G6, flowcharts X6, pivot tables S2, maps L7, and mobile charts F2: **six libraries using four underlying engines** (G2/G6/S2 share `@antv/g` at different versions; X6 uses native SVG; L7 has custom WebGL; F2 uses f-engine), **five incompatible API paradigms, and five incompatible theme formats (X6 has no theme system at all)**. The current Obsidian light/dark theme injection logic is specific to G2; adding a second category requires another implementation. Three common types—calendar heatmaps, timelines, and Gantt charts—have **no built-in implementation anywhere in the family**.

---

## 7. Uncertainties

These are explicitly identified, without speculation.

1. **The full application size with `@antv/g2` + `corelib` was not measured.** The A/B/C/D variants in §4.2 measure **engine entries** (`import` followed by `console.log`), excluding the plugin's 393 lines of chart configuration, and were not used to run actual rendering. **The estimate of about 990 KB for the complete plugin is extrapolated from engine-size differences, not a measured full build.** Confirming it requires implementing §5.1.

2. **The difficulty of rewriting the 116 `DualAxes` lines in §5.1 is unverified.** plots' `DualAxes` assembles children and groups scale keys. Equivalence of guide merging on a shared x scale and color-scale range concatenation after conversion to native G2 specs **has not been tested**; these remain the main risks.

3. **Runtime safety of the `html2canvas` stub was assessed only through static analysis.** The export path was confirmed to use native `canvas.toDataURL()`, bypassing `ImageExporter`, but **no export was tested in the real host** to check whether another path could invoke the stub. Real-host validation is required before adoption.

4. **Whether G2 updates are paused or permanently ended is unknown.** The repository is not archived, the README has no deprecation notice, and the package is not marked deprecated. **There is no official statement.** The 221-day release gap is a fact, but **no evidence establishes** whether it is a pause during a change of focus or a permanent end. (A relevant precedent: F2 has been effectively unmaintained for 278 days, also without an official statement.)

5. **Sive's relationship to G2 is unclear.** The only known facts are that G2's announcement banner began promoting Sive in 2026-07 and the automatic issue-reply template added Sive guidance. **Whether Sive is built on G2 and will contribute back, or is a separate replacement, could not be determined.**

6. **`@antv/g2-extension-plot`, `@antv/l7plot`, `@antv/layout`, and `@antv/hierarchy` were not cloned**, so their full capabilities could not be verified from local source. Findings about them in §2 rely only on imports and documentation references in the G2/X6/L7 repositories.

7. **The attack's actual impact on this project was not investigated.** The malicious versions were confirmed removed from npm, but **the project's `package-lock.json` and CI records were not checked** to determine whether `npm install` ran on 2026-05-19. The project must verify this separately.

8. **The brief's d3 module sizes (e.g., d3-geo 14KB) differ from this report's measurements (e.g., 28.4KB)**, and the reason for the discrepancy was not established. This report uses the esbuild metafile's `bytesInOutput`: actual minified bytes included in the bundle.

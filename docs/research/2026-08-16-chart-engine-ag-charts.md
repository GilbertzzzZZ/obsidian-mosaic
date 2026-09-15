# Chart engine evaluation: AG Charts

- Research date: 2026-08-16
- Evaluated version: AG Charts **14.1.0** (released 2026-08-05)
- Evidence priority: **published npm artifacts (tarballs) > repository source > official documentation > blogs**

> **Evidence paths:** During this research, Git cleaned up the first two `git clone` attempts after they failed partway through (`fetch-pack: invalid index-pack output`, unstable network); the third succeeded. **The main conclusions therefore rely on published npm tarballs.** These are stronger evidence than repository source: the repository's `latest` branch was at `14.1.0-beta.20260809`, whereas the tarball was the stable `14.1.0` release users would actually install. All `REPO` path references were checked again once the repository became available.
>
> Path abbreviations used below:
> - `TAR` = directory containing the unpacked npm tarballs
> - `TYPES` = `TAR/ag-charts-types/dist/types/src` (107 `.d.ts` files containing the complete public API types and JSDoc)
> - `COMM` = `TAR/ag-charts-community/dist/package/main.esm.mjs` (complete Community implementation, unminified, 2.4 MB, readable)
> - `ENT` = `TAR/ag-charts-enterprise/dist/package/main.esm.mjs`
>
> A few files read before the repository was removed use the `REPO` prefix (`REPO` = an ag-charts repository checkout at commit `2001e0c`).

---

## Summary

**AG Charts Community (MIT) covers 14 of this plugin's 16 current requirements almost entirely through configuration, is 16% smaller than the current `@ant-design/plots` bundle, has no third-party dependencies, and automatically tracks CSS variables—the hardest part of following Obsidian themes. The tradeoff is limited coverage: only 8 basic chart types; everything beyond bar/line/pie charts (radar, heatmap, Sankey, maps, gauges, tree charts), plus animations and hover highlighting, requires Enterprise ($499/developer). Network graphs, flowcharts, mind maps, Gantt charts, and word clouds are absent from the entire product line.**

---

## ⚠️ Initial assessment: are most core capabilities Enterprise-only?

**For this plugin's requirements: largely no (only 1 of 16 requires Enterprise). For broad coverage from a single vendor: yes.**

Three points explain the distinction:

1. **Community covers 15 of the plugin's 16 current capabilities.** Dual-axis combination charts, crossLines bands, label collision avoidance, PNG export, and CSS-variable theme tracking are all MIT.
2. **The only Enterprise-only requirement is item 15: a background band or vertical line on hover.** Both `crosshair` and `bandHighlight` are marked `enterprise: true` (`packages/ag-charts-community/src/chart/factory/expectedModules.ts:475-488`). Community requires a custom implementation.
3. **Community falls short on chart-type breadth.** It has only 8 series types: `bar / line / area / scatter / bubble / pie / donut / histogram`. **All remaining 27 series types are marked `enterprise: true`**, as are 14 plugin modules, including `animation`, `zoom`, `navigator`, `annotations`, and `contextMenu`.

Therefore, **AG Charts Community is an excellent candidate for improving bar/line/pie rendering, but AG Charts cannot provide every chart type from one vendor**: Enterprise has licensing costs, and the entire product line lacks network graphs, flowcharts, mind maps, Gantt charts, and word clouds.

---

## Licensing review

### Community: standard MIT, no additional restrictions

The `license` field in the `package.json` of `ag-charts-community` is `MIT`, and the package's `LICENSE.txt` contains **the complete, unmodified MIT license**:

> The MIT License
> Copyright (c) 2015-2026 AG GRID LTD
> Permission is hereby granted, free of charge, to any person obtaining a copy of this software … to deal in the Software **without restriction**, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies …

— Source: `TAR/ag-charts-community/LICENSE.txt`, lines 1–20

**There are no additional terms:** no attribution requirements beyond retaining the standard MIT copyright notice, no noncommercial restriction, no watermark, and no condition limiting free use to open-source projects. The top-level `REPO/LICENSE.txt` also states:

> This project is made up of many packages. There are two license types: MIT and Commercial.
> The following packages are MIT licensed: `ag-charts-community`, `ag-charts-angular` …

MIT packages (verified from npm `license` fields): `ag-charts-community`, `ag-charts-core`, `ag-charts-types`, `ag-charts-locale`, `ag-charts-react`, `ag-charts-angular`, `ag-charts-vue3`, `ag-charts-vue`.
Commercial packages: `ag-charts-enterprise`, `ag-charts-server-side`, `ag-studio`.

The official description of Community (https://www.ag-grid.com/charts/javascript/community-vs-enterprise/):

> **AG Charts Community**: **Free for everyone, including production use - no licence required.**

**Conclusion: Community permits internal company documentation, closed-source commercial use, and distribution with open-source plugins without additional conditions.**

### Enterprise: $499/developer, unsuitable for distribution with an open-source plugin

**Pricing** (source: https://www.ag-grid.com/license-pricing/):

The public pricing page lists only the Single Application tier; **the full price list is available only in the checkout configurator (https://www.ag-grid.com/ecommerce/)**:

| Product | Single Application (per developer) | Multiple Applications (per developer) | **Deployment add-on** (per production deployment) |
|---|---|---|---|
| **AG Charts Enterprise** | **$499** | $1,499 | **$750** |
| AG Grid Enterprise | $999 | $1,499 | $750 |
| Enterprise Bundle | $1,498 | $2,998 | $1,500 |

License terms (https://www.ag-grid.com/charts/javascript/community-vs-enterprise/):

> Licences for AG Charts Enterprise are available on a **per-developer, per-deployment basis**. Licences are **perpetual** and come with 1 year of support and updates.

The configurator defines the three licenses as follows (verbatim):

> **Single Application Development License** — Licenses **one** application, developed for **internal use** … Single Application Development Licenses are bound to an application name and **can't be reused on other applications**. For customer-facing applications you will also need a Deployment License add-on.
> **Multiple Application Development License** — Licenses **unlimited** number of applications, developed for internal use …
> **Deployment License Add-on** — Allows licensed developers to **sub-licence** AG Grid and / or AG Charts for **one application on one production environment** in perpetuity … **Only production environments require licensing. All other environments (eg development, test, pre-production) do not require a license.**

**⚠️ AG Charts has no separate EULA.** Both `https://www.ag-charts.com/eula/AG-Charts-Enterprise-License-Latest.html` and `https://www.ag-grid.com/eula/AG-Charts-Enterprise-License-Latest.html` return 404. The EULA link on the AG Charts pricing page points to `https://www.ag-grid.com/eula/AG-Grid-Enterprise-License-Latest.html`. **Both products share the same agreement** (currently v39), which **never mentions "AG Charts"**: it is a framework agreement, with the specific "Software" defined by the Quote.

**How developers are counted**—EULA section 3.5 (source: `TAR/ag-charts-enterprise/LICENSE.html`, v39 terms distributed with the package):

> each developer developing with or **modifying JavaScript code as part of the creation or Modification of an Application's user interface**, which user interface creation or Modification uses the Software, shall constitute a separate Licensee Developer. For example, if the Licensee has five developers working with JavaScript code with respect to the creation or Modification of the user interface of an Application and such creation or Modification uses the Software, **but only two developers are directly working with the Software, all five developers will be counted**

In other words, **all frontend developers working on that UI count, even if they do not work directly with AG Charts.**

**Can it be distributed with an open-source plugin? No**—EULA section 3.3:

> Use of the Software Materials pursuant to the Licence, shall include the right to install, load, launch, access, run, execute, operate and archive the Software Materials … for the Licensee's and its Affiliates **internal business purposes** and, save where otherwise provided in these Terms, **must not be licensed to any third party including as part of an Application**.

Distribution to third parties requires a separate **Deployment Licence Add-On**, defined in the EULA as:

> **Deployment Licence Add-On** means a licence of the Software granted to the Licensee **in addition to** either the Single Application Developer Licence and/or Multiple Applications Developer Licence, **which permits the Licensee to sub-licence the Software** in accordance with these Terms

**The static pricing page does not mention the Deployment Licence Add-On at all** (neither the current nor archived page contains "deployment"). The $750 / $1,500 prices were observed only in the checkout configurator and **can change at any time**.

**There is no open-source or noncommercial exemption.** A full-text EULA search finds `open source` only in the definition of "Restrictive Open Source Software" (a restriction on **their** use of copyleft dependencies, unrelated to customer eligibility). There are no free-use provisions for open-source projects or noncommercial use. The pricing page also lists no open-source exemption.

**Without a license key, features remain enabled, but a watermark and console errors appear.** Source evidence (`REPO/packages/ag-charts-enterprise/src/license/licenseManager.ts`):

```ts
// Lines 182-187
public isDisplayWatermark(): boolean {
    return (
        this.isForceWatermark() ||
        (!this.isLocalhost() && !this.isE2ETest() && !this.isWebsiteUrl() && !missingOrEmpty(this.watermarkMessage))
    );
}
```

The four `watermarkMessage` values (same file, lines 427/450/469/489) are `'Invalid License'`, `'Trial Period Expired'`, `'For Trial Use Only'`, and `'License Expired'`. A missing key invokes `outputMissingLicenseKey()` (lines 453-470), which prints:

> `* All AG Charts Enterprise features are unlocked for trial.`
> `* If you want to hide the watermark please email info@ag-grid.com for a trial license key.`

Watermark injection is implemented in `REPO/packages/ag-charts-enterprise/src/license/watermark.ts` (14 lines, inserting an `.ag-watermark` element into `canvas-overlay`).

**Watermark appearance** (`REPO/packages/ag-charts-enterprise/src/license/watermark.css`): a **170×40 px AG Charts logo** (inline base64 SVG, gray `#9b9b9b`) in the bottom-right corner (`bottom:20px; right:25px`), with one line of 19px bold Impact text, `opacity: 0.7`, and `pointer-events: none`. **It starts fading out after 3 seconds** (`animation: 1s ease-out 3s ag-watermark-fadeout`, ending at `opacity: 0`).

The watermark is not permanent, but **users see it during the first 3-4 seconds of every render** (official documentation says "a watermark for 5 seconds", slightly different from the CSS's 3s delay plus 1s fade, but of the same order). This is unacceptable for a plugin where a note can contain multiple charts.

The official description of behavior without a key (https://www.ag-grid.com/charts/javascript/licensing/):

> Without a valid licence key installed, your **console log will display a series of warnings** and the chart will show a **watermark for 5 seconds**.

**A trial license removes the watermark but cannot be used in production**:

> It is free to try out AG Charts Enterprise and you do not need to contact us. All that we ask when trialling is that **you don't use AG Charts Enterprise in a project intended for production**.
> **30-Day Enterprise Bundle Trial** — … a free 30-day trial licence — **no restrictions, no watermarks**.

EULA 4.2(b)(i) sets a 60-day evaluation period (30 days of trial plus 30 days of negotiation). Section 4.2(a) limits it to "solely for … **internal evaluation and review purposes** to determine whether to enter into a paid licence … and not for any other purpose".

The vendor also acknowledges that distribution exposes the license key:

> If you are distributing your product and including AG Charts Enterprise, we realise that your licence key will be visible to others. We appreciate that this is happening and just ask that you don't advertise it.

**Key implication:** `isLocalhost()` suppresses the watermark—**it is invisible during local development but visible after users install the plugin**. This is a decisive reason not to bundle Enterprise in an open-source plugin.

**⚠️ One clause is particularly unfavorable to plugins.** The checkout page's "The Agreement important bits" states verbatim:

> **You are not permitted to wrap our software in a custom UI component and make it available for development.**

EULA 3.7(b) imposes a corresponding restriction even with a Deployable Licence:

> redistributed as part of any Application that can be described as a **development toolkit or library, an application builder, a website builder, a user interface designer, or any application that is intended for use by software, application, or website developers or designers**, or has a similar purpose or functionality (**as determined by the Licensor**)

**AG Grid retains the final decision on whether this clause covers an Obsidian plugin that lets users generate charts from configuration written in Markdown.** This reinforces the conclusion: **Enterprise is not an option for this plugin, even with payment.**

**Do internal company documents count as commercial use?** The EULA never uses the phrase "commercial use". It distinguishes **internal use from sublicensing to third parties**:

- **Confirmed:** if Enterprise is required, purely internal use **does not require the Deployment add-on**. The checkout page states: "**If the application you are building is for internal use only, you don't need a deployment license.** However, a deployment license is needed if you are building a customer-facing application…"
- **Unanswered by the EULA:** whether a company that **only uses an open-source plugin written by a third-party developer, without developing or distributing it**, needs a license. The EULA governs the Licensee and charges for "Licensee Developers" (frontend JS developers building that Application); the company in this scenario has zero such developers. **A definitive answer requires written confirmation from AG Grid sales; this report does not speculate.**
- The EULA explicitly assigns obligations to **the person developing and distributing an Application containing `ag-charts-enterprise`**—the plugin author.

---

## 1. Ecosystem

The `ag-grid` GitHub organization has only two product repositories: **`ag-grid`** (data grid) and **`ag-charts`** (charts). They are **independent products with separate versions and pricing**: AG Grid is currently 36.1.0 and AG Charts 14.1.0. Their only coupling is AG Grid's "Integrated Charts" feature, which embeds AG Charts (`ag-grid-community` depends on `ag-charts-types`). The official `llms.txt` lists three products: Data Grid, AG Charts, and AG Studio (a visual configuration tool).

Build dependency chain (source: `REPO/AGENTS.md`):
`ag-charts-core` → `ag-charts-types` → `ag-charts-locale` → `ag-charts-community` → `ag-charts-enterprise` → framework wrappers

| Package | Purpose | License | Latest release | Required? |
|---|---|---|---|---|
| `ag-charts-community` | Main chart package: 8 series types, axes, legends, tooltips, label layout, PNG export | **MIT** | 14.1.0 / 2026-08-05 | **Yes** (the only explicit installation) |
| `ag-charts-core` | Rendering, scene graph, geometry/text utilities, module registry | **MIT** | 14.1.0 / 2026-08-05 | Automatic transitive dependency |
| `ag-charts-types` | All public API types (no runtime code) | **MIT** | 14.1.0 / 2026-08-05 | Automatic transitive dependency |
| `ag-charts-locale` | UI strings in 31 languages (including `zh-CN`/`zh-HK`/`zh-TW`) | **MIT** | 14.1.0 / 2026-08-05 | Automatic transitive dependency; import as needed |
| `ag-charts-enterprise` | Remaining 26 series types plus animation, zoom, navigator, annotations, context menus, etc. | **Commercial** | 14.1.0 / 2026-08-05 | No |
| `ag-charts-server-side` | Server-side rendering (depends on jsdom + skia-canvas) | **Commercial** | 14.1.0 / 2026-08-05 | No |
| `ag-charts-react` | React wrapper | MIT | 14.1.0 / 2026-08-05 | No (not needed by this project) |
| `ag-charts-angular` | Angular wrapper | MIT | 14.1.0 / 2026-08-05 | No |
| `ag-charts-vue3` | Vue 3 wrapper | MIT | 14.1.0 / 2026-08-05 | No |
| `ag-charts-vue` | Vue 2 wrapper | MIT | **9.3.2 / 2024-07-16** | **No longer maintained** (5 major versions behind) |
| `ag-charts-angular-legacy` | Legacy Angular wrapper | MIT | **7.3.0 / 2023-04-20** | **No longer maintained** |
| `ag-studio` | Visual chart configuration tool (standalone application) | Commercial | 2.1.1 / 2026-08-05 | No |

**What one installation brings in:** `npm i ag-charts-community` installs 4 packages (community + core + types + locale), **and nothing else**. Observed dependency tree:

```
sizetest@1.0.0
└─┬ ag-charts-community@14.1.0
  ├─┬ ag-charts-core@14.1.0
  │ └── ag-charts-types@14.1.0 deduped
  ├── ag-charts-locale@14.1.0
  └── ag-charts-types@14.1.0
Non-AG packages: []
```

For comparison, `@ant-design/plots@2.6.8` installs **93 packages**.

**Packages needed for common requirements:** bar/line/combination/pie/scatter/histogram → **1 package**. Any other chart type requires adding the paid `ag-charts-enterprise` package.

---

## 2. Chart-type coverage

**Tier assignments use source evidence**, not website descriptions. The Community package includes an `ExpectedModules` manifest whose entries carry an `enterprise?: boolean` flag.

- Source definition: `REPO/packages/ag-charts-community/src/chart/factory/expectedModules.ts`, lines 5-11
  ```ts
  export interface ModulePlaceholder {
      type: `${ModuleType}` | ModuleType;
      name: string;
      moduleId: string;
      chartType?: ChartType;
      enterprise?: boolean;
      optionsKey?: string;
  }
  ```
- The same manifest in the published artifact: the `ExpectedModules` array in `COMM` (starting around line 33355).

There are 6 module categories: `chart` / `axis` / `axis:plugin` / `series` / `series:plugin` / `plugin` / `preset`. **⚠️ Tier checks must include `axis:plugin` and `series:plugin`**: `crosshair`, `bandHighlight`, `crossLines`, and `errorBar` belong to those categories. Checking only `plugin` misses them (the first draft of this research made that mistake; see section 3, item 15).

### Complete Community inventory (everything available for free)

| Category | Modules |
|---|---|
| **series (7 confirmed + 1 uncertain)** | `bar` (including grouped/stacked/normalized/horizontal), `line`, `area`, `scatter`, `bubble`, `pie`, `donut`, plus `histogram` (⚠️ free in code, paid in documentation; do not depend on it, see below) |
| **chart (2)** | `cartesian`, `polar` |
| **axis (6)** | `number`, `log`, `time`, `unit-time`, `category`, `grouped-category` |
| **axis:plugin (1)** | `crossLines` (cartesian only; static reference lines/bands) |
| **plugin (2)** | `legend`, `locale` |
| **preset (1)** | `sparkline` |

### Complete Enterprise inventory (paid)

| Category | Modules |
|---|---|
| **series (27)** | box-plot, candlestick, ohlc, cone-funnel, funnel, pyramid, heatmap, range-area, range-bar, waterfall, nightingale, radar-area, radar-line, radial-bar, radial-column, map-shape, map-line, map-marker, map-shape-background, map-line-background, linear-gauge, radial-gauge, sunburst, treemap, chord, sankey, organization |
| **chart (2)** | `standalone`, `topology` |
| **axis (5)** | `ordinal-time`, `angle-category`, `angle-number`, `radius-category`, `radius-number` |
| **axis:plugin (3)** | **`crosshair`**, **`bandHighlight`**, `polarCrossLines` |
| **series:plugin (1)** | `errorBar` |
| **plugin (14)** | **`animation`**, `annotations`, `chartToolbar`, `contextMenu`, `statusBar`, `dataSource`, `sync`, `ranges`, `zoom`, `flashOnUpdate`, `gradientLegend`, `navigator`, `scrollbar`, `selection` |
| **preset (2)** | `gauge-preset`, `price-volume` |

**Because `animation` is Enterprise-only, Community charts have no entry or update animations.**

### Coverage matrix

| Chart type | Supported? | Package | Tier | Limitations |
|---|---|---|---|---|
| Column/bar (grouped, stacked, percentage stacked, horizontal) | ✅ | community | **Community** | — |
| Line | ✅ | community | **Community** | — |
| Area (including stacked) | ✅ | community | **Community** | — |
| Scatter / bubble | ✅ | community | **Community** | — |
| Pie / donut | ✅ | community | **Community** | — |
| Histogram | ✅ | community | **Community** | ⚠️ See the documentation/source conflict below |
| **Combination / dual-axis (bar + line, left and right axes)** | ✅ | community | **Community** | — |
| Sparkline | ✅ | community | **Community** | preset |
| Box plot | ✅ | enterprise | Enterprise | — |
| Waterfall | ✅ | enterprise | Enterprise | — |
| Funnel / cone-funnel | ✅ | enterprise | Enterprise | — |
| Pyramid | ✅ | enterprise | Enterprise | — |
| Heatmap | ✅ | enterprise | Enterprise | — |
| **Calendar heatmap** | ✅ | enterprise | Enterprise | Configured with `heatmap`; no dedicated series |
| Treemap | ✅ | enterprise | Enterprise | — |
| Sunburst | ✅ | enterprise | Enterprise | — |
| Sankey | ✅ | enterprise | Enterprise | — |
| Chord | ✅ | enterprise | Enterprise | — |
| **Organization chart** | ✅ | enterprise | Enterprise | Cards arranged as a tree |
| Radar: radar-line / radar-area | ✅ | enterprise | Enterprise | Requires polar axes (also Enterprise) |
| Nightingale rose | ✅ | enterprise | Enterprise | — |
| Radial bar / radial column | ✅ | enterprise | Enterprise | — |
| Gauge: radial-gauge / linear-gauge | ✅ | enterprise | Enterprise | — |
| **Bullet** | ✅ | enterprise | Enterprise | Configured with `linear-gauge`; no dedicated series |
| Candlestick / OHLC | ✅ | enterprise | Enterprise | — |
| Range-area / range-bar | ✅ | enterprise | Enterprise | — |
| Financial chart preset | ✅ | enterprise | Enterprise | — |
| Map: map-shape / map-line / map-marker | ✅ | enterprise | Enterprise | **Supply your own basemap GeoJSON; no official data package** |
| Error bars | ✅ | enterprise | Enterprise | Attached to bar/line/scatter |
| **Pivot table / crosstab** | ❌ (not in AG Charts) | `ag-grid-enterprise` | Enterprise | Part of the grid product |
| **Network / relationship / force-directed graph** | ❌ **Unavailable** | — | — | Absent from the entire product line |
| **Flowchart / diagram** | ❌ **Unavailable** | — | — | — |
| **Mind map** | ❌ **Unavailable** | — | — | — |
| **Tree / dendrogram** | ❌ **Unavailable** | — | — | Hierarchical data supports only treemap/sunburst/organization |
| **Gantt** | ❌ **Unavailable** | — | — | No AG implementation; the website refers users to third-party Bryntum |
| **Timeline** | ❌ **Unavailable** | — | — | Time **axes** only, no timeline chart |
| **Word cloud** | ❌ **Unavailable** | — | — | — |
| Parallel coordinates / arc diagram / circle packing / Voronoi / 3D | ❌ **Unavailable** | — | — | No 3D rendering anywhere in the library |

> Evidence: all 757 URLs in the official sitemap were searched with `network|force|flow-?chart|mind|dendro|gantt|word-?cloud|timeline|parallel|arc-|circle-pack|voronoi|sonar|3d`. The only matches were `gallery/calendar-heatmap/`, `gallery/simple-bullet/`, and the financial annotation `annotations/parallel-channel/` (a parallel-channel annotation tool for financial charts, not a parallel-coordinates chart).

### Common types that require another library

**Network/relationship graphs, flowcharts, mind maps, dendrograms, Gantt charts, timelines, word clouds, pivot tables, and parallel coordinates.**

### ⚠️ Documentation/source conflict: histogram

The official documentation marks histogram as Enterprise (https://www.ag-grid.com/charts/javascript/histogram-series/), **but both the source and published artifacts place it in Community**:

- In `REPO/packages/ag-charts-community/src/chart/series/cartesian/histogramSeriesModule.ts`, lines 72-77, `enterprise: true` is **commented out**:
  ```ts
  export const HistogramSeriesModule: SeriesModuleDefinition<AgHistogramSeriesOptions> = {
      type: 'series',
      name: 'histogram',
      chartType: 'cartesian',
      // enterprise: true,
      version: VERSION,
  ```
- `REPO/packages/ag-charts-community/src/main.ts`, line 24, exports `HistogramSeriesModule`.
- `REPO/packages/ag-charts-community/src/module-bundles/cartesian-series.ts`, line 14, includes it in the Community bundle.
- Published `COMM` retains the comment unchanged; searching for `name: "histogram"` finds no active `enterprise: true` flag.

**The official documentation's frontmatter explicitly says `enterprise: true`** (`REPO/packages/ag-charts-website/src/content/docs/histogram-series/index.mdoc`), matching actual Enterprise pages such as heatmap; `line-series/index.mdoc` has no such field.

**This is a direct conflict between upstream documentation and implementation: the documentation says paid, while the code says free.** The module manifest determines runtime behavior, so histogram does currently work in Community. However, the vendor's stated intent is to charge for it, and **any release could uncomment that line**. **Conclusion: it works, but should not influence engine selection or become a product dependency.**

---

## 3. Comparison against sixteen requirements

Five ratings: **built-in default / one configuration option / a little code (<10 lines) / custom implementation / unavailable**

> **A v14 API change affects several requirements:** `axes` is now a **dictionary**, not an array (`Record<string, AgCartesianAxisOptions>`, with default keys `x`/`y`). Series reference axes through the `xKeyAxis` / `yKeyAxis` strings. The old `axes[].keys` no longer exists.
> Evidence: `TYPES/chart/cartesianOptions.d.ts:97,109`; `TYPES/series/cartesian/commonOptions.d.ts:4-17`; default implementation in `COMM:43878-43879` (`this.xKeyAxis = "x"; this.yKeyAxis = "y";`).

| # | Requirement | Rating | Configuration / evidence | Enterprise? |
|---|---|---|---|---|
| 1 | Configurable line width | **One configuration option** | `series[].strokeWidth`. `TYPES/series/cartesian/commonOptions.d.ts:146-153` (`StrokeOptions`); inherited by line at `TYPES/series/cartesian/lineOptions.d.ts:28` | No |
| 2 | **Data-label collision avoidance: reposition first, hide as a fallback** | **One configuration option** | See details below | No |
| 3 | Remove a right axis that duplicates the left axis in a combination chart | **Built-in default** | In the new model, **omit the second axis**; both series share the default `y` axis. To hide an already declared axis, there is no `visible` field: disable each component with `line/tick/label/gridLine/title.enabled:false` (AG's own navigator miniature does this: `COMM:31684-31694`) | No |
| 4 | **Center stacked-bar values within their segments** | **One configuration option** | `series[].label.placement` already defaults to `'inside-center'` (`COMM:60435`). **For thin segments**, `placement` accepts an **ordered fallback array**, trying positions until one fits, e.g. `['inside-center','beside-after-center']`. `minimumFontSize` shrinks text automatically; `collision.alwaysShow:false` hides it as a last resort. `TYPES/series/cartesian/barOptions.d.ts:11-27` | No |
| 5 | Legend marker size and shape | **One configuration option** | 12×12 square → `legend.item.marker.{size:12, shape:'square'}`; 4px gap → `legend.item.marker.padding:4`; **12-wide, 4-high dash for a line series → `legend.item.line.{length:12, strokeWidth:4}`** (`showSeriesStroke` already defaults to `true`, `COMM:56503`). `TYPES/chart/legendOptions.d.ts:33-48,122`. Arbitrary rectangles can be drawn with `AgMarkerShapeFn` (<10 lines) | No |
| 6 | Center legend at the top | **One configuration option** | `legend.position: 'top'` (the `'top'` implementation centers it). All 12 enum values are at `TYPES/chart/legendOptions.d.ts:8`. **There is no `legend.align` field** | No |
| 7 | Placement of unit text | **One configuration option** | A root `formatter` covers axis labels, data labels, and tooltips: `formatter: { y: ({value}) => \`${value} yuan\` }`. Its `source` argument (`'axis-label'`/`'series-label'`/`'tooltip'`…) distinguishes locations. `TYPES/chart/chartOptions.d.ts:299-300`, `TYPES/chart/formatterOptions.d.ts:6-8,84-86`. Also available: axis title `axes.y.title.text` and per-location `label.format`/`formatter` | No |
| 8 | **Tooltip**: compact layout, brighter text, text outline, border | **One configuration option** (except text outline; see details below) | Compact layout → `tooltip.mode:'compact'` (three built-in modes: `'single'\|'shared'\|'compact'`); text/border/background → `theme.params.{tooltipTextColor, tooltipSubtleTextColor, tooltipBorder, tooltipBackgroundColor, tooltipBorderRadius}`; full customization → `series[].tooltip.renderer` (Community). Tooltips use **DOM, not canvas**, with 20 stable CSS classes; **CSS `text-shadow` provides the text outline** | No |
| 9 | **Mark a specific x value**: bold axis label + column background band | **One configuration option + a little code** | Background band/vertical line → `axes.x.crossLines[]`: `type:'range'` shades `[start,end]`, `type:'line'` draws a vertical line at one value; supports `fill/fillOpacity/stroke/strokeWidth/lineDash/label` (all of `TYPES/chart/crossLineOptions.d.ts`). Bold axis labels → return `fontWeight` from the per-label `axes.x.label.itemStyler` callback (`TYPES/chart/axisOptions.d.ts:203`), about 3 lines | No (`crossLines` is in Community's `cartesianAxisOptionsDefs`) |
| 10 | 8% headroom above the y-axis data + rounded ticks | **Rounded ticks: built-in default; 8% headroom: a little code (<10 lines)** | `axes.y.nice` **defaults to `true`** (`COMM:23328`: `this.nice = options.nice ?? true`). **No percentage-headroom option**: every number-axis option was checked (`TYPES/chart/cartesianOptions.d.ts:269-273`); `headroom`/`domainPadding`/`expandDomain` have zero matches in `TYPES/**`. Compute `dataMax`, then set **`preferredMax = dataMax * 1.08`** (extends the domain without clipping data, while `nice` still rounds upward; `max` disables nice on that side, see `COMM:43475`). Semantics: `normalisedExtentWithMetadata` in `TAR/ag-charts-core/…` | No |
| 11 | **Theme tracking**: rebuild on light/dark changes; use host CSS variables for colors | **Built-in default** | **The largest finding in this research; see details below** | No |
| 12 | PNG export | **One configuration option** (one API call) | `chartInstance.download(options?): Promise<void>` and `chartInstance.getImageDataURL(options?): Promise<string>` support `image/png`/`image/jpeg`, `width`/`height`/`fileName`. `TYPES/chartBuilderOptions.d.ts:102-113,138-149`. Methods on the base `AgTypedChartInstance` interface → Community | No |
| 13 | **Numeric-label outline** (text halo) | **Unavailable** (equivalent alternative: one configuration option) | Label style type: `AgChartLabelStyleOptions = Toggleable + TextOptions + LabelBoxOptions` (`TYPES/chart/labelOptions.d.ts:5`). `TextOptions` provides only `color` (`TYPES/series/cartesian/commonOptions.d.ts:190-193`), **no text stroke**. The underlying scene `Text` node implements `executeStroke()→ctx.strokeText()` (visible in `COMM`), but **does not expose it as a public option**. Alternative: `LabelBoxOptions` provides `fill`+`border`+`cornerRadius`+`padding` (`TYPES/series/cartesian/commonOptions.d.ts:157-164`), giving labels translucent backgrounds for equivalent readability and a more modern appearance | No |
| 14 | Reverse data-label direction for negative values | **Built-in default** | Automatic: `COMM:59349` checks the sign → `COMM:59482` combines it with axis reversal → `COMM:46299` flips the offset using `barDirection = (isUpward ? 1 : -1) * (isVertical ? -1 : 1)`. `start`/`end` refer to **the bar's geometry**, not screen direction (`COMM:46237-46241`), so a negative bar's `outside-end` naturally appears below, with no configuration | No |
| 15 | Column background band / vertical line on hover | **Enterprise: one configuration option; Community: custom implementation** | Background band → `axes.x.bandHighlight` (`enabled/fill/fillOpacity/stroke/strokeWidth/lineDash`, `TYPES/chart/bandHighlightOptions.d.ts`); vertical line → `axes.x.crosshair` (including `snap` and `label`). **Both modules are marked `enterprise: true`**; see details below | ⚠️ **Yes** |
| 16 | Dual-axis combination chart | **One configuration option** | `axes: {x, y, y2}` + `series[].yKeyAxis:'y2'`. **None** of the required modules—`CartesianChartModule`/`NumberAxisModule`/`CategoryAxisModule`/`BarSeriesModule`/`LineSeriesModule`/`LegendModule`—has `enterprise: true` in the manifest | No |

**Totals: 4 built-in defaults, 9 single-option configurations, 2 small code additions, and 1 unavailable feature (item 13, text outlines, with an equivalent alternative). Item 15 requires Enterprise or a custom Community implementation.**

### Detailed verification: item 15 (hover highlighting)—Enterprise

**This conclusion was corrected during the research.** The reason matters: `crosshair` and `bandHighlight` have **option types** in the shared `ag-charts-types` package and **option schemas** (`cartesianAxisOptionsDefs`) in the Community artifact. Those two sources alone incorrectly suggest Community availability. The module manifest is decisive, and both belong to `type: 'axis:plugin'`:

```ts
// packages/ag-charts-community/src/chart/factory/expectedModules.ts:461-488
{ type: 'axis:plugin', name: 'crossLines',      chartType: 'cartesian', moduleId: 'CrossLinesModule' },          // ← No enterprise flag: Community
{ type: 'axis:plugin', name: 'polarCrossLines', chartType: 'polar', optionsKey: 'crossLines',
  enterprise: true, moduleId: 'PolarCrossLinesModule' },
{ type: 'axis:plugin', name: 'crosshair',       chartType: 'cartesian', enterprise: true, moduleId: 'CrosshairModule' },
{ type: 'axis:plugin', name: 'bandHighlight',   chartType: 'cartesian', enterprise: true, moduleId: 'BandHighlightModule' },
```

Their implementations exist only in Enterprise: `packages/ag-charts-enterprise/src/features/band-highlight/bandHighlightModule.ts` (`enterprise: true`, with `themeTemplate.enabled` defaulting to `false`) and `packages/ag-charts-enterprise/src/features/crosshair/crosshairModule.ts:10`.

**Official documentation agrees:** the AG Charts feature comparison on ag-grid.com lists "Crosshairs & Band Highlight" under Enterprise and "Cross Lines" under Community. Code and documentation are consistent here.

**Keep the distinction clear:** item 9 uses `crossLines` (static reference lines/bands marking a fixed x value), which is **Community**. Item 15 requires **dynamic highlighting that follows the pointer**, which is Enterprise. These are separate plugin requirements.

**Custom Community implementation:** listen for `chartInstance` highlight events and update `axes.x.crossLines` to the hovered category. This is feasible but requires custom state management and throttling. Another Community hook is `backgroundRegions` (`type: 'series-area:plugin'`, no enterprise flag), but it draws static regions and does not respond to hover.

### Detailed verification: item 2 (label collision avoidance)

This consumes the most development time in the plugin. AG Charts has a **dedicated label-layout engine**: `REPO/packages/ag-charts-core/src/utils/geometry/labelPlacement.ts`, **2294 lines**, with a spatial index (`SpatialIndex`), obstacle indexing, candidate-position trials, and bounding-box calculations for rotated labels.

Its public API directly expresses the two-stage strategy of repositioning first and hiding as a fallback (`TYPES/chart/collisionAvoidanceOptions.d.ts`):

```ts
/** Configuration controlling how a label behaves when it cannot be placed clear of every obstacle. */
export interface AgChartLabelCollisionOptions {
    /** Collision threshold in pixels. A positive value triggers avoidance strategies when labels are
     *  further away, a negative value allows labels to overlap without triggering avoidance. */
    threshold?: PixelSize;
    /** Whether to keep a colliding label visible when a collision remains after every avoidance
     *  strategy has been applied. When `true` the label stays at the best available position;
     *  when `false` it is hidden instead. */
    alwaysShow?: boolean;
}
```

Combined with ordered candidate positions:

- General series: `label.placements` — `'inside'|'top'|'bottom'|'left'|'right'|'top-left'|'top-right'|'bottom-left'|'bottom-right'`
- Bar series: `label.placement` — 11 values, including `beside-*` positions designed for very thin stacked segments. The JSDoc states:
  > The `beside-*` values offset it perpendicular to the value axis, floating it to the side of the segment … **`beside-*` is useful for tiny stacked segments with no room to place a label along the value axis.**
- Bar series also accept an ordered `orientation` array (`'horizontal'|'vertical'|'vertical-reversed'`), automatically rotating 90° when horizontal text does not fit.

Engine behavior (JSDoc in `labelPlacement.ts`, lines 1481-1487):

> Keep-series (never dropped) resolve first as fixed obstacles, then droppable series; within each group, **larger markers claim their placement first**. … External obstacles (e.g. bar rects, pie sectors) every label must avoid, in addition to markers and **already-placed labels**.

Placed labels become obstacles for later labels. Candidate positions are tried in order; only after all fail does `alwaysShow` decide whether to keep or hide the label. **The built-in behavior supports repositioning first, then hiding as a fallback** (`alwaysShow` defaults to `true`; set it to `false` to enable the hiding fallback).

Three additional fallbacks can be combined: `minimumFontSize` (shrink until the text fits), `wrapping` (line breaks), and `truncate` (ellipsis).

### Detailed verification: item 9 (marking a specific x value)

`crossLines` is a built-in Community axis capability. **Its two forms match the two requirements** (`TYPES/chart/crossLineOptions.d.ts`):

```ts
export interface AgRangeCrossLineOptions<...> extends AgCommonCrossLineOptions<...> {
    /** Renders the Cross Line as a shaded band spanning `range`. */
    type: 'range';
    /** The `[start, end]` data values bounding the shaded region. */
    range: [TValue, TValue];
    fill?: CssColor;
    fillOpacity?: Opacity;
}
export interface AgLineCrossLineOptions<...> extends AgCommonCrossLineOptions<...> {
    /** Renders the Cross Line as a single line positioned at `value`. */
    type: 'line';
    value: TValue;
}
```

To mark a bar-chart column, use `type:'range'` for a shaded band; to mark an x value on a line chart, use `type:'line'` for a vertical line. Both support `label` (17 position values) and `stroke`/`strokeWidth`/`lineDash`. To bold the axis label, return `{ fontWeight: 'bold' }` from `axes.x.label.itemStyler` when the value matches.

**Tier verification:** `crossLines` appears in `COMM`'s `cartesianAxisOptionsDefs` (alongside `crosshair` and `bandHighlight`), and its manifest entry has no `enterprise: true` → **Community**.

### Additional details: item 8 (tooltip)

**Tooltips are DOM elements, not canvas drawings**, which makes them easier to customize than canvas content.

- **`series[].tooltip.renderer` is Community:** type at `TYPES/chart/tooltipOptions.ts:141`, implementation at `packages/ag-charts-community/src/chart/series/seriesTooltip.ts:54`. It is a regular base-class property with no module gate.
- **⚠️ Returned strings are injected as raw HTML without escaping** (`seriesTooltip.ts:76-78` → `rawHtmlString` in `tooltipContent.ts:308`). Only structured objects `{heading, title, symbol, data[]}` pass through `sanitizeHtml()` (`packages/ag-charts-community/src/util/sanitize.ts:5-12`) for escaping. **The plugin reads Markdown from the user's vault; concatenating it into returned strings creates an XSS surface. Use structured return values.**
- **20 stable class names** (`packages/ag-charts-community/src/chart/interaction/tooltipManager.css`, 186 lines): `.ag-charts-tooltip`, `--compact`, `--dark`, `--wrap-always`/`--wrap-hyphenate`/`--wrap-on-space`/`--wrap-never`, `--arrow-top/right/bottom/left`, `-heading`, `-title`, `-label`, `-value`, `-content`, `-symbol`, `-row`, `-row--inline`, `-footer`, etc.
- **CSS custom properties** (`packages/ag-charts-community/src/dom/theme.css:57-62`): `--ag-charts-tooltip-{background-color, border-color, border-radius, border-width, text-color, subtle-text-color}`. **Lines 5-6 of that file state: "The values below are overridden, changing them here will have no effect"**. At runtime, `theme.params` writes them onto the element (`setCSSVariables('--ag-charts', …)` in `domManager.ts:580-594`). Customize through `theme.params.*` or higher-priority class overrides; **do not change these variables on `:root`**.
- `SeriesTooltip` has an internal `class?: string` field (`seriesTooltip.ts:64`), but **it is unusable**: it is not exported in `ag-charts-types`, is absent from the options schema, and is never read by the code.

### Detailed verification: item 13 (numeric-label outlines)

**The rating is "unavailable"; this is the only item in the comparison where AG Charts falls short of the current implementation.**

The complete evidence chain:
1. Public label-style type: `AgChartLabelStyleOptions extends Toggleable, TextOptions, LabelBoxOptions` (`TYPES/chart/labelOptions.d.ts:5`).
2. `TextOptions extends FontOptions { color?: AgCssColorOrRef }` (`TYPES/series/cartesian/commonOptions.d.ts:190-193`)—**color only, no stroke/strokeWidth**.
3. `LabelBoxOptions extends FillOptions { border?, cornerRadius?, padding? }` (same file, 157-164)—`border` is the **box border**, not a text outline.
4. The `itemStyler` callback also returns `AgChartLabelStyleOptions`, so it provides no workaround.
5. The rendering layer **can draw text strokes**: the scene `Text` node implements `executeStroke(ctx) { this.renderLines((line,x,y) => ctx.strokeText(line,x,y)) }` (searchable in `COMM`), but this is not exposed as a label option.

**Recommended alternative:** add a translucent label background with `label.fill` + `label.padding` + `label.cornerRadius`. It serves the same purpose—readability over chart shapes—and matches contemporary chart styling. AG Charts also provides `insideStyle`/`outsideStyle` (`AgSeriesLabelPlacementStyleOptions`), **automatically applying different styles inside and outside shapes**: white text inside a bar, normal text color outside. This alone substantially reduces the need for outlines.

### Detailed verification: item 11 (theme tracking)—the largest finding

The original question was: **does canvas need a bridge to read CSS variables?**

**No custom bridge is needed: AG Charts includes both resolution and change detection.**

**(a) Any color value can use `var(--x)` directly.** `ChartOptions.processCSSVariables()` walks the options tree (skipping `data`) and resolves `var(--…)` to actual colors (`COMM`):

```js
static isExternalColorVar(value) {
  return typeof value === "string" && value.startsWith("var(--") && !value.slice(4, -1).startsWith("--ag-charts");
}
static resolveColorVar(value, container) {
  const propertyKey = value.slice(4, -1);
  const [mainKey, ...fallbackKeys] = propertyKey.split(",");
  const computedStyle = getComputedStyle(container);
  let propertyValue = computedStyle.getPropertyValue(mainKey.trim());
  let isValid = Color7.validColorString(propertyValue);
  if (!isValid && fallbackKeys.length > 0) {
    const fallback = fallbackKeys.join(",").trim();
    if (fallback.startsWith("var(--")) return _ChartOptions.resolveColorVar(fallback, container);
    propertyValue = computedStyle.getPropertyValue(fallback) || fallback;
    isValid = Color7.validColorString(propertyValue);
  }
  return { isValid, propertyValue };
}
```

It supports nested fallbacks (`var(--a, var(--b))`) and literal fallbacks (`var(--a, #fff)`). Failed resolution triggers `warnOnce("CSS property [...] is not a valid color, ignoring.")` and removes the key.

**(b) CSS-variable changes automatically trigger rendering.** `DOMManager.updateCSSVariableWatchers()` uses a clever mechanism (starting at `COMM:358661`):

```js
updateCSSVariableWatchers(cssVariables) {
  if (!cssVariables) return;
  if (this.shadowDocumentRoot) { this.updateCSSVariableWatchersShadowDOM(cssVariables); return; }
  for (const key of strictObjectKeys(cssVariables)) {
    const property = key.slice(4, -1);
    if (this.cssVariableWatchers.has(property)) continue;
    this.cssVariableWatchers.add(property);
    const styleElement = createStyleElement(this.styleNonce);
    styleElement.dataset.variableName = property;
    styleElement.textContent = `@property ${property} { syntax: '<color>'; inherits: true; initial-value: transparent; }`;
    this.element.prepend(styleElement);
    const sensorElement = createElement("div");
    sensorElement.style.setProperty("transition", `${property} 1ms`, "important");
    this.rootElements["style-sensors"].element.appendChild(sensorElement);
    const handleTransitionEnd = () => { this.eventsHub.emit("chart:request-refresh", null); };
    sensorElement.addEventListener("transitionend", handleTransitionEnd);
    …
  }
}
```

Mechanism: register each CSS variable with `@property` as a `<color>` so it can transition → create a hidden sensor div with a `transition: 1ms` for that variable → a value change triggers `transitionend` → emit `chart:request-refresh` → redraw using the newly resolved values. A separate path handles Shadow DOM.

**Implications for this plugin:**
- Colors can directly use Obsidian variables such as `var(--text-normal)` and `var(--background-primary)`, without custom `getComputedStyle` reads.
- When Obsidian switches between light and dark themes, **charts redraw automatically, without destroying/recreating instances or listening for theme events**.
- Almost all of `chart-theme.ts` (54 lines) and the theme re-rendering logic can be removed.

**(c) 12 built-in themes** (including 6 dark themes): `'ag-default' | 'ag-default-dark' | 'ag-sheets' | 'ag-sheets-dark' | 'ag-polychroma' | 'ag-polychroma-dark' | 'ag-vivid' | 'ag-vivid-dark' | 'ag-material' | 'ag-material-dark' | 'ag-financial' | 'ag-financial-dark'` (`TYPES/chart/themeOptions.d.ts:48`).

**(d) `theme.params` exposes about 40 global parameters** (`TYPES/chart/themeParamsOptions.d.ts`, 195 lines), and **most derive from one another**. Setting only `backgroundColor` + `foregroundColor` automatically derives text, borders, grid lines, and tooltip backgrounds:

> **backgroundColor**: Background colour of the chart. **Most text, borders and backgrounds are defined as a blend between the background and foreground colours.**
> **textColor**: Default colour for all text. Default: `foregroundColor`
> **subtleTextColor**: Default: `foregroundColor + backgroundColor`

`AgColorRef` can reference and blend other parameters: `{ ref: 'foregroundColor', mix: 0.5, ontoColor: 'var(--background-primary)' }`. The JSDoc for `ontoColor` explicitly says: "A literal CSS colour **or a `var(--css-variable)`**".

**(e) An official e2e example covers this exact scenario:** `packages/ag-charts-website/src/content/docs/themes-e2e/_examples/css-variables-dark-mode/main.ts` switches modes through `document.body.classList.toggle('dark')` and prints `"Mode: … — no chart.update() called"`. **This is the same mechanism as Obsidian's light/dark theme switch.**

**(f) Theme changes do not require destroying and recreating the instance.** `packages/ag-charts-community/src/api/agCharts.ts:243-255` shows only two creation conditions: a missing instance or a change in **chart type**. `theme` is not part of the check:

```ts
if (chart == null ||
    detectChartType(chartOptions.processedOptions) !== detectChartType(chart.chartOptions.processedOptions)) {
    create = true;
    chart = AgChartsInternal.createChartInstance(chartOptions, chart);
}
```

**Two constraints:**
1. **The container must be in the DOM when options are processed**—`optionsModule.ts:1728`: `if (container == null) return;`. The plugin must create charts after mounting.
2. Variables prefixed with `--ag-charts*` are excluded (AG writes these out; it does not read them in).

**There is no public theme-change event** (`TYPES/chart/eventOptions.d.ts` has none; `theme:params-change` and `chart:request-refresh` are private). Automatic redraw makes one **unnecessary**.

**One of the plugin's largest development costs becomes 5-10 lines of theme.params.**

---

## 4. Hard-constraint checks

### License → ✅ Pass

Community uses **standard MIT with no additional terms**, permitting closed-source and commercial use, distribution with open-source plugins, and internal company documentation. The hard boundary is **never bundling `ag-charts-enterprise`**: EULA 3.3 prohibits third-party sublicensing as part of an Application, and a missing key produces a watermark **for end users** (outside localhost).

### Bundle size → ✅ Pass, smaller than the current implementation

Measurements (esbuild 0.28.2, `--bundle --minify --platform=browser --format=cjs`):

| Setup | target | Raw | gzip |
|---|---|---|---|
| **ag-charts-community 14.1.0** (import only `AgCharts`, use bar+line) | es2017 | **1,294,880 B (1.23 MB)** | **387,849 B (379 KB)** |
| ag-charts-community (`import * as`, full package) | es2017 | 1,388,400 B | 415,543 B |
| ag-charts-community (bar+line only) | es2020 | 1,239,892 B | 370,891 B |
| **@ant-design/plots 2.6.8** (Column+Line+DualAxes, react external), *current setup* | es2017 | **1,535,071 B (1.46 MB)** | **452,126 B (441 KB)** |
| @antv/g2 5.4.8 (`Chart` only) | es2017 | 1,370,162 B | 406,334 B |

**Conclusion: AG Charts Community reduces the bundle by about 240 KB raw / 64 KB gzip, roughly 16%.**

**Tree-shaking is largely ineffective, but that is not a problem here.** Importing only `AgCharts` saves just **7%** versus `import *` (1.29 MB vs 1.39 MB), because the published artifact is **a single prebundled file** whose module registry links the series together. Using only bar/line/combination charts therefore **still costs about 1.23 MB**, already smaller than the current setup.

Published artifact sizes (`TAR/ag-charts-community/dist/package/`): `main.esm.min.mjs` = 1,203,459 B, gzip 353,600 B, brotli 281,246 B.

### ES2017 → ⚠️ Requires transpilation, verified to work

**The published artifact actually targets ES2020, not ES2017.** Syntax counts in `main.esm.min.mjs`:

| Syntax | Occurrences | Introduced in |
|---|---|---|
| Optional chaining `?.` | 1698 | ES2020 |
| Nullish coalescing `??` | 1447 | ES2020 |
| Object spread `{...}` | 349 | ES2018 |
| Optional catch binding `catch{` | 17 | ES2019 |
| Logical assignment `??=`/`\|\|=`/`&&=` | 0 | — |
| Private fields `#x` | 0 | — |
| Static blocks | 0 | — |

The `package.json` `browserslist` is `["> 1%","last 2 versions","not ie >= 0", …]`; it specifies no ES target.

**This is not a blocker:** esbuild transpiles dependencies when bundling with `--target=es2017`. Verification found 1720 occurrences of `?.` and 1492 of `??` in the es2020 output. The es2017 output had **0 occurrences of `??` and 6 of `?.` (all inside string/regex literals)**, with `{...}` and `catch{` both reduced to zero. The size cost is +55 KB (1.24 MB → 1.29 MB), already included above.

**Requirement:** the bundler **must not exclude node_modules**: AG Charts must be bundled, not externalized, or untranspiled ES2020 syntax will reach the output.

### Canvas / PNG → ✅ Pass

- **Canvas confirmed:** rendering uses canvas 2D (`COMM` has extensive `ctx.fillText`/`strokeText`/`strokeRect`/`getContext` calls; scene nodes reach canvas APIs through `executeFill`/`executeStroke`). Tooltips, legend interaction layers, and watermarks are DOM overlays.
- **PNG export is an official Community API**:
  ```ts
  /** Starts a browser-based image download for the given `AgChartInstance`.
   *  @returns a `Promise` that resolves once the download has been initiated. */
  download(options?: DownloadOptions): Promise<void>;
  /** Returns a base64-encoded image data URL for the given `AgChartInstance`. */
  getImageDataURL(options?: ImageDataUrlOptions): Promise<string>;
  ```
  (`TYPES/chartBuilderOptions.d.ts:102-113`)
  Options: `fileName`, `width`, `height`, `fileFormat` (`'image/png'` by default / `'image/jpeg'`) (same file, 138-149).
  Implementation chain: `packages/ag-charts-community/src/chart/chartProxy.ts:179` (`download`) / `:201` (`getImageDataURL`) → `chart.ts:366` → `scene.ts:151-157` → `this.element.toDataURL(type)` in `packages/ag-charts-community/src/scene/canvas/hdpiCanvas.ts:59-61`. Everything is within `ag-charts-community/src`; these are base `AgChartInstance` methods requiring no module registration → **Community**.
- **Asynchronous, Promise-based, supports offscreen rendering:** both methods clone an offscreen chart through `prepareResizedChart()`, wait for rendering with `await cloneProxy.waitForUpdate()`, then call `clone.destroy()` (`chartProxy.ts:179-209, 283-320`). Specifying both `width` and `height` forces `overrideDevicePixelRatio = 1`. **Await is required; synchronous retrieval is not supported.**
- **Exports have no watermark:** watermarks are added only when Enterprise is loaded without a license, behind an explicit `if (ModuleRegistry.isEnterprise())` guard (`chartProxy.ts:289-298`). **Community-only exports never contain a watermark.**
- An undocumented `__toSVG(opts)` also exists (`chartProxy.ts:189`); depending on it is not recommended.
- **The UI buttons are Enterprise-only:** the context menu's Download item is defined in `packages/ag-charts-community/src/chart/interaction/contextMenuTypes.ts:109-116`, but both `contextMenu` (`expectedModules.ts:389-394`) and `chartToolbar` (`:382-388`) are marked `enterprise: true`. **PNG export is free; only the built-in context-menu/toolbar buttons require payment. The plugin can supply its own button.**
- **Official documentation agrees** (Community Features at https://www.ag-grid.com/charts/javascript/community-vs-enterprise/):
  > **Download API** — Trigger browser-based image downloads of Charts in Base64 and PNG.

### Theme switching → ✅ Pass, substantially better than expected

**No instance destruction or recreation is needed.** Three options:

1. **Simplest:** use `var(--obsidian-variable)` for colors; AG Charts resolves variables, watches changes, and redraws automatically (see section 3, item 11). **This makes theme tracking nearly code-free.**
2. Apply a partial update with `chartInstance.updateDelta({ theme: {...} })` (`TYPES/chartBuilderOptions.d.ts:91`).
3. Switch built-in theme IDs (`'ag-default'` ↔ `'ag-default-dark'`).

**Canvas access to CSS variables is not a blocker:** AG Charts reads them with `getComputedStyle(container).getPropertyValue()` and watches changes with `@property` + `transition`/`transitionend`. The library supplies the bridge.

### CJK → ⚠️ Capable engine, but **Chinese text requires explicit overrides at each location**

**This is the highest-risk and easiest-to-miss issue found in the research.**

**Engine capabilities: adequate.**
- **Text measurement:** canvas `measureText` with per-font caching (`packages/ag-charts-core/src/rendering/textMeasurer.ts:20,47,83-96`). Measurement uses actual glyph widths and handles Chinese correctly. A `ResizeObserver` probe in `packages/ag-charts-community/src/chart/fonts/fontManager.ts:101-125` handles font-loading races. There are no hardcoded font-metric tables.
- **Wrapping operates on graphemes, not words:** each Chinese character is a separate unit (`packages/ag-charts-core/src/utils/text/textUtils.ts:214-220`):
  ```ts
  export function graphemeSegments(text: string): string[] {
      if (graphemeSegmenter) return Array.from(graphemeSegmenter.segment(text), (s) => s.segment);
      return Array.from(text);  // fallback: code points
  }
  ```
  Truncation via `truncateLine()` also uses `graphemeSegments` (`textWrapper.ts:262-286`), so it does not split surrogate pairs.

**The defaults are the problem.** The key branch is in `packages/ag-charts-core/src/utils/text/textWrapper.ts:307-308`:

```ts
const wrapHyphenate = options.textWrap === 'hyphenate';
const wrapOnSpace  = options.textWrap == null || options.textWrap === 'on-space';
```

For **a long Chinese string with no spaces**, `lastSpaceIndex` stays at 0:

| `wrapping` value | Actual behavior for a long Chinese string |
|---|---|
| `'on-space'` (including unset) | **No wrapping; truncated with an ellipsis** (`textWrapper.ts:391-401`) |
| `'always'` | **Correct wrapping** at grapheme boundaries (`:403-423`) ✅ |
| `'hyphenate'` | Wraps, but **inserts a literal `-` at every break** (`:403` `postfix = '-'`, `:415`), which is incorrect for Chinese |
| `'never'` | Never wraps |

**Actual defaults by location** (all require overriding):

| Location | Default `wrapping` | Effect on Chinese | Evidence |
|---|---|---|---|
| **Category-axis tick labels** | `'on-space'` | **Silent truncation** ⚠️ Largest impact | `packages/ag-charts-community/src/module/axis-modules/categoryAxisModule.ts:29` |
| Grouped-category axis labels | `'on-space'` | Silent truncation | `.../groupedCategoryAxisModule.ts:27` |
| **Series data labels** | **`'never'`** | No wrapping | `packages/ag-charts-community/src/chart/series/seriesLabelProperties.ts:59` |
| **Tooltip** | `'hyphenate'` | **Unwanted `-` inserted** | `packages/ag-charts-community/src/chart/tooltip/tooltip.ts:143` |
| **Chart title/subtitle/footnote** | `'hyphenate'` | **Unwanted `-` inserted** | `packages/ag-charts-community/src/chart/themes/chartTheme.ts:267,280,293` |
| Axis title | `'always'` | ✅ Correct | `packages/ag-charts-community/src/chart/themes/axisThemeTemplate.ts:17` |
| Adaptive labels (treemap, etc.) | `'on-space'` | Silent truncation | `TYPES/chart/labelOptions.d.ts:148` |

**Conclusion: Chinese text requires explicit `wrapping: 'always'` configuration in five places across axis labels, data labels, tooltips, and titles/subtitles/footnotes. This is about 5 lines of configuration, but any omission causes truncation or unwanted hyphens.**

**Two more pitfalls:**
1. **Axis tick labels wrap only when `avoidCollisions` is true**—`packages/ag-charts-community/src/chart/axis/generateTicksUtils.ts:246`: `if (label.avoidCollisions) { wrappedLabel = wrapTextOrSegments(...) }`. It defaults to `true` (`axisThemeTemplate.ts:77`), but setting it to `false` also disables wrapping.
2. **The runtime fallback differs from the documented default**—`generateTicksUtils.ts:237` reads `textWrap: label.wrapping ?? 'never'`. Axes whose module templates do not supply `wrapping` (non-category axes) fall back to `'never'`, not `'on-space'`.

**No CJK-specific handling:** beyond `Intl.Segmenter`, library-wide searches for `\p{Script`, `CJK`, `isCJK`, and `wordBreak` return no matches. There are no Chinese/Japanese/Korean line-breaking restrictions, such as keeping `。，、）` off the start of a line. Basic wrapping works, but typography is less refined than a dedicated typesetting engine.

**UI localization:** `ag-charts-locale` provides `zh-CN`/`zh-HK`/`zh-TW`. It affects only accessibility labels and Enterprise UI strings, so its value to this project is limited.

### Responsive sizing → ✅ Pass (always enabled)

**v14 no longer has an `autoSize` option**—`grep -rn "autoSize" packages/ag-charts-types/src/` returns no matches. Following the container is now unconditional.

One `ResizeObserver` is created per document wrapper (`packages/ag-charts-core/src/utils/dom/agDocument.ts:233-234`), driven by `SizeMonitor` (`packages/ag-charts-community/src/util/sizeMonitor.ts:27-34`). The container is unconditionally observed on attach (`packages/ag-charts-community/src/dom/domManager.ts:544-553`), ultimately calling `Chart.resize()` (`chart.ts:1389-1395`).

Explicit dimensions take precedence over observed dimensions: `chart.ts:1416-1418` — `const width = inWidth ?? this.width ?? this._lastAutoSize?.[0];`

Options (`TYPES/chart/chartOptions.d.ts:238-253`): `width`, `height`, `minWidth`, `minHeight` (the latter two are "Ignored if `width`/`height` is specified" and can be updated at runtime).

Three implementation details: a `PixelRatioObserver` handles display DPI changes (`sizeMonitor.ts:41-49`); observation waits until `document.readyState === 'complete'` to avoid a spurious initial trigger (`:52-60`); dimensions are rounded down because, as the comment says, *"a fractional size ping-pongs the ResizeObserver by 1px"* (`domManager.ts:463`).

### Dependencies → ✅ Pass; "no third-party dependencies" is accurate

The measured dependency tree from `npm i ag-charts-community` contains only 4 AG packages, with **0 non-AG packages** (see section 1).

This is an explicit internal rule, not a coincidence. Under "Critical Rules" in `REPO/AGENTS.md`:

> **Zero runtime dependencies:** Community and enterprise runtime bundles must have **ZERO third-party dependencies** beyond AG Charts packages.

(Exception: `ag-charts-server-side` depends on `jsdom` + `skia-canvas`, but it is a Commercial server-rendering package outside this project's scope.)

**Current comparison:** `@ant-design/plots@2.6.8` installs 93 packages. That is a material supply-chain risk difference for a community plugin users download.

### Maintenance activity → ✅ Excellent

Release cadence (npm registry `time` fields + GitHub Releases):

| Version | Date |
|---|---|
| 14.1.0 | 2026-08-05 |
| 14.0.2 | 2026-07-22 |
| 14.0.1 | 2026-07-15 |
| 14.0.0 | 2026-06-24 |
| 13.3.1 | 2026-06-02 |
| 13.3.0 | 2026-05-12 |
| 13.2.1 | 2026-04-07 |
| 13.2.0 | 2026-03-25 |
| 13.1.0 | 2026-02-11 |
| 13.0.1 | 2026-01-22 |
| 13.0.0 | 2025-12-10 |

**11 releases in the past year, averaging about one every 5 weeks, with major versions about every six months.** A commercial company (AG GRID LTD, registration number 07318192) maintains it; Enterprise revenue directly funds Community development. The repository has full CI, e2e, image snapshot tests (`__image_snapshots__`), and development guidelines for AI Agents.

**Risk:** major versions (13→14) include **breaking API changes**. This research found `axes` changing from an array to a dictionary and `axes[].keys` being replaced by `series[].yKeyAxis`. A major release every six months requires regular migration work.

---

## 5. Migration cost estimate

**Current state:** about **1100 lines** are coupled to the engine (`chart-tag-config.mjs`: 1048 lines; `chart-theme.ts`: 54 lines), plus 1835 lines of chart tests. Approximately 3700 lines in the parsing layer, entry layer, and block components are **entirely unaffected**.

### What must be rewritten

| Component | Current size | Estimated after migration | Notes |
|---|---|---|---|
| `chart-tag-config.mjs` (configuration generation) | 1048 lines | **About 250–400 lines** | Replaces G2 spec assembly and extensive manual layout calculations with AG Charts options objects. The API difference requires a rewrite, not incremental adaptation |
| `chart-theme.ts` (theme bridge) | 54 lines | **About 5–15 lines** | Most can be removed directly (see below) |
| Chart tests | 1835 lines | **Major rewrite** | Assertions target G2 spec structures and all become invalid after switching engines. Tests of generated options objects require work comparable to the configuration layer |

### Code that can be removed (built into the library)

| Existing capability | Why it can be removed |
|---|---|
| **Theme tracking / CSS-variable resolution / redraw on theme changes** | Native `var(--x)` resolution and `@property` change detection with automatic redraw. This is the largest net deletion |
| **Data-label collision avoidance (reposition + hide)** | `label.collision.alwaysShow` + ordered `placements`, backed by a 2294-line layout engine |
| **Stacked-bar label centering / thin-segment handling** | Default `placement: 'inside-center'` + `beside-*` fallback + `minimumFontSize` |
| **Negative-label direction reversal** | Built-in default |
| **Rounded y-axis ticks** | `nice` defaults to `true` |
| **Canvas assembly for PNG export** | `getImageDataURL()` / `download()` |
| **Container-size tracking** | Built-in `ResizeObserver`; v14 has no `autoSize` switch and always follows the container |
| **Manual drawing of legend dashes** | `legend.item.line.{length,strokeWidth}`, with `showSeriesStroke` enabled by default |
| **Static bands/vertical lines marking specific x values** | `axes.x.crossLines[]` (`type:'range'` / `type:'line'`) |

### Code that must be added

| Item | Size | Notes |
|---|---|---|
| **⚠️ Column background band / vertical line on hover (item 15)** | **About 40–80 lines** | `crosshair` and `bandHighlight` are Enterprise-only. Community needs highlight-event handling, dynamic `axes.x.crossLines` updates, state management, and throttling. **This is the only existing capability that must be reimplemented after migration** |
| **Explicit Chinese wrapping configuration** | About 5 lines | Set `wrapping: 'always'` in five places across axis labels, data labels, tooltips, and titles/subtitles/footnotes, or text will be silently truncated or gain unwanted `-` characters |
| **8% y-axis headroom** | About 3–5 lines | Compute `dataMax`, then set `preferredMax = dataMax * 1.08`. No native percentage-headroom option |
| **Alternative to numeric-label outlines** | About 2–5 lines | Use `label.fill`/`padding`/`cornerRadius` backgrounds, or `insideStyle`/`outsideStyle` for placement-specific colors. A mandatory text halo is **unavailable** |
| **PNG export button UI** | About 10–20 lines | The API is Community, but toolbar/contextMenu buttons are Enterprise; supply a custom button |
| **Adaptation to the `axes` dictionary model** | Included in the configuration rewrite | New v14 model, not an additional cost |

### Net estimate

**Configuration layer: 1048 lines → about 250–400 lines (including the roughly 60–115 added lines above), a net reduction of about 650–800 lines.** `chart-theme.ts` also shrinks from 54 to about 5–15 lines.

**The 1835 lines of tests require a comparable rewrite:** they assert G2 spec structures, which all become invalid after the engine changes. **This is the main migration effort, rather than the configuration layer itself.**

**Overall: the migration reduces code while improving capabilities**, with most one-time effort in the test rewrite and one regression requiring custom code (item 15, hover highlighting).

**Recommended validation order**, from highest to lowest risk; stop if any step fails:

1. **Verify `@property` + `transitionend` in Obsidian/Electron.** This is the only risk to nearly code-free theme tracking, the largest advantage. If it fails, that benefit disappears.
2. **Render Chinese labels.** With `wrapping: 'always'` explicitly set, check whether axis-label/data-label/tooltip line breaks are acceptable.
3. **Prototype a dual-axis combination chart.** Also inspect items 2, 4, and 13: collision avoidance, thin stacked segments, and label backgrounds.
4. **Prototype custom hover highlighting for item 15.** Verify the 40–80-line estimate.

---

## 6. Three main strengths and weaknesses

### Strengths

1. **Native CSS-variable resolution and automatic redraw make Obsidian theme tracking nearly effortless.**
   This is the most valuable feature **for this use case**. A canvas chart library that implements `getComputedStyle` resolution plus `@property`/`transitionend` change detection is making an unusual engineering investment. It removes one of the plugin's most time-consuming and error-prone areas: rebuilding on theme changes and bridging colors.

2. **Label layout has a dedicated engine, not just a few conditionals.**
   The 2294-line `labelPlacement.ts` includes spatial indexing, obstacle models, ordered candidate positions, rotated bounding boxes, and adaptive font-size fallbacks. The public API configures four fallback stages: reposition → shrink text → wrap → hide. It fulfills the request to stop manually managing where numbers go and how horizontal label collisions render.

3. **No third-party dependencies, a smaller bundle, and steady commercial maintenance.**
   4 in-house packages versus 93 packages; 1.23 MB versus 1.46 MB; 11 releases in the past year. All three are concrete benefits for a downloadable community plugin maintained over time.

### Weaknesses

1. **Chart-type coverage is severely limited, and payment cannot fill every gap.**
   Community has only 8 series types. Paying $499/developer for Enterprise adds radar charts, heatmaps, Sankey diagrams, tree charts, maps, and gauges. But **network graphs, flowcharts, mind maps, Gantt charts, word clouds, timelines, and parallel coordinates are unavailable at any price across the entire AG product line**. A requirement for one vendor to cover everything rules out AG Charts.

2. **Enterprise gates capabilities that users might expect to be free: animations and hover highlighting.**
   `animation` is a plugin module marked `enterprise: true`, so **Community charts have no entry/update animations**. More directly relevant here, **`crosshair` and `bandHighlight` are also Enterprise-only**: the existing hover band/vertical-line capability in item 15 must be rewritten after migration. Zoom, navigator, annotations, context menus, gradient legends, error bars, and polar axes also require Enterprise. Missing animation detracts from the goal of more modern, attractive rendering, although its impact on static charts in Obsidian notes is limited and can even be beneficial.

3. **Chinese defaults are problematic, numeric-label outlines are unavailable, and major releases break APIs.**
   **Default `wrapping` values are wrong for Chinese:** category labels default to `'on-space'` and silently truncate text; tooltips and titles default to `'hyphenate'` and insert `-` between Chinese characters. Avoiding this requires explicit configuration in five places—only 5 lines, but **easy to miss, with silent symptoms**. Item 13, text outlining, is the only unavailable feature among the 16 (`TextOptions` has only `color`; underlying `strokeText` is not exposed). An equivalent alternative exists, but the appearance differs. Version 13→14 also changed `axes` from an array to a dictionary; major releases every six months imply ongoing migration costs.

---

## 7. Uncertainties

The following are **unanswered or unverified**; no assumptions are made:

1. **Whether purely internal users who neither develop nor distribute need an Enterprise license is not addressed by the EULA.** It governs the Licensee and charges for frontend JS developers building the Application. A company merely using someone else's open-source plugin has zero such developers. **The answer requires written confirmation from AG Grid sales.** Whether an Obsidian plugin falls under the development toolkit/library restriction in 3.7(b) is also left to AG Grid ("as determined by the Licensor") and **cannot be determined independently**.

2. **The repository contradicts itself on histogram's tier; treat it as Enterprise.**
   Two sources within the same commit disagree:
   - **The module manifest says Community:** `enterprise: true` is commented out in `expectedModules.ts:203-209`; `HistogramSeriesModule` is exported by `ag-charts-community/src/main.ts:24` and included in the Community bundle by `module-bundles/cartesian-series.ts:14`. The published tarball retains that comment unchanged.
   - **Official documentation says Enterprise:** the frontmatter of `packages/ag-charts-website/src/content/docs/histogram-series/index.mdoc` explicitly states `enterprise: true`, exactly like actual Enterprise pages such as heatmap (`line-series/index.mdoc` has no such field).

   **The manifest controls runtime behavior, so it currently works in Community. The vendor's documented intent, however, is to charge for it.** It is unclear whether this was an intentional move to Community with stale documentation or an accidental comment. **Any release could uncomment the line.** Conclusion: it works, but **should not guide engine selection or become a product dependency**.

3. **No actual rendering was tested—the report's largest overall limitation.** All conclusions come from types and implementation source; **not a single chart was rendered**. These items particularly need runtime testing:
   - Item 2: collision avoidance with dense Chinese labels.
   - Item 4: the appearance of `beside-*` fallbacks for thin stacked segments.
   - Item 13: whether `label.fill` backgrounds are visually acceptable.
   - Whether CJK line breaks under `wrapping: 'always'` suit Chinese reading conventions.

4. **`@property` support in Obsidian/Electron is unverified.** Automatic CSS-variable tracking depends on the `@property` at-rule and `transitionend`. A sufficiently recent Chromium version in Electron supports them, but **this was not verified in Obsidian itself**. It is the sole risk to nearly code-free theme tracking, the largest advantage; **test it first**.

5. **The exact visual effect of `legend.item.marker.padding` is unverified.** JSDoc describes padding between the marker and label, defaulting to 8; the implementation uses it as `markerLabel.spacing`. The requirement is 4px and the option exists, but **setting it to 4 has not been verified to produce exactly 4px**; other spacing may contribute.

6. **`preferredMax` was not tested.** The proposal to obtain 8% headroom while preserving nice rounding comes from reading `normalisedExtentWithMetadata` and `getDomainExtentsNice()`. **The final ticks produced by combining nice and `preferredMax` were not verified at runtime.**

7. **Custom Community hover highlighting remains unverified.** The proposed approach—listen for highlight events → dynamically update `crossLines`—is inferred from available APIs. **No prototype was written**, so the 40–80-line estimate is uncertain.

8. **The bundle-size impact of `ag-charts-locale` was not examined closely.** It is a direct dependency of `ag-charts-community` (4 MB unpacked, 31 languages). The measured 1.23 MB total bundle shows it is not included in full, but **whether some locale data is imported statically was not confirmed**.

9. **Issue response times were not investigated.** Only release cadence was counted; **GitHub issue first-response times and closure rates were not sampled**. The maintenance-activity assessment covers release frequency alone.

10. **Enterprise trial terms were not cross-checked against the website.** The bundled EULA specifies 60 days (30 days of trial plus 30 days of negotiation), during which "Software may place watermarks on output". **The actual website trial-flow terms were not checked** for consistency with the bundled EULA.

11. **Evidence provenance.** Git cleaned up the first two `git clone` attempts after they failed partway through (`fetch-pack: invalid index-pack output`); the third succeeded (commit `2001e0c`, 2026-08-14). That checkout confirmed the correction to item 15, and **all 15 `REPO` path references in this report were checked individually after the successful clone**. The repository version was `14.1.0-beta.20260809`; the tarball was stable `14.1.0`. No differences affecting this report's conclusions were found. The repository contains complete `packages/ag-charts-website` and `packages/ag-charts-community-examples` directories, but **their runnable examples were not systematically reviewed**. Configuration snippets in this report were handwritten from verified type definitions and **have not been run**.

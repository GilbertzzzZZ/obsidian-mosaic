# FlowDiagram（流程图）

<p align="center"><a href="flow-diagram.md">English</a> | <b>简体中文</b></p>

> 在 Obsidian 中编写、检查和修复流程图的完整操作手册。
> 把步骤和连接关系写下来，Mosaic 就会自动排成流程图。

**效果预览——带两条结果分支的决策**

![带分支标签的活动入场流程](../_assets/readme-flow.png)

## 选择写法

> 箭头上要写说明，就用 JSON 的节点和连线格式；简单流程可以直接用表格。

| 需求 | 推荐写法 | 要写什么 |
| --- | --- | --- |
| 带 Yes/No 或命名结果的决策 | JSON 节点与连线 | `nodes` 节点数组和带标签的 `edges` 连线数组 |
| 带分流与汇合的检查清单 | CSV 表格 | 每行一个节点，`next` 用逗号分隔目标 ID |
| 已经写成表格的短流程 | Markdown 表格 | 节点字段和 `next` 列 |
| 嵌入以标签组织的笔记 | 成对标签 | 在 `<FlowDiagram>…</FlowDiagram>` 内放相同的图或表格数据 |

- 顺序不需要视觉解释时，直接用编号列表。日期和进度比连接关系更重要时，使用 [Timeline（时间线）](timeline-zh.md)。
- 下方所有完整的 `flowdiagram` 代码块都是可运行示例。启用 Mosaic 后，在 Obsidian **阅读视图**中直接显示效果；在 GitHub 或未安装 Mosaic 时显示源码。编辑时切换到**源码模式**。
- 示例全部使用虚构数据，不依赖外部文件。FlowDiagram **不支持** `dataset`、可执行条件、Mermaid 语法或 JavaScript。
- 标签和错误示例会保留为源码，方便查看和复制。

---

## 搭建完整的分支流程

> 先给每个步骤一个固定的 ID，再连上各条分支，写清它们在哪里汇合。

### 提案审核与活动准备

- 这个完整示例包含 12 个节点、三种审核结果、准备工作的分流，以及开放活动前的汇合。
- 沿通过路线，从接收提案走到开放活动；另外两条路线都以延期结束。
- 节点的 `note` 是悬停说明，区块级 `note` 是始终可见的图下注释。

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

### 如何改成自己的流程

1. 把 `label` 改成自己的步骤名称。只是调整文字时，保留原来的 ID。
2. 先添加节点，再添加指向它的连线。`from` 和 `to` 必须匹配 ID，不能写显示标签。
3. 为决策的每个结果添加标签。标签只是文字，不是 Mosaic 会执行的条件。
4. 新增准备任务时，连接 `prepare` 到新任务，再连接新任务到 `ready`。
5. 写清汇合代表“全部任务完成”还是“任一分支到达”。Mosaic 只画连接，不执行其中任何规则。
6. 调整输入数组中节点的顺序，可以改变同层节点的排列顺序；垂直层级由连接关系决定。

---

## 用表格编写流程

> 简单流程用表格写更省事。

### CSV：并行准备与汇合

- `next` 包含逗号时要用引号包裹，否则多个目标会被拆成不同的 CSV 单元格。
- `next` 留空表示这一步没有后续步骤，备注也可以留空。
- `next` 只描述连接，不会启动并行任务，也不会等待任务完成。

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

### Markdown 表格：小型交接流程

- 必须包含表头分隔行，每行以 `|` 开头。
- 单元格需要字面量竖线或复杂文字时，改用 CSV 或 JSON。Mosaic 在这里按简单表格读取，遇到转义竖线或复杂表格语法会读错。

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

### JSON 行数组：复用已有结构化数据

- JSON 最外层直接写数组时，每个对象就是一行，用 `next` 指定下一步。
- 包含 `rows` 数组的对象也属于表格数据。需要明确的连线对象与标签时，使用 `nodes` 数组。
- `next` 写成逗号分隔的字符串，不要写成 JSON 数组。

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

## 用标签包住流程数据

> 同一份数据也可以放进标签里，注意下面的格式要求。

- 使用 `flowdiagram` 代码块时，在两行 `---` 之间填写属性，每行一个 `key: value`，然后直接写 JSON、CSV 或 Markdown 表格。
- 使用成对标签时，开标签必须占**单独一行**，`=` 两侧不能有空格。闭标签 `</FlowDiagram>` 也独占一行，大小写必须一致。
- 成对标签内部**不能有空行**，无关正文必须放到标签段落之外。
- 不要使用 `<FlowDiagram />`：它没有可渲染的节点。

### 成对标签：带标签的检查分支

- 复制从 `<FlowDiagram` 到 `</FlowDiagram>` 的全部内容，包括里面的 JSON 代码块；最外面的 `text` 不用复制。

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

### 成对标签：TSV 数据

- 下例分隔符是真正的制表符。必须明确标注 `tsv` 围栏，因为不带围栏的 TSV 不会被自动识别。
- 在命名代码块里嵌套 TSV 时，外层 `flowdiagram` 围栏使用四个反引号，内层 `tsv` 围栏使用三个。相同长度的内层围栏会提前关闭外层代码块。

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

## 属性和数据怎么填

> 新建流程图时，优先使用以下标准字段。

**区块属性**

- `title`：区块标题，也是图的无障碍名称；省略时，无障碍名称为 `Flow diagram`。
- `note`：图下方始终可见的注释。
- Mosaic 自动安排位置、形状和配色。目前只支持在区块上填写 `title` 和 `note`，其余属性见下方排错说明。

### 节点字段

| 字段 | 含义 | 字段名称与取值顺序 |
| --- | --- | --- |
| `id` | 节点 ID，用来连接节点；建议填写，每个节点使用不同的 ID | `id` → `key` → 从 1 开始的行位置 |
| `label` | 节点内部的显示文字 | `label` → `title` → `name` → ID/行位置 |
| `type` | 节点种类，决定显示颜色 | `type` → `kind` → `status`；默认 `action` |
| `note` | 桌面端鼠标悬停时显示的说明 | `note` → `description`；默认空 |
| `next` | 下一步的 ID，多个目标用逗号隔开 | `next` → `to`；默认空 |

- 同一个字段有多个名称时，按表中的顺序查找，跳过缺失或值为 `null` 的项。空字符串也算已填写，会直接采用。
- ID 会转为字符串并去掉前后的空格。填写空 ID 的节点会被跳过。建议自己填写 ID，每个节点使用不同的名字，这样调整顺序也不会连错。
- 重复 ID 不会触发校验报错，但会导致节点重叠或连接错位。应在源码中修正重复。
- 标签保持简短：最多换行显示三行，超出后截断。详细说明放到节点备注或周围正文。
- 节点标签、连线标签和节点备注都是纯文本。节点内不会渲染 HTML、Markdown 强调或可点击链接。

### JSON 中的连线字段

| 字段 | 含义 | 接受的别名 |
| --- | --- | --- |
| `from` | 起点节点 ID | `from` → `source` |
| `to` | 终点节点 ID | `to` → `target` |
| `label` | 箭头上的文字 | `label` → `title`；默认空 |

- JSON 的最外层是一个对象，里面的 `nodes` 是节点数组，`edges` 是连线数组。数组里每项都按示例写成对象。
- 没有显式连线时可以省略 `edges`。当 `edges` 缺失或为 null 时，`links` 是它的别名；显式 `edges: []` 优先。
- 连线的起点和终点会转为字符串。只要其中一个 ID 找不到，这条连线就会被跳过，页面也不会报错。
- 图节点的 `next` 也会追加连线。不要同时在 `edges` 和 `next` 中声明同一连接；连接不会自动去重。
- 使用表格的 `next` 时，当前版本会把同一条连接画两次，重叠在一起。需要精确控制连线数量时，请使用 JSON 的 `edges`。
- CSV 中的 `label` 是**节点**标签。要给箭头加文字，请使用 JSON 的 `edges`。

### 节点类型与外观

| 类型 | 用途 | 接受的值 |
| --- | --- | --- |
| `start` | 起点，绿色 | `start` |
| `end` | 结果，绿色 | `end` |
| `action` | 普通步骤，中性色 | `action`、缺失值或任意未识别值 |
| `decision` | 分支，橙色 | `decision`、`question`、`branch`、`condition` |
| `gate` | 检查或审批，主题强调色 | `gate` |
| `risk` | 阻塞或警告，红色 | `risk`、`warning`、`blocked`、`error` |

- `type` 的前后空格和大小写都不影响识别。
- 所有节点都是圆角矩形。`decision` 改变的是颜色，不会把节点变成菱形。
- 配色跟随 Obsidian 主题。节点类型表达含义，不代表执行状态。

---

## 布局、宽图与重试

> 连接关系决定垂直层级，输入顺序控制同一层内部的顺序。

- 有多条路线到达同一个节点时，它会排在最长路线的后面。没有连接的节点会排在最上层。
- 连线交叉较多时，Mosaic 不会自动重新排布来避开交叉。可以重排同层节点，或把过大的流程拆成有独立标题的多张图。
- 流程图最小显示宽度为 720 px。窄视图在图内横向滚动，不会撑宽笔记。
- 布局自动生成，不提供拖动定位、缩放控件、横向布局切换、泳道或分组容器。
- 流程可以回到之前的步骤。遇到这种循环时，循环内及后续的节点会按输入顺序依次往下排，回头的箭头仍会保留。

### 有明确退出条件的重试

- `retry → inspect` 构成环路。失败路线到达独立终点，让流程保留明确的退出方式。
- 如果重试让整张图变得太长，可以把这部分单独画成一张图。

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

## 排错

> 先看属于哪种情况：出现错误框、有属性提示，还是图画出来了但内容不对。

### 错误框：现象与修复

| 提示或现象 | 原因 | 修复 |
| --- | --- | --- |
| `FlowDiagram requires nodes.` | 数据为空、`nodes` 为空，或所有显式 ID 都为空 | 至少提供一个有效节点 |
| `External datasets support Chart and DataTable.` | 填写了 `dataset` 属性 | 删除该属性，把图或行数据直接写进区块 |
| JSON 解析错误 | 尾随逗号、缺少引号/括号或其他非法 JSON | 键与字符串用双引号，不写注释，修正 JSON |
| `Block must start with a "---" attribute section.` | 命名代码块直接以数据开头 | 补齐属性区的两行边界 |
| `The "---" section is missing its closing "---".` | 只有开头的属性边界 | 在数据前补第二行 `---` |
| `No attribute could be read …` | 属性区写了内容，但格式都不是 `key: value` | 修正属性行，或将属性区留空 |
| 提到 `map` 或属性读取的错误 | 数据格式写错，例如 `edges` 写成对象，或节点写成 `null` | 把 `nodes` 和 `edges` 写成数组，每项填写完整对象 |

- 错误框会显示 `Mosaic:` 前缀。原生 JSON/类型错误的措辞随 Obsidian 的 JavaScript 运行时而变化。
- 只画节点也可以；如果一个有效节点都没有，就会报错。
- 求助时可以使用错误框的复制按钮，发送前先移除敏感数据。

### 故意写错的示例

- 下面保留错误示例的源码。想亲自试一下，可以把里面的 `flowdiagram` 代码块复制到临时笔记。

**没有节点**

````text
```flowdiagram
---
title: Empty graph
---
{"nodes":[],"edges":[]}
```
````

- 预期：`Mosaic: FlowDiagram requires nodes.`。
- 修复：在 `nodes` 中加入节点，例如 `{"id":"start","label":"Begin","type":"start"}`。

**不支持的外部数据**

````text
```flowdiagram
---
title: External graph
dataset: graph.dataset.json
---
```
````

- 预期：`Mosaic: External datasets support Chart and DataTable.`。
- 修复：移除 `dataset`，将完整图或行数据粘贴在第二行 `---` 后面。

**JSON 格式错误**

````text
```flowdiagram
---
title: Invalid JSON
---
{"nodes":[{"id":"start","label":"Begin",}],"edges":[]}
```
````

- 预期：JSON 解析错误，而不是空图提示。
- 修复：删除 `"Begin"` 后面的逗号。

**缺少属性边界**

````text
```flowdiagram
{"nodes":[{"id":"start","label":"Begin"}],"edges":[]}
```
````

- 预期：`Mosaic: Block must start with a "---" attribute section.`。
- 修复：在 JSON 前插入两行 `---`，中间可以选填 `title: Example`。

### 没有错误框，但结果不对

| 现象 | 检查什么 | 修复 |
| --- | --- | --- |
| 少了一条箭头 | `from`/`to` 是否精确匹配 ID，包括大小写 | 引用节点 ID，不要写节点标签 |
| CSV 分支少了一个目标 | `next` 中的逗号没有用引号包裹 | 把 `"room,supplies"` 写成一个 CSV 单元格 |
| 箭头重叠 | 同一条连接写了多次，或同时用了 `edges` 与 `next` | 精确连接优先使用一份显式连线列表 |
| 节点重叠或箭头指向错误方框 | 重复 ID | 为每个节点设置唯一 ID，并同步引用 |
| 类型没有显示预期颜色 | 拼写错误，或`type` 填了空字符串，导致后面的别名被忽略 | 使用六种标准类型之一 |
| 长标签末尾消失 | 超过三行文字限制 | 缩短标签，把细节移到备注 |
| 图变成很长的链 | 流程回到了前面的步骤 | 把重试单独画出来，或删除连错的回头箭头 |

**属性提示**

- `direction: LR` 等不支持的属性不会控制布局；它们会出现在提示中，已识别的内容仍会渲染。
- 缩进或格式错误的属性行会被跳过。若仍有有效属性，区块可以继续渲染并显示提示。
- 标签中的 `title = "Example"` 不等于 `title="Example"`；去掉 `=` 两侧空格。
- 节点数据里的字段别名与区块属性是两回事。例如 `type` 应写在节点上，不能放在区块 `title` 旁边。

**仍然只显示源码**

- 确认已启用 Mosaic，并切换到**阅读视图**。`text` 或 `json` 围栏不是 `flowdiagram` 区块。
- 成对标签检查：大小写一致、开标签单行、闭标签独占一行、内部没有空行、同段落没有无关文字。
- 标签的属性名要用英文标准名称。属性名含中文等非 ASCII 字符时，会直接显示源码；需要使用这类名称时改用代码块。
- 内层围栏提前截断外层代码块时，使用不同长度的围栏，或直接放裸数据。
- 完整的宿主段落规则见[标签语法](tag-syntax-zh.md)。

---

## 分享前检查

> 不只确认能否渲染，也要核对图表达的含义。

1. 从起点走完每条路线，包含拒绝、阻塞与重试路线，确认最终结果。
2. 确认所有 ID 唯一，每条连线的起点和终点都能找到。
3. 检查决策标签，写清每个汇合点的预期含义。
4. 重要细节放在正文或图下注释中，不要只放在悬停备注里。
5. 打开阅读视图，检查整张图和窄视图的横向滚动。
6. 处理错误与属性提示；“没有报错”不代表所有箭头都已出现。
7. 把源码留在笔记里，你和 Agent 就能一起编辑同一份内容。

- 面向 Agent 的浓缩参考见 [Mosaic skill 正文](../../src/agent-guide/mosaic.md)。
- 设计理由见 [FlowDiagram 设计](../design/flow-diagram.md)。

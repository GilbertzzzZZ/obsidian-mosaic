# 导入 Mosaic 指导

<p align="center"><a href="agent-guide.md">English</a> | <b>简体中文</b></p>

> Mosaic 可以把完整的英文创作参考导入为 agent skill（智能体技能），也可以导入为普通 Markdown 指南。
> 每份导入产物都能独立使用，不依赖本仓库或另一份已安装副本。

导入指导是 opt-in（主动选择）功能，不改变 Mosaic 渲染笔记的方式。需要创建副本时，打开 Mosaic 设置。

## 导入 skill

> 使用原生的 `Import skill` 分组。默认范围是 `Current vault`（当前 vault）。

Mosaic 会显示当前范围，并在每次操作结果中显示目标路径。在 desktop（桌面端），通过 `Current vault` 与 `Global` 两个按钮选择范围。选中的按钮高亮，每个目标路径旁都有独立的导入按钮。仅选择范围不会写入、移动或删除任何内容。Mobile（移动端）只提供 `Current vault`。

| 按钮 | 当前 vault 目标 | 用户主目录（全局）目标 |
| --- | --- | --- |
| `Import to .agents` | `.agents/skills/mosaic/SKILL.md` | 当前用户主目录下的 `.agents/skills/mosaic/SKILL.md` |
| `Import to .claude` | `.claude/skills/mosaic/SKILL.md` | 当前用户主目录下的 `.claude/skills/mosaic/SKILL.md` |
| `Import to path` | 所选 skill 父目录加 `mosaic/SKILL.md` | 所选桌面目录加 `mosaic/SKILL.md` |

- 在 vault 范围内，自定义父目录默认是 `.agents/skills`。桌面端点击路径框打开系统文件夹选择器，初始位置是 vault 根目录。选择 vault 外或其配置目录内的路径会被拒绝。
- 使用系统选择器选择或创建文件夹，需要时使用其显示隐藏文件夹的控件。移动端点击路径框打开可搜索的 vault 文件夹列表，也可输入新的 vault 相对父目录。
- 在全局范围内，所选父目录默认是当前用户主目录下的 `.agents/skills`。点击路径框打开操作系统目录选择器，并将当前 vault 作为初始目录。
- 是否支持该初始目录由宿主系统弹窗决定。不另外提供 `Choose folder` 按钮。
- 取消任一弹窗都会保留原有选择与安装记录。
- Vault 路径显示为当前 vault 内的相对路径。
- macOS 与 Linux 的全局路径在用户主目录内时用 `~` 缩写。Windows 和其他全局目录保留完整的系统路径。
- 显示缩写不改变实际写入目标。

这三个按钮只创建 skill 文件。不同客户端加载 skill 的方式和时机不同；如果当前会话没有读取新导入或刚更新的 skill，请查阅所用客户端的文档。

以前导入到 `.agents`、`.claude`、自定义父目录、不同 vault 或全局范围的 skill 可以并存。仅修改当前范围或父目录不会删除、移动或停止记录先前的安装。同一范围内的新自定义导入成功后，旧文件仍保留，新目标会成为记录中的自定义目标。

## 导入普通指南

> 不导入 skill 时，可选择单独的原生 `Import guides to this vault (optional)` 分组作为替代方式。普通指南始终保留在当前 vault 内。

文件夹控件默认选择 `docs/guides`。不修改该设置，直接点击 `Import guides` 会创建：

```text
docs/guides/Mosaic-Usage-Guide.md
```

点击路径框使用与 skill 导入相同的文件夹选择器：桌面端打开系统弹窗，初始位置是 vault 根目录；移动端打开 vault 文件夹列表。已有的保存值会保留，包括明确选择的根目录；只有设置不存在时才采用 `docs/guides`。选择文件夹不会导入指南；在系统弹窗中新建文件夹只会创建该目录。

普通指南不受 skill 的范围选择影响。即使 skill 选择了 `Global` 范围，它仍使用 vault-relative（vault 相对）路径。在当前 vault 的 `AGENTS.md` 中引用指南的相对路径，让 agent 在创建 Mosaic 内容前读取它。Mosaic 只导入指南，不会替你修改 `AGENTS.md`。

## 导入会改变什么

> 点击任一 skill 按钮或指南的 `Import guides` 按钮之前，不会创建任何文件。

- Vault 导入只写入界面显示的 vault 相对目标。
- 在桌面端，只有选择 `Global` 并点击 skill 按钮后，全局 skill 导入才会写入 vault 外部。它只写入所选的 `mosaic/SKILL.md`，不会修改全局客户端配置。
- 全局范围、所选全局父目录与成功的全局安装记录按当前 vault 保存在本设备，不进入同步的插件数据，也不会授权另一台设备访问全局文件。
- 指南导入不会增加网络请求、telemetry（遥测）、agent 启动、脚本或符号链接。Mosaic 不上传笔记内容。
- 一个目标失败只影响该目标，不影响渲染或其他导入。

## 自动更新方式

> Mosaic 每次加载插件时只检查已有记录的目标，并且只替换仍由 Mosaic 管理的内容。

- 插件不设置定时任务，不扫描 vault，也不搜索被移动的文件。
- 已记录的文件仍与 Mosaic 上次安装的内容一致时，插件更新可以用新指导替换整个文件。
- 文件已经与期望内容逐字节相同时，Mosaic 不会重写。
- 用户编辑文件后，Mosaic 保留完整文件，并暂停该目标的自动更新。插件不合并文本，也不创建备份副本。
- 用户改名、移动或删除文件后，Mosaic 不搜索文件，也不自动重建。
- 自动更新不会降级较新 Mosaic 版本记录的指导。
- Vault 与全局记录相互独立。一个范围内的更新或失败不会覆盖另一个范围的操作结果。
- 另一个 vault 已经把同一全局 skill 更新为期望内容时，Mosaic 会保持它不变；如果内容与记录中由插件管理的副本不同，Mosaic 会保留现有内容。

每次手动点击导入都会把完整的内置指导写入所选目标，包括已有文件被编辑或由较新插件版本记录的情况。自动更新的保护规则不适用于明确的手动导入。导入到新的自定义父目录会保留旧文件；成功的新目标会成为该目标与范围后续维护的位置。

## 重试失败的导入

> 修复界面显示的路径或权限问题，再次执行同一个按钮操作。

- 文件夹不可写时，恢复访问权限，或选择另一个允许写入的文件夹。
- Mosaic 只在文件写入成功后记录安装。文件已经写入、但保存记录失败时，再次执行同一导入；Mosaic 会再次写入完整文件并记录安装。
- 桌面端全局设施不可用时，Mosaic 会显示可读错误。Vault 导入和渲染仍然可用。

## 使用已导入的指导

- 请求 agent 创建 Mosaic 内容块，并提供应使用的真实数据、字段含义与聚合规则。
- 要求 agent 在缺少必要事实时先确认，不得自行编造数据或 rollup（上卷）定义。
- 把生成后的笔记切换到阅读视图，查看 Mosaic 渲染结果。
- 如果导入的是普通指南，请把它的 vault 相对路径明确提供给 agent。

面向使用者的语法和排错说明见 [Mosaic 内容块指南](../README-zh.md#文档)。

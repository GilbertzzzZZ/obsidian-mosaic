import {
	App, FileSystemAdapter, normalizePath, Notice, Platform, PluginSettingTab,
	Setting, SettingDefinitionItem, SettingGroupItem, SuggestModal,
} from "obsidian";
import type MosaicPlugin from "./main";
import { guideTargetPath } from "./agent-guide/core.mjs";
import { displayGlobalPath, globalGuidePath, pickVaultFolder } from "./agent-guide/desktop";
import type {
	GuideInstalls,
	GuideResult,
	GuideScope,
	GuideTarget,
} from "./agent-guide/installer";

export interface MosaicPluginSettings {
	showExportBtn: boolean;
	guideFolder: string;
	skillFolder: string;
	guideInstalls: GuideInstalls;
}

export const DEFAULT_SETTINGS: MosaicPluginSettings = {
	showExportBtn: false,
	guideFolder: "docs/guides",
	skillFolder: ".agents/skills",
	guideInstalls: {},
};

// 控件 key 就是设置字段名。写成常量而不是各处重复字面量：改字段名时
// getControlValue / setControlValue 会跟着编译期报错，不会只改一半。
const SHOW_EXPORT_BTN = "showExportBtn" satisfies keyof MosaicPluginSettings;
const GUIDE_FOLDER = "guideFolder" satisfies keyof MosaicPluginSettings;
const SKILL_FOLDER = "skillFolder" satisfies keyof MosaicPluginSettings;
const GLOBAL = "global";

const CUSTOM_GUIDE_PROMPT =
	"Reference this guide in your vault's AGENTS.md to help your agent create Mosaic content.";

function scopeLabel(scope: GuideScope): string {
	return scope === "global" ? "Global" : "Current vault";
}

function guideOperationFailure(result: GuideResult): string {
	const location = result.path ? ` at ${result.path}` : "";
	const detail = result.message ? `: ${result.message}` : "";
	return `Guide operation failed${location}${detail}.`;
}

function resultNotice(result: GuideResult): string {
	const path = result.path ? ` ${result.path}` : "";
	let message: string;
	switch (result.status) {
		case "installed":
			message = `Installed${path}.`;
			break;
		case "updated":
			message = `Updated${path}.`;
			break;
		case "unchanged":
			message = `Mosaic guidance is current at${path}.`;
			break;
		case "missing":
			message = `Installed guide is missing at${path}.`;
			break;
		case "conflict":
			message = `Local changes kept at${path}.`;
			break;
		case "newer":
			message = `Newer guide kept at${path}.`;
			break;
		case "busy":
			message = "Another guide operation is already running.";
			break;
		case "error":
			message = guideOperationFailure(result);
			break;
	}
	if (
		result.target === "custom" &&
		(result.status === "installed" ||
			result.status === "updated" ||
			result.status === "unchanged")
	) {
		return `${scopeLabel(result.scope)}: ${message} ${CUSTOM_GUIDE_PROMPT}`;
	}
	return `${scopeLabel(result.scope)}: ${message}`;
}

class VaultFolderModal extends SuggestModal<string> {
	constructor(app: App, private readonly current: string, private readonly choose: (folder: string) => Promise<void>) {
		super(app);
		this.setPlaceholder("Choose a folder in the current vault");
	}

	getSuggestions(query: string): string[] {
		const configDir = normalizePath(this.app.vault.configDir);
		const folders = ["", this.current, ...this.app.vault.getAllFolders(true).map(folder => folder.path)];
		if (query.trim()) folders.unshift(query.trim());
		return [...new Set(folders.map(folder => folder === "/" ? "" : folder))].filter(folder => {
			try {
				guideTargetPath("skillPath", folder);
				const normalized = normalizePath(folder);
				return normalized !== configDir && !normalized.startsWith(`${configDir}/`) &&
					folder.toLowerCase().includes(query.trim().toLowerCase());
			} catch { return false; }
		});
	}

	renderSuggestion(folder: string, el: HTMLElement): void {
		el.setText(folder || "Current vault /");
	}

	async onChooseSuggestion(folder: string): Promise<void> {
		await this.choose(folder);
	}
}

// 声明式设置（1.13.0 起）而不是 display()：只有声明出来的设置项才进得了 Obsidian
// 设置页的搜索索引，用 display() 手工画的那份对搜索是隐形的。本插件的 minAppVersion
// 就是 1.13.0，所以不保留 display() 那条向下兼容的老路——它已被官方标记废弃，且
// getSettingDefinitions 返回非空时宿主根本不会调用它。
export class MosaicSettingTab extends PluginSettingTab {
	private readonly plugin: MosaicPlugin;

	constructor(app: App, plugin: MosaicPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	getSettingDefinitions(): SettingDefinitionItem[] {
		const installer = this.plugin.guideInstaller;
		const desktop = Platform.isDesktopApp && !Platform.isMobile;
		const scope: GuideScope = desktop && installer.global ? "global" : "vault";
		const skillItems: SettingGroupItem[] = [{
			name: "Agent skills",
			aliases: desktop ? ["Current vault", "Global"] : ["Current vault"],
			desc: `Import Mosaic guidance as a skill for your agent to use when creating charts, tables and cards. ${scope === "vault" ? "Files will be saved inside the current vault." : "Global scope. Choose a destination on this device."}`,
			render: (setting) => {
				setting.setClass("mosaic-import-scope");
				setting.controlEl.setAttribute("role", "group");
				setting.controlEl.setAttribute("aria-label", "Skill import scope");
				const scopes: GuideScope[] = desktop ? ["vault", "global"] : ["vault"];
				for (const choice of scopes) {
					setting.addButton(button => {
						button.setButtonText(choice === "vault" ? "Current vault" : "Global")
							.setDisabled(installer.busy)
							.onClick(() => this.setControlValue(GLOBAL, choice === "global"));
						button.buttonEl.setAttribute("aria-pressed", String(choice === scope));
						if (choice === scope) button.setCta();
					});
				}
			},
		}];
		for (const target of ["agents", "claude"] as const) {
			let path: string;
			let unavailable = false;
			try {
				path = scope === "vault" ? guideTargetPath(target, "") : displayGlobalPath(globalGuidePath(target));
			} catch (error) {
				path = error instanceof Error ? error.message : String(error);
				unavailable = true;
			}
			skillItems.push({
				name: `.${target}`,
				aliases: [path],
				render: (setting) => {
					setting.setClass("mosaic-import-path").setClass("mod-action").setName(path);
					setting.addButton(button => button.setButtonText(`Import to .${target}`)
						.setDisabled(installer.busy || unavailable)
						.onClick(() => this.installAndRefresh(target, scope)));
				},
			});
		}
		const parent = scope === "global" ? installer.globalSkillFolder : this.plugin.settings.skillFolder;
		let displayedParent = scope === "global" && !parent ? "Choose folder" : parent;
		try { if (scope === "global" && parent) displayedParent = displayGlobalPath(parent); }
		catch { /* Keep the absolute selection visible when desktop path formatting is unavailable. */ }
		skillItems.push({
			name: "Custom folder",
			aliases: ["Skill folder", parent],
			render: (setting) => {
				setting.setClass("mosaic-import-folder").setClass("mod-action");
				this.addFolderPicker(setting, displayedParent, "Skill folder",
					() => scope === "global" ? this.chooseGlobalFolder() : this.chooseVaultFolder(SKILL_FOLDER));
				setting.addButton(button => button.setButtonText("Import to path")
					.setDisabled(installer.busy || (scope === "global" && !parent))
					.onClick(() => this.installAndRefresh("skillPath", scope)));
			},
		});
		return [
			{
				name: "Show export button",
				desc: "Add a PNG export button to the controls above each chart.",
				control: { type: "toggle", key: SHOW_EXPORT_BTN, defaultValue: DEFAULT_SETTINGS.showExportBtn },
			},
			{ type: "group", heading: "Import skill", items: skillItems },
			{
				type: "group",
				heading: "Import guides to this vault (optional)",
				items: [{
					name: "Usage guide",
					aliases: ["Guide folder", this.plugin.settings.guideFolder],
					desc: "If you prefer not to import a skill, import the same guidance as Markdown. " + CUSTOM_GUIDE_PROMPT,
					render: (setting) => {
						setting.setClass("mosaic-import-guide").setClass("mod-action");
						this.addFolderPicker(setting, this.plugin.settings.guideFolder, "Guide folder",
							() => this.chooseVaultFolder(GUIDE_FOLDER));
						setting.addButton(button => button.setButtonText("Import guides")
							.setDisabled(installer.busy)
							.onClick(() => this.installAndRefresh("custom", "vault")));
					},
				}],
			},
		];
	}

	private addFolderPicker(setting: Setting, folder: string, label: string, choose: () => void | Promise<void>): void {
		const displayedFolder = folder || "/";
		setting.addButton(button => {
			button.setButtonText(displayedFolder)
				.setTooltip(label)
				.setDisabled(this.plugin.guideInstaller.busy)
				.onClick(choose);
			button.buttonEl.classList.add("mosaic-folder-picker");
			button.buttonEl.setAttribute("aria-label", `${label}: ${displayedFolder}. Choose folder`);
			button.buttonEl.setAttribute("aria-haspopup", "dialog");
		});
	}

	private async chooseVaultFolder(key: typeof SKILL_FOLDER | typeof GUIDE_FOLDER): Promise<void> {
		if (this.plugin.guideInstaller.busy) return;
		if (!Platform.isDesktopApp || Platform.isMobile) {
			new VaultFolderModal(this.app, this.plugin.settings[key], folder => this.setControlValue(key, folder)).open();
			return;
		}
		try {
			const adapter = this.app.vault.adapter;
			if (!(adapter instanceof FileSystemAdapter)) throw new Error("The vault folder is unavailable.");
			const folder = await pickVaultFolder(adapter.getBasePath(), this.app.vault.configDir);
			if (folder !== null) await this.setControlValue(key, folder);
		} catch (error) {
			new Notice(`Could not choose a folder: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	private async installAndRefresh(target: GuideTarget, scope: GuideScope): Promise<void> {
		try {
			const install = this.plugin.guideInstaller.install(target, scope);
			this.update();
			const result = await install;
			new Notice(resultNotice(result));
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`Could not install Mosaic guidance: ${message}`);
		} finally {
			this.update();
		}
	}

	private async chooseGlobalFolder(): Promise<void> {
		if (this.plugin.guideInstaller.busy) return;
		try {
			await this.plugin.guideInstaller.chooseGlobalSkillFolder();
		} catch (error) {
			const message = error instanceof Error ? error.message : String(error);
			new Notice(`Could not choose a skill folder: ${message}`);
		} finally {
			this.update();
		}
	}

	// 基类的默认实现读写宿主自己的配置存储；本插件的设置在 plugin.settings 里，
	// 两个方向都要接管，否则开关读到的和写下去的不是同一份数据。
	getControlValue(key: string): unknown {
		if (key === SHOW_EXPORT_BTN) return this.plugin.settings.showExportBtn;
		if (key === GUIDE_FOLDER) return this.plugin.settings.guideFolder;
		if (key === SKILL_FOLDER) return this.plugin.settings.skillFolder;
		if (key === GLOBAL) return Platform.isDesktopApp && !Platform.isMobile && this.plugin.guideInstaller.global;
		return undefined;
	}

	async setControlValue(key: string, value: unknown): Promise<void> {
		if (key === GLOBAL || key === GUIDE_FOLDER || key === SKILL_FOLDER) {
			if (this.plugin.guideInstaller.busy) return;
			try {
				if (key === GLOBAL) {
					if (Platform.isDesktopApp && !Platform.isMobile) this.plugin.guideInstaller.setGlobal(Boolean(value));
				} else {
					const previous = this.plugin.settings[key];
					const folder = typeof value === "string" ? normalizePath(value) : "";
					// The native folder control uses "/" for the vault root.
					this.plugin.settings[key] = folder === "/" ? "" : folder;
					try { await this.plugin.saveSettings(); }
					catch (error) {
						this.plugin.settings[key] = previous;
						throw error;
					}
				}
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				new Notice(`Could not save import settings: ${message}`);
			} finally {
				this.update();
			}
			return;
		}
		if (key === SHOW_EXPORT_BTN) {
			this.plugin.settings.showExportBtn = Boolean(value);
			await this.plugin.saveSettings();
			// 已经渲染出来的图表读的是渲染那一刻的设置值。不重建的话，开关只对之后才
			// 打开的笔记生效，看上去就是「开了没反应」。
			this.plugin.rerenderOpenPreviews();
		}
	}
}

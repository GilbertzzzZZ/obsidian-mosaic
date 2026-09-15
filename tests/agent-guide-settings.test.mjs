import test, { mock } from "node:test";
import assert from "node:assert/strict";
import os from "node:os";
import path from "node:path";
import Module from "node:module";
import { installGlobals } from "./helpers/dom.mjs";
import { loadComponents } from "./helpers/bundle.mjs";
import { guideTargetPath } from "../src/agent-guide/core.mjs";

installGlobals();
const { MosaicPlugin, MosaicSettingTab, Notice, Platform, SuggestModal, FileSystemAdapter } = await loadComponents();
const initialSkillParent = path.join(os.tmpdir(), "mosaic-settings-skills");

function rows(tab) {
	return tab.getSettingDefinitions().flatMap((item) => item.items ?? [item]);
}

function settingRow() {
	const row = {
		buttons: [],
		toggles: [],
		setDesc(text) { this.desc = text; return this; },
		addToggle(configure) {
			const toggle = {
				toggleEl: document.createElement("div"),
				setValue(value) { this.value = value; return this; },
				setDisabled(disabled) { this.disabled = disabled; return this; },
				onChange(change) { this.change = change; return this; },
			};
			configure(toggle); this.toggles.push(toggle); return this;
		},
		settingEl: document.createElement("div"),
		controlEl: document.createElement("div"),
		setClass(name) { this.settingEl.classList.add(name); return this; },
		setName(name) { this.name = name; return this; },
		addButton(configure) {
			const button = {
				buttonEl: document.createElement("button"),
				setButtonText(text) { this.text = text; this.buttonEl.textContent = text; return this; },
				setDisabled(disabled) { this.disabled = disabled; return this; },
				setCta() { this.cta = true; return this; },
				setTooltip(text) { this.tooltip = text; return this; },
				onClick(click) { this.click = click; return this; },
			};
			configure(button);
			this.buttons.push(button);
			return this;
		},
	};
	return row;
}

function renderRow(tab, name) {
	const row = settingRow();
	const definition = rows(tab).find(item => item.name === name);
	assert.ok(definition, `Missing ${name} setting`);
	definition.render(row);
	return row;
}

function settingsPlugin() {
	const calls = [];
	const plugin = {
		app: { vault: { configDir: ".obsidian", getAllFolders: () => [{ path: "/" }, { path: "Reference" }, { path: ".obsidian" }] } },
		settings: { showExportBtn: false, guideFolder: "docs/guides", skillFolder: ".agents/skills", guideSubscriptions: {} },
		guideInstaller: {
			busy: false, global: false, globalSkillFolder: initialSkillParent,
			getResult() { return undefined; },
			enabled: {},
			getEnabled(target, scope = "vault") { return this.enabled[`${scope}:${target}`] === true; },
			setGlobal(value) { this.global = value; },
			async chooseGlobalSkillFolder() { return null; },
			async setEnabled(target, enabled, scope) {
				calls.push([target, scope]);
				this.enabled[`${scope}:${target}`] = enabled;
				return { target, scope, path: guideTargetPath(target, target === "custom" ? plugin.settings.guideFolder : plugin.settings.skillFolder), status: "installed" };
			},
		},
		async saveSettings() {},
		rerenderOpenPreviews() { this.previewRebuilds = (this.previewRebuilds ?? 0) + 1; },
	};
	const tab = new MosaicSettingTab(plugin.app, plugin);
	return { plugin, calls, tab };
}

test("fresh settings receive independent guide defaults", async () => {
	const first = new MosaicPlugin({ workspace: {} }, { version: "1.2.2" });
	const second = new MosaicPlugin({ workspace: {} }, { version: "1.2.2" });
	first.data = { showExportBtn: true };
	await first.loadSettings();
	await second.loadSettings();
	assert.equal(first.settings.showExportBtn, true);
	assert.equal(first.settings.guideFolder, "docs/guides");
	assert.equal(first.settings.skillFolder, ".agents/skills");
	assert.notEqual(first.settings.guideSubscriptions, second.settings.guideSubscriptions);
});

test("separate path rows route skill imports and keep the guide vault scoped", async () => {
	const { plugin, calls, tab } = settingsPlugin();
	assert.deepEqual(tab.getSettingDefinitions().filter(item => item.type === "group").map(item => item.heading), ["Import skill", "Import guides to this vault (optional)"]);
	for (const name of [".agents", ".claude"]) {
		const row = renderRow(tab, name);
		assert.equal(row.buttons.length, 0);
		assert.equal(row.toggles[0].value, false);
		assert.match(row.toggles[0].toggleEl.getAttribute("aria-label"), /Import and update/);
		assert.equal(row.name, `${name}/skills/mosaic/SKILL.md`);
		await row.toggles[0].change(true);
	}
	const custom = renderRow(tab, "Custom folder");
	assert.equal(custom.buttons.length, 1);
	assert.equal(custom.buttons[0].text, ".agents/skills");
	assert.equal(custom.toggles[0].value, false);
	await custom.toggles[0].change(true);
	const guide = renderRow(tab, "Usage guide");
	assert.equal(guide.buttons[0].text, "docs/guides");
	assert.equal(plugin.settings.guideFolder, "docs/guides");
	assert.equal(plugin.settings.skillFolder, ".agents/skills");
	assert.equal(guide.toggles[0].value, false);
	await guide.toggles[0].change(true);
	assert.deepEqual(calls, [["agents", "vault"], ["claude", "vault"], ["skillPath", "vault"], ["custom", "vault"]]);
	assert.equal(plugin.previewRebuilds ?? 0, 0);
	await tab.setControlValue("showExportBtn", true);
	assert.equal(plugin.previewRebuilds, 1);
});

test("scope buttons expose their selection and never import on selection", async () => {
	Platform.isDesktopApp = true;
	try {
		const { plugin, calls, tab } = settingsPlugin();
		let saves = 0;
		plugin.saveSettings = async () => { saves++; };
		let row = renderRow(tab, "Agent skills");
		assert.deepEqual(row.buttons.map(button => button.text), ["Current vault", "Global"]);
		assert.deepEqual(row.buttons.map(button => button.buttonEl.getAttribute("aria-pressed")), ["true", "false"]);
		await row.buttons[1].click();
		assert.equal(plugin.guideInstaller.global, true);
		row = renderRow(tab, "Agent skills");
		assert.deepEqual(row.buttons.map(button => button.buttonEl.getAttribute("aria-pressed")), ["false", "true"]);
		await renderRow(tab, ".agents").toggles[0].change(true);
		await renderRow(tab, ".claude").toggles[0].change(true);
		await renderRow(tab, "Custom folder").toggles[0].change(true);
		await renderRow(tab, "Usage guide").toggles[0].change(true);
		assert.deepEqual(calls, [["agents", "global"], ["claude", "global"], ["skillPath", "global"], ["custom", "vault"]]);
		await row.buttons[0].click();
		assert.equal(plugin.guideInstaller.global, false);
		assert.equal(saves, 0);
	} finally { Platform.isDesktopApp = false; }
});

test("global paths use home shorthand on POSIX and actual Windows paths", () => {
	Platform.isDesktopApp = true;
	const original = Module._load;
	try {
		const { plugin, tab } = settingsPlugin();
		plugin.guideInstaller.global = true;
		mock.method(os, "homedir", () => "/home/example");
		plugin.guideInstaller.globalSkillFolder = "/home/example/custom";
		assert.equal(renderRow(tab, ".agents").name, "~/.agents/skills/mosaic/SKILL.md");
		assert.equal(renderRow(tab, "Custom folder").buttons[0].text, "~/custom");
		plugin.guideInstaller.globalSkillFolder = "/home/example-other/custom";
		assert.equal(renderRow(tab, "Custom folder").buttons[0].text, "/home/example-other/custom");
		mock.method(os, "homedir", () => "C:\\Users\\Example");
		mock.method(Module, "_load", function(name, ...args) {
			return name === "path" ? path.win32 : original.call(this, name, ...args);
		});
		plugin.guideInstaller.globalSkillFolder = "D:\\Skills";
		assert.equal(renderRow(tab, ".agents").name, "C:\\Users\\Example\\.agents\\skills\\mosaic\\SKILL.md");
		assert.equal(renderRow(tab, "Custom folder").buttons[0].text, "D:\\Skills");
	} finally { mock.restoreAll(); Platform.isDesktopApp = false; }
});

test("mobile vault folder selection opens a vault-root list without writing", async () => {
	const { plugin, calls, tab } = settingsPlugin();
	let saves = 0;
	plugin.saveSettings = async () => { saves++; };
	await renderRow(tab, "Custom folder").buttons[0].click();
	const picker = SuggestModal.lastOpened;
	assert.ok(picker);
	assert.equal(picker.app, plugin.app);
	assert.equal(picker.getSuggestions("")[0], "");
	assert.ok(picker.getSuggestions("").includes(".agents/skills"));
	assert.deepEqual(picker.getSuggestions("../outside"), []);
	assert.deepEqual(picker.getSuggestions(".obsidian"), []);
	assert.deepEqual(calls, []);
	assert.equal(saves, 0);
	assert.equal(picker.onChooseSuggestion("Reference"), undefined);
	await new Promise(resolve => setImmediate(resolve));
	assert.equal(plugin.settings.skillFolder, "Reference");
	assert.equal(renderRow(tab, "Custom folder").buttons[0].text, "Reference");
	await renderRow(tab, "Usage guide").buttons[0].click();
	assert.equal(SuggestModal.lastOpened.onChooseSuggestion(""), undefined);
	await new Promise(resolve => setImmediate(resolve));
	assert.equal(plugin.settings.guideFolder, "");
	assert.equal(renderRow(tab, "Usage guide").buttons[0].text, "/");
	assert.equal(guideTargetPath("custom", plugin.settings.guideFolder), "Mosaic-Usage-Guide.md");
	assert.equal(saves, 2);
	assert.deepEqual(calls, []);
});

test("desktop vault path fields use the native directory dialog and save relative selections", async () => {
	Platform.isDesktopApp = true;
	const original = Module._load;
	try {
		const { plugin, calls, tab } = settingsPlugin();
		const root = path.join(os.tmpdir(), "test-vault");
		plugin.app.vault.adapter = new FileSystemAdapter(root);
		let selected = path.join(root, "Reference");
		let saves = 0;
		plugin.saveSettings = async () => { saves++; };
		mock.method(Module, "_load", function(name, ...args) {
			if (name === "@electron/remote") return { dialog: { async showOpenDialog(options) {
				assert.equal(options.defaultPath, root);
				assert.ok(options.properties.includes("openDirectory"));
				assert.ok(!options.properties.includes("openFile"));
				return { canceled: selected === null, filePaths: selected === null ? [] : [selected] };
			} } };
			return original.call(this, name, ...args);
		});
		for (const [name, key] of [["Custom folder", "skillFolder"], ["Usage guide", "guideFolder"]]) {
			await renderRow(tab, name).buttons[0].click();
			assert.equal(plugin.settings[key], "Reference");
		}
		selected = null;
		await renderRow(tab, "Usage guide").buttons[0].click();
		assert.equal(saves, 2);
		assert.equal(plugin.settings.guideFolder, "Reference");
		selected = root;
		await renderRow(tab, "Usage guide").buttons[0].click();
		assert.equal(plugin.settings.guideFolder, "");
		assert.equal(saves, 3);
		assert.deepEqual(calls, []);
	} finally { mock.restoreAll(); Platform.isDesktopApp = false; }
});

test("native vault selections reject outside and configuration directories without saving", async () => {
	Platform.isDesktopApp = true;
	const original = Module._load;
	try {
		const { plugin, tab } = settingsPlugin();
		const root = path.join(os.tmpdir(), "test-vault");
		plugin.app.vault.adapter = new FileSystemAdapter(root);
		plugin.app.vault.configDir = ".config";
		let selected;
		let saves = 0;
		plugin.saveSettings = async () => { saves++; };
		mock.method(Module, "_load", function(name, ...args) {
			if (name === "@electron/remote") return { dialog: { async showOpenDialog() {
				return { canceled: false, filePaths: [selected] };
			} } };
			return original.call(this, name, ...args);
		});
		for (selected of [path.dirname(root), `${root}-other`, path.join(root, ".config"), path.join(root, ".config/plugins")]) {
			Notice.messages.length = 0;
			await renderRow(tab, "Usage guide").buttons[0].click();
			assert.equal(plugin.settings.guideFolder, "docs/guides");
			assert.match(Notice.messages.at(-1), /folder|directory/i);
		}
		assert.equal(saves, 0);
	} finally { mock.restoreAll(); Platform.isDesktopApp = false; }
});

test("global folder selection and cancellation never import", async () => {
	Platform.isDesktopApp = true;
	try {
		const { plugin, calls, tab } = settingsPlugin();
		plugin.guideInstaller.global = true;
		await renderRow(tab, "Custom folder").buttons[0].click();
		assert.equal(plugin.guideInstaller.globalSkillFolder, initialSkillParent);
		plugin.guideInstaller.chooseGlobalSkillFolder = async function() { this.globalSkillFolder = path.join(os.tmpdir(), "chosen"); };
		await renderRow(tab, "Custom folder").buttons[0].click();
		assert.equal(renderRow(tab, "Custom folder").buttons[0].text, path.join(os.tmpdir(), "chosen"));
		assert.deepEqual(calls, []);
	} finally { Platform.isDesktopApp = false; }
});

test("Windows vault picker handles separators, case and drive boundaries", async () => {
	Platform.isDesktopApp = true;
	const original = Module._load;
	try {
		const { plugin, tab } = settingsPlugin();
		plugin.app.vault.adapter = new FileSystemAdapter("C:\\Vault");
		let selected = "c:\\vault\\Reference\\guides";
		mock.method(Module, "_load", function(name, ...args) {
			if (name === "path") return path.win32;
			if (name === "@electron/remote") return { dialog: { async showOpenDialog() {
				return { canceled: false, filePaths: [selected] };
			} } };
			return original.call(this, name, ...args);
		});
		await renderRow(tab, "Usage guide").buttons[0].click();
		assert.equal(plugin.settings.guideFolder, "Reference/guides");
		for (selected of ["D:\\Other", "C:\\Vault-other", "c:\\vault\\.OBSIDIAN\\plugins"]) {
			Notice.messages.length = 0;
			await renderRow(tab, "Usage guide").buttons[0].click();
			assert.equal(plugin.settings.guideFolder, "Reference/guides");
			assert.match(Notice.messages.at(-1), /folder|directory/i);
		}
	} finally { mock.restoreAll(); Platform.isDesktopApp = false; }
});

test("an unavailable global destination never displays the vault root or enables import", () => {
	Platform.isDesktopApp = true;
	const original = Module._load;
	try {
		const { plugin, tab } = settingsPlugin();
		plugin.guideInstaller.global = true;
		plugin.guideInstaller.globalSkillFolder = "";
		mock.method(Module, "_load", function(name, ...args) {
			if (name === "path") throw new Error("Desktop paths unavailable");
			return original.call(this, name, ...args);
		});
		const row = renderRow(tab, "Custom folder");
		assert.equal(row.buttons[0].text, "Choose folder");
		assert.equal(row.toggles[0].disabled, true);
		assert.equal(renderRow(tab, ".agents").toggles[0].disabled, true);
		assert.equal(renderRow(tab, "Usage guide").toggles[0].disabled, false);
	} finally { mock.restoreAll(); Platform.isDesktopApp = false; }
});

test("mobile and desktop mobile emulation never access global state", async () => {
	for (const desktop of [false, true]) {
		Platform.isDesktopApp = desktop;
		Platform.isMobile = true;
		try {
			const { plugin, calls, tab } = settingsPlugin();
			Object.defineProperty(plugin.guideInstaller, "global", { get() { throw new Error("desktop state read"); } });
			plugin.guideInstaller.setGlobal = () => { throw new Error("desktop state written"); };
			assert.deepEqual(renderRow(tab, "Agent skills").buttons.map(button => button.text), ["Current vault"]);
			for (const name of ["Custom folder", "Usage guide"]) {
				SuggestModal.lastOpened = null;
				await renderRow(tab, name).buttons[0].click();
				assert.equal(SuggestModal.lastOpened?.app, plugin.app);
			}
			await tab.setControlValue("global", true);
			for (const name of [".agents", ".claude", "Custom folder", "Usage guide"]) await renderRow(tab, name).toggles[0].change(true);
			assert.deepEqual(calls, [["agents", "vault"], ["claude", "vault"], ["skillPath", "vault"], ["custom", "vault"]]);
		} finally { Platform.isDesktopApp = false; Platform.isMobile = false; }
	}
});

test("busy disables scope, folders and import toggles, not the export toggle", async () => {
	Platform.isDesktopApp = true;
	try {
		const { plugin, calls, tab } = settingsPlugin();
		plugin.guideInstaller.busy = true;
		for (const scope of [false, true]) {
			plugin.guideInstaller.global = scope;
			for (const item of rows(tab)) {
				if (item.render) {
					const row = renderRow(tab, item.name);
					assert.ok(row.buttons.every(button => button.disabled));
					assert.ok(row.toggles.every(toggle => toggle.disabled));
				}
				if (item.control) assert.ok(!item.control.disabled);
			}
		}
		await tab.setControlValue("skillFolder", "Ignored");
		await tab.setControlValue("guideFolder", "Ignored");
		await tab.setControlValue("global", false);
		assert.equal(plugin.settings.skillFolder, ".agents/skills");
		assert.equal(plugin.settings.guideFolder, "docs/guides");
		assert.equal(plugin.guideInstaller.global, true);
		assert.deepEqual(calls, []);
	} finally { Platform.isDesktopApp = false; }
});

test("root choices persist and failed saves restore the previous folder", async () => {
	const { plugin, tab } = settingsPlugin();
	for (const key of ["guideFolder", "skillFolder"]) {
		await tab.setControlValue(key, "/");
		assert.equal(tab.getControlValue(key), "");
	}
	Notice.messages.length = 0;
	plugin.saveSettings = async () => { throw new Error("Settings unavailable"); };
	await tab.setControlValue("guideFolder", "Reference");
	assert.equal(plugin.settings.guideFolder, "");
	assert.match(Notice.messages.at(-1), /Settings unavailable/);
});

test("failed installs and folder selections produce readable notices", async () => {
	Notice.messages.length = 0;
	const { plugin, tab } = settingsPlugin();
	plugin.guideInstaller.setEnabled = async () => { throw new Error("vault unavailable"); };
	await assert.doesNotReject(renderRow(tab, ".agents").toggles[0].change(true));
	assert.equal(tab.updateCalls, 2);
	assert.match(Notice.messages.at(-1), /vault unavailable/);
	plugin.guideInstaller.setEnabled = async () => ({ target: "agents", scope: "vault", path: ".agents/skills/mosaic/SKILL.md", status: "error", message: "permission denied" });
	await renderRow(tab, ".agents").toggles[0].change(true);
	assert.match(Notice.messages.at(-1), /Current vault.*permission denied/);
	Platform.isDesktopApp = true;
	try {
		plugin.guideInstaller.global = true;
		plugin.guideInstaller.chooseGlobalSkillFolder = async () => { throw new Error("picker unavailable"); };
		await assert.doesNotReject(renderRow(tab, "Custom folder").buttons[0].click());
		assert.match(Notice.messages.at(-1), /picker unavailable/);
		plugin.guideInstaller.setGlobal = () => { throw new Error("local storage unavailable"); };
		await tab.setControlValue("global", false);
		assert.match(Notice.messages.at(-1), /local storage unavailable/);
	} finally { Platform.isDesktopApp = false; }
});

function pluginApp(layoutCallbacks, writes) {
	return {
		workspace: {
			onLayoutReady(callback) {
				layoutCallbacks.push(callback);
			},
			on() {
				return {};
			},
			iterateAllLeaves() {},
		},
		vault: {
			configDir: ".obsidian",
			adapter: {},
			getFolderByPath() {
				return null;
			},
			getFileByPath() {
				return null;
			},
			async create(path) {
				writes.push(path);
			},
		},
	};
}

test("plugin lifecycle defers one guide check, preserves registrations, and disposes the captured service", async () => {
	const layoutCallbacks = [];
	const writes = [];
	const plugin = new MosaicPlugin(
		pluginApp(layoutCallbacks, writes),
		{ version: "1.1.6" },
	);
	plugin.data = { showExportBtn: false };

	await plugin.onload();

	assert.deepEqual(
		plugin.codeBlockProcessors.map(({ language }) => language).sort(),
		["chart", "chartview", "datatable", "decisionbox", "flowdiagram", "metricgrid", "timeline"],
	);
	assert.equal(plugin.postProcessors.length, 1);
	assert.equal(plugin.settingTabs.length, 1);
	assert.equal(layoutCallbacks.length, 1);

	const firstInstaller = plugin.guideInstaller;
	let firstChecks = 0;
	const firstUpdate = firstInstaller.updateInstalled.bind(firstInstaller);
	firstInstaller.updateInstalled = async () => {
		firstChecks++;
		await firstUpdate();
	};
	assert.equal(firstChecks, 0);
	layoutCallbacks[0]();
	await Promise.resolve();
	assert.equal(firstChecks, 1);

	plugin.onunload();
	const afterUnload = await firstInstaller.setEnabled("custom", true);
	assert.equal(afterUnload.status, "error");
	assert.deepEqual(writes, []);

	await plugin.onload();
	const secondInstaller = plugin.guideInstaller;
	let secondChecks = 0;
	const secondUpdate = secondInstaller.updateInstalled.bind(secondInstaller);
	secondInstaller.updateInstalled = async () => {
		secondChecks++;
		await secondUpdate();
	};
	layoutCallbacks[0]();
	await Promise.resolve();
	assert.equal(firstChecks, 2);
	assert.equal(secondChecks, 0);
	layoutCallbacks[1]();
	await Promise.resolve();
	assert.equal(secondChecks, 1);
});

test("enabled custom folders are locked in UI and in the save handler", async () => {
 const { plugin, tab } = settingsPlugin();
 for (const [target, name, key] of [["skillPath", "Custom folder", "skillFolder"], ["custom", "Usage guide", "guideFolder"]]) {
  plugin.guideInstaller.enabled[`vault:${target}`] = true;
  const before = plugin.settings[key];
  assert.equal(renderRow(tab, name).buttons[0].disabled, true);
  await tab.setControlValue(key, "Other");
  assert.equal(plugin.settings[key], before);
  assert.equal(renderRow(tab, name).toggles[0].value, true);
 }
});

test("suggestion override returns void and reports asynchronous save failure once", async () => {
 const { plugin, tab } = settingsPlugin();
 Notice.messages.length = 0;
 plugin.saveSettings = async () => { throw new Error("Storage full"); };
 await renderRow(tab, "Custom folder").buttons[0].click();
 assert.equal(SuggestModal.lastOpened.onChooseSuggestion("Reference"), undefined);
 await new Promise(resolve => setImmediate(resolve));
 assert.equal(Notice.messages.length, 1);
 assert.match(Notice.messages[0], /Storage full/);
 assert.equal(plugin.settings.skillFolder, ".agents/skills");
});

test("failed enabled writes remain visibly on with an error description", async () => {
 const { plugin, tab } = settingsPlugin();
 plugin.guideInstaller.enabled["vault:agents"] = true;
 plugin.guideInstaller.getResult = () => ({ status: "error", message: "Disk full", path: ".agents/skills/mosaic/SKILL.md" });
 const row = renderRow(tab, ".agents");
 assert.equal(row.toggles[0].value, true);
 assert.match(row.desc, /Disk full/);
});

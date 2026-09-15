import test, { mock } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile, mkdir, rm, symlink, readdir } from "node:fs/promises";
import os from "node:os";
import { join, dirname } from "node:path";
import Module, { createRequire } from "node:module";
import { installGlobals } from "./helpers/dom.mjs";
import { loadComponents } from "./helpers/bundle.mjs";
import { renderGuide } from "../src/agent-guide/core.mjs";

installGlobals();
const components = await loadComponents();
const { GuideInstaller } = components;
const require = createRequire(import.meta.url);

function subscription(installer, target, scope) {
 return scope === "vault" ? installer.host.settings.guideSubscriptions[target] : installer.local.subscriptions[target];
}

async function fixture(t, { desktop = true, mobileUI = !desktop, saved = null, saveFailure = false } = {}) {
	const root = await mkdtemp(join(os.tmpdir(), "mosaic-guide-"));
	t.after(() => rm(root, { recursive: true, force: true }));
	// Host facilities are external; filesystem operations below remain real.
	if (components.Platform) components.Platform.isDesktopApp = desktop;
	components.Platform.isMobile = mobileUI;
	mock.method(os, "homedir", () => root);
	t.after(() => {
		mock.restoreAll();
		components.Platform.isDesktopApp = false;
		components.Platform.isMobile = false;
	});
	let local = saved;
	const host = {
		app: {
			vault: { configDir: ".obsidian" },
			loadLocalStorage(key) { assert.equal(key, "mosaic:guide-subscriptions"); return structuredClone(local); },
			saveLocalStorage(key, value) {
				assert.equal(key, "mosaic:guide-subscriptions");
				if (saveFailure) throw new Error("Local storage unavailable");
				local = structuredClone(value);
			},
		},
		manifest: { version: "1.1.6" },
		settings: { guideFolder: "docs/guides", skillFolder: ".agents/skills", guideSubscriptions: {} },
		async saveSettings() { throw new Error("Global data must not enter plugin settings"); },
	};
	return { root, host, installer: new GuideInstaller(host, "# Guide"), saved: () => local };
}

test("fresh desktop load and selecting global create no files", async (t) => {
	const { root, installer, saved } = await fixture(t);
	assert.equal(installer.global, false);
	await installer.updateInstalled();
	installer.setGlobal(true);
	assert.equal(installer.global, true);
	assert.deepEqual(await readdir(root), []);
	assert.equal(saved().global, true);
});

test("global folders reject control characters without rejecting Unicode or spaces", async (t) => {
	const { root, installer } = await fixture(t);
	const folder = join(root, "Café notes");
	installer.setGlobalSkillFolder(folder);
	for (const code of [...Array(32).keys(), 127]) {
		assert.throws(() => installer.setGlobalSkillFolder(join(root, `folder${String.fromCharCode(code)}`)), /absolute directory/);
		assert.equal(installer.globalSkillFolder, folder);
	}
	installer.setGlobal(true);
	const result = await installer.setEnabled("skillPath", true, "global");
	assert.equal(result.status, "installed");
	assert.equal(result.path, join(folder, "mosaic/SKILL.md"));
	assert.match(await readFile(result.path, "utf8"), /# Guide/);
});

test("global skills use runtime home, stay device-local and do not share vault results", async (t) => {
	const { root, host, installer, saved } = await fixture(t);
	const denied = await installer.setEnabled("agents", true, "global");
	assert.equal(denied.status, "error");
	installer.setGlobal(true);
	const result = await installer.setEnabled("agents", true, "global");
	assert.equal(result.status, "installed");
	assert.equal(result.scope, "global");
	assert.equal(result.path, join(root, ".agents/skills/mosaic/SKILL.md"));
	assert.match(await readFile(result.path, "utf8"), /# Guide/);
	assert.equal((await installer.setEnabled("agents", true, "global")).status, "installed");
	assert.deepEqual(host.settings.guideSubscriptions, {});
	assert.equal(JSON.stringify(host.settings).includes(root), false);
	assert.equal(saved().subscriptions.agents.path, result.path);
	assert.equal(installer.results.agents, undefined);
	assert.equal(subscription(installer, "agents", "vault"), undefined);
	assert.equal(installer.getResult("agents", "global").status, "installed");
	assert.equal((await installer.setEnabled("custom", true, "global")).status, "error");
});

for (const target of ["agents", "claude", "skillPath"]) {
 test(`global ${target} overwrites edits, recreates missing files, and stops when off`, async t => {
  const { installer, host, root, saved } = await fixture(t);
  installer.setGlobal(true);
  if (target === "skillPath") installer.setGlobalSkillFolder(join(root, "custom"));
  const { path } = await installer.setEnabled(target, true, "global");
  await writeFile(path, "# Personal edit");
  const reloaded = new GuideInstaller(host, "# New");
  assert.equal(reloaded.getEnabled(target, "global"), true);
  host.manifest.version = "1.1.7";
  await reloaded.updateInstalled();
  assert.equal(await readFile(path, "utf8"), renderGuide("# New", "1.1.7"));
  await rm(path);
  host.manifest.version = "1.1.8";
  await reloaded.updateInstalled();
  assert.equal(await readFile(path, "utf8"), renderGuide("# New", "1.1.8"));
  assert.equal((await reloaded.setEnabled(target, false, "global")).status, "disabled");
  await writeFile(path, "# Retained");
  host.manifest.version = "1.1.9";
  await new GuideInstaller(host, "# Later").updateInstalled();
  assert.equal(await readFile(path, "utf8"), "# Retained");
  assert.equal(saved().subscriptions[target].enabled, false);
  await reloaded.setEnabled(target, true, "global");
  assert.equal(await readFile(path, "utf8"), renderGuide("# New", "1.1.9"));
 });
}

test("mobile never loads desktop modules or device-local global records", async (t) => {
	const { host } = await fixture(t, { desktop: false });
	host.app.loadLocalStorage = () => { throw new Error("Mobile local storage access"); };
	const original = Module._load;
	mock.method(Module, "_load", function (name, ...args) {
		if (["fs", "os", "path", "@electron/remote"].includes(name)) throw new Error("Desktop module loaded on mobile");
		return original.call(this, name, ...args);
	});
	const installer = new GuideInstaller(host, "# Guide");
	assert.equal(installer.global, false);
	await installer.updateInstalled();
	assert.equal((await installer.setEnabled("agents", true, "global")).status, "error");
	assert.equal(subscription(installer, "agents", "global"), undefined);
	assert.throws(() => installer.setGlobal(true), /desktop/i);
});

test("desktop mobile emulation skips global state and unavailable Node facilities", async (t) => {
	const { host } = await fixture(t, { desktop: true, mobileUI: true });
	let storageReads = 0;
	let storageWrites = 0;
	let desktopLoads = 0;
	host.app.loadLocalStorage = () => {
		storageReads++;
		return { global: true, subscriptions: {} };
	};
	host.app.saveLocalStorage = () => { storageWrites++; };
	const original = Module._load;
	mock.method(Module, "_load", function (name, ...args) {
		if (["fs", "os", "path", "crypto", "@electron/remote"].includes(name)) {
			desktopLoads++;
			return null;
		}
		return original.call(this, name, ...args);
	});
	const installer = new GuideInstaller(host, "# Guide");
	assert.equal(installer.global, false);
	assert.equal(installer.globalSkillFolder, "");
	await installer.updateInstalled();
	assert.equal(subscription(installer, "agents", "global"), undefined);
	assert.equal((await installer.setEnabled("agents", true, "global")).status, "error");
	assert.throws(() => installer.setGlobal(true), /desktop/i);
	await assert.rejects(installer.chooseGlobalSkillFolder(), /desktop/i);
	assert.equal(storageReads, 0);
	assert.equal(storageWrites, 0);
	assert.equal(desktopLoads, 0);
});

test("native picker cancellation does not change selection or records", async (t) => {
	const { installer, host, saved } = await fixture(t);
	host.app.vault.adapter = new components.FileSystemAdapter(join(os.tmpdir(), "test-vault"));
	const original = Module._load;
	mock.method(Module, "_load", function (name, ...args) {
		if (name === "@electron/remote") return { dialog: { async showOpenDialog(options) {
			assert.deepEqual(options.properties, ["openDirectory", "createDirectory"]);
			assert.equal(options.defaultPath, join(os.tmpdir(), "test-vault"));
			return { canceled: true, filePaths: [] };
		} } };
		return original.call(this, name, ...args);
	});
	const before = installer.globalSkillFolder;
	assert.equal(await installer.chooseGlobalSkillFolder(), null);
	assert.equal(installer.globalSkillFolder, before);
	assert.equal(saved(), null);
});

test("global final-file symlinks are refused even when bytes match", async (t) => {
	const { root, installer } = await fixture(t);
	installer.setGlobal(true);
	const outside = join(root, "personal.md");
	const path = join(root, ".agents/skills/mosaic/SKILL.md");
	await writeFile(outside, renderGuide("# Guide", "1.1.6"));
	await mkdir(dirname(path), { recursive: true });
	await symlink(outside, path);
	assert.equal((await installer.setEnabled("agents", true, "global")).status, "error");
	assert.equal(subscription(installer, "agents", "global").enabled, true);
	assert.equal(subscription(installer, "agents", "global").appliedPluginVersion, undefined);
	assert.equal(await readFile(outside, "utf8"), renderGuide("# Guide", "1.1.6"));
});

test("a failed desktop replacement preserves old bytes and its subscription state", async (t) => {
	const { installer, host } = await fixture(t);
	installer.setGlobal(true);
	const { path } = await installer.setEnabled("agents", true, "global");
	const before = await readFile(path, "utf8");
	const record = subscription(installer, "agents", "global");
	host.manifest.version = "1.1.7";
	mock.method(require("fs").promises, "rename", async () => { throw new Error("Write denied"); });
	await installer.updateInstalled();
	assert.equal(installer.getResult("agents", "global").status, "error");
	assert.equal(await readFile(path, "utf8"), before);
	assert.deepEqual(subscription(installer, "agents", "global"), record);
	assert.deepEqual(await readdir(dirname(path)), ["SKILL.md"]);
});

test("global custom folder locks while on, and scope selection does not stop updates", async t => {
 const { root, installer, host } = await fixture(t);
 installer.setGlobal(true);
 installer.setGlobalSkillFolder(join(root, "first"));
 const first = await installer.setEnabled("skillPath", true, "global");
 assert.throws(() => installer.setGlobalSkillFolder(join(root, "next")), /Turn off/);
 installer.setGlobal(false);
 host.manifest.version = "1.1.7";
 await new GuideInstaller(host, "# New").updateInstalled();
 assert.equal(await readFile(first.path, "utf8"), renderGuide("# New", "1.1.7"));
 installer.setGlobal(true);
 await installer.setEnabled("skillPath", false, "global");
 installer.setGlobalSkillFolder(join(root, "next"));
 await installer.setEnabled("skillPath", true, "global");
 host.manifest.version = "1.1.8";
 await installer.updateInstalled();
 assert.equal(await readFile(first.path, "utf8"), renderGuide("# New", "1.1.7"));
 assert.equal(await readFile(join(root, "next/mosaic/SKILL.md"), "utf8"), renderGuide("# Guide", "1.1.8"));
});

test("local storage save failure preserves selection and subscription state", async (t) => {
	const { root, installer, host, saved } = await fixture(t);
	installer.setGlobal(true);
	const first = await installer.setEnabled("agents", true, "global");
	const record = subscription(installer, "agents", "global");
	const previous = saved();
	host.app.saveLocalStorage = () => { throw new Error("Local storage unavailable"); };
	assert.throws(() => installer.setGlobal(false), /Local storage unavailable/);
	assert.equal(installer.global, true);
	assert.throws(() => installer.setGlobalSkillFolder(join(root, "other")), /Turn off/);
	assert.equal(installer.globalSkillFolder, join(root, ".agents/skills"));
	host.manifest.version = "1.1.7";
	await installer.updateInstalled();
	assert.equal(installer.getResult("agents", "global").status, "error");
	assert.deepEqual(subscription(installer, "agents", "global"), record);
	assert.deepEqual(saved(), previous);
	assert.match(await readFile(first.path, "utf8"), /1\.1\.7/);
});

test("local storage read failure is visible without breaking vault installer construction", async (t) => {
	const { host } = await fixture(t);
	host.app.loadLocalStorage = () => { throw new Error("Local storage unavailable"); };
	const installer = new GuideInstaller(host, "# Guide");
	assert.equal(installer.global, false);
	await installer.updateInstalled();
	const result = await installer.setEnabled("agents", true, "global");
	assert.equal(result.status, "error");
	assert.match(result.message, /Local storage unavailable|Select Global/);
	assert.deepEqual(host.settings.guideSubscriptions, {});
});

test("malformed global records never authorize arbitrary file paths", async (t) => {
	const { root, host } = await fixture(t);
	const record = { enabled: true, appliedPluginVersion: "1.1.5" };
	const outside = join(root, "personal.md");
	await writeFile(outside, "old");
	host.app.loadLocalStorage = () => ({ global: true, subscriptions: {
		agents: { ...record, path: outside },
		claude: { ...record, path: join(root, "other/.claude/skills/mosaic/SKILL.md") },
		skillPath: { ...record, path: `${root}/skills/../mosaic/SKILL.md` },
		custom: { ...record, path: outside },
	} });
	const installer = new GuideInstaller(host, "# Guide");
	await installer.updateInstalled();
	for (const target of ["agents", "claude", "skillPath", "custom"]) assert.equal(subscription(installer, target, "global"), undefined);
	assert.equal(await readFile(outside, "utf8"), "old");
});

test("disabled and same-version global subscriptions perform no filesystem operations", async t => {
 const { installer, host } = await fixture(t);
 installer.setGlobal(true);
 await installer.setEnabled("agents", true, "global");
 const fs = require("fs").promises;
 for (const method of ["lstat", "open", "mkdir", "rename", "readFile"]) mock.method(fs, method, async () => { throw new Error("Unexpected filesystem access"); });
 await installer.updateInstalled();
 assert.notEqual(installer.getResult("agents", "global").status, "error");
 await installer.setEnabled("agents", false, "global");
 host.manifest.version = "1.1.7";
 await installer.updateInstalled();
 assert.equal(installer.getResult("agents", "global").status, "disabled");
});

test("explicit global imports replace matching files and later edits", async (t) => {
	const { root, installer } = await fixture(t);
	const path = join(root, ".claude/skills/mosaic/SKILL.md");
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, renderGuide("# Guide", "1.1.6"));
	installer.setGlobal(true);
	assert.equal((await installer.setEnabled("claude", true, "global")).status, "installed");
	await writeFile(path, "# User edit");
	assert.equal((await installer.setEnabled("claude", true, "global")).status, "installed");
	assert.equal(await readFile(path, "utf8"), renderGuide("# Guide", "1.1.6"));
	assert.equal(subscription(installer, "claude", "global").path, path);
});

test("global enrollment failure prevents any file write", async t => {
 const { root, installer, host } = await fixture(t);
 installer.setGlobal(true);
 host.app.saveLocalStorage = () => { throw new Error("Save failed"); };
 assert.equal((await installer.setEnabled("agents", true, "global")).status, "error");
 assert.equal(installer.getEnabled("agents", "global"), false);
 assert.deepEqual(await readdir(root), []);
});

test("desktop replacement overwrites edits without reading existing guidance", async (t) => {
	const { installer, host } = await fixture(t);
	installer.setGlobal(true);
	const { path } = await installer.setEnabled("agents", true, "global");
	const fs = require("fs").promises;
	const original = fs.open;
	mock.method(fs, "open", async (openedPath, ...args) => {
		const handle = await original(openedPath, ...args);
		if (openedPath.endsWith(".tmp")) {
			const close = handle.close.bind(handle);
			handle.close = async () => { await close(); await writeFile(path, "# Edited while updating"); };
		}
		return handle;
	});
	host.manifest.version = "1.1.7";
	await installer.updateInstalled();
	assert.equal(installer.getResult("agents", "global").status, "installed");
	assert.equal(await readFile(path, "utf8"), renderGuide("# Guide", "1.1.7"));
	assert.equal(subscription(installer, "agents", "global").appliedPluginVersion, "1.1.7");
});

test("an incomplete temporary write never damages an existing global file", async (t) => {
	const { installer, host } = await fixture(t);
	installer.setGlobal(true);
	const { path } = await installer.setEnabled("agents", true, "global");
	const originalBytes = await readFile(path, "utf8");
	const fs = require("fs").promises;
	const original = fs.open;
	mock.method(fs, "open", async (openedPath, ...args) => {
		const handle = await original(openedPath, ...args);
		if (openedPath.endsWith(".tmp")) handle.writeFile = async () => { await handle.write("partial"); throw new Error("Disk full"); };
		return handle;
	});
	host.manifest.version = "1.1.7";
	await installer.updateInstalled();
	assert.equal(installer.getResult("agents", "global").status, "error");
	assert.equal(await readFile(path, "utf8"), originalBytes);
	assert.equal(subscription(installer, "agents", "global").appliedPluginVersion, "1.1.6");
	assert.deepEqual(await readdir(dirname(path)), ["SKILL.md"]);
});

test("one busy flag and unload guard protect a pending global import", async (t) => {
	const { installer, root } = await fixture(t);
	installer.setGlobal(true);
	const fs = require("fs").promises;
	const original = fs.mkdir;
	let start, resume;
	const started = new Promise((resolve) => { start = resolve; });
	const paused = new Promise((resolve) => { resume = resolve; });
	mock.method(fs, "mkdir", async (...args) => { start(); await paused; return original(...args); });
	const pending = installer.setEnabled("agents", true, "global");
	await started;
	assert.equal((await installer.setEnabled("claude", true, "global")).status, "busy");
	assert.equal((await installer.setEnabled("agents", true, "vault")).status, "busy");
	installer.dispose();
	resume();
	assert.equal((await pending).status, "error");
	assert.equal(installer.busy, false);
	assert.equal(subscription(installer, "agents", "global").enabled, true);
	await assert.rejects(readFile(join(root, ".agents/skills/mosaic/SKILL.md")), { code: "ENOENT" });
});

test("absent native picker reports an English error and leaves selection unchanged", async (t) => {
	const { installer, saved } = await fixture(t);
	const original = Module._load;
	mock.method(Module, "_load", function (name, ...args) {
		if (name === "@electron/remote") throw new Error("Module unavailable");
		return original.call(this, name, ...args);
	});
	await assert.rejects(installer.chooseGlobalSkillFolder(), /Could not open the desktop folder picker.*Module unavailable/);
	assert.equal(saved(), null);
});

test("invalid saved folder does not prevent another recorded global target from updating", async (t) => {
	const { root, host } = await fixture(t);
	const path = join(root, ".agents/skills/mosaic/SKILL.md");
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, "old");
	host.app.loadLocalStorage = () => ({ global: true, skillFolder: "../invalid", subscriptions: {
		agents: { path, enabled: true, appliedPluginVersion: "1.1.5" },
	} });
	const installer = new GuideInstaller(host, "# Guide");
	await installer.updateInstalled();
	assert.equal(installer.getResult("agents", "global").status, "installed");
	assert.equal(installer.globalSkillFolder, join(root, ".agents/skills"));
});

test("successful native selection persists only the next custom skill parent", async (t) => {
	const { installer, root, saved } = await fixture(t);
	const selected = join(root, "selected");
	const original = Module._load;
	mock.method(Module, "_load", function (name, ...args) {
		if (name === "@electron/remote") return { dialog: { async showOpenDialog() {
			return { canceled: false, filePaths: [selected] };
		} } };
		return original.call(this, name, ...args);
	});
	assert.equal(await installer.chooseGlobalSkillFolder(), selected);
	assert.equal(installer.globalSkillFolder, selected);
	assert.deepEqual(saved().subscriptions, {});
	assert.deepEqual(await readdir(root), []);
	installer.setGlobal(true);
	assert.equal((await installer.setEnabled("skillPath", true, "global")).path, join(selected, "mosaic/SKILL.md"));
});

test("missing desktop modules remain an operation error instead of a load failure", async (t) => {
	const { host } = await fixture(t);
	const original = Module._load;
	mock.method(Module, "_load", function (name, ...args) {
		if (["fs", "os", "path", "crypto"].includes(name)) throw new Error("Desktop capability unavailable");
		return original.call(this, name, ...args);
	});
	const installer = new GuideInstaller(host, "# Guide");
	await installer.updateInstalled();
	installer.setGlobal(true);
	const result = await installer.setEnabled("agents", true, "global");
	assert.equal(result.status, "error");
	assert.match(result.message, /Desktop capability unavailable/);
	assert.equal(subscription(installer, "agents", "global"), undefined);
});

test("default global custom skill shares enrollment and Windows aliases are case-insensitive", async t => {
 const { installer, saved } = await fixture(t);
 installer.setGlobal(true);
 await installer.setEnabled("skillPath", true, "global");
 assert.equal(installer.getEnabled("agents", "global"), true);
 assert.deepEqual(Object.keys(saved().subscriptions), ["agents"]);
 await installer.setEnabled("skillPath", false, "global");
 assert.equal(installer.getEnabled("agents", "global"), false);
 const original = Module._load;
 const win32 = require("path").win32;
 mock.method(os, "homedir", () => "C:\\Users\\Example");
 mock.method(Module, "_load", function(name, ...args) { return name === "path" ? win32 : original.call(this, name, ...args); });
 installer.local.skillFolder = "c:/users/example/.AGENTS/skills";
 installer.local.subscriptions = { agents: { path: "C:\\Users\\Example\\.agents\\skills\\mosaic\\SKILL.md", enabled: true } };
 assert.equal(installer.getEnabled("skillPath", "global"), true);
});

test("global write failure persists enabled pending for retry on reload", async t => {
 const { installer, host, saved } = await fixture(t);
 installer.setGlobal(true);
 const fs = require("fs").promises;
 const denied = mock.method(fs, "rename", async () => { throw new Error("Write denied"); });
 const result = await installer.setEnabled("claude", true, "global");
 assert.equal(result.status, "error");
 assert.deepEqual(saved().subscriptions.claude, { path: result.path, enabled: true });
 denied.mock.restore();
 await new GuideInstaller(host, "# Retry").updateInstalled();
 assert.equal(await readFile(result.path, "utf8"), renderGuide("# Retry", "1.1.6"));
});

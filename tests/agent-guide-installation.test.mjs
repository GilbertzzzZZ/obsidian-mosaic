import test from "node:test";
import assert from "node:assert/strict";
import { installGlobals } from "./helpers/dom.mjs";
import { loadComponents } from "./helpers/bundle.mjs";
import { renderGuide } from "../src/agent-guide/core.mjs";

installGlobals();
const { GuideInstaller, TFile } = await loadComponents();

function createHost({
	version = "1.1.6",
	guideFolder = "docs/guides",
	skillFolder = ".agents/skills",
	guideSubscriptions = {},
	initialFiles = {},
	initialFolders = [],
	configDir = ".obsidian",
	processFailure,
	beforeProcess,
	beforeWrite,
	saveFailure,
	beforeRead,
} = {}) {
	const files = new Map(Object.entries(initialFiles));
	const folders = new Set(["", ...initialFolders]);
	const stats = {
		fileReads: 0,
		fileWrites: 0,
		settingsSaves: 0,
		vaultCreates: 0,
		vaultProcesses: 0,
		adapterWrites: 0,
		adapterProcesses: 0,
	};
	const parent = (path) => path.split("/").slice(0, -1).join("/");
	const fileAt = (path) =>
		files.has(path) ? Object.assign(new TFile(), { path }) : null;
	const adapter = {
		async stat(path) {
			stats.fileReads++;
			const type = files.has(path)
				? "file"
				: folders.has(path)
					? "folder"
					: null;
			return type ? { type, size: 0, ctime: 0, mtime: 0 } : null;
		},
		async read(path) {
			stats.fileReads++;
			if (beforeRead) await beforeRead(path);
			if (!files.has(path)) throw new Error("File not found");
			return files.get(path);
		},
		async mkdir(path) {
			assert.ok(folders.has(parent(path)), `missing parent for ${path}`);
			folders.add(path);
		},
		async write(path, value) {
			if (!folders.has(parent(path))) throw new Error("Parent not found");
			if (beforeWrite) await beforeWrite(path);
			files.set(path, value);
			stats.fileWrites++;
			stats.adapterWrites++;
		},
		async process(path, fn) {
			stats.adapterProcesses++;
			if (processFailure?.(path)) throw new Error(`Cannot process ${path}`);
			if (beforeProcess) await beforeProcess(path, files);
			const next = fn(await this.read(path));
			await this.write(path, next);
			return next;
		},
	};
	const vault = {
		adapter,
		configDir,
		getFileByPath: fileAt,
		getFolderByPath: (path) => (folders.has(path) ? { path } : null),
		getRoot: () => ({ path: "" }),
		read: (file) => adapter.read(file.path),
		async process(file, fn) {
			stats.vaultProcesses++;
			if (processFailure?.(file.path)) throw new Error(`Cannot process ${file.path}`);
			if (beforeProcess) await beforeProcess(file.path, files);
			const next = fn(await adapter.read(file.path));
			files.set(file.path, next);
			stats.fileWrites++;
			return next;
		},
		async createFolder(path) {
			assert.ok(folders.has(parent(path)), `missing parent for ${path}`);
			folders.add(path);
		},
		async create(path, value) {
			stats.vaultCreates++;
			if (files.has(path) || folders.has(path)) throw new Error("Path exists");
			if (!folders.has(parent(path))) throw new Error("Parent not found");
			files.set(path, value);
			stats.fileWrites++;
			return fileAt(path);
		},
	};
	const settings = { showExportBtn: true, guideFolder, skillFolder, guideSubscriptions };
	const host = {
		app: { vault },
		manifest: { version },
		settings,
		async saveSettings() {
			stats.settingsSaves++;
			if (typeof saveFailure === "function" ? saveFailure(stats.settingsSaves) : saveFailure) throw new Error("Settings unavailable");
		},
	};
	return { files, folders, host, settings, stats };
}


test("fresh defaults perform no destination I/O", async () => {
 const { host, stats } = createHost();
 const installer = new GuideInstaller(host, "# Guide");
 for (const target of ["agents", "claude", "skillPath", "custom"]) assert.equal(installer.getEnabled(target), false);
 await installer.updateInstalled();
 assert.equal(stats.fileReads, 0);
 assert.equal(stats.fileWrites, 0);
 assert.equal(stats.settingsSaves, 0);
});

for (const target of ["agents", "claude", "skillPath", "custom"]) {
 test(`${target}: enable, update edited file, disable, re-enable and reload`, async () => {
  const { host, files, stats } = createHost({ skillFolder: "skills" });
  let installer = new GuideInstaller(host, "# Original");
  const first = await installer.setEnabled(target, true);
  assert.equal(first.status, "installed");
  assert.equal(installer.getEnabled(target), true);
  assert.deepEqual(host.settings.guideSubscriptions[target], { path: first.path, enabled: true, appliedPluginVersion: "1.1.6" });
  files.set(first.path, "# User edit");
  const unchanged = { ...stats };
  await installer.updateInstalled();
  assert.deepEqual(stats, unchanged);
  host.manifest.version = "1.1.7";
  installer = new GuideInstaller(host, "# Updated");
  await installer.updateInstalled();
  assert.equal(files.get(first.path), renderGuide("# Updated", "1.1.7"));
  files.set(first.path, "# Keep while off");
  const reads = stats.fileReads, writes = stats.fileWrites;
  assert.equal((await installer.setEnabled(target, false)).status, "disabled");
  assert.equal(stats.fileReads, reads);
  assert.equal(stats.fileWrites, writes);
  host.manifest.version = "1.1.8";
  installer = new GuideInstaller(host, "# Later");
  assert.equal(installer.getEnabled(target), false);
  await installer.updateInstalled();
  assert.equal(stats.fileReads, reads);
  assert.equal(stats.fileWrites, writes);
  assert.equal(files.get(first.path), "# Keep while off");
  assert.equal((await installer.setEnabled(target, true)).status, "updated");
  assert.equal(files.get(first.path), renderGuide("# Later", "1.1.8"));
 });
}

test("enabled deleted files are recreated on the next version, not the same version", async () => {
 const { host, files, stats } = createHost();
 const installer = new GuideInstaller(host, "# Guide");
 const { path } = await installer.setEnabled("claude", true);
 files.set("renamed.md", files.get(path));
 files.delete(path);
 const writes = stats.fileWrites;
 await installer.updateInstalled();
 assert.equal(stats.fileWrites, writes);
 host.manifest.version = "1.1.5";
 await installer.updateInstalled();
 assert.equal(files.get(path), renderGuide("# Guide", "1.1.5"));
 assert.equal(files.get("renamed.md"), renderGuide("# Guide", "1.1.6"));
});

test("custom standard aliases share one record, toggle state and automatic write", async () => {
 const { host, stats } = createHost();
 const installer = new GuideInstaller(host, "# Guide");
 await installer.setEnabled("skillPath", true);
 assert.equal(installer.getEnabled("agents"), true);
 assert.deepEqual(Object.keys(host.settings.guideSubscriptions), ["agents"]);
 assert.equal(installer.getResult("skillPath").status, "installed");
 host.manifest.version = "1.1.7";
 const writes = stats.fileWrites;
 await installer.updateInstalled();
 assert.equal(stats.fileWrites, writes + 1);
 await installer.setEnabled("agents", false);
 assert.equal(installer.getEnabled("skillPath"), false);
 host.settings.skillFolder = ".claude\\skills//.";
 await installer.setEnabled("skillPath", true);
 assert.equal(installer.getEnabled("claude"), true);
 await installer.setEnabled("skillPath", false);
 assert.equal(installer.getEnabled("claude"), false);
});

test("separate custom destination moves only after disabling and leaves the old file", async () => {
 const { host, files } = createHost({ skillFolder: "first" });
 const installer = new GuideInstaller(host, "# Guide");
 const { path } = await installer.setEnabled("skillPath", true);
 await installer.setEnabled("agents", true);
 await installer.setEnabled("skillPath", false);
 host.settings.skillFolder = "second";
 await installer.setEnabled("skillPath", true);
 host.manifest.version = "1.1.7";
 await installer.updateInstalled();
 assert.equal(files.get(path), renderGuide("# Guide", "1.1.6"));
 assert.equal(files.get("second/mosaic/SKILL.md"), renderGuide("# Guide", "1.1.7"));
 assert.equal(installer.getEnabled("agents"), true);
});

test("state persistence failure leaves destinations and in-memory state untouched", async () => {
 const { host, files, stats } = createHost({ saveFailure: true });
 const installer = new GuideInstaller(host, "# Guide");
 assert.equal((await installer.setEnabled("agents", true)).status, "error");
 assert.equal(installer.getEnabled("agents"), false);
 assert.equal(stats.fileReads, 0);
 assert.equal(files.size, 0);
});

test("failed disable restores enabled state without touching the file", async () => {
 const { host, stats } = createHost({ saveFailure: count => count === 3 });
 const installer = new GuideInstaller(host, "# Guide");
 await installer.setEnabled("agents", true);
 const writes = stats.fileWrites;
 assert.equal((await installer.setEnabled("agents", false)).status, "error");
 assert.equal(installer.getEnabled("agents"), true);
 assert.equal(stats.fileWrites, writes);
});

test("file failure leaves enabled pending and retries on reload", async () => {
 let fail = true;
 const { host, files } = createHost({ beforeWrite: () => { if (fail) throw new Error("Disk full"); } });
 const installer = new GuideInstaller(host, "# Guide");
 assert.equal((await installer.setEnabled("agents", true)).status, "error");
 assert.equal(installer.getEnabled("agents"), true);
 assert.equal(host.settings.guideSubscriptions.agents.appliedPluginVersion, undefined);
 assert.equal(files.size, 0);
 fail = false;
 await new GuideInstaller(host, "# Guide").updateInstalled();
 assert.equal(host.settings.guideSubscriptions.agents.appliedPluginVersion, "1.1.6");
});

test("failed success acknowledgement retains pending instead of claiming success", async () => {
 const { host, files } = createHost({ saveFailure: count => count === 2 });
 const installer = new GuideInstaller(host, "# Guide");
 const result = await installer.setEnabled("agents", true);
 assert.equal(result.status, "error");
 assert.equal(files.get(result.path), renderGuide("# Guide", "1.1.6"));
 assert.equal(host.settings.guideSubscriptions.agents.appliedPluginVersion, undefined);
 await new GuideInstaller(host, "# Guide").updateInstalled();
 assert.equal(host.settings.guideSubscriptions.agents.appliedPluginVersion, "1.1.6");
});

test("automatic failures do not prevent other enabled destinations from updating", async () => {
 let fail = false;
 const { host, files } = createHost({ processFailure: path => fail && path.startsWith(".agents/") });
 const installer = new GuideInstaller(host, "# Guide");
 await installer.setEnabled("agents", true);
 const { path } = await installer.setEnabled("custom", true);
 fail = true;
 host.manifest.version = "1.1.7";
 await installer.updateInstalled();
 assert.equal(installer.getResult("agents").status, "error");
 assert.equal(files.get(path), renderGuide("# Guide", "1.1.7"));
});

test("invalid paths and vault config destinations never write", async () => {
 for (const folder of ["../outside", "/absolute", ".obsidian/skills", "C:\\skills"]) {
  const { host, stats } = createHost({ skillFolder: folder });
  const installer = new GuideInstaller(host, "# Guide");
  assert.equal((await installer.setEnabled("skillPath", true)).status, "error", folder);
  assert.equal(stats.fileWrites, 0);
  assert.equal(stats.settingsSaves, 0);
 }
});

test("malformed new subscriptions are ignored, root guide is valid", async () => {
 const { host, files } = createHost({ guideFolder: "", guideSubscriptions: {
  agents: { path: "../bad", enabled: true },
  claude: { path: ".claude/skills/mosaic/SKILL.md", enabled: "true" },
  custom: { path: "Mosaic-Usage-Guide.md", enabled: true },
 } });
 const installer = new GuideInstaller(host, "# Guide");
 await installer.updateInstalled();
 assert.deepEqual(Object.keys(host.settings.guideSubscriptions), ["custom"]);
 assert.ok(files.has("Mosaic-Usage-Guide.md"));
});

test("vault overwrites edits made inside the process callback boundary", async () => {
 const { host, files, stats } = createHost({ beforeProcess: (path, files) => files.set(path, "# New edit") });
 const installer = new GuideInstaller(host, "# Guide");
 const result = await installer.setEnabled("custom", true);
 await installer.setEnabled("custom", false);
 await installer.setEnabled("custom", true);
 assert.equal(files.get(result.path), renderGuide("# Guide", "1.1.6"));
 assert.equal(stats.vaultProcesses, 1);
});

test("busy and disposed installers reject further writes", async () => {
 let resume;
 const { host, stats } = createHost();
 host.saveSettings = () => new Promise(resolve => { resume = resolve; });
 const installer = new GuideInstaller(host, "# Guide");
 const pending = installer.setEnabled("agents", true);
 assert.equal((await installer.setEnabled("claude", true)).status, "busy");
 installer.dispose();
 resume();
 assert.equal((await pending).status, "error");
 assert.equal(stats.fileWrites, 0);
 assert.equal((await installer.setEnabled("agents", true)).status, "error");
});

test("unload during process prevents replacement and successful version acknowledgement", async () => {
 let installer;
 const { host, files } = createHost({ beforeProcess: () => installer.dispose() });
 installer = new GuideInstaller(host, "# Guide");
 const result = await installer.setEnabled("custom", true);
 host.manifest.version = "1.1.7";
 await installer.updateInstalled();
 assert.equal(files.get(result.path), renderGuide("# Guide", "1.1.6"));
 assert.equal(host.settings.guideSubscriptions.custom.appliedPluginVersion, "1.1.6");
});

test("a destination or parent folder collision reports failure and retains pending", async () => {
 for (const opts of [
  { initialFolders: [".agents/skills/mosaic/SKILL.md"] },
  { initialFiles: { ".agents": "not a directory" } },
 ]) {
  const { host, stats } = createHost(opts);
  const installer = new GuideInstaller(host, "# Guide");
  assert.equal((await installer.setEnabled("agents", true)).status, "error");
  assert.equal(stats.fileWrites, 0);
  assert.equal(installer.getEnabled("agents"), true);
 }
});

import { App, FileSystemAdapter, normalizePath, Platform, TFile } from "obsidian";
import {
	absoluteFolder, globalGuidePath, globalSkillParent,
	pickDesktopFolder, sameGlobalPath, validGlobalPath, writeDesktopFile,
} from "./desktop";
import {
	shouldUpdateGuide,
	guideTargetPath,
	renderGuide,
} from "./core.mjs";

export type GuideScope = "vault" | "global";
export type GuideTarget = "agents" | "claude" | "skillPath" | "custom";
export type GuideSubscription = { path: string; enabled: boolean; appliedPluginVersion?: string };
export type GuideSubscriptions = Partial<Record<GuideTarget, GuideSubscription>>;
export type GuideStatus =
	| "installed"
	| "updated"
	| "disabled"
	| "busy"
	| "error";
export type GuideResult = {
	target: GuideTarget;
	scope: GuideScope;
	path: string;
	status: GuideStatus;
	message?: string;
};

export interface GuideHost {
	app: App;
	manifest: { version: string };
	settings: {
		guideFolder: string;
		skillFolder: string;
		guideSubscriptions: GuideSubscriptions;
	};
	saveSettings(): Promise<void>;
}

type PathState = { exists: boolean; file: TFile | null };

const TARGETS: GuideTarget[] = ["agents", "claude", "skillPath", "custom"];
const SKILL_TARGETS: GuideTarget[] = ["agents", "claude", "skillPath"];
const LOCAL_KEY = "mosaic:guide-subscriptions";
type LocalState = { "global": boolean; skillFolder?: string; subscriptions: GuideSubscriptions };
class GuideDisposedError extends Error {}

function validRecord(target: GuideTarget, value: unknown, scope: GuideScope = "vault"): GuideSubscription | null {
	if (!value || typeof value !== "object") return null;
	const candidate = value as Partial<GuideSubscription>;
	if (typeof candidate.path !== "string" || typeof candidate.enabled !== "boolean" ||
		(candidate.appliedPluginVersion !== undefined && typeof candidate.appliedPluginVersion !== "string")) return null;
	try {
		if (scope === "global") {
			if (!validGlobalPath(target, candidate.path)) return null;
		} else if (target === "custom" || target === "skillPath") {
			const suffix = target === "skillPath" ? "mosaic/SKILL.md" : "Mosaic-Usage-Guide.md";
			const folder =
				candidate.path === suffix
					? ""
					: candidate.path.endsWith(`/${suffix}`)
						? candidate.path.slice(0, -(suffix.length + 1))
						: null;
			if (folder === null || guideTargetPath(target, folder) !== candidate.path) {
				return null;
			}
		} else if (guideTargetPath(target, "") !== candidate.path) {
			return null;
		}
	} catch {
		return null;
	}
	return {
		path: candidate.path,
		enabled: candidate.enabled,
		...(candidate.appliedPluginVersion === undefined ? {} : { appliedPluginVersion: candidate.appliedPluginVersion }),
	};
}

export class GuideInstaller {
	busy = false;
	results: Partial<Record<GuideTarget, GuideResult>> = {};

	private disposed = false;
	private readonly host: GuideHost;
	private readonly body: string;
	private local: LocalState = { global: false, subscriptions: {} };
	private localError: string | undefined;
	private globalResults: Partial<Record<GuideTarget, GuideResult>> = {};

	constructor(host: GuideHost, body: string) {
		this.host = host;
		this.body = body;

		const source = host.settings.guideSubscriptions;
		const subscriptions: GuideSubscriptions = {};
		if (source && typeof source === "object") {
			for (const target of TARGETS) {
				const record = validRecord(target, source[target]);
				if (record) subscriptions[target] = record;
			}
		}
		host.settings.guideSubscriptions = this.deduplicate(subscriptions, "vault");
		if (Platform.isDesktopApp && !Platform.isMobile) {
			try {
				const saved = host.app.loadLocalStorage(LOCAL_KEY) as Partial<LocalState> | null;
				if (saved && typeof saved === "object") {
					this.local.global = saved.global === true;
					if (typeof saved.skillFolder === "string") {
						try { this.local.skillFolder = absoluteFolder(saved.skillFolder); }
						catch (error) {
							this.remember({ target: "skillPath", scope: "global", path: "", status: "error",
								message: error instanceof Error ? error.message : String(error) });
						}
					}
					for (const target of SKILL_TARGETS) {
						const record = validRecord(target, saved.subscriptions?.[target], "global");
						if (record) this.local.subscriptions[target] = record;
					}
					this.local.subscriptions = this.deduplicate(this.local.subscriptions, "global");
				}
			} catch (error) {
				this.localError = error instanceof Error ? error.message : String(error);
				this.local = { global: false, subscriptions: {} };
				for (const target of SKILL_TARGETS) this.remember({ target, scope: "global", path: "", status: "error", message: this.localError });
			}
		}
	}

	get "global"(): boolean { return Platform.isDesktopApp && !Platform.isMobile && this.local.global; }

	get globalSkillFolder(): string {
		if (!Platform.isDesktopApp || Platform.isMobile) return "";
		try { return this.local.skillFolder ?? globalSkillParent(); }
		catch { return ""; }
	}

	private subscriptions(scope: GuideScope): GuideSubscriptions {
		return scope === "vault" ? this.host.settings.guideSubscriptions : this.local.subscriptions;
	}

	private destination(target: GuideTarget, scope: GuideScope): string {
		if (scope === "global") {
			this.assertGlobal();
			return globalGuidePath(target, this.local.skillFolder);
		}
		return this.hostPath(guideTargetPath(target, target === "custom" ? this.host.settings.guideFolder :
			target === "skillPath" ? this.host.settings.skillFolder : ""));
	}

	private canonical(target: GuideTarget, path: string, scope: GuideScope): GuideTarget {
		if (target !== "skillPath") return target;
		for (const standard of ["agents", "claude"] as const) {
			const standardPath = scope === "vault" ? guideTargetPath(standard, "") : globalGuidePath(standard);
			if (scope === "vault" ? path === standardPath : sameGlobalPath(path, standardPath)) return standard;
		}
		return target;
	}

	private deduplicate(source: GuideSubscriptions, scope: GuideScope): GuideSubscriptions {
		const custom = source.skillPath;
		if (custom) {
			const target = this.canonical("skillPath", custom.path, scope);
			if (target !== "skillPath") {
				source[target] ??= { ...custom, path: scope === "vault" ? guideTargetPath(target, "") : globalGuidePath(target) };
				delete source.skillPath;
			}
		}
		return source;
	}

	getEnabled(target: GuideTarget, scope: GuideScope = "vault"): boolean {
		try {
			return this.subscriptions(scope)[this.canonical(target, this.destination(target, scope), scope)]?.enabled === true;
		} catch { return false; }
	}

	getResult(target: GuideTarget, scope: GuideScope = "vault"): GuideResult | undefined {
		try { target = this.canonical(target, this.destination(target, scope), scope); }
		catch { /* An unavailable destination can still have a useful failure result. */ }
		return (scope === "vault" ? this.results : this.globalResults)[target];
	}

	setGlobal(enabled: boolean): void {
		this.assertGlobal();
		this.saveLocal({ ...this.local, global: enabled });
	}

	setGlobalSkillFolder(folder: string): void {
		this.assertGlobal();
		if (this.busy || this.getEnabled("skillPath", "global")) throw new Error("Turn off the custom skill destination before changing its folder.");
		this.saveLocal({ ...this.local, skillFolder: absoluteFolder(folder) });
	}

	async chooseGlobalSkillFolder(): Promise<string | null> {
		this.assertGlobal();
		const adapter = this.host.app.vault.adapter;
		const folder = await pickDesktopFolder(adapter instanceof FileSystemAdapter ? adapter.getBasePath() : undefined);
		this.assertActive();
		if (folder !== null) this.setGlobalSkillFolder(folder);
		return folder;
	}

	async setEnabled(target: GuideTarget, enabled: boolean, scope: GuideScope = "vault"): Promise<GuideResult> {
		let path = "";
		if (this.busy) return this.remember({ target, scope, path, status: "busy" });
		try {
			this.assertActive();
			if (scope === "global" && !this.global) throw new Error("Select Global before changing a global skill.");
			path = this.destination(target, scope);
			target = this.canonical(target, path, scope);
			// Standard aliases always persist the standard spelling on Windows.
			if (target === "agents" || target === "claude") path = this.destination(target, scope);
			this.busy = true;
			await this.saveRecord(target, scope, { path, enabled });
			this.assertActive();
			if (!enabled) return this.remember({ target, scope, path, status: "disabled" });
			return await this.runTarget(target, scope, path);
		} catch (error) {
			return this.failure(target, scope, path, error);
		} finally {
			this.busy = false;
		}
	}

	async updateInstalled(): Promise<void> {
		if (this.busy || this.disposed) return;
		const scopes: GuideScope[] = Platform.isDesktopApp && !Platform.isMobile ? ["vault", "global"] : ["vault"];
		this.busy = true;
		try {
			for (const scope of scopes) {
				for (const target of TARGETS) {
					if (this.disposed) return;
					const record = this.subscriptions(scope)[target];
					if (record && shouldUpdateGuide(record, this.host.manifest.version)) {
						await this.runTarget(target, scope, record.path);
					}
				}
			}
		} finally {
			this.busy = false;
		}
	}

	dispose(): void { this.disposed = true; }

	private failure(target: GuideTarget, scope: GuideScope, path: string, error: unknown): GuideResult {
		return this.remember({ target, scope, path, status: "error",
			message: error instanceof Error ? error.message : String(error) });
	}

	private async runTarget(target: GuideTarget, scope: GuideScope, rawPath: string): Promise<GuideResult> {
		const version = this.host.manifest.version;
		const desired = renderGuide(this.body, version);
		try {
			this.assertActive();
			if (!validRecord(target, { path: rawPath, enabled: true }, scope)) throw new Error("Invalid guidance destination.");
			const path = scope === "vault" ? this.hostPath(rawPath) : rawPath;
			let existed = false;
			if (scope === "global") {
				this.assertGlobal();
				await writeDesktopFile(path, desired, () => this.assertActive());
			} else {
				const hidden = path.split("/").some(part => part.startsWith("."));
				const state = await this.inspectPath(path, hidden);
				this.assertActive();
				existed = state.exists;
				if (state.exists) await this.updateFile(path, hidden, state, desired);
				else await this.createFile(path, hidden, desired);
			}
			this.assertActive();
			await this.saveRecord(target, scope, { path, enabled: true, appliedPluginVersion: version });
			return this.remember({ target, scope, path, status: existed ? "updated" : "installed" });
		} catch (error) {
			return this.failure(target, scope, rawPath, error);
		}
	}

	private hostPath(path: string): string {
		const normalized = normalizePath(path);
		const configDir = normalizePath(this.host.app.vault.configDir);
		if (normalized === configDir || normalized.startsWith(`${configDir}/`)) {
			throw new Error("Guide destination must be outside the vault config directory.");
		}
		return normalized;
	}

	private async inspectPath(path: string, hidden: boolean): Promise<PathState> {
		if (hidden) {
			const stat = await this.host.app.vault.adapter.stat(path);
			this.assertActive();
			if (!stat) return { exists: false, file: null };
			if (stat.type !== "file") throw new Error(`Guide destination is a folder: ${path}`);
			return { exists: true, file: null };
		}
		if (this.host.app.vault.getFolderByPath(path)) {
			throw new Error(`Guide destination is a folder: ${path}`);
		}
		const file = this.host.app.vault.getFileByPath(path);
		if (!file) return { exists: false, file: null };
		return { exists: true, file };
	}

	private async createFile(path: string, hidden: boolean, desired: string): Promise<void> {
		await this.ensureParents(path, hidden);
		this.assertActive();
		if (hidden) {
			await this.host.app.vault.adapter.write(path, desired);
		} else {
			await this.host.app.vault.create(path, desired);
		}
	}

	private async updateFile(
		path: string,
		hidden: boolean,
		state: PathState,
		desired: string,
	): Promise<void> {
		this.assertActive();
		const replace = (): string => {
			this.assertActive();
			return desired;
		};
		if (hidden) {
			await this.host.app.vault.adapter.process(path, replace);
		} else if (state.file) {
			await this.host.app.vault.process(state.file, replace);
		}
	}

	private async ensureParents(path: string, hidden: boolean): Promise<void> {
		const parts = path.split("/").slice(0, -1);
		let parent = "";
		for (const part of parts) {
			parent = parent ? `${parent}/${part}` : part;
			if (hidden) {
				const stat = await this.host.app.vault.adapter.stat(parent);
				this.assertActive();
				if (stat?.type === "file") throw new Error(`Guide parent is a file: ${parent}`);
				if (!stat) {
					await this.host.app.vault.adapter.mkdir(parent);
				}
			} else {
				if (this.host.app.vault.getFileByPath(parent)) {
					throw new Error(`Guide parent is a file: ${parent}`);
				}
				if (!this.host.app.vault.getFolderByPath(parent)) {
					this.assertActive();
					await this.host.app.vault.createFolder(parent);
				}
			}
		}
	}

	private async saveRecord(target: GuideTarget, scope: GuideScope, record: GuideSubscription): Promise<void> {
		if (scope === "global") {
			this.saveLocal({ ...this.local, subscriptions: { ...this.local.subscriptions, [target]: record } });
			return;
		}
		const previous = this.host.settings.guideSubscriptions;
		this.host.settings.guideSubscriptions = { ...previous, [target]: record };
		try {
			await this.host.saveSettings();
		} catch (error) {
			this.host.settings.guideSubscriptions = previous;
			throw error;
		}
	}

	private assertActive(): void {
		if (this.disposed) throw new GuideDisposedError("Guide installer is no longer active.");
	}

	private assertGlobal(): void {
		this.assertActive();
		if (!Platform.isDesktopApp || Platform.isMobile) throw new Error("Global imports require the desktop app.");
		if (this.localError) throw new Error(`Device-local settings unavailable: ${this.localError}`);
	}

	private saveLocal(next: LocalState): void {
		this.assertGlobal();
		this.host.app.saveLocalStorage(LOCAL_KEY, next);
		this.local = next;
	}

	private remember(result: GuideResult): GuideResult {
		(result.scope === "vault" ? this.results : this.globalResults)[result.target] = result;
		return result;
	}
}

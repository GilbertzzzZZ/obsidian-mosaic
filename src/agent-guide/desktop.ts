/// <reference types="node" />
import { Platform } from "obsidian";
import type { GuideTarget } from "./installer";
import { guideTargetPath } from "./core.mjs";

function desktopOnly(): void {
	if (!Platform.isDesktopApp || Platform.isMobile) throw new Error("Global imports require the desktop app.");
}

function paths(): typeof import("path") {
	if (!Platform.isDesktop) throw new Error("Global imports require the desktop app.");
	desktopOnly();
	// eslint-disable-next-line @typescript-eslint/no-require-imports -- Synchronous path validation must stay lazy and desktop-only.
	return require("path") as typeof import("path");
}

export function globalSkillParent(): string {
	if (!Platform.isDesktop) throw new Error("Global imports require the desktop app.");
	const path = paths();
	// eslint-disable-next-line @typescript-eslint/no-require-imports -- Settings read the default directory synchronously after the desktop guard.
	const os = require("os") as typeof import("os");
	return path.join(absoluteFolder(os.homedir()), ".agents", "skills");
}

export function absoluteFolder(folder: string): string {
	const path = paths();
	const hasControlCharacter = Array.from(folder).some((character) => {
		const code = character.charCodeAt(0);
		return code < 32 || code === 127;
	});
	if (!folder || hasControlCharacter || !path.isAbsolute(folder)) {
		throw new Error("Global skill folder must be an absolute directory path.");
	}
	return path.normalize(folder);
}

export function globalGuidePath(target: GuideTarget, folder?: string): string {
	if (!Platform.isDesktop) throw new Error("Global imports require the desktop app.");
	const path = paths();
	if (target === "custom") throw new Error("Usage guides can only be imported into the current vault.");
	if (target === "skillPath") return path.join(absoluteFolder(folder ?? globalSkillParent()), "mosaic", "SKILL.md");
	// eslint-disable-next-line @typescript-eslint/no-require-imports -- Recorded destinations are validated synchronously after the desktop guard.
	const os = require("os") as typeof import("os");
	return path.join(absoluteFolder(os.homedir()), guideTargetPath(target, ""));
}

export function validGlobalPath(target: GuideTarget, value: string): boolean {
	const path = paths();
	if (target === "custom") return false;
	if (target !== "skillPath") return value === globalGuidePath(target);
	try {
		return absoluteFolder(value) === value &&
			path.basename(value) === "SKILL.md" &&
			path.basename(path.dirname(value)) === "mosaic" &&
			globalGuidePath(target, path.dirname(path.dirname(value))) === value;
	} catch {
		return false;
	}
}

export function displayGlobalPath(value: string): string {
	const path = paths();
	if (path.sep === "\\") return value;
	const home = path.dirname(path.dirname(globalSkillParent()));
	if (value === home) return "~";
	const prefix = home.endsWith("/") ? home : `${home}/`;
	return value.startsWith(prefix) ? `~/${value.slice(prefix.length)}` : value;
}

export async function pickDesktopFolder(defaultPath?: string): Promise<string | null> {
	if (!Platform.isDesktop) throw new Error("Global imports require the desktop app.");
	desktopOnly();
	try {
		const remote = await import("@electron/remote");
		const result = await remote.dialog.showOpenDialog({ defaultPath, properties: ["openDirectory", "createDirectory"] });
		return result.canceled || !result.filePaths[0] ? null : absoluteFolder(result.filePaths[0]);
	} catch (error) {
		throw new Error(`Could not open the desktop folder picker: ${error instanceof Error ? error.message : String(error)}`);
	}
}

export async function pickVaultFolder(basePath: string, configDir: string): Promise<string | null> {
	const path = paths();
	const base = absoluteFolder(basePath);
	const selected = await pickDesktopFolder(base);
	if (selected === null) return null;
	const relative = path.relative(base, selected);
	if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
		throw new Error("Choose a folder inside the current vault.");
	}
	const fromConfig = path.relative(path.join(base, configDir), selected);
	if (!fromConfig || (fromConfig !== ".." && !fromConfig.startsWith(`..${path.sep}`) && !path.isAbsolute(fromConfig))) {
		throw new Error("Choose a folder outside the vault configuration directory.");
	}
	return relative.split(path.sep).join("/");
}

/** Compare normalized paths using the current desktop platform's casing rules. */
export function sameGlobalPath(left: string, right: string): boolean {
 const path = paths();
 const a = path.normalize(left);
 const b = path.normalize(right);
 return path.sep === "\\" ? a.toLowerCase() === b.toLowerCase() : a === b;
}

export async function writeDesktopFile(
	path: string,
	desired: string,
	assertActive: () => void,
): Promise<void> {
	if (!Platform.isDesktop) throw new Error("Global imports require the desktop app.");
	desktopOnly();
	const fs = await import("fs");
	const pathModule = paths();
	const crypto = await import("crypto");
	assertActive();
	await fs.promises.mkdir(pathModule.dirname(path), { recursive: true });
	assertActive();
	const temporary = `${path}.${crypto.randomBytes(12).toString("hex")}.tmp`;
	const file = await fs.promises.open(temporary, "wx", 0o600);
	try {
		try {
			await file.writeFile(desired, "utf8");
			await file.sync();
		} finally { await file.close(); }
		assertActive();
		let stat;
		try { stat = await fs.promises.lstat(path); }
		catch (error) {
			if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
		}
		if (stat?.isSymbolicLink()) throw new Error(`Guide destination is a symbolic link: ${path}`);
		if (stat && !stat.isFile()) throw new Error(`Guide destination is not a regular file: ${path}`);
		assertActive();
		await fs.promises.rename(temporary, path);
	} finally {
		await fs.promises.unlink(temporary).catch((error: NodeJS.ErrnoException) => {
			if (error.code !== "ENOENT") throw error;
		});
	}
}

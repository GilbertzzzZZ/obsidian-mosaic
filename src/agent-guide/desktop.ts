/// <reference types="node" />
import { Platform } from "obsidian";
import type { GuideTarget } from "./installer";
import { guideTargetPath } from "./core.mjs";

export class DesktopConflictError extends Error {}

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

export async function pickGlobalSkillFolder(defaultPath?: string): Promise<string | null> {
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

export async function readDesktopFile(path: string): Promise<{ exists: boolean; content: string | null }> {
	if (!Platform.isDesktop) throw new Error("Global imports require the desktop app.");
	desktopOnly();
	const fs = await import("fs");
	let stat;
	try { stat = await fs.promises.lstat(path); }
	catch (error) {
		if ((error as NodeJS.ErrnoException).code === "ENOENT") return { exists: false, content: null };
		throw error;
	}
	if (stat.isSymbolicLink()) throw new Error(`Guide destination is a symbolic link: ${path}`);
	if (!stat.isFile()) throw new Error(`Guide destination is not a regular file: ${path}`);
	const file = await fs.promises.open(path, fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0));
	try {
		const opened = await file.stat();
		if (!opened.isFile() || stat.ino !== opened.ino || stat.dev !== opened.dev) throw new DesktopConflictError();
		return { exists: true, content: await file.readFile("utf8") };
	} finally { await file.close(); }
}

export async function writeDesktopFile(
	path: string,
	expected: string | null,
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
		if (expected === null) {
			// Linking a completed sibling is exclusive: a newly appeared file wins.
			try { await fs.promises.link(temporary, path); }
			catch (error) {
				if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new DesktopConflictError();
				throw error;
			}
		} else {
			const current = await readDesktopFile(path);
			assertActive();
			if (!current.exists || current.content !== expected) throw new DesktopConflictError();
			await fs.promises.rename(temporary, path);
		}
	} finally {
		await fs.promises.unlink(temporary).catch((error: NodeJS.ErrnoException) => {
			if (error.code !== "ENOENT") throw error;
		});
	}
}

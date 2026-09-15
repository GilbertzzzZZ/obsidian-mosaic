/** @typedef {"agents" | "claude" | "skillPath" | "custom"} GuideTarget */

/**
 * @param {GuideTarget} target
 * @param {string} folder
 * @returns {string}
 */
export function guideTargetPath(target, folder) {
	if (target === "agents") return ".agents/skills/mosaic/SKILL.md";
	if (target === "claude") return ".claude/skills/mosaic/SKILL.md";
	if (target === "custom" || target === "skillPath") {
		const source = String(folder ?? "").trim();
		if (
			/^[\\/]/.test(source) ||
			/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(source) ||
			/^~/.test(source) ||
			/[\u0000-\u001f\u007f]/.test(source)
		) {
			throw new Error("Guide folder must be a vault-relative path.");
		}
		const parts = source.replaceAll("\\", "/").split("/");
		if (parts.includes("..")) {
			throw new Error("Guide folder must be a vault-relative path.");
		}
		const prefix = parts.filter((part) => part && part !== ".").join("/");
		const suffix = target === "skillPath" ? "mosaic/SKILL.md" : "Mosaic-Usage-Guide.md";
		return prefix ? `${prefix}/${suffix}` : suffix;
	}
	throw new Error(`Unknown guide target: ${String(target)}`);
}

/**
 * @param {string} body
 * @param {string} version
 * @returns {string}
 */
export function renderGuide(body, version) {
	return [
		"---",
		"name: mosaic",
		"description: Create and edit Mosaic charts, tables, metric cards, timelines, decision records, and flow diagrams in Obsidian notes.",
		"metadata:",
		`  mosaic-version: "${version}"`,
		"---",
		"",
		"<!-- Managed by Mosaic while its import switch is on. Plugin updates replace this entire file. -->",
		"",
		body.trim(),
		"",
	].join("\n");
}

/**
 * @param {{ enabled: boolean, appliedPluginVersion?: string } | undefined} record
 * @param {string} version
 * @returns {boolean}
 */
export function shouldUpdateGuide(record, version) {
 return record?.enabled === true && record.appliedPluginVersion !== version;
}

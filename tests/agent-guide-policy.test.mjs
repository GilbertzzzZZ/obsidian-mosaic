import test from "node:test";
import assert from "node:assert/strict";
import {
	shouldUpdateGuide,
	guideTargetPath,
	renderGuide,
} from "../src/agent-guide/core.mjs";

test("three destinations use the agreed names", () => {
	assert.equal(guideTargetPath("agents", ""), ".agents/skills/mosaic/SKILL.md");
	assert.equal(guideTargetPath("claude", ""), ".claude/skills/mosaic/SKILL.md");
	assert.equal(
		guideTargetPath("custom", "Reference"),
		"Reference/Mosaic-Usage-Guide.md",
	);
	assert.equal(guideTargetPath("custom", ""), "Mosaic-Usage-Guide.md");
});

test("custom skill parents append the skill directory instead of a guide document", () => {
	assert.equal(guideTargetPath("skillPath", "skills"), "skills/mosaic/SKILL.md");
	assert.equal(guideTargetPath("custom", "docs/guides"), "docs/guides/Mosaic-Usage-Guide.md");
	assert.equal(guideTargetPath("skillPath", ""), "mosaic/SKILL.md");
	assert.throws(() => guideTargetPath("skillPath", "../outside"), /vault-relative/);
});

test("custom folders normalize separators and redundant current segments", () => {
	assert.equal(
		guideTargetPath("custom", " ./Reference\\agents//./ "),
		"Reference/agents/Mosaic-Usage-Guide.md",
	);
});

test("custom folders reject paths outside the vault", () => {
	for (const folder of [
		"/Reference",
		"\\\\server\\share",
		"C:\\Reference",
		"file:Reference",
		"../Reference",
		"Reference/../Other",
		"~/Reference",
		"~someone/Reference",
		"Reference\u0000",
	]) {
		assert.throws(() => guideTargetPath("custom", folder), /vault-relative/);
	}
});

test("guide wrapper uses the plugin version and one managed body", () => {
	assert.equal(
		renderGuide("\n# Mosaic usage\n", "1.2.3"),
		[
			"---",
			"name: mosaic",
			"description: Create and edit Mosaic charts, tables, metric cards, timelines, decision records, and flow diagrams in Obsidian notes.",
			"metadata:",
			'  mosaic-version: "1.2.3"',
			"---",
			"",
			"<!-- Managed by Mosaic while its import switch is on. Plugin updates replace this entire file. -->",
			"",
			"# Mosaic usage",
			"",
		].join("\n"),
	);
});

test("automatic writes depend on enabled state and applied version only", () => {
 assert.equal(shouldUpdateGuide(undefined, "1.2.5"), false);
 assert.equal(shouldUpdateGuide({ enabled: false }, "1.2.5"), false);
 assert.equal(shouldUpdateGuide({ enabled: true }, "1.2.5"), true);
 assert.equal(shouldUpdateGuide({ enabled: true, appliedPluginVersion: "1.2.4" }, "1.2.5"), true);
 assert.equal(shouldUpdateGuide({ enabled: true, appliedPluginVersion: "1.2.5" }, "1.2.5"), false);
 assert.equal(shouldUpdateGuide({ enabled: true, appliedPluginVersion: "1.2.6" }, "1.2.5"), true);
});

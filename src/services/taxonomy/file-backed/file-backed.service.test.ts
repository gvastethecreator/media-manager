import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
	ArtifactConflictError,
	ArtifactValidationError,
	buildArtifactPath,
	checkArtifactChanged,
	commitQuarantinedArtifact,
	computeArtifactHash,
	extractFrontmatter,
	generateFrontmatter,
	quarantineArtifactFile,
	readArtifactFile,
	renameArtifactFile,
	restoreQuarantinedArtifact,
	writeArtifactFile,
} from "./file-backed.service";

const temporaryDirectories: string[] = [];

async function createRoot(): Promise<string> {
	const root = await mkdtemp(join(tmpdir(), "media-manager-taxonomy-artifact-"));
	temporaryDirectories.push(root);
	return root;
}

afterEach(async () => {
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 20, recursive: true, retryDelay: 50 });
	}
});

describe("file-backed taxonomy artifacts", () => {
	it("writes normalized UTF-8 through a same-directory atomic replacement", async () => {
		const root = await createRoot();
		const path = join(root, "notes", "artifact.md");
		const result = await writeArtifactFile(path, "\uFEFFline one\r\nline two\r\n");

		expect(await readArtifactFile(path)).toBe("line one\nline two\n");
		expect(result).toEqual({
			byteSize: Buffer.byteLength("line one\nline two\n"),
			contentHash: computeArtifactHash("line one\nline two\n"),
		});
		expect(await readdir(join(root, "notes"))).toEqual(["artifact.md"]);
	});

	it("serializes conflicting writers and preserves an external edit", async () => {
		const root = await createRoot();
		const path = join(root, "prompt.md");
		const initial = await writeArtifactFile(path, "initial");

		const writes = await Promise.allSettled([
			writeArtifactFile(path, "first", { expectedHash: initial.contentHash }),
			writeArtifactFile(path, "second", { expectedHash: initial.contentHash }),
		]);

		expect(writes.filter((result) => result.status === "fulfilled")).toHaveLength(1);
		const rejection = writes.find((result) => result.status === "rejected");
		expect(rejection?.status === "rejected" ? rejection.reason : null).toBeInstanceOf(ArtifactConflictError);
		expect(["first", "second"]).toContain(await readArtifactFile(path));
	});

	it("rejects invalid UTF-8, null bytes and oversized authored content", async () => {
		const root = await createRoot();
		const invalidPath = join(root, "invalid.md");
		await writeFile(invalidPath, Buffer.from([0xc3, 0x28]));

		await expect(readArtifactFile(invalidPath)).rejects.toBeInstanceOf(ArtifactValidationError);
		await expect(writeArtifactFile(join(root, "nul.md"), "bad\0content")).rejects.toBeInstanceOf(
			ArtifactValidationError,
		);
		await expect(writeArtifactFile(join(root, "large.md"), "x".repeat(2 * 1024 * 1024 + 1))).rejects.toBeInstanceOf(
			ArtifactValidationError,
		);
	});

	it("round-trips governed frontmatter without accepting unknown authored keys", () => {
		const metadata = {
			category: "ideas",
			color: "oklch(60% 0.2 250)",
			emoji: "🧭",
			id: "prompt-stable-id",
			kind: "prompt" as const,
			parameters: [
				{
					custom: true,
					default: 8,
					description: "Number of migration steps",
					key: "steps",
					type: "number" as const,
				},
			],
			purpose: 'Plan "safe" migrations',
			schemaVersion: 1 as const,
			summary: "A governed artifact",
			title: "Migration planner",
		};
		const document = generateFrontmatter(metadata, "Body\r\ntext {{steps}}");

		expect(extractFrontmatter(document)).toEqual({ metadata, body: "Body\ntext {{steps}}" });
		expect(() => extractFrontmatter(document.replace("title:", "invented: true\ntitle:"))).toThrow(
			ArtifactValidationError,
		);
	});

	it("enforces the governed Prompt vocabulary, placeholders and Wildcard line contract", () => {
		expect(() =>
			generateFrontmatter(
				{
					id: "prompt-1",
					kind: "prompt",
					parameters: [{ custom: false, key: "subject", required: true, type: "text" }],
					purpose: "Describe a subject",
					schemaVersion: 1,
					title: "Prompt",
				},
				"No declared placeholder",
			),
		).toThrow(/requerido no usado/);
		expect(() =>
			generateFrontmatter(
				{ id: "prompt-1", kind: "prompt", purpose: "Describe", schemaVersion: 1, title: "Prompt" },
				"Unknown {{ghost}}",
			),
		).toThrow(/sin parameter declarado/);
		expect(() =>
			generateFrontmatter(
				{ id: "prompt-1", kind: "prompt", purpose: "Describe", schemaVersion: 1, title: "Prompt" },
				"Malformed {{subject",
			),
		).toThrow(/mal formado/);
		expect(() =>
			generateFrontmatter(
				{
					id: "prompt-1",
					kind: "prompt",
					parameters: [{ custom: true, key: "local_key", type: "text" }],
					purpose: "Describe",
					schemaVersion: 1,
					title: "Prompt",
				},
				"Body",
			),
		).toThrow(/requiere description/);
		expect(() =>
			extractFrontmatter(
				'---\nid: "prompt-1"\nkind: "prompt"\nschemaVersion: 1\ntitle: "Prompt"\npurpose: "Use"\nparameters: [{"custom":false,"key":"subject","type":"text","unknown":true}]\n---\n\n{{subject}}',
			),
		).toThrow(/no gobernado/);

		const wildcard = generateFrontmatter(
			{ id: "wildcard-1", kind: "wildcard", schemaVersion: 1, title: "Colors" },
			"  rojo  \n\nverde\n",
		);
		expect(extractFrontmatter(wildcard).body).toBe("rojo\nverde");
		expect(() =>
			generateFrontmatter({ id: "wildcard-1", kind: "wildcard", schemaVersion: 1, title: "Colors" }, "rojo\nrojo"),
		).toThrow(/duplicadas/);
	});

	it("builds portable paths and rejects identity/path injection", async () => {
		const root = await createRoot();
		expect(buildArtifactPath({ extension: ".md", rootDir: root }, "stable-id")).toBe(join(root, "stable-id.md"));
		expect(() => buildArtifactPath({ extension: ".md", rootDir: root }, "../escape")).toThrow(ArtifactValidationError);
		expect(() => buildArtifactPath({ extension: "../txt", rootDir: root }, "stable-id")).toThrow(
			ArtifactValidationError,
		);
	});

	it("renames and quarantines with optimistic conflict protection and rollback", async () => {
		const root = await createRoot();
		const source = join(root, "wildcards", "before.md");
		const destination = join(root, "wildcards", "after.md");
		const initial = await writeArtifactFile(source, "portable");

		const renamed = await renameArtifactFile(source, destination, initial.contentHash);
		expect(renamed.contentHash).toBe(initial.contentHash);
		await expect(stat(source)).rejects.toMatchObject({ code: "ENOENT" });

		const quarantine = await quarantineArtifactFile(destination, initial.contentHash);
		await expect(stat(destination)).rejects.toMatchObject({ code: "ENOENT" });
		await restoreQuarantinedArtifact(quarantine);
		expect(await readFile(destination, "utf8")).toBe("portable");

		const secondQuarantine = await quarantineArtifactFile(destination, initial.contentHash);
		await commitQuarantinedArtifact(secondQuarantine);
		await expect(stat(destination)).rejects.toMatchObject({ code: "ENOENT" });
		await expect(stat(secondQuarantine.quarantinePath)).rejects.toMatchObject({ code: "ENOENT" });
	});

	it("reports sync, external change and missing states without changing the file", async () => {
		const root = await createRoot();
		const path = join(root, "note.md");
		const written = await writeArtifactFile(path, "one");

		expect(await checkArtifactChanged(path, written.contentHash)).toMatchObject({
			needsReindex: false,
			status: "synced",
		});
		await writeArtifactFile(path, "two", { expectedHash: written.contentHash });
		expect(await checkArtifactChanged(path, written.contentHash)).toMatchObject({
			needsReindex: true,
			status: "external_change",
		});
		await rm(path);
		expect(await checkArtifactChanged(path, written.contentHash)).toMatchObject({
			needsReindex: false,
			status: "missing",
		});
	});
});

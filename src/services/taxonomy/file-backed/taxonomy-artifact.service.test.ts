import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rename, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/drizzle";
import { mediaRoots } from "@/lib/drizzle/schema/media-core/assets";
import { notes } from "@/lib/drizzle/schema/taxonomy/notes";
import { prompts } from "@/lib/drizzle/schema/taxonomy/prompts";
import { taxonomyArtifacts } from "@/lib/drizzle/schema/taxonomy/artifacts";
import { wildcards } from "@/lib/drizzle/schema/taxonomy/wildcards";
import { createAuthorizedRootRegistry } from "@/server/security/authorized-roots";
import {
	ArtifactConflictError,
	generateFrontmatter,
	quarantineArtifactFile,
	writeArtifactFile,
} from "./file-backed.service";
import {
	deleteTaxonomyArtifactWithEntity,
	readAndReconcileTaxonomyArtifact,
	rebuildTaxonomyArtifactIndex,
	relocateTaxonomyArtifact,
	saveTaxonomyArtifact,
	searchTaxonomyArtifacts,
} from "./taxonomy-artifact.service";

const temporaryDirectories: string[] = [];

async function createTestRoot(rootId: string, persist = true) {
	const path = await mkdtemp(join(tmpdir(), "media-manager-taxonomy-manager-"));
	temporaryDirectories.push(path);
	const registry = await createAuthorizedRootRegistry([
		{ id: rootId, path, permissions: ["read", "write", "delete", "index"] },
	]);
	if (persist) await db.insert(mediaRoots).values({ id: rootId, label: `Taxonomy ${rootId}` });
	return { path, registry };
}

afterEach(async () => {
	await db.delete(taxonomyArtifacts);
	await db.delete(prompts);
	await db.delete(notes);
	await db.delete(wildcards);
	await db.delete(mediaRoots);
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 20, recursive: true, retryDelay: 50 });
	}
});

describe("taxonomy artifact manager", () => {
	it("externalizes Prompt content and commits its DB search projection atomically", async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `prompt-${crypto.randomUUID()}`;
		await db.insert(prompts).values({ id: entityId, name: "Inline prompt" });

		const document = await saveTaxonomyArtifact(registry, {
			body: "Canonical prompt body",
			entityId,
			entityType: "prompt",
			metadata: {
				category: "operations",
				parameters: [
					{
						custom: true,
						default: 4,
						description: "Number of recovery steps",
						key: "steps",
						type: "number",
					},
				],
				purpose: "Recover safely",
				summary: "A source-of-truth prompt",
				title: "Recovery prompt",
			},
			rootId,
		});

		expect(document.relativePath).toBe(`taxonomy/prompts/${entityId}.md`);
		expect(await readFile(join(path, document.relativePath), "utf8")).toContain("Canonical prompt body");
		expect(await db.select().from(prompts).where(eq(prompts.id, entityId))).toMatchObject([
			{
				category: "operations",
				content: "Canonical prompt body",
				description: "A source-of-truth prompt",
				name: "Recovery prompt",
			},
		]);
		expect(await db.select().from(taxonomyArtifacts)).toMatchObject([
			{
				contentHash: document.contentHash,
				entityId,
				entityType: "prompt",
				indexedBody: "Canonical prompt body",
				indexedTitle: "Recovery prompt",
				syncStatus: "synced",
			},
		]);
	});

	it("lets an external file edit win and rebuilds Note projection deterministically", async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: "Inline note" });
		const created = await saveTaxonomyArtifact(registry, {
			body: "First body",
			entityId,
			entityType: "note",
			metadata: { category: "general", title: "First title" },
			rootId,
		});
		const absolutePath = join(path, created.relativePath);
		const externalDocument = generateFrontmatter(
			{ id: entityId, kind: "note", schemaVersion: 1, category: "research", title: "External title" },
			"External body",
		);
		await writeArtifactFile(absolutePath, externalDocument, { expectedHash: created.contentHash });

		const reconciled = await readAndReconcileTaxonomyArtifact(registry, "note", entityId);

		expect(reconciled).toMatchObject({ body: "External body", metadata: { title: "External title" } });
		expect(await db.select().from(notes).where(eq(notes.id, entityId))).toMatchObject([
			{ category: "research", content: "External body", title: "External title" },
		]);
		expect((await db.select().from(taxonomyArtifacts))[0]?.contentHash).toBe(reconciled?.contentHash);
	});

	it("rejects stale app saves instead of overwriting a newer file version", async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `wildcard-${crypto.randomUUID()}`;
		await db.insert(wildcards).values({ id: entityId, name: "Inline wildcard" });
		const created = await saveTaxonomyArtifact(registry, {
			body: "one",
			entityId,
			entityType: "wildcard",
			metadata: { title: "Wildcard" },
			rootId,
		});
		await writeArtifactFile(join(path, created.relativePath), "external", { expectedHash: created.contentHash });

		await expect(
			saveTaxonomyArtifact(registry, {
				body: "stale app body",
				entityId,
				entityType: "wildcard",
				expectedHash: created.contentHash,
				metadata: { title: "Wildcard" },
			}),
		).rejects.toBeInstanceOf(ArtifactConflictError);
		expect(await readFile(join(path, created.relativePath), "utf8")).toBe("external");
	});

	it("relocates inside the governed family and keeps the binding queryable", async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: "Note" });
		const created = await saveTaxonomyArtifact(registry, {
			body: "relocatable",
			entityId,
			entityType: "note",
			metadata: { title: "Relocatable note" },
			rootId,
		});

		const moved = await relocateTaxonomyArtifact(registry, {
			entityId,
			entityType: "note",
			expectedHash: created.contentHash,
			fileName: "renamed-note.md",
		});

		expect(moved.relativePath).toBe("taxonomy/notes/renamed-note.md");
		await expect(stat(join(path, created.relativePath))).rejects.toMatchObject({ code: "ENOENT" });
		expect(await readFile(join(path, moved.relativePath), "utf8")).toContain("relocatable");
		expect((await searchTaxonomyArtifacts({ query: "Relocatable" })).data).toMatchObject([{ entityId }]);
	});

	it("marks a missing canonical file without deleting authored DB identity", async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: "Survivor" });
		const created = await saveTaxonomyArtifact(registry, {
			body: "offline",
			entityId,
			entityType: "note",
			metadata: { title: "Survivor" },
			rootId,
		});
		await rm(join(path, created.relativePath));

		expect(await readAndReconcileTaxonomyArtifact(registry, "note", entityId)).toMatchObject({
			entityId,
			syncStatus: "missing",
		});
		expect(await db.select({ id: notes.id }).from(notes).where(eq(notes.id, entityId))).toEqual([{ id: entityId }]);
		expect((await db.select().from(taxonomyArtifacts))[0]?.syncStatus).toBe("missing");
	});

	it("fails before writing when the authorized root is absent from persistent identity", async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId, false);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: "No root" });

		await expect(
			saveTaxonomyArtifact(registry, {
				body: "must not leak",
				entityId,
				entityType: "note",
				metadata: { title: "No root" },
				rootId,
			}),
		).rejects.toThrow();
		await expect(readFile(join(path, "taxonomy", "notes", `${entityId}.md`), "utf8")).rejects.toMatchObject({
			code: "ENOENT",
		});
	});

	it("adopts an interrupted unbound file and recovers an external rename by stable identity", async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const adoptedId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: adoptedId, title: "Interrupted" });
		const adoptedRelativePath = `taxonomy/notes/${adoptedId}.md`;
		await writeArtifactFile(
			join(path, adoptedRelativePath),
			generateFrontmatter(
				{ id: adoptedId, kind: "note", schemaVersion: 1, title: "Recovered after crash" },
				"File won",
			),
		);

		const adopted = await rebuildTaxonomyArtifactIndex(registry, "note");
		expect(adopted).toMatchObject({ adopted: 1, error: 0, synced: 1 });
		expect(await readAndReconcileTaxonomyArtifact(registry, "note", adoptedId)).toMatchObject({
			body: "File won",
			relativePath: adoptedRelativePath,
		});

		const renamedId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: renamedId, title: "Rename recovery" });
		const original = await saveTaxonomyArtifact(registry, {
			body: "rename crash",
			entityId: renamedId,
			entityType: "note",
			metadata: { title: "Rename recovery" },
			rootId,
		});
		const movedRelativePath = "taxonomy/notes/recovered-name.md";
		await rename(join(path, original.relativePath), join(path, movedRelativePath));
		const rebuilt = await rebuildTaxonomyArtifactIndex(registry, "note");
		expect(rebuilt.relocated).toBe(1);
		expect(await readAndReconcileTaxonomyArtifact(registry, "note", original.entityId)).toMatchObject({
			relativePath: movedRelativePath,
		});
	});

	it("restores or finalizes interrupted deletes and compensates callback failure", async () => {
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const { path, registry } = await createTestRoot(rootId);
		const entityId = `note-${crypto.randomUUID()}`;
		await db.insert(notes).values({ id: entityId, title: "Delete recovery" });
		const created = await saveTaxonomyArtifact(registry, {
			body: "survive",
			entityId,
			entityType: "note",
			metadata: { title: "Delete recovery" },
			rootId,
		});
		const absolutePath = join(path, created.relativePath);

		await expect(
			deleteTaxonomyArtifactWithEntity(
				registry,
				{ entityId, entityType: "note", expectedHash: created.contentHash },
				async () => {
					throw new Error("database unavailable");
				},
			),
		).rejects.toThrow("database unavailable");
		expect(await readFile(absolutePath, "utf8")).toContain("survive");

		await quarantineArtifactFile(absolutePath, created.contentHash);
		const recovered = await rebuildTaxonomyArtifactIndex(registry, "note");
		expect(recovered.recoveredDeletes).toBe(1);
		expect(await readFile(absolutePath, "utf8")).toContain("survive");

		await quarantineArtifactFile(absolutePath, created.contentHash);
		await db.delete(taxonomyArtifacts).where(eq(taxonomyArtifacts.entityId, entityId));
		await db.delete(notes).where(eq(notes.id, entityId));
		const finalized = await rebuildTaxonomyArtifactIndex(registry, "note");
		expect(finalized.finalizedDeletes).toBe(1);
		await expect(stat(absolutePath)).rejects.toMatchObject({ code: "ENOENT" });
	});
});

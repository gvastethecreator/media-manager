import { afterEach, describe, expect, it } from "bun:test";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { and, eq } from "drizzle-orm";
import express from "express";
import request from "supertest";
import { db } from "../src/lib/drizzle";
import { mediaRoots } from "../src/lib/drizzle/schema/media-core/assets";
import { notes } from "../src/lib/drizzle/schema/taxonomy/notes";
import { taxonomyArtifacts } from "../src/lib/drizzle/schema/taxonomy/artifacts";
import { wildcards } from "../src/lib/drizzle/schema/taxonomy/wildcards";
import { notesEffectRouter } from "../src/server/routes/secondary-services.effect";
import taxonomyArtifactsRouter from "../src/server/routes/taxonomy-artifacts";
import { createAuthorizedRootRegistry } from "../src/server/security/authorized-roots";

const temporaryDirectories: string[] = [];

function createApp(registry: Awaited<ReturnType<typeof createAuthorizedRootRegistry>>) {
	const app = express();
	app.locals.authorizedRootRegistry = registry;
	app.use(express.json());
	app.use("/api/taxonomy-artifacts", taxonomyArtifactsRouter);
	app.use("/api/notes", notesEffectRouter);
	return app;
}

afterEach(async () => {
	await db.delete(taxonomyArtifacts);
	await db.delete(notes);
	await db.delete(wildcards);
	await db.delete(mediaRoots);
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe("taxonomy artifact HTTP contract", () => {
	it("externalizes, reconciles, searches literally, blocks inline writes and deletes coherently", async () => {
		const rootPath = await mkdtemp(join(tmpdir(), "media-manager-taxonomy-http-"));
		temporaryDirectories.push(rootPath);
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const noteId = `note-${crypto.randomUUID()}`;
		const otherNoteId = `note-${crypto.randomUUID()}`;
		await db.insert(mediaRoots).values({ id: rootId, label: "Taxonomy HTTP" });
		await db.insert(notes).values([
			{ id: noteId, title: "Inline" },
			{ id: otherNoteId, title: "Other inline" },
		]);
		const registry = await createAuthorizedRootRegistry([
			{ id: rootId, path: rootPath, permissions: ["read", "write", "delete", "index"] },
		]);
		const app = createApp(registry);
		const created = await request(app)
			.put(`/api/taxonomy-artifacts/note/${noteId}`)
			.send({ body: "Canonical body", metadata: { title: "100% literal" }, rootId });
		expect(created.status, JSON.stringify(created.body)).toBe(200);
		expect(created.body).toMatchObject({
			body: "Canonical body",
			entityId: noteId,
			entityType: "note",
			relativePath: `taxonomy/notes/${noteId}.md`,
			rootId,
			syncStatus: "synced",
		});
		expect(JSON.stringify(created.body)).not.toContain(rootPath);

		const other = await request(app)
			.put(`/api/taxonomy-artifacts/note/${otherNoteId}`)
			.send({ body: "Other body", metadata: { title: "100x literal" }, rootId });
		expect(other.status).toBe(200);
		const literalSearch = await request(app).get("/api/taxonomy-artifacts/search").query({ q: "%" });
		expect(literalSearch.status).toBe(200);
		expect(literalSearch.body.data.map((row: { entityId: string }) => row.entityId)).toEqual([noteId]);

		expect((await request(app).get(`/api/taxonomy-artifacts/note/${noteId}`)).status).toBe(200);
		const stale = await request(app)
			.put(`/api/taxonomy-artifacts/note/${noteId}`)
			.send({ body: "Stale", expectedHash: "0".repeat(64), metadata: { title: "Stale" } });
		expect(stale.status).toBe(409);
		expect(stale.body.code).toBe("ARTIFACT_CONFLICT");

		const invalidRename = await request(app)
			.patch(`/api/taxonomy-artifacts/note/${noteId}/location`)
			.send({ expectedHash: created.body.contentHash, fileName: "../escape.md" });
		expect(invalidRename.status).toBe(400);
		expect(invalidRename.body.code).toBe("ARTIFACT_VALIDATION");

		const blockedUpdate = await request(app).put(`/api/notes/${noteId}`).send({ title: "Bypass" });
		const blockedDelete = await request(app).delete(`/api/notes/${noteId}`);
		expect(blockedUpdate.status).toBe(409);
		expect(blockedDelete.status).toBe(409);
		expect(blockedDelete.body.code).toBe("ARTIFACT_FILE_BACKED");

		const deleted = await request(app)
			.delete(`/api/taxonomy-artifacts/note/${noteId}`)
			.send({ expectedHash: created.body.contentHash });
		expect(deleted.status, JSON.stringify(deleted.body)).toBe(204);
		expect(await db.select({ id: notes.id }).from(notes).where(eq(notes.id, noteId))).toEqual([]);
		expect(
			await db
				.select()
				.from(taxonomyArtifacts)
				.where(and(eq(taxonomyArtifacts.entityType, "note"), eq(taxonomyArtifacts.entityId, noteId))),
		).toEqual([]);
		await expect(stat(join(rootPath, created.body.relativePath))).rejects.toMatchObject({ code: "ENOENT" });
	});

	it("rejects file-backed writes when the root lacks write permission", async () => {
		const rootPath = await mkdtemp(join(tmpdir(), "media-manager-taxonomy-readonly-"));
		temporaryDirectories.push(rootPath);
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		const noteId = `note-${crypto.randomUUID()}`;
		await db.insert(mediaRoots).values({ id: rootId, label: "Read-only taxonomy" });
		await db.insert(notes).values({ id: noteId, title: "Read only" });
		const registry = await createAuthorizedRootRegistry([
			{ id: rootId, path: rootPath, permissions: ["read", "index"] },
		]);

		const response = await request(createApp(registry))
			.put(`/api/taxonomy-artifacts/note/${noteId}`)
			.send({ body: "Denied", metadata: { title: "Denied" }, rootId });
		expect(response.status).toBe(403);
		expect(response.body.code).toBe("ROOT_PERMISSION_DENIED");
		expect(JSON.stringify(response.body)).not.toContain(rootPath);
	});

	it("creates Wildcards file-backed by default and keeps operational fields in the same projection commit", async () => {
		const rootPath = await mkdtemp(join(tmpdir(), "media-manager-wildcard-file-backed-"));
		temporaryDirectories.push(rootPath);
		const rootId = `taxonomy-${crypto.randomUUID()}`;
		await db.insert(mediaRoots).values({ id: rootId, label: "Wildcard library" });
		const registry = await createAuthorizedRootRegistry([
			{ id: rootId, path: rootPath, permissions: ["read", "write", "delete", "index"] },
		]);
		const app = createApp(registry);
		const rejected = await request(app)
			.post("/api/taxonomy-artifacts/wildcard")
			.send({ body: "duplicado\nduplicado", metadata: { title: "Invalid" }, rootId });
		expect(rejected.status).toBe(400);
		expect(await db.select({ id: wildcards.id }).from(wildcards)).toEqual([]);

		const created = await request(app)
			.post("/api/taxonomy-artifacts/wildcard")
			.send({
				body: " rojo \n\nverde",
				metadata: { category: "color", summary: "Palette", title: "Colors" },
				operational: { shortcut: "colors" },
				rootId,
			});
		expect(created.status, JSON.stringify(created.body)).toBe(201);
		expect(created.body.artifact).toMatchObject({ body: "rojo\nverde", entityType: "wildcard", rootId });
		expect(created.body.entity).toMatchObject({
			category: "color",
			children: JSON.stringify(["rojo", "verde"]),
			description: "Palette",
			name: "Colors",
			shortcut: "colors",
		});

		const entityId = created.body.entity.id as string;
		const updated = await request(app)
			.put(`/api/taxonomy-artifacts/wildcard/${entityId}`)
			.send({
				body: "azul\namarillo",
				expectedHash: created.body.artifact.contentHash,
				metadata: { title: "Updated colors" },
				operational: { shortcut: "updated" },
			});
		expect(updated.status, JSON.stringify(updated.body)).toBe(200);
		expect(await db.select().from(wildcards).where(eq(wildcards.id, entityId))).toMatchObject([
			{
				children: JSON.stringify(["azul", "amarillo"]),
				name: "Updated colors",
				shortcut: "updated",
			},
		]);
		expect((await stat(join(rootPath, updated.body.relativePath))).isFile()).toBe(true);

		const deleted = await request(app)
			.delete(`/api/taxonomy-artifacts/wildcard/${entityId}`)
			.send({ expectedHash: updated.body.contentHash });
		expect(deleted.status, JSON.stringify(deleted.body)).toBe(204);
		expect(await db.select({ id: wildcards.id }).from(wildcards).where(eq(wildcards.id, entityId))).toEqual([]);
		await expect(stat(join(rootPath, updated.body.relativePath))).rejects.toMatchObject({ code: "ENOENT" });
	});
});

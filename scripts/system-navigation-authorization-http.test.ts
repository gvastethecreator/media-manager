import { afterEach, describe, expect, it } from 'bun:test';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inArray } from 'drizzle-orm';
import express from 'express';
import request from 'supertest';
import { db } from '../src/lib/drizzle';
import { mediaRoots } from '../src/lib/drizzle/schema/media-core/assets';
import { notes } from '../src/lib/drizzle/schema/taxonomy/notes';
import { prompts } from '../src/lib/drizzle/schema/taxonomy/prompts';
import { taxonomyArtifacts } from '../src/lib/drizzle/schema/taxonomy/artifacts';
import { wildcards } from '../src/lib/drizzle/schema/taxonomy/wildcards';
import systemRouter from '../src/server/routes/system';
import { createAuthorizedRootRegistry } from '../src/server/security/authorized-roots';

const entityIds: string[] = [];
const rootIds: string[] = [];
const temporaryDirectories: string[] = [];

afterEach(async () => {
	if (entityIds.length > 0) {
		await db.delete(taxonomyArtifacts).where(inArray(taxonomyArtifacts.entityId, entityIds));
		await db.delete(notes).where(inArray(notes.id, entityIds));
		await db.delete(prompts).where(inArray(prompts.id, entityIds));
		await db.delete(wildcards).where(inArray(wildcards.id, entityIds));
	}
	if (rootIds.length > 0) await db.delete(mediaRoots).where(inArray(mediaRoots.id, rootIds));
	entityIds.splice(0);
	rootIds.splice(0);
	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

describe('system navigation taxonomy authorization', () => {
	it('preserves inline and authorized entities without exposing withdrawn-root content', async () => {
		const allowedPath = await mkdtemp(join(tmpdir(), 'media-manager-navigation-authorized-'));
		temporaryDirectories.push(allowedPath);
		const allowedRootId = `navigation-allowed-${crypto.randomUUID()}`;
		const withdrawnRootId = `navigation-withdrawn-${crypto.randomUUID()}`;
		rootIds.push(allowedRootId, withdrawnRootId);
		await db.insert(mediaRoots).values([
			{ id: allowedRootId, label: 'Navigation allowed' },
			{ id: withdrawnRootId, label: 'Navigation withdrawn' },
		]);

		const ids = {
			allowedNote: `allowed-note-${crypto.randomUUID()}`,
			allowedPrompt: `allowed-prompt-${crypto.randomUUID()}`,
			allowedWildcard: `allowed-wildcard-${crypto.randomUUID()}`,
			inlineNote: `inline-note-${crypto.randomUUID()}`,
			inlinePrompt: `inline-prompt-${crypto.randomUUID()}`,
			inlineWildcard: `inline-wildcard-${crypto.randomUUID()}`,
			secretNote: `secret-note-${crypto.randomUUID()}`,
			secretPrompt: `secret-prompt-${crypto.randomUUID()}`,
			secretWildcard: `secret-wildcard-${crypto.randomUUID()}`,
		};
		entityIds.push(...Object.values(ids));
		await db.insert(notes).values([
			{ content: 'Allowed note body', id: ids.allowedNote, title: 'Allowed note' },
			{ content: 'Inline note body', id: ids.inlineNote, title: 'Inline note' },
			{ content: 'WITHDRAWN_NOTE_BODY_8675309', id: ids.secretNote, title: 'WITHDRAWN_NOTE_TITLE_8675309' },
		]);
		await db.insert(prompts).values([
			{ id: ids.allowedPrompt, name: 'Allowed prompt' },
			{ id: ids.inlinePrompt, name: 'Inline prompt' },
			{ description: 'WITHDRAWN_PROMPT_BODY_8675309', id: ids.secretPrompt, name: 'WITHDRAWN_PROMPT_TITLE_8675309' },
		]);
		await db.insert(wildcards).values([
			{ children: '["allowed"]', id: ids.allowedWildcard, name: 'Allowed wildcard' },
			{ children: '["inline"]', id: ids.inlineWildcard, name: 'Inline wildcard' },
			{
				children: '["WITHDRAWN_WILDCARD_BODY_8675309"]',
				id: ids.secretWildcard,
				name: 'WITHDRAWN_WILDCARD_TITLE_8675309',
			},
		]);
		await db.insert(taxonomyArtifacts).values(
			[
				['note', ids.allowedNote, allowedRootId],
				['prompt', ids.allowedPrompt, allowedRootId],
				['wildcard', ids.allowedWildcard, allowedRootId],
				['note', ids.secretNote, withdrawnRootId],
				['prompt', ids.secretPrompt, withdrawnRootId],
				['wildcard', ids.secretWildcard, withdrawnRootId],
			].map(([entityType, entityId, rootId]) => ({
				byteSize: 10,
				contentHash: 'c'.repeat(64),
				entityId,
				entityType,
				indexedBody: `Indexed ${entityId}`,
				indexedTitle: entityId,
				relativePath: `taxonomy/${entityType}s/${entityId}.md`,
				rootId,
			})) as (typeof taxonomyArtifacts.$inferInsert)[]
		);

		const app = express();
		app.locals.authorizedRootRegistry = await createAuthorizedRootRegistry([
			{ id: allowedRootId, path: allowedPath, permissions: ['read', 'index'] },
		]);
		app.use('/api/system', systemRouter);
		const response = await request(app).get('/api/system/navigation');

		expect(response.status, JSON.stringify(response.body)).toBe(200);
		expect(response.body.notes.map((item: { id: string }) => item.id)).toEqual(
			expect.arrayContaining([ids.inlineNote, ids.allowedNote])
		);
		expect(response.body.prompts.map((item: { id: string }) => item.id)).toEqual(
			expect.arrayContaining([ids.inlinePrompt, ids.allowedPrompt])
		);
		expect(response.body.wildcards.map((item: { id: string }) => item.id)).toEqual(
			expect.arrayContaining([ids.inlineWildcard, ids.allowedWildcard])
		);
		const publicBody = JSON.stringify(response.body);
		for (const secret of [
			ids.secretNote,
			ids.secretPrompt,
			ids.secretWildcard,
			'WITHDRAWN_NOTE_BODY_8675309',
			'WITHDRAWN_NOTE_TITLE_8675309',
			'WITHDRAWN_PROMPT_BODY_8675309',
			'WITHDRAWN_PROMPT_TITLE_8675309',
			'WITHDRAWN_WILDCARD_BODY_8675309',
			'WITHDRAWN_WILDCARD_TITLE_8675309',
		]) {
			expect(publicBody).not.toContain(secret);
		}
	});
});

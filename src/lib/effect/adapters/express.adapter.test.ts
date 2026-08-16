import { Effect } from 'effect';
import express from 'express';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import {
	NoteDatabaseError,
	NoteNotFound,
	NoteTitleConflict,
	NoteValidationError,
	WildcardDatabaseError,
	WildcardHasRelationsError,
	WildcardNameConflict,
	WildcardNotFound,
	WildcardValidationError,
} from '@/services/secondary/secondary-services-errors.effect';
import {
	PromptDatabaseError,
	PromptHasRelationsError,
	PromptNameConflict,
	PromptNotFound,
	PromptUnknownError,
	PromptValidationError,
} from '@/services/worldbuilding/worldbuilding-errors.effect';
import { TagHasRelationsError } from '@/services/tag/tag-errors.effect';
import { effectHandler, errorToHttpStatus } from './express.adapter';

async function executeFailedEffect(error: unknown) {
	const app = express();
	app.get(
		'/',
		effectHandler(() => Effect.fail(error))
	);
	return request(app).get('/');
}

describe('taxonomy Effect HTTP error mapping', () => {
	it.each([
		[new PromptNotFound({ promptId: 'missing' }), 404],
		[new NoteNotFound({ noteId: 'missing' }), 404],
		[new WildcardNotFound({ wildcardId: 'missing' }), 404],
		[new PromptValidationError({ field: 'name', message: 'invalid' }), 400],
		[new NoteValidationError({ field: 'title', message: 'invalid' }), 400],
		[new WildcardValidationError({ field: 'name', message: 'invalid' }), 400],
		[new PromptNameConflict({ name: 'duplicate' }), 409],
		[new PromptHasRelationsError({ promptId: 'prompt', relationCount: 1 }), 409],
		[new TagHasRelationsError({ tagId: 'tag', relationCount: 2 }), 409],
		[new NoteTitleConflict({ title: 'duplicate' }), 409],
		[new WildcardNameConflict({ name: 'duplicate' }), 409],
		[new WildcardHasRelationsError({ wildcardId: 'wildcard', relationCount: 1 }), 409],
		[new PromptDatabaseError({ operation: 'read', message: 'failed' }), 500],
		[new NoteDatabaseError({ operation: 'read', message: 'failed' }), 500],
		[new WildcardDatabaseError({ operation: 'read', message: 'failed' }), 500],
	] as const)('maps %s to %i', (error, expectedStatus) => {
		expect(errorToHttpStatus(error).status).toBe(expectedStatus);
	});

	it('uses the same non-disclosing not-found contract as root authorization guards', () => {
		expect(errorToHttpStatus(new PromptNotFound({ promptId: 'secret' }))).toMatchObject({
			code: 'PROMPT_NOT_FOUND',
			message: 'Prompt no encontrado.',
			status: 404,
		});
		expect(errorToHttpStatus(new NoteNotFound({ noteId: 'secret' }))).toMatchObject({
			code: 'TAXONOMY_ENTITY_NOT_FOUND',
			message: 'Entidad taxonomy no encontrada.',
			status: 404,
		});
	});

	it('does not mislabel a tag relation conflict as a note title conflict', () => {
		expect(errorToHttpStatus(new TagHasRelationsError({ tagId: 'tag', relationCount: 2 }))).toMatchObject({
			code: 'TAG_HAS_RELATIONS',
			message: 'El tag tag no puede ser eliminado porque tiene 2 relaciones activas',
			status: 409,
		});
	});

	it.each([
		[new PromptNotFound({ promptId: 'secret' }), 404, { code: 'PROMPT_NOT_FOUND', message: 'Prompt no encontrado.' }],
		[
			new NoteNotFound({ noteId: 'secret' }),
			404,
			{ code: 'TAXONOMY_ENTITY_NOT_FOUND', message: 'Entidad taxonomy no encontrada.' },
		],
		[
			new WildcardNotFound({ wildcardId: 'secret' }),
			404,
			{ code: 'TAXONOMY_ENTITY_NOT_FOUND', message: 'Entidad taxonomy no encontrada.' },
		],
		[
			new PromptValidationError({ field: 'name', message: 'invalid' }),
			400,
			{ code: 'PROMPT_VALIDATION_ERROR', message: 'Prompt validation failed: invalid' },
		],
		[
			new NoteTitleConflict({ title: 'duplicate' }),
			409,
			{ code: 'NOTE_TITLE_CONFLICT', message: 'A note with that title already exists.' },
		],
	] as const)('preserves typed Effect failures through the real Express handler', async (error, status, body) => {
		const response = await executeFailedEffect(error);

		expect(response.status).toBe(status);
		expect(response.body).toEqual(body);
	});

	it('preserves code and message for status-bearing route errors', async () => {
		const response = await executeFailedEffect({
			code: 'ROUTE_VALIDATION_ERROR',
			message: 'Invalid route body',
			status: 400,
		});

		expect(response.status).toBe(400);
		expect(response.body).toEqual({ code: 'ROUTE_VALIDATION_ERROR', message: 'Invalid route body' });
	});

	it('keeps unknown Effect failures internal', async () => {
		const response = await executeFailedEffect(new PromptUnknownError({ message: 'sensitive internals' }));

		expect(response.status).toBe(500);
		expect(response.body).toEqual({ error: 'Database error occurred' });
	});
});

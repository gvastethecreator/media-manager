import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { errorCauseMessages } from '@/lib/errors/error-cause-chain';
import {
	folders,
	imageNotes,
	imagePrompts,
	images,
	imageWildcards,
	notes,
	profiles,
	prompts,
	videoNotes,
	videos,
	wildcards,
} from '@/lib/drizzle/schema';
import { PromptService, PromptServiceLive } from '@/services/prompt/prompt.service.effect';
import { fromUnknownNoteError, fromUnknownWildcardError } from '@/services/secondary/secondary-services-errors.effect';
import {
	NoteService,
	NoteServiceLive,
	WildcardService,
	WildcardServiceLive,
} from '@/services/secondary/secondary-services.effect';
import { fromUnknownPromptError } from '@/services/worldbuilding/worldbuilding-errors.effect';

const testId = crypto.randomUUID().slice(0, 8);
const ids = {
	folder: `taxonomy-rel-folder-${testId}`,
	image: `taxonomy-rel-image-${testId}`,
	note: `taxonomy-rel-note-${testId}`,
	profile: `taxonomy-rel-profile-${testId}`,
	prompt: `taxonomy-rel-prompt-${testId}`,
	video: `taxonomy-rel-video-${testId}`,
	wildcard: `taxonomy-rel-wildcard-${testId}`,
};

let createdProfile = false;

beforeEach(async () => {
	const [activeProfile] = await db
		.select({ id: profiles.id })
		.from(profiles)
		.where(eq(profiles.isActive, true))
		.limit(1);
	if (!activeProfile) {
		await db.insert(profiles).values({ id: ids.profile, isActive: true, name: 'Taxonomy relations test' });
		createdProfile = true;
	}
});

afterEach(async () => {
	await db.delete(imagePrompts).where(eq(imagePrompts.B, ids.prompt));
	await db.delete(imageWildcards).where(eq(imageWildcards.B, ids.wildcard));
	await db.delete(imageNotes).where(eq(imageNotes.B, ids.note));
	await db.delete(videoNotes).where(eq(videoNotes.B, ids.note));
	await db.delete(prompts).where(eq(prompts.id, ids.prompt));
	await db.delete(notes).where(eq(notes.id, ids.note));
	await db.delete(wildcards).where(eq(wildcards.id, ids.wildcard));
	await db.delete(images).where(eq(images.id, ids.image));
	await db.delete(videos).where(eq(videos.id, ids.video));
	await db.delete(folders).where(eq(folders.id, ids.folder));
	if (createdProfile) {
		await db.delete(profiles).where(eq(profiles.id, ids.profile));
		createdProfile = false;
	}
});

describe('taxonomy media relation conflicts', () => {
	it('bounds Error.cause traversal and terminates cycles', () => {
		const cyclic = new Error('outer');
		Object.defineProperty(cyclic, 'cause', { value: cyclic });
		expect(errorCauseMessages(cyclic)).toEqual(['outer']);

		let nested = new Error('UNIQUE constraint failed: Note.title');
		for (let depth = 0; depth < 5; depth += 1) nested = new Error(`wrapper-${depth}`, { cause: nested });
		expect(errorCauseMessages(nested)).toHaveLength(5);
		expect(fromUnknownNoteError('create', nested)._tag).toBe('NoteDatabaseError');
	});

	it('classifies only entity identity UNIQUE constraints as name or title conflicts', () => {
		const drizzleError = (cause: Error) => new Error('Failed query: insert', { cause });

		expect(
			fromUnknownPromptError('create', drizzleError(new Error('UNIQUE constraint failed: Prompt.name')))._tag
		).toBe('PromptNameConflict');
		expect(fromUnknownNoteError('create', drizzleError(new Error('UNIQUE constraint failed: Note.title')))._tag).toBe(
			'NoteTitleConflict'
		);
		expect(
			fromUnknownWildcardError('create', drizzleError(new Error('UNIQUE constraint failed: Wildcard.name')))._tag
		).toBe('WildcardNameConflict');

		expect(
			fromUnknownPromptError(
				'addImage',
				drizzleError(new Error('UNIQUE constraint failed: _ImageToPrompt.A, _ImageToPrompt.B'))
			)._tag
		).toBe('PromptDatabaseError');
		expect(
			fromUnknownNoteError(
				'addImage',
				drizzleError(new Error('UNIQUE constraint failed: _ImageToNote.A, _ImageToNote.B'))
			)._tag
		).toBe('NoteDatabaseError');
		expect(
			fromUnknownWildcardError(
				'addImage',
				drizzleError(new Error('UNIQUE constraint failed: _ImageToWildcard.A, _ImageToWildcard.B'))
			)._tag
		).toBe('WildcardDatabaseError');
	});

	it('keeps repeated Prompt, Wildcard and Note media attachments idempotent', async () => {
		await db.insert(folders).values({ id: ids.folder, name: 'Taxonomy relations', path: `/tests/${ids.folder}` });
		await db.insert(images).values({
			folderId: ids.folder,
			hash: 'a'.repeat(64),
			height: 10,
			id: ids.image,
			name: 'taxonomy-relations.jpg',
			path: `/tests/${ids.folder}/taxonomy-relations.jpg`,
			size: 10,
			width: 10,
		});
		await db.insert(videos).values({
			duration: 1,
			folderId: ids.folder,
			hash: 'b'.repeat(64),
			id: ids.video,
			name: 'taxonomy-relations.mp4',
			path: `/tests/${ids.folder}/taxonomy-relations.mp4`,
			size: 10,
		});
		await db.insert(prompts).values({ id: ids.prompt, name: `Prompt ${testId}` });
		await db.insert(notes).values({ id: ids.note, title: `Note ${testId}` });
		await db.insert(wildcards).values({ id: ids.wildcard, name: `Wildcard ${testId}` });

		const attachPromptImage = Effect.flatMap(PromptService, (service) => service.addImage(ids.prompt, ids.image)).pipe(
			Effect.provide(PromptServiceLive)
		);
		const attachWildcardImage = Effect.flatMap(WildcardService, (service) =>
			service.addImage(ids.wildcard, ids.image)
		).pipe(Effect.provide(WildcardServiceLive));
		const attachNoteImage = Effect.flatMap(NoteService, (service) => service.addImage(ids.note, ids.image)).pipe(
			Effect.provide(NoteServiceLive)
		);
		const attachNoteVideo = Effect.flatMap(NoteService, (service) => service.addVideo(ids.note, ids.video)).pipe(
			Effect.provide(NoteServiceLive)
		);

		const runTwice = async <E>(attach: Effect.Effect<void, E>): Promise<void> => {
			await Effect.runPromise(attach);
			await Effect.runPromise(attach);
		};
		await runTwice(attachPromptImage);
		await runTwice(attachWildcardImage);
		await runTwice(attachNoteImage);
		await runTwice(attachNoteVideo);

		expect(await db.select().from(imagePrompts).where(eq(imagePrompts.B, ids.prompt))).toEqual([
			{ A: ids.image, B: ids.prompt },
		]);
		expect(await db.select().from(imageWildcards).where(eq(imageWildcards.B, ids.wildcard))).toEqual([
			{ A: ids.image, B: ids.wildcard },
		]);
		expect(await db.select().from(imageNotes).where(eq(imageNotes.B, ids.note))).toEqual([
			{ A: ids.image, B: ids.note },
		]);
		expect(await db.select().from(videoNotes).where(eq(videoNotes.B, ids.note))).toEqual([
			{ A: ids.video, B: ids.note },
		]);
	});
});

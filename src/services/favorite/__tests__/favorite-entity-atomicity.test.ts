import { eq, inArray, sql } from 'drizzle-orm';
import { Effect } from 'effect';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { db } from '@/lib/drizzle';
import { createAuthorizedPathInput } from '@/lib/filesystem/authorized-path-proof';
import {
	assets,
	audios,
	documents,
	favorites,
	file3Ds,
	folders,
	jsonFiles,
	mediaRoots,
	profiles,
	videos,
} from '@/lib/drizzle/schema';
import * as AudioService from '@/services/audio/audio.service.effect';
import * as DocumentService from '@/services/document/document.service.effect';
import * as File3DService from '@/services/file3d/file3d.service.effect';
import * as JsonFileService from '@/services/json-file/json-file.service.effect';
import * as VideoService from '@/services/video/video.service.effect';
import { FavoriteEntityType } from '@/types/entities/favorite';

type EntityProjection = {
	hash: string;
	id: string;
	isFavorite: boolean;
	name: string;
	path: string;
};

type EntityOperation<T> = Effect.Effect<T, unknown, never>;

interface FavoriteEntityAdapter {
	cleanup: (ids: string[]) => Promise<unknown>;
	create: (input: Record<string, unknown>) => EntityOperation<EntityProjection>;
	createInput: (folderId: string, suffix: string, isFavorite: boolean) => Record<string, unknown>;
	entityType: FavoriteEntityType;
	getByHash: (hash: string) => EntityOperation<EntityProjection | null>;
	getById: (id: string) => EntityOperation<EntityProjection>;
	getByPathAndFolder: (path: string, folderId: string) => EntityOperation<EntityProjection | null>;
	label: string;
	remove: (id: string) => EntityOperation<void>;
	restore: (id: string) => EntityOperation<EntityProjection>;
	update: (id: string, input: { isFavorite: boolean; name: string }) => EntityOperation<EntityProjection>;
}

let folderId = '';
let folderPath = '';
const rootId = `favorite-atomicity-root-${crypto.randomUUID()}`;

const canonicalFileInput = (name: string) => {
	const path = resolve(folderPath, name);
	return {
		path,
		source: createAuthorizedPathInput({ absolutePath: path, relativePath: name, rootId }),
	};
};

const adapters: FavoriteEntityAdapter[] = [
	{
		label: 'audio',
		entityType: FavoriteEntityType.AUDIO,
		createInput: (folderId, suffix, isFavorite) => ({
			name: `atomic-${suffix}.mp3`,
			...canonicalFileInput(`atomic-${suffix}.mp3`),
			hash: suffix.repeat(2),
			size: 1024,
			mimeType: 'audio/mpeg',
			extension: 'mp3',
			folderId,
			isFavorite,
			isArchived: false,
			duration: 3,
			bitrate: 128_000,
			sampleRate: 44_100,
			channels: 2,
			format: 'mp3',
		}),
		create: (input) => AudioService.create(input as Parameters<typeof AudioService.create>[0]),
		update: AudioService.update,
		remove: AudioService.deleteById,
		restore: AudioService.restoreById,
		getById: AudioService.getById,
		getByHash: AudioService.getByHash,
		getByPathAndFolder: AudioService.getByPathAndFolder,
		cleanup: (ids) => db.delete(audios).where(inArray(audios.id, ids)),
	},
	{
		label: 'video',
		entityType: FavoriteEntityType.VIDEO,
		createInput: (folderId, suffix, isFavorite) => ({
			name: `atomic-${suffix}.mp4`,
			...canonicalFileInput(`atomic-${suffix}.mp4`),
			hash: suffix.repeat(2),
			size: 2048,
			duration: 5,
			width: 320,
			height: 180,
			folderId,
			isFavorite,
		}),
		create: (input) => VideoService.create(input as unknown as Parameters<typeof VideoService.create>[0]),
		update: VideoService.update,
		remove: VideoService.deleteById,
		restore: VideoService.restoreById,
		getById: VideoService.getById,
		getByHash: VideoService.getByHash,
		getByPathAndFolder: VideoService.getByPathAndFolder,
		cleanup: (ids) => db.delete(videos).where(inArray(videos.id, ids)),
	},
	{
		label: 'document',
		entityType: FavoriteEntityType.DOCUMENT,
		createInput: (folderId, suffix, isFavorite) => ({
			name: `atomic-${suffix}.pdf`,
			...canonicalFileInput(`atomic-${suffix}.pdf`),
			hash: suffix.repeat(2),
			size: 4096,
			mimeType: 'application/pdf',
			extension: 'pdf',
			folderId,
			isFavorite,
		}),
		create: (input) => DocumentService.create(input as unknown as Parameters<typeof DocumentService.create>[0]),
		update: DocumentService.update,
		remove: DocumentService.delete,
		restore: DocumentService.restoreById,
		getById: DocumentService.getById,
		getByHash: DocumentService.getByHash,
		getByPathAndFolder: DocumentService.getByPathAndFolder,
		cleanup: (ids) => db.delete(documents).where(inArray(documents.id, ids)),
	},
	{
		label: 'file3d',
		entityType: FavoriteEntityType.FILE_3D,
		createInput: (folderId, suffix, isFavorite) => ({
			name: `atomic-${suffix}.glb`,
			...canonicalFileInput(`atomic-${suffix}.glb`),
			hash: suffix.repeat(2),
			size: 8192,
			mimeType: 'model/gltf-binary',
			extension: 'glb',
			folderId,
			isFavorite,
		}),
		create: (input) => File3DService.create(input as unknown as Parameters<typeof File3DService.create>[0]),
		update: File3DService.update,
		remove: File3DService.delete,
		restore: File3DService.restoreById,
		getById: File3DService.getById,
		getByHash: File3DService.getByHash,
		getByPathAndFolder: File3DService.getByPathAndFolder,
		cleanup: (ids) => db.delete(file3Ds).where(inArray(file3Ds.id, ids)),
	},
	{
		label: 'jsonFile',
		entityType: FavoriteEntityType.JSON_FILE,
		createInput: (folderId, suffix, isFavorite) => ({
			name: `atomic-${suffix}.json`,
			...canonicalFileInput(`atomic-${suffix}.json`),
			hash: suffix.repeat(2),
			size: 512,
			mimeType: 'application/json',
			extension: 'json',
			folderId,
			isFavorite,
		}),
		create: (input) => JsonFileService.create(input as unknown as Parameters<typeof JsonFileService.create>[0]),
		update: JsonFileService.update,
		remove: JsonFileService.delete,
		restore: JsonFileService.restoreById,
		getById: JsonFileService.getById,
		getByHash: JsonFileService.getByHash,
		getByPathAndFolder: JsonFileService.getByPathAndFolder,
		cleanup: (ids) => db.delete(jsonFiles).where(inArray(jsonFiles.id, ids)),
	},
];

const profileId = `favorite-atomicity-profile-${crypto.randomUUID()}`;
const createdEntities: Array<{ adapter: FavoriteEntityAdapter; id: string }> = [];
let previousActiveProfileIds: string[] = [];

const uniqueSuffix = () => crypto.randomUUID().replaceAll('-', '');
const runEither = <T>(operation: EntityOperation<T>) => Effect.runPromise(Effect.either(operation));

const expectSuccess = async <T>(operation: EntityOperation<T>): Promise<T> => {
	const result = await runEither(operation);
	expect(result._tag).toBe('Right');
	if (result._tag === 'Left') throw new Error(`Expected success: ${String(result.left)}`);
	return result.right;
};

const expectFailure = async <T>(operation: EntityOperation<T>): Promise<void> => {
	const result = await runEither(operation);
	expect(result._tag).toBe('Left');
};

const createEntity = async (adapter: FavoriteEntityAdapter, isFavorite = false) => {
	const input = adapter.createInput(folderId, uniqueSuffix(), isFavorite);
	const entity = await expectSuccess(adapter.create(input));
	createdEntities.push({ adapter, id: entity.id });
	return entity;
};

const installFavoriteFailureTrigger = async (operation: 'DELETE' | 'INSERT') => {
	const triggerName = `test_fail_favorite_${operation.toLowerCase()}`;
	await db.run(
		sql.raw(
			`CREATE TRIGGER "${triggerName}" BEFORE ${operation} ON "Favorite" BEGIN SELECT RAISE(ABORT, 'injected favorite ${operation.toLowerCase()} failure'); END`
		)
	);
};

const dropFailureTriggers = async () => {
	await db.run(sql.raw('DROP TRIGGER IF EXISTS "test_fail_favorite_insert"'));
	await db.run(sql.raw('DROP TRIGGER IF EXISTS "test_fail_favorite_delete"'));
};

beforeAll(async () => {
	const activeProfiles = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true));
	previousActiveProfileIds = activeProfiles.map((profile: { id: string }) => profile.id);
	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: false }).where(inArray(profiles.id, previousActiveProfileIds));
	}

	await db.insert(profiles).values({
		id: profileId,
		name: 'Favorite Atomicity Test Profile',
		emoji: 'T',
		color: '#3b82f6',
		description: 'Perfil temporal aislado para probar transacciones de favoritos.',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	folderId = crypto.randomUUID();
	folderPath = resolve(tmpdir(), `media-manager-favorite-atomicity-${folderId}`);
	await db.insert(mediaRoots).values({ id: rootId, label: 'Favorite atomicity test root' });
	await db.insert(folders).values({
		id: folderId,
		name: 'favorite-atomicity-folder',
		path: folderPath,
		depth: 0,
		parentId: null,
		isFavorite: false,
		presetId: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	});
});

afterEach(async () => {
	await dropFailureTriggers();
	await db.delete(favorites).where(eq(favorites.profileId, profileId));
	for (const adapter of adapters) {
		const ids = createdEntities.filter((entry) => entry.adapter === adapter).map((entry) => entry.id);
		if (ids.length > 0) await adapter.cleanup(ids);
	}
	const assetIds = createdEntities.map((entry) => entry.id);
	if (assetIds.length > 0) await db.delete(assets).where(inArray(assets.id, assetIds));
	createdEntities.length = 0;
});

afterAll(async () => {
	await dropFailureTriggers();
	await db.delete(favorites).where(eq(favorites.profileId, profileId));
	await db.delete(folders).where(eq(folders.id, folderId));
	await db.delete(mediaRoots).where(eq(mediaRoots.id, rootId));
	await db.delete(profiles).where(eq(profiles.id, profileId));
	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: true }).where(inArray(profiles.id, previousActiveProfileIds));
	}
});

describe.each(adapters)('$label favorite transaction contract', (adapter) => {
	it('rolls back create when the canonical favorite insert fails', async () => {
		const input = adapter.createInput(folderId, uniqueSuffix(), true);
		await installFavoriteFailureTrigger('INSERT');

		await expectFailure(adapter.create(input));
		const projected = await expectSuccess(adapter.getByHash(input.hash as string));
		expect(projected).toBeNull();
	});

	it('rolls back entity updates when the canonical favorite insert fails', async () => {
		const entity = await createEntity(adapter);
		await installFavoriteFailureTrigger('INSERT');

		await expectFailure(adapter.update(entity.id, { name: `${entity.name}-must-rollback`, isFavorite: true }));
		const persisted = await expectSuccess(adapter.getById(entity.id));
		expect(persisted.name).toBe(entity.name);
		expect(persisted.isFavorite).toBe(false);
	});

	it('preserves authored favorite records across tombstone and restore', async () => {
		const entity = await createEntity(adapter, true);
		const beforeDelete = await db.select({ id: favorites.id }).from(favorites).where(eq(favorites.entityId, entity.id));
		expect(beforeDelete).toHaveLength(1);

		await expectSuccess(adapter.remove(entity.id));
		const afterDelete = await db.select({ id: favorites.id }).from(favorites).where(eq(favorites.entityId, entity.id));
		expect(afterDelete).toHaveLength(1);
		await expectFailure(adapter.getById(entity.id));
		const restored = await expectSuccess(adapter.restore(entity.id));
		expect(restored.isFavorite).toBe(true);
	});

	it('does not delete authored favorites while creating a tombstone', async () => {
		const entity = await createEntity(adapter, true);
		await installFavoriteFailureTrigger('DELETE');

		await expectSuccess(adapter.remove(entity.id));
		await expectFailure(adapter.getById(entity.id));
		const favoriteRows = await db.select({ id: favorites.id }).from(favorites).where(eq(favorites.entityId, entity.id));
		expect(favoriteRows).toHaveLength(1);
	});

	it('projects canonical favorite state through hash and path lookups', async () => {
		const entity = await createEntity(adapter);
		await db.insert(favorites).values({
			id: crypto.randomUUID(),
			profileId,
			entityType: adapter.entityType,
			entityId: entity.id,
			addedAt: new Date(),
		});

		const byHash = await expectSuccess(adapter.getByHash(entity.hash));
		const byPath = await expectSuccess(adapter.getByPathAndFolder(entity.path, folderId));
		expect(byHash?.isFavorite).toBe(true);
		expect(byPath?.isFavorite).toBe(true);
	});
});

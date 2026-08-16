import { eq, inArray, sql } from 'drizzle-orm';
import { Effect } from 'effect';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { db } from '@/lib/drizzle';
import { createAuthorizedPathInput } from '@/lib/filesystem/authorized-path-proof';
import {
	albums,
	assets,
	collections,
	favorites,
	folders,
	groups,
	images,
	mediaRoots,
	notes,
	profiles,
	properties,
	sourceFiles,
	wildcards,
	worldItems,
} from '@/lib/drizzle/schema';
import { AlbumService, AlbumServiceLive } from '@/services/album/album.service.effect';
import { CollectionService, CollectionServiceLive } from '@/services/collection/collection.service.effect';
import { FolderService, FolderServiceLive } from '@/services/folder/folder.service.effect';
import * as ImageService from '@/services/image/image.service.effect';
import {
	GroupService,
	GroupServiceLive,
	NoteService,
	NoteServiceLive,
	PropertyService,
	PropertyServiceLive,
	WildcardService,
	WildcardServiceLive,
	WorldItemService,
	WorldItemServiceLive,
} from '@/services/secondary/secondary-services.effect';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { NoteCategory } from '@/types/entities/note';

type EntityResult = { id: string; name?: string; title?: string };
type EntityOperation = Effect.Effect<EntityResult, unknown, never>;
type EntityDeleteOperation = Effect.Effect<void, unknown, never>;

interface AtomicFavoriteAdapter {
	cleanup: (ids: string[]) => Promise<void>;
	create: (input: Record<string, unknown>) => EntityOperation;
	createInput: (label: string) => Record<string, unknown>;
	delete?: (id: string) => EntityDeleteOperation;
	entityType: FavoriteEntityType;
	findByLabel: (label: string) => Promise<Array<{ id: string }>>;
	label: string;
	readLabel: (id: string) => Promise<string | null>;
	update: (id: string, input: Record<string, unknown>) => EntityOperation;
	updateInput: (label: string) => Record<string, unknown>;
}

const fromService = <A>(
	service: any,
	layer: unknown,
	operation: (service: any) => Effect.Effect<A, unknown, never>
): Effect.Effect<A, unknown, never> =>
	Effect.provide(Effect.flatMap(service as any, operation), layer as never) as Effect.Effect<A, unknown, never>;

const rowLabel = async (table: any, labelColumn: any, id: string): Promise<string | null> => {
	const rows = await db.select({ label: labelColumn }).from(table).where(eq(table.id, id)).limit(1);
	return (rows[0]?.label as string | undefined) ?? null;
};

const findRowsByLabel = async (table: any, labelColumn: any, label: string): Promise<Array<{ id: string }>> =>
	db.select({ id: table.id }).from(table).where(eq(labelColumn, label));

const cleanupRows = async (table: any, ids: string[]): Promise<void> => {
	if (ids.length === 0) return;
	await db.delete(table).where(inArray(table.id, ids));
};

let imageFolderId = '';
let imageFolderPath = '';
const rootId = `fav-atomic-${crypto.randomUUID()}`;
const profileId = `favorite-public-atomicity-profile-${crypto.randomUUID()}`;
let previousActiveProfileIds: string[] = [];

const imageCreateInput = (label: string): Record<string, unknown> => {
	const fileName = `${label}.jpg`;
	const path = resolve(imageFolderPath, fileName);
	return {
		name: fileName,
		path,
		hash: crypto.randomUUID().replaceAll('-', '').repeat(2),
		size: 1024,
		width: 64,
		height: 64,
		folderId: imageFolderId,
		source: createAuthorizedPathInput({ absolutePath: path, relativePath: fileName, rootId }),
	};
};

const adapters: AtomicFavoriteAdapter[] = [
	{
		label: 'album',
		entityType: FavoriteEntityType.ALBUM,
		createInput: (label) => ({ name: label }),
		updateInput: (label) => ({ name: label }),
		create: (input) =>
			fromService(AlbumService, AlbumServiceLive, (service) => service.create(input as never) as EntityOperation),
		delete: (id) =>
			fromService(AlbumService, AlbumServiceLive, (service) => service.delete(id) as EntityDeleteOperation),
		update: (id, input) =>
			fromService(AlbumService, AlbumServiceLive, (service) => service.update(id, input as never) as EntityOperation),
		findByLabel: (label) => findRowsByLabel(albums, albums.name, label),
		readLabel: (id) => rowLabel(albums, albums.name, id),
		cleanup: (ids) => cleanupRows(albums, ids),
	},
	{
		label: 'collection',
		entityType: FavoriteEntityType.COLLECTION,
		createInput: (label) => ({ name: label }),
		updateInput: (label) => ({ name: label }),
		create: (input) =>
			fromService(
				CollectionService,
				CollectionServiceLive,
				(service) => service.create(input as never) as EntityOperation
			),
		delete: (id) =>
			fromService(CollectionService, CollectionServiceLive, (service) => service.delete(id) as EntityDeleteOperation),
		update: (id, input) =>
			fromService(
				CollectionService,
				CollectionServiceLive,
				(service) => service.update(id, input as never) as EntityOperation
			),
		findByLabel: (label) => findRowsByLabel(collections, collections.name, label),
		readLabel: (id) => rowLabel(collections, collections.name, id),
		cleanup: (ids) => cleanupRows(collections, ids),
	},
	{
		label: 'folder',
		entityType: FavoriteEntityType.FOLDER,
		createInput: (label) => ({ name: label, path: resolve(tmpdir(), label), parentId: null }),
		updateInput: (label) => ({ name: label }),
		create: (input) =>
			fromService(FolderService, FolderServiceLive, (service) => service.create(input as never) as EntityOperation),
		delete: (id) =>
			fromService(FolderService, FolderServiceLive, (service) => service.delete(id) as EntityDeleteOperation),
		update: (id, input) =>
			fromService(FolderService, FolderServiceLive, (service) => service.update(id, input as never) as EntityOperation),
		findByLabel: (label) => findRowsByLabel(folders, folders.name, label),
		readLabel: (id) => rowLabel(folders, folders.name, id),
		cleanup: (ids) => cleanupRows(folders, ids),
	},
	{
		label: 'image',
		entityType: FavoriteEntityType.IMAGE,
		createInput: imageCreateInput,
		updateInput: (label) => ({ name: label }),
		create: (input) => ImageService.create(input as unknown as Parameters<typeof ImageService.create>[0]),
		update: (id, input) => ImageService.update(id, input as Parameters<typeof ImageService.update>[1]),
		findByLabel: (label) => findRowsByLabel(images, images.name, `${label}.jpg`),
		readLabel: (id) => rowLabel(images, images.name, id),
		cleanup: async (ids) => {
			if (ids.length === 0) return;
			await db.transaction(async (transaction: any) => {
				await transaction.run(sql`PRAGMA defer_foreign_keys = ON`);
				await transaction.delete(images).where(inArray(images.id, ids));
				await transaction.delete(assets).where(inArray(assets.id, ids));
				await transaction.delete(sourceFiles).where(inArray(sourceFiles.assetId, ids));
			});
		},
	},
	{
		label: 'group',
		entityType: FavoriteEntityType.GROUP,
		createInput: (label) => ({ name: label }),
		updateInput: (label) => ({ name: label }),
		create: (input) =>
			fromService(GroupService, GroupServiceLive, (service) => service.create(input as never) as EntityOperation),
		delete: (id) =>
			fromService(GroupService, GroupServiceLive, (service) => service.delete(id) as EntityDeleteOperation),
		update: (id, input) =>
			fromService(GroupService, GroupServiceLive, (service) => service.update(id, input as never) as EntityOperation),
		findByLabel: (label) => findRowsByLabel(groups, groups.name, label),
		readLabel: (id) => rowLabel(groups, groups.name, id),
		cleanup: (ids) => cleanupRows(groups, ids),
	},
	{
		label: 'wildcard',
		entityType: FavoriteEntityType.WILDCARD,
		createInput: (label) => ({ name: label }),
		updateInput: (label) => ({ name: label }),
		create: (input) =>
			fromService(WildcardService, WildcardServiceLive, (service) => service.create(input as never) as EntityOperation),
		update: (id, input) =>
			fromService(
				WildcardService,
				WildcardServiceLive,
				(service) => service.update(id, input as never) as EntityOperation
			),
		delete: (id) =>
			fromService(WildcardService, WildcardServiceLive, (service) => service.delete(id) as EntityDeleteOperation),
		findByLabel: (label) => findRowsByLabel(wildcards, wildcards.name, label),
		readLabel: (id) => rowLabel(wildcards, wildcards.name, id),
		cleanup: (ids) => cleanupRows(wildcards, ids),
	},
	{
		label: 'note',
		entityType: FavoriteEntityType.NOTE,
		createInput: (label) => ({ title: label, content: '', category: NoteCategory.GENERAL }),
		updateInput: (label) => ({ title: label }),
		create: (input) =>
			fromService(NoteService, NoteServiceLive, (service) => service.create(input as never) as EntityOperation),
		delete: (id) => fromService(NoteService, NoteServiceLive, (service) => service.delete(id) as EntityDeleteOperation),
		update: (id, input) =>
			fromService(NoteService, NoteServiceLive, (service) => service.update(id, input as never) as EntityOperation),
		findByLabel: (label) => findRowsByLabel(notes, notes.title, label),
		readLabel: (id) => rowLabel(notes, notes.title, id),
		cleanup: (ids) => cleanupRows(notes, ids),
	},
	{
		label: 'property',
		entityType: FavoriteEntityType.PROPERTY,
		createInput: (label) => ({ name: label }),
		updateInput: (label) => ({ name: label }),
		create: (input) =>
			fromService(PropertyService, PropertyServiceLive, (service) => service.create(input as never) as EntityOperation),
		update: (id, input) =>
			fromService(
				PropertyService,
				PropertyServiceLive,
				(service) => service.update(id, input as never) as EntityOperation
			),
		delete: (id) =>
			fromService(PropertyService, PropertyServiceLive, (service) => service.delete(id) as EntityDeleteOperation),
		findByLabel: (label) => findRowsByLabel(properties, properties.name, label),
		readLabel: (id) => rowLabel(properties, properties.name, id),
		cleanup: (ids) => cleanupRows(properties, ids),
	},
	{
		label: 'worldItem',
		entityType: FavoriteEntityType.WORLD_ITEM,
		createInput: (label) => ({ name: label }),
		updateInput: (label) => ({ name: label }),
		create: (input) =>
			fromService(
				WorldItemService,
				WorldItemServiceLive,
				(service) => service.create(input as never) as EntityOperation
			),
		delete: (id) =>
			fromService(WorldItemService, WorldItemServiceLive, (service) => service.delete(id) as EntityDeleteOperation),
		update: (id, input) =>
			fromService(
				WorldItemService,
				WorldItemServiceLive,
				(service) => service.update(id, input as never) as EntityOperation
			),
		findByLabel: (label) => findRowsByLabel(worldItems, worldItems.name, label),
		readLabel: (id) => rowLabel(worldItems, worldItems.name, id),
		cleanup: (ids) => cleanupRows(worldItems, ids),
	},
];

const createdEntities: Array<{ adapter: AtomicFavoriteAdapter; id: string }> = [];
const uniqueLabel = (label: string) => `favorite-atomic-${label}-${crypto.randomUUID()}`;
const runEither = (operation: EntityOperation) => Effect.runPromise(Effect.either(operation));

const expectSuccess = async (operation: EntityOperation): Promise<EntityResult> => {
	const result = await runEither(operation);
	expect(result._tag).toBe('Right');
	if (result._tag === 'Left') throw new Error(`Expected success: ${String(result.left)}`);
	return result.right;
};

const expectDeleteSuccess = async (operation: EntityDeleteOperation): Promise<void> => {
	const result = await Effect.runPromise(Effect.either(operation));
	expect(result._tag).toBe('Right');
	if (result._tag === 'Left') throw new Error(`Expected delete success: ${String(result.left)}`);
};

const installFavoriteInsertFailure = () =>
	db.run(
		sql.raw(
			'CREATE TRIGGER "test_fail_public_favorite_insert" BEFORE INSERT ON "Favorite" BEGIN SELECT RAISE(ABORT, \'injected public favorite insert failure\'); END'
		)
	);

const installFavoriteDeleteFailure = () =>
	db.run(
		sql.raw(
			'CREATE TRIGGER "test_fail_public_favorite_delete" BEFORE DELETE ON "Favorite" BEGIN SELECT RAISE(ABORT, \'injected public favorite delete failure\'); END'
		)
	);

const dropFailureTriggers = async () => {
	await db.run(sql.raw('DROP TRIGGER IF EXISTS "test_fail_public_favorite_insert"'));
	await db.run(sql.raw('DROP TRIGGER IF EXISTS "test_fail_public_favorite_delete"'));
};

beforeAll(async () => {
	const activeProfiles = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true));
	previousActiveProfileIds = activeProfiles.map((profile: { id: string }) => profile.id);
	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: false }).where(inArray(profiles.id, previousActiveProfileIds));
	}
	await db.insert(profiles).values({
		id: profileId,
		name: 'Favorite Public Atomicity Profile',
		emoji: 'T',
		color: '#3b82f6',
		description: 'Isolated transaction test profile',
		isActive: true,
		settingsId: null,
		imageId: null,
	});
	imageFolderId = crypto.randomUUID();
	imageFolderPath = resolve(tmpdir(), `favorite-public-atomicity-${imageFolderId}`);
	await db.insert(mediaRoots).values({ id: rootId, label: 'Favorite public atomicity root' });
	await db.insert(folders).values({
		id: imageFolderId,
		name: 'favorite-public-atomicity-image-folder',
		path: imageFolderPath,
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
		await adapter.cleanup(ids);
	}
	createdEntities.length = 0;
});

afterAll(async () => {
	await dropFailureTriggers();
	await db.delete(favorites).where(eq(favorites.profileId, profileId));
	await db.delete(folders).where(eq(folders.id, imageFolderId));
	await db.delete(mediaRoots).where(eq(mediaRoots.id, rootId));
	await db.delete(profiles).where(eq(profiles.id, profileId));
	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: true }).where(inArray(profiles.id, previousActiveProfileIds));
	}
});

describe.each(adapters)('$label public favorite transaction contract', (adapter) => {
	it('rolls back create when the canonical favorite insert fails', async () => {
		const label = uniqueLabel(`${adapter.label}-create`);
		await installFavoriteInsertFailure();

		const result = await runEither(adapter.create({ ...adapter.createInput(label), isFavorite: true }));
		expect(result._tag).toBe('Left');
		expect(await adapter.findByLabel(label)).toHaveLength(0);
	});

	it('rolls back update when the canonical favorite insert fails', async () => {
		const originalLabel = uniqueLabel(`${adapter.label}-before`);
		const entity = await expectSuccess(adapter.create(adapter.createInput(originalLabel)));
		createdEntities.push({ adapter, id: entity.id });
		const updatedLabel = uniqueLabel(`${adapter.label}-after`);
		await installFavoriteInsertFailure();

		const result = await runEither(
			adapter.update(entity.id, { ...adapter.updateInput(updatedLabel), isFavorite: true })
		);
		expect(result._tag).toBe('Left');
		expect(await adapter.readLabel(entity.id)).toBe(adapter.label === 'image' ? `${originalLabel}.jpg` : originalLabel);
		expect(await db.select({ id: favorites.id }).from(favorites).where(eq(favorites.entityId, entity.id))).toHaveLength(
			0
		);
	});
});

const physicalDeleteAdapters = adapters.filter(
	(adapter): adapter is AtomicFavoriteAdapter & { delete: (id: string) => EntityDeleteOperation } =>
		adapter.delete !== undefined
);

describe.each(physicalDeleteAdapters)('$label public favorite delete contract', (adapter) => {
	it('removes canonical Favorite rows with a physical entity delete', async () => {
		const label = uniqueLabel(`${adapter.label}-delete`);
		const entity = await expectSuccess(adapter.create({ ...adapter.createInput(label), isFavorite: true }));
		createdEntities.push({ adapter, id: entity.id });

		await expectDeleteSuccess(adapter.delete(entity.id));

		expect(await adapter.readLabel(entity.id)).toBeNull();
		expect(await db.select({ id: favorites.id }).from(favorites).where(eq(favorites.entityId, entity.id))).toHaveLength(
			0
		);
	});

	it('rolls back the physical entity delete when Favorite cleanup fails', async () => {
		const label = uniqueLabel(`${adapter.label}-delete-rollback`);
		const entity = await expectSuccess(adapter.create({ ...adapter.createInput(label), isFavorite: true }));
		createdEntities.push({ adapter, id: entity.id });
		await installFavoriteDeleteFailure();

		const result = await Effect.runPromise(Effect.either(adapter.delete(entity.id)));

		expect(result._tag).toBe('Left');
		expect(await adapter.readLabel(entity.id)).toBe(label);
		expect(await db.select({ id: favorites.id }).from(favorites).where(eq(favorites.entityId, entity.id))).toHaveLength(
			1
		);
	});
});

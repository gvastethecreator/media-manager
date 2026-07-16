/**
 * @file Tests para JsonFileService con Effect
 * @module services/json-file/__tests__/json-file.service.effect.test
 * @description Test suite completo para JsonFileService usando Effect-TS
 */

import { Effect } from 'effect';
import { eq, inArray } from 'drizzle-orm';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { db } from '@/lib/drizzle';
import { createAuthorizedPathInput } from '@/lib/filesystem/authorized-path-proof';
import { FileSyncService } from '@/lib/filesystem/file-sync.service';
import { assets, favorites, folders, jsonFiles, mediaRoots, profiles, sourceFiles } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { createAuthorizedRootRegistry } from '@/server/security/authorized-roots';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { expectError, expectSuccess, generateTestId } from '../../../../tests/factories/test-helpers';
import * as JsonFileService from '../json-file.service.effect';

// ============= Test Helpers =============

const createTestFolder = async (folderPath = resolve(tmpdir(), `media-manager-json-${crypto.randomUUID()}`)) => {
	const now = new Date();
	const rootId = `root-json-${crypto.randomUUID()}`;
	const [folder] = await db
		.insert(folders)
		.values({
			id: crypto.randomUUID(),
			name: `test-folder-${Date.now()}`,
			path: folderPath,
			depth: 0,
			parentId: null,
			isFavorite: false,
			presetId: null,
			createdAt: now,
			updatedAt: now,
		})
		.returning();
	await db.insert(mediaRoots).values({ id: rootId, label: 'JSON service test root' });
	return { ...folder, rootId };
};

const withCanonicalSource = <T extends { name: string }>(
	folder: Awaited<ReturnType<typeof createTestFolder>>,
	input: T
) => {
	const path = resolve(folder.path, input.name);
	return {
		...input,
		path,
		source: createAuthorizedPathInput({ absolutePath: path, relativePath: input.name, rootId: folder.rootId }),
	};
};

const createTestJsonFile = async (folderId: string, overrides?: Partial<typeof jsonFiles.$inferInsert>) => {
	const now = new Date();
	const timestamp = Date.now().toString();
	const validHash = timestamp.padStart(64, '0');

	const [jsonFile] = await db
		.insert(jsonFiles)
		.values({
			id: crypto.randomUUID(),
			name: `test-config-${Date.now()}.json`,
			path: `/test/config-${Date.now()}.json`,
			hash: validHash,
			size: 1024,
			mimeType: 'application/json',
			extension: 'json',
			folderId,
			isFavorite: false,
			isArchived: false,
			createdAt: now,
			updatedAt: now,
			...overrides,
		})
		.returning();
	return jsonFile;
};

let createdActiveProfileId: string | null = null;
let previousActiveProfileIds: string[] = [];
const temporaryDirectories: string[] = [];

const ensureActiveProfile = async () => {
	if (createdActiveProfileId) {
		return createdActiveProfileId;
	}

	const activeProfiles = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true));
	previousActiveProfileIds = activeProfiles.map((profile: { id: string }) => profile.id);

	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: false }).where(inArray(profiles.id, previousActiveProfileIds));
	}

	const profileId = `jsonfile-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'JsonFile Service Test Profile',
		emoji: '🧾',
		color: '#f59e0b',
		description: 'Perfil activo para tests de archivos JSON',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

// ============= Cleanup =============

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.JSON_FILE));
	await db.delete(jsonFiles);
	await db.delete(assets);
	await db.delete(folders);
	await db.delete(mediaRoots);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}

	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: true }).where(inArray(profiles.id, previousActiveProfileIds));
		previousActiveProfileIds = [];
	}

	for (const directory of temporaryDirectories.splice(0)) {
		await rm(directory, { force: true, maxRetries: 40, recursive: true, retryDelay: 100 });
	}
});

// ============= CRUD TESTS =============

describe('JsonFileService - CRUD Operations', () => {
	describe('create', () => {
		it('should create a json file successfully', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'settings.json',
				path: '/config/settings.json',
				hash: validHash,
				size: 2048,
				mimeType: 'application/json',
				extension: 'json',
				folderId: folder.id,
			};

			const result = await expectSuccess(JsonFileService.create(withCanonicalSource(folder, input)));

			expect(result.name).toBe(input.name);
			expect(result.path).toBe(resolve(folder.path, input.name));
			expect(result.hash).toBe(input.hash);
			expect(result.size).toBe(input.size);
			expect(result.mimeType).toBe(input.mimeType);
			expect(result.extension).toBe(input.extension);
			expect(result.folderId).toBe(input.folderId);
			expect(result.isFavorite).toBe(false);
		});

		it('should create json file with content analysis metadata', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'package.json',
				path: '/projects/package.json',
				hash: validHash,
				size: 4096,
				mimeType: 'application/json',
				extension: 'json',
				folderId: folder.id,
				content: JSON.stringify({ name: 'test-package', version: '1.0.0' }),
				schema: 'npm-package',
				isValid: true,
				keyCount: 20,
				depth: 3,
				validJson: true,
				schemaVersion: '2.0',
				keys: JSON.stringify(['name', 'version', 'dependencies']),
				hasArrays: true,
				hasObjects: true,
				encoding: 'utf-8',
				compressed: false,
				minified: false,
				prettyPrinted: true,
			};

			const result = await expectSuccess(JsonFileService.create(withCanonicalSource(folder, input)));

			expect(result.content).toBe(input.content);
			expect(result.schema).toBe(input.schema);
			expect(result.isValid).toBe(true);
			expect(result.keyCount).toBe(input.keyCount);
			expect(result.depth).toBe(input.depth);
			expect(result.validJson).toBe(true);
			expect(result.hasArrays).toBe(true);
			expect(result.hasObjects).toBe(true);
			expect(result.encoding).toBe(input.encoding);
			expect(result.prettyPrinted).toBe(true);
		});

		it('should create json file with presentation metadata', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'data.json',
				path: '/data/data.json',
				hash: validHash,
				size: 1024,
				mimeType: 'application/json',
				extension: 'json',
				folderId: folder.id,
				description: 'Configuration data',
				emoji: '⚙️',
				color: '#3b82f6',
				category: 'config',
				tags: 'settings,app',
			};

			const result = await expectSuccess(JsonFileService.create(withCanonicalSource(folder, input)));

			expect(result.description).toBe(input.description);
			expect(result.emoji).toBe(input.emoji);
			expect(result.color).toBe(input.color);
			expect(result.category).toBe(input.category);
			expect(result.tags).toBe(input.tags);
		});

		it('should persist favorite state through the canonical favorite bridge when a profile is active', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');
			await ensureActiveProfile();

			const result = await expectSuccess(
				JsonFileService.create(
					withCanonicalSource(folder, {
						name: 'favorite-config.json',
						path: '/config/favorite.json',
						hash: validHash,
						size: 512,
						mimeType: 'application/json',
						extension: 'json',
						folderId: folder.id,
						isFavorite: true,
					})
				)
			);

			expect(await favoriteService.isFavorite(FavoriteEntityType.JSON_FILE, result.id)).toBe(true);
		});

		it('should fail with empty name', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: '',
				path: '/config/test.json',
				hash: validHash,
				size: 1024,
				mimeType: 'application/json',
				extension: 'json',
				folderId: folder.id,
			};

			const error = await expectError(JsonFileService.create(input as any));
			expect(error._tag).toBe('JsonFileValidationError');
		});

		it('should fail with empty path', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'test.json',
				path: '',
				hash: validHash,
				size: 1024,
				mimeType: 'application/json',
				extension: 'json',
				folderId: folder.id,
			};

			const error = await expectError(JsonFileService.create(input as any));
			expect(error._tag).toBe('JsonFileValidationError');
		});

		it('should fail with negative size', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'test.json',
				path: '/config/test.json',
				hash: validHash,
				size: -1,
				mimeType: 'application/json',
				extension: 'json',
				folderId: folder.id,
			};

			const error = await expectError(JsonFileService.create(input as any));
			expect(error._tag).toBe('JsonFileValidationError');
		});
	});

	describe('getById', () => {
		it('should retrieve a json file by ID', async () => {
			const folder = await createTestFolder();
			const jsonFile = await createTestJsonFile(folder.id);

			const result = await expectSuccess(JsonFileService.getById(jsonFile.id));

			expect(result.id).toBe(jsonFile.id);
			expect(result.name).toBe(jsonFile.name);
			expect(result.path).toBe(jsonFile.path);
		});

		it('should fail when json file does not exist', async () => {
			const error = await expectError(JsonFileService.getById('non-existent-id'));

			expect(error._tag).toBe('JsonFileNotFound');
			if (error._tag === 'JsonFileNotFound') {
				expect(error.id).toBe('non-existent-id');
			}
		});
	});

	describe('getByHash', () => {
		it('should find json file by hash', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');
			const jsonFile = await createTestJsonFile(folder.id, { hash: validHash });

			const result = await expectSuccess(JsonFileService.getByHash(validHash));

			expect(result).not.toBeNull();
			if (result) {
				expect(result.id).toBe(jsonFile.id);
				expect(result.hash).toBe(validHash);
			}
		});

		it('should return null when hash not found', async () => {
			const validHash = 'c'.padStart(64, '0');
			const result = await expectSuccess(JsonFileService.getByHash(validHash));

			expect(result).toBeNull();
		});
	});

	describe('getByPathAndFolder', () => {
		it('should find json file by path and folder', async () => {
			const folder = await createTestFolder();
			const path = '/unique/path/config.json';
			const jsonFile = await createTestJsonFile(folder.id, { path });

			const result = await expectSuccess(JsonFileService.getByPathAndFolder(path, folder.id));

			expect(result).not.toBeNull();
			if (result) {
				expect(result.id).toBe(jsonFile.id);
				expect(result.path).toBe(path);
				expect(result.folderId).toBe(folder.id);
			}
		});

		it('should return null when path/folder combination not found', async () => {
			const folder = await createTestFolder();
			const result = await expectSuccess(JsonFileService.getByPathAndFolder('/non-existent.json', folder.id));

			expect(result).toBeNull();
		});
	});

	describe('update', () => {
		it('should update json file fields', async () => {
			const folder = await createTestFolder();
			const jsonFile = await createTestJsonFile(folder.id);

			const update = {
				name: 'updated-config.json',
				description: 'Updated description',
				isFavorite: true,
			};

			const result = await expectSuccess(JsonFileService.update(jsonFile.id, update));

			expect(result.name).toBe(update.name);
			expect(result.description).toBe(update.description);
			expect(result.isFavorite).toBe(true);
		});

		it('should update content analysis metadata', async () => {
			const folder = await createTestFolder();
			const jsonFile = await createTestJsonFile(folder.id);

			const update = {
				content: JSON.stringify({ updated: true }),
				isValid: false,
				validationErrors: 'Missing required field "name"',
				keyCount: 5,
				depth: 2,
				validJson: true,
				hasArrays: false,
				hasObjects: true,
				minified: true,
				prettyPrinted: false,
			};

			const result = await expectSuccess(JsonFileService.update(jsonFile.id, update));

			expect(result.content).toBe(update.content);
			expect(result.isValid).toBe(false);
			expect(result.validationErrors).toBe(update.validationErrors);
			expect(result.keyCount).toBe(update.keyCount);
			expect(result.depth).toBe(update.depth);
			expect(result.validJson).toBe(true);
			expect(result.hasArrays).toBe(false);
			expect(result.hasObjects).toBe(true);
			expect(result.minified).toBe(true);
			expect(result.prettyPrinted).toBe(false);
		});

		it('should update presentation metadata', async () => {
			const folder = await createTestFolder();
			const jsonFile = await createTestJsonFile(folder.id);

			const update = {
				emoji: '📊',
				color: '#ef4444',
				category: 'analytics',
				tags: 'metrics,charts',
				shortcut: 'ctrl+j',
			};

			const result = await expectSuccess(JsonFileService.update(jsonFile.id, update));

			expect(result.emoji).toBe(update.emoji);
			expect(result.color).toBe(update.color);
			expect(result.category).toBe(update.category);
			expect(result.tags).toBe(update.tags);
			expect(result.shortcut).toBe(update.shortcut);
		});

		it('should fail when updating non-existent json file', async () => {
			const error = await expectError(JsonFileService.update('non-existent-id', { name: 'test.json' }));

			expect(error._tag).toBe('JsonFileNotFound');
		});
	});

	describe('delete', () => {
		it('should delete a json file', async () => {
			const folder = await createTestFolder();
			const jsonFile = await createTestJsonFile(folder.id);

			await expectSuccess(JsonFileService.delete(jsonFile.id));

			const error = await expectError(JsonFileService.getById(jsonFile.id));
			expect(error._tag).toBe('JsonFileNotFound');
		});

		it('should fail when deleting non-existent json file', async () => {
			const error = await expectError(JsonFileService.delete('non-existent-id'));

			expect(error._tag).toBe('JsonFileNotFound');
		});
	});
});

// ============= QUERY OPERATIONS TESTS =============

describe('JsonFileService - Query Operations', () => {
	describe('getAll', () => {
		it('should list all json files', async () => {
			const folder = await createTestFolder();
			await createTestJsonFile(folder.id);
			await createTestJsonFile(folder.id);
			await createTestJsonFile(folder.id);

			const result = await expectSuccess(JsonFileService.getAll());

			expect(result.data.length).toBe(3);
			expect(result.total).toBe(3);
		});

		it('should paginate results', async () => {
			const folder = await createTestFolder();
			await createTestJsonFile(folder.id);
			await createTestJsonFile(folder.id);
			await createTestJsonFile(folder.id);
			await createTestJsonFile(folder.id);
			await createTestJsonFile(folder.id);

			const page1 = await expectSuccess(JsonFileService.getAll({ limit: 2, offset: 0 }));
			expect(page1.data.length).toBe(2);
			expect(page1.total).toBe(5);

			const page2 = await expectSuccess(JsonFileService.getAll({ limit: 2, offset: 2 }));
			expect(page2.data.length).toBe(2);

			const page3 = await expectSuccess(JsonFileService.getAll({ limit: 2, offset: 4 }));
			expect(page3.data.length).toBe(1);
		});

		it('should filter by folderId', async () => {
			const folder1 = await createTestFolder();
			const folder2 = await createTestFolder();

			await createTestJsonFile(folder1.id);
			await createTestJsonFile(folder1.id);
			await createTestJsonFile(folder2.id);

			const result = await expectSuccess(JsonFileService.getAll({ folderId: folder1.id }));

			expect(result.data.length).toBe(2);
			expect(result.total).toBe(2);
			expect(result.data.every((jf: any) => jf.folderId === folder1.id)).toBe(true);
		});

		it('should filter by isFavorite', async () => {
			const folder = await createTestFolder();
			await ensureActiveProfile();
			const favoriteJsonFile = await createTestJsonFile(folder.id, { isFavorite: false });
			await createTestJsonFile(folder.id, { isFavorite: true });
			await createTestJsonFile(folder.id, { isFavorite: false });

			await favoriteService.set(FavoriteEntityType.JSON_FILE, favoriteJsonFile.id, true);

			const result = await expectSuccess(JsonFileService.getAll({ isFavorite: true }));

			expect(result.data.length).toBe(1);
			expect(result.data[0].id).toBe(favoriteJsonFile.id);
			expect(result.data.every((jf: any) => jf.isFavorite === true)).toBe(true);
		});

		it('should search by name', async () => {
			const folder = await createTestFolder();
			await createTestJsonFile(folder.id, { name: 'database-config.json' });
			await createTestJsonFile(folder.id, { name: 'app-settings.json' });
			await createTestJsonFile(folder.id, { name: 'database-backup.json' });

			const result = await expectSuccess(JsonFileService.getAll({ search: 'database' }));

			expect(result.data.length).toBe(2);
			expect(result.data.every((jf: any) => jf.name.includes('database'))).toBe(true);
		});

		it('should sort by name ascending', async () => {
			const folder = await createTestFolder();
			await createTestJsonFile(folder.id, { name: 'C.json' });
			await createTestJsonFile(folder.id, { name: 'A.json' });
			await createTestJsonFile(folder.id, { name: 'B.json' });

			const result = await expectSuccess(JsonFileService.getAll({ sortBy: 'name', sortOrder: 'asc' }));

			expect(result.data[0].name).toBe('A.json');
			expect(result.data[1].name).toBe('B.json');
			expect(result.data[2].name).toBe('C.json');
		});

		it('should sort by name descending', async () => {
			const folder = await createTestFolder();
			await createTestJsonFile(folder.id, { name: 'C.json' });
			await createTestJsonFile(folder.id, { name: 'A.json' });
			await createTestJsonFile(folder.id, { name: 'B.json' });

			const result = await expectSuccess(JsonFileService.getAll({ sortBy: 'name', sortOrder: 'desc' }));

			expect(result.data[0].name).toBe('C.json');
			expect(result.data[1].name).toBe('B.json');
			expect(result.data[2].name).toBe('A.json');
		});

		it('should filter by mimeType', async () => {
			const folder = await createTestFolder();
			await createTestJsonFile(folder.id, { mimeType: 'application/json' });
			await createTestJsonFile(folder.id, { mimeType: 'application/ld+json' });
			await createTestJsonFile(folder.id, { mimeType: 'application/json' });

			const result = await expectSuccess(JsonFileService.getAll({ mimeType: 'application/json' }));

			expect(result.data.length).toBe(2);
			expect(result.data.every((jf: any) => jf.mimeType === 'application/json')).toBe(true);
		});

		it('should filter by extension', async () => {
			const folder = await createTestFolder();
			await createTestJsonFile(folder.id, { extension: 'json' });
			await createTestJsonFile(folder.id, { extension: 'jsonld' });
			await createTestJsonFile(folder.id, { extension: 'json' });

			const result = await expectSuccess(JsonFileService.getAll({ extension: 'json' }));

			expect(result.data.length).toBe(2);
			expect(result.data.every((jf: any) => jf.extension === 'json')).toBe(true);
		});

		it('should filter by isValid', async () => {
			const folder = await createTestFolder();
			await createTestJsonFile(folder.id, { isValid: true });
			await createTestJsonFile(folder.id, { isValid: false });
			await createTestJsonFile(folder.id, { isValid: true });

			const result = await expectSuccess(JsonFileService.getAll({ isValid: true }));

			expect(result.data.length).toBe(2);
			expect(result.data.every((jf: any) => jf.isValid === true)).toBe(true);
		});

		it('should filter by category', async () => {
			const folder = await createTestFolder();
			await createTestJsonFile(folder.id, { category: 'config' });
			await createTestJsonFile(folder.id, { category: 'data' });
			await createTestJsonFile(folder.id, { category: 'config' });

			const result = await expectSuccess(JsonFileService.getAll({ category: 'config' }));

			expect(result.data.length).toBe(2);
			expect(result.data.every((jf: any) => jf.category === 'config')).toBe(true);
		});
	});
});

// ============= CONTENT DUPLICATE TESTS =============

describe('JsonFileService - duplicate content', () => {
	it('creates distinct Assets for distinct locations with the same hash', async () => {
		const folder = await createTestFolder();
		const timestamp = Date.now().toString();
		const validHash = timestamp.padStart(64, '0');

		const first = await expectSuccess(
			JsonFileService.create(
				withCanonicalSource(folder, {
					name: 'first.json',
					path: '/config/first.json',
					hash: validHash,
					size: 1024,
					mimeType: 'application/json',
					extension: 'json',
					folderId: folder.id,
				})
			)
		);

		const second = await expectSuccess(
			JsonFileService.create(
				withCanonicalSource(folder, {
					name: 'second.json',
					path: '/config/second.json',
					hash: validHash,
					size: 2048,
					mimeType: 'application/json',
					extension: 'json',
					folderId: folder.id,
				})
			)
		);

		expect(second.id).not.toBe(first.id);
		expect(second.hash).toBe(first.hash);
	});
});

describe('JsonFileService - canonical filesystem lifecycle', () => {
	it('marks a missing source and restores it without deleting the JSON identity', async () => {
		const directory = await mkdtemp(resolve(tmpdir(), 'media-manager-json-sync-'));
		temporaryDirectories.push(directory);
		const rootPath = resolve(directory, 'library');
		await mkdir(rootPath);
		const jsonPath = resolve(rootPath, 'observed.json');
		await writeFile(jsonPath, '{}');
		const rootId = `root-json-sync-${crypto.randomUUID()}`;
		const authorizedRootRegistry = await createAuthorizedRootRegistry([
			{ id: rootId, path: rootPath, permissions: ['index', 'read'] },
		]);
		await db.insert(mediaRoots).values({ id: rootId, label: 'JSON sync root' });
		const folder = await createTestFolder();
		await db.update(folders).set({ path: rootPath }).where(eq(folders.id, folder.id));
		const created = await expectSuccess(
			JsonFileService.create({
				extension: 'json',
				folderId: folder.id,
				hash: '7'.repeat(64),
				mimeType: 'application/json',
				name: 'observed.json',
				path: jsonPath,
				size: 2,
				source: createAuthorizedPathInput({ absolutePath: jsonPath, relativePath: 'observed.json', rootId }),
			})
		);
		await db
			.update(jsonFiles)
			.set({ path: resolve(directory, 'stale-legacy-path.json') })
			.where(eq(jsonFiles.id, created.id));

		await rm(jsonPath);
		await FileSyncService.getInstance().syncFolderFiles(folder.id, {
			authorizedRootRegistry,
			entityTypes: ['json'],
		});
		expect(await db.select().from(jsonFiles).where(eq(jsonFiles.id, created.id))).toHaveLength(1);
		expect((await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, created.id)))[0]).toEqual(
			expect.objectContaining({ availability: 'missing' })
		);

		await writeFile(jsonPath, '{}');
		await FileSyncService.getInstance().syncFolderFiles(folder.id, {
			authorizedRootRegistry,
			entityTypes: ['json'],
		});
		expect((await db.select().from(sourceFiles).where(eq(sourceFiles.assetId, created.id)))[0]).toEqual(
			expect.objectContaining({ availability: 'available' })
		);
	});

	it('fails closed when SourceFile resolves outside its declared Folder', async () => {
		const directory = await mkdtemp(resolve(tmpdir(), 'media-manager-json-folder-conflict-'));
		temporaryDirectories.push(directory);
		const rootPath = resolve(directory, 'library');
		const folderPath = resolve(rootPath, 'declared');
		const insidePath = resolve(folderPath, 'inside.json');
		const outsidePath = resolve(rootPath, 'other', 'outside.json');
		await mkdir(folderPath, { recursive: true });
		await mkdir(resolve(rootPath, 'other'));
		await writeFile(insidePath, '{}');
		await writeFile(outsidePath, '{}');
		const rootId = `root-json-conflict-${crypto.randomUUID()}`;
		const authorizedRootRegistry = await createAuthorizedRootRegistry([
			{ id: rootId, path: rootPath, permissions: ['index', 'read'] },
		]);
		await db.insert(mediaRoots).values({ id: rootId, label: 'JSON conflict root' });
		const folder = await createTestFolder(folderPath);
		const created = await expectSuccess(
			JsonFileService.create({
				extension: 'json',
				folderId: folder.id,
				hash: '8'.repeat(64),
				mimeType: 'application/json',
				name: 'inside.json',
				path: insidePath,
				size: 2,
				source: createAuthorizedPathInput({
					absolutePath: insidePath,
					relativePath: 'declared/inside.json',
					rootId,
				}),
			})
		);
		await db.update(sourceFiles).set({ relativePath: 'other/outside.json' }).where(eq(sourceFiles.assetId, created.id));

		await expect(
			FileSyncService.getInstance().syncFolderFiles(folder.id, {
				authorizedRootRegistry,
				entityTypes: ['json'],
			})
		).rejects.toThrow('fuera del Folder autorizado');
	});
});

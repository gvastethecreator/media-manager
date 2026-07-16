/**
 * @file Tests para File3DService con Effect
 * @module services/file3d/__tests__/file3d.service.effect.test
 * @description Test suite completo para File3DService usando Effect-TS
 */

import { Effect } from 'effect';
import { eq, inArray } from 'drizzle-orm';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { db } from '@/lib/drizzle';
import { createAuthorizedPathInput } from '@/lib/filesystem/authorized-path-proof';
import { assets, file3Ds, favorites, folders, mediaRoots, profiles } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { expectError, expectSuccess, generateTestId } from '../../../../tests/factories/test-helpers';
import * as File3DService from '../file3d.service.effect';

// ============= Test Helpers =============

const createTestFolder = async () => {
	const now = new Date();
	const rootId = `root-file3d-${crypto.randomUUID()}`;
	const [folder] = await db
		.insert(folders)
		.values({
			id: crypto.randomUUID(),
			name: `test-folder-${Date.now()}`,
			path: resolve(tmpdir(), `media-manager-file3d-${crypto.randomUUID()}`),
			depth: 0,
			parentId: null,
			isFavorite: false,
			presetId: null,
			createdAt: now,
			updatedAt: now,
		})
		.returning();
	await db.insert(mediaRoots).values({ id: rootId, label: 'File3D service test root' });
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

const createTestFile3D = async (folderId: string, overrides?: Partial<typeof file3Ds.$inferInsert>) => {
	const now = new Date();
	const timestamp = Date.now().toString();
	const validHash = timestamp.padStart(64, '0');

	const [file3d] = await db
		.insert(file3Ds)
		.values({
			id: crypto.randomUUID(),
			name: `test-model-${Date.now()}.glb`,
			path: `/test/model-${Date.now()}.glb`,
			hash: validHash,
			size: 5_000_000,
			mimeType: 'model/gltf-binary',
			extension: 'glb',
			folderId,
			isFavorite: false,
			isArchived: false,
			createdAt: now,
			updatedAt: now,
			...overrides,
		})
		.returning();
	return file3d;
};

let createdActiveProfileId: string | null = null;
let previousActiveProfileIds: string[] = [];

const ensureActiveProfile = async () => {
	if (createdActiveProfileId) {
		return createdActiveProfileId;
	}

	const activeProfiles = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true));
	previousActiveProfileIds = activeProfiles.map((profile: { id: string }) => profile.id);

	if (previousActiveProfileIds.length > 0) {
		await db.update(profiles).set({ isActive: false }).where(inArray(profiles.id, previousActiveProfileIds));
	}

	const profileId = `file3d-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'File3D Service Test Profile',
		emoji: '🧊',
		color: '#06b6d4',
		description: 'Perfil activo para tests de archivos 3D',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

// ============= Cleanup =============

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.FILE_3D));
	await db.delete(file3Ds);
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
});

// ============= CRUD TESTS =============

describe('File3DService - CRUD Operations', () => {
	describe('create', () => {
		it('should create a file3d successfully', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'character.glb',
				path: '/models/character.glb',
				hash: validHash,
				size: 10_000_000,
				mimeType: 'model/gltf-binary',
				extension: 'glb',
				folderId: folder.id,
			};

			const result = await expectSuccess(File3DService.create(withCanonicalSource(folder, input)));

			expect(result.name).toBe(input.name);
			expect(result.path).toBe(resolve(folder.path, input.name));
			expect(result.hash).toBe(input.hash);
			expect(result.size).toBe(input.size);
			expect(result.mimeType).toBe(input.mimeType);
			expect(result.extension).toBe(input.extension);
			expect(result.folderId).toBe(input.folderId);
			expect(result.isFavorite).toBe(false);
		});

		it('should create file3d with geometry metadata', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'detailed-model.glb',
				path: '/models/detailed.glb',
				hash: validHash,
				size: 25_000_000,
				mimeType: 'model/gltf-binary',
				extension: 'glb',
				folderId: folder.id,
				format: 'GLTF 2.0',
				version: '2.0',
				vertices: 50_000,
				faces: 25_000,
				triangles: 100_000,
				materials: 15,
				textures: 20,
				animations: 5,
				bones: 64,
				scenes: 1,
				cameras: 2,
				lights: 4,
				hasUV: true,
				hasNormals: true,
				hasColors: false,
				boundingBox: JSON.stringify({ min: [-1, -1, -1], max: [1, 1, 1] }),
			};

			const result = await expectSuccess(File3DService.create(withCanonicalSource(folder, input)));

			expect(result.format).toBe(input.format);
			expect(result.version).toBe(input.version);
			expect(result.vertices).toBe(input.vertices);
			expect(result.faces).toBe(input.faces);
			expect(result.triangles).toBe(input.triangles);
			expect(result.materials).toBe(input.materials);
			expect(result.textures).toBe(input.textures);
			expect(result.animations).toBe(input.animations);
			expect(result.bones).toBe(input.bones);
			expect(result.hasUV).toBe(true);
			expect(result.hasNormals).toBe(true);
			expect(result.hasColors).toBe(false);
			expect(result.boundingBox).toBe(input.boundingBox);
		});

		it('should persist favorite state through the canonical favorite bridge when a profile is active', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');
			await ensureActiveProfile();

			const result = await expectSuccess(
				File3DService.create(
					withCanonicalSource(folder, {
						name: 'favorite-model.glb',
						path: '/models/favorite.glb',
						hash: validHash,
						size: 1_000_000,
						mimeType: 'model/gltf-binary',
						extension: 'glb',
						folderId: folder.id,
						isFavorite: true,
					})
				)
			);

			expect(await favoriteService.isFavorite(FavoriteEntityType.FILE_3D, result.id)).toBe(true);
		});

		it('should fail with empty name', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: '',
				path: '/models/test.glb',
				hash: validHash,
				size: 1024,
				mimeType: 'model/gltf-binary',
				extension: 'glb',
				folderId: folder.id,
			};

			const error = await expectError(File3DService.create(input as any));
			expect(error._tag).toBe('File3DValidationError');
		});

		it('should fail with empty path', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'test.glb',
				path: '',
				hash: validHash,
				size: 1024,
				mimeType: 'model/gltf-binary',
				extension: 'glb',
				folderId: folder.id,
			};

			const error = await expectError(File3DService.create(input as any));
			expect(error._tag).toBe('File3DValidationError');
		});

		it('should fail with negative size', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');

			const input = {
				name: 'test.glb',
				path: '/models/test.glb',
				hash: validHash,
				size: -1,
				mimeType: 'model/gltf-binary',
				extension: 'glb',
				folderId: folder.id,
			};

			const error = await expectError(File3DService.create(input as any));
			expect(error._tag).toBe('File3DValidationError');
		});
	});

	describe('getById', () => {
		it('should retrieve a file3d by ID', async () => {
			const folder = await createTestFolder();
			const file3d = await createTestFile3D(folder.id);

			const result = await expectSuccess(File3DService.getById(file3d.id));

			expect(result.id).toBe(file3d.id);
			expect(result.name).toBe(file3d.name);
			expect(result.path).toBe(file3d.path);
		});

		it('should fail when file3d does not exist', async () => {
			const error = await expectError(File3DService.getById('non-existent-id'));

			expect(error._tag).toBe('File3DNotFound');
			if (error._tag === 'File3DNotFound') {
				expect(error.id).toBe('non-existent-id');
			}
		});
	});

	describe('getByHash', () => {
		it('should find file3d by hash', async () => {
			const folder = await createTestFolder();
			const timestamp = Date.now().toString();
			const validHash = timestamp.padStart(64, '0');
			const file3d = await createTestFile3D(folder.id, { hash: validHash });

			const result = await expectSuccess(File3DService.getByHash(validHash));

			expect(result).not.toBeNull();
			if (result) {
				expect(result.id).toBe(file3d.id);
				expect(result.hash).toBe(validHash);
			}
		});

		it('should return null when hash not found', async () => {
			const validHash = 'b'.padStart(64, '0');
			const result = await expectSuccess(File3DService.getByHash(validHash));

			expect(result).toBeNull();
		});
	});

	describe('getByPathAndFolder', () => {
		it('should find file3d by path and folder', async () => {
			const folder = await createTestFolder();
			const path = '/unique/path/model.glb';
			const file3d = await createTestFile3D(folder.id, { path });

			const result = await expectSuccess(File3DService.getByPathAndFolder(path, folder.id));

			expect(result).not.toBeNull();
			if (result) {
				expect(result.id).toBe(file3d.id);
				expect(result.path).toBe(path);
				expect(result.folderId).toBe(folder.id);
			}
		});

		it('should return null when path/folder combination not found', async () => {
			const folder = await createTestFolder();
			const result = await expectSuccess(File3DService.getByPathAndFolder('/non-existent.glb', folder.id));

			expect(result).toBeNull();
		});
	});

	describe('update', () => {
		it('should update file3d fields', async () => {
			const folder = await createTestFolder();
			const file3d = await createTestFile3D(folder.id);

			const update = {
				name: 'updated-model.glb',
				format: 'OBJ',
				isFavorite: true,
			};

			const result = await expectSuccess(File3DService.update(file3d.id, update));

			expect(result.name).toBe(update.name);
			expect(result.format).toBe(update.format);
			expect(result.isFavorite).toBe(true);
		});

		it('should update geometry metadata', async () => {
			const folder = await createTestFolder();
			const file3d = await createTestFile3D(folder.id);

			const update = {
				vertices: 100_000,
				faces: 50_000,
				triangles: 200_000,
				materials: 30,
				hasUV: true,
				hasNormals: true,
				hasColors: true,
			};

			const result = await expectSuccess(File3DService.update(file3d.id, update));

			expect(result.vertices).toBe(update.vertices);
			expect(result.faces).toBe(update.faces);
			expect(result.triangles).toBe(update.triangles);
			expect(result.materials).toBe(update.materials);
			expect(result.hasUV).toBe(true);
			expect(result.hasNormals).toBe(true);
			expect(result.hasColors).toBe(true);
		});

		it('should fail when updating non-existent file3d', async () => {
			const error = await expectError(File3DService.update('non-existent-id', { name: 'test.glb' }));

			expect(error._tag).toBe('File3DNotFound');
		});
	});

	describe('delete', () => {
		it('should delete a file3d', async () => {
			const folder = await createTestFolder();
			const file3d = await createTestFile3D(folder.id);

			await expectSuccess(File3DService.delete(file3d.id));

			const error = await expectError(File3DService.getById(file3d.id));
			expect(error._tag).toBe('File3DNotFound');
		});

		it('should fail when deleting non-existent file3d', async () => {
			const error = await expectError(File3DService.delete('non-existent-id'));

			expect(error._tag).toBe('File3DNotFound');
		});
	});
});

// ============= QUERY OPERATIONS TESTS =============

describe('File3DService - Query Operations', () => {
	describe('getAll', () => {
		it('should list all file3ds', async () => {
			const folder = await createTestFolder();
			await createTestFile3D(folder.id);
			await createTestFile3D(folder.id);
			await createTestFile3D(folder.id);

			const result = await expectSuccess(File3DService.getAll());

			expect(result.data.length).toBe(3);
			expect(result.total).toBe(3);
		});

		it('should paginate results', async () => {
			const folder = await createTestFolder();
			await createTestFile3D(folder.id);
			await createTestFile3D(folder.id);
			await createTestFile3D(folder.id);
			await createTestFile3D(folder.id);
			await createTestFile3D(folder.id);

			const page1 = await expectSuccess(File3DService.getAll({ limit: 2, offset: 0 }));
			expect(page1.data.length).toBe(2);
			expect(page1.total).toBe(5);

			const page2 = await expectSuccess(File3DService.getAll({ limit: 2, offset: 2 }));
			expect(page2.data.length).toBe(2);

			const page3 = await expectSuccess(File3DService.getAll({ limit: 2, offset: 4 }));
			expect(page3.data.length).toBe(1);
		});

		it('should filter by folderId', async () => {
			const folder1 = await createTestFolder();
			const folder2 = await createTestFolder();

			await createTestFile3D(folder1.id);
			await createTestFile3D(folder1.id);
			await createTestFile3D(folder2.id);

			const result = await expectSuccess(File3DService.getAll({ folderId: folder1.id }));

			expect(result.data.length).toBe(2);
			expect(result.total).toBe(2);
			expect(result.data.every((f3d: any) => f3d.folderId === folder1.id)).toBe(true);
		});

		it('should filter by isFavorite', async () => {
			const folder = await createTestFolder();
			await ensureActiveProfile();
			const favoriteFile3D = await createTestFile3D(folder.id, { isFavorite: false });
			await createTestFile3D(folder.id, { isFavorite: true });
			await createTestFile3D(folder.id, { isFavorite: false });

			await favoriteService.set(FavoriteEntityType.FILE_3D, favoriteFile3D.id, true);

			const result = await expectSuccess(File3DService.getAll({ isFavorite: true }));

			expect(result.data.length).toBe(1);
			expect(result.data[0].id).toBe(favoriteFile3D.id);
			expect(result.data.every((f3d: any) => f3d.isFavorite === true)).toBe(true);
		});

		it('should search by name', async () => {
			const folder = await createTestFolder();
			await createTestFile3D(folder.id, { name: 'character-warrior.glb' });
			await createTestFile3D(folder.id, { name: 'environment-forest.glb' });
			await createTestFile3D(folder.id, { name: 'character-mage.glb' });

			const result = await expectSuccess(File3DService.getAll({ search: 'character' }));

			expect(result.data.length).toBe(2);
			expect(result.data.every((f3d: any) => f3d.name.includes('character'))).toBe(true);
		});

		it('should sort by name ascending', async () => {
			const folder = await createTestFolder();
			await createTestFile3D(folder.id, { name: 'C.glb' });
			await createTestFile3D(folder.id, { name: 'A.glb' });
			await createTestFile3D(folder.id, { name: 'B.glb' });

			const result = await expectSuccess(File3DService.getAll({ sortBy: 'name', sortOrder: 'asc' }));

			expect(result.data[0].name).toBe('A.glb');
			expect(result.data[1].name).toBe('B.glb');
			expect(result.data[2].name).toBe('C.glb');
		});

		it('should sort by name descending', async () => {
			const folder = await createTestFolder();
			await createTestFile3D(folder.id, { name: 'C.glb' });
			await createTestFile3D(folder.id, { name: 'A.glb' });
			await createTestFile3D(folder.id, { name: 'B.glb' });

			const result = await expectSuccess(File3DService.getAll({ sortBy: 'name', sortOrder: 'desc' }));

			expect(result.data[0].name).toBe('C.glb');
			expect(result.data[1].name).toBe('B.glb');
			expect(result.data[2].name).toBe('A.glb');
		});

		it('should filter by mimeType', async () => {
			const folder = await createTestFolder();
			await createTestFile3D(folder.id, { mimeType: 'model/gltf-binary' });
			await createTestFile3D(folder.id, { mimeType: 'model/obj' });
			await createTestFile3D(folder.id, { mimeType: 'model/gltf-binary' });

			const result = await expectSuccess(File3DService.getAll({ mimeType: 'model/gltf-binary' }));

			expect(result.data.length).toBe(2);
			expect(result.data.every((f3d: any) => f3d.mimeType === 'model/gltf-binary')).toBe(true);
		});

		it('should filter by extension', async () => {
			const folder = await createTestFolder();
			await createTestFile3D(folder.id, { extension: 'glb' });
			await createTestFile3D(folder.id, { extension: 'obj' });
			await createTestFile3D(folder.id, { extension: 'glb' });

			const result = await expectSuccess(File3DService.getAll({ extension: 'glb' }));

			expect(result.data.length).toBe(2);
			expect(result.data.every((f3d: any) => f3d.extension === 'glb')).toBe(true);
		});

		it('should filter by format', async () => {
			const folder = await createTestFolder();
			await createTestFile3D(folder.id, { format: 'GLTF 2.0', extension: 'gltf' });
			await createTestFile3D(folder.id, { format: 'OBJ', extension: 'obj' });
			await createTestFile3D(folder.id, { format: 'GLTF 2.0', extension: 'glb' });

			const result = await expectSuccess(File3DService.getAll({ format: 'GLTF 2.0' }));

			expect(result.data.length).toBe(2);
			expect(result.data.every((f3d: any) => f3d.format === 'GLTF 2.0')).toBe(true);
		});
	});
});

// ============= CONTENT DUPLICATE TESTS =============

describe('File3DService - duplicate content', () => {
	it('creates distinct Assets for distinct locations with the same hash', async () => {
		const folder = await createTestFolder();
		const timestamp = Date.now().toString();
		const validHash = timestamp.padStart(64, '0');

		const first = await expectSuccess(
			File3DService.create(
				withCanonicalSource(folder, {
					name: 'first.glb',
					path: '/models/first.glb',
					hash: validHash,
					size: 1024,
					mimeType: 'model/gltf-binary',
					extension: 'glb',
					folderId: folder.id,
				})
			)
		);

		const second = await expectSuccess(
			File3DService.create(
				withCanonicalSource(folder, {
					name: 'second.glb',
					path: '/models/second.glb',
					hash: validHash,
					size: 2048,
					mimeType: 'model/gltf-binary',
					extension: 'glb',
					folderId: folder.id,
				})
			)
		);

		expect(second.id).not.toBe(first.id);
		expect(second.hash).toBe(first.hash);
	});
});

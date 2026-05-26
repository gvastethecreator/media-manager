/**
 * @file Tests para FolderService Effect
 * @description Tests completos para CRUD, operaciones jerárquicas, validación y edge cases del FolderService
 * @created 2025-10-11 - Fase 4 Effect Implementation
 */

import { eq } from 'drizzle-orm';
import { Effect, Exit } from 'effect';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { documents, favorites, folders, profiles } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { FolderService, FolderServiceLive } from '../folder.service.effect';
import {
	FolderCircularReferenceError,
	FolderHasChildrenError,
	FolderMaxDepthExceededError,
	FolderNameConflict,
	FolderNotFound,
	FolderPathConflict,
} from '../folder-errors.effect';

// Helper para ejecutar Effect con timeout
const runEffect = <A, E>(effect: Effect.Effect<A, E, FolderService>, timeout = 5000) => {
	return Effect.runPromise(Effect.provide(effect, FolderServiceLive).pipe(Effect.timeout(timeout)));
};

// Helper para ejecutar Effect esperando fallo
const runEffectExpectFailure = <A, E>(effect: Effect.Effect<A, E, FolderService>) => {
	return Effect.runPromiseExit(Effect.provide(effect, FolderServiceLive));
};

let createdActiveProfileId: string | null = null;

const ensureActiveProfile = async () => {
	const [activeProfile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true)).limit(1);

	if (activeProfile) {
		return activeProfile.id;
	}

	const profileId = `folder-service-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Folder Service Test Profile',
		emoji: '📁',
		color: '#3b82f6',
		description: 'Perfil activo para tests de carpetas',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

describe('FolderService Effect', () => {
	// Cleanup después de cada test
	afterEach(async () => {
		try {
			await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.FOLDER));
			await db.delete(documents);
			// Borrar TODAS las carpetas de test
			await db.delete(folders);

			if (createdActiveProfileId) {
				await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
				createdActiveProfileId = null;
			}
		} catch (error) {
			console.error('[Test Cleanup] Error cleaning folders:', error);
		}
	});

	describe('CRUD Operations', () => {
		describe('create', () => {
			it('should create a root folder successfully', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const createInput = {
					name: 'Test Folder',
					path: '/test-folder',
					parentId: null,
				};

				const result = await runEffect(folderService.create(createInput));

				expect(result.name).toBe('Test Folder');
				expect(result.path).toBe('/test-folder');
				expect(result.parentId).toBe(null);
				expect(result.isFavorite).toBe(false);
				expect(result.totalFiles).toBe(0);
				expect(result.totalSize).toBe(0);
				expect(result._count).toBeDefined();
				expect(result._count?.children).toBe(0);
			});

			it('should create a subfolder successfully', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				// Crear carpeta padre
				const parent = await runEffect(
					folderService.create({
						name: 'Parent',
						path: '/parent',
						parentId: null,
					})
				);

				// Crear subcarpeta
				const child = await runEffect(
					folderService.create({
						name: 'Child',
						path: '/parent/child',
						parentId: parent.id,
					})
				);

				expect(child.name).toBe('Child');
				expect(child.parentId).toBe(parent.id);
				expect(child.path).toBe('/parent/child');
			});

			it('should fail when creating folder with duplicate path', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				// Crear primera carpeta
				await runEffect(
					folderService.create({
						name: 'First',
						path: '/duplicate-path',
						parentId: null,
					})
				);

				// Intentar crear segunda con mismo path
				const exit = await runEffectExpectFailure(
					folderService.create({
						name: 'Second',
						path: '/duplicate-path',
						parentId: null,
					})
				);

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderPathConflict);
				}
			});

			it('should fail when creating folder with duplicate name in same parent', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				// Crear carpeta padre
				const parent = await runEffect(
					folderService.create({
						name: 'Parent',
						path: '/parent',
						parentId: null,
					})
				);

				// Crear primera subcarpeta
				await runEffect(
					folderService.create({
						name: 'DuplicateName',
						path: '/parent/duplicate1',
						parentId: parent.id,
					})
				);

				// Intentar crear segunda con mismo nombre en mismo padre
				const exit = await runEffectExpectFailure(
					folderService.create({
						name: 'DuplicateName',
						path: '/parent/duplicate2',
						parentId: parent.id,
					})
				);

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderNameConflict);
				}
			});

			it('should fail when creating folder with non-existent parent', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const exit = await runEffectExpectFailure(
					folderService.create({
						name: 'Orphan',
						path: '/orphan',
						parentId: 'non-existent-id',
					})
				);

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderNotFound);
				}
			});
		});

		describe('getById', () => {
			it('should get a folder by id successfully', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				// Crear carpeta
				const created = await runEffect(
					folderService.create({
						name: 'Test Folder',
						path: '/test',
						parentId: null,
					})
				);

				// Obtener por ID
				const result = await runEffect(folderService.getById(created.id));

				expect(result.id).toBe(created.id);
				expect(result.name).toBe('Test Folder');
				expect(result._count).toBeDefined();
			});

			it('should fail when folder does not exist', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const exit = await runEffectExpectFailure(folderService.getById('non-existent-id'));

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderNotFound);
				}
			});
		});

		describe('getAll', () => {
			it('should get all folders with pagination', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				// Crear varias carpetas
				await runEffect(folderService.create({ name: 'Folder 1', path: '/folder1', parentId: null }));
				await runEffect(folderService.create({ name: 'Folder 2', path: '/folder2', parentId: null }));
				await runEffect(folderService.create({ name: 'Folder 3', path: '/folder3', parentId: null }));

				const result = await runEffect(folderService.getAll({ limit: 10, offset: 0 }));

				expect(result.folders.length).toBe(3);
				expect(result.total).toBe(3);
				expect(result.limit).toBe(10);
				expect(result.offset).toBe(0);
			});

			it('should filter folders by search term', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				await runEffect(folderService.create({ name: 'Photos', path: '/photos', parentId: null }));
				await runEffect(folderService.create({ name: 'Videos', path: '/videos', parentId: null }));
				await runEffect(folderService.create({ name: 'Documents', path: '/docs', parentId: null }));

				const result = await runEffect(folderService.getAll({ search: 'Photos' }));

				expect(result.folders.length).toBe(1);
				expect(result.folders[0].name).toBe('Photos');
			});

			it('should filter folders by parentId', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const parent = await runEffect(folderService.create({ name: 'Parent', path: '/parent', parentId: null }));

				await runEffect(folderService.create({ name: 'Child 1', path: '/parent/child1', parentId: parent.id }));
				await runEffect(folderService.create({ name: 'Child 2', path: '/parent/child2', parentId: parent.id }));
				await runEffect(folderService.create({ name: 'Root', path: '/root', parentId: null }));

				const result = await runEffect(folderService.getAll({ parentId: parent.id }));

				expect(result.folders.length).toBe(2);
				expect(result.folders.every((f) => f.parentId === parent.id)).toBe(true);
			});

			it('should filter favorites only', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);
				await ensureActiveProfile();

				const favoriteFolder = await runEffect(
					folderService.create({ name: 'Favorite', path: '/fav', parentId: null })
				);
				const staleProjection = await runEffect(
					folderService.create({ name: 'Stale', path: '/stale', parentId: null })
				);
				await runEffect(folderService.create({ name: 'Normal', path: '/normal', parentId: null }));

				await db.update(folders).set({ isFavorite: true }).where(eq(folders.id, staleProjection.id));
				await favoriteService.set(FavoriteEntityType.FOLDER, favoriteFolder.id, true);

				const result = await runEffect(folderService.getAll({ onlyFavorites: true }));

				expect(result.folders.length).toBe(1);
				expect(result.folders[0].id).toBe(favoriteFolder.id);
				expect(result.folders[0].isFavorite).toBe(true);
			});
		});

		describe('update', () => {
			it('should update folder successfully', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const created = await runEffect(
					folderService.create({
						name: 'Original',
						path: '/original',
						parentId: null,
					})
				);

				const updated = await runEffect(
					folderService.update(created.id, {
						name: 'Updated',
					})
				);

				expect(updated.id).toBe(created.id);
				expect(updated.name).toBe('Updated');
			});

			it('should fail when updating to duplicate path', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				await runEffect(folderService.create({ name: 'First', path: '/first', parentId: null }));
				const second = await runEffect(folderService.create({ name: 'Second', path: '/second', parentId: null }));

				const exit = await runEffectExpectFailure(folderService.update(second.id, { path: '/first' }));

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderPathConflict);
				}
			});

			it('should fail when updating non-existent folder', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const exit = await runEffectExpectFailure(folderService.update('non-existent', { name: 'New Name' }));

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderNotFound);
				}
			});
		});

		describe('delete', () => {
			it('should delete empty folder successfully', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const created = await runEffect(
					folderService.create({
						name: 'ToDelete',
						path: '/to-delete',
						parentId: null,
					})
				);

				await runEffect(folderService.delete(created.id));

				// Verificar que no existe
				const exit = await runEffectExpectFailure(folderService.getById(created.id));
				expect(Exit.isFailure(exit)).toBe(true);
			});

			it('should fail when deleting folder with children without force', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const parent = await runEffect(folderService.create({ name: 'Parent', path: '/parent', parentId: null }));
				await runEffect(folderService.create({ name: 'Child', path: '/parent/child', parentId: parent.id }));

				const exit = await runEffectExpectFailure(folderService.delete(parent.id, false));

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderHasChildrenError);
				}
			});

			it('should delete folder with children when force is true', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const parent = await runEffect(folderService.create({ name: 'Parent', path: '/parent', parentId: null }));
				await runEffect(folderService.create({ name: 'Child', path: '/parent/child', parentId: parent.id }));

				await runEffect(folderService.delete(parent.id, true));

				// Verificar que no existe
				const exit = await runEffectExpectFailure(folderService.getById(parent.id));
				expect(Exit.isFailure(exit)).toBe(true);
			});

			it('should fail when deleting non-existent folder', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const exit = await runEffectExpectFailure(folderService.delete('non-existent'));

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderNotFound);
				}
			});
		});

		describe('bulkDelete', () => {
			it('should delete multiple folders successfully', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const folder1 = await runEffect(folderService.create({ name: 'Folder 1', path: '/folder1', parentId: null }));
				const folder2 = await runEffect(folderService.create({ name: 'Folder 2', path: '/folder2', parentId: null }));

				const result = await runEffect(folderService.bulkDelete([folder1.id, folder2.id], false));

				expect(result.successful.length).toBe(2);
				expect(result.failed.length).toBe(0);
			});

			it('should handle partial failures in bulk delete', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const folder1 = await runEffect(folderService.create({ name: 'Folder 1', path: '/folder1', parentId: null }));

				const result = await runEffect(folderService.bulkDelete([folder1.id, 'non-existent'], false));

				expect(result.successful.length).toBe(1);
				expect(result.failed.length).toBe(1);
				expect(result.failed[0].id).toBe('non-existent');
			});
		});
	});

	describe('Hierarchical Operations', () => {
		describe('getTree', () => {
			it('should include non-image file counts for sidebar tree badges', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);
				const child = await runEffect(
					folderService.create({
						name: 'Docs Child',
						path: '/docs-child',
						parentId: null,
					})
				);

				await db.insert(documents).values({
					id: 'doc-sidebar-count-test',
					name: 'manual.pdf',
					path: '/docs-child/manual.pdf',
					size: 1234,
					hash: 'a'.repeat(64),
					mimeType: 'application/pdf',
					extension: '.pdf',
					folderId: child.id,
				});

				const result = await runEffect(folderService.getTree());
				const treeChild = result.find((folder) => folder.id === child.id);

				expect(treeChild?._count?.documents).toBe(1);
				expect(treeChild?._count?.totalFiles).toBe(1);
			});

			it('should count files by nested path even when folderId points to an ancestor folder', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);
				const parent = await runEffect(
					folderService.create({
						name: 'Parent Path Count',
						path: '/parent-path-count',
						parentId: null,
					})
				);
				const child = await runEffect(
					folderService.create({
						name: 'Child Path Count',
						path: '/parent-path-count/child-path-count',
						parentId: parent.id,
					})
				);

				await db.insert(documents).values({
					id: 'doc-sidebar-path-prefix-test',
					name: 'nested.pdf',
					path: '/parent-path-count/child-path-count/nested.pdf',
					size: 4321,
					hash: 'b'.repeat(64),
					mimeType: 'application/pdf',
					extension: '.pdf',
					folderId: parent.id,
				});

				const result = await runEffect(folderService.getTree());
				const treeParent = result.find((folder) => folder.id === parent.id);
				const treeChild = result.find((folder) => folder.id === child.id);

				expect(treeParent?._count?.documents).toBe(1);
				expect(treeParent?._count?.totalFiles).toBe(1);
				expect(treeChild?._count?.documents).toBe(1);
				expect(treeChild?._count?.totalFiles).toBe(1);
			});
		});

		describe('getChildren', () => {
			it('should get root folders when parentId is null', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				await runEffect(folderService.create({ name: 'Root 1', path: '/root1', parentId: null }));
				await runEffect(folderService.create({ name: 'Root 2', path: '/root2', parentId: null }));

				const result = await runEffect(folderService.getChildren(null));

				expect(result.length).toBe(2);
				expect(result.every((f) => f.parentId === null)).toBe(true);
			});

			it('should get children of a specific folder', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const parent = await runEffect(folderService.create({ name: 'Parent', path: '/parent', parentId: null }));

				await runEffect(folderService.create({ name: 'Child 1', path: '/parent/child1', parentId: parent.id }));
				await runEffect(folderService.create({ name: 'Child 2', path: '/parent/child2', parentId: parent.id }));

				const result = await runEffect(folderService.getChildren(parent.id));

				expect(result.length).toBe(2);
				expect(result.every((f) => f.parentId === parent.id)).toBe(true);
			});
		});

		describe('getAncestors', () => {
			it('should get ancestors of a nested folder', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				// Crear jerarquía: Root > Level1 > Level2 > Level3
				const root = await runEffect(folderService.create({ name: 'Root', path: '/root', parentId: null }));
				const level1 = await runEffect(
					folderService.create({ name: 'Level1', path: '/root/level1', parentId: root.id })
				);
				const level2 = await runEffect(
					folderService.create({ name: 'Level2', path: '/root/level1/level2', parentId: level1.id })
				);
				const level3 = await runEffect(
					folderService.create({ name: 'Level3', path: '/root/level1/level2/level3', parentId: level2.id })
				);

				const result = await runEffect(folderService.getAncestors(level3.id));

				expect(result.depth).toBe(3);
				expect(result.ancestors.length).toBe(3);
				expect(result.ancestors[0].name).toBe('Root');
				expect(result.ancestors[1].name).toBe('Level1');
				expect(result.ancestors[2].name).toBe('Level2');
			});

			it('should return empty ancestors for root folder', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const root = await runEffect(folderService.create({ name: 'Root', path: '/root', parentId: null }));

				const result = await runEffect(folderService.getAncestors(root.id));

				expect(result.depth).toBe(0);
				expect(result.ancestors.length).toBe(0);
			});

			it('should fail for non-existent folder', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const exit = await runEffectExpectFailure(folderService.getAncestors('non-existent'));

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderNotFound);
				}
			});
		});

		describe('moveTo', () => {
			it('should move folder to new parent successfully', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const parent1 = await runEffect(folderService.create({ name: 'Parent1', path: '/parent1', parentId: null }));
				const parent2 = await runEffect(folderService.create({ name: 'Parent2', path: '/parent2', parentId: null }));
				const child = await runEffect(
					folderService.create({ name: 'Child', path: '/parent1/child', parentId: parent1.id })
				);

				const moved = await runEffect(folderService.moveTo(child.id, parent2.id));

				expect(moved.id).toBe(child.id);
				expect(moved.parentId).toBe(parent2.id);
			});

			it('should move folder to root', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const parent = await runEffect(folderService.create({ name: 'Parent', path: '/parent', parentId: null }));
				const child = await runEffect(
					folderService.create({ name: 'Child', path: '/parent/child', parentId: parent.id })
				);

				const moved = await runEffect(folderService.moveTo(child.id, null));

				expect(moved.id).toBe(child.id);
				expect(moved.parentId).toBe(null);
			});

			it('should fail when creating circular reference', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				// Crear jerarquía: Parent > Child
				const parent = await runEffect(folderService.create({ name: 'Parent', path: '/parent', parentId: null }));
				const child = await runEffect(
					folderService.create({ name: 'Child', path: '/parent/child', parentId: parent.id })
				);

				// Intentar mover parent dentro de child (circular)
				const exit = await runEffectExpectFailure(folderService.moveTo(parent.id, child.id));

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderCircularReferenceError);
				}
			});

			it('should fail when moving to itself', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const folder = await runEffect(folderService.create({ name: 'Folder', path: '/folder', parentId: null }));

				const exit = await runEffectExpectFailure(folderService.moveTo(folder.id, folder.id));

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderCircularReferenceError);
				}
			});

			it('should fail when exceeding max depth', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				// Crear jerarquía profunda (11 niveles) para exceder MAX_DEPTH (10)
				let currentParent = await runEffect(folderService.create({ name: 'L0', path: '/l0', parentId: null }));

				for (let i = 1; i <= 10; i++) {
					currentParent = await runEffect(
						folderService.create({
							name: `L${i}`,
							path: `${currentParent.path}/l${i}`,
							parentId: currentParent.id,
						})
					);
				}

				// Intentar crear otra carpeta en el nivel 11
				const exit = await runEffectExpectFailure(
					folderService.create({
						name: 'L11',
						path: `${currentParent.path}/l11`,
						parentId: currentParent.id,
					})
				);

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderMaxDepthExceededError);
				}
			});

			it('should fail when name conflicts in new parent', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const parent1 = await runEffect(folderService.create({ name: 'Parent1', path: '/parent1', parentId: null }));
				const parent2 = await runEffect(folderService.create({ name: 'Parent2', path: '/parent2', parentId: null }));

				// Crear "Child" en parent1
				const child1 = await runEffect(
					folderService.create({ name: 'Child', path: '/parent1/child', parentId: parent1.id })
				);

				// Crear "Child" en parent2 (mismo nombre)
				await runEffect(folderService.create({ name: 'Child', path: '/parent2/child', parentId: parent2.id }));

				// Intentar mover child1 a parent2 (conflicto de nombre)
				const exit = await runEffectExpectFailure(folderService.moveTo(child1.id, parent2.id));

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderNameConflict);
				}
			});
		});

		describe('getByPath', () => {
			it('should get folder by path successfully', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const created = await runEffect(folderService.create({ name: 'Test', path: '/unique-path', parentId: null }));

				const result = await runEffect(folderService.getByPath('/unique-path'));

				expect(result.id).toBe(created.id);
				expect(result.path).toBe('/unique-path');
			});

			it('should fail when path does not exist', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const exit = await runEffectExpectFailure(folderService.getByPath('/non-existent-path'));

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderNotFound);
				}
			});
		});
	});

	describe('Stats & Favorites', () => {
		describe('toggleFavorite', () => {
			it('should toggle favorite from false to true', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);
				await ensureActiveProfile();

				const created = await runEffect(
					folderService.create({
						name: 'Test',
						path: '/test',
						parentId: null,
					})
				);

				expect(created.isFavorite).toBe(false);

				const toggled = await runEffect(folderService.toggleFavorite(created.id));

				expect(toggled.id).toBe(created.id);
				expect(toggled.isFavorite).toBe(true);
				expect(await favoriteService.isFavorite(FavoriteEntityType.FOLDER, created.id)).toBe(true);
			});

			it('should toggle favorite from true to false', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);
				await ensureActiveProfile();

				const created = await runEffect(
					folderService.create({
						name: 'Test',
						path: '/test',
						parentId: null,
					})
				);

				await favoriteService.set(FavoriteEntityType.FOLDER, created.id, true);

				expect(created.isFavorite).toBe(false);

				const toggled = await runEffect(folderService.toggleFavorite(created.id));

				expect(toggled.id).toBe(created.id);
				expect(toggled.isFavorite).toBe(false);
				expect(await favoriteService.isFavorite(FavoriteEntityType.FOLDER, created.id)).toBe(false);
			});

			it('should fail for non-existent folder', async () => {
				const service = Effect.gen(function* () {
					return yield* FolderService;
				});

				const folderService = await runEffect(service);

				const exit = await runEffectExpectFailure(folderService.toggleFavorite('non-existent'));

				expect(Exit.isFailure(exit)).toBe(true);
				if (Exit.isFailure(exit) && exit.cause._tag === 'Fail') {
					expect(exit.cause.error).toBeInstanceOf(FolderNotFound);
				}
			});
		});
	});
});

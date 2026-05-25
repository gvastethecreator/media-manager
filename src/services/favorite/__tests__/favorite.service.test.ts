import { and, eq, inArray } from 'drizzle-orm';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { db } from '@/lib/drizzle';
import { albums, favorites, folders, images, notes, profiles, properties, tags } from '@/lib/drizzle/schema';
import { FavoriteEntityType } from '@/types/entities/favorite';
import { favoriteService } from '../favorite.service';

describe('favoriteService', () => {
	const originalActiveProfileIds: string[] = [];
	const createdProfileIds: string[] = [];
	const createdFolderIds: string[] = [];
	const createdImageIds: string[] = [];
	const createdAlbumIds: string[] = [];
	const createdNoteIds: string[] = [];
	const createdTagIds: string[] = [];
	const createdPropertyIds: string[] = [];

	beforeAll(async () => {
		const activeProfiles = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true));
		originalActiveProfileIds.push(...activeProfiles.map((profile: { id: string }) => profile.id));
	});

	afterEach(async () => {
		try {
				if (createdTagIds.length > 0) {
					await db.delete(tags).where(inArray(tags.id, createdTagIds));
					createdTagIds.length = 0;
				}

				if (createdPropertyIds.length > 0) {
					await db.delete(properties).where(inArray(properties.id, createdPropertyIds));
					createdPropertyIds.length = 0;
				}

			if (createdImageIds.length > 0) {
				await db.delete(images).where(inArray(images.id, createdImageIds));
				createdImageIds.length = 0;
			}

			if (createdAlbumIds.length > 0) {
				await db.delete(albums).where(inArray(albums.id, createdAlbumIds));
				createdAlbumIds.length = 0;
			}

			if (createdNoteIds.length > 0) {
				await db.delete(notes).where(inArray(notes.id, createdNoteIds));
				createdNoteIds.length = 0;
			}

			if (createdFolderIds.length > 0) {
				await db.delete(folders).where(inArray(folders.id, createdFolderIds));
				createdFolderIds.length = 0;
			}

			if (createdProfileIds.length > 0) {
				await db.delete(favorites).where(inArray(favorites.profileId, createdProfileIds));
				await db.delete(profiles).where(inArray(profiles.id, createdProfileIds));
				createdProfileIds.length = 0;
			}

			await db.update(profiles).set({ isActive: false }).where(eq(profiles.isActive, true));

			for (const profileId of originalActiveProfileIds) {
				await db.update(profiles).set({ isActive: true }).where(eq(profiles.id, profileId));
			}
		} catch (error) {
			console.error('[FavoriteService test cleanup] Error cleaning profiles/favorites:', error);
		}
	});

	async function activateProfile(profileId: string) {
		await db.update(profiles).set({ isActive: false }).where(eq(profiles.isActive, true));
		await db.update(profiles).set({ isActive: true }).where(eq(profiles.id, profileId));
	}

	async function createProfile(name: string, isActive = false) {
		const profileId = `favorite-test-profile-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
		createdProfileIds.push(profileId);

		await db.insert(profiles).values({
			id: profileId,
			name,
			emoji: '⭐',
			color: '#3b82f6',
			description: `Perfil de prueba ${name}`,
			isActive: false,
			settingsId: null,
			imageId: null,
		});

		if (isActive) {
			await activateProfile(profileId);
		}

		return profileId;
	}

	async function createFolder(name: string) {
		const folderId = `favorite-test-folder-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
		createdFolderIds.push(folderId);

		await db.insert(folders).values({
			id: folderId,
			name,
			path: `/favorite-tests/${folderId}`,
			description: null,
		});

		return folderId;
	}

	async function createImage(name: string) {
		const folderId = await createFolder(`folder-for-${name}`);
		const imageId = `favorite-test-image-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
		createdImageIds.push(imageId);

		await db.insert(images).values({
			id: imageId,
			name,
			path: `/favorite-tests/${imageId}.png`,
			hash: `${imageId}`.padEnd(64, 'a').slice(0, 64),
			size: 1024,
			width: 256,
			height: 256,
			folderId,
			description: null,
			metadata: null,
			noteId: null,
		});

		return imageId;
	}

	async function createAlbum(name: string) {
		const albumId = `favorite-test-album-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
		createdAlbumIds.push(albumId);

		await db.insert(albums).values({
			id: albumId,
			name,
			description: null,
		});

		return albumId;
	}

	async function createNote(title: string) {
		const noteId = `favorite-test-note-${title}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
		createdNoteIds.push(noteId);

		await db.insert(notes).values({
			id: noteId,
			title,
			content: `Contenido de prueba para ${title}`,
			category: 'general',
			featuredImage: null,
		});

		return noteId;
	}

	async function createTag(name: string) {
		const tagId = `favorite-test-tag-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
		createdTagIds.push(tagId);

		await db.insert(tags).values({
			id: tagId,
			name,
			description: null,
			emoji: '🏷️',
			color: '#22c55e',
			category: null,
			featuredImage: null,
			isFavorite: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return tagId;
	}

	async function createProperty(name: string) {
		const propertyId = `favorite-test-property-${name}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
		createdPropertyIds.push(propertyId);

		await db.insert(properties).values({
			id: propertyId,
			name,
			description: null,
			emoji: '🔍',
			color: '#8b5cf6',
			shortcut: null,
			category: 'general',
			featuredImage: null,
			isFavorite: false,
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		return propertyId;
	}

	it('scopea favoritos al perfil activo y permite el mismo target en perfiles distintos', async () => {
		const profileA = await createProfile('scope-a', true);
		const profileB = await createProfile('scope-b');
		const entityId = await createImage('scope-shared-target');

		const firstToggle = await favoriteService.toggle(FavoriteEntityType.IMAGE, entityId);

		expect(firstToggle.isFavorite).toBe(true);
		expect(await favoriteService.isFavorite(FavoriteEntityType.IMAGE, entityId)).toBe(true);

		await activateProfile(profileB);
		expect(await favoriteService.isFavorite(FavoriteEntityType.IMAGE, entityId)).toBe(false);

		const secondToggle = await favoriteService.toggle(FavoriteEntityType.IMAGE, entityId);
		expect(secondToggle.isFavorite).toBe(true);

		const relations = await db
			.select({ id: favorites.id, profileId: favorites.profileId })
			.from(favorites)
			.where(and(eq(favorites.entityType, FavoriteEntityType.IMAGE), eq(favorites.entityId, entityId)));

		expect(relations).toHaveLength(2);
		expect(relations.map((relation: { profileId: string }) => relation.profileId).sort()).toEqual([
			profileA,
			profileB,
		].sort());
	});

	it('aísla getById, list y counts por perfil activo', async () => {
		const profileA = await createProfile('visibility-a', true);
		const profileB = await createProfile('visibility-b');
		const imageEntityId = await createImage('visibility-image');
		const albumEntityId = await createAlbum('visibility-album');

		const createdImageFavorite = await favoriteService.toggle(FavoriteEntityType.IMAGE, imageEntityId);
		const createdAlbumFavorite = await favoriteService.toggle(FavoriteEntityType.ALBUM, albumEntityId);

		expect(createdImageFavorite.id).toBeDefined();
		expect(createdAlbumFavorite.id).toBeDefined();

		const listForProfileA = await favoriteService.list({ sortBy: 'addedAt', sortOrder: 'desc' });
		expect(listForProfileA.total).toBe(2);
		expect(listForProfileA.items.every((favorite) => favorite.profileId === profileA)).toBe(true);

		const countsForProfileA = await favoriteService.getCountsByType();
		expect(countsForProfileA.image).toBe(1);
		expect(countsForProfileA.album).toBe(1);

		const visibleFavorite = await favoriteService.getById(createdImageFavorite.id!);
		expect(visibleFavorite?.profileId).toBe(profileA);

		await activateProfile(profileB);

		const hiddenFavorite = await favoriteService.getById(createdImageFavorite.id!);
		expect(hiddenFavorite).toBeNull();

		const listForProfileB = await favoriteService.list();
		expect(listForProfileB.total).toBe(0);
		expect(listForProfileB.items).toHaveLength(0);

		const countsForProfileB = await favoriteService.getCountsByType();
		expect(countsForProfileB.image ?? 0).toBe(0);
		expect(countsForProfileB.album ?? 0).toBe(0);
	});

	it('aplica búsqueda dentro del scope del perfil activo', async () => {
		await createProfile('search', true);
		const imageEntityId = await createImage('search-image');
		const noteEntityId = await createNote('search-note');

		await favoriteService.toggle(FavoriteEntityType.IMAGE, imageEntityId);
		await favoriteService.toggle(FavoriteEntityType.NOTE, noteEntityId);

		const searchByEntityId = await favoriteService.list({ search: 'search-image' });
		expect(searchByEntityId.total).toBe(1);
		expect(searchByEntityId.items[0]?.entityId).toBe(imageEntityId);

		const searchByEntityTypeLabel = await favoriteService.list({ search: 'nota' });
		expect(searchByEntityTypeLabel.total).toBe(1);
		expect(searchByEntityTypeLabel.items[0]?.entityType).toBe(FavoriteEntityType.NOTE);
	});

	it('rechaza favoritos para targets inexistentes', async () => {
		await createProfile('missing-target', true);

		await expect(favoriteService.toggle(FavoriteEntityType.IMAGE, 'missing-image-id')).rejects.toThrow(
			'No existe la entidad favorita image:missing-image-id'
		);

		const danglingFavorites = await db
			.select({ id: favorites.id })
			.from(favorites)
			.where(eq(favorites.entityId, 'missing-image-id'));

		expect(danglingFavorites).toHaveLength(0);
	});

	it('set establece estado explícito sin duplicar relaciones', async () => {
		await createProfile('explicit-set', true);
		const entityId = await createImage('explicit-set-image');

		const firstSet = await favoriteService.set(FavoriteEntityType.IMAGE, entityId, true);
		expect(firstSet.isFavorite).toBe(true);
		expect(firstSet.id).toBeDefined();

		const secondSet = await favoriteService.set(FavoriteEntityType.IMAGE, entityId, true);
		expect(secondSet.isFavorite).toBe(true);

		const relationsAfterDoubleSet = await db
			.select({ id: favorites.id })
			.from(favorites)
			.where(and(eq(favorites.entityType, FavoriteEntityType.IMAGE), eq(favorites.entityId, entityId)));

		expect(relationsAfterDoubleSet).toHaveLength(1);

		const unset = await favoriteService.set(FavoriteEntityType.IMAGE, entityId, false);
		expect(unset.isFavorite).toBe(false);
		expect(await favoriteService.isFavorite(FavoriteEntityType.IMAGE, entityId)).toBe(false);

		const relationsAfterUnset = await db
			.select({ id: favorites.id })
			.from(favorites)
			.where(and(eq(favorites.entityType, FavoriteEntityType.IMAGE), eq(favorites.entityId, entityId)));

		expect(relationsAfterUnset).toHaveLength(0);
	});

	it('setMany aplica estado explícito en lote para el perfil activo', async () => {
		await createProfile('batch-set', true);
		const imageA = await createImage('batch-set-a');
		const imageB = await createImage('batch-set-b');

		const addCount = await favoriteService.setMany(FavoriteEntityType.IMAGE, [imageA, imageB], true);
		expect(addCount).toBe(2);

		const favoritesAfterAdd = await favoriteService.list({ entityType: FavoriteEntityType.IMAGE });
		expect(favoritesAfterAdd.total).toBe(2);

		const secondAddCount = await favoriteService.setMany(FavoriteEntityType.IMAGE, [imageA, imageB], true);
		expect(secondAddCount).toBe(2);

		const relations = await db
			.select({ id: favorites.id })
			.from(favorites)
			.where(and(eq(favorites.entityType, FavoriteEntityType.IMAGE), inArray(favorites.entityId, [imageA, imageB])));

		expect(relations).toHaveLength(2);

		const removeCount = await favoriteService.setMany(FavoriteEntityType.IMAGE, [imageA, imageB], false);
		expect(removeCount).toBe(2);

		const favoritesAfterRemove = await favoriteService.list({ entityType: FavoriteEntityType.IMAGE });
		expect(favoritesAfterRemove.total).toBe(0);
	});

	it('incluye tag y property dentro del perímetro canónico de list y counts', async () => {
		await createProfile('expanded-canonical-perimeter', true);
		const tagId = await createTag('expanded-tag');
		const propertyId = await createProperty('expanded-property');

		await favoriteService.toggle(FavoriteEntityType.TAG, tagId);
		await favoriteService.toggle(FavoriteEntityType.PROPERTY, propertyId);

		const listResult = await favoriteService.list({ sortBy: 'entityType', sortOrder: 'asc' });
		expect(listResult.items.some((favorite) => favorite.entityType === FavoriteEntityType.TAG && favorite.entityId === tagId)).toBe(
			true
		);
		expect(
			listResult.items.some(
				(favorite) => favorite.entityType === FavoriteEntityType.PROPERTY && favorite.entityId === propertyId
			)
		).toBe(true);

		const countsByType = await favoriteService.getCountsByType();
		expect(countsByType.tag).toBe(1);
		expect(countsByType.property).toBe(1);
	});
});

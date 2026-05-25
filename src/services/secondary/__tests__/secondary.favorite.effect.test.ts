import { eq } from 'drizzle-orm';
import { Effect } from 'effect';
import { db } from '@/lib/drizzle';
import { favorites, groups, notes, profiles, properties, wildcards, worldItems } from '@/lib/drizzle/schema';
import { favoriteService } from '@/services/favorite/favorite.service';
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

const runGroupEffect = <A, E>(effect: Effect.Effect<A, E, GroupService>) =>
	Effect.runPromise(Effect.either(effect.pipe(Effect.provide(GroupServiceLive))));

const runWildcardEffect = <A, E>(effect: Effect.Effect<A, E, WildcardService>) =>
	Effect.runPromise(Effect.either(effect.pipe(Effect.provide(WildcardServiceLive))));

const runNoteEffect = <A, E>(effect: Effect.Effect<A, E, NoteService>) =>
	Effect.runPromise(Effect.either(effect.pipe(Effect.provide(NoteServiceLive))));

const runPropertyEffect = <A, E>(effect: Effect.Effect<A, E, PropertyService>) =>
	Effect.runPromise(Effect.either(effect.pipe(Effect.provide(PropertyServiceLive))));

const runWorldItemEffect = <A, E>(effect: Effect.Effect<A, E, WorldItemService>) =>
	Effect.runPromise(Effect.either(effect.pipe(Effect.provide(WorldItemServiceLive))));

const expectGroupSuccess = async <A, E>(effect: Effect.Effect<A, E, GroupService>) => {
	const either = await runGroupEffect(effect);
	if (either._tag === 'Right') {
		return either.right;
	}

	throw new Error('Expected group effect success but got failure');
};

const expectWildcardSuccess = async <A, E>(effect: Effect.Effect<A, E, WildcardService>) => {
	const either = await runWildcardEffect(effect);
	if (either._tag === 'Right') {
		return either.right;
	}

	throw new Error('Expected wildcard effect success but got failure');
};

const expectNoteSuccess = async <A, E>(effect: Effect.Effect<A, E, NoteService>) => {
	const either = await runNoteEffect(effect);
	if (either._tag === 'Right') {
		return either.right;
	}

	throw new Error('Expected note effect success but got failure');
};

const expectPropertySuccess = async <A, E>(effect: Effect.Effect<A, E, PropertyService>) => {
	const either = await runPropertyEffect(effect);
	if (either._tag === 'Right') {
		return either.right;
	}

	throw new Error('Expected property effect success but got failure');
};

const expectWorldItemSuccess = async <A, E>(effect: Effect.Effect<A, E, WorldItemService>) => {
	const either = await runWorldItemEffect(effect);
	if (either._tag === 'Right') {
		return either.right;
	}

	throw new Error('Expected world item effect success but got failure');
};

let createdActiveProfileId: string | null = null;

const buildUniqueLabel = (label: string) => {
	const prefix = `t${Date.now().toString(36)}${Math.random().toString(16).slice(2, 6)}`;
	return `${prefix}-${label}`;
};

const ensureActiveProfile = async () => {
	const [activeProfile] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.isActive, true)).limit(1);

	if (activeProfile) {
		return activeProfile.id;
	}

	const profileId = `secondary-favorites-test-profile-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	createdActiveProfileId = profileId;

	await db.insert(profiles).values({
		id: profileId,
		name: 'Secondary Favorites Test Profile',
		emoji: '⭐',
		color: '#8b5cf6',
		description: 'Perfil activo para tests de favoritos secundarios',
		isActive: true,
		settingsId: null,
		imageId: null,
	});

	return profileId;
};

const createGroup = async (name: string, input?: { isFavorite?: boolean }) => {
	const unique = buildUniqueLabel(name);

	return expectGroupSuccess(
		Effect.gen(function* () {
			const service = yield* GroupService;
			return yield* service.create({
				name: unique,
				description: 'Test group',
				isFavorite: input?.isFavorite,
			});
		})
	);
};

const createWildcard = async (name: string, input?: { isFavorite?: boolean }) => {
	const unique = buildUniqueLabel(name);

	return expectWildcardSuccess(
		Effect.gen(function* () {
			const service = yield* WildcardService;
			return yield* service.create({
				name: unique,
				description: 'Test wildcard',
				isFavorite: input?.isFavorite,
			});
		})
	);
};

const createNote = async (title: string, input?: { isFavorite?: boolean }) => {
	const unique = buildUniqueLabel(title);

	return expectNoteSuccess(
		Effect.gen(function* () {
			const service = yield* NoteService;
			return yield* service.create({
				title: unique,
				content: 'Test note content',
				category: 'test',
				isFavorite: input?.isFavorite,
			});
		})
	);
};

const createProperty = async (name: string, input?: { isFavorite?: boolean }) => {
	const unique = buildUniqueLabel(name);

	return expectPropertySuccess(
		Effect.gen(function* () {
			const service = yield* PropertyService;
			return yield* service.create({
				name: unique,
				description: 'Test property',
				isFavorite: input?.isFavorite,
			});
		})
	);
};

const createWorldItem = async (name: string, input?: { isFavorite?: boolean }) => {
	const unique = buildUniqueLabel(name);

	return expectWorldItemSuccess(
		Effect.gen(function* () {
			const service = yield* WorldItemService;
			return yield* service.create({
				name: unique,
				description: 'Test world item',
				isFavorite: input?.isFavorite,
			});
		})
	);
};

afterEach(async () => {
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.GROUP));
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.NOTE));
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.PROPERTY));
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.WILDCARD));
	await db.delete(favorites).where(eq(favorites.entityType, FavoriteEntityType.WORLD_ITEM));
	await db.delete(worldItems);
	await db.delete(properties);
	await db.delete(notes);
	await db.delete(wildcards);
	await db.delete(groups);

	if (createdActiveProfileId) {
		await db.delete(profiles).where(eq(profiles.id, createdActiveProfileId));
		createdActiveProfileId = null;
	}
});

describe('Secondary services favorites convergence', () => {
	describe('GroupService', () => {
		it('create persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();

			const created = await createGroup('group-create-canonical-favorite', { isFavorite: true });

			expect(created.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.GROUP, created.id)).toBe(true);
		});

		it('uses canonical favorites for onlyFavorites', async () => {
			await ensureActiveProfile();
			const canonicalFavorite = await createGroup('group-canonical-favorite');
			await createGroup('group-regular');

			await favoriteService.set(FavoriteEntityType.GROUP, canonicalFavorite.id, true);

			const result = await expectGroupSuccess(
				Effect.gen(function* () {
					const service = yield* GroupService;
					return yield* service.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
				})
			);

			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.id).toBe(canonicalFavorite.id);
			expect(result.data[0]?.isFavorite).toBe(true);
		});

		it('update persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const group = await createGroup('group-update-target');

			const updated = await expectGroupSuccess(
				Effect.gen(function* () {
					const service = yield* GroupService;
					return yield* service.update(group.id, { isFavorite: true });
				})
			);

			expect(updated.id).toBe(group.id);
			expect(updated.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.GROUP, group.id)).toBe(true);
		});

		it('toggleFavorite delegates to the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const group = await createGroup('group-toggle-target');

			const toggled = await expectGroupSuccess(
				Effect.gen(function* () {
					const service = yield* GroupService;
					return yield* service.toggleFavorite(group.id);
				})
			);

			expect(toggled.id).toBe(group.id);
			expect(toggled.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.GROUP, group.id)).toBe(true);
		});

		it('toggleFavorite can remove the canonical favorite again', async () => {
			await ensureActiveProfile();
			const group = await createGroup('group-toggle-roundtrip-target');

			const favorited = await expectGroupSuccess(
				Effect.gen(function* () {
					const service = yield* GroupService;
					return yield* service.toggleFavorite(group.id);
				})
			);

			expect(favorited.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.GROUP, group.id)).toBe(true);

			const unfavorited = await expectGroupSuccess(
				Effect.gen(function* () {
					const service = yield* GroupService;
					return yield* service.toggleFavorite(group.id);
				})
			);

			expect(unfavorited.isFavorite).toBe(false);
			expect(await favoriteService.isFavorite(FavoriteEntityType.GROUP, group.id)).toBe(false);
		});
	});

	describe('WildcardService', () => {
		it('create persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();

			const created = await createWildcard('wildcard-create-canonical-favorite', { isFavorite: true });

			expect(created.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.WILDCARD, created.id)).toBe(true);
		});

		it('uses canonical favorites for onlyFavorites and ignores stale projection', async () => {
			await ensureActiveProfile();
			const canonicalFavorite = await createWildcard('wildcard-canonical-favorite');
			const staleProjection = await createWildcard('wildcard-stale-projection');
			await createWildcard('wildcard-regular');

			await db.update(wildcards).set({ isFavorite: true }).where(eq(wildcards.id, staleProjection.id));
			await favoriteService.set(FavoriteEntityType.WILDCARD, canonicalFavorite.id, true);

			const result = await expectWildcardSuccess(
				Effect.gen(function* () {
					const service = yield* WildcardService;
					return yield* service.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
				})
			);

			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.id).toBe(canonicalFavorite.id);
			expect(result.data[0]?.isFavorite).toBe(true);
		});

		it('update persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const wildcard = await createWildcard('wildcard-update-target');

			const updated = await expectWildcardSuccess(
				Effect.gen(function* () {
					const service = yield* WildcardService;
					return yield* service.update(wildcard.id, { isFavorite: true });
				})
			);

			expect(updated.id).toBe(wildcard.id);
			expect(updated.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.WILDCARD, wildcard.id)).toBe(true);
		});

		it('toggleFavorite delegates to the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const wildcard = await createWildcard('wildcard-toggle-target');

			const toggled = await expectWildcardSuccess(
				Effect.gen(function* () {
					const service = yield* WildcardService;
					return yield* service.toggleFavorite(wildcard.id);
				})
			);

			expect(toggled.id).toBe(wildcard.id);
			expect(toggled.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.WILDCARD, wildcard.id)).toBe(true);
		});

		it('toggleFavorite can remove the canonical favorite again', async () => {
			await ensureActiveProfile();
			const wildcard = await createWildcard('wildcard-toggle-roundtrip-target');

			const favorited = await expectWildcardSuccess(
				Effect.gen(function* () {
					const service = yield* WildcardService;
					return yield* service.toggleFavorite(wildcard.id);
				})
			);

			expect(favorited.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.WILDCARD, wildcard.id)).toBe(true);

			const unfavorited = await expectWildcardSuccess(
				Effect.gen(function* () {
					const service = yield* WildcardService;
					return yield* service.toggleFavorite(wildcard.id);
				})
			);

			expect(unfavorited.isFavorite).toBe(false);
			expect(await favoriteService.isFavorite(FavoriteEntityType.WILDCARD, wildcard.id)).toBe(false);
		});
	});

	describe('NoteService', () => {
		it('create persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();

			const created = await createNote('note-create-canonical-favorite', { isFavorite: true });

			expect(created.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.NOTE, created.id)).toBe(true);
		});

		it('uses canonical favorites for onlyFavorites and ignores stale projection', async () => {
			await ensureActiveProfile();
			const canonicalFavorite = await createNote('note-canonical-favorite');
			const staleProjection = await createNote('note-stale-projection');
			await createNote('note-regular');

			await db.update(notes).set({ isFavorite: true }).where(eq(notes.id, staleProjection.id));
			await favoriteService.set(FavoriteEntityType.NOTE, canonicalFavorite.id, true);

			const result = await expectNoteSuccess(
				Effect.gen(function* () {
					const service = yield* NoteService;
					return yield* service.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
				})
			);

			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.id).toBe(canonicalFavorite.id);
			expect(result.data[0]?.isFavorite).toBe(true);
		});

		it('update persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const note = await createNote('note-update-target');

			const updated = await expectNoteSuccess(
				Effect.gen(function* () {
					const service = yield* NoteService;
					return yield* service.update(note.id, { isFavorite: true });
				})
			);

			expect(updated.id).toBe(note.id);
			expect(updated.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.NOTE, note.id)).toBe(true);
		});

		it('toggleFavorite delegates to the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const note = await createNote('note-toggle-target');

			const toggled = await expectNoteSuccess(
				Effect.gen(function* () {
					const service = yield* NoteService;
					return yield* service.toggleFavorite(note.id);
				})
			);

			expect(toggled.id).toBe(note.id);
			expect(toggled.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.NOTE, note.id)).toBe(true);
		});

		it('toggleFavorite can remove the canonical favorite again', async () => {
			await ensureActiveProfile();
			const note = await createNote('note-toggle-roundtrip-target');

			const favorited = await expectNoteSuccess(
				Effect.gen(function* () {
					const service = yield* NoteService;
					return yield* service.toggleFavorite(note.id);
				})
			);

			expect(favorited.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.NOTE, note.id)).toBe(true);

			const unfavorited = await expectNoteSuccess(
				Effect.gen(function* () {
					const service = yield* NoteService;
					return yield* service.toggleFavorite(note.id);
				})
			);

			expect(unfavorited.isFavorite).toBe(false);
			expect(await favoriteService.isFavorite(FavoriteEntityType.NOTE, note.id)).toBe(false);
		});
	});

	describe('PropertyService', () => {
		it('create persists favorite state through the local favorite flag', async () => {
			await ensureActiveProfile();

			const created = await createProperty('property-create-canonical-favorite', { isFavorite: true });

			expect(created.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.PROPERTY, created.id)).toBe(false);
		});

		it('uses the embedded favorite flag for onlyFavorites and ignores stale canonical rows', async () => {
			await ensureActiveProfile();
			const localFavorite = await createProperty('property-local-favorite', { isFavorite: true });
			const staleCanonical = await createProperty('property-stale-canonical');
			await createProperty('property-regular');

			await favoriteService.set(FavoriteEntityType.PROPERTY, staleCanonical.id, true);

			const result = await expectPropertySuccess(
				Effect.gen(function* () {
					const service = yield* PropertyService;
					return yield* service.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
				})
			);

			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.id).toBe(localFavorite.id);
			expect(result.data[0]?.isFavorite).toBe(true);
		});

		it('update persists favorite state through the local favorite flag', async () => {
			await ensureActiveProfile();
			const property = await createProperty('property-update-target');

			const updated = await expectPropertySuccess(
				Effect.gen(function* () {
					const service = yield* PropertyService;
					return yield* service.update(property.id, { isFavorite: true });
				})
			);

			expect(updated.id).toBe(property.id);
			expect(updated.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.PROPERTY, property.id)).toBe(false);
		});

		it('toggleFavorite alternates the local favorite flag', async () => {
			await ensureActiveProfile();
			const property = await createProperty('property-toggle-target');

			const toggled = await expectPropertySuccess(
				Effect.gen(function* () {
					const service = yield* PropertyService;
					return yield* service.toggleFavorite(property.id);
				})
			);

			expect(toggled.id).toBe(property.id);
			expect(toggled.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.PROPERTY, property.id)).toBe(false);
		});
	});

	describe('WorldItemService', () => {
		it('create persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();

			const created = await createWorldItem('world-item-create-canonical-favorite', { isFavorite: true });

			expect(created.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.WORLD_ITEM, created.id)).toBe(true);
		});

		it('uses canonical favorites for onlyFavorites and ignores stale projection', async () => {
			await ensureActiveProfile();
			const canonicalFavorite = await createWorldItem('world-item-canonical-favorite');
			const staleProjection = await createWorldItem('world-item-stale-projection');
			await createWorldItem('world-item-regular');

			await db.update(worldItems).set({ isFavorite: true }).where(eq(worldItems.id, staleProjection.id));
			await favoriteService.set(FavoriteEntityType.WORLD_ITEM, canonicalFavorite.id, true);

			const result = await expectWorldItemSuccess(
				Effect.gen(function* () {
					const service = yield* WorldItemService;
					return yield* service.getAll({ onlyFavorites: true, limit: 50, offset: 0 });
				})
			);

			expect(result.data).toHaveLength(1);
			expect(result.data[0]?.id).toBe(canonicalFavorite.id);
			expect(result.data[0]?.isFavorite).toBe(true);
		});

		it('update persists favorite state through the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const worldItem = await createWorldItem('world-item-update-target');

			const updated = await expectWorldItemSuccess(
				Effect.gen(function* () {
					const service = yield* WorldItemService;
					return yield* service.update(worldItem.id, { isFavorite: true });
				})
			);

			expect(updated.id).toBe(worldItem.id);
			expect(updated.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.WORLD_ITEM, worldItem.id)).toBe(true);
		});

		it('toggleFavorite delegates to the canonical favorite bridge', async () => {
			await ensureActiveProfile();
			const worldItem = await createWorldItem('world-item-toggle-target');

			const toggled = await expectWorldItemSuccess(
				Effect.gen(function* () {
					const service = yield* WorldItemService;
					return yield* service.toggleFavorite(worldItem.id);
				})
			);

			expect(toggled.id).toBe(worldItem.id);
			expect(toggled.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.WORLD_ITEM, worldItem.id)).toBe(true);
		});

		it('toggleFavorite can remove the canonical favorite again', async () => {
			await ensureActiveProfile();
			const worldItem = await createWorldItem('world-item-toggle-roundtrip-target');

			const favorited = await expectWorldItemSuccess(
				Effect.gen(function* () {
					const service = yield* WorldItemService;
					return yield* service.toggleFavorite(worldItem.id);
				})
			);

			expect(favorited.isFavorite).toBe(true);
			expect(await favoriteService.isFavorite(FavoriteEntityType.WORLD_ITEM, worldItem.id)).toBe(true);

			const unfavorited = await expectWorldItemSuccess(
				Effect.gen(function* () {
					const service = yield* WorldItemService;
					return yield* service.toggleFavorite(worldItem.id);
				})
			);

			expect(unfavorited.isFavorite).toBe(false);
			expect(await favoriteService.isFavorite(FavoriteEntityType.WORLD_ITEM, worldItem.id)).toBe(false);
		});
	});
});
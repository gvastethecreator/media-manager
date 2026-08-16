import * as crypto from 'node:crypto';
import { and, eq, inArray } from 'drizzle-orm';
import type { LibSQLTransaction } from 'drizzle-orm/libsql';
import { favorites, profiles } from '@/lib/drizzle/schema';
import { emit } from '@/lib/server/events.server';
import type { FavoriteEntityType } from '@/types/entities/favorite';

export type FavoriteWriteTransaction = LibSQLTransaction<Record<string, never>, Record<string, never>>;

export interface FavoriteWriteResult {
	changed: boolean;
	profileId: string;
}

export async function setFavoriteForActiveProfile(
	transaction: FavoriteWriteTransaction,
	entityType: FavoriteEntityType,
	entityId: string,
	isFavorite: boolean
): Promise<string> {
	return (await setFavoriteStateForActiveProfile(transaction, entityType, entityId, isFavorite)).profileId;
}

export async function setFavoriteStateForActiveProfile(
	transaction: FavoriteWriteTransaction,
	entityType: FavoriteEntityType,
	entityId: string,
	isFavorite: boolean
): Promise<FavoriteWriteResult> {
	const activeProfiles = await transaction
		.select({ id: profiles.id })
		.from(profiles)
		.where(eq(profiles.isActive, true))
		.limit(2);
	if (activeProfiles.length !== 1) {
		throw new Error(`Se esperaba exactamente un perfil activo y se encontraron ${activeProfiles.length}.`);
	}

	const profileId = activeProfiles[0].id;
	const existing = await transaction
		.select({ id: favorites.id })
		.from(favorites)
		.where(
			and(eq(favorites.profileId, profileId), eq(favorites.entityType, entityType), eq(favorites.entityId, entityId))
		)
		.limit(1);

	if (isFavorite && existing.length === 0) {
		await transaction.insert(favorites).values({
			id: crypto.randomUUID(),
			profileId,
			entityType,
			entityId,
			addedAt: new Date(),
		});
	} else if (!isFavorite && existing.length > 0) {
		await transaction.delete(favorites).where(eq(favorites.id, existing[0].id));
	}

	return { profileId, changed: isFavorite ? existing.length === 0 : existing.length > 0 };
}

export async function deleteFavoriteRecordsForEntities(
	transaction: FavoriteWriteTransaction,
	entityType: FavoriteEntityType,
	entityIds: string[]
): Promise<void> {
	const uniqueEntityIds = [...new Set(entityIds)];
	if (uniqueEntityIds.length === 0) return;
	await transaction
		.delete(favorites)
		.where(and(eq(favorites.entityType, entityType), inArray(favorites.entityId, uniqueEntityIds)));
}

export async function emitCommittedFavoriteChange(
	profileId: string,
	entityType: FavoriteEntityType,
	entityId: string,
	isFavorite: boolean
): Promise<void> {
	await emit({
		type: 'favorites:modified',
		data: { action: isFavorite ? 'added' : 'removed', profileId, entityType, entityId },
	});
}

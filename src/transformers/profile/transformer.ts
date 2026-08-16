/**
 * @file Transformador principal para la entidad Profile
 * @module transformers/profile/transformer
 
 */

import { createDefaultEntityStats } from '@/lib/utils';
import { normalizeCounts, sumCounts, STANDARD_COUNT_KEYS } from '../common/counts';
import { TransformerError } from '../../lib/errors/transformer-error';
import { serverLogger } from '../../lib/logger/server-logger';
import type { ProfileStatistics, ProfileWithStats } from '../../types/entities/profile';

const logger = serverLogger.withContext('ProfileTransformer');

/**
 * Transforma un objeto Profile de Drizzle a ProfileWithStats
 */
export function fromDrizzleProfile(drizzleProfile: any): ProfileWithStats {
	if (!drizzleProfile) {
		throw new TransformerError('El objeto de perfil de Drizzle no puede ser nulo.');
	}

	try {
		const { _count, ...baseData } = drizzleProfile;

		const counts = normalizeCounts(_count);

		const stats: ProfileStatistics = {
			...createDefaultEntityStats({
				lastUpdated: baseData.updatedAt ?? new Date(),
				mtime: baseData.updatedAt ?? new Date(),
				birthtime: baseData.createdAt ?? new Date(),
				type: 'profile',
			}),
			// Conteos canónicos
			imageCount: counts.images,
			videoCount: counts.videos,
			albumCount: counts.albums,
			collectionCount: counts.collections,
			tagCount: counts.tags,
			characterCount: counts.characters,
			placeCount: counts.places,
			worldItemCount: counts.worldItems,
			conceptCount: counts.concepts,
			promptCount: counts.prompts,
			noteCount: counts.notes,
			wildcardCount: counts.wildcards,
			propertyCount: counts.properties,
			groupCount: counts.groups,
			// Totales derivados
			totalItems: 1,
			totalAssociations: sumCounts(_count, STANDARD_COUNT_KEYS),
			// Campos específicos de Profile
			folderCount: _count?.folders || 0,
			lastAccessed: _count?.lastActivity || baseData.updatedAt || null,
			totalStorageUsed: _count?.totalStorageUsed || 0,
			activeDays: _count?.activeDays || 0,
			createdThisMonth: _count?.createdThisMonth || 0,
			// Compat y flags
			joinDate: baseData.createdAt,
			isVerified: !!(baseData.isActive && baseData.email),
		};

		return {
			...baseData,
			stats,
			entityType: 'profile' as const,
		};
	} catch (error) {
		logger.error('Error transformando perfil desde Drizzle', {
			error,
			profileId: drizzleProfile?.id,
		});
		throw new TransformerError(`Error al transformar el perfil: ${(error as Error).message}`);
	}
}

/**
 * Transforma una lista de perfiles de Drizzle a ProfileWithStats[]
 */
export function fromDrizzleProfiles(drizzleProfiles: any[]): ProfileWithStats[] {
	return drizzleProfiles.map(fromDrizzleProfile);
}

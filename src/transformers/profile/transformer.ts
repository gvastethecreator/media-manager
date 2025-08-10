/**
 * @file Transformador principal para la entidad Profile
 * @module transformers/profile/transformer
 
 */

import { createDefaultEntityStats } from '@/lib/utils';
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

		const stats: ProfileStatistics = {
			...createDefaultEntityStats({
				lastUpdated: baseData.updatedAt ?? new Date(),
				mtime: baseData.updatedAt ?? new Date(),
				birthtime: baseData.createdAt ?? new Date(),
				type: 'profile',
			}),
			// Conteos canónicos
			imageCount: _count?.images || 0,
			videoCount: _count?.videos || 0,
			albumCount: _count?.albums || 0,
			collectionCount: _count?.collections || 0,
			tagCount: _count?.tags || 0,
			characterCount: _count?.characters || 0,
			placeCount: _count?.places || 0,
			worldItemCount: _count?.worldItems || 0,
			conceptCount: _count?.concepts || 0,
			promptCount: _count?.prompts || 0,
			noteCount: _count?.notes || 0,
			wildcardCount: _count?.wildcards || 0,
			propertyCount: _count?.properties || 0,
			groupCount: _count?.groups || 0,
			// Totales derivados
			totalItems: 1,
			totalAssociations:
				(_count?.images || 0) +
				(_count?.videos || 0) +
				(_count?.albums || 0) +
				(_count?.collections || 0) +
				(_count?.tags || 0) +
				(_count?.characters || 0) +
				(_count?.places || 0) +
				(_count?.worldItems || 0) +
				(_count?.concepts || 0) +
				(_count?.prompts || 0) +
				(_count?.notes || 0) +
				(_count?.wildcards || 0) +
				(_count?.properties || 0) +
				(_count?.groups || 0),
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

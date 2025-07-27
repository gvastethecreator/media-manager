/**
 * @file Transformador principal para la entidad Profile
 * @module transformers/profile/transformer
 
 */

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
			imageCount: _count?.images || 0,
			videoCount: _count?.videos || 0,
			albumCount: _count?.albums || 0,
			folderCount: _count?.folders || 0,
			tagCount: _count?.tags || 0,
			placeCount: _count?.places || 0,
			lastAccessed: _count?.lastActivity || baseData.updatedAt,
			totalStorageUsed: _count?.totalStorageUsed || 0,
			activeDays: _count?.activeDays || 0,
			createdThisMonth: _count?.createdThisMonth || 0,
			// Propiedades adicionales para compatibilidad
			joinDate: baseData.createdAt,
			totalImages: _count?.images || 0,
			totalVideos: _count?.videos || 0,
			totalCollections: _count?.collections || 0,
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

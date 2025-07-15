/**
 * @file Transformador principal para la entidad Profile
 * @module transformers/profile/transformer
 
 */

import { serverLogger } from '@/lib/logger/server-logger';
import { TransformerError } from '@/lib/utils/transformers/errors';
import type { ProfileStatistics, ProfileWithStats } from '@/types/entities/profile';

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
			totalImages: _count?.images || 0,
			totalVideos: _count?.videos || 0,
			totalCollections: _count?.collections || 0,
			totalFavorites: _count?.favorites || 0,
			totalActivities: _count?.activities || 0,
			lastActivity: _count?.lastActivity || baseData.updatedAt,
			joinDate: baseData.createdAt,
			isVerified: !!(baseData.isActive && baseData.email),
		};

		return {
			...baseData,
			stats,
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

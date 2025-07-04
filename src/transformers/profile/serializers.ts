/**
 * @file Serializadores para la entidad Profile
 * @module transformers/profile/serializers
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import type { ProfileWithStats } from '@/types/entities/profile';

/**
 * Serializa un objeto Profile para respuesta de API
 */
export function serializeProfile(profile: ProfileWithStats) {
	return {
		id: profile.id,
		name: profile.name,
		email: profile.email,
		avatar: profile.avatar,
		bio: profile.bio,
		website: profile.website,
		location: profile.location,
		isActive: profile.isActive,
		preferences: profile.preferences,
		createdAt: profile.createdAt.toISOString(),
		updatedAt: profile.updatedAt.toISOString(),
		stats: profile.stats,
	};
}

/**
 * Serializa un objeto Profile sin información sensible (público)
 */
export function serializePublicProfile(profile: ProfileWithStats) {
	return {
		id: profile.id,
		name: profile.name,
		avatar: profile.avatar,
		bio: profile.bio,
		website: profile.website,
		location: profile.location,
		joinDate: profile.stats.joinDate.toISOString(),
		stats: {
			totalImages: profile.stats.totalImages,
			totalVideos: profile.stats.totalVideos,
			totalCollections: profile.stats.totalCollections,
			isVerified: profile.stats.isVerified,
		},
	};
}

/**
 * Serializa un array de Profiles para respuesta de API
 */
export function serializeProfiles(profiles: ProfileWithStats[]) {
	return profiles.map(serializeProfile);
}
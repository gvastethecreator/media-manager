/**
 * @file Serializadores para la entidad Profile
 * @module transformers/profile/serializers
 
 */

import { ProfileWithStats } from '../../types/entities/profile';

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
		joinDate: profile.stats.joinDate?.toISOString() || new Date().toISOString(),
		stats: {
			imageCount: profile.stats.imageCount,
			videoCount: profile.stats.videoCount,
			collectionCount: profile.stats.collectionCount,
			isVerified: profile.stats.isVerified ?? false,
		},
	};
}

/**
 * Serializa un array de Profiles para respuesta de API
 */
export function serializeProfiles(profiles: ProfileWithStats[]) {
	return profiles.map(serializeProfile);
}

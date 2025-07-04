/**
 * @file Mappers para la entidad Profile
 * @module transformers/profile/mappers
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import type { ProfileBase, ProfileCreateInput, ProfileUpdateInput } from '@/types/entities/profile';

/**
 * Mapea datos de creación a formato Drizzle
 */
export function mapCreateProfileDataToDrizzle(data: ProfileCreateInput) {
	return {
		id: crypto.randomUUID(),
		name: data.name,
		email: data.email,
		avatar: data.avatar || null,
		bio: data.bio || null,
		website: data.website || null,
		location: data.location || null,
		isActive: data.isActive ?? true,
		preferences: data.preferences || {},
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

/**
 * Mapea datos de actualización a formato Drizzle
 */
export function mapUpdateProfileDataToDrizzle(data: ProfileUpdateInput) {
	return {
		...data,
		updatedAt: new Date(),
	};
}

/**
 * Convierte Profile a formato Drizzle
 */
export function toDrizzleProfile(profile: ProfileBase) {
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
		createdAt: profile.createdAt,
		updatedAt: profile.updatedAt,
	};
}
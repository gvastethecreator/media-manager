/**
 * @file Mappers para la entidad Profile
 * @module transformers/profile/mappers
 
 */

import type { ProfileBase, ProfileCreateInput, ProfileUpdateInput } from '@/types/entities/profile/types';

/**
 * Mapea datos de creación a formato Drizzle
 */
export function mapCreateProfileDataToDrizzle(data: ProfileCreateInput) {
	return {
		id: crypto.randomUUID(),
		name: data.name,
		emoji: data.emoji || '👤',
		color: data.color || '#3B82F6',
		description: data.description || null,
		isActive: data.isActive ?? true,
		createdAt: new Date(),
		updatedAt: new Date(),
		settingsId: null,
		imageId: null,
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
		emoji: profile.emoji,
		color: profile.color,
		description: profile.description,
		isActive: profile.isActive,
		createdAt: profile.createdAt,
		updatedAt: profile.updatedAt,
		settingsId: profile.settingsId,
		imageId: profile.imageId,
	};
}

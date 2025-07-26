/**
 * @file Validadores para la entidad Profile
 * @module transformers/profile/validators
 
 */

import { z } from 'zod';
import type { ProfileBase, ProfileCreateInput, ProfileUpdateInput } from '../../types/entities/profile';

export const ProfileCreateSchema = z.object({
	name: z.string().min(1).max(100),
	email: z.string().email(),
	avatar: z.string().url().optional(),
	bio: z.string().max(500).optional(),
	website: z.string().url().optional(),
	location: z.string().max(100).optional(),
	isActive: z.boolean().default(true),
	preferences: z.any().default({}),
});

export const ProfileUpdateSchema = z.object({
	name: z.string().min(1).max(100).optional(),
	email: z.string().email().optional(),
	avatar: z.string().url().optional(),
	bio: z.string().max(500).optional(),
	website: z.string().url().optional(),
	location: z.string().max(100).optional(),
	isActive: z.boolean().optional(),
	preferences: z.any().optional(),
});

export const ProfileSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	email: z.string().email(),
	avatar: z.string().nullable(),
	bio: z.string().nullable(),
	website: z.string().nullable(),
	location: z.string().nullable(),
	isActive: z.boolean(),
	preferences: z.any(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export function validateProfileCreate(data: unknown) {
	return ProfileCreateSchema.parse(data);
}

export function validateProfileUpdate(data: unknown) {
	return ProfileUpdateSchema.parse(data);
}

export function validateProfile(data: unknown) {
	return ProfileSchema.parse(data);
}

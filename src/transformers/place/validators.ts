/**
 * @file Validadores para la entidad Place
 * @module transformers/place/validators
 * ✅ MIGRADO A DRIZZLE - Sin dependencias de Prisma
 */

import { z } from 'zod';

export const PlaceCreateSchema = z.object({
	name: z.string().min(1).max(255),
	description: z.string().max(1000).optional(),
	type: z.string().max(100),
	coordinates: z.object({
		lat: z.number().min(-90).max(90),
		lng: z.number().min(-180).max(180),
	}).optional(),
	address: z.string().max(500).optional(),
	country: z.string().max(100).optional(),
	region: z.string().max(100).optional(),
	city: z.string().max(100).optional(),
	isFavorite: z.boolean().default(false),
});

export const PlaceUpdateSchema = z.object({
	name: z.string().min(1).max(255).optional(),
	description: z.string().max(1000).optional(),
	type: z.string().max(100).optional(),
	coordinates: z.object({
		lat: z.number().min(-90).max(90),
		lng: z.number().min(-180).max(180),
	}).optional(),
	address: z.string().max(500).optional(),
	country: z.string().max(100).optional(),
	region: z.string().max(100).optional(),
	city: z.string().max(100).optional(),
	isFavorite: z.boolean().optional(),
});

export const PlaceSchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	description: z.string().nullable(),
	type: z.string(),
	coordinates: z.any().nullable(),
	address: z.string().nullable(),
	country: z.string().nullable(),
	region: z.string().nullable(),
	city: z.string().nullable(),
	isFavorite: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});

export function validatePlaceCreate(data: unknown) {
	return PlaceCreateSchema.parse(data);
}

export function validatePlaceUpdate(data: unknown) {
	return PlaceUpdateSchema.parse(data);
}

export function validatePlace(data: unknown) {
	return PlaceSchema.parse(data);
}
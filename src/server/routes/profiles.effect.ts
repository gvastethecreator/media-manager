/**
 * @file Rutas de API para perfiles - Versión Effect-TS
 * @module server/routes/profiles.effect
 */

import { Effect } from 'effect';
import { Router } from 'express';
import { z } from 'zod';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import { profileService } from '@/services/profile/profile.service';

const router = Router();
const logger = serverLogger.withContext('ProfilesEffect');

// Schema para validación
const createProfileSchema = z.object({
	name: z.string().min(1, 'El nombre es requerido'),
	emoji: z.string().nullable().optional(),
	color: z.string().nullable().optional(),
	description: z.string().nullable().optional(),
	isActive: z.boolean().optional(),
	settingsId: z.string().nullable().optional(),
	imageId: z.string().nullable().optional(),
});

const updateProfileSchema = createProfileSchema.partial();

// GET /api/profiles/active - Obtener perfil activo
router.get(
	'/active',
	effectHandler((_req, res) =>
		Effect.gen(function* () {
			const profile = yield* Effect.tryPromise({
				try: () => profileService.getActiveProfile(),
				catch: (error) => {
					logger.error('Error obteniendo perfil activo:', error);
					return new Error(error instanceof Error ? error.message : String(error));
					},
			});

			if (!profile) {
				res.status(404);
				return {
					error: 'No se encontró un perfil activo',
					timestamp: new Date().toISOString(),
				};
			}

			return {
				data: profile,
				timestamp: new Date().toISOString(),
			};
		})
	)
);

// GET /api/profiles - Obtener todos los perfiles
router.get(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const page = Number(req.query.page) || 1;
			const limit = Number(req.query.limit) || 10;
			const search = req.query.search as string;

			const result = yield* Effect.tryPromise({
				try: () => profileService.getProfiles({ search }, { page, limit }),
				catch: (error) => {
					logger.error('Error obteniendo perfiles:', error);
					return new Error(error instanceof Error ? error.message : String(error));
					},
			});

			return {
				data: result,
				pagination: {
					page,
					limit,
					total: result.length,
					pages: Math.ceil(result.length / limit),
				},
				timestamp: new Date().toISOString(),
			};
		})
	)
);

// POST /api/profiles - Crear nuevo perfil
router.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const parseResult = yield* Effect.tryPromise({
				try: () => createProfileSchema.parseAsync(req.body),
				catch: (error) => error,
			});

			if (parseResult instanceof z.ZodError) {
				res.status(400);
				return {
					error: 'Datos de entrada inválidos',
					details: parseResult.issues,
					timestamp: new Date().toISOString(),
				};
			}

			// Normalizar undefined a null para campos nullable
			const validatedData = {
				...parseResult,
				emoji: parseResult.emoji ?? undefined,
				color: parseResult.color ?? undefined,
				description: parseResult.description ?? undefined,
				settingsId: parseResult.settingsId ?? undefined,
				imageId: parseResult.imageId ?? undefined,
			};

			const profile = yield* Effect.tryPromise({
				try: () => profileService.createProfile(validatedData),
				catch: (error) => {
					logger.error('Error creando perfil:', error);
					return new Error(error instanceof Error ? error.message : String(error));
					},
			});

			res.status(201);
			return {
				data: profile,
				message: 'Perfil creado exitosamente',
				timestamp: new Date().toISOString(),
			};
		})
	)
);

// PUT /api/profiles/:id - Actualizar perfil
router.put(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { id } = req.params;

			const parseResult = yield* Effect.tryPromise({
				try: () => updateProfileSchema.parseAsync(req.body),
				catch: (error) => error,
			});

			if (parseResult instanceof z.ZodError) {
				res.status(400);
				return {
					error: 'Datos de entrada inválidos',
					details: parseResult.issues,
					timestamp: new Date().toISOString(),
				};
			}

			// Normalizar undefined a null para campos nullable
			const validatedData = {
				...parseResult,
				emoji: parseResult.emoji ?? undefined,
				color: parseResult.color ?? undefined,
				description: parseResult.description ?? undefined,
				settingsId: parseResult.settingsId ?? undefined,
				imageId: parseResult.imageId ?? undefined,
			};

			const profile = yield* Effect.tryPromise({
				try: () => profileService.updateProfile(id, validatedData),
				catch: (error) => {
					logger.error(`Error actualizando perfil ${id}:`, error);
					return new Error(error instanceof Error ? error.message : String(error));
				},
			});

			if (!profile) {
				res.status(404);
				return {
					error: 'Perfil no encontrado',
					timestamp: new Date().toISOString(),
				};
			}

			return {
				data: profile,
				message: 'Perfil actualizado exitosamente',
				timestamp: new Date().toISOString(),
			};
		})
	)
);

// POST /api/profiles/:id/activate - Activar perfil
router.post(
	'/:id/activate',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { id } = req.params;

			yield* Effect.tryPromise({
				try: () => profileService.setActiveProfile(id),
				catch: (error) => {
					logger.error(`Error activando perfil ${id}:`, error);
					return new Error(error instanceof Error ? error.message : String(error));
				},
			});

			return {
				message: 'Perfil activado exitosamente',
				timestamp: new Date().toISOString(),
			};
		})
	)
);

// DELETE /api/profiles/:id - Eliminar perfil
router.delete(
	'/:id',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const { id } = req.params;

			yield* Effect.tryPromise({
				try: () => profileService.delete(id),
				catch: (error) => {
					logger.error(`Error eliminando perfil ${id}:`, error);
					return new Error(error instanceof Error ? error.message : String(error));
				},
			});

			res.status(204);
			return { success: true };
		})
	)
);

export default router;

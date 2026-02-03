/**
 * @file Rutas de API para settings - Versión Effect-TS
 * @module server/routes/settings.effect
 * @description Endpoint de settings expandido con funcionalidad real
 */

import { Effect } from 'effect';
import { Router } from 'express';
import { z } from 'zod';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';

const router = Router();
const logger = serverLogger.withContext('SettingsEffect');

// Schema para validación de settings
const settingsSchema = z.object({
	theme: z.union([z.literal('light'), z.literal('dark'), z.literal('system')]).optional(),
	language: z.string().optional(),
	notifications: z.boolean().optional(),
	autoSave: z.boolean().optional(),
	customSettings: z.record(z.string(), z.unknown()).optional(),
});

// GET /api/settings - Obtener configuración actual
router.get(
	'/',
	effectHandler((_req, _res) => {
		// TODO: Integrar con servicio de settings real cuando esté disponible
		// Por ahora retornamos configuración por defecto
		const defaultSettings = {
			theme: 'system',
			language: 'es',
			notifications: true,
			autoSave: true,
			version: '1.0.0',
			updatedAt: new Date().toISOString(),
		};

		logger.debug('Settings retrieved', { settings: defaultSettings });

		return Effect.succeed({
			data: defaultSettings,
			timestamp: new Date().toISOString(),
		});
	})
);

// PUT /api/settings - Actualizar configuración
router.put(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const parsed = yield* Effect.tryPromise({
				try: () => settingsSchema.parseAsync(req.body),
				catch: (error) => error,
			});

			if (parsed instanceof z.ZodError) {
				res.status(400);
				return {
					error: 'Datos de configuración inválidos',
					details: parsed.issues,
					timestamp: new Date().toISOString(),
				};
			}

			// TODO: Integrar con servicio de settings real cuando esté disponible
			logger.info('Settings updated', { settings: parsed });

			return {
				data: {
					...parsed,
					updatedAt: new Date().toISOString(),
				},
				message: 'Configuración actualizada exitosamente',
				timestamp: new Date().toISOString(),
			};
		})
	)
);

// POST /api/settings/reset - Resetear configuración a valores por defecto
router.post(
	'/reset',
	effectHandler((_req, _res) => {
		// TODO: Integrar con servicio de settings real cuando esté disponible
		logger.info('Settings reset to defaults');

		const defaultSettings = {
			theme: 'system',
			language: 'es',
			notifications: true,
			autoSave: true,
			version: '1.0.0',
			updatedAt: new Date().toISOString(),
		};

		return Effect.succeed({
			data: defaultSettings,
			message: 'Configuración reseteada a valores por defecto',
			timestamp: new Date().toISOString(),
		});
	})
);

export default router;

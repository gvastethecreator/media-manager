/**
 * @file Rutas de API para settings - Versión Effect-TS
 * @module server/routes/settings.effect
 * @description Endpoint de settings integrado con servicio real
 */

import { Effect } from 'effect';
import { Router } from 'express';
import { z } from 'zod';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import { settingsService } from '@/services/settings/settings.service';

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
	effectHandler((_req, _res) =>
		Effect.gen(function* () {
			const settings = yield* Effect.tryPromise({
				try: () => settingsService.getSystemSettings(),
				catch: (error) => error,
			});

			logger.debug('Settings retrieved');

			return {
				data: settings,
				timestamp: new Date().toISOString(),
			};
		})
	)
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

			const updated = yield* Effect.tryPromise({
				try: () => settingsService.updateSystemSettings(parsed as Record<string, unknown>),
				catch: (error) => error,
			});

			logger.info('Settings updated');

			return {
				data: updated,
				message: 'Configuración actualizada exitosamente',
				timestamp: new Date().toISOString(),
			};
		})
	)
);

// POST /api/settings/reset - Resetear configuración a valores por defecto
router.post(
	'/reset',
	effectHandler((_req, _res) =>
		Effect.gen(function* () {
			const settings = yield* Effect.tryPromise({
				try: () => settingsService.resetSystemSettings(),
				catch: (error) => error,
			});

			logger.info('Settings reset to defaults');

			return {
				data: settings,
				message: 'Configuración reseteada a valores por defecto',
				timestamp: new Date().toISOString(),
			};
		})
	)
);

export default router;

/**
 * @file Rutas de API para manejo de eventos del sistema - Versión Effect-TS
 * @module server/routes/events.effect
 * @description Versión Effect-TS de las rutas de eventos
 */

import { Effect } from 'effect';
import express from 'express';
import { z } from 'zod';
import { effectHandler } from '@/lib/effect/adapters/express.adapter';
import { serverLogger } from '@/lib/logger/server-logger';
import type { EventData, EventType } from '@/lib/server/events.server';
import { getEventStore, getEventSubscribers } from '@/lib/server/events.server';

const router = express.Router();
const logger = serverLogger.withContext('EventsEffect');

// Usar el store compartido
const eventStore = getEventStore();
const eventSubscribers = getEventSubscribers();

// Schema para validación de eventos - usar enum de EventType
const eventSchema = z.object({
	type: z.string().min(1, 'Tipo de evento requerido'),
	id: z.string().optional(),
	objectId: z.string().optional(),
	worldItemId: z.string().optional(),
	imageId: z.string().optional(),
	data: z.record(z.string(), z.unknown()).optional(),
	timestamp: z.number().optional(),
});

/**
 * POST /api/events - Recibir y procesar eventos del sistema
 */
router.post(
	'/',
	effectHandler((req, res) =>
		Effect.gen(function* () {
			const parsed = yield* Effect.tryPromise({
				try: () => eventSchema.parseAsync(req.body),
				catch: (error) => error,
			});

			if (parsed instanceof z.ZodError) {
				res.status(400);
				return {
					error: 'Tipo de evento requerido',
					code: 'INVALID_EVENT_TYPE',
					details: parsed.issues,
				};
			}

			// Crear evento con type cast para EventType
			const event: EventData = {
				...parsed,
				type: parsed.type as EventType,
			};

			logger.info('📢 Evento recibido:', {
				type: event.type,
				id: event.id,
				data: event.data,
			});

			// Almacenar evento (para debugging)
			const eventKey = event.type;
			if (!eventStore.has(eventKey)) {
				eventStore.set(eventKey, []);
			}
			eventStore.get(eventKey)?.push({
				...event,
				timestamp: Date.now(),
			});

			// Mantener solo los últimos 100 eventos por tipo
			const events = eventStore.get(eventKey);
			if (events && events.length > 100) {
				events.splice(0, events.length - 100);
			}

			// Notificar a suscriptores (para futuras implementaciones de WebSocket/SSE)
			for (const subscriber of eventSubscribers) {
				try {
					subscriber(event);
				} catch (error) {
					logger.error('Error notificando suscriptor:', error);
				}
			}

			// Respuesta exitosa
			return {
				success: true,
				message: 'Evento procesado correctamente',
				eventType: event.type,
				timestamp: Date.now(),
			};
		})
	)
);

// Tipos para respuestas de eventos
interface EventsListResponse {
	count?: number;
	events?: EventData[];
	summary?: Array<{ type: string; count: number; lastEvent: number | null }>;
	total?: number;
	totalTypes?: number;
	type?: string;
}

/**
 * GET /api/events - Obtener eventos almacenados (para debugging)
 */
router.get(
	'/',
	effectHandler((req, _res) => {
		const { type, limit = '50' } = req.query;

		if (type && typeof type === 'string') {
			// Obtener eventos de un tipo específico
			const events = eventStore.get(type) || [];
			const limitedEvents = events.slice(-Number(limit));

			const response: EventsListResponse = {
				type,
				count: limitedEvents.length,
				total: events.length,
				events: limitedEvents,
			};

			return Effect.succeed(response);
		}

		// Obtener resumen de todos los tipos de eventos
		const summary = Array.from(eventStore.entries()).map(([eventType, events]) => ({
			type: eventType,
			count: events.length,
			lastEvent: events.at(-1)?.timestamp || null,
		}));

		const response: EventsListResponse = {
			totalTypes: summary.length,
			summary,
		};

		return Effect.succeed(response);
	})
);

/**
 * DELETE /api/events - Limpiar eventos almacenados
 */
router.delete(
	'/',
	effectHandler((req, _res) => {
		const { type } = req.query;

		if (type && typeof type === 'string') {
			// Limpiar eventos de un tipo específico
			eventStore.delete(type);
			logger.info(`🧹 Eventos del tipo '${type}' eliminados`);

			return Effect.succeed({
				success: true,
				message: `Eventos del tipo '${type}' eliminados`,
			});
		}

		// Limpiar todos los eventos
		eventStore.clear();
		logger.info('🧹 Todos los eventos eliminados');

		return Effect.succeed({
			success: true,
			message: 'Todos los eventos eliminados',
		});
	})
);

/**
 * GET /api/events/stream - Eventos SSE en tiempo real
 * Nota: SSE requiere manejo de streaming, mantenemos implementación tradicional
 */
router.get('/stream', async (req, res) => {
	try {
		const HEARTBEAT_INTERVAL = 15_000;
		res.set({
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache, no-transform',
			Connection: 'keep-alive',
			'X-Accel-Buffering': 'no',
			'Access-Control-Allow-Origin': '*',
		});

		const send = (event: string, data: Record<string, unknown> | string) => {
			const formatted = typeof data === 'string' ? data : JSON.stringify(data);
			res.write(`event: ${event}\ndata: ${formatted}\n\n`);
		};

		const heartbeat = setInterval(() => {
			send('heartbeat', { timestamp: Date.now() });
		}, HEARTBEAT_INTERVAL);

		// Manejador de eventos del store
		const eventHandler = (event: EventData) => {
			try {
				// Filtrar solo eventos de folders
				if (event.type.startsWith('folder:')) {
					send('event', {
						type: event.type,
						data: event.data,
						timestamp: Date.now(),
					});
				}
			} catch (error) {
				logger.error('Error enviando evento SSE:', error);
			}
		};

		// Suscribirse a eventos
		eventSubscribers.add(eventHandler);

		// Cleanup al cerrar conexión
		req.on('close', () => {
			clearInterval(heartbeat);
			eventSubscribers.delete(eventHandler);
			logger.info('🧹 Cliente SSE desconectado');
		});

		// Enviar confirmación de conexión
		send('connected', { timestamp: Date.now() });
		logger.info('🔌 Cliente SSE conectado');
	} catch (error) {
		logger.error('Error en conexión SSE:', error);
		res.status(500).json({ error: 'Error interno del servidor' });
	}
});

export default router;

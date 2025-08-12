/**
 * @file Rutas de API para manejo de eventos del sistema
 * @module server/routes/events
 * ✅ CREADO PARA RESOLVER 404 EN /api/events - 2025-07-14
 */

import express from 'express';
import { serverLogger } from '@/lib/logger/server-logger';
import type { EventData } from '@/lib/server/events.server';

const router = express.Router();
const logger = serverLogger.withContext('EventsAPI');

// Importar el store compartido desde events.server.ts
import { getEventStore, getEventSubscribers } from '@/lib/server/events.server';

// Usar el store compartido
const eventStore = getEventStore();
const eventSubscribers = getEventSubscribers();

/**
 * POST /api/events - Recibir y procesar eventos del sistema
 */
router.post('/', async (req, res) => {
	try {
		const event: EventData = req.body;

		logger.info('📢 Evento recibido:', {
			type: event.type,
			id: event.id,
			data: event.data,
		});

		// Validar estructura del evento
		if (!event.type) {
			res.status(400).json({
				error: 'Tipo de evento requerido',
				code: 'INVALID_EVENT_TYPE',
			});
			return;
		}

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
		res.status(200).json({
			success: true,
			message: 'Evento procesado correctamente',
			eventType: event.type,
			timestamp: Date.now(),
		});
	} catch (error) {
		logger.error('Error procesando evento:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			code: 'INTERNAL_SERVER_ERROR',
			details: error instanceof Error ? error.message : 'Error desconocido',
		});
	}
});

/**
 * GET /api/events - Obtener eventos almacenados (para debugging)
 */
router.get('/', async (req, res) => {
	try {
		const { type, limit = 50 } = req.query;

		if (type && typeof type === 'string') {
			// Obtener eventos de un tipo específico
			const events = eventStore.get(type) || [];
			const limitedEvents = events.slice(-Number(limit));

			res.json({
				type,
				count: limitedEvents.length,
				total: events.length,
				events: limitedEvents,
			});
		} else {
			// Obtener resumen de todos los tipos de eventos
			const summary = Array.from(eventStore.entries()).map(([eventType, events]) => ({
				type: eventType,
				count: events.length,
				lastEvent: events.at(-1)?.timestamp || null,
			}));

			res.json({
				totalTypes: summary.length,
				summary,
			});
		}
	} catch (error) {
		logger.error('Error obteniendo eventos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			code: 'INTERNAL_SERVER_ERROR',
		});
	}
});

/**
 * DELETE /api/events - Limpiar eventos almacenados
 */
router.delete('/', async (req, res) => {
	try {
		const { type } = req.query;

		if (type && typeof type === 'string') {
			// Limpiar eventos de un tipo específico
			eventStore.delete(type);
			logger.info(`🧹 Eventos del tipo '${type}' eliminados`);

			res.json({
				success: true,
				message: `Eventos del tipo '${type}' eliminados`,
			});
		} else {
			// Limpiar todos los eventos
			eventStore.clear();
			logger.info('🧹 Todos los eventos eliminados');

			res.json({
				success: true,
				message: 'Todos los eventos eliminados',
			});
		}
	} catch (error) {
		logger.error('Error eliminando eventos:', error);
		res.status(500).json({
			error: 'Error interno del servidor',
			code: 'INTERNAL_SERVER_ERROR',
		});
	}
});

/**
 * GET /api/events/stream - Eventos SSE en tiempo real
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

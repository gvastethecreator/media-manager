import type { Request, Response } from 'express';
import { serverLogger } from '../logger/server-logger';

// Interfaz para las opciones del logger de API
interface ApiLoggerOptions {
	showHeaders?: boolean;
	showBody?: boolean;
	showQuery?: boolean;
	sensitiveHeaders?: string[];
	sensitiveBodyFields?: string[];
}

// Opciones predeterminadas
const defaultOptions: ApiLoggerOptions = {
	showHeaders: true,
	showBody: true,
	showQuery: true,
	sensitiveHeaders: ['authorization', 'cookie', 'x-auth-token'],
	sensitiveBodyFields: ['password', 'token', 'secret', 'key'],
};

/**
 * Logger específico para rutas API con funciones mejoradas para registrar solicitudes y respuestas
 */
export const apiLogger = {
	/**
	 * Crea un logger para una ruta API específica
	 * @param routeName Nombre de la ruta API
	 * @param options Opciones de configuración
	 */
	createRouteLogger: (routeName: string, customOptions: Partial<ApiLoggerOptions> = {}) => {
		const options = { ...defaultOptions, ...customOptions };
		const logger = serverLogger.withContext(`API:${routeName}`);

		// Función para filtrar campos sensibles
		const filterSensitiveData = (obj: Record<string, unknown>, sensitiveFields: string[]): Record<string, unknown> => {
			if (!obj || typeof obj !== 'object') return obj;

			const result = { ...obj };
			for (const key of Object.keys(result)) {
				if (sensitiveFields.includes(key.toLowerCase())) {
					result[key] = '[REDACTED]';
				} else if (typeof result[key] === 'object' && result[key] !== null) {
					result[key] = filterSensitiveData(result[key] as Record<string, unknown>, sensitiveFields);
				}
			}
			return result;
		};

		// Función para filtrar headers sensibles
		const filterHeaders = (headers: Record<string, string | string[] | undefined>): Record<string, string> => {
			const headersObj: Record<string, string> = {};
			for (const [key, value] of Object.entries(headers)) {
				const headerValue = Array.isArray(value) ? value.join(', ') : (value ?? '');
				if (options.sensitiveHeaders?.includes(key.toLowerCase())) {
					headersObj[key] = '[REDACTED]';
				} else {
					headersObj[key] = headerValue;
				}
			}
			return headersObj;
		};

		return {
			/**
			 * Registra una solicitud entrante
			 * @param req Objeto Request
			 */
			logRequest: (req: Request) => {
				const requestId = (req.headers['x-request-id'] as string | undefined) ?? `req_${Date.now()}`;
				const startTime = Date.now();

				const logData: Record<string, unknown> = {
					method: req.method,
					url: req.originalUrl || req.url,
					requestId,
				};

				if (options.showQuery) {
					logData.query = req.query;
				}

				if (options.showHeaders) {
					logData.headers = filterHeaders(req.headers as Record<string, string | string[] | undefined>);
				}

				if (options.showBody && req.body) {
					logData.body = filterSensitiveData(req.body as Record<string, unknown>, options.sensitiveBodyFields || []);
				}

				logger.http(`Solicitud recibida: ${req.method} ${req.path}`, logData, requestId, startTime);

				return { requestId, startTime, path: req.path };
			},

			/**
			 * Registra una respuesta saliente
			 * @param res Objeto Response
			 * @param requestInfo Información de la solicitud original
			 */
			logResponse: (res: Response, requestInfo: { requestId: string; startTime: number; path?: string }) => {
				const { requestId, startTime, path } = requestInfo;
				const responseTime = Date.now() - startTime;

				const logData: Record<string, unknown> = {
					status: res.statusCode,
					statusText: res.statusMessage,
					responseTime: `${responseTime}ms`,
					requestId,
				};

				if (options.showHeaders) {
					logData.headers = filterHeaders(res.getHeaders() as Record<string, string | string[] | undefined>);
				}

				// Determinar el nivel de log basado en el código de estado
				const statusCode = res.statusCode;
				if (statusCode >= 500) {
					logger.error(
						`Respuesta enviada: ${statusCode} ${res.statusMessage || ''} (${responseTime}ms)`,
						logData,
						requestId
					);
				} else if (statusCode >= 400) {
					logger.warn(
						`Respuesta enviada: ${statusCode} ${res.statusMessage || ''} (${responseTime}ms)`,
						logData,
						requestId
					);
				} else {
					logger.info(
						`Respuesta enviada: ${statusCode} ${res.statusMessage || ''} (${responseTime}ms)`,
						logData,
						requestId
					);
				}

				return responseTime;
			},

			/**
			 * Registra un error en la ruta API
			 * @param error Error ocurrido
			 * @param requestInfo Información de la solicitud original
			 */
			logError: (error: Error, requestInfo: { requestId: string; startTime: number; path?: string }) => {
				const { requestId, startTime, path } = requestInfo;
				const responseTime = Date.now() - startTime;

				logger.error(
					`Error en la ruta API${path ? ` ${path}` : ''}: ${error.message}`,
					{
						error: {
							name: error.name,
							message: error.message,
							stack: error.stack,
						},
						requestId,
						responseTime: `${responseTime}ms`,
					},
					requestId
				);
			},

			// Exponer el logger base para otras operaciones
			logger,
		};
	},
};

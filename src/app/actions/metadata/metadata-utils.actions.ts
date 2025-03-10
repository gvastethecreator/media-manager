'use server';

import { logger } from '@/lib/logger';
import { DEFAULT_RETRY_CONFIG, type ImageFormat, type RetryConfig } from './metadata-types.actions';

const metadataLogger = logger.withContext('MetadataUtils');

/**
 * Implementa un mecanismo de retry con backoff exponencial y jitter opcional
 * @template T El tipo de dato que devuelve la función
 * @param fn Función a ejecutar que puede lanzar excepciones
 * @param config Configuración del mecanismo de retry
 * @returns Resultado de la función o lanza una excepción si agota los reintentos
 */
export async function withRetry<T>(fn: () => T | Promise<T>, config: RetryConfig = DEFAULT_RETRY_CONFIG): Promise<T> {
	let lastError: Error | undefined;

	for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
		try {
			const result = fn();
			// Si el resultado es una promesa, esperamos su resolución
			if (result instanceof Promise) {
				return await result;
			}
			// Si no es una promesa, lo devolvemos directamente
			return result;
		} catch (error) {
			lastError = error instanceof Error ? error : new Error(String(error));

			if (attempt === config.maxAttempts) {
				break;
			}

			// Cálculo del delay con backoff exponencial
			const backoffDelay = Math.min(config.maxDelay, config.initialDelay * config.backoffFactor ** (attempt - 1));

			// Añadir jitter si está configurado
			const jitter = config.jitter ? Math.random() * 0.3 : 0;
			const delay = Math.floor(backoffDelay * (1 + jitter));

			metadataLogger.warn(`Intento ${attempt}/${config.maxAttempts} fallido. Reintentando en ${delay}ms...`, {
				error: lastError.message,
				attempt,
				delay,
			});

			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError;
}

/**
 * Verifica si el formato de archivo es un formato de imagen soportado
 */
export async function isSupportedImageFormat(path: string): Promise<boolean> {
	const supportedFormats = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.tiff', '.tif', '.bmp', '.svg', '.avif'];
	const extension = path.toLowerCase().slice(path.lastIndexOf('.'));
	return supportedFormats.includes(extension);
}

/**
 * Obtiene el formato de imagen basado en la extensión del archivo
 * @returns Formato de imagen normalizado (siempre en minúsculas)
 */
export async function getImageFormat(path: string): Promise<ImageFormat> {
	const extension = path.toLowerCase().slice(path.lastIndexOf('.') + 1);

	// Mapeo de extensiones a formatos normalizados de ImageFormat
	const formatMap: Record<string, ImageFormat> = {
		jpg: 'jpeg',
		jpeg: 'jpeg',
		png: 'png',
		gif: 'gif',
		webp: 'webp',
		tif: 'tiff',
		tiff: 'tiff',
		bmp: 'bmp',
		svg: 'svg',
		avif: 'avif',
	};

	return formatMap[extension] || 'unknown';
}

/**
 * 🌐 Middleware de Headers HTTP Optimizados para Thumbnails
 * Implementación según Plan Mínimo Disruptivo Fase 2
 */

import { Request, Response, NextFunction } from 'express';
import { createHash } from 'crypto';
import { thumbsConfig } from '@/config/thumbs';
import { serverLogger } from '@/lib/logger/server-logger';

const httpCacheLogger = serverLogger.withContext('HTTPCache');

export interface CacheOptions {
	etag?: boolean;
	lastModified?: boolean;
	immutable?: boolean;
	maxAge?: number;
	vary?: string[];
	customHeaders?: Record<string, string>;
}

/**
 * 🏷️ Genera ETag optimizado
 */
export function generateETag(content: Buffer | string): string {
	const hash = createHash('md5');
	hash.update(content);
	return `"${hash.digest('hex')}"`;
}

/**
 * 📅 Formatea fecha para headers HTTP
 */
export function formatHttpDate(date: Date): string {
	return date.toUTCString();
}

/**
 * 🚀 Middleware principal de cache para thumbnails
 */
export function thumbnailCacheMiddleware(options: CacheOptions = {}) {
	return (req: Request, res: Response, next: NextFunction) => {
		const {
			etag = thumbsConfig.http.etag,
			lastModified = thumbsConfig.http.lastModified,
			immutable = thumbsConfig.http.immutable,
			maxAge = thumbsConfig.http.maxAgeSeconds,
			vary = ['Accept-Encoding'],
			customHeaders = {},
		} = options;

		// Headers base de cache
		const cacheControl = immutable 
			? `public, max-age=${maxAge}, immutable`
			: `public, max-age=${maxAge}`;
		
		res.set('Cache-Control', cacheControl);

		// Headers de optimización
		if (vary.length > 0) {
			res.set('Vary', vary.join(', '));
		}

		// Headers de seguridad
		res.set('X-Content-Type-Options', 'nosniff');
		res.set('X-Frame-Options', 'DENY');

		// Headers personalizados
		for (const [key, value] of Object.entries(customHeaders)) {
			res.set(key, value);
		}

		// Interceptar response para añadir ETag y Last-Modified
		const originalSend = res.send;
		const originalJson = res.json;

		res.send = function(body: any) {
			if (etag && body instanceof Buffer) {
				const etagValue = generateETag(body);
				res.set('ETag', etagValue);
				
				// Verificar If-None-Match
				const ifNoneMatch = req.get('If-None-Match');
				if (ifNoneMatch === etagValue) {
					httpCacheLogger.debug(`🎯 ETag match para ${req.path}, enviando 304`);
					return res.status(304).end();
				}
			}

			if (lastModified && !res.get('Last-Modified')) {
				res.set('Last-Modified', formatHttpDate(new Date()));
			}

			return originalSend.call(this, body);
		};

		res.json = function(obj: any) {
			if (etag) {
				const etagValue = generateETag(JSON.stringify(obj));
				res.set('ETag', etagValue);
				
				// Verificar If-None-Match
				const ifNoneMatch = req.get('If-None-Match');
				if (ifNoneMatch === etagValue) {
					httpCacheLogger.debug(`🎯 ETag match para ${req.path}, enviando 304`);
					return res.status(304).end();
				}
			}

			if (lastModified && !res.get('Last-Modified')) {
				res.set('Last-Modified', formatHttpDate(new Date()));
			}

			return originalJson.call(this, obj);
		};

		next();
	};
}

/**
 * 🔍 Middleware para validar cache con If-Modified-Since
 */
export function conditionalCacheMiddleware() {
	return (req: Request, res: Response, next: NextFunction) => {
		const ifModifiedSince = req.get('If-Modified-Since');
		
		if (ifModifiedSince) {
			const modifiedSinceDate = new Date(ifModifiedSince);
			const lastModified = res.get('Last-Modified');
			
			if (lastModified) {
				const lastModifiedDate = new Date(lastModified);
				if (lastModifiedDate <= modifiedSinceDate) {
					httpCacheLogger.debug(`📅 Not modified desde ${ifModifiedSince}, enviando 304`);
					return res.status(304).end();
				}
			}
		}

		next();
	};
}

/**
 * 📊 Middleware para métricas de cache
 */
export function cacheMetricsMiddleware() {
	const metrics = {
		hits: 0,
		misses: 0,
		requests: 0,
	};

	return {
		middleware: (req: Request, res: Response, next: NextFunction) => {
			metrics.requests++;
			
			const originalStatus = res.status;
			res.status = function(code: number) {
				if (code === 304) {
					metrics.hits++;
					httpCacheLogger.debug('📈 Cache HIT registrado');
				} else if (code === 200) {
					metrics.misses++;
					httpCacheLogger.debug('📉 Cache MISS registrado');
				}
				return originalStatus.call(this, code);
			};

			next();
		},
		getMetrics: () => ({
			...metrics,
			hitRate: metrics.requests > 0 ? metrics.hits / metrics.requests : 0,
			missRate: metrics.requests > 0 ? metrics.misses / metrics.requests : 0,
		}),
		resetMetrics: () => {
			metrics.hits = 0;
			metrics.misses = 0;
			metrics.requests = 0;
		}
	};
}

/**
 * 🎯 Configuración preestablecida para thumbnails
 */
export const thumbnailCacheConfig: CacheOptions = {
	etag: true,
	lastModified: true,
	immutable: true,
	maxAge: thumbsConfig.http.maxAgeSeconds,
	vary: ['Accept-Encoding', 'Accept'],
	customHeaders: {
		'X-Cache-Provider': thumbsConfig.provider,
		'X-Thumbnail-Version': '2.0',
	},
};

/**
 * 🚀 Middleware completo para thumbnails
 */
export const optimizedThumbnailMiddleware = [
	thumbnailCacheMiddleware(thumbnailCacheConfig),
	conditionalCacheMiddleware(),
];

httpCacheLogger.info('🌐 Middleware de cache HTTP inicializado:', {
	etag: thumbnailCacheConfig.etag,
	lastModified: thumbnailCacheConfig.lastModified,
	immutable: thumbnailCacheConfig.immutable,
	maxAge: `${thumbnailCacheConfig.maxAge} segundos`,
	provider: thumbsConfig.provider,
});
/**
 * @file Utilidades para generación de thumbnails específicos por tipo de entidad
 * @module config/thumbnail-generators
 * @description Generadores especializados de thumbnails para diferentes tipos de archivo
 *              Usa el sistema unificado de thumbnails del backend
 */

import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import type { DisplayableEntity } from '@/types/entities';

/**
 * 🎨 Configuración de thumbnails por tipo
 */
export interface ThumbnailConfig {
	/** Calidad por defecto */
	defaultQuality: ThumbnailQuality;
	/** Formato de salida */
	outputFormat: 'webp' | 'jpeg' | 'png';
	/** Dimensiones preferidas */
	preferredSize: { width: number; height: number };
	/** Si soporta animación */
	supportsAnimation: boolean;
}

/**
 * 📋 Configuraciones de thumbnail por tipo de entidad
 */
export const THUMBNAIL_CONFIGS: Record<string, ThumbnailConfig> = {
	image: {
		defaultQuality: ThumbnailQuality.MEDIUM,
		preferredSize: { width: 300, height: 300 },
		outputFormat: 'webp',
		supportsAnimation: true,
	},
	video: {
		defaultQuality: ThumbnailQuality.MEDIUM,
		preferredSize: { width: 300, height: 169 }, // 16:9
		outputFormat: 'jpeg',
		supportsAnimation: false,
	},
	audio: {
		defaultQuality: ThumbnailQuality.LOW,
		preferredSize: { width: 300, height: 100 }, // Waveform
		outputFormat: 'png',
		supportsAnimation: true,
	},
	document: {
		defaultQuality: ThumbnailQuality.MEDIUM,
		preferredSize: { width: 212, height: 300 }, // A4 ratio
		outputFormat: 'jpeg',
		supportsAnimation: false,
	},
	jsonFile: {
		defaultQuality: ThumbnailQuality.MEDIUM,
		preferredSize: { width: 300, height: 400 }, // JSON structure
		outputFormat: 'png',
		supportsAnimation: false,
	},
	file3d: {
		defaultQuality: ThumbnailQuality.MEDIUM,
		preferredSize: { width: 300, height: 300 }, // Square for 3D model
		outputFormat: 'png',
		supportsAnimation: false,
	},
	folder: {
		defaultQuality: ThumbnailQuality.LOW,
		preferredSize: { width: 200, height: 200 },
		outputFormat: 'png',
		supportsAnimation: false,
	},
};

// ===================== GENERADORES UNIFICADOS =====================

/**
 * 🖼️ Generador de URL de thumbnail para imágenes (Sistema Unificado)
 */
export function generateAdvancedImageThumbnail(
	item: DisplayableEntity,
	quality: ThumbnailQuality = ThumbnailQuality.MEDIUM
): Promise<string> {
	if (item.entityType !== 'image') {
		return Promise.resolve('');
	}

	// Prioridad de fuentes de thumbnail:
	// 1. URL existente en la entidad
	// 2. Thumbnail inline (base64)
	// 3. API unificada (genera si no existe)
	const sources = [
		() => (item as any).thumbnailUrl,
		() => ((item as any).thumbnail ? `data:image/jpeg;base64,${(item as any).thumbnail}` : null),
		() => buildUnifiedThumbnailUrl('image', item.id, { quality }),
	];

	for (const source of sources) {
		const url = source();
		if (url && typeof url === 'string') {
			return Promise.resolve(url);
		}
	}

	return Promise.resolve('');
}

/**
 * 🎬 Generador de URL de thumbnail para videos (Sistema Unificado)
 */
export function generateAdvancedVideoThumbnail(
	item: DisplayableEntity,
	options: { timeOffset?: number; quality?: ThumbnailQuality } = {}
): Promise<string> {
	if (item.entityType !== 'video') {
		return Promise.resolve('');
	}

	const { timeOffset = 5, quality = ThumbnailQuality.MEDIUM } = options;

	// Para videos, si tenemos el thumbnail inline, usarlo
	if ((item as any).thumbnail) {
		return Promise.resolve(`data:image/webp;base64,${(item as any).thumbnail}`);
	}

	// Usar API unificada
	return Promise.resolve(buildUnifiedThumbnailUrl('video', item.id, { quality, time: timeOffset }));
}

/**
 * 🎵 Generador de URL de waveform para audio (Sistema Unificado)
 */
export function generateAudioWaveform(
	item: DisplayableEntity,
	options: { width?: number; height?: number; color?: string } = {}
): Promise<string> {
	if (item.entityType !== 'audio') {
		return Promise.resolve('');
	}

	// Si ya tiene waveform generado inline
	if ((item as any).waveformUrl) {
		return Promise.resolve((item as any).waveformUrl);
	}

	// Usar API unificada
	const { width = 300, height = 100 } = options;
	return Promise.resolve(buildUnifiedThumbnailUrl('audio', item.id, { width, height }));
}

/**
 * 📄 Generador de URL de preview para documentos (Sistema Unificado)
 */
export function generateDocumentPreview(
	item: DisplayableEntity,
	options: { page?: number; quality?: ThumbnailQuality } = {}
): Promise<string> {
	if (item.entityType !== 'document') {
		return Promise.resolve('');
	}

	const { page = 1, quality = ThumbnailQuality.MEDIUM } = options;

	// Usar API unificada
	return Promise.resolve(buildUnifiedThumbnailUrl('document', item.id, { quality, page }));
}

/**
 * 📝 Generador de URL de preview para archivos JSON (Sistema Unificado)
 */
export function generateJsonPreview(
	item: DisplayableEntity,
	options: {
		maxLines?: number;
		width?: number;
		height?: number;
		theme?: 'light' | 'dark';
		showLineNumbers?: boolean;
	} = {}
): Promise<string> {
	if ((item as any).entityType !== 'jsonFile') {
		return Promise.resolve('');
	}

	// Si ya tiene preview generado inline
	if ((item as any).previewUrl) {
		return Promise.resolve((item as any).previewUrl);
	}

	// Usar API unificada
	const { width = 300, height = 400 } = options;
	return Promise.resolve(buildUnifiedThumbnailUrl('jsonFile', item.id, { width, height }));
}

/**
 * 🎲 Generador de URL de thumbnail para modelos 3D (Sistema Unificado)
 */
export function generate3DModelThumbnail(
	item: DisplayableEntity,
	options: {
		angle?: number;
		lightIntensity?: number;
		backgroundColor?: string;
		width?: number;
		height?: number;
		wireframe?: boolean;
	} = {}
): Promise<string> {
	if (item.entityType !== 'file3d') {
		return Promise.resolve('');
	}

	// Si ya tiene thumbnail generado inline
	if ((item as any).thumbnailUrl) {
		return Promise.resolve((item as any).thumbnailUrl);
	}

	// Usar API unificada
	const { width = 300, height = 300 } = options;
	return Promise.resolve(buildUnifiedThumbnailUrl('file3d', item.id, { width, height }));
}

/**
 * 📁 Generador de URL de preview compuesto para carpetas
 */
export function generateFolderPreview(
	item: DisplayableEntity,
	options: { maxItems?: number; layout?: 'grid' | 'stack' } = {}
): Promise<string> {
	if (item.entityType !== 'folder') {
		return Promise.resolve('');
	}

	const { maxItems = 4, layout = 'grid' } = options;

	// Si ya tiene preview
	if ((item as any).previewUrl) {
		return Promise.resolve((item as any).previewUrl);
	}

	// Generar preview compuesto via API
	return Promise.resolve(`/api/folders/${item.id}/preview?max=${maxItems}&layout=${layout}`);
}

/**
 * 🎨 Generador de avatar para entidades relacionales
 */
export function generateEntityAvatar(
	item: DisplayableEntity,
	options: { size?: number; style?: 'geometric' | 'identicon' | 'initial' } = {}
): Promise<string> {
	const { size = 200, style = 'geometric' } = options;

	// Tipos de entidad que pueden tener avatar generado
	const avatarTypes = ['character', 'place', 'concept', 'group'];

	if (!avatarTypes.includes(item.entityType)) {
		return Promise.resolve('');
	}

	// Si ya tiene avatar personalizado
	if ((item as any).avatarUrl) {
		return Promise.resolve((item as any).avatarUrl);
	}

	// Generar avatar basado en nombre/ID
	const seed = item.name || item.id;
	return Promise.resolve(`/api/avatars/generate?seed=${encodeURIComponent(seed)}&size=${size}&style=${style}`);
}

// ===================== FUNCIONES UNIFICADAS =====================

/**
 * 🔧 Función unificada para generar URL de thumbnail según el tipo
 */
export function generateThumbnailByType(item: DisplayableEntity, options: Record<string, any> = {}): Promise<string> {
	switch (item.entityType) {
		case 'image':
			return generateAdvancedImageThumbnail(item, options.quality);

		case 'video':
			return generateAdvancedVideoThumbnail(item, options);

		case 'audio':
			return generateAudioWaveform(item, options);

		case 'document':
			return generateDocumentPreview(item, options);

		case 'jsonFile':
			return generateJsonPreview(item, options);

		case 'file3d':
			return generate3DModelThumbnail(item, options);

		case 'folder':
			return generateFolderPreview(item, options);

		case 'character':
		case 'place':
		case 'concept':
		case 'group':
			return generateEntityAvatar(item, options);

		default:
			// Para otros tipos, intentar thumbnail genérico
			return generateGenericThumbnail(item);
	}
}

/**
 * 📄 Generador de thumbnail genérico
 */
export function generateGenericThumbnail(item: DisplayableEntity): Promise<string> {
	// Usar servicio de iconos SVG generados dinámicamente
	const entityType = item.entityType;
	const name = item.name || 'Item';

	return Promise.resolve(`/api/thumbnails/generic?type=${entityType}&name=${encodeURIComponent(name)}`);
}

/**
 * 🎯 Obtiene la configuración de thumbnail para un tipo de entidad
 */
export function getThumbnailConfig(entityType: string): ThumbnailConfig {
	return THUMBNAIL_CONFIGS[entityType] || THUMBNAIL_CONFIGS.image;
}

// ===================== HELPERS =====================

/**
 * 🎨 Genera URL de thumbnail con parámetros optimizados
 */
export function buildThumbnailUrl(
	baseUrl: string,
	options: {
		width?: number;
		height?: number;
		quality?: ThumbnailQuality;
		format?: string;
		fit?: 'cover' | 'contain' | 'fill';
	} = {}
): string {
	const params = new URLSearchParams();

	if (options.width) {
		params.set('w', options.width.toString());
	}
	if (options.height) {
		params.set('h', options.height.toString());
	}
	if (options.quality) {
		params.set('q', options.quality);
	}
	if (options.format) {
		params.set('f', options.format);
	}
	if (options.fit) {
		params.set('fit', options.fit);
	}

	const queryString = params.toString();
	return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * 🔗 Construye URL del endpoint unificado de thumbnails
 */
function buildUnifiedThumbnailUrl(entityType: string, entityId: string, options: Record<string, any> = {}): string {
	const mapping: Record<string, string> = {
		image: 'image',
		video: 'video',
		audio: 'audio',
		document: 'document',
		jsonFile: 'json',
		file3d: '3d',
	};

	const route = mapping[entityType] || entityType;
	const params = new URLSearchParams();

	// Agregar opciones como query params
	if (options.quality) params.set('quality', options.quality);
	if (options.width) params.set('width', options.width.toString());
	if (options.height) params.set('height', options.height.toString());
	if (options.time) params.set('time', options.time.toString());
	if (options.page) params.set('page', options.page.toString());

	const queryString = params.toString();
	return `/api/thumbnails/unified/${route}/${entityId}${queryString ? `?${queryString}` : ''}`;
}

// ===================== CACHÉ =====================

/**
 * 🔄 Cache de thumbnails generados
 */
const thumbnailCache = new Map<string, { url: string; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * 💾 Obtiene thumbnail desde cache o genera uno nuevo
 */
export async function getCachedThumbnail(item: DisplayableEntity, options: Record<string, any> = {}): Promise<string> {
	const cacheKey = `${item.entityType}-${item.id}-${JSON.stringify(options)}`;
	const cached = thumbnailCache.get(cacheKey);

	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		return cached.url;
	}

	const url = await generateThumbnailByType(item, options);

	if (url) {
		thumbnailCache.set(cacheKey, {
			url,
			timestamp: Date.now(),
		});
	}

	return url;
}

/**
 * 🧹 Limpia cache de thumbnails expirados
 */
export function clearExpiredThumbnailCache(): void {
	const now = Date.now();
	for (const [key, value] of thumbnailCache.entries()) {
		if (now - value.timestamp >= CACHE_DURATION) {
			thumbnailCache.delete(key);
		}
	}
}

// Limpiar cache periódicamente (solo en cliente)
if (typeof window !== 'undefined') {
	setInterval(clearExpiredThumbnailCache, CACHE_DURATION);
}

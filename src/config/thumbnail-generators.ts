/**
 * @file Utilidades para generación de thumbnails específicos por tipo de entidad
 * @module config/thumbnail-generators
 * @description Generadores especializados de thumbnails para diferentes tipos de archivo
 */

import { ThumbnailQuality } from '@/lib/config/thumbnail.config';
import type { DisplayableEntity } from '@/types/entities';

/**
 * 🎨 Configuración de thumbnails por tipo
 */
export interface ThumbnailConfig {
	/** Calidad por defecto */
	defaultQuality: ThumbnailQuality;
	/** Dimensiones preferidas */
	preferredSize: { width: number; height: number };
	/** Formato de salida */
	outputFormat: 'webp' | 'jpeg' | 'png';
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

/**
 * 🖼️ Generador avanzado de thumbnail para imágenes
 */
export function generateAdvancedImageThumbnail(
	item: DisplayableEntity,
	quality: ThumbnailQuality = ThumbnailQuality.MEDIUM
): Promise<string> {
	if (item.entityType !== 'image') {
		return Promise.resolve('');
	}

	// Prioridad de fuentes de thumbnail
	const sources = [
		() => (item as any).thumbnailUrl,
		() => ((item as any).thumbnail ? `data:image/jpeg;base64,${(item as any).thumbnail}` : null),
		() => `/api/images/${item.id}/thumbnail?quality=${quality}`,
		() => ((item as any).path ? `/api/files/thumbnail?path=${encodeURIComponent((item as any).path)}` : null),
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
 * 🎬 Generador avanzado de thumbnail para videos
 */
export function generateAdvancedVideoThumbnail(
	item: DisplayableEntity,
	options: { timeOffset?: number; quality?: ThumbnailQuality } = {}
): Promise<string> {
	if (item.entityType !== 'video') {
		return Promise.resolve('');
	}

	const { timeOffset = 5, quality = ThumbnailQuality.MEDIUM } = options;

	// Prioridad de fuentes de thumbnail
	const sources = [
		() => (item as any).thumbnailUrl,
		() => ((item as any).thumbnail ? `data:image/jpeg;base64,${(item as any).thumbnail}` : null),
		() => `/api/videos/${item.id}/thumbnail?time=${timeOffset}&quality=${quality}`,
		() =>
			(item as any).path
				? `/api/files/video-thumbnail?path=${encodeURIComponent((item as any).path)}&time=${timeOffset}`
				: null,
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
 * 🎵 Generador de waveform para audio
 */
export function generateAudioWaveform(
	item: DisplayableEntity,
	options: { width?: number; height?: number; color?: string } = {}
): Promise<string> {
	if (item.entityType !== 'audio') {
		return Promise.resolve('');
	}

	const { width = 300, height = 100, color = 'var(--dt-primary-500)' } = options;

	// Si ya tiene waveform generado
	if ((item as any).waveformUrl) {
		return Promise.resolve((item as any).waveformUrl);
	}

	// Generar waveform via API
	const params = new URLSearchParams({
		width: width.toString(),
		height: height.toString(),
		color: color.replace('#', ''),
	});

	return Promise.resolve(`/api/audio/${item.id}/waveform?${params.toString()}`);
}

/**
 * 📄 Generador de preview para documentos
 */
export function generateDocumentPreview(
	item: DisplayableEntity,
	options: { page?: number; quality?: ThumbnailQuality } = {}
): Promise<string> {
	if (item.entityType !== 'document') {
		return Promise.resolve('');
	}

	const { page = 1, quality = ThumbnailQuality.MEDIUM } = options;

	// Si ya tiene preview
	if ((item as any).previewUrl) {
		return Promise.resolve((item as any).previewUrl);
	}

	// Generar preview via API
	return Promise.resolve(`/api/documents/${item.id}/preview?page=${page}&quality=${quality}`);
}

/**
 * 📝 Generador de preview para archivos JSON
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

	const { maxLines = 20, width = 300, height = 400, theme = 'light', showLineNumbers = true } = options;

	// Si ya tiene preview generado
	if ((item as any).previewUrl) {
		return Promise.resolve((item as any).previewUrl);
	}

	// Generar preview via API
	const params = new URLSearchParams({
		maxLines: maxLines.toString(),
		width: width.toString(),
		height: height.toString(),
		theme,
		showLineNumbers: showLineNumbers.toString(),
	});

	return Promise.resolve(`/api/json/${item.id}/preview?${params.toString()}`);
}

/**
 * 🎲 Generador de thumbnail para modelos 3D
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

	const {
		angle = 45,
		lightIntensity = 1.5,
		backgroundColor = 'var(--background)',
		width = 300,
		height = 300,
		wireframe = false,
	} = options;

	// Si ya tiene thumbnail generado
	if ((item as any).thumbnailUrl) {
		return Promise.resolve((item as any).thumbnailUrl);
	}

	// Generar thumbnail via API usando three.js headless
	const params = new URLSearchParams({
		angle: angle.toString(),
		lightIntensity: lightIntensity.toString(),
		backgroundColor: backgroundColor.replace('#', ''),
		width: width.toString(),
		height: height.toString(),
		wireframe: wireframe.toString(),
	});

	return Promise.resolve(`/api/3d/${item.id}/thumbnail?${params.toString()}`);
}

/**
 * 📁 Generador de preview compuesto para carpetas
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

/**
 * 🔧 Función unificada para generar thumbnail según el tipo
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

		// TODO: Agregar 'jsonFile' al tipo EntityType
		// case 'jsonFile':
		//   return generateJsonPreview(item, options);

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

/**
 * 📐 Calcula dimensiones óptimas para thumbnail manteniendo aspect ratio
 */
export function calculateOptimalSize(
	originalWidth: number,
	originalHeight: number,
	maxWidth: number,
	maxHeight: number
): { width: number; height: number } {
	const aspectRatio = originalWidth / originalHeight;

	if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
		return { width: originalWidth, height: originalHeight };
	}

	let width = maxWidth;
	let height = width / aspectRatio;

	if (height > maxHeight) {
		height = maxHeight;
		width = height * aspectRatio;
	}

	return {
		width: Math.round(width),
		height: Math.round(height),
	};
}

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

// Limpiar cache periódicamente
if (typeof window !== 'undefined') {
	setInterval(clearExpiredThumbnailCache, CACHE_DURATION);
}

/**
 * @file Funciones para serializar y deserializar datos de videos
 * @module transformers/video/serializers
 */

import type { Video, VideoBase, VideoComplete, VideoMetadata, VideoPrivacyLevel, VideoVisualConfig, VideoVisualConfigComplete } from '../../types/entities/video';

// Define interfaces adicionales para extender VideoBase
interface VideoData {
	metadata?: string | VideoMetadata;
}

/**
 * Convierte un objeto VideoBase a Video con propiedades extendidas
 * @param video Objeto básico de video
 * @returns Objeto Video completo
 */
export function extendVideo(video: VideoBase & VideoData): Video {
	// Asegurarse de que todas las propiedades requeridas por Video están presentes
	return {
		...video,
		metadata: parseVideoMetadata(video),
		tags: [], // Propiedad requerida por Video, inicializada como array vacío
		privacyLevel: 'PRIVATE' as VideoPrivacyLevel, // Valor por defecto para privacyLevel
		isFavorite: false, // Valor por defecto para isFavorite
	};
}

/**
 * Convierte un array de objetos VideoBase a array de Video con propiedades extendidas
 * @param videos Array de objetos básicos de video
 * @returns Array de objetos Video completos
 */
export function extendVideos(videos: (VideoBase & VideoData)[]): Video[] {
	return videos.map(extendVideo);
}

/**
 * Parsea los metadatos de un video si están en formato string
 * @param video Objeto de video
 * @returns Metadatos parseados o undefined
 */
export function parseVideoMetadata(video: VideoData): VideoMetadata | undefined {
	if (!video.metadata) return undefined;

	if (typeof video.metadata === 'string') {
		try {
			return JSON.parse(video.metadata) as VideoMetadata;
		} catch (error) {
			console.error('Error parsing video metadata', error);
			return undefined;
		}
	}

	return video.metadata as VideoMetadata;
}

/**
 * Serializa los metadatos de un video para guardarlos
 * @param metadata Objeto de metadatos de video
 * @returns String serializado o undefined
 */
export function serializeVideoMetadata(metadata?: VideoMetadata): string | undefined {
	if (!metadata) return undefined;

	try {
		return JSON.stringify(metadata);
	} catch (error) {
		console.error('Error serializing video metadata', error);
		return undefined;
	}
}

/**
 * Serializa la configuración visual de un video
 * @param visualConfig Configuración visual básica
 * @returns Configuración visual extendida con propiedades adicionales
 */
export function serializeVideoVisualConfig(
	visualConfig: VideoVisualConfig | null | undefined
): VideoVisualConfig | undefined {
	if (!visualConfig) return undefined;

	// Crear copia para evitar mutar el objeto original
	const extendedConfig: VideoVisualConfig = {
		...visualConfig,
	};

	// Procesar campos de tipo string JSON
	if (visualConfig.layerSystem) {
		try {
			// Añadir propiedad extendida layersConfig
			(extendedConfig as any).layersConfig = JSON.parse(visualConfig.layerSystem);
		} catch (error) {
			console.error('Error al serializar layerSystem:', error);
		}
	}

	if (visualConfig.effects) {
		try {
			// Añadir propiedad extendida effectsConfig
			(extendedConfig as any).effectsConfig = JSON.parse(visualConfig.effects);
		} catch (error) {
			console.error('Error al serializar effects:', error);
		}
	}

	if (visualConfig.performance) {
		try {
			// Añadir propiedad extendida performanceConfig
			(extendedConfig as any).performanceConfig = JSON.parse(visualConfig.performance);
		} catch (error) {
			console.error('Error al serializar performance:', error);
		}
	}

	if (visualConfig.states) {
		try {
			// Añadir propiedad extendida statesConfig
			(extendedConfig as any).statesConfig = JSON.parse(visualConfig.states);
		} catch (error) {
			console.error('Error al serializar states:', error);
		}
	}

	return extendedConfig;
}

/**
 * Convierte un objeto VideoBase a VideoComplete con metadatos deserializados
 * @param video Objeto VideoBase con metadatos serializados
 * @returns Objeto VideoComplete con metadatos deserializados
 * @deprecated Use toVideoComplete instead
 */
export function parseVideo(video: VideoBase & VideoData): VideoComplete {
	return {
		...video,
		metadata: parseVideoMetadata(video) || null,
	};
}

/**
 * Convierte un objeto VideoBase a VideoComplete con metadatos deserializados
 * @param video Objeto VideoBase con metadatos serializados
 * @returns Objeto VideoComplete con metadatos deserializados
 */
export function toVideoComplete(video: VideoBase & VideoData): VideoComplete {
	return {
		...video,
		metadata: parseVideoMetadata(video) || null,
	};
}

/**
 * Convierte un objeto VideoComplete a VideoBase con metadatos serializados
 * @param video Objeto VideoComplete con metadatos deserializados
 * @returns Objeto VideoBase con metadatos serializados
 */
export function fromVideoComplete(video: VideoComplete): VideoBase & { metadata: string | null } {
	return {
		...video,
		metadata: video.metadata ? serializeVideoMetadata(video.metadata) || null : null,
	};
}

/**
 * Convierte un objeto VideoVisualConfig a VideoVisualConfigComplete con campos JSON deserializados
 * @param visualConfig Configuración visual básica
 * @returns Configuración visual extendida con campos JSON deserializados
 */
export function toVideoVisualConfigComplete(
	visualConfig: VideoVisualConfig | null | undefined
): VideoVisualConfigComplete | undefined {
	if (!visualConfig) return undefined;

	// Crear copia para evitar mutar el objeto original
	const completeConfig: VideoVisualConfigComplete = {
		...visualConfig,
	} as VideoVisualConfigComplete;

	// Deserializar campos JSON
	if (visualConfig.layerSystem) {
		try {
			completeConfig.layersConfig = JSON.parse(visualConfig.layerSystem);
		} catch (error) {
			console.error('Error al deserializar layerSystem:', error);
		}
	}

	if (visualConfig.effects) {
		try {
			completeConfig.effectsConfig = JSON.parse(visualConfig.effects);
		} catch (error) {
			console.error('Error al deserializar effects:', error);
		}
	}

	if (visualConfig.performance) {
		try {
			completeConfig.performanceConfig = JSON.parse(visualConfig.performance);
		} catch (error) {
			console.error('Error al deserializar performance:', error);
		}
	}

	if (visualConfig.states) {
		try {
			completeConfig.statesConfig = JSON.parse(visualConfig.states);
		} catch (error) {
			console.error('Error al deserializar states:', error);
		}
	}

	return completeConfig;
}

/**
 * Convierte un objeto VideoVisualConfigComplete a VideoVisualConfig con campos JSON serializados
 * @param completeConfig Configuración visual completa con campos deserializados
 * @returns Configuración visual con campos JSON serializados
 */
export function fromVideoVisualConfigComplete(
	completeConfig: VideoVisualConfigComplete
): VideoVisualConfig {
	const baseConfig: VideoVisualConfig = {
		...completeConfig,
	};

	// Serializar campos que pueden estar deserializados
	if (completeConfig.layersConfig) {
		try {
			baseConfig.layerSystem = JSON.stringify(completeConfig.layersConfig);
		} catch (error) {
			console.error('Error al serializar layersConfig:', error);
		}
	}

	if (completeConfig.effectsConfig) {
		try {
			baseConfig.effects = JSON.stringify(completeConfig.effectsConfig);
		} catch (error) {
			console.error('Error al serializar effectsConfig:', error);
		}
	}

	if (completeConfig.performanceConfig) {
		try {
			baseConfig.performance = JSON.stringify(completeConfig.performanceConfig);
		} catch (error) {
			console.error('Error al serializar performanceConfig:', error);
		}
	}

	if (completeConfig.statesConfig) {
		try {
			baseConfig.states = JSON.stringify(completeConfig.statesConfig);
		} catch (error) {
			console.error('Error al serializar statesConfig:', error);
		}
	}

	return baseConfig;
}

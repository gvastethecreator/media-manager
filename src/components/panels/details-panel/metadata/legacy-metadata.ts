import type { AnyEntityWithStats } from '@/types/entities';
import type { MetadataField } from '../types';

/**
 * Genera metadatos sintéticos para testing cuando no hay otros disponibles
 */
const getSyntheticMetadata = (metadata: MetadataField[]): MetadataField[] => {
	// Metadatos básicos sintéticos para asegurar que siempre haya contenido
	metadata.push({ key: 'Formato', value: 'JPEG', category: 'técnico' });
	metadata.push({ key: 'Compresión', value: 'JPEG', category: 'técnico' });

	// Simular metadatos de IA si no hay otros
	metadata.push({ key: 'Engine detectado', value: 'No detectado', category: 'ia' });
	metadata.push({ key: 'Prompt', value: 'No disponible', category: 'ia' });

	// Simular EXIF básico
	metadata.push({ key: 'Cámara', value: 'No disponible', category: 'exif' });
	metadata.push({ key: 'ISO', value: 'No disponible', category: 'exif' });

	// Simular IPTC
	metadata.push({ key: 'Título', value: 'No disponible', category: 'iptc' });
	metadata.push({ key: 'Descripción', value: 'No disponible', category: 'iptc' });

	// Simular XMP
	metadata.push({ key: 'Calificación', value: 'No disponible', category: 'xmp' });

	console.log('📊 Generados metadatos sintéticos:', metadata.length, 'campos');
	return metadata;
};

/**
 * Procesa metadatos de IA desde el formato legacy (versión simplificada)
 */
const processAIMetadata = (parsedMetadata: any, metadata: MetadataField[]): void => {
	const aiData = parsedMetadata.ai_metadata || parsedMetadata.ai;
	if (!aiData) {
		return;
	}

	// Parámetros básicos comunes
	if (aiData.prompt) {
		const promptText = aiData.prompt.length > 150 ? `${aiData.prompt.substring(0, 150)}...` : aiData.prompt;
		metadata.push({ key: 'Prompt', value: promptText, category: 'ia' });
	}

	if (aiData.model || aiData.checkpoint) {
		metadata.push({ key: 'Modelo', value: aiData.model || aiData.checkpoint, category: 'ia' });
	}

	if (aiData.steps) {
		metadata.push({ key: 'Pasos', value: aiData.steps.toString(), category: 'ia' });
	}

	if (aiData.cfg_scale || aiData.cfg) {
		metadata.push({ key: 'CFG Scale', value: (aiData.cfg_scale || aiData.cfg).toString(), category: 'ia' });
	}

	if (aiData.seed) {
		metadata.push({ key: 'Seed', value: aiData.seed.toString(), category: 'ia' });
	}
};

/**
 * Procesa metadatos EXIF desde el formato legacy (versión simplificada)
 */
const processEXIFMetadata = (exif: any, metadata: MetadataField[]): void => {
	// Información de cámara
	if (exif.make || exif.model) {
		const camera = `${exif.make || ''} ${exif.model || ''}`.trim();
		if (camera) {
			metadata.push({ key: 'Cámara', value: camera, category: 'exif' });
		}
	}

	// Configuraciones básicas
	if (exif.iso) {
		metadata.push({ key: 'ISO', value: exif.iso.toString(), category: 'exif' });
	}

	if (exif.fNumber) {
		metadata.push({ key: 'Apertura', value: `f/${exif.fNumber}`, category: 'exif' });
	}
};

/**
 * Procesa metadatos IPTC desde el formato legacy
 */
const processIPTCMetadata = (iptc: any, metadata: MetadataField[]): void => {
	if (iptc.headline) {
		metadata.push({ key: 'Título', value: iptc.headline, category: 'iptc' });
	}

	if (iptc.description) {
		metadata.push({ key: 'Descripción', value: iptc.description, category: 'iptc' });
	}
};

/**
 * Procesa metadatos XMP desde el formato legacy
 */
const processXMPMetadata = (xmp: any, metadata: MetadataField[]): void => {
	if (xmp.title) {
		metadata.push({ key: 'Título XMP', value: xmp.title, category: 'xmp' });
	}

	if (xmp.rating) {
		metadata.push({ key: 'Calificación', value: `${xmp.rating}/5`, category: 'xmp' });
	}
};

/**
 * Procesa metadatos de imagen usando el sistema legacy
 */
const processImageMetadata = (item: AnyEntityWithStats, metadata: MetadataField[]): MetadataField[] => {
	// Agregar metadatos sintéticos para testing si no hay otros disponibles
	if (!('metadata' in item && item.metadata)) {
		return getSyntheticMetadata(metadata);
	}

	if ('metadata' in item && typeof item.metadata === 'string' && item.metadata) {
		try {
			const parsedMetadata = JSON.parse(item.metadata);

			// Procesar diferentes tipos de metadatos
			processAIMetadata(parsedMetadata, metadata);

			if (parsedMetadata.exif) {
				processEXIFMetadata(parsedMetadata.exif, metadata);
			}

			if (parsedMetadata.iptc) {
				processIPTCMetadata(parsedMetadata.iptc, metadata);
			}

			if (parsedMetadata.xmp) {
				processXMPMetadata(parsedMetadata.xmp, metadata);
			}
		} catch (error) {
			console.error('Error al parsear metadatos legacy:', error);
			return getSyntheticMetadata(metadata);
		}
	}

	return metadata;
};

/**
 * Agrega metadatos de fallback si no hay suficientes
 */
const addFallbackMetadata = (metadata: MetadataField[]): void => {
	// Si después de todo no tenemos metadatos suficientes, agregar sintéticos
	if (metadata.length <= 1) {
		// Solo hash
		metadata.push({ key: 'Estado', value: 'Metadatos no disponibles', category: 'ia' });
		metadata.push({ key: 'Cámara', value: 'Información no disponible', category: 'exif' });
		metadata.push({ key: 'Descripción', value: 'No disponible', category: 'iptc' });
		metadata.push({ key: 'Calificación', value: 'No asignada', category: 'xmp' });
		console.log('📊 Agregados metadatos de fallback');
	}
};

/**
 * Obtiene metadatos detallados usando el sistema legacy o metadatos mejorados
 */
export const getDetailedMetadata = (item: AnyEntityWithStats, enhancedMetadata: MetadataField[]): MetadataField[] => {
	// Si tenemos metadatos mejorados, devolverlos directamente
	if (enhancedMetadata.length > 0) {
		console.log('📊 Usando metadatos mejorados:', enhancedMetadata.length, 'campos');
		return enhancedMetadata;
	}

	console.log('📊 Usando sistema legacy de metadatos');
	// Continuar con el sistema legacy si el nuevo no está disponible
	const metadata: MetadataField[] = [];

	// Siempre agregar hash si existe (categoría técnica base)
	if ('hash' in item && typeof item.hash === 'string') {
		metadata.push({
			key: 'Hash',
			value: `${item.hash.substring(0, 16)}...`,
			category: 'técnico',
		});
	}

	// Metadatos específicos de imágenes
	if (item.entityType === 'image') {
		const processedMetadata = processImageMetadata(item, metadata);
		addFallbackMetadata(processedMetadata);
		return processedMetadata;
	}

	return metadata;
};

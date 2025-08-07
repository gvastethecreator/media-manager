import type { EnhancedMetadataResult, MetadataField } from '../types';

/**
 * Extrae metadatos de IA del resultado de la API
 */
export const extractAIMetadata = (result: EnhancedMetadataResult, metadata: MetadataField[]): void => {
	if (!result.metadata?.aiMetadata) {
		return;
	}

	const ai = result.metadata.aiMetadata;

	// Información del engine
	if (result.metadata.origin?.engine) {
		const engineNames: Record<string, string> = {
			automatic1111: 'Automatic1111',
			forge: 'Forge',
			comfyui: 'ComfyUI',
			swarmui: 'SwarmUI',
			midjourney: 'Midjourney',
			invokeai: 'InvokeAI',
			novelai: 'NovelAI',
			ideogram: 'Ideogram',
			stability_ai: 'Stability AI',
			dalle: 'DALL·E',
			unknown: 'Desconocido',
		};
		const engineName = engineNames[result.metadata.origin.engine] || result.metadata.origin.engine;
		const confidence = result.metadata.origin.confidence
			? ` (${Math.round(result.metadata.origin.confidence * 100)}%)`
			: '';
		metadata.push({
			key: 'Engine IA',
			value: `${engineName}${confidence}`,
			category: 'ia',
		});
	}

	// Parámetros de generación básicos
	const basicParams = [
		{ field: 'prompt', key: 'Prompt', maxLength: 150 },
		{ field: 'negativePrompt', key: 'Prompt Negativo', maxLength: 100 },
		{ field: 'model', key: 'Modelo' },
		{ field: 'steps', key: 'Pasos' },
		{ field: 'cfgScale', key: 'CFG Scale' },
		{ field: 'seed', key: 'Seed' },
		{ field: 'sampler', key: 'Sampler' },
		{ field: 'scheduler', key: 'Scheduler' },
	];

	for (const param of basicParams) {
		const value = ai[param.field];
		if (value) {
			let displayValue = value.toString();
			if (param.maxLength && displayValue.length > param.maxLength) {
				displayValue = `${displayValue.substring(0, param.maxLength)}...`;
			}
			metadata.push({
				key: param.key,
				value: displayValue,
				category: 'ia',
			});
		}
	}

	// ComfyUI específicos
	if (ai.workflowId) {
		metadata.push({
			key: 'Workflow ID',
			value: ai.workflowId,
			category: 'ia',
		});
	}

	if (ai.nodeCount) {
		metadata.push({
			key: 'Nodos',
			value: ai.nodeCount.toString(),
			category: 'ia',
		});
	}
};

/**
 * Extrae metadatos EXIF del resultado de la API
 */
export const extractEXIFMetadata = (result: EnhancedMetadataResult, metadata: MetadataField[]): void => {
	if (!result.metadata?.exifData) {
		return;
	}

	const exif = result.metadata.exifData;

	// Información de cámara
	if (exif.make || exif.model) {
		const camera = `${exif.make || ''} ${exif.model || ''}`.trim();
		if (camera) {
			metadata.push({ key: 'Cámara', value: camera, category: 'exif' });
		}
	}

	// Configuraciones de captura
	const captureSettings = [
		{ field: 'iso', key: 'ISO' },
		{ field: 'fNumber', key: 'Apertura', format: (v: any) => `f/${v}` },
		{ field: 'exposureTime', key: 'Velocidad' },
		{ field: 'focalLength', key: 'Distancia focal', format: (v: any) => `${v}mm` },
	];

	for (const setting of captureSettings) {
		const value = exif[setting.field];
		if (value) {
			const displayValue = setting.format ? setting.format(value) : value.toString();
			metadata.push({
				key: setting.key,
				value: displayValue,
				category: 'exif',
			});
		}
	}
};

/**
 * Extrae metadatos IPTC del resultado de la API
 */
export const extractIPTCMetadata = (result: EnhancedMetadataResult, metadata: MetadataField[]): void => {
	if (!result.metadata?.iptcData) {
		return;
	}

	const iptc = result.metadata.iptcData;

	if (iptc.headline) {
		metadata.push({ key: 'Título', value: iptc.headline, category: 'iptc' });
	}

	if (iptc.description) {
		metadata.push({ key: 'Descripción', value: iptc.description, category: 'iptc' });
	}

	if (iptc.keywords?.length) {
		metadata.push({
			key: 'Palabras clave',
			value: iptc.keywords.join(', '),
			category: 'iptc',
		});
	}
};

/**
 * Extrae metadatos XMP del resultado de la API
 */
export const extractXMPMetadata = (result: EnhancedMetadataResult, metadata: MetadataField[]): void => {
	if (!result.metadata?.xmpData) {
		return;
	}

	const xmp = result.metadata.xmpData;

	if (xmp.title) {
		metadata.push({ key: 'Título XMP', value: xmp.title, category: 'xmp' });
	}

	if (xmp.description) {
		metadata.push({ key: 'Descripción XMP', value: xmp.description, category: 'xmp' });
	}

	if (xmp.rating) {
		metadata.push({ key: 'Calificación', value: `${xmp.rating}/5`, category: 'xmp' });
	}
};

import { useCallback, useEffect, useState } from 'react';
import type { AnyEntityWithStats } from '@/types/entities';
import {
	extractAIMetadata,
	extractAudioMetadata,
	extractDocumentMetadata,
	extractEXIFMetadata,
	extractIPTCMetadata,
	extractJSONMetadata,
	extractVideoMetadata,
	extractXMPMetadata,
} from '../metadata/enhanced-metadata-extractors';
import type { EnhancedMetadataOptions, EnhancedMetadataResult, MetadataField } from '../types';

const toMediaAssetType = (entityType: AnyEntityWithStats['entityType']) =>
	entityType === 'jsonFile' ? 'json' : entityType;

/**
 * Agrega el hash del item a los metadatos si existe
 */
const addHashMetadata = (item: AnyEntityWithStats, metadata: MetadataField[]): void => {
	if ('hash' in item && typeof item.hash === 'string') {
		metadata.push({
			key: 'Hash',
			value: `${item.hash.substring(0, 16)}...`,
			category: 'technical',
		});
	}
};

/**
 * Realiza la llamada a la API de extracción de metadatos
 */
const fetchMetadataFromAPI = async (item: AnyEntityWithStats, options: EnhancedMetadataOptions): Promise<any> => {
	const response = await fetch('/api/metadata-advanced/extract', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ asset: { assetId: item.id, assetType: toMediaAssetType(item.entityType) }, options }),
	});

	if (!response.ok) {
		throw new Error(`Could not extract metadata: ${response.statusText}`);
	}

	return response.json();
};

/**
 * Normaliza la respuesta del backend (unified parser) al formato EnhancedMetadataResult esperado por los extractores
 */
// Helpers de normalización
const safeKeys = (obj: any): string[] => (obj && typeof obj === 'object' ? Object.keys(obj) : []);

const normalizeAI = (aiSrc: any) => {
	if (!aiSrc) {
		return null;
	}
	const ai = { ...aiSrc };
	const mappings: Record<string, string> = {
		negative_prompt: 'negativePrompt',
		cfg_scale: 'cfgScale',
		workflow_id: 'workflowId',
		node_count: 'nodeCount',
		sampler_name: 'sampler',
		scheduler_type: 'scheduler',
		model_name: 'model',
	};
	for (const [from, to] of Object.entries(mappings)) {
		if (from in ai && !(to in ai)) {
			(ai as any)[to] = ai[from];
		}
	}
	return ai;
};

const normalizeEXIF = (exifSrc: any) => {
	if (!exifSrc) {
		return null;
	}
	const exif = { ...exifSrc };
	const mappings: Record<string, string> = {
		exposure_time: 'exposureTime',
		focal_length: 'focalLength',
		f_number: 'fNumber',
	};
	for (const [from, to] of Object.entries(mappings)) {
		if (from in exif && !(to in exif)) {
			(exif as any)[to] = exif[from];
		}
	}
	if (typeof exif.iso === 'string') {
		const isoParsed = Number.parseInt(exif.iso, 10);
		if (!Number.isNaN(isoParsed)) {
			exif.iso = isoParsed;
		}
	}
	return exif;
};

// Pipeline resumen:
// 1. fetchMetadataFromAPI -> POST /api/metadata-advanced/extract con referencia opaca de asset
// 2. normalizeMetadataResponse -> adapta snake_case backend a camelCase esperado (ai/exif/iptc/xmp + origin)
// 3. processMetadataResult -> aplica extractores (AI, EXIF, IPTC, XMP) y agrega hash técnico
// 4. Hook expone enhancedMetadata listo para UI; si falla => [] y panel usa fallback sintético
// Logs solo en modo DEV para evitar ruido en producción.
function normalizeMetadataResponse(raw: any): EnhancedMetadataResult {
	const backend = raw?.metadata || raw;

	if (import.meta.env?.DEV) {
		// eslint-disable-next-line no-console
		console.debug('[useEnhancedMetadata] claves payload', {
			success: raw?.success,
			ai: safeKeys(backend?.ai_metadata || backend?.aiMetadata).length,
			exif: safeKeys(backend?.exif || backend?.exifData).length,
			iptc: safeKeys(backend?.iptc || backend?.iptcData).length,
			xmp: safeKeys(backend?.xmp || backend?.xmpData).length,
		});
	}

	const ai = normalizeAI(backend?.ai_metadata || backend?.aiMetadata);
	const exif = normalizeEXIF(backend?.exif || backend?.exifData);
	const iptc = backend?.iptc || backend?.iptcData || null;
	const xmp = backend?.xmp || backend?.xmpData || null;

	const normalized: EnhancedMetadataResult = {
		success: Boolean(raw?.success),
		metadata: {
			aiMetadata: ai,
			exifData: exif,
			iptcData: iptc,
			xmpData: xmp,
			origin: backend?.origin || null,
		},
	};

	if (import.meta.env?.DEV) {
		// eslint-disable-next-line no-console
		console.debug('[useEnhancedMetadata] normalizado', {
			ai: safeKeys(normalized.metadata?.aiMetadata).length,
			exif: safeKeys(normalized.metadata?.exifData).length,
			iptc: safeKeys(normalized.metadata?.iptcData).length,
			xmp: safeKeys(normalized.metadata?.xmpData).length,
			origin: normalized.metadata?.origin,
		});
	}

	return normalized;
}

/**
 * Procesa el resultado de la API y extrae todos los metadatos
 */
const processMetadataResult = (result: EnhancedMetadataResult, item: AnyEntityWithStats): MetadataField[] => {
	const metadata: MetadataField[] = [];

	// Agregar hash si existe
	addHashMetadata(item, metadata);

	// Extraer diferentes tipos de metadatos según el tipo de entidad
	const entityType = item.entityType;

	// Metadatos de IA (disponibles principalmente en imágenes, pero podría extenderse)
	if (entityType === 'image') {
		extractAIMetadata(result, metadata);
		extractEXIFMetadata(result, metadata);
		extractIPTCMetadata(result, metadata);
		extractXMPMetadata(result, metadata);
	}

	// Metadatos de video
	if (entityType === 'video') {
		extractVideoMetadata(result, metadata);
	}

	// Metadatos de audio
	if (entityType === 'audio') {
		extractAudioMetadata(result, metadata);
	}

	// Metadatos de JSON
	if (entityType === 'jsonFile') {
		extractJSONMetadata(result, metadata);
	}

	// Metadatos de documentos (markdown, txt, etc.)
	if (entityType === 'document') {
		extractDocumentMetadata(result, metadata);
	}

	return metadata;
};

/**
 * Hook para manejar la carga de metadatos mejorados
 */
export const useEnhancedMetadata = (item?: AnyEntityWithStats) => {
	const [enhancedMetadata, setEnhancedMetadata] = useState<MetadataField[]>([]);
	const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadEnhancedMetadata = useCallback(async () => {
		// Verificar si es un tipo de archivo soportado
		const supportedTypes = ['image', 'video', 'audio', 'jsonFile', 'document'];
		if (!item) {
			setEnhancedMetadata([]);
			return;
		}

		if (!supportedTypes.includes(item.entityType)) {
			setEnhancedMetadata([]);
			return;
		}

		setError(null);
		setIsLoadingMetadata(true);
		try {
			// Configurar opciones según el tipo de archivo
			const options: EnhancedMetadataOptions = {
				includeExif: item.entityType === 'image',
				includeIptc: item.entityType === 'image',
				includeXmp: item.entityType === 'image',
				detectAIOrigin: item.entityType === 'image',
			};

			const raw = await fetchMetadataFromAPI(item, options);
			const normalized = normalizeMetadataResponse(raw);
			if (!normalized.success) {
				console.warn('⚠️ Metadata extraction was unsuccessful', raw);
				setEnhancedMetadata([]);
				setError('Extraction was unsuccessful');
				return;
			}
			const metadata = processMetadataResult(normalized, item);
			setEnhancedMetadata(metadata);
		} catch (e) {
			console.error('Could not retrieve enhanced metadata:', e);
			setEnhancedMetadata([]);
			setError(e instanceof Error ? e.message : 'Unknown error');
		} finally {
			setIsLoadingMetadata(false);
		}
	}, [item]);

	useEffect(() => {
		const supportedTypes = ['image', 'video', 'audio', 'jsonFile', 'document'];
		if (item && supportedTypes.includes(item.entityType)) {
			loadEnhancedMetadata();
		} else {
			setEnhancedMetadata([]);
		}
	}, [item, loadEnhancedMetadata]);

	// Función para exportar metadatos
	const exportMetadata = useCallback(
		(format: 'json' | 'csv' = 'json') => {
			if (!item) return null;

			const exportData = {
				filename: 'name' in item ? item.name : 'unknown',
				entityType: item.entityType,
				extractedAt: new Date().toISOString(),
				metadata: enhancedMetadata.reduce(
					(acc, meta) => {
						acc[meta.key] = meta.value;
						if (meta.category) {
							acc[`${meta.key}_category`] = meta.category;
						}
						return acc;
					},
					{} as Record<string, string>
				),
				itemDetails: {
					id: item.id,
					hash: 'hash' in item ? item.hash : undefined,
				},
			};

			if (format === 'json') {
				const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${exportData.filename}_metadata.json`;
				a.click();
				URL.revokeObjectURL(url);
			} else if (format === 'csv') {
				const headers = ['Key', 'Value', 'Category'];
				const rows = enhancedMetadata.map((meta) => [`"${meta.key}"`, `"${meta.value}"`, `"${meta.category || ''}"`]);
				const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
				const blob = new Blob([csvContent], { type: 'text/csv' });
				const url = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = url;
				a.download = `${exportData.filename}_metadata.csv`;
				a.click();
				URL.revokeObjectURL(url);
			}

			return exportData;
		},
		[item, enhancedMetadata]
	);

	return {
		enhancedMetadata,
		isLoadingMetadata,
		error,
		refetch: loadEnhancedMetadata,
		exportMetadata,
	};
};

import { useEffect, useState } from 'react';
import type { AnyEntityWithStats } from '@/types/entities';
import {
	extractAIMetadata,
	extractEXIFMetadata,
	extractIPTCMetadata,
	extractXMPMetadata,
} from '../metadata/enhanced-metadata-extractors';
import type { EnhancedMetadataOptions, EnhancedMetadataResult, MetadataField } from '../types';

/**
 * Obtiene la ruta del archivo desde una entidad
 */
const getFilePath = (item: AnyEntityWithStats): string | null => {
	if ('path' in item && typeof item.path === 'string' && item.path) {
		return item.path;
	}
	return null;
};

/**
 * Agrega el hash del item a los metadatos si existe
 */
const addHashMetadata = (item: AnyEntityWithStats, metadata: MetadataField[]): void => {
	if ('hash' in item && typeof item.hash === 'string') {
		metadata.push({
			key: 'Hash',
			value: `${item.hash.substring(0, 16)}...`,
			category: 'técnico',
		});
	}
};

/**
 * Realiza la llamada a la API de extracción de metadatos
 */
const fetchMetadataFromAPI = async (
	filePath: string,
	options: EnhancedMetadataOptions
): Promise<EnhancedMetadataResult> => {
	const response = await fetch('/api/metadata-advanced/extract-from-path', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			filePath,
			options,
		}),
	});

	if (!response.ok) {
		throw new Error(`Error al extraer metadatos: ${response.statusText}`);
	}

	return response.json();
};

/**
 * Procesa el resultado de la API y extrae todos los metadatos
 */
const processMetadataResult = (result: EnhancedMetadataResult, item: AnyEntityWithStats): MetadataField[] => {
	const metadata: MetadataField[] = [];

	// Agregar hash si existe
	addHashMetadata(item, metadata);

	// Extraer diferentes tipos de metadatos
	extractAIMetadata(result, metadata);
	extractEXIFMetadata(result, metadata);
	extractIPTCMetadata(result, metadata);
	extractXMPMetadata(result, metadata);

	return metadata;
};

/**
 * Hook para manejar la carga de metadatos mejorados
 */
export const useEnhancedMetadata = (item?: AnyEntityWithStats) => {
	const [enhancedMetadata, setEnhancedMetadata] = useState<MetadataField[]>([]);
	const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);

	useEffect(() => {
		const loadEnhancedMetadata = async () => {
			// Solo procesar imágenes
			if (!item || item.entityType !== 'image') {
				setEnhancedMetadata([]);
				return;
			}

			const filePath = getFilePath(item);
			if (!filePath) {
				console.warn('❌ No se encontró la ruta del archivo en item.path');
				setEnhancedMetadata([]);
				return;
			}

			setIsLoadingMetadata(true);

			try {
				console.log('📁 Usando ruta del archivo:', filePath);

				const options: EnhancedMetadataOptions = {
					includeExif: true,
					includeIptc: true,
					includeXmp: true,
					detectAIOrigin: true,
				};

				const result = await fetchMetadataFromAPI(filePath, options);

				if (!result.success) {
					console.error('Error en la extracción de metadatos:', result.error);
					setEnhancedMetadata([]);
					return;
				}

				const metadata = processMetadataResult(result, item);

				console.log('✅ Metadatos extraídos exitosamente:', metadata.length, 'campos');
				setEnhancedMetadata(metadata);
			} catch (error) {
				console.error('Error al obtener metadatos mejorados:', error);
				setEnhancedMetadata([]);
			} finally {
				setIsLoadingMetadata(false);
			}
		};

		if (item?.entityType === 'image') {
			loadEnhancedMetadata();
		} else {
			setEnhancedMetadata([]);
		}
	}, [item]);

	return {
		enhancedMetadata,
		isLoadingMetadata,
	};
};

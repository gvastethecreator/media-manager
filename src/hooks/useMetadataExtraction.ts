/**
 * Hook personalizado para integrar el nuevo sistema de extracción de metadatos
 * con los componentes de la UI
 */

import { useCallback, useState } from 'react';
import type { UIMetadataResult } from '@/services/metadata-integration.service';
import { metadataIntegrationService } from '@/services/metadata-integration.service';

export interface UseMetadataExtractionResult {
	isLoading: boolean;
	error: string | null;
	result: UIMetadataResult | null;
	extractMetadata: (filePath: string) => Promise<void>;
	clearResult: () => void;
}

/**
 * Hook para manejar la extracción de metadatos en componentes React
 */
export const useMetadataExtraction = (): UseMetadataExtractionResult => {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [result, setResult] = useState<UIMetadataResult | null>(null);

	const extractMetadata = useCallback(async (filePath: string) => {
		setIsLoading(true);
		setError(null);
		setResult(null);

		try {
			const metadata = await metadataIntegrationService.extractMetadataForUI(filePath);
			setResult(metadata);

			if (!metadata.success && metadata.error) {
				setError(metadata.error);
			}
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
			setError(`Error al extraer metadatos: ${errorMessage}`);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const clearResult = useCallback(() => {
		setResult(null);
		setError(null);
		setIsLoading(false);
	}, []);

	return {
		isLoading,
		error,
		result,
		extractMetadata,
		clearResult,
	};
};

/**
 * Hook para formatear metadatos existentes al nuevo formato
 */
export const useMetadataFormatter = () => {
	const formatExistingMetadata = useCallback((metadataString: string) => {
		try {
			const parsed = JSON.parse(metadataString);

			// Si ya es el nuevo formato, usar directamente
			if (parsed.success && (parsed.ai_metadata || parsed.origin)) {
				const formatted = metadataIntegrationService.formatMetadataForUI(parsed);
				return metadataIntegrationService.flattenMetadataForUI(formatted);
			}

			// Si es formato legacy, convertir lo que se pueda
			const legacyResult: Array<{ key: string; value: string; category: string }> = [];

			// Intentar extraer metadatos IA del formato legacy
			if (parsed.ai) {
				const ai = parsed.ai;
				if (ai.prompt) {
					const promptText = ai.prompt.length > 150 ? `${ai.prompt.substring(0, 150)}...` : ai.prompt;
					legacyResult.push({ key: 'Prompt', value: promptText, category: 'ia' });
				}
				if (ai.model) legacyResult.push({ key: 'Modelo', value: ai.model, category: 'ia' });
				if (ai.steps) legacyResult.push({ key: 'Pasos', value: ai.steps.toString(), category: 'ia' });
				if (ai.cfg) legacyResult.push({ key: 'CFG Scale', value: ai.cfg.toString(), category: 'ia' });
				if (ai.seed) legacyResult.push({ key: 'Seed', value: ai.seed.toString(), category: 'ia' });
				if (ai.sampler) legacyResult.push({ key: 'Sampler', value: ai.sampler, category: 'ia' });
			}

			// EXIF legacy
			if (parsed.exif) {
				const exif = parsed.exif;
				if (exif.make || exif.model) {
					const camera = `${exif.make || ''} ${exif.model || ''}`.trim();
					if (camera) legacyResult.push({ key: 'Cámara', value: camera, category: 'exif' });
				}
				if (exif.iso) legacyResult.push({ key: 'ISO', value: exif.iso.toString(), category: 'exif' });
				if (exif.fNumber) legacyResult.push({ key: 'Apertura', value: `f/${exif.fNumber}`, category: 'exif' });
				if (exif.dateTimeOriginal)
					legacyResult.push({ key: 'Fecha Captura', value: exif.dateTimeOriginal, category: 'exif' });
			}

			// IPTC legacy
			if (parsed.iptc) {
				const iptc = parsed.iptc;
				if (iptc.headline) legacyResult.push({ key: 'Título', value: iptc.headline, category: 'iptc' });
				if (iptc.caption) legacyResult.push({ key: 'Descripción', value: iptc.caption, category: 'iptc' });
				if (iptc.keywords) legacyResult.push({ key: 'Palabras Clave', value: iptc.keywords, category: 'iptc' });
			}

			// Metadatos técnicos
			if (parsed.format) legacyResult.push({ key: 'Formato', value: parsed.format, category: 'técnico' });
			if (parsed.compression) legacyResult.push({ key: 'Compresión', value: parsed.compression, category: 'técnico' });
			if (parsed.bitDepth)
				legacyResult.push({ key: 'Profundidad Bits', value: `${parsed.bitDepth} bits`, category: 'técnico' });

			return legacyResult;
		} catch {
			return [];
		}
	}, []);

	return { formatExistingMetadata };
};

/**
 * Hook simplificado para componentes que solo necesitan mostrar metadatos
 */
export const useFormattedMetadata = (metadataString?: string) => {
	const { formatExistingMetadata } = useMetadataFormatter();

	if (!metadataString) {
		return [];
	}

	return formatExistingMetadata(metadataString);
};

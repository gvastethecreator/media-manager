/**
 * @file Hook para gestión de thumbnails unificado
 * @module hooks/use-thumbnail
 * @description Hook React para obtener, generar y gestionar thumbnails
 *              de cualquier tipo de entidad de forma unificada
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';

/**
 * Tipos de entidades soportadas
 */
export type ThumbnailEntityType = 'image' | 'video' | 'audio' | 'document' | 'jsonFile' | 'file3d';

/**
 * Opciones de thumbnail
 */
export interface ThumbnailOptions {
	width?: number;
	height?: number;
	quality?: 'low' | 'medium' | 'high';
	force?: boolean;
}

/**
 * Estado del thumbnail
 */
export interface ThumbnailState {
	url: string | null;
	loading: boolean;
	error: string | null;
	exists: boolean;
}

/**
 * Información del thumbnail
 */
export interface ThumbnailInfo {
	hasThumbnail: boolean;
	mimeType?: string;
	width?: number;
	height?: number;
	url?: string;
	generatedAt?: string;
}

// ===================== CONSTANTES =====================

const DEFAULT_PLACEHOLDER = '/file.svg';
const PLACEHOLDERS: Record<ThumbnailEntityType, string> = {
	image: '/file.svg',
	video: '/file.svg',
	audio: '/file.svg',
	document: '/file.svg',
	jsonFile: '/file.svg',
	file3d: '/file.svg',
};

// ===================== HOOK PRINCIPAL =====================

/**
 * Hook para obtener thumbnail de una entidad
 */
export function useThumbnail(
	entityType: ThumbnailEntityType | null,
	entityId: string | null,
	options: ThumbnailOptions = {}
) {
	const [state, setState] = useState<ThumbnailState>({
		url: null,
		loading: false,
		error: null,
		exists: false,
	});

	const abortControllerRef = useRef<AbortController | null>(null);
	const retriesRef = useRef(0);
	const maxRetries = 2;

	const fetchThumbnail = useCallback(async () => {
		if (!(entityType && entityId)) {
			setState((s) => ({ ...s, url: null, exists: false }));
			return;
		}

		// Cancelar petición anterior
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		abortControllerRef.current = new AbortController();

		setState((s) => ({ ...s, loading: true, error: null }));

		try {
			// Construir URL con parámetros
			const params = new URLSearchParams();
			if (options.width) params.set('width', options.width.toString());
			if (options.height) params.set('height', options.height.toString());
			if (options.quality) params.set('quality', options.quality);
			if (options.force) params.set('force', 'true');

			const queryString = params.toString();
			const url = `/api/thumbnails/unified/${mapEntityTypeToRoute(entityType)}/${entityId}${queryString ? `?${queryString}` : ''}`;

			// Hacer petición
			const response = await fetch(url, {
				signal: abortControllerRef.current.signal,
			});

			if (response.ok) {
				const blob = await response.blob();
				const objectUrl = URL.createObjectURL(blob);

				setState({
					url: objectUrl,
					loading: false,
					error: null,
					exists: true,
				});
				retriesRef.current = 0;
			} else if (response.status === 404) {
				// No existe thumbnail, intentar generar
				if (retriesRef.current < maxRetries) {
					retriesRef.current++;
					await generateThumbnail();
				} else {
					setState({
						url: null,
						loading: false,
						error: 'Thumbnail not found',
						exists: false,
					});
				}
			} else {
				throw new Error(`HTTP ${response.status}`);
			}
		} catch (error) {
			if (error instanceof Error && error.name === 'AbortError') {
				return;
			}

			clientLogger.warn('Error fetching thumbnail:', error);
			setState({
				url: null,
				loading: false,
				error: error instanceof Error ? error.message : 'Unknown error',
				exists: false,
			});
		}
	}, [entityType, entityId, options.width, options.height, options.quality, options.force]);

	const generateThumbnail = useCallback(async () => {
		if (!(entityType && entityId)) return;

		setState((s) => ({ ...s, loading: true, error: null }));

		try {
			const response = await fetch('/api/thumbnails/unified/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					entityType,
					entityId,
					options,
				}),
			});

			if (response.ok) {
				// Volver a intentar obtener el thumbnail
				await fetchThumbnail();
			} else {
				const error = await response.json();
				throw new Error(error.error || 'Generation failed');
			}
		} catch (error) {
			clientLogger.warn('Error generating thumbnail:', error);
			setState({
				url: null,
				loading: false,
				error: error instanceof Error ? error.message : 'Generation failed',
				exists: false,
			});
		}
	}, [entityType, entityId, options, fetchThumbnail]);

	const refresh = useCallback(() => {
		retriesRef.current = 0;
		fetchThumbnail();
	}, [fetchThumbnail]);

	// Efecto para cargar thumbnail
	useEffect(() => {
		fetchThumbnail();

		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
			// Limpiar object URL si existe
			if (state.url?.startsWith('blob:')) {
				URL.revokeObjectURL(state.url);
			}
		};
	}, [fetchThumbnail]);

	return {
		...state,
		refresh,
		generate: generateThumbnail,
		placeholder: entityType ? PLACEHOLDERS[entityType] : DEFAULT_PLACEHOLDER,
	};
}

// ===================== HOOK PARA BATCH =====================

/**
 * Hook para obtener múltiples thumbnails
 */
export function useThumbnailsBatch(
	requests: Array<{ entityType: ThumbnailEntityType; entityId: string }>,
	options: ThumbnailOptions = {}
) {
	const [urls, setUrls] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchBatch = useCallback(async () => {
		if (requests.length === 0) return;

		setLoading(true);
		setError(null);

		try {
			const response = await fetch('/api/thumbnails/unified/batch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ requests, options }),
			});

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}`);
			}

			const data = await response.json();

			if (data.success) {
				// Las URLs deben solicitarse individualmente ya que son blobs
				// Por ahora, marcamos cuáles están disponibles
				const newUrls: Record<string, string> = {};
				for (const [key, result] of Object.entries(data.results)) {
					const typedResult = result as { success: boolean };
					if (typedResult.success) {
						const [type, id] = key.split(':');
						newUrls[key] = `/api/thumbnails/unified/${mapEntityTypeToRoute(type as ThumbnailEntityType)}/${id}`;
					}
				}
				setUrls(newUrls);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Batch fetch failed');
		} finally {
			setLoading(false);
		}
	}, [requests, options]);

	useEffect(() => {
		fetchBatch();
	}, [fetchBatch]);

	return { urls, loading, error, refresh: fetchBatch };
}

// ===================== HOOK PARA INFO =====================

/**
 * Hook para obtener información del thumbnail sin descargarlo
 */
export function useThumbnailInfo(entityType: ThumbnailEntityType | null, entityId: string | null) {
	const [info, setInfo] = useState<ThumbnailInfo | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchInfo = useCallback(async () => {
		if (!(entityType && entityId)) {
			setInfo(null);
			return;
		}

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/thumbnails/unified/info/${entityType}/${entityId}`);

			if (response.ok) {
				const data = await response.json();
				setInfo(data);
			} else {
				throw new Error(`HTTP ${response.status}`);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to fetch info');
		} finally {
			setLoading(false);
		}
	}, [entityType, entityId]);

	useEffect(() => {
		fetchInfo();
	}, [fetchInfo]);

	return { info, loading, error, refresh: fetchInfo };
}

// ===================== FUNCIONES UTILITARIAS =====================

/**
 * Genera URL de thumbnail directamente (sin hook)
 */
export function getThumbnailUrl(
	entityType: ThumbnailEntityType,
	entityId: string,
	options: ThumbnailOptions = {}
): string {
	const params = new URLSearchParams();
	if (options.width) params.set('width', options.width.toString());
	if (options.height) params.set('height', options.height.toString());
	if (options.quality) params.set('quality', options.quality);

	const queryString = params.toString();
	const baseUrl = `/api/thumbnails/unified/${mapEntityTypeToRoute(entityType)}/${entityId}`;

	return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Genera thumbnails en batch (función utilitaria)
 */
export async function generateThumbnailsBatch(
	requests: Array<{ entityType: ThumbnailEntityType; entityId: string }>,
	options: ThumbnailOptions = {}
): Promise<{
	success: boolean;
	summary?: {
		total: number;
		successful: number;
		failed: number;
		generated: number;
	};
	error?: string;
}> {
	try {
		const response = await fetch('/api/thumbnails/unified/batch', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ requests, options }),
		});

		if (!response.ok) {
			const error = await response.json();
			return { success: false, error: error.error || 'Batch generation failed' };
		}

		return await response.json();
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : 'Batch generation failed',
		};
	}
}

// ===================== HELPERS =====================

function mapEntityTypeToRoute(entityType: ThumbnailEntityType): string {
	const mapping: Record<ThumbnailEntityType, string> = {
		image: 'image',
		video: 'video',
		audio: 'audio',
		document: 'document',
		jsonFile: 'json',
		file3d: '3d',
	};
	return mapping[entityType] || entityType;
}

// ===================== EXPORTS =====================

export default useThumbnail;

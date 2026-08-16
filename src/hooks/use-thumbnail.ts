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
	force?: boolean;
	height?: number;
	quality?: 'low' | 'medium' | 'high';
	width?: number;
}

/**
 * Estado del thumbnail
 */
export interface ThumbnailState {
	error: string | null;
	exists: boolean;
	loading: boolean;
	url: string | null;
}

/**
 * Información del thumbnail
 */
export interface ThumbnailInfo {
	generatedAt?: string;
	hasThumbnail: boolean;
	height?: number;
	mimeType?: string;
	url?: string;
	width?: number;
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
	const currentUrlRef = useRef<string | null>(null);

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
				// Revocar URL anterior antes de crear nueva (previene memory leak)
				if (currentUrlRef.current) {
					URL.revokeObjectURL(currentUrlRef.current);
				}
				const objectUrl = URL.createObjectURL(blob);
				currentUrlRef.current = objectUrl;

				setState({
					url: objectUrl,
					loading: false,
					error: null,
					exists: true,
				});
			} else if (response.status === 404) {
				setState({
					url: null,
					loading: false,
					error: 'Miniatura no disponible',
					exists: false,
				});
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
				const error = await response.json().catch(() => null);
				throw new Error(typeof error?.error === 'string' ? error.error : `Generation failed (HTTP ${response.status})`);
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
			if (currentUrlRef.current) {
				URL.revokeObjectURL(currentUrlRef.current);
				currentUrlRef.current = null;
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
	const abortRef = useRef<AbortController | null>(null);

	const fetchBatch = useCallback(async () => {
		if (requests.length === 0) return;

		// Cancelar petición anterior
		if (abortRef.current) {
			abortRef.current.abort();
		}
		abortRef.current = new AbortController();

		setLoading(true);
		setError(null);

		try {
			const response = await fetch('/api/thumbnails/unified/batch', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ requests, options }),
				signal: abortRef.current.signal,
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
			if (err instanceof Error && err.name === 'AbortError') return;
			setError(err instanceof Error ? err.message : 'Batch fetch failed');
		} finally {
			setLoading(false);
		}
	}, [requests, options]);

	useEffect(() => {
		fetchBatch();
		return () => {
			abortRef.current?.abort();
		};
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
	const abortRef = useRef<AbortController | null>(null);

	const fetchInfo = useCallback(async () => {
		if (!(entityType && entityId)) {
			setInfo(null);
			return;
		}

		if (abortRef.current) {
			abortRef.current.abort();
		}
		abortRef.current = new AbortController();

		setLoading(true);
		setError(null);

		try {
			const response = await fetch(`/api/thumbnails/unified/info/${entityType}/${entityId}`, {
				signal: abortRef.current.signal,
			});

			if (response.ok) {
				const data = await response.json();
				setInfo(data);
			} else {
				throw new Error(`HTTP ${response.status}`);
			}
		} catch (err) {
			if (err instanceof Error && err.name === 'AbortError') return;
			setError(err instanceof Error ? err.message : 'Failed to fetch info');
		} finally {
			setLoading(false);
		}
	}, [entityType, entityId]);

	useEffect(() => {
		fetchInfo();
		return () => {
			abortRef.current?.abort();
		};
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

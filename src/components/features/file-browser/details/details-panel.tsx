'use client';

import { updateImageStats } from '@/app/actions/images';
import { parseMetadata } from '@/app/actions/metadata';
import { getAIGenerationInfo } from '@/app/actions/metadata/metadata-parsers.actions';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import type { FileMetadata } from '@/types/metadata.types';
import { Bug, FileImage, Loader2 } from 'lucide-react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AIGenerationInfo } from './details-panel-ai-generation-info';
import { BasicInfo } from './details-panel-basic-info';
import { ImagePreview } from './details-panel-image-preview';
import { TechnicalInfo } from './details-panel-metadata-sections';
import type { DetailsPanelProps } from './details-panel-types';
import { getMetadata } from './details-panel-utils';

// Logger para el panel de detalles
const detailsLogger = {
	info: (message: string, data?: unknown) => console.info(`[DetailsPanel] ${message}`, data || ''),
	warn: (message: string, data?: unknown) => console.warn(`[DetailsPanel] ${message}`, data || ''),
	error: (message: string, data?: unknown) => console.error(`[DetailsPanel] ${message}`, data || ''),
};

// Componente temporal para secciones que faltan
function RelatedEntities() {
	return (
		<div className="p-3 border border-dashed border-muted-foreground/30 rounded-md">
			<p className="text-xs text-muted-foreground text-center">Esta funcionalidad está en desarrollo.</p>
		</div>
	);
}

// Componentes memoizados para reducir renderizados
const MemoizedImagePreview = React.memo(ImagePreview);
const MemoizedBasicInfo = React.memo(BasicInfo);
const MemoizedTechnicalInfo = React.memo(TechnicalInfo);
const MemoizedAIGenerationInfo = React.memo(AIGenerationInfo);
const MemoizedRelatedEntities = React.memo(RelatedEntities);

// Cache para evitar múltiples llamadas a parseMetadata
const metadataRequestCache = new Map<string, Promise<FileMetadata | null>>();
const METADATA_CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * Analiza un objeto de metadatos para extraer información útil
 */
async function parseMetadataDirectly(rawMetadata: string | null): Promise<FileMetadata | null> {
	if (!rawMetadata) {
		return null;
	}

	try {
		// Intentar parsear el JSON
		const parsed = JSON.parse(rawMetadata);

		// Construir objeto resultado
		const result: Partial<FileMetadata> = {};

		// Copiar propiedades básicas
		if (parsed.dimensions) {
			result.dimensions = parsed.dimensions;
		}
		if (parsed.mimeType) {
			result.mimeType = parsed.mimeType;
		}
		if (parsed.colorSpace) {
			result.colorSpace = parsed.colorSpace;
		}
		if (parsed.hasAlpha !== undefined) {
			result.hasAlpha = parsed.hasAlpha;
		}
		if (parsed.isAnimated !== undefined) {
			result.isAnimated = parsed.isAnimated;
		}

		// Copiar EXIF
		if (parsed.exif) {
			result.exif = parsed.exif;
		}

		// Copiar XMP
		if (parsed.xmp) {
			result.xmp = parsed.xmp;
		}

		// Copiar IPTC
		if (parsed.iptc) {
			result.iptc = parsed.iptc;
		}

		// Usar la función del servidor para extraer información de generación por IA
		try {
			detailsLogger.info('Intentando extraer información de generación AI mediante parsers especializados');
			const aiGenerationInfo = await getAIGenerationInfo(parsed);

			if (aiGenerationInfo) {
				detailsLogger.info('Información de generación AI extraída con éxito', {
					tipo: aiGenerationInfo.type,
					modelo: aiGenerationInfo.model,
				});
				result.generation = aiGenerationInfo;
			} else {
				detailsLogger.warn('No se pudo extrair información de generación AI con parsers especializados');
			}
		} catch (error) {
			detailsLogger.error(
				'Error al extraer información de generación AI:',
				error instanceof Error ? error.message : String(error)
			);
		}

		// Si no hay propiedades, retornar null
		return Object.keys(result).length > 0 ? (result as FileMetadata) : null;
	} catch (error) {
		console.error('Error en parseMetadataDirectly:', error);
		return null;
	}
}

// Componente para mostrar múltiples imágenes seleccionadas
const MultipleSelectionInfo = React.memo(({ items }: { items: ImageItem[] }) => {
	return (
		<div className="p-4 space-y-2">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium">{items.length} imágenes seleccionadas</span>
			</div>
			<div className="grid grid-cols-2 gap-2">
				{items.map((item) => (
					<div key={item.id} className="relative aspect-square">
						<img
							src={item.url || item.src}
							alt={item.name}
							className="w-full h-full object-cover rounded-md"
						/>
					</div>
				))}
			</div>
		</div>
	);
});

MultipleSelectionInfo.displayName = 'MultipleSelectionInfo';

/**
 * Panel de detalles para mostrar información de imágenes seleccionadas
 */
export function DetailsPanel({ selectedItems }: DetailsPanelProps) {
	// Estados y refs
	const [metadata, setMetadata] = useState<FileMetadata | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const { toast } = useToast();
	const prevItemRef = useRef<string | null>(null);
	const metadataTimeoutRef = useRef<NodeJS.Timeout | null>(null);

	// Determinar si hay múltiples items seleccionados
	const hasMultipleSelection = selectedItems.length > 1;
	const item = selectedItems[0] || null;

	// Función memoizada para obtener metadata
	const fetchMetadata = useCallback(async (itemId: string, itemMetadata: string | null) => {
		try {
			// Si ya tenemos metadata parseada en el item, usarla directamente
			if (itemMetadata && typeof itemMetadata === 'object') {
				detailsLogger.info('Usando metadata pre-parseada del item');
				return itemMetadata as FileMetadata;
			}

			// Generar clave de caché única
			const cacheKey = `${itemId}-${itemMetadata ? btoa(itemMetadata).slice(0, 10) : 'no-metadata'}`;

			// Primero intentar usar la metadata local si está disponible
			if (itemMetadata) {
				const localMetadata = getMetadata(itemMetadata);
				if (localMetadata) {
					detailsLogger.info('Usando metadata local parseada');
					return localMetadata;
				}
			}

			// Verificar caché
			const cachedRequest = metadataRequestCache.get(cacheKey);
			if (cachedRequest) {
				detailsLogger.info('Usando metadata desde caché');
				return await cachedRequest;
			}

			// Crear nueva promesa para la petición
			detailsLogger.info('Solicitando metadata del servidor');
			const metadataPromise = parseMetadata(itemId).then(result => {
				// Si no hay resultado del servidor pero tenemos metadata local, intentar parsearla directamente
				if (!result && itemMetadata) {
					detailsLogger.info('Intentando parsear metadata local directamente');
					return parseMetadataDirectly(itemMetadata);
				}
				return result;
			});

			// Guardar en caché con tiempo de expiración
			metadataRequestCache.set(cacheKey, metadataPromise);
			setTimeout(() => {
				if (metadataRequestCache.has(cacheKey)) {
					detailsLogger.info('Limpiando entrada de caché expirada', { cacheKey });
					metadataRequestCache.delete(cacheKey);
				}
			}, METADATA_CACHE_DURATION);

			return await metadataPromise;
		} catch (error) {
			detailsLogger.error('Error obteniendo metadata:', error);
			return null;
		}
	}, []);

	// Efecto para limpiar el caché periódicamente
	useEffect(() => {
		const cleanupInterval = setInterval(() => {
			const now = Date.now();
			let entriesRemoved = 0;

			for (const [key, promise] of metadataRequestCache.entries()) {
				promise.then(() => {
					metadataRequestCache.delete(key);
					entriesRemoved++;
				});
			}

			if (entriesRemoved > 0) {
				detailsLogger.info(`Limpieza de caché: ${entriesRemoved} entradas eliminadas`);
			}
		}, METADATA_CACHE_DURATION);

		return () => clearInterval(cleanupInterval);
	}, []);

	// Efecto para cargar metadata cuando cambia el ítem seleccionado
	useEffect(() => {
		if (!item || hasMultipleSelection) {
			setMetadata(null);
			prevItemRef.current = null;
			return;
		}

		// Evitar recargar si es el mismo ítem
		if (prevItemRef.current === item.id) {
			return;
		}

		prevItemRef.current = item.id;
		let isMounted = true;
		let timeoutId: NodeJS.Timeout | null = null;

		const loadMetadata = async () => {
			if (!isMounted) return;

			setIsProcessing(true);

			try {
				// Intentar usar metadata pre-parseada si existe
				if (item.parsedMetadata) {
					setMetadata(item.parsedMetadata as FileMetadata);
					setIsProcessing(false);
					return;
				}

				const result = await fetchMetadata(item.id, item.metadata);

				if (!isMounted) return;

				if (result) {
					setMetadata(result);

					// Actualizar estadísticas con debounce
					if (metadataTimeoutRef.current) {
						clearTimeout(metadataTimeoutRef.current);
					}

					timeoutId = setTimeout(() => {
						if (isMounted) {
							updateImageStats(item.id, 'view').catch((err: Error) =>
								detailsLogger.error('Error actualizando estadísticas:', err)
							);
						}
					}, 1000);

					metadataTimeoutRef.current = timeoutId;
				} else {
					setMetadata(null);
				}
			} catch (error) {
				if (isMounted) {
					detailsLogger.error('Error cargando metadata:', error);
					setMetadata(null);
				}
			} finally {
				if (isMounted) {
					setIsProcessing(false);
				}
			}
		};

		loadMetadata();

		return () => {
			isMounted = false;
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			if (metadataTimeoutRef.current) {
				clearTimeout(metadataTimeoutRef.current);
			}
		};
	}, [item, hasMultipleSelection, fetchMetadata]);

	// Función memoizada para depuración
	const handleDebug = useCallback(() => {
		console.group('🔍 Depuración de Metadata');
		if (item?.metadata) {
			try {
				const metadataObj = typeof item.metadata === 'string' ? JSON.parse(item.metadata) : item.metadata;
				console.table(metadataObj);
			} catch (_error) {
				console.error('Error al analizar metadata:', item.metadata);
			}
		}
		console.groupEnd();

		toast({
			title: 'Depuración',
			description: 'Información impresa en la consola del navegador (F12)',
		});
	}, [item, toast]);

	// Determina el tipo de generador de IA a partir de los metadatos - memoizado
	const getGeneratorType = useCallback((generation: unknown) => {
		const gen = generation as Record<string, unknown>;
		if (!gen || !gen.type) {
			return 'unknown';
		}

		const type = String(gen.type).toLowerCase();

		if (type.includes('stable-diffusion') || type === 'sd' || type === 'a1111') {
			return 'Stable Diffusion';
		}
		if (type.includes('comfyui') || type === 'comfy') {
			return 'ComfyUI';
		}
		if (type.includes('invoke') || type === 'invoke-ai') {
			return 'InvokeAI';
		}
		if (type.includes('novel') || type === 'novel-ai') {
			return 'NovelAI';
		}
		if (type.includes('midjourney') || type === 'mj') {
			return 'Midjourney';
		}
		if (type.includes('dalle') || type.includes('dall-e')) {
			return 'DALL-E';
		}

		return String(gen.type) || 'Desconocido';
	}, []);

	// Determinar si hay información de generación AI - memoizado
	const hasAIGeneration = useMemo(() => metadata?.generation !== undefined, [metadata]);

	// Contenido del panel memoizado
	const renderPanelContent = useMemo(() => {
		if (!item && !hasMultipleSelection) {
			return (
				<div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
					<FileImage className="h-12 w-12 mb-4 opacity-20" />
					<p className="text-sm">Selecciona una imagen para ver sus detalles</p>
				</div>
			);
		}

		if (hasMultipleSelection) {
			return <MultipleSelectionInfo items={selectedItems} />;
		}

		if (isProcessing) {
			return (
				<div className="flex-1 flex items-center justify-center p-4">
					<div className="text-center">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
						<p className="text-xs text-muted-foreground">Cargando información...</p>
					</div>
				</div>
			);
		}

		return (
			<div className="flex-1 flex flex-col overflow-hidden">
				<ScrollArea className="flex-1 overflow-auto">
					<div className="p-3 pb-6 space-y-4">
						{/* Vista previa de imagen */}
						<div className="w-full aspect-square sm:aspect-video bg-muted/30 rounded-md overflow-hidden">
							<MemoizedImagePreview item={item} />
						</div>

						{/* Sección: Información general */}
						<div className="space-y-2">
							<h3 className="text-xs font-medium text-muted-foreground border-b border-border/10 pb-1 mb-1">
								Información general
							</h3>
							<MemoizedBasicInfo item={item} metadata={metadata} />
						</div>

						{/* Sección: Información técnica */}
						<div className="space-y-2">
							<h3 className="text-xs font-medium text-muted-foreground border-b border-border/10 pb-1 mb-1">
								Información técnica
							</h3>
							<MemoizedTechnicalInfo metadata={metadata} />
						</div>

						{/* Sección: Información de generación AI (condicional) */}
						{hasAIGeneration && metadata?.generation && (
							<div className="space-y-2">
								<h3 className="text-xs font-medium text-muted-foreground border-b border-border/10 pb-1 mb-1">
									Generación por IA
								</h3>
								<MemoizedAIGenerationInfo generation={metadata.generation} />
							</div>
						)}

						{/* Sección: Entidades relacionadas */}
						<div className="space-y-2">
							<h3 className="text-xs font-medium text-muted-foreground border-b border-border/10 pb-1 mb-1">
								Elementos relacionados
							</h3>
							<MemoizedRelatedEntities />
						</div>
					</div>
				</ScrollArea>
			</div>
		);
	}, [item, hasMultipleSelection, isProcessing, metadata, hasAIGeneration, selectedItems]);

	// Estado memoizado para el header del panel
	const renderPanelHeader = useMemo(() => (
		<CardHeader className="p-3 pb-2 border-b border-border/10 space-y-1">
			<CardTitle className="flex justify-between items-center">
				<span className="text-sm font-medium">
					{hasMultipleSelection ? `${selectedItems.length} imágenes seleccionadas` : 'Detalles'}
				</span>
				{item && !hasMultipleSelection && (
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 rounded-md hover:bg-secondary/50"
						onClick={handleDebug}
					>
						<Bug className="h-3.5 w-3.5 text-muted-foreground" />
					</Button>
				)}
			</CardTitle>
		</CardHeader>
	), [item, hasMultipleSelection, selectedItems.length, handleDebug]);

	return (
		<Card className="h-full flex flex-col border-border/30 rounded-md">
			{renderPanelHeader}
			{renderPanelContent}
		</Card>
	);
}

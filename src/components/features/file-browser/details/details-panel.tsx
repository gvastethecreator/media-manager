'use client';

import { updateImageStats } from '@/app/actions/images';
import { parseMetadata } from '@/app/actions/metadata';
import { getAIGenerationInfo } from '@/app/actions/metadata/metadata-parsers.actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import type { FileMetadata } from '@/types/metadata.types';
import { Bug, FileImage, Loader2 } from 'lucide-react';
import * as React from 'react';
import { useState } from 'react';
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

/**
 * Panel de detalles para mostrar información de imágenes seleccionadas
 */
export function DetailsPanel({ selectedItems }: DetailsPanelProps) {
	// Solo mostramos información de un ítem a la vez
	const item = selectedItems?.[0] || null;
	const [metadata, setMetadata] = useState<FileMetadata | null>(null);
	const [isProcessing, setIsProcessing] = useState(false);
	const [activeTab, setActiveTab] = useState('info');
	const { toast } = useToast();

	// Callback para depuración - muestra información detallada en consola
	const handleDebug = () => {
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
	};

	// Determina el tipo de generador de IA a partir de los metadatos
	const getGeneratorType = React.useCallback((generation: unknown) => {
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

	// Efecto para cargar metadata cuando cambia el ítem seleccionado
	React.useEffect(() => {
		if (!item) {
			setMetadata(null);
			return;
		}

		let mounted = true;
		setIsProcessing(true);

		// Función asíncrona para cargar metadatos
		const fetchMetadata = async () => {
			try {
				detailsLogger.info(`Cargando metadata para item: ${item.id}`, {
					name: item.name,
					hasMetadata: !!item.metadata,
					metadataPreview: item.metadata ? `${item.metadata.substring(0, 100)}...` : 'null',
				});

				// Si ya tenemos metadata en el ítem, primero intentamos usarla directamente
				if (item.metadata) {
					try {
						// Primer intento: usar getMetadata normal
						const parsedMetadata = getMetadata(item.metadata);
						if (parsedMetadata) {
							detailsLogger.info('Metadata parseada correctamente desde el item', {
								hasGeneration: !!parsedMetadata.generation,
								generationType: parsedMetadata.generation?.type,
							});

							if (mounted) {
								setMetadata(parsedMetadata);
								setIsProcessing(false);
							}

							// Actualizamos estadísticas de vistas en segundo plano
							updateImageStats(item.id, 'view').catch((err: Error) =>
								detailsLogger.error('Error actualizando estadísticas:', err)
							);
							return;
						}

						// Segundo intento: usar método alternativo de parseo con parsers especializados
						detailsLogger.info('Intentando método alternativo de parseo con parsers de IA');
						const alternativeMetadata = await parseMetadataDirectly(item.metadata);
						if (alternativeMetadata && mounted) {
							detailsLogger.info('Metadata parseada correctamente con método alternativo', {
								hasGeneration: !!alternativeMetadata.generation,
								generationType: alternativeMetadata.generation?.type,
								generatorInfo: alternativeMetadata.generation
									? getGeneratorType(alternativeMetadata.generation as unknown)
									: 'No detectado',
							});

							setMetadata(alternativeMetadata);
							setIsProcessing(false);

							// Actualizamos estadísticas de vistas en segundo plano
							updateImageStats(item.id, 'view').catch((err: Error) =>
								detailsLogger.error('Error actualizando estadísticas:', err)
							);
							return;
						}
					} catch (error) {
						detailsLogger.error('Error parseando metadata local:', error);
					}
				}

				// Añadir un timeout para la petición de metadata
				const metadataPromise = parseMetadata(item.id);
				const timeoutPromise = new Promise<null>((_, reject) => {
					setTimeout(() => {
						reject(new Error('Timeout al obtener metadata'));
					}, 10000); // 10 segundos de timeout
				});

				// Intentamos obtener metadata fresca del servidor con timeout
				const result = await Promise.race([metadataPromise, timeoutPromise]);

				if (mounted) {
					if (result) {
						detailsLogger.info('Metadata obtenida correctamente desde API', {
							hasGeneration: !!result.generation,
							generationType: result.generation?.type,
							generatorInfo: result.generation ? getGeneratorType(result.generation as unknown) : 'No detectado',
						});
						setMetadata(result);

						// Actualizamos estadísticas de vistas en segundo plano
						updateImageStats(item.id, 'view').catch((err: Error) =>
							detailsLogger.error('Error actualizando estadísticas:', err)
						);
					} else {
						detailsLogger.warn('No se encontró metadata para el ítem');
						setMetadata(null);
					}
					setIsProcessing(false);
				}
			} catch (error) {
				if (mounted) {
					detailsLogger.error('Error cargando metadata:', error);
					setMetadata(null);
					setIsProcessing(false);
				}
			}
		};

		// Ejecutar la función asíncrona
		fetchMetadata();

		// Limpieza cuando el componente se desmonta o el ítem cambia
		return () => {
			mounted = false;
		};
	}, [item, getGeneratorType]);

	// Si no hay ítem seleccionado, mostrar mensaje
	if (!item) {
		return (
			<div className="flex flex-col items-center justify-center h-full p-4 text-center text-muted-foreground">
				<FileImage className="h-12 w-12 mb-4 opacity-20" />
				<p className="text-sm">Selecciona una imagen para ver sus detalles</p>
			</div>
		);
	}

	// Determinar si hay información de generación AI
	const hasAIGeneration = metadata?.generation !== undefined;

	// Determinar si hay información de ubicación GPS
	const hasGPS = metadata?.exif?.gps !== undefined;

	return (
		<Card className="h-full flex flex-col border-border/30 rounded-md">
			{/* Header del panel */}
			<CardHeader className="p-3 pb-2 border-b border-border/10 space-y-1">
				<CardTitle className="flex justify-between items-center">
					<span className="text-sm font-medium">Detalles</span>
					{item && (
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

			{/* Contenido condicional */}
			{!item ? (
				// Mensaje cuando no hay ítem seleccionado
				<div className="flex-1 flex items-center justify-center p-4">
					<div className="text-center">
						<FileImage className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
						<h3 className="text-sm font-medium mb-1">Sin selección</h3>
						<p className="text-xs text-muted-foreground">Selecciona un archivo para ver sus detalles</p>
					</div>
				</div>
			) : isProcessing ? (
				// Estado de carga
				<div className="flex-1 flex items-center justify-center p-4">
					<div className="text-center">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground mx-auto mb-2" />
						<p className="text-xs text-muted-foreground">Cargando información...</p>
					</div>
				</div>
			) : (
				// Panel de detalles para el ítem seleccionado
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Tabs de navegación */}
					<div className="px-3 pt-1">
						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
							className="w-full"
						>
							<TabsList className="h-7 p-0.5 bg-muted/50 w-full grid grid-cols-4">
								<TabsTrigger
									value="info"
									className="h-6 px-2 text-[10px] data-[state=active]:bg-background"
								>
									General
								</TabsTrigger>
								<TabsTrigger
									value="exif"
									className="h-6 px-2 text-[10px] data-[state=active]:bg-background"
								>
									Técnica
								</TabsTrigger>
								<TabsTrigger
									value="generation"
									className="h-6 px-2 text-[10px] data-[state=active]:bg-background"
									disabled={!metadata?.generation}
								>
									<div className="flex items-center gap-1">
										IA
										{metadata?.generation && (
											<Badge
												variant="outline"
												className="h-3 px-1 text-[8px] bg-primary/5 hover:bg-primary/5 text-primary"
											>
												{getGeneratorType(metadata.generation)}
											</Badge>
										)}
									</div>
								</TabsTrigger>
								<TabsTrigger
									value="related"
									className="h-6 px-2 text-[10px] data-[state=active]:bg-background"
								>
									Relacionados
								</TabsTrigger>
							</TabsList>
						</Tabs>
					</div>

					{/* Contenedor de scroll para el contenido */}
					<ScrollArea className="flex-1 overflow-auto">
						<div className="p-3 pb-6 space-y-3">
							{/* Vista previa de imagen - usar el componente importado */}
							<div className="w-full aspect-square sm:aspect-video bg-muted/30 rounded-md overflow-hidden">
								<ImagePreview item={item} />
							</div>

							{/* Contenido según la pestaña activa */}
							{activeTab === 'info' && <BasicInfo item={item} metadata={metadata} />}
							{activeTab === 'exif' && <TechnicalInfo metadata={metadata} />}
							{activeTab === 'generation' && metadata?.generation && (
								<AIGenerationInfo generation={metadata.generation} />
							)}
							{activeTab === 'related' && <RelatedEntities />}
						</div>
					</ScrollArea>
				</div>
			)}
		</Card>
	);
}

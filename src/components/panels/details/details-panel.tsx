'use client';

import { updateImageStats } from '@/app/actions/images';
import { parseMetadata } from '@/app/actions/metadata';
import { getAIGenerationInfo } from '@/app/actions/metadata/metadata-parsers.actions';
import type { AIGenerationMetadata } from '@/app/actions/metadata/parsers/base-parser';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import type { FileItem, FileMetadata } from '@/types/file-item';
import { Bug, Loader2 } from 'lucide-react';
import * as React from 'react';

import { AIGenerationInfo } from './details-panel-ai-generation-info';
import { BasicInfo } from './details-panel-basic-info';
// Componentes y utilidades internas
import { ImagePreview } from './details-panel-image-preview';
import { ExifInfo, GPSInfo, IPTCInfo, TechnicalInfo, XMPInfo } from './details-panel-metadata-sections';
import { RelatedEntities } from './details-panel-related-entities';
import type { DetailsPanelProps } from './details-panel-types';
import { getMetadata } from './details-panel-utils';

// Logger para el panel de detalles
const detailsLogger = {
	info: (message: string, data?: unknown) => console.info(`[DetailsPanel] ${message}`, data || ''),
	warn: (message: string, data?: unknown) => console.warn(`[DetailsPanel] ${message}`, data || ''),
	error: (message: string, data?: unknown) => console.error(`[DetailsPanel] ${message}`, data || ''),
};

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
		const result: FileMetadata = {};

		// Copiar propiedades básicas
		if (parsed.dimensions) {
			result.dimensions = parsed.dimensions;
		}
		if (parsed.fileSystem) {
			result.fileSystem = parsed.fileSystem;
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
		const aiGenerationInfo = await getAIGenerationInfo(parsed);

		if (aiGenerationInfo) {
			result.generation = aiGenerationInfo;
		} else {
		}

		// Si no hay propiedades, retornar null
		return Object.keys(result).length > 0 ? result : null;
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
	const [metadata, setMetadata] = React.useState<FileMetadata | null>(null);
	const [isProcessing, setIsProcessing] = React.useState(false);
	const { toast } = useToast();

	// Callback para depuración - muestra información detallada en consola
	const handleDebug = () => {
		console.group('🔍 Depuración de Metadata');
		toast({
			title: 'Depuración',
			description: 'Información impresa en la consola del navegador (F12)',
		});
		console.groupEnd();
	};

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

						// Segundo intento: usar método alternativo de parseo
						detailsLogger.info('Intentando método alternativo de parseo con parsers de IA');
						const alternativeMetadata = await parseMetadataDirectly(item.metadata);
						if (alternativeMetadata && mounted) {
							detailsLogger.info('Metadata parseada correctamente con método alternativo', {
								hasGeneration: !!alternativeMetadata.generation,
								generationType: alternativeMetadata.generation?.type,
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
	}, [item]);

	// Si no hay ítem seleccionado, mostrar mensaje
	if (!item) {
		return (
			<div className="p-4 text-center text-muted-foreground text-sm">
				<p>Selecciona una imagen para ver sus detalles</p>
			</div>
		);
	}

	return (
		<ScrollArea className="h-full">
			<div className="flex flex-col gap-4 p-3">
				{/* Sección de vista previa de imagen */}
				<Card className="overflow-hidden">
					<div className="aspect-video bg-black">
						<ImagePreview item={item} />
					</div>
				</Card>

				{/* Botón de depuración */}
				<Button
					variant="outline"
					size="sm"
					className="w-full text-xs bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-700"
					onClick={handleDebug}
				>
					<Bug className="h-4 w-4 mr-2" />
					Depurar datos en consola (F12)
				</Button>

				{/* Sección de información básica */}
				<Card>
					<CardContent className="p-4">
						<div className="flex flex-col gap-4">
							<BasicInfo item={item} metadata={metadata} />
							<RelatedEntities item={item} />
							{metadata && (
								<>
									<AIGenerationInfo metadata={metadata} />
									<XMPInfo metadata={metadata} />
									<IPTCInfo metadata={metadata} />
									<ExifInfo metadata={metadata} />
									<GPSInfo metadata={metadata} />
									<TechnicalInfo metadata={metadata} />
								</>
							)}
							{!metadata && !isProcessing && (
								<div className="p-3 border border-dashed border-amber-500/50 rounded-md">
									<p className="text-xs text-muted-foreground">
										No se encontró información de metadatos para esta imagen. Intenta hacer clic en el botón de
										depuración para ver más detalles.
									</p>
								</div>
							)}
							{isProcessing && (
								<div className="flex justify-center py-2">
									<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
								</div>
							)}
						</div>
					</CardContent>
				</Card>
			</div>
		</ScrollArea>
	);
}

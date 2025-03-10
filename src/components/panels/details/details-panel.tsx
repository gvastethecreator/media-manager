'use client';

import { updateImageStats } from '@/app/actions/images';
import { parseMetadata } from '@/app/actions/metadata';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import type { FileItem, FileMetadata } from '@/types/file-item';
import { Loader2 } from 'lucide-react';
import * as React from 'react';

import { AIGenerationInfo } from './details-panel-ai-generation-info';
import { BasicInfo } from './details-panel-basic-info';
// Componentes y utilidades internas
import { ImagePreview } from './details-panel-image-preview';
import { ExifInfo, GPSInfo, IPTCInfo, TechnicalInfo, XMPInfo } from './details-panel-metadata-sections';
import { RelatedEntities } from './details-panel-related-entities';
import type { DetailsPanelProps } from './details-panel-types';
import { getMetadata } from './details-panel-utils';

/**
 * Panel de detalles para mostrar información de imágenes seleccionadas
 */
export function DetailsPanel({ selectedItems }: DetailsPanelProps) {
	// Solo mostramos información de un ítem a la vez
	const item = selectedItems[0];
	const [metadata, setMetadata] = React.useState<FileMetadata | null>(null);
	const [isProcessing, setIsProcessing] = React.useState(false);
	const { toast } = useToast();

	// Efecto para cargar metadata cuando cambia el ítem seleccionado
	React.useEffect(() => {
		if (!item) {
			return;
		}

		let mounted = true;
		setIsProcessing(true);

		const loadMetadata = async () => {
			try {
				setIsProcessing(true);

				// Si ya tenemos metadata en el ítem, primero intentamos usarla directamente
				if (item.metadata) {
					try {
						const parsedMetadata = getMetadata(item.metadata);
						if (parsedMetadata) {
							setMetadata(parsedMetadata);
							setIsProcessing(false);

							// Actualizamos estadísticas de vistas en segundo plano
							updateImageStats(item.id, 'view').catch((err: Error) =>
								console.error('Error actualizando estadísticas:', err)
							);
							return;
						}
						console.warn('❌ No se pudo obtener metadata del objeto item, intentando desde API');
					} catch (parseError) {
						console.error('❌ Error parseando metadata del item:', parseError);
						// Continuamos para intentar obtener desde el servidor
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
						setMetadata(result);

						// Actualizamos estadísticas de vistas en segundo plano
						updateImageStats(item.id, 'view').catch((err: Error) =>
							console.error('Error actualizando estadísticas:', err)
						);
					} else {
						console.warn('⚠️ La API devolvió metadata nula para:', item.id);
						setMetadata(null);
						toast({
							title: 'Advertencia',
							description: 'No se encontró información de metadatos para esta imagen',
							variant: 'default',
						});
					}
				}
			} catch (error) {
				if (mounted) {
					console.error('❌ Error cargando metadata:', error);
					setMetadata(null);
					toast({
						title: 'Error',
						description: 'No se pudo cargar la información de la imagen',
						variant: 'destructive',
					});
				}
			} finally {
				if (mounted) {
					setIsProcessing(false);
				}
			}
		};

		loadMetadata();

		return () => {
			mounted = false;
		};
	}, [item, toast]);

	if (!item) {
		return null;
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

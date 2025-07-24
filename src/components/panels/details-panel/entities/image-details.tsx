/**
 * @file Componentes específicos para detalles de imágenes
 * @module components/panels/details-panel/entities/image-details
 */

import { Crop, Download, Edit, Eye, Heart, Maximize2, RotateCcw, RotateCw, Share, ZoomIn, ZoomOut } from 'lucide-react';
import { memo, useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import { useImageResources } from '@/store/image-resources.store';
import type { ImageWithStats } from '@/types/entities/image';
import { isImageWithStats } from '@/types/migration';
import type {
	EntityDetailsProps,
	EntityMetadataProps,
	EntityPreviewProps,
	EntityToolbarProps,
} from '../entity-details-registry';

// Componente principal de detalles para imágenes
export const ImageDetails = memo<EntityDetailsProps<ImageWithStats>>(function ImageDetails({ entity, onAction }) {
	const handleAction = useCallback(
		(action: string, data?: any) => {
			onAction?.(action, data);
		},
		[onAction]
	);

	if (!isImageWithStats(entity)) {
		return <div>Error: Entidad no es una imagen válida</div>;
	}

	return (
		<div className="space-y-4">
			{/* Preview principal */}
			<ImagePreview entity={entity} size="lg" showControls={true} onAction={handleAction} />

			{/* Información básica */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm">Información básica</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<div className="grid grid-cols-2 gap-2 text-sm">
						<div>
							<span className="text-muted-foreground">Nombre:</span>
							<p className="font-medium truncate">{entity.name}</p>
						</div>
						<div>
							<span className="text-muted-foreground">Tamaño:</span>
							<p className="font-medium">{formatBytes(entity.totalSize || 0)}</p>
						</div>
						<div>
							<span className="text-muted-foreground">Dimensiones:</span>
							<p className="font-medium">
								{entity.width} × {entity.height}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">Formato:</span>
							<Badge variant="secondary" className="text-xs">
								{entity.path?.split('.').pop()?.toUpperCase() || 'Unknown'}
							</Badge>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Metadatos específicos */}
			<ImageMetadata entity={entity} editable={true} />

			{/* Toolbar de acciones */}
			<ImageToolbar entity={entity} onAction={handleAction} />
		</div>
	);
});

// Componente de preview para imágenes
export const ImagePreview = memo<EntityPreviewProps<ImageWithStats>>(function ImagePreview({
	entity,
	size = 'md',
	showControls = false,
	onAction,
}) {
	const [zoom, setZoom] = useState(1);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);

	const sizeClasses = {
		sm: 'h-32',
		md: 'h-48',
		lg: 'h-64',
		xl: 'h-80',
	};

	// Componente interno para manejar la previsualización de imágenes
	const ImagePreview = memo(function ImagePreview({
		imageId,
		imageName,
		zoom,
		className,
	}: {
		imageId: string;
		imageName: string;
		zoom: number;
		className: string;
	}) {
		const { getThumbnail, isLoading: isResourceLoading } = useImageResources();
		const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
		const [thumbnailLoading, setThumbnailLoading] = useState(false);

		useEffect(() => {
			const loadThumbnail = async () => {
				if (!imageId || thumbnailUrl) return;

				setThumbnailLoading(true);
				try {
					const url = await getThumbnail(imageId);
					if (url) {
						setThumbnailUrl(url);
					}
				} catch (error) {
					console.error('Error cargando thumbnail:', error);
				} finally {
					setThumbnailLoading(false);
				}
			};

			loadThumbnail();
		}, [imageId, getThumbnail, thumbnailUrl]);

		const displayThumbnailUrl = thumbnailUrl || `/api/images/${imageId}/thumbnail`;
		const shouldShowLoading = thumbnailLoading || isResourceLoading(imageId);

		if (shouldShowLoading) {
			return (
				<div className={cn(className, 'animate-pulse bg-muted flex items-center justify-center')}>
					<span className="text-muted-foreground">Cargando...</span>
				</div>
			);
		}

		return (
			<img
				src={displayThumbnailUrl}
				alt={imageName || 'Imagen'}
				className="max-w-full max-h-full object-contain transition-transform duration-200"
				style={{ transform: `scale(${zoom})` }}
				loading="lazy"
				onError={(e) => {
					console.warn(`Error cargando thumbnail para ${imageId}:`, e);
				}}
			/>
		);
	});

	const handleZoomIn = useCallback(() => {
		setZoom((prev) => Math.min(prev * 1.2, 5));
	}, []);

	const handleZoomOut = useCallback(() => {
		setZoom((prev) => Math.max(prev / 1.2, 0.1));
	}, []);

	const handleFullscreen = useCallback(() => {
		setIsFullscreen((prev) => !prev);
		onAction?.('fullscreen', { entity, fullscreen: !isFullscreen });
	}, [entity, isFullscreen, onAction]);

	if (!isImageWithStats(entity)) {
		return null;
	}

	return (
		<Card className="overflow-hidden">
			<CardContent className="p-0">
				<div className={cn('relative bg-muted/30 flex items-center justify-center', sizeClasses[size])}>
					{entity.id ? (
						<ImagePreview
							imageId={entity.id}
							imageName={entity.name || 'Imagen'}
							zoom={zoom}
							className="max-w-full max-h-full"
						/>
					) : (
						<div className="text-muted-foreground">Sin vista previa disponible</div>
					)}

					{/* Controles de overlay */}
					{showControls && (
						<div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors group">
							<div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
								<div className="flex gap-1">
									<Button size="sm" variant="secondary" onClick={handleZoomOut} className="h-8 w-8 p-0">
										<ZoomOut className="h-3 w-3" />
									</Button>
									<Button size="sm" variant="secondary" onClick={handleZoomIn} className="h-8 w-8 p-0">
										<ZoomIn className="h-3 w-3" />
									</Button>
									<Button size="sm" variant="secondary" onClick={handleFullscreen} className="h-8 w-8 p-0">
										<Maximize2 className="h-3 w-3" />
									</Button>
								</div>
							</div>

							{/* Información de zoom */}
							{zoom !== 1 && (
								<div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
									<Badge variant="secondary" className="text-xs">
										{Math.round(zoom * 100)}%
									</Badge>
								</div>
							)}
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
});

// Toolbar específico para imágenes
export const ImageToolbar = memo<EntityToolbarProps<ImageWithStats>>(function ImageToolbar({ entity, onAction }) {
	const handleAction = useCallback(
		(action: string) => {
			onAction(action, { entity });
		},
		[entity, onAction]
	);

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm">Acciones</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 gap-2">
					{/* Acciones primarias */}
					<Button variant="default" size="sm" onClick={() => handleAction('view')} className="justify-start">
						<Eye className="h-4 w-4 mr-2" />
						Ver
					</Button>
					<Button variant="default" size="sm" onClick={() => handleAction('edit')} className="justify-start">
						<Edit className="h-4 w-4 mr-2" />
						Editar
					</Button>

					{/* Transformaciones */}
					<Button variant="outline" size="sm" onClick={() => handleAction('rotate-left')} className="justify-start">
						<RotateCcw className="h-4 w-4 mr-2" />
						Rotar ←
					</Button>
					<Button variant="outline" size="sm" onClick={() => handleAction('rotate-right')} className="justify-start">
						<RotateCw className="h-4 w-4 mr-2" />
						Rotar →
					</Button>
					<Button variant="outline" size="sm" onClick={() => handleAction('crop')} className="justify-start">
						<Crop className="h-4 w-4 mr-2" />
						Recortar
					</Button>

					{/* Acciones secundarias */}
					<Button variant="outline" size="sm" onClick={() => handleAction('favorite')} className="justify-start">
						<Heart className="h-4 w-4 mr-2" />
						Favorito
					</Button>
					<Button variant="outline" size="sm" onClick={() => handleAction('share')} className="justify-start">
						<Share className="h-4 w-4 mr-2" />
						Compartir
					</Button>
					<Button variant="outline" size="sm" onClick={() => handleAction('download')} className="justify-start">
						<Download className="h-4 w-4 mr-2" />
						Descargar
					</Button>
				</div>
			</CardContent>
		</Card>
	);
});

// Componente de metadatos para imágenes
export const ImageMetadata = memo<EntityMetadataProps<ImageWithStats>>(function ImageMetadata({ entity }) {
	if (!isImageWithStats(entity)) {
		return null;
	}

	const metadata = [
		{
			label: 'Aspect Ratio',
			value: entity.stats?.aspectRatio?.toFixed(2) || 'N/A',
			category: 'technical',
		},
		{
			label: 'Píxeles',
			value: entity.width && entity.height ? `${((entity.width * entity.height) / 1000000).toFixed(1)}MP` : 'N/A',
			category: 'technical',
		},
		{
			label: 'Calidad',
			value: entity.stats?.quality || 'N/A',
			category: 'technical',
		},
		{
			label: 'Fecha creación',
			value: entity.createdAt ? new Date(entity.createdAt).toLocaleDateString() : 'N/A',
			category: 'basic',
		},
		{
			label: 'Última modificación',
			value: entity.updatedAt ? new Date(entity.updatedAt).toLocaleDateString() : 'N/A',
			category: 'basic',
		},
	];

	const technicalMetadata = metadata.filter((m) => m.category === 'technical');
	const basicMetadata = metadata.filter((m) => m.category === 'basic');

	return (
		<div className="space-y-4">
			{/* Metadatos técnicos */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm">Información técnica</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{technicalMetadata.map((meta) => (
						<div key={meta.label} className="flex justify-between text-sm">
							<span className="text-muted-foreground">{meta.label}:</span>
							<span className="font-medium">{meta.value}</span>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Metadatos básicos */}
			<Card>
				<CardHeader className="pb-2">
					<CardTitle className="text-sm">Fechas</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					{basicMetadata.map((meta) => (
						<div key={meta.label} className="flex justify-between text-sm">
							<span className="text-muted-foreground">{meta.label}:</span>
							<span className="font-medium">{meta.value}</span>
						</div>
					))}
				</CardContent>
			</Card>

			{/* Tags y relaciones */}
			{entity.stats && (
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Estadísticas</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-sm text-muted-foreground">
							<p>Asociaciones: {entity.stats.totalAssociations || 0}</p>
							{entity.stats.totalItems !== undefined && (
								<p>Elementos relacionados: {entity.stats.totalItems}</p>
							)}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
});

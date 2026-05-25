import { ArrowLeft, Download, Heart, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { useFavorite } from '@/hooks/use-favorite';
import { clientLogger } from '@/lib/logger/client-logger';
import { useImageStore } from '@/store/entities/image';
import { useImageViewer } from '@/store/image-viewer.store';
import type { ImageWithStats } from '@/types/entities/image';

const viewLogger = clientLogger.withContext('ImageDetailView');

/**
 * Vista de detalle para una imagen individual
 * Utiliza el FileViewer para mostrar la imagen y permite navegación
 */
export function ImageDetailView() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [image, setImage] = useState<ImageWithStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Store actions
	const { getImage, fetchImage, updateImage } = useImageStore();
	const { openViewer } = useImageViewer();
	const { isFavorite, isLoading: isFavoriteLoading, toggleFavorite } = useFavorite({
		entityId: image?.id ?? id ?? '',
		entityType: 'image',
		initialIsFavorite: image?.isFavorite ?? false,
	});

	// Cargar la imagen
	useEffect(() => {
		if (!id) {
			setError('ID de imagen no proporcionado');
			setIsLoading(false);
			return;
		}

		const loadImage = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Intentar obtener la imagen del store primero
				let imageData = getImage(id);

				// Si no está en el store, cargarla del servidor
				if (!imageData) {
					viewLogger.info('Imagen no encontrada en store, cargando del servidor...', { imageId: id });
					await fetchImage(id);
					imageData = getImage(id);
				}

				if (imageData) {
					setImage(imageData);
					viewLogger.info('Imagen cargada exitosamente', { imageName: imageData.name });
				} else {
					setError('Imagen no encontrada');
					viewLogger.warn('Imagen no encontrada después de cargar', { imageId: id });
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				setError(errorMessage);
				viewLogger.error('Error cargando imagen:', errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		loadImage();
	}, [id, getImage, fetchImage]);

	// Abrir en visor de imágenes
	const handleOpenViewer = () => {
		if (image) {
			// Pasar la imagen como EntityWithStats
			openViewer([image], 0);
		}
	};

	const handleDownload = () => {
		if (!image) {
			return;
		}

		const link = document.createElement('a');
		link.href = `/api/images/${image.id}/content`;
		link.download = image.name || `image-${image.id}`;
		link.rel = 'noopener noreferrer';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		viewLogger.info('Descarga iniciada para imagen', { imageId: image.id, imageName: image.name });
	};

	const handleToggleFavorite = async () => {
		if (!image || isFavoriteLoading) {
			return;
		}

		try {
			toggleFavorite();
		} catch (err) {
			viewLogger.error('Error actualizando favorito de imagen', {
				imageId: image.id,
				error: err instanceof Error ? err.message : err,
			});
		}
	};

	// Controles del header
	const headerControls = (
		<div className="flex items-center gap-2">
			<Button className="gap-2" onClick={() => navigate(-1)} size="sm" variant="outline">
				<ArrowLeft className="h-4 w-4" />
				Volver
			</Button>

			{image && (
				<>
					<Button className="gap-2" onClick={handleOpenViewer} size="sm" variant="outline">
						<Share2 className="h-4 w-4" />
						Visor
					</Button>

					<Button className="gap-2" onClick={handleDownload} size="sm" variant="outline">
						<Download className="h-4 w-4" />
						Descargar
					</Button>

					<Button
						className="gap-2"
						disabled={isFavoriteLoading}
						onClick={handleToggleFavorite}
						size="sm"
						variant={isFavorite ? 'default' : 'outline'}
					>
						<Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
						{isFavorite ? 'En favoritos' : 'Favorito'}
					</Button>
				</>
			)}
		</div>
	);

	if (isLoading) {
		return (
			<BaseContentView
				description="Obteniendo información de la imagen..."
				headerControls={headerControls}
				icon="🖼️"
				title="Cargando imagen..."
			>
				<div className="flex h-full items-center justify-center">
					<div className="text-center">
						<div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-primary border-b-2" />
						<p className="text-muted-foreground">Cargando imagen...</p>
					</div>
				</div>
			</BaseContentView>
		);
	}

	if (error || !image) {
		return (
			<BaseContentView
				description={error || 'Imagen no encontrada'}
				headerControls={headerControls}
				icon="❌"
				title="Error"
			>
				<div className="flex h-full items-center justify-center">
					<div className="text-center">
						<p className="mb-4 text-destructive">{error || 'Imagen no encontrada'}</p>
						<Button onClick={() => navigate(-1)} variant="outline">
							Volver
						</Button>
					</div>
				</div>
			</BaseContentView>
		);
	}

	return (
		<BaseContentView
			description={`${image.width || 0} × ${image.height || 0} píxeles`}
			headerControls={headerControls}
			icon="🖼️"
			title={image.name || 'Sin nombre'}
		>
			<div className="flex h-full w-full items-center justify-center p-4">
				<div className="max-h-full max-w-full">
					<button
						aria-label="Abrir visor de imagen"
						className="max-h-full max-w-full cursor-pointer rounded-lg"
						onClick={handleOpenViewer}
						type="button"
					>
						<img
							alt={image.name || ''}
							className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
							src={image.thumbnailUrl || `/api/images/${image.id}/content`}
							style={{
								maxHeight: 'calc(100vh - 200px)',
								maxWidth: 'calc(100vw - 100px)',
							}}
						/>
					</button>
				</div>
			</div>
		</BaseContentView>
	);
}

export default ImageDetailView;

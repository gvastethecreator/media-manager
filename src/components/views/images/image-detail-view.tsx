import { ArrowLeft, Download, Heart, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BaseContentView } from '@/components/views/base/base-content-view';
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
	const { getImage, fetchImage } = useImageStore();
	const { openViewer } = useImageViewer();

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

	// Controles del header
	const headerControls = (
		<div className="flex items-center gap-2">
			<Button variant="outline" size="sm" onClick={() => navigate(-1)} className="gap-2">
				<ArrowLeft className="h-4 w-4" />
				Volver
			</Button>

			{image && (
				<>
					<Button variant="outline" size="sm" onClick={handleOpenViewer} className="gap-2">
						<Share2 className="h-4 w-4" />
						Visor
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							// TODO: Implementar descarga
							viewLogger.info('Descarga solicitada para imagen:', image.name);
						}}
						className="gap-2"
					>
						<Download className="h-4 w-4" />
						Descargar
					</Button>

					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							// TODO: Implementar favoritos
							viewLogger.info('Favorito toggleado para imagen:', image.name);
						}}
						className="gap-2"
					>
						<Heart className="h-4 w-4" />
						Favorito
					</Button>
				</>
			)}
		</div>
	);

	if (isLoading) {
		return (
			<BaseContentView
				title="Cargando imagen..."
				description="Obteniendo información de la imagen..."
				icon="🖼️"
				headerControls={headerControls}
			>
				<div className="flex items-center justify-center h-full">
					<div className="text-center">
						<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
						<p className="text-muted-foreground">Cargando imagen...</p>
					</div>
				</div>
			</BaseContentView>
		);
	}

	if (error || !image) {
		return (
			<BaseContentView
				title="Error"
				description={error || 'Imagen no encontrada'}
				icon="❌"
				headerControls={headerControls}
			>
				<div className="flex items-center justify-center h-full">
					<div className="text-center">
						<p className="text-destructive mb-4">{error || 'Imagen no encontrada'}</p>
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
			title={image.name || 'Sin nombre'}
			description={`${image.width || 0} × ${image.height || 0} píxeles`}
			icon="🖼️"
			headerControls={headerControls}
		>
			<div className="h-full w-full flex items-center justify-center p-4">
				<div className="max-w-full max-h-full">
					<img
						src={image.thumbnailUrl || `/api/images/${image.id}/content`}
						alt={image.name || 'Imagen'}
						className="max-w-full max-h-full object-contain rounded-lg shadow-lg cursor-pointer"
						onClick={handleOpenViewer}
						style={{
							maxHeight: 'calc(100vh - 200px)',
							maxWidth: 'calc(100vw - 100px)',
						}}
					/>
				</div>
			</div>
		</BaseContentView>
	);
}

export default ImageDetailView;

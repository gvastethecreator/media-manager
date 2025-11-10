import { ArrowLeft, Download, Heart, Share2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { clientLogger } from '@/lib/logger/client-logger';
import { useVideoStore } from '@/store/entities/video';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import type { VideoWithStats } from '@/types/entities/video';

const viewLogger = clientLogger.withContext('VideoContentView');

/**
 * Vista de detalle para un video individual
 * Utiliza el FileViewer para mostrar el video y permite navegación
 */
export function VideoContentView() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [video, setVideo] = useState<VideoWithStats | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Store actions
	const { getVideo, fetchVideo } = useVideoStore();
	const { openViewer } = useFileViewerStore();

	// Cargar el video
	useEffect(() => {
		if (!id) {
			setError('ID de video no proporcionado');
			setIsLoading(false);
			return;
		}

		const loadVideo = async () => {
			try {
				setIsLoading(true);
				setError(null);

				// Intentar obtener el video del store primero
				let videoData = getVideo(id);

				// Si no está en el store, cargarlo del servidor
				if (!videoData) {
					viewLogger.info('Video no encontrado en store, cargando del servidor...', { videoId: id });
					await fetchVideo(id);
					videoData = getVideo(id);
				}

				if (videoData) {
					setVideo(videoData);
					viewLogger.info('Video cargado exitosamente', { videoName: videoData.name });
				} else {
					setError('Video no encontrado');
					viewLogger.warn('Video no encontrado después de cargar', { videoId: id });
				}
			} catch (err) {
				const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
				setError(errorMessage);
				viewLogger.error('Error cargando video:', errorMessage);
			} finally {
				setIsLoading(false);
			}
		};

		loadVideo();
	}, [id, getVideo, fetchVideo]);

	// Abrir en visor de videos
	const handleOpenViewer = () => {
		if (video) {
			// Preparar el video para el visor
			const mediaItem = {
				id: video.id,
				name: video.name,
				type: 'video' as const,
				path: (video as any).path,
				size: (video as any).size || 0,
				width: (video as any).width,
				height: (video as any).height,
				thumbnail: (video as any).thumbnail || (video as any).thumbnailUrl || `/api/videos/${video.id}/thumbnail`,
				thumbnailUrl: (video as any).thumbnailUrl || `/api/videos/${video.id}/thumbnail`,
				metadata: (video as any).metadata,
			};
			openViewer([mediaItem] as any, 0);
		}
	};

	// Controles del header
	const headerControls = (
		<div className="flex items-center gap-2">
			<Button className="gap-2" onClick={() => navigate(-1)} size="sm" variant="outline">
				<ArrowLeft className="h-4 w-4" />
				Volver
			</Button>

			{video && (
				<>
					<Button className="gap-2" onClick={handleOpenViewer} size="sm" variant="outline">
						<Share2 className="h-4 w-4" />
						Visor
					</Button>

					<Button
						className="gap-2"
						onClick={() => {
							// TODO: Implementar descarga
							viewLogger.info('Descarga solicitada para video:', video.name);
						}}
						size="sm"
						variant="outline"
					>
						<Download className="h-4 w-4" />
						Descargar
					</Button>

					<Button className="gap-2" size="sm" variant="outline">
						<Heart className="h-4 w-4" />
						Favorito
					</Button>
				</>
			)}
		</div>
	);

	// Renderizado de estados
	if (isLoading) {
		return (
			<BaseContentView description="Cargando video..." title="Detalle Video">
				<div className="flex h-full items-center justify-center">
					<div className="text-center">
						<div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
						<p className="text-muted-foreground">Cargando video...</p>
					</div>
				</div>
			</BaseContentView>
		);
	}

	if (error) {
		return (
			<BaseContentView description="Error al cargar el video" title="Error">
				<div className="flex h-full items-center justify-center">
					<div className="text-center">
						<h2 className="mb-2 font-semibold text-lg text-destructive">Error al cargar el video</h2>
						<p className="mb-4 text-muted-foreground">{error}</p>
						<Button onClick={() => navigate(-1)} variant="outline">
							Volver
						</Button>
					</div>
				</div>
			</BaseContentView>
		);
	}

	if (!video) {
		return (
			<BaseContentView description="Video no encontrado" title="No encontrado">
				<div className="flex h-full items-center justify-center">
					<div className="text-center">
						<h2 className="mb-2 font-semibold text-lg">Video no encontrado</h2>
						<p className="mb-4 text-muted-foreground">El video solicitado no existe o ha sido eliminado.</p>
						<Button onClick={() => navigate(-1)} variant="outline">
							Volver
						</Button>
					</div>
				</div>
			</BaseContentView>
		);
	}

	// Vista principal con el video
	return (
		<BaseContentView
			description={video.name}
			headerControls={headerControls}
			title={`Video: ${video.name}`}
		>
			<div className="flex h-full flex-col items-center justify-center gap-4 p-6">
				{/* Thumbnail del video */}
				<div className="relative max-w-2xl overflow-hidden rounded-lg">
					<img
						alt={video.name}
						className="h-auto w-full cursor-pointer transition-transform hover:scale-105"
						onClick={handleOpenViewer}
						src={(video as any).thumbnailUrl || `/api/videos/${video.id}/thumbnail`}
					/>
					<div className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30">
						<Button
							className="h-16 w-16 rounded-full"
							onClick={handleOpenViewer}
							size="icon"
							variant="secondary"
						>
							<Share2 className="h-8 w-8" />
						</Button>
					</div>
				</div>

				{/* Información del video */}
				<div className="w-full max-w-2xl space-y-2 rounded-lg border bg-card p-4">
					<div className="flex items-start justify-between">
						<div className="min-w-0 flex-1">
							<h3 className="mb-1 font-semibold text-lg">{video.name}</h3>
							{(video as any).description && (
								<p className="text-muted-foreground text-sm">{(video as any).description}</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
						{(video as any).duration && (
							<div>
								<span className="text-muted-foreground">Duración:</span>
								<span className="ml-2 font-medium">{(video as any).duration}s</span>
							</div>
						)}
						{(video as any).width && (video as any).height && (
							<div>
								<span className="text-muted-foreground">Resolución:</span>
								<span className="ml-2 font-medium">
									{(video as any).width}x{(video as any).height}
								</span>
							</div>
						)}
						{(video as any).size && (
							<div>
								<span className="text-muted-foreground">Tamaño:</span>
								<span className="ml-2 font-medium">
									{((video as any).size / 1024 / 1024).toFixed(2)} MB
								</span>
							</div>
						)}
						{(video as any).codec && (
							<div>
								<span className="text-muted-foreground">Códec:</span>
								<span className="ml-2 font-medium">{(video as any).codec}</span>
							</div>
						)}
					</div>

					{(video as any).metadata && (
						<div className="border-t pt-4">
							<h4 className="mb-2 font-medium text-sm">Metadatos</h4>
							<pre className="max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
								{JSON.stringify((video as any).metadata, null, 2)}
							</pre>
						</div>
					)}
				</div>
			</div>
		</BaseContentView>
	);
}

export default VideoContentView;

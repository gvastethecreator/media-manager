import { Play, RefreshCw, Video } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/ui/empty-state';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { Button } from '@/components/ui/button';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useVideoStore } from '@/store/entities/video';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import type { VideoWithStats } from '@/types/entities/video';
import { EntityStatsType, type EntityWithStats, type AnyEntityWithStats } from '@/types/migration';
import { isVideoWithStats } from '@/types/migration';

// Logger para depuración
const logger = clientLogger.withContext('VideoContentView');

interface VideoContentViewProps {
	videoId?: string;
}

export function VideoContentView({ videoId: propVideoId }: VideoContentViewProps = {}) {
	// 🎬 Obtener información del video actual desde props
	const currentVideoId = propVideoId || null;

	// Estados globales para panel de detalles y visor
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();
	const { openViewer } = useFileViewerStore();
	const { getVideo, fetchVideo, getVideos } = useVideoStore();

	// Estado local para controlar operaciones
	const [isRetrying, setIsRetrying] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Obtener el video actual
	const currentVideo = currentVideoId ? getVideo(currentVideoId) : null;

	// Cargar video si no existe en el store
	useEffect(() => {
		if (currentVideoId && !currentVideo && !isLoading) {
			setIsLoading(true);
			setError(null);
			fetchVideo(currentVideoId)
				.then((video) => {
					if (!video) {
						setError('Video no encontrado');
					}
				})
				.catch((err) => {
					logger.error('Error al cargar video:', err);
					setError('Error al cargar el video');
				})
				.finally(() => {
					setIsLoading(false);
				});
		}
	}, [currentVideoId, currentVideo, isLoading, fetchVideo]);

	const handleVideoSelect = useCallback(
		(video: AnyEntityWithStats) => {
			logger.info('🖱️ Video seleccionado:', video.name);

			// Mostrar panel de detalles con el video seleccionado
			setSelectedItems([video]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);

	const handleVideoDoubleClick = useCallback(
		(video: AnyEntityWithStats) => {
			if (!isVideoWithStats(video)) return;
			
			const videoItem = video as VideoWithStats;
			logger.info('🖱️ Doble click en video:', videoItem.name);

			// Obtener todos los videos para el visor
			const allVideos = getVideos();

			// Convertir a formato compatible con el visor
			const videoItems = allVideos.map((v) => ({
				id: v.id,
				name: v.name,
				type: 'video' as const,
				path: v.path,
				size: v.size || 0,
				width: v.width,
				height: v.height,
				thumbnail: v.thumbnail || `/api/videos/${v.id}/thumbnail`,
				thumbnailUrl: v.thumbnailUrl || `/api/videos/${v.id}/thumbnail`,
				metadata: v.metadata,
			}));

			const currentIndex = videoItems.findIndex((item) => item.id === videoItem.id);

			// Abrir el visor con todos los videos
			openViewer(videoItems, Math.max(0, currentIndex));
		},
		[getVideos, openViewer]
	);

	const handleForceRefresh = useCallback(async () => {
		if (!currentVideoId || isRetrying) return;

		setIsRetrying(true);
		logger.info('🔄 Forzando recarga del video');
		try {
			await fetchVideo(currentVideoId);
		} catch (refreshError) {
			logger.error('❌ Error al forzar recarga:', refreshError);
			setError('Error al recargar el video');
		} finally {
			setIsRetrying(false);
		}
	}, [currentVideoId, isRetrying, fetchVideo]);

	// Resetear estado cuando cambia el video
	useEffect(() => {
		setIsRetrying(false);
		setError(null);
	}, [currentVideoId]);

	// ️ Validación: verificar que hay un video seleccionado
	if (!currentVideoId) {
		logger.warn('⚠️ No hay video seleccionado');
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState
					icon={Video}
					title="No hay video seleccionado"
					description="Selecciona un video desde la vista de videos para ver su contenido."
				/>
			</div>
		);
	}

	// 🔄 Mostrar estado de carga mientras se obtiene información del video
	if (isLoading) {
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState icon={RefreshCw} title="Cargando video..." description="Obteniendo información del video." />
			</div>
		);
	}

	// ❌ Mostrar error si no se pudo cargar el video
	if (error || !currentVideo) {
		logger.error('❌ Error al cargar video:', error);
		return (
			<div className="flex flex-col items-center justify-center h-full gap-4">
				<EmptyState
					icon={Video}
					title="Error al cargar video"
					description={
						error || 'No se pudo obtener la información del video. Verifica que existe y tienes permisos para acceder.'
					}
					actions={
						<Button onClick={handleForceRefresh} variant="outline">
							Reintentar
						</Button>
					}
				/>
			</div>
		);
	}

	// Renderizar vista del video usando BaseContentView y FileBrowser
	return (
		<BaseContentView
			title={currentVideo.name || 'Video'}
			description={currentVideo.description || undefined}
			icon={undefined}
			headerControls={
				<>
					<Button variant="outline" size="sm" onClick={handleForceRefresh} disabled={isRetrying}>
						<RefreshCw className={`h-4 w-4 mr-2 ${isRetrying ? 'animate-spin' : ''}`} />
						{isRetrying ? 'Recargando...' : 'Recargar'}
					</Button>
					<Button variant="outline" size="sm">
						<Play className="h-4 w-4 mr-2" />
						Reproducir
					</Button>
				</>
			}
		>
			<FileBrowser
				entityType={EntityStatsType.VIDEO}
				filterId={currentVideoId}
				filterType="video"
				onItemClick={handleVideoSelect}
				onItemDoubleClick={handleVideoDoubleClick}
				className="h-full"
			/>
		</BaseContentView>
	);
}

/**
 * 📝 Documentación:
 * - Vista optimizada para mostrar contenido de un video específico
 * - Delega la visualización al FileBrowser con filtrado por video
 * - Controles de recarga y reproducción integrados en el header
 * - UI consistente con el resto del sistema usando componentes base
 * - Experiencia unificada de navegación de archivos de video
 * - Manejo de estados de carga, error y vacío
 */

import { Music, RefreshCw } from 'lucide-react';
import { useCallback, useState } from 'react';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { BaseContentView } from '@/components/views/base/base-content-view';
import { clientLogger } from '@/lib/logger/client-logger';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useAudioStore } from '@/store/entities/audio';
import { useFileViewerStore } from '@/store/ui/file-viewer.slice';
import type { AnyEntityWithStats } from '@/types/entities';
import type { AudioWithStats } from '@/types/entities/audio';

// Logger para depuración
const logger = clientLogger.withContext('AudioContentView');

interface AudioContentViewProps {
	className?: string;
}

export function AudioContentView({ className }: AudioContentViewProps) {
	// Estados globales para panel de detalles y visor
	const { setVisible: setDetailsPanelVisible, setSelectedItems } = useDetailsPanel();
	const { openViewer } = useFileViewerStore();
	const { audios, loading, error, fetchAudios } = useAudioStore();

	// Estado local para controlar operaciones
	const [isRefreshing, setIsRefreshing] = useState(false);

	const handleAudioSelect = useCallback(
		(audio: AnyEntityWithStats) => {
			logger.info('🖱️ Audio seleccionado:', audio.name);

			// Mostrar panel de detalles con el audio seleccionado
			setSelectedItems([audio]);
			setDetailsPanelVisible(true);
		},
		[setSelectedItems, setDetailsPanelVisible]
	);

	const handleAudioDoubleClick = useCallback((audio: AnyEntityWithStats) => {
		const audioItem = audio as AudioWithStats;
		logger.info('🖱️ Doble click en audio:', audioItem.name);

		// TODO: Implementar visor compatible with audio files
		// Obtener todos los audios para el visor
		// const allAudios = audios;

		// Convertir a formato compatible con el visor
		// const audioItems = allAudios.map((a: AudioWithStats) => ({
		//	id: a.id,
		//	name: a.name,
		//	type: 'audio' as const,
		//	path: a.path,
		//	size: a.size || 0,
		// }));

		// const currentIndex = audioItems.findIndex((item: any) => item.id === audioItem.id);

		// Abrir el visor con todos los audios
		// openViewer(audioItems, Math.max(0, currentIndex));
	}, []);

	const handleRefresh = useCallback(async () => {
		if (isRefreshing) return;

		setIsRefreshing(true);
		logger.info('🔄 Refrescando audios');
		try {
			await fetchAudios();
		} catch (refreshError) {
			logger.error('❌ Error al refrescar audios:', refreshError);
		} finally {
			setIsRefreshing(false);
		}
	}, [isRefreshing, fetchAudios]);

	// ❌ Mostrar error si hay problemas
	if (error) {
		return (
			<div className="flex h-full flex-col items-center justify-center gap-4">
				<EmptyState
					actions={
						<Button onClick={handleRefresh} variant="outline">
							Reintentar
						</Button>
					}
					description="Error al cargar los audios. Inténtalo de nuevo."
					icon={Music}
					title="Error al cargar audios"
				/>
			</div>
		);
	}

	// 🎯 Mostrar empty state si no hay audios
	if (!loading && audios.length === 0) {
		return (
			<BaseContentView
				className={className}
				description="Explora y reproduce tus archivos de audio"
				headerControls={
					<Button disabled={isRefreshing} onClick={handleRefresh} size="sm" variant="outline">
						<RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
						{isRefreshing ? 'Refrescando...' : 'Refrescar'}
					</Button>
				}
				title="Audios"
			>
				<div className="flex h-full items-center justify-center">
					<EmptyState
						description="Sube archivos de audio para comenzar a usar el reproductor."
						icon={Music}
						title="No hay archivos de audio"
					/>
				</div>
			</BaseContentView>
		);
	}

	// Renderizar vista de audios usando BaseContentView y FileBrowser
	return (
		<BaseContentView
			className={className}
			description="Explora y reproduce tus archivos de audio"
			headerControls={
				<Button disabled={isRefreshing} onClick={handleRefresh} size="sm" variant="outline">
					<RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
					{isRefreshing ? 'Refrescando...' : 'Refrescar'}
				</Button>
			}
			title="Audios"
		>
			<FileBrowser
				className="h-full"
				isLoading={loading}
				items={audios as unknown as AnyEntityWithStats[]}
				onItemClick={handleAudioSelect}
				onItemDoubleClick={handleAudioDoubleClick}
			/>
		</BaseContentView>
	);
}

export default AudioContentView;

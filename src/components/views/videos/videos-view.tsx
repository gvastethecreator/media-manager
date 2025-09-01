import { Play, Video } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { EmptyState } from '@/components/core/data-display';
import { LoadingScreen } from '@/components/core/feedback';
import { FileBrowser } from '@/components/features/file-browser/file-browser';
import { MultiEntityViewer } from '@/components/features/file-viewer/multi-entity-viewer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { motion } from '@/components/ui/motion-shim';
import { useToast } from '@/components/ui/use-toast';
import { useSeamlessNavigation } from '@/hooks/use-seamless-navigation';
import { clientLogger } from '@/lib/logger/client-logger';
import { useVideoStore } from '@/store/entities/video';
import { useMultiEntityViewerStore } from '@/stores/multi-entity-viewer.store';
import type { AnyEntityWithStats } from '@/types/entities';
import type { VideoWithStats } from '@/types/entities/video';
import type { ViewProps } from '../types';

const viewLogger = clientLogger.withContext('VideosView');

interface VideosViewProps extends ViewProps {
	className?: string;
}

export default function VideosView({ className = '' }: VideosViewProps) {
	const { navigateWithTransition } = useSeamlessNavigation();
	const { getVideos, fetchVideos, createVideo, isLoading, error, setError } = useVideoStore();
	const { isOpen, entities, currentIndex, openViewer, closeViewer, setCurrentIndex } = useMultiEntityViewerStore();
	const { toast } = useToast();

	const videos = getVideos();

	// Estado para el formulario de nuevo video
	const [showForm, setShowForm] = useState(false);
	const [newVideoName, setNewVideoName] = useState('');
	const [newVideoPath, setNewVideoPath] = useState('');

	// Cargar videos al montar el componente solo una vez
	useEffect(() => {
		fetchVideos();
	}, [fetchVideos]);

	const handleVideoClick = useCallback(
		(item: AnyEntityWithStats) => {
			const video = item as unknown as VideoWithStats;
			viewLogger.info('🖱️ Click en video:', video.name);
			navigateWithTransition(`/videos/${video.id}`);
		},
		[navigateWithTransition]
	);

	const handleVideoDoubleClick = useCallback(
		(item: AnyEntityWithStats) => {
			const video = item as unknown as VideoWithStats;
			viewLogger.info('🖱️ Doble click en video:', video.name);

			// Abrir MultiEntityViewer con todos los videos
			const videoItems = videos as unknown as AnyEntityWithStats[];
			const currentIndex = videoItems.findIndex((v) => v.id === video.id);
			openViewer(videoItems, currentIndex >= 0 ? currentIndex : 0);
		},
		[videos, openViewer]
	);

	// Manejar creación de video
	const handleCreateVideo = async () => {
		if (!(newVideoName.trim() && newVideoPath.trim())) {
			toast({
				title: '❌ Error',
				description: 'El nombre y la ruta del video son requeridos.',
				variant: 'destructive',
			});
			return;
		}

		try {
			await createVideo({
				name: newVideoName.trim(),
				path: newVideoPath.trim(),
				hash: crypto.randomUUID(),
				size: 0,
				duration: 0,
				folderId: 'default',
			});

			toast({
				title: '✅ Éxito',
				description: `Video "${newVideoName}" creado exitosamente.`,
			});

			setNewVideoName('');
			setNewVideoPath('');
			setShowForm(false);
		} catch (error) {
			console.error('Error creating video:', error);
			toast({
				title: '❌ Error',
				description: 'No se pudo crear el video.',
				variant: 'destructive',
			});
		}
	};

	// Estados de carga y error
	if (error) {
		return (
			<div className="flex h-full items-center justify-center">
				<p className="text-destructive">Error: {error}</p>
			</div>
		);
	}

	if (isLoading && videos.length === 0) {
		return <LoadingScreen message="Cargando videos..." />;
	}

	const videoItems = videos as unknown as AnyEntityWithStats[];

	return (
		<motion.div
			animate={{ opacity: 1, y: 0 }}
			className={`flex h-full flex-col ${className}`}
			exit={{ opacity: 0, y: -20 }}
			initial={{ opacity: 0, y: 20 }}
			transition={{ duration: 0.3 }}
		>
			{/* Header */}
			<div className="flex items-center justify-between border-b p-6">
				<h2 className="flex items-center font-bold text-2xl">
					<Video className="mr-2 h-6 w-6" />
					Videos ({videos.length})
				</h2>
				<Button onClick={() => setShowForm(!showForm)}>
					<Play className="mr-2 h-4 w-4" />
					{showForm ? 'Cancelar' : 'Subir Video'}
				</Button>
			</div>

			{/* Formulario de creación */}
			{showForm && (
				<motion.div
					animate={{ opacity: 1, y: 0 }}
					className="border-b bg-muted/50 p-6"
					initial={{ opacity: 0, y: -20 }}
				>
					<div className="max-w-md space-y-4">
						<div className="grid gap-2">
							<Label htmlFor="videoName">Nombre del video</Label>
							<Input
								id="videoName"
								onChange={(e) => setNewVideoName(e.target.value)}
								placeholder="video.mp4"
								value={newVideoName}
							/>
						</div>
						<div className="grid gap-2">
							<Label htmlFor="videoPath">Ruta del archivo</Label>
							<Input
								id="videoPath"
								onChange={(e) => setNewVideoPath(e.target.value)}
								placeholder="/path/to/video.mp4"
								value={newVideoPath}
							/>
						</div>
						<div className="flex gap-2">
							<Button onClick={handleCreateVideo}>Crear Video</Button>
							<Button onClick={() => setShowForm(false)} variant="outline">
								Cancelar
							</Button>
						</div>
					</div>
				</motion.div>
			)}

			{/* Contenido principal */}
			<div className="flex-1">
				{(!videoItems || videoItems.length === 0) && !isLoading && !showForm ? (
					<div className="flex h-full items-center justify-center">
						<div className="text-center">
							<EmptyState
								description="No hay videos disponibles. Sube tu primer video para comenzar."
								icon={Video}
								title="Sin videos"
							/>
							<div className="mt-4">
								<Button onClick={() => setShowForm(true)}>
									<Play className="mr-2 h-4 w-4" />
									Subir Video
								</Button>
							</div>
						</div>
					</div>
				) : (
					<div className="h-full">
						<FileBrowser
							isLoading={isLoading}
							items={videoItems}
							onItemClick={handleVideoClick}
							onItemDoubleClick={handleVideoDoubleClick}
						/>
					</div>
				)}
			</div>

			{/* MultiEntityViewer */}
			{isOpen && (
				<MultiEntityViewer
					currentIndex={currentIndex}
					entities={entities}
					isOpen={isOpen}
					onClose={closeViewer}
					onIndexChange={setCurrentIndex}
				/>
			)}
		</motion.div>
	);
}

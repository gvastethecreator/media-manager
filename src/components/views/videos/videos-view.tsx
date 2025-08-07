import { Play, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { VideoCard } from '@/components/cards/video-card';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSeamlessNavigation } from '@/hooks/use-seamless-navigation';
import { clientLogger } from '@/lib/logger/client-logger';
import { useVideoStore } from '@/store/entities/video';
import type { VideoWithStats } from '@/types/entities/video';

interface VideosViewProps {
	className?: string;
}

export default function VideosView({ className = '' }: VideosViewProps) {
	const { navigateWithTransition } = useSeamlessNavigation();
	const { getVideos, fetchVideos, createVideo, isLoading, error, setError } = useVideoStore();

	const videos = getVideos();

	// Estado para el formulario de nuevo video
	const [showForm, setShowForm] = useState(false);
	const [newVideoName, setNewVideoName] = useState('');
	const [newVideoPath, setNewVideoPath] = useState('');

	// Cargar videos al montar el componente solo una vez
	useEffect(() => {
		fetchVideos();
	}, []);

	// Manejar clic en video - navegar a la vista de contenido
	const handleVideoClick = useCallback(
		(video: VideoWithStats) => {
			clientLogger.info('🖱️ Video seleccionado:', video.name);
			navigateWithTransition(`/videos/${video.id}`);
		},
		[navigateWithTransition]
	);

	// Manejar creación de video
	const handleCreateVideo = async () => {
		if (!(newVideoName.trim() && newVideoPath.trim())) return;

		try {
			await createVideo({
				name: newVideoName.trim(),
				path: newVideoPath.trim(),
				hash: '', // TODO: Calcular hash del archivo
				size: 0, // TODO: Obtener tamaño del archivo
				duration: 0, // TODO: Obtener duración del video
				folderId: '', // TODO: Obtener folderId del contexto
			});

			// Limpiar formulario y cerrarlo
			setNewVideoName('');
			setNewVideoPath('');
			setShowForm(false);
		} catch (error) {
			console.error('Error creating video:', error);
		}
	};

	// Manejar reintento manual
	const handleManualRetry = () => {
		setError(null);
		fetchVideos();
	};

	if (isLoading && videos.length === 0) {
		return <LoadingScreen message="Cargando videos..." />;
	}

	if (error) {
		return (
			<div className="flex h-full flex-col items-center justify-center space-y-4">
				<div className="text-center">
					<h3 className="font-semibold text-destructive text-lg">Error al cargar videos</h3>
					<p className="text-muted-foreground text-sm">{error}</p>
				</div>
				<Button onClick={handleManualRetry} variant="outline">
					<RefreshCw className="mr-2 h-4 w-4" />
					Reintentar
				</Button>
			</div>
		);
	}

	// Mostrar estado vacío si no hay videos
	if (videos.length === 0) {
		return (
			<div className={`flex h-full flex-col ${className}`}>
				<div className="flex items-center justify-between border-b p-6">
					<h2 className="font-bold text-2xl">Videos</h2>
					<Button onClick={() => setShowForm(true)}>
						<Play className="mr-2 h-4 w-4" />
						Subir Video
					</Button>
				</div>

				{showForm && (
					<div className="border-b bg-muted/50 p-6">
						<div className="max-w-md space-y-4">
							<Input
								onChange={(e) => setNewVideoName(e.target.value)}
								placeholder="Nombre del video"
								value={newVideoName}
							/>
							<Input
								onChange={(e) => setNewVideoPath(e.target.value)}
								placeholder="Ruta del archivo"
								value={newVideoPath}
							/>
							<div className="flex gap-2">
								<Button disabled={!(newVideoName.trim() && newVideoPath.trim())} onClick={handleCreateVideo}>
									Crear Video
								</Button>
								<Button onClick={() => setShowForm(false)} variant="outline">
									Cancelar
								</Button>
							</div>
						</div>
					</div>
				)}

				<div className="flex flex-1 items-center justify-center">
					<EmptyState
						actions={
							<Button onClick={() => setShowForm(true)}>
								<Play className="mr-2 h-4 w-4" />
								Subir Video
							</Button>
						}
						description="No hay videos disponibles. Sube tu primer video para comenzar."
						icon={Play}
						title="Sin videos"
					/>
				</div>
			</div>
		);
	}

	return (
		<div className={`m-0 flex h-full flex-col p-0 ${className}`}>
			<div className="flex items-center justify-between border-b p-6">
				<h2 className="font-bold text-2xl">Videos ({videos.length})</h2>
				<Button onClick={() => setShowForm(true)}>
					<Play className="mr-2 h-4 w-4" />
					Subir Video
				</Button>
			</div>

			{showForm && (
				<div className="border-b bg-muted/50 p-6">
					<div className="max-w-md space-y-4">
						<Input
							onChange={(e) => setNewVideoName(e.target.value)}
							placeholder="Nombre del video"
							value={newVideoName}
						/>
						<Input
							onChange={(e) => setNewVideoPath(e.target.value)}
							placeholder="Ruta del archivo"
							value={newVideoPath}
						/>
						<div className="flex gap-2">
							<Button disabled={!(newVideoName.trim() && newVideoPath.trim())} onClick={handleCreateVideo}>
								Crear Video
							</Button>
							<Button onClick={() => setShowForm(false)} variant="outline">
								Cancelar
							</Button>
						</div>
					</div>
				</div>
			)}

			<ScrollArea className="flex-1">
				<div className="grid grid-cols-4 gap-2 p-6">
					{videos.map((video) => (
						<VideoCard
							className="h-full cursor-pointer"
							key={video.id}
							onClick={() => handleVideoClick(video)}
							tcgMode={true}
							videoId={video.id}
						/>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}

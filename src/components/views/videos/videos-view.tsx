import { Play, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VideoCard } from '@/components/cards/video-card';
import { LoadingScreen } from '@/components/core/feedback';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { clientLogger } from '@/lib/logger/client-logger';
import { useVideoStore } from '@/store/entities/video';
import type { VideoWithStats } from '@/types/entities/video';

interface VideosViewProps {
	className?: string;
}

export default function VideosView({ className = '' }: VideosViewProps) {
	const navigate = useNavigate();
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
			navigate(`/videos/${video.id}`);
		},
		[navigate]
	);

	// Manejar creación de video
	const handleCreateVideo = async () => {
		if (!newVideoName.trim() || !newVideoPath.trim()) return;

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
					<h3 className="text-lg font-semibold text-destructive">Error al cargar videos</h3>
					<p className="text-sm text-muted-foreground">{error}</p>
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
			<div className={`h-full flex flex-col ${className}`}>
				<div className="flex items-center justify-between p-6 border-b">
					<h2 className="text-2xl font-bold">Videos</h2>
					<Button onClick={() => setShowForm(true)}>
						<Play className="h-4 w-4 mr-2" />
						Subir Video
					</Button>
				</div>

				{showForm && (
					<div className="p-6 border-b bg-muted/50">
						<div className="space-y-4 max-w-md">
							<Input
								placeholder="Nombre del video"
								value={newVideoName}
								onChange={(e) => setNewVideoName(e.target.value)}
							/>
							<Input
								placeholder="Ruta del archivo"
								value={newVideoPath}
								onChange={(e) => setNewVideoPath(e.target.value)}
							/>
							<div className="flex gap-2">
								<Button onClick={handleCreateVideo} disabled={!newVideoName.trim() || !newVideoPath.trim()}>
									Crear Video
								</Button>
								<Button variant="outline" onClick={() => setShowForm(false)}>
									Cancelar
								</Button>
							</div>
						</div>
					</div>
				)}

				<div className="flex-1 flex items-center justify-center">
					<EmptyState
						icon={Play}
						title="Sin videos"
						description="No hay videos disponibles. Sube tu primer video para comenzar."
						actions={
							<Button onClick={() => setShowForm(true)}>
								<Play className="h-4 w-4 mr-2" />
								Subir Video
							</Button>
						}
					/>
				</div>
			</div>
		);
	}

	return (
		<div className={`h-full flex flex-col p-0 m-0 ${className}`}>
			<div className="flex items-center justify-between p-6 border-b">
				<h2 className="text-2xl font-bold">Videos ({videos.length})</h2>
				<Button onClick={() => setShowForm(true)}>
					<Play className="h-4 w-4 mr-2" />
					Subir Video
				</Button>
			</div>

			{showForm && (
				<div className="p-6 border-b bg-muted/50">
					<div className="space-y-4 max-w-md">
						<Input
							placeholder="Nombre del video"
							value={newVideoName}
							onChange={(e) => setNewVideoName(e.target.value)}
						/>
						<Input
							placeholder="Ruta del archivo"
							value={newVideoPath}
							onChange={(e) => setNewVideoPath(e.target.value)}
						/>
						<div className="flex gap-2">
							<Button onClick={handleCreateVideo} disabled={!newVideoName.trim() || !newVideoPath.trim()}>
								Crear Video
							</Button>
							<Button variant="outline" onClick={() => setShowForm(false)}>
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
							key={video.id}
							videoId={video.id}
							onClick={() => handleVideoClick(video)}
							className="h-full cursor-pointer"
							tcgMode={true}
						/>
					))}
				</div>
			</ScrollArea>
		</div>
	);
}

/// <reference lib="dom" />
/**
 * @file Componentes específicos para detalles de videos
 * @module components/panels/details-panel/entities/video-details
 */

import {
	Download,
	Edit,
	Heart,
	Image as ImageIcon,
	Maximize2,
	MoreHorizontal,
	Pause,
	Play,
	Scissors,
	Share,
	SkipBack,
	SkipForward,
	Volume2,
	VolumeX,
} from 'lucide-react';
import { memo, useCallback, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/utils/format.utils';
import type { VideoWithStats } from '@/types/entities/video/types';
import { isVideoWithStats } from '@/types/migration';
import type {
	EntityDetailsProps,
	EntityMetadataProps,
	EntityPreviewProps,
	EntityToolbarProps,
} from '../entity-details-registry';

// Utilidades para formato de tiempo
const formatTime = (seconds: number): string => {
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const secs = Math.floor(seconds % 60);

	if (hours > 0) {
		return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
	}
	return `${minutes}:${secs.toString().padStart(2, '0')}`;
};

// Componente principal de detalles para videos
export const VideoDetails = memo<EntityDetailsProps<VideoWithStats>>(function VideoDetails({ entity, onAction }) {
	const handleAction = useCallback(
		(action: string, data?: any) => {
			onAction?.(action, data);
		},
		[onAction]
	);

	if (!isVideoWithStats(entity)) {
		return <div>Error: Entidad no es un video válido</div>;
	}

	return (
		<div className="space-y-4">
			{/* Preview principal con reproductor */}
			<VideoPreview entity={entity} size="lg" showControls={true} onAction={handleAction} />

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
							<p className="font-medium">{formatBytes(entity.size || 0)}</p>
						</div>
						<div>
							<span className="text-muted-foreground">Resolución:</span>
							<p className="font-medium">
								{entity.width} × {entity.height}
							</p>
						</div>
						<div>
							<span className="text-muted-foreground">Duración:</span>
							<p className="font-medium">{entity.duration ? formatTime(entity.duration) : 'N/A'}</p>
						</div>
						<div>
							<span className="text-muted-foreground">Formato:</span>
							<Badge variant="secondary" className="text-xs">
								{entity.path?.split('.').pop()?.toUpperCase() || 'Unknown'}
							</Badge>
						</div>
						<div>
							<span className="text-muted-foreground">FPS:</span>
							<p className="font-medium">{entity.frameRate ? `${entity.frameRate} fps` : 'N/A'}</p>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Metadatos específicos */}
			<VideoMetadata entity={entity} editable={true} />

			{/* Toolbar de acciones */}
			<VideoToolbar entity={entity} onAction={handleAction} />
		</div>
	);
});

// Componente de reproductor para videos
export const VideoPreview = memo<EntityPreviewProps<VideoWithStats>>(function VideoPreview({
	entity,
	size = 'md',
	showControls = false,
	onAction,
}) {
	const videoRef = useRef<HTMLVideoElement | null>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [isMuted, setIsMuted] = useState(false);
	const [isFullscreen, setIsFullscreen] = useState(false);
	const [showControlsOverlay, setShowControlsOverlay] = useState(false);

	const sizeClasses = {
		sm: 'h-32',
		md: 'h-48',
		lg: 'h-64',
		xl: 'h-80',
	};

	const handlePlayPause = useCallback(() => {
		if (!videoRef.current) return;

		if (isPlaying) {
			videoRef.current.pause();
		} else {
			videoRef.current.play();
		}
		setIsPlaying(!isPlaying);
	}, [isPlaying]);

	const handleTimeUpdate = useCallback(() => {
		if (!videoRef.current) return;
		setCurrentTime(videoRef.current.currentTime);
	}, []);

	const handleLoadedMetadata = useCallback(() => {
		if (!videoRef.current) return;
		setDuration(videoRef.current.duration);
	}, []);

	const handleSeek = useCallback(
		(value: number[]) => {
			if (!videoRef.current) return;
			const newTime = (value[0] / 100) * duration;
			videoRef.current.currentTime = newTime;
			setCurrentTime(newTime);
		},
		[duration]
	);

	const handleVolumeChange = useCallback((value: number[]) => {
		if (!videoRef.current) return;
		const newVolume = value[0] / 100;
		videoRef.current.volume = newVolume;
		setVolume(newVolume);
		setIsMuted(newVolume === 0);
	}, []);

	const handleMuteToggle = useCallback(() => {
		if (!videoRef.current) return;
		const newMuted = !isMuted;
		videoRef.current.muted = newMuted;
		setIsMuted(newMuted);
	}, [isMuted]);

	const handleFullscreen = useCallback(() => {
		if (!videoRef.current) return;

		if (!isFullscreen) {
			if (videoRef.current.requestFullscreen) {
				videoRef.current.requestFullscreen();
			}
		} else {
			if (document.exitFullscreen) {
				document.exitFullscreen();
			}
		}
		setIsFullscreen(!isFullscreen);
		onAction?.('fullscreen', { entity, fullscreen: !isFullscreen });
	}, [entity, isFullscreen, onAction]);

	const handleSkip = useCallback(
		(seconds: number) => {
			if (!videoRef.current) return;
			const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
			videoRef.current.currentTime = newTime;
			setCurrentTime(newTime);
		},
		[currentTime, duration]
	);

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
	const videoUrl = entity.path;

	// Verificar tipo después de definir todos los hooks
	if (!isVideoWithStats(entity)) {
		return null;
	}

	return (
		<Card className="overflow-hidden">
			<CardContent className="p-0">
				<div
					className={cn('relative bg-black flex items-center justify-center group', sizeClasses[size])}
					onMouseEnter={() => setShowControlsOverlay(true)}
					onMouseLeave={() => setShowControlsOverlay(false)}
				>
					{videoUrl ? (
						<video
							ref={videoRef}
							src={videoUrl}
							poster={entity.thumbnailUrl || undefined}
							className="w-full h-full object-contain"
							onTimeUpdate={handleTimeUpdate}
							onLoadedMetadata={handleLoadedMetadata}
							onPlay={() => setIsPlaying(true)}
							onPause={() => setIsPlaying(false)}
							controls={false}
							aria-label="Video player"
						>
							<track kind="captions" srcLang="es" label="Español" />
						</video>
					) : (
						<div className="text-white">Video no disponible</div>
					)}

					{/* Controles de overlay */}
					{showControls && (showControlsOverlay || isPlaying) && (
						<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 transition-opacity">
							{/* Controles superiores */}
							<div className="absolute top-2 right-2 flex gap-1">
								<Button
									size="sm"
									variant="secondary"
									onClick={handleFullscreen}
									className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70"
								>
									<Maximize2 className="h-3 w-3 text-white" />
								</Button>
							</div>

							{/* Control de reproducción central */}
							<div className="absolute inset-0 flex items-center justify-center">
								<Button
									size="lg"
									variant="secondary"
									onClick={handlePlayPause}
									className="h-12 w-12 p-0 bg-black/50 hover:bg-black/70 rounded-full"
								>
									{isPlaying ? (
										<Pause className="h-6 w-6 text-white" />
									) : (
										<Play className="h-6 w-6 text-white ml-0.5" />
									)}
								</Button>
							</div>

							{/* Controles inferiores */}
							<div className="absolute bottom-0 left-0 right-0 p-3 space-y-2">
								{/* Barra de progreso */}
								<div className="flex items-center gap-2 text-white text-xs">
									<span>{formatTime(currentTime)}</span>
									<div className="flex-1">
										<Slider value={[progress]} onValueChange={handleSeek} max={100} step={0.1} className="w-full" />
									</div>
									<span>{formatTime(duration)}</span>
								</div>

								{/* Controles de reproducción */}
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<Button
											size="sm"
											variant="ghost"
											onClick={() => handleSkip(-10)}
											className="h-8 w-8 p-0 text-white hover:bg-white/20"
										>
											<SkipBack className="h-4 w-4" />
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={handlePlayPause}
											className="h-8 w-8 p-0 text-white hover:bg-white/20"
										>
											{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
										</Button>
										<Button
											size="sm"
											variant="ghost"
											onClick={() => handleSkip(10)}
											className="h-8 w-8 p-0 text-white hover:bg-white/20"
										>
											<SkipForward className="h-4 w-4" />
										</Button>
									</div>

									{/* Control de volumen */}
									<div className="flex items-center gap-2">
										<Button
											size="sm"
											variant="ghost"
											onClick={handleMuteToggle}
											className="h-8 w-8 p-0 text-white hover:bg-white/20"
										>
											{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
										</Button>
										<div className="w-16">
											<Slider
												value={[isMuted ? 0 : volume * 100]}
												onValueChange={handleVolumeChange}
												max={100}
												step={1}
												className="w-full"
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Indicador de duración */}
					{entity.duration && (
						<div className="absolute bottom-2 left-2">
							<Badge variant="secondary" className="text-xs bg-black/50 text-white">
								{formatTime(entity.duration)}
							</Badge>
						</div>
					)}
				</div>
			</CardContent>
		</Card>
	);
});

// Toolbar específico para videos
export const VideoToolbar = memo<EntityToolbarProps<VideoWithStats>>(function VideoToolbar({ entity, onAction }) {
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
					<Button variant="default" size="sm" onClick={() => handleAction('play')} className="justify-start">
						<Play className="h-4 w-4 mr-2" />
						Reproducir
					</Button>
					<Button variant="default" size="sm" onClick={() => handleAction('edit')} className="justify-start">
						<Edit className="h-4 w-4 mr-2" />
						Editar
					</Button>

					{/* Herramientas de video */}
					<Button variant="outline" size="sm" onClick={() => handleAction('extract-frame')} className="justify-start">
						<ImageIcon className="h-4 w-4 mr-2" />
						Extraer frame
					</Button>
					<Button variant="outline" size="sm" onClick={() => handleAction('trim')} className="justify-start">
						<Scissors className="h-4 w-4 mr-2" />
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

					{/* Más opciones */}
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="justify-start">
								<MoreHorizontal className="h-4 w-4 mr-2" />
								Más
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent>
							<DropdownMenuItem onClick={() => handleAction('convert')}>Convertir formato</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleAction('compress')}>Comprimir</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleAction('add-subtitles')}>Añadir subtítulos</DropdownMenuItem>
							<DropdownMenuItem onClick={() => handleAction('properties')}>Propiedades</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardContent>
		</Card>
	);
});

// Componente de metadatos para videos
export const VideoMetadata = memo<EntityMetadataProps<VideoWithStats>>(function VideoMetadata({ entity }) {
	if (!isVideoWithStats(entity)) {
		return null;
	}

	const metadata = [
		{
			label: 'Codec de video',
			value: entity.videoCodec || 'N/A',
			category: 'technical',
		},
		{
			label: 'Codec de audio',
			value: entity.audioCodec || 'N/A',
			category: 'technical',
		},
		{
			label: 'Bitrate',
			value: entity.bitrate ? `${entity.bitrate} kbps` : 'N/A',
			category: 'technical',
		},
		{
			label: 'Frame Rate',
			value: entity.frameRate ? `${entity.frameRate} fps` : 'N/A',
			category: 'technical',
		},
		{
			label: 'Aspect Ratio',
			value: entity.width && entity.height ? (entity.width / entity.height).toFixed(2) : 'N/A',
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

			{/* Estadísticas */}
			{entity.stats && (
				<Card>
					<CardHeader className="pb-2">
						<CardTitle className="text-sm">Estadísticas</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-sm text-muted-foreground">
							<p>Asociaciones: {entity.stats.totalAssociations || 0}</p>
							{entity.stats.totalItems !== undefined && <p>Elementos relacionados: {entity.stats.totalItems}</p>}
						</div>
					</CardContent>
				</Card>
			)}
		</div>
	);
});

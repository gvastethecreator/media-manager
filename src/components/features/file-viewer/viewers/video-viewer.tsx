/**
 * @file VideoViewer - Componente para reproducir videos con controles y metadatos
 * @module components/features/file-viewer/viewers/video-viewer
 * @description Soporta mp4, webm, avi y muestra metadatos usando VideoWithStats
 */

import { Download, Maximize2, Minimize2, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { type VideoWithStats } from '@/types/entities/video/types';

interface VideoViewerProps {
	video: VideoWithStats;
	className?: string;
}

export const VideoViewer: React.FC<VideoViewerProps> = ({ video, className }) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [playing, setPlaying] = useState(false);
	const [muted, setMuted] = useState(false);
	const [fullscreen, setFullscreen] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);

	const handlePlayPause = () => {
		const vid = videoRef.current;
		if (!vid) {
			return;
		}
		if (vid.paused) {
			vid.play();
			setPlaying(true);
		} else {
			vid.pause();
			setPlaying(false);
		}
	};

	const handleMute = () => {
		const vid = videoRef.current;
		if (!vid) {
			return;
		}
		vid.muted = !vid.muted;
		setMuted(vid.muted);
	};

	const handleFullscreen = () => {
		const vid = videoRef.current;
		if (!vid) {
			return;
		}
		if (fullscreen) {
			document.exitFullscreen?.();
			setFullscreen(false);
		} else {
			vid.requestFullscreen?.();
			setFullscreen(true);
		}
	};

	const handleTimeUpdate = () => {
		const vid = videoRef.current;
		if (!vid) {
			return;
		}
		setCurrentTime(vid.currentTime);
	};

	const handleLoadedMetadata = () => {
		const vid = videoRef.current;
		if (!vid) {
			return;
		}
		setDuration(vid.duration);
	};

	const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
		const vid = videoRef.current;
		if (!vid) {
			return;
		}
		const time = Number(e.target.value);
		vid.currentTime = time;
		setCurrentTime(time);
	};

	const handleRestart = () => {
		const vid = videoRef.current;
		if (!vid) {
			return;
		}
		vid.currentTime = 0;
		vid.play();
		setPlaying(true);
	};

	const handleDownload = () => {
		window.open(video.path, '_blank');
	};

	const formatTime = (sec: number) => {
		const m = Math.floor(sec / 60)
			.toString()
			.padStart(2, '0');
		const s = Math.floor(sec % 60)
			.toString()
			.padStart(2, '0');
		return `${m}:${s}`;
	};

	return (
		<div className={cn('mx-auto w-full max-w-3xl rounded-lg bg-card p-4 shadow-lg', className)}>
			<video
				className="w-full rounded-lg bg-black"
				controls={false}
				muted={muted}
				onClick={handlePlayPause}
				onLoadedMetadata={handleLoadedMetadata}
				onTimeUpdate={handleTimeUpdate}
				poster={video.thumbnail || undefined}
				ref={videoRef}
				src={video.path}
			>
				Sorry, your browser does not support embedded videos.
			</video>
			<div className="mt-2 flex items-center gap-2">
				<Button aria-label={playing ? 'Pausar' : 'Reproducir'} onClick={handlePlayPause} size="icon" variant="ghost">
					{playing ? <Pause /> : <Play />}
				</Button>
				<Button aria-label="Reiniciar" onClick={handleRestart} size="icon" variant="ghost">
					<RotateCcw />
				</Button>
				<Button aria-label={muted ? 'Activar sonido' : 'Silenciar'} onClick={handleMute} size="icon" variant="ghost">
					{muted ? <VolumeX /> : <Volume2 />}
				</Button>
				<input
					className="mx-2 h-1 flex-1 accent-primary"
					max={duration}
					min={0}
					onChange={handleSeek}
					type="range"
					value={currentTime}
				/>
				<span className="w-14 text-right text-xs">
					{formatTime(currentTime)} / {formatTime(duration)}
				</span>
				<Button aria-label="Pantalla completa" onClick={handleFullscreen} size="icon" variant="ghost">
					{fullscreen ? <Minimize2 /> : <Maximize2 />}
				</Button>
				<Button aria-label="Descargar video" onClick={handleDownload} size="icon" variant="ghost">
					<Download />
				</Button>
			</div>
			{/* Metadatos del video */}
			<div className="mt-4 grid grid-cols-2 gap-2 text-muted-foreground text-xs">
				<div>
					<span className="font-medium">Nombre:</span> {video.name}
				</div>
				<div>
					<span className="font-medium">Duración:</span> {formatTime(video.duration)}
				</div>
				<div>
					<span className="font-medium">Tamaño:</span> {Math.round(video.size / 1024 / 1024)} MB
				</div>
				<div>
					<span className="font-medium">Resolución:</span> {video.width}x{video.height}
				</div>
				{video.description && (
					<div className="col-span-2">
						<span className="font-medium">Descripción:</span> {video.description}
					</div>
				)}
			</div>
		</div>
	);
};

VideoViewer.displayName = 'VideoViewer';

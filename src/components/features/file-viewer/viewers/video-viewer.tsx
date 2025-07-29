/**
 * @file VideoViewer - Componente para reproducir videos con controles y metadatos
 * @module components/features/file-viewer/viewers/video-viewer
 * @description Soporta mp4, webm, avi y muestra metadatos usando VideoWithStats
 */

import { Download, Maximize2, Minimize2, Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import React, { useRef, useState } from 'react';
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
		if (!vid) return;
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
		if (!vid) return;
		vid.muted = !vid.muted;
		setMuted(vid.muted);
	};

	const handleFullscreen = () => {
		const vid = videoRef.current;
		if (!vid) return;
		if (!fullscreen) {
			vid.requestFullscreen?.();
			setFullscreen(true);
		} else {
			document.exitFullscreen?.();
			setFullscreen(false);
		}
	};

	const handleTimeUpdate = () => {
		const vid = videoRef.current;
		if (!vid) return;
		setCurrentTime(vid.currentTime);
	};

	const handleLoadedMetadata = () => {
		const vid = videoRef.current;
		if (!vid) return;
		setDuration(vid.duration);
	};

	const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
		const vid = videoRef.current;
		if (!vid) return;
		const time = Number(e.target.value);
		vid.currentTime = time;
		setCurrentTime(time);
	};

	const handleRestart = () => {
		const vid = videoRef.current;
		if (!vid) return;
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
		<div className={cn('w-full max-w-3xl mx-auto bg-card rounded-lg shadow-lg p-4', className)}>
			<video
				ref={videoRef}
				src={video.path}
				controls={false}
				muted={muted}
				className="w-full rounded-lg bg-black"
				onClick={handlePlayPause}
				onTimeUpdate={handleTimeUpdate}
				onLoadedMetadata={handleLoadedMetadata}
				poster={video.thumbnail || undefined}
			>
				Sorry, your browser does not support embedded videos.
			</video>
			<div className="flex items-center gap-2 mt-2">
				<Button variant="ghost" size="icon" onClick={handlePlayPause} aria-label={playing ? 'Pausar' : 'Reproducir'}>
					{playing ? <Pause /> : <Play />}
				</Button>
				<Button variant="ghost" size="icon" onClick={handleRestart} aria-label="Reiniciar">
					<RotateCcw />
				</Button>
				<Button variant="ghost" size="icon" onClick={handleMute} aria-label={muted ? 'Activar sonido' : 'Silenciar'}>
					{muted ? <VolumeX /> : <Volume2 />}
				</Button>
				<input
					type="range"
					min={0}
					max={duration}
					value={currentTime}
					onChange={handleSeek}
					className="flex-1 accent-primary h-1 mx-2"
				/>
				<span className="text-xs w-14 text-right">
					{formatTime(currentTime)} / {formatTime(duration)}
				</span>
				<Button variant="ghost" size="icon" onClick={handleFullscreen} aria-label="Pantalla completa">
					{fullscreen ? <Minimize2 /> : <Maximize2 />}
				</Button>
				<Button variant="ghost" size="icon" onClick={handleDownload} aria-label="Descargar video">
					<Download />
				</Button>
			</div>
			{/* Metadatos del video */}
			<div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
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

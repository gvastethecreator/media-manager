'use client';

import { Disc3, Download, Music2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { WaveformVisualizer } from './waveform-visualizer';

interface EnhancedAudioViewerProps {
	audioUrl: string;
	className?: string;
	coverArtUrl?: string | null;
	fileName?: string;
	metadata?: {
		title?: string;
		artist?: string;
		album?: string;
		year?: string;
		genre?: string;
		bitrate?: string;
		sampleRate?: string;
		channels?: number;
		duration?: number;
	} | null;
}

export function EnhancedAudioViewer({
	audioUrl,
	fileName,
	coverArtUrl,
	metadata,
	className,
}: EnhancedAudioViewerProps) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(metadata?.duration || 0);
	const [volume, setVolume] = useState(1);
	const [progress, setProgress] = useState(0);
	const [isLoading, setIsLoading] = useState(true);

	// Título a mostrar
	const displayTitle = useMemo(() => {
		return metadata?.title || fileName?.replace(/\.[^/.]+$/, '') || 'Audio sin título';
	}, [metadata?.title, fileName]);

	// Artista a mostrar
	const displayArtist = useMemo(() => {
		return metadata?.artist || 'Artista desconocido';
	}, [metadata?.artist]);

	// Formatear tiempo
	const formatTime = useCallback((seconds: number) => {
		if (!seconds || Number.isNaN(seconds)) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}, []);

	// Event listeners del audio
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const handleTimeUpdate = () => {
			setCurrentTime(audio.currentTime);
			if (audio.duration && !Number.isNaN(audio.duration)) {
				setProgress((audio.currentTime / audio.duration) * 100);
			}
		};

		const handleLoadedMetadata = () => {
			if (audio.duration && !Number.isNaN(audio.duration)) {
				setDuration(audio.duration);
			}
			setIsLoading(false);
		};

		const handleEnded = () => {
			setIsPlaying(false);
			setProgress(0);
			setCurrentTime(0);
		};

		const handleCanPlay = () => {
			setIsLoading(false);
		};

		audio.addEventListener('timeupdate', handleTimeUpdate);
		audio.addEventListener('loadedmetadata', handleLoadedMetadata);
		audio.addEventListener('ended', handleEnded);
		audio.addEventListener('canplay', handleCanPlay);

		return () => {
			audio.removeEventListener('timeupdate', handleTimeUpdate);
			audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
			audio.removeEventListener('ended', handleEnded);
			audio.removeEventListener('canplay', handleCanPlay);
		};
	}, []);

	// Toggle play/pause
	const togglePlay = useCallback(() => {
		const audio = audioRef.current;
		if (!audio || isLoading) return;

		if (isPlaying) {
			audio.pause();
		} else {
			audio.play().catch((err) => {
				console.error('Error playing audio:', err);
			});
		}
		setIsPlaying(!isPlaying);
	}, [isPlaying, isLoading]);

	// Toggle mute
	const toggleMute = useCallback(() => {
		const audio = audioRef.current;
		if (!audio) return;

		audio.muted = !isMuted;
		setIsMuted(!isMuted);
	}, [isMuted]);

	// Seek
	const handleSeek = useCallback(
		(value: number[]) => {
			const audio = audioRef.current;
			if (!(audio && duration)) return;

			const newTime = (value[0] / 100) * duration;
			audio.currentTime = newTime;
			setCurrentTime(newTime);
			setProgress(value[0]);
		},
		[duration]
	);

	// Seek desde waveform
	const handleWaveformSeek = useCallback(
		(percent: number) => {
			const audio = audioRef.current;
			if (!(audio && duration)) return;

			const newTime = (percent / 100) * duration;
			audio.currentTime = newTime;
			setCurrentTime(newTime);
			setProgress(percent);
		},
		[duration]
	);

	// Cambiar volumen
	const handleVolumeChange = useCallback((value: number[]) => {
		const audio = audioRef.current;
		if (!audio) return;

		const newVolume = value[0] / 100;
		audio.volume = newVolume;
		setVolume(newVolume);
	}, []);

	// Download
	const handleDownload = useCallback(() => {
		const link = document.createElement('a');
		link.href = audioUrl;
		link.download = fileName || 'audio-file';
		link.click();
	}, [audioUrl, fileName]);

	return (
		<Card className={cn('flex h-full flex-col overflow-hidden bg-gradient-to-b from-background to-muted', className)}>
			{/* Audio element oculto */}
			<audio preload="metadata" ref={audioRef} src={audioUrl}>
				<track default kind="captions" label="Subtítulos" src="" srcLang="es" />
			</audio>

			{/* Header con Cover Art */}
			<div className="flex items-start gap-6 border-b p-6">
				{/* Cover Art o Icono */}
				<div className="relative h-48 w-48 flex-shrink-0 overflow-hidden rounded-lg bg-muted shadow-2xl">
					{coverArtUrl ? (
						<img
							alt="Cover Art"
							className="h-full w-full object-cover"
							onError={(e) => {
								// Fallback al icono si la imagen falla
								e.currentTarget.style.display = 'none';
							}}
							src={coverArtUrl}
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-orange-400 to-orange-600">
							<Music2 className="h-24 w-24 text-white" />
						</div>
					)}

					{/* Animación del disco si está reproduciendo */}
					{isPlaying && (
						<div className="absolute right-2 bottom-2">
							<Disc3 className="h-8 w-8 animate-spin text-white" />
						</div>
					)}
				</div>

				{/* Info del Audio */}
				<div className="min-w-0 flex-1">
					<h1 className="mb-1 truncate font-bold text-2xl">{displayTitle}</h1>
					<p className="mb-4 text-lg text-muted-foreground">{displayArtist}</p>

					{/* Metadata Grid */}
					<div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
						{metadata?.album && (
							<div>
								<span className="text-muted-foreground">Álbum:</span>
								<span className="ml-2 font-medium">{metadata.album}</span>
							</div>
						)}
						{metadata?.year && (
							<div>
								<span className="text-muted-foreground">Año:</span>
								<span className="ml-2 font-medium">{metadata.year}</span>
							</div>
						)}
						{metadata?.genre && (
							<div>
								<span className="text-muted-foreground">Género:</span>
								<span className="ml-2 font-medium">{metadata.genre}</span>
							</div>
						)}
						{metadata?.bitrate && (
							<div>
								<span className="text-muted-foreground">Bitrate:</span>
								<span className="ml-2 font-medium">{metadata.bitrate}</span>
							</div>
						)}
						{metadata?.sampleRate && (
							<div>
								<span className="text-muted-foreground">Sample Rate:</span>
								<span className="ml-2 font-medium">{metadata.sampleRate} Hz</span>
							</div>
						)}
						{metadata?.channels && (
							<div>
								<span className="text-muted-foreground">Canales:</span>
								<span className="ml-2 font-medium">
									{metadata.channels === 1
										? 'Mono'
										: metadata.channels === 2
											? 'Estéreo'
											: `${metadata.channels} canales`}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Botón Download */}
				<Button onClick={handleDownload} size="icon" variant="outline">
					<Download className="h-4 w-4" />
				</Button>
			</div>

			{/* Waveform Visualizer */}
			<div className="flex-1 px-6 py-4">
				<WaveformVisualizer
					audioUrl={audioUrl}
					height={120}
					isPlaying={isPlaying}
					onPositionClick={handleWaveformSeek}
					progress={progress}
					progressColor="hsl(var(--primary))"
					waveColor="hsl(var(--muted-foreground))"
				/>
			</div>

			{/* Controles */}
			<div className="flex items-center justify-between border-t bg-muted/50 px-6 py-4">
				{/* Tiempo */}
				<div className="w-20 text-muted-foreground text-sm">
					{formatTime(currentTime)} / {formatTime(duration)}
				</div>

				{/* Controles principales */}
				<div className="flex items-center gap-4">
					{/* Play/Pause */}
					<Button className="h-14 w-14 rounded-full" disabled={isLoading} onClick={togglePlay} size="lg">
						{isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6" />}
					</Button>
				</div>

				{/* Volumen */}
				<div className="flex w-48 items-center gap-2">
					<Button onClick={toggleMute} size="icon" variant="ghost">
						{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
					</Button>
					<Slider
						className="flex-1"
						max={100}
						onValueChange={handleVolumeChange}
						step={1}
						value={[isMuted ? 0 : volume * 100]}
					/>
				</div>
			</div>

			{/* Barra de progreso */}
			<div className="px-6 pb-6">
				<Slider
					className="w-full"
					disabled={isLoading || !duration}
					max={100}
					onValueChange={handleSeek}
					step={0.1}
					value={[progress]}
				/>
			</div>
		</Card>
	);
}

export default EnhancedAudioViewer;

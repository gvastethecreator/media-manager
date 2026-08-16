'use client';

import { Disc3, Download, Music2, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { clientLogger } from '@/lib/logger/client-logger';
import { WaveformVisualizer } from './waveform-visualizer';

const logger = clientLogger.withContext('EnhancedAudioViewer');

function getKnownDuration(value: number | undefined): number | null {
	return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

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
	const knownDuration = getKnownDuration(metadata?.duration);
	const [duration, setDuration] = useState<number | null>(knownDuration);
	const [volume, setVolume] = useState(1);
	const [progress, setProgress] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	// Título a mostrar
	const displayTitle = useMemo(() => {
		return metadata?.title || fileName?.replace(/\.[^/.]+$/, '') || 'Untitled audio';
	}, [metadata?.title, fileName]);

	// Artista a mostrar
	const displayArtist = useMemo(() => {
		return metadata?.artist || 'Unknown artist';
	}, [metadata?.artist]);

	// Formatear tiempo
	const formatTime = useCallback((seconds: number) => {
		if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}, []);

	const formatDuration = useCallback(
		(seconds: number | null) => (seconds === null ? '—' : formatTime(seconds)),
		[formatTime]
	);

	// Event listeners del audio
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;
		setErrorMessage(null);
		setIsLoading(true);
		setIsPlaying(false);
		setCurrentTime(0);
		setProgress(0);
		setDuration(knownDuration);

		const handleTimeUpdate = () => {
			setCurrentTime(audio.currentTime);
			if (audio.duration && !Number.isNaN(audio.duration)) {
				setProgress((audio.currentTime / audio.duration) * 100);
			}
		};

		const handleLoadedMetadata = () => {
			if (Number.isFinite(audio.duration) && audio.duration >= 0) {
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

		const handlePlay = () => {
			setIsPlaying(true);
		};

		const handlePause = () => {
			setIsPlaying(false);
		};

		const handleError = () => {
			const mediaError = audio.error;
			logger.error('Could not load audio', {
				code: mediaError?.code,
				url: audioUrl,
			});
			setErrorMessage('Could not load this audio file. Check that the file is still available.');
			setIsLoading(false);
			setIsPlaying(false);
		};

		audio.addEventListener('timeupdate', handleTimeUpdate);
		audio.addEventListener('loadedmetadata', handleLoadedMetadata);
		audio.addEventListener('ended', handleEnded);
		audio.addEventListener('canplay', handleCanPlay);
		audio.addEventListener('play', handlePlay);
		audio.addEventListener('pause', handlePause);
		audio.addEventListener('error', handleError);

		return () => {
			audio.removeEventListener('timeupdate', handleTimeUpdate);
			audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
			audio.removeEventListener('ended', handleEnded);
			audio.removeEventListener('canplay', handleCanPlay);
			audio.removeEventListener('play', handlePlay);
			audio.removeEventListener('pause', handlePause);
			audio.removeEventListener('error', handleError);
		};
	}, [audioUrl, knownDuration]);

	// Toggle play/pause
	const togglePlay = useCallback(() => {
		const audio = audioRef.current;
		if (!audio || isLoading) return;

		if (isPlaying) {
			audio.pause();
		} else {
			void audio.play().catch((error) => {
				logger.error('Could not play audio', { error, url: audioUrl });
				setErrorMessage('Could not play this audio file. Download it or open it again.');
			});
		}
	}, [audioUrl, isPlaying, isLoading]);

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
			if (!(audio && duration && duration > 0)) return;

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
			if (!(audio && duration && duration > 0)) return;

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
		<Card
			className={cn(
				'flex h-full min-h-0 flex-col overflow-hidden bg-gradient-to-b from-background to-muted',
				className
			)}
		>
			{/* Audio element oculto */}
			<audio preload="metadata" ref={audioRef} src={audioUrl}>
				<track default kind="captions" label="Captions" src="" srcLang="en" />
			</audio>

			{/* Header con Cover Art */}
			<div className="flex shrink-0 items-start gap-4 border-b p-4">
				{/* Cover Art o Icono */}
				<div className="relative h-40 w-40 flex-shrink-0 overflow-hidden rounded-lg bg-muted shadow-2xl">
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
							<Music2 className="h-20 w-20 text-white" />
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
					<h1 className="mb-1 truncate font-bold text-xl">{displayTitle}</h1>
					<p className="mb-3 text-muted-foreground">{displayArtist}</p>

					{/* Metadata Grid */}
					<div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
						{metadata?.album && (
							<div>
								<span className="text-muted-foreground">Album:</span>
								<span className="ml-2 font-medium">{metadata.album}</span>
							</div>
						)}
						{metadata?.year && (
							<div>
								<span className="text-muted-foreground">Year:</span>
								<span className="ml-2 font-medium">{metadata.year}</span>
							</div>
						)}
						{metadata?.genre && (
							<div>
								<span className="text-muted-foreground">Genre:</span>
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
								<span className="text-muted-foreground">Channels:</span>
								<span className="ml-2 font-medium">
									{metadata.channels === 1
										? 'Mono'
										: metadata.channels === 2
											? 'Stereo'
											: `${metadata.channels} channels`}
								</span>
							</div>
						)}
					</div>
				</div>

				{/* Botón Download */}
				<Button aria-label="Download audio" onClick={handleDownload} size="icon" variant="outline">
					<Download className="h-4 w-4" />
				</Button>
			</div>

			{/* Waveform Visualizer */}
			<div className="min-h-0 flex-1 px-4 py-3">
				{errorMessage && (
					<div
						className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive text-sm"
						role="alert"
					>
						{errorMessage}
					</div>
				)}
				{errorMessage ? (
					<div className="flex h-full min-h-0 items-center justify-center rounded-lg bg-muted px-3 text-center text-muted-foreground text-sm">
						Visualization unavailable
					</div>
				) : (
					<WaveformVisualizer
						audioUrl={audioUrl}
						height={96}
						isPlaying={isPlaying}
						onPositionClick={handleWaveformSeek}
						progress={progress}
						progressColor="hsl(var(--primary))"
						waveColor="hsl(var(--muted-foreground))"
					/>
				)}
			</div>

			{/* Controles */}
			<div className="flex shrink-0 items-center justify-between border-t bg-muted/50 px-4 py-3">
				{/* Tiempo */}
				<div className="w-20 whitespace-nowrap text-muted-foreground text-sm">
					{formatTime(currentTime)} / {formatDuration(duration)}
				</div>

				{/* Controles principales */}
				<div className="flex items-center gap-4">
					{/* Play/Pause */}
					<Button
						aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
						className="h-14 w-14 rounded-full"
						disabled={isLoading || Boolean(errorMessage)}
						onClick={togglePlay}
						size="lg"
					>
						{isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6" />}
					</Button>
				</div>

				{/* Volumen */}
				<div className="flex w-40 items-center gap-2">
					<Button
						aria-label={isMuted ? 'Unmute' : 'Mute audio'}
						disabled={Boolean(errorMessage)}
						onClick={toggleMute}
						size="icon"
						variant="ghost"
					>
						{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
					</Button>
					<Slider
					aria-label="Volume"
						className="flex-1"
						disabled={Boolean(errorMessage)}
						max={100}
						onValueChange={handleVolumeChange}
						step={1}
						value={[isMuted ? 0 : volume * 100]}
					/>
				</div>
			</div>

			{/* Barra de progreso */}
			<div className="shrink-0 px-4 pb-3">
				<Slider
					aria-label="Playback position"
					className="w-full"
					disabled={isLoading || Boolean(errorMessage) || !duration}
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

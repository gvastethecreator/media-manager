/**
 * @file AudioViewer component for audio file playback and visualization
 * @module components/features/file-viewer/viewers/audio-viewer
 */

import { Download, Pause, Play, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { formatDuration, formatFileSize } from '@/lib/utils';
import type { AudioWithStats } from '@/types/entities/audio';

interface AudioViewerProps {
	audio: AudioWithStats;
	onClose: () => void;
	onNext: () => void;
	onPrevious: () => void;
}

function AudioHeader({
	onPrevious,
	onNext,
	onClose,
}: {
	onPrevious: () => void;
	onNext: () => void;
	onClose: () => void;
}) {
	return (
		<div className="flex items-center justify-between border-b p-4">
			<div className="flex items-center space-x-4">
				<Button onClick={onPrevious} size="sm" variant="ghost">
					<SkipBack className="h-4 w-4" />
				</Button>
				<Button onClick={onNext} size="sm" variant="ghost">
					<SkipForward className="h-4 w-4" />
				</Button>
			</div>
			<Button onClick={onClose} size="sm" variant="ghost">
				✕
			</Button>
		</div>
	);
}

function MetadataPanel({
	audio,
	renderChannels,
}: {
	audio: AudioWithStats;
	renderChannels: (channels?: number) => string | null;
}) {
	return (
		<div className="border-t p-4">
			<div className="grid grid-cols-2 gap-4 text-sm">
				<div>
					<span className="font-medium">Formato:</span>
					<span className="ml-2 text-muted-foreground">{audio.path?.split('.').pop()?.toUpperCase() || 'Audio'}</span>
				</div>
				{audio.stats?.sampleRate && (
					<div>
						<span className="font-medium">Sample Rate:</span>
						<span className="ml-2 text-muted-foreground">{audio.stats.sampleRate} Hz</span>
					</div>
				)}
				{audio.stats?.channels && (
					<div>
						<span className="font-medium">Canales:</span>
						<span className="ml-2 text-muted-foreground">{renderChannels(audio.stats.channels) ?? ''}</span>
					</div>
				)}
				<div>
					<span className="font-medium">Creado:</span>
					<span className="ml-2 text-muted-foreground">{new Date(audio.createdAt).toLocaleDateString()}</span>
				</div>
			</div>
		</div>
	);
}

export function AudioViewer({ audio, onClose, onNext, onPrevious }: AudioViewerProps) {
	const audioRef = useRef<HTMLAudioElement>(null);
	const [isPlaying, setIsPlaying] = useState(false);
	const [isMuted, setIsMuted] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Audio source URL
	const audioSrc = audio.path || `/api/audio/${audio.id}/stream`;

	useEffect(() => {
		const audioElement = audioRef.current;
		if (!audioElement) {
			return;
		}

		const handleLoadedMetadata = () => {
			setDuration(audioElement.duration);
			setIsLoading(false);
		};

		const handleTimeUpdate = () => {
			setCurrentTime(audioElement.currentTime);
		};

		const handleEnded = () => {
			setIsPlaying(false);
			setCurrentTime(0);
		};

		const handleError = () => {
			setError('Error al cargar el archivo de audio');
			setIsLoading(false);
		};

		const handleCanPlay = () => {
			setIsLoading(false);
		};

		audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
		audioElement.addEventListener('timeupdate', handleTimeUpdate);
		audioElement.addEventListener('ended', handleEnded);
		audioElement.addEventListener('error', handleError);
		audioElement.addEventListener('canplay', handleCanPlay);

		return () => {
			audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
			audioElement.removeEventListener('timeupdate', handleTimeUpdate);
			audioElement.removeEventListener('ended', handleEnded);
			audioElement.removeEventListener('error', handleError);
			audioElement.removeEventListener('canplay', handleCanPlay);
		};
	}, []);

	const togglePlayPause = () => {
		const audioElement = audioRef.current;
		if (!audioElement) {
			return;
		}

		if (isPlaying) {
			audioElement.pause();
		} else {
			audioElement.play();
		}
		setIsPlaying(!isPlaying);
	};

	const toggleMute = () => {
		const audioElement = audioRef.current;
		if (!audioElement) {
			return;
		}

		audioElement.muted = !isMuted;
		setIsMuted(!isMuted);
	};

	const handleSeek = (value: number[]) => {
		const audioElement = audioRef.current;
		if (!audioElement) {
			return;
		}

		const newTime = (value[0] / 100) * duration;
		audioElement.currentTime = newTime;
		setCurrentTime(newTime);
	};

	const handleVolumeChange = (value: number[]) => {
		const audioElement = audioRef.current;
		if (!audioElement) {
			return;
		}

		const newVolume = value[0] / 100;
		audioElement.volume = newVolume;
		setVolume(newVolume);
	};

	const handleDownload = () => {
		const link = document.createElement('a');
		link.href = audioSrc;
		link.download = audio.name || 'audio';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

	const renderChannels = (channels?: number) => {
		if (!channels) {
			return null;
		}
		if (channels === 1) {
			return 'Mono';
		}
		if (channels === 2) {
			return 'Estéreo';
		}
		return `${channels} canales`;
	};

	return (
		<div className="flex h-full flex-col bg-background">
			<AudioHeader onClose={onClose} onNext={onNext} onPrevious={onPrevious} />

			{/* Main Content */}
			<div className="flex flex-1 flex-col items-center justify-center p-8">
				{/* Audio Element */}
				<audio className="hidden" preload="metadata" ref={audioRef} src={audioSrc}>
					<track
						default
						kind="captions"
						label="Subtítulos (generados)"
						src="data:text/vtt;charset=utf-8,WEBVTT"
						srcLang="es"
					/>
				</audio>

				{/* Audio Info */}
				<div className="mb-8 text-center">
					<h2 className="mb-2 font-bold text-2xl">{audio.name}</h2>
					{audio.description && <p className="mb-4 text-muted-foreground">{audio.description}</p>}
					<div className="flex items-center justify-center space-x-4 text-muted-foreground text-sm">
						<span>Tamaño: {formatFileSize(audio.size || 0)}</span>
						{duration > 0 && <span>Duración: {formatDuration(duration)}</span>}
						{audio.stats?.bitrate && <span>Bitrate: {audio.stats.bitrate} kbps</span>}
					</div>
				</div>

				{/* Waveform Placeholder */}
				<div className="mb-8 flex h-32 w-full max-w-2xl items-center justify-center rounded-lg bg-muted">
					<div className="text-muted-foreground text-sm">Visualización de forma de onda</div>
				</div>

				{/* Error State */}
				{error && <div className="mb-4 text-center text-red-500">{error}</div>}

				{/* Loading State */}
				{isLoading && <div className="mb-4 text-center text-muted-foreground">Cargando audio...</div>}

				{/* Controls */}
				<div className="w-full max-w-2xl">
					{/* Progress Bar */}
					<div className="mb-4">
						<Slider
							className="w-full"
							disabled={isLoading || !!error}
							max={100}
							onValueChange={handleSeek}
							step={0.1}
							value={[progress]}
						/>
						<div className="mt-1 flex justify-between text-muted-foreground text-xs">
							<span>{formatDuration(currentTime)}</span>
							<span>{formatDuration(duration)}</span>
						</div>
					</div>

					{/* Control Buttons */}
					<div className="flex items-center justify-center space-x-4">
						<Button disabled={isLoading || !!error} onClick={togglePlayPause} size="icon" variant="outline">
							{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
						</Button>

						<div className="flex items-center space-x-2">
							<Button onClick={toggleMute} size="icon" variant="ghost">
								{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
							</Button>
							<Slider className="w-24" max={100} onValueChange={handleVolumeChange} step={1} value={[volume * 100]} />
						</div>

						<Button onClick={handleDownload} size="icon" variant="outline">
							<Download className="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
			<MetadataPanel audio={audio} renderChannels={renderChannels} />
		</div>
	);
}

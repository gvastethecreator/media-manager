import { MusicIcon, PauseIcon, PlayIcon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { motion } from '@/components/ui/motion-shim';
import { cn } from '@/lib/utils';
import type { AudioWithStats } from '@/types/entities/audio';
import { CardContainer } from '../card-container';
import { CardHeader } from '../card-header';

export interface AudioCardProps {
	audio: AudioWithStats;
	onClick?: (audioData: AudioWithStats) => void;
	className?: string;
	style?: React.CSSProperties;
	compact?: boolean;
	isSelected?: boolean;
	isActive?: boolean;
	tcgMode?: boolean;
	disabled?: boolean;
}

/**
 * AudioCard - Componente de tarjeta para archivos de audio con player integrado
 */
export function AudioCard({
	audio,
	compact = false,
	tcgMode = true,
	disabled = false,
	className,
	onClick,
	isSelected = false,
	isActive = false,
}: AudioCardProps) {
	const [isHovered, setIsHovered] = useState(false);
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [isMuted, setIsMuted] = useState(false);
	const audioRef = useRef<HTMLAudioElement>(null);

	// Colores para el gradiente basados en el formato de audio
	const primaryColor = useMemo(() => {
		const format = audio.format?.toLowerCase();
		switch (format) {
			case 'mp3':
				return '#f59e0b'; // Amarillo para MP3
			case 'wav':
				return '#3b82f6'; // Azul para WAV
			case 'flac':
				return '#8b5cf6'; // Púrpura para FLAC
			case 'ogg':
				return '#10b981'; // Verde para OGG
			case 'm4a':
				return '#ef4444'; // Rojo para M4A
			default:
				return '#6b7280'; // Gris para otros
		}
	}, [audio.format]);

	const secondaryColor = useMemo(() => {
		// Oscurecer el color primario para el secundario
		const hex = primaryColor.replace('#', '');
		const r = Math.floor(Number.parseInt(hex.slice(0, 2), 16) * 0.6);
		const g = Math.floor(Number.parseInt(hex.slice(2, 4), 16) * 0.6);
		const b = Math.floor(Number.parseInt(hex.slice(4, 6), 16) * 0.6);
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	}, [primaryColor]);

	// Formatear duración
	const formatTime = useCallback((seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}, []);

	// Formatear tamaño de archivo
	const fileSize = useMemo(() => {
		if (!audio.size) {
			return 'N/A';
		}
		const mb = audio.size / (1024 * 1024);
		if (mb < 1) {
			const kb = audio.size / 1024;
			return `${kb.toFixed(1)} KB`;
		}
		return `${mb.toFixed(1)} MB`;
	}, [audio.size]);

	// Handlers del reproductor
	const togglePlay = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (!audioRef.current) {
				return;
			}

			if (isPlaying) {
				audioRef.current.pause();
			} else {
				audioRef.current.play();
			}
			setIsPlaying(!isPlaying);
		},
		[isPlaying]
	);

	const toggleMute = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			if (!audioRef.current) {
				return;
			}

			audioRef.current.muted = !isMuted;
			setIsMuted(!isMuted);
		},
		[isMuted]
	);

	const handleTimeUpdate = useCallback(() => {
		if (!audioRef.current) {
			return;
		}
		setCurrentTime(audioRef.current.currentTime);
	}, []);

	const handleLoadedMetadata = useCallback(() => {
		if (!audioRef.current) {
			return;
		}
		setDuration(audioRef.current.duration);
	}, []);

	const handleClick = useCallback(() => {
		if (!disabled && onClick) {
			onClick(audio);
		}
	}, [disabled, onClick, audio]);

	const handleMouseEnter = useCallback(() => setIsHovered(true), []);
	const handleMouseLeave = useCallback(() => setIsHovered(false), []);

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

	return (
		<CardContainer
			className={cn(
				'relative cursor-pointer overflow-hidden transition-all duration-300',
				'bg-gradient-to-br from-background via-background/95 to-background/90',
				'border border-border/50 hover:border-border',
				'shadow-sm hover:shadow-lg',
				tcgMode && 'hover:scale-[1.02] hover:shadow-2xl',
				isSelected && 'ring-2 ring-primary ring-offset-2',
				isActive && 'ring-2 ring-accent ring-offset-2',
				disabled && 'cursor-not-allowed opacity-50',
				compact ? 'h-32' : 'h-64',
				className
			)}
			onClick={handleClick}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* Audio element oculto */}
			<audio
				onEnded={() => setIsPlaying(false)}
				onLoadedMetadata={handleLoadedMetadata}
				onTimeUpdate={handleTimeUpdate}
				ref={audioRef}
				src={audio.path}
			>
				<track kind="captions" />
			</audio>

			{/* Efectos TCG */}
			{tcgMode && (
				<>
					{/* Gradiente de fondo */}
					<div
						className="absolute inset-0 opacity-10"
						style={{
							background: `linear-gradient(135deg, ${primaryColor}20 0%, transparent 50%, ${secondaryColor}20 100%)`,
						}}
					/>

					{/* Efecto de ondas sonoras cuando reproduce */}
					{isPlaying && (
						<motion.div
							animate={{
								scale: [1, 1.1, 1],
								opacity: [0.2, 0.4, 0.2],
							}}
							className="pointer-events-none absolute inset-0 opacity-20"
							style={{
								background: `radial-gradient(circle at center, ${primaryColor}40 0%, transparent 70%)`,
							}}
							transition={{
								duration: 2,
								repeat: Number.POSITIVE_INFINITY,
								ease: 'easeInOut',
							}}
						/>
					)}

					{/* Brillo en favoritos */}
					{audio.isFavorite && (
						<div className="pointer-events-none absolute top-0 right-0 z-30 h-24 w-24 overflow-hidden">
							<div
								className="-translate-y-8 absolute top-0 right-0 h-24 w-24 translate-x-12 rotate-45 opacity-70"
								style={{
									background: `linear-gradient(45deg, transparent 30%, ${primaryColor} 40%, gold 50%, ${primaryColor} 60%, transparent 70%)`,
									backgroundSize: '600% 600%',
									animation: 'shine 3s linear infinite',
								}}
							/>
						</div>
					)}
				</>
			)}

			{/* Contenedor principal */}
			<div className="relative z-1 flex h-full flex-col">
				{/* Cabecera */}
				<CardHeader
					icon={<MusicIcon className="h-4 w-4" />}
					primaryColor={primaryColor}
					title={audio.name || 'Sin nombre'}
				/>

				{/* Contenido principal */}
				{!compact && (
					<div className="flex flex-1 flex-col gap-3 p-4">
						{/* Visualizador de audio */}
						<div className="flex items-center justify-center py-4">
							<div
								className="relative rounded-2xl p-6"
								style={{
									backgroundColor: `${primaryColor}20`,
									border: `2px solid ${primaryColor}40`,
								}}
							>
								<MusicIcon className="h-12 w-12" style={{ color: primaryColor }} />

								{/* Badge del formato */}
								<div
									className="-top-2 -right-2 absolute rounded-md px-2 py-1 font-bold text-xs"
									style={{
										backgroundColor: primaryColor,
										color: 'white',
									}}
								>
									{audio.format?.toUpperCase() || 'AUDIO'}
								</div>

								{/* Indicador de reproducción */}
								{isPlaying && (
									<motion.div
										animate={{
											scale: [1, 1.1, 1],
											opacity: [0.5, 1, 0.5],
										}}
										className="absolute inset-0 rounded-2xl border-2"
										style={{ borderColor: primaryColor }}
										transition={{
											duration: 1,
											repeat: Number.POSITIVE_INFINITY,
											ease: 'easeInOut',
										}}
									/>
								)}
							</div>
						</div>

						{/* Estadísticas en modo TCG */}
						{tcgMode && (
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div
									className="flex items-center justify-between rounded px-2 py-1"
									style={{ backgroundColor: `${primaryColor}20` }}
								>
									<span>Duración</span>
									<span className="font-bold">{formatTime(audio.duration || 0)}</span>
								</div>
								<div
									className="flex items-center justify-between rounded px-2 py-1"
									style={{ backgroundColor: `${primaryColor}20` }}
								>
									<span>Tamaño</span>
									<span className="font-bold">{fileSize}</span>
								</div>
							</div>
						)}
					</div>
				)}

				{/* Controles del reproductor */}
				<div className="border-border/20 border-t p-3">
					{/* Barra de progreso */}
					<div className="mb-3">
						<div className="mb-1 flex items-center justify-between text-muted-foreground text-xs">
							<span>{formatTime(currentTime)}</span>
							<span>{formatTime(duration)}</span>
						</div>
						<div className="h-1 w-full overflow-hidden rounded-full bg-muted/30">
							<div
								className="h-full rounded-full transition-all duration-300"
								style={{
									width: `${progress}%`,
									backgroundColor: primaryColor,
									boxShadow: `0 0 8px ${primaryColor}50`,
								}}
							/>
						</div>
					</div>

					{/* Controles */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							{/* Botón play/pause */}
							<button
								className="rounded-full p-2 transition-colors hover:bg-muted/50"
								onClick={togglePlay}
								style={{ color: primaryColor }}
								title={isPlaying ? 'Pausar' : 'Reproducir'}
								type="button"
							>
								{isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
							</button>

							{/* Botón mute */}
							<button
								className="rounded p-1 transition-colors hover:bg-muted/50"
								onClick={toggleMute}
								style={{ color: primaryColor }}
								title={isMuted ? 'Activar sonido' : 'Silenciar'}
								type="button"
							>
								{isMuted ? <VolumeXIcon className="h-3.5 w-3.5" /> : <Volume2Icon className="h-3.5 w-3.5" />}
							</button>
						</div>

						{/* Fecha de modificación */}
						<span className="text-muted-foreground text-xs">{new Date(audio.updatedAt).toLocaleDateString()}</span>
					</div>
				</div>
			</div>
		</CardContainer>
	);
}

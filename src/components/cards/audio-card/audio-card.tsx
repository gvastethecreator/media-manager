'use client';

import { cn } from '@/lib/utils';
import type { AudioWithStats } from '@/types/entities/audio';
import { MusicIcon, PauseIcon, PlayIcon, Volume2Icon, VolumeXIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo, useRef, useState } from 'react';
import { CardContainer } from '../card-container';
import { CardHeader } from '../card-header';

interface AudioCardProps {
	/** Datos del audio a mostrar */
	audio: AudioWithStats;
	/** Tamaño compacto con menos información */
	compact?: boolean;
	/** Modo TCG con efectos especiales de carta */
	tcgMode?: boolean;
	/** Deshabilitar interacciones */
	disabled?: boolean;
	/** Clase CSS adicional para la carta */
	className?: string;
	/** Función a ejecutar al hacer clic en la tarjeta */
	onClick?: () => void;
	/** Si la tarjeta está seleccionada */
	isSelected?: boolean;
	/** Si la tarjeta está activa */
	isActive?: boolean;
	/** Si está en modo scroll (para optimización) */
	isScrolling?: boolean;
	/** Si debe cargar contenido */
	shouldLoad?: boolean;
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
	isScrolling = false,
	shouldLoad = true,
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
		if (!audio.size) return 'N/A';
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
			if (!audioRef.current) return;

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
			if (!audioRef.current) return;

			audioRef.current.muted = !isMuted;
			setIsMuted(!isMuted);
		},
		[isMuted]
	);

	const handleTimeUpdate = useCallback(() => {
		if (!audioRef.current) return;
		setCurrentTime(audioRef.current.currentTime);
	}, []);

	const handleLoadedMetadata = useCallback(() => {
		if (!audioRef.current) return;
		setDuration(audioRef.current.duration);
	}, []);

	const handleClick = useCallback(() => {
		if (!disabled && onClick) {
			onClick();
		}
	}, [disabled, onClick]);

	const handleMouseEnter = useCallback(() => setIsHovered(true), []);
	const handleMouseLeave = useCallback(() => setIsHovered(false), []);

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

	return (
		<CardContainer
			className={cn(
				'relative overflow-hidden cursor-pointer transition-all duration-300',
				'bg-gradient-to-br from-background via-background/95 to-background/90',
				'border border-border/50 hover:border-border',
				'shadow-sm hover:shadow-lg',
				tcgMode && 'hover:shadow-2xl hover:scale-[1.02]',
				isSelected && 'ring-2 ring-primary ring-offset-2',
				isActive && 'ring-2 ring-accent ring-offset-2',
				disabled && 'opacity-50 cursor-not-allowed',
				compact ? 'h-32' : 'h-64',
				className
			)}
			onClick={handleClick}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
		>
			{/* Audio element oculto */}
			<audio
				ref={audioRef}
				src={audio.filePath}
				onTimeUpdate={handleTimeUpdate}
				onLoadedMetadata={handleLoadedMetadata}
				onEnded={() => setIsPlaying(false)}
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
							className="absolute inset-0 opacity-20 pointer-events-none"
							style={{
								background: `radial-gradient(circle at center, ${primaryColor}40 0%, transparent 70%)`,
							}}
							animate={{
								scale: [1, 1.1, 1],
								opacity: [0.2, 0.4, 0.2],
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
						<div className="absolute top-0 right-0 w-24 h-24 overflow-hidden z-30 pointer-events-none">
							<div
								className="absolute top-0 right-0 w-24 h-24 rotate-45 translate-x-12 -translate-y-8 opacity-70"
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
			<div className="flex flex-col h-full relative z-1">
				{/* Cabecera */}
				<CardHeader
					title={audio.name || 'Sin nombre'}
					emoji="🎵"
					color={primaryColor}
					isFavorite={audio.isFavorite || false}
					compact={compact}
				/>

				{/* Contenido principal */}
				{!compact && (
					<div className="flex-1 p-4 flex flex-col gap-3">
						{/* Visualizador de audio */}
						<div className="flex items-center justify-center py-4">
							<div
								className="relative p-6 rounded-2xl"
								style={{
									backgroundColor: `${primaryColor}20`,
									border: `2px solid ${primaryColor}40`,
								}}
							>
								<MusicIcon className="h-12 w-12" style={{ color: primaryColor }} />

								{/* Badge del formato */}
								<div
									className="absolute -top-2 -right-2 px-2 py-1 rounded-md text-xs font-bold"
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
										className="absolute inset-0 rounded-2xl border-2"
										style={{ borderColor: primaryColor }}
										animate={{
											scale: [1, 1.1, 1],
											opacity: [0.5, 1, 0.5],
										}}
										transition={{
											duration: 1,
											repeat: Number.POSITIVE_INFINITY,
											ease: 'easeInOut',
										}}
									/>
								)}
							</div>
						</div>

						{/* Descripción */}
						{audio.description && (
							<div className="text-sm text-muted-foreground line-clamp-2 italic">{audio.description}</div>
						)}

						{/* Estadísticas en modo TCG */}
						{tcgMode && (
							<div className="grid grid-cols-2 gap-2 text-xs">
								<div
									className="flex items-center justify-between px-2 py-1 rounded"
									style={{ backgroundColor: `${primaryColor}20` }}
								>
									<span>Duración</span>
									<span className="font-bold">{formatTime(audio.duration || 0)}</span>
								</div>
								<div
									className="flex items-center justify-between px-2 py-1 rounded"
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
				<div className="p-3 border-t border-border/20">
					{/* Barra de progreso */}
					<div className="mb-3">
						<div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
							<span>{formatTime(currentTime)}</span>
							<span>{formatTime(duration)}</span>
						</div>
						<div className="h-1 w-full rounded-full overflow-hidden bg-muted/30">
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
								type="button"
								onClick={togglePlay}
								className="p-2 rounded-full hover:bg-muted/50 transition-colors"
								style={{ color: primaryColor }}
								title={isPlaying ? 'Pausar' : 'Reproducir'}
							>
								{isPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
							</button>

							{/* Botón mute */}
							<button
								type="button"
								onClick={toggleMute}
								className="p-1 rounded hover:bg-muted/50 transition-colors"
								style={{ color: primaryColor }}
								title={isMuted ? 'Activar sonido' : 'Silenciar'}
							>
								{isMuted ? <VolumeXIcon className="h-3.5 w-3.5" /> : <Volume2Icon className="h-3.5 w-3.5" />}
							</button>
						</div>

						{/* Fecha de modificación */}
						<span className="text-xs text-muted-foreground">{new Date(audio.updatedAt).toLocaleDateString()}</span>
					</div>
				</div>
			</div>
		</CardContainer>
	);
}

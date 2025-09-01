import React, { useCallback, useMemo, useState } from 'react';
import { motion } from '@/components/ui/motion-shim';
import { useVideo } from '@/lib/api/videos';
import { cn } from '@/lib/utils';
import type { VideoWithStats } from '@/types/entities/video';
import { CardContainer } from '../card-container';
import { VideoCardContent } from './video-card-content';
import { VideoCardFooter } from './video-card-footer';
import { VideoCardHeader } from './video-card-header';
import { VideoCardThumbnail } from './video-card-thumbnail';

export interface VideoCardProps {
	videoId: string;
	onClick?: (videoData: VideoWithStats) => void;
	className?: string;
	style?: React.CSSProperties;
	compact?: boolean;
	isSelected?: boolean;
	tcgMode?: boolean;
	disabled?: boolean;
}

/**
 * 🎬 VideoCard - Componente de tarjeta para videos con diseño TCG
 *
 * Muestra información detallada de un video en formato de carta TCG,
 * incluyendo thumbnail, estadísticas técnicas, calidad y metadatos.
 */
export function VideoCard({
	videoId,
	onClick,
	className,
	style,
	compact = false,
	isSelected = false,
	tcgMode = true,
	disabled = false,
}: VideoCardProps) {
	const { data: video, isLoading, error } = useVideo(videoId);
	const [isHovered, setIsHovered] = useState(false);

	// Calcular colores basados en la calidad técnica
	const primaryColor = useMemo(() => {
		if (!video) {
			return '#6b7280';
		}
		const grade = video.stats?.technicalGrade || 'D';
		switch (grade) {
			case 'A':
				return '#10b981'; // Verde esmeralda - Ultra calidad
			case 'B':
				return '#3b82f6'; // Azul - Alta calidad
			case 'C':
				return '#f59e0b'; // Ámbar - Calidad media
			case 'D':
				return '#ef4444'; // Rojo - Baja calidad
			default:
				return '#6b7280'; // Gris - Desconocida
		}
	}, [video?.stats?.technicalGrade, video]);

	const secondaryColor = useMemo(() => {
		// Oscurecer el color primario
		const hex = primaryColor.slice(1);
		const r = Number.parseInt(hex.slice(0, 2), 16);
		const g = Number.parseInt(hex.slice(2, 4), 16);
		const b = Number.parseInt(hex.slice(4, 6), 16);

		const darkenFactor = 0.7;
		const darkerR = Math.floor(r * darkenFactor);
		const darkerG = Math.floor(g * darkenFactor);
		const darkerB = Math.floor(b * darkenFactor);

		return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
	}, [primaryColor]);

	// Calcular nivel de rareza basado en quality score
	const rarityLevel = useMemo(() => {
		if (!video) {
			return 1;
		}
		const score = video.stats?.qualityScore ?? 0;
		if (score >= 90) {
			return 10; // Mítico
		}
		if (score >= 80) {
			return 9; // Legendario
		}
		if (score >= 70) {
			return 7; // Épico
		}
		if (score >= 60) {
			return 5; // Raro
		}
		if (score >= 50) {
			return 3; // Poco común
		}
		return 1; // Común
	}, [video?.stats?.qualityScore, video]);

	// Manejar eventos
	const handleClick = useCallback(() => {
		if (!disabled && onClick && video) {
			onClick(video);
		}
	}, [onClick, disabled, video]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick && video) {
				e.preventDefault();
				onClick(video);
			}
		},
		[onClick, disabled, video]
	);

	// Si no hay datos del video o está cargando, mostrar un esqueleto o un mensaje de error
	if (isLoading) {
		return (
			<div
				className={cn(
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-gray-100 md:w-[320px] dark:bg-gray-900',
					className
				)}
			>
				<p className="text-gray-500">Cargando video...</p>
			</div>
		);
	}

	if (error || !video) {
		return (
			<div
				className={cn(
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-red-100 md:w-[320px] dark:bg-red-900',
					className
				)}
			>
				<p className="text-red-800">Error: {error?.message || 'Video no encontrado'}</p>
			</div>
		);
	}

	// Extraer datos del video
	const { id, name } = video;

	// ID de carta para TCG
	const cardId = `V${id.substring(0, 6).toUpperCase()}`;

	// Conteos de relaciones - usar stats en lugar de acceso directo
	const totalRelations = video.stats?.totalRelations ?? 0;

	return (
		<motion.button
			aria-label={`Video: ${name}`}
			className={cn(
				'group relative cursor-pointer select-none',
				'transition-all duration-300 ease-out',
				isSelected && 'ring-2 ring-primary ring-offset-2',
				disabled && 'cursor-not-allowed opacity-50',
				compact ? 'w-40' : 'w-64',
				className
			)}
			disabled={disabled}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			style={style}
			type="button"
			whileHover={disabled ? {} : { y: -4, scale: 1.02 }}
			whileTap={disabled ? {} : { scale: 0.98 }}
		>
			<CardContainer
				className={cn(
					'transition-all duration-300',
					isHovered && 'scale-[1.02]',
					isSelected && 'ring-4 ring-primary/60'
				)}
				glowLevel={isHovered ? 2 : 0}
				primaryColor={primaryColor} // Añadir glowLevel basado en isHovered
				secondaryColor={secondaryColor}
			>
				<div className="relative z-10 flex h-full flex-col">
					{/* Header con nombre, duración y calidad */}
					<VideoCardHeader compact={compact} primaryColor={primaryColor} tcgMode={tcgMode} video={video} />

					{/* Thumbnail del video */}
					<VideoCardThumbnail
						compact={compact}
						isHovered={isHovered}
						primaryColor={primaryColor}
						rarityLevel={rarityLevel}
						tcgMode={tcgMode}
						video={video}
					/>

					{/* Contenido con estadísticas y metadatos */}
					{!compact && (
						<VideoCardContent
							primaryColor={primaryColor}
							secondaryColor={secondaryColor}
							tcgMode={tcgMode}
							video={video}
						/>
					)}

					{/* Footer con conteos y stats TCG */}
					<VideoCardFooter
						cardId={cardId}
						compact={compact}
						primaryColor={primaryColor}
						rarityLevel={rarityLevel}
						secondaryColor={secondaryColor}
						tcgMode={tcgMode}
						totalRelations={totalRelations}
						video={video}
					/>
				</div>
			</CardContainer>
		</motion.button>
	);
}

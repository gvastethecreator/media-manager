'use client';

import { cn } from '@/lib/utils';
import type { VideoWithStats } from '@/types/entities/video';
import { motion } from 'motion/react';
import React, { useCallback, useMemo, useState } from 'react';
import { CardContainer } from '../card-container';
import { VideoCardContent } from './video-card-content';
import { VideoCardFooter } from './video-card-footer';
import { VideoCardHeader } from './video-card-header';
import { VideoCardThumbnail } from './video-card-thumbnail';

export interface VideoCardProps {
	video: VideoWithStats;
	onClick?: () => void;
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
	video,
	onClick,
	className,
	style,
	compact = false,
	isSelected = false,
	tcgMode = true,
	disabled = false,
}: VideoCardProps) {
	const [isHovered, setIsHovered] = useState(false);

	// Extraer datos del video
	const {
		id,
		name,
		statistics,
		_count
	} = video;

	// Calcular colores basados en la calidad técnica
	const primaryColor = useMemo(() => {
		const grade = statistics.technicalGrade;
		switch (grade) {
			case 'A': return '#10b981'; // Verde esmeralda - Ultra calidad
			case 'B': return '#3b82f6'; // Azul - Alta calidad
			case 'C': return '#f59e0b'; // Ámbar - Calidad media
			case 'D': return '#ef4444'; // Rojo - Baja calidad
			default: return '#6b7280'; // Gris - Desconocida
		}
	}, [statistics.technicalGrade]);

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
		const score = statistics.qualityScore;
		if (score >= 90) return 10; // Mítico
		if (score >= 80) return 9;  // Legendario
		if (score >= 70) return 7;  // Épico
		if (score >= 60) return 5;  // Raro
		if (score >= 50) return 3;  // Poco común
		return 1; // Común
	}, [statistics.qualityScore]);

	// Manejar eventos
	const handleClick = useCallback(() => {
		if (!disabled && onClick) {
			onClick();
		}
	}, [onClick, disabled]);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick) {
				e.preventDefault();
				onClick();
			}
		},
		[onClick, disabled]
	);

	// ID de carta para TCG
	const cardId = `V${id.substring(0, 6).toUpperCase()}`;

	// Conteos de relaciones
	const totalRelations = statistics.totalRelations;

	return (
		<motion.div
			className={cn(
				'relative group cursor-pointer select-none',
				'transition-all duration-300 ease-out',
				isSelected && 'ring-2 ring-primary ring-offset-2',
				disabled && 'opacity-50 cursor-not-allowed',
				compact ? 'w-40' : 'w-64',
				className
			)}
			style={style}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			whileHover={!disabled ? { y: -4, scale: 1.02 } : {}}
			whileTap={!disabled ? { scale: 0.98 } : {}}
			tabIndex={disabled ? -1 : 0}
			role="button"
			aria-label={`Video: ${name}`}
		>
			<CardContainer
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				rarityLevel={rarityLevel}
				isHovered={isHovered}
				isSelected={isSelected}
				tcgMode={tcgMode}
				compact={compact}
				className="h-full"
			>
				<div className="flex flex-col h-full relative z-10">
					{/* Header con nombre, duración y calidad */}
					<VideoCardHeader
						video={video}
						primaryColor={primaryColor}
						tcgMode={tcgMode}
						compact={compact}
					/>

					{/* Thumbnail del video */}
					<VideoCardThumbnail
						video={video}
						primaryColor={primaryColor}
						rarityLevel={rarityLevel}
						isHovered={isHovered}
						tcgMode={tcgMode}
						compact={compact}
					/>

					{/* Contenido con estadísticas y metadatos */}
					{!compact && (
						<VideoCardContent
							video={video}
							primaryColor={primaryColor}
							secondaryColor={secondaryColor}
							tcgMode={tcgMode}
						/>
					)}

					{/* Footer con conteos y stats TCG */}
					<VideoCardFooter
						video={video}
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						cardId={cardId}
						rarityLevel={rarityLevel}
						totalRelations={totalRelations}
						tcgMode={tcgMode}
						compact={compact}
					/>
				</div>
			</CardContainer>
		</motion.div>
	);
}
'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import { useCallback, useMemo, useState } from 'react';
import { CardContainer } from '../card-container';
import { PlaceCardContent } from './place-card-content';
import { PlaceCardFooter } from './place-card-footer';
import { PlaceCardHeader } from './place-card-header';
import { PlaceCardImages } from './place-card-images';
import type { PlaceCardData } from './place-server-actions';

export interface PlaceCardProps {
	/** Datos del lugar a mostrar */
	place: PlaceCardData;
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
}

/**
 * Componente de tarjeta de lugar inspirado en cartas TCG
 * Muestra información detallada de un lugar con elementos visuales de Trading Card Game
 */
export function PlaceCard({
	place,
	compact = false,
	tcgMode = true,
	disabled = false,
	className,
	onClick,
	isSelected = false,
}: PlaceCardProps) {
	const [isHovered, setIsHovered] = useState(false);

	// Extraer datos del lugar
	const {
		id,
		name,
		emoji = '📍',
		color = '#10b981',
		description,
		region = 'desconocido',
		type = 'desconocido',
		climate = 'templado',
		population = 0,
		government = 'desconocido',
		createdAt,
		updatedAt,
		isFavorite = false,
		_count,
		parsedDangers = [],
		parsedResources = [],
		recentImages = [],
		metadata,
	} = place;

	// Preparar los medios para el componente de galería
	const cardMedia = useMemo(() => {
		const media = [];

		// Añadir imágenes si están disponibles
		if (recentImages?.length) {
			media.push(...recentImages);
		}

		// Añadir videos si están disponibles
		if (place.recentVideos?.length) {
			media.push(...place.recentVideos);
		}

		return media;
	}, [recentImages, place.recentVideos]);

	// Calcular colores para la tarjeta TCG
	const primaryColor = color || '#10b981';
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar color predeterminado basado en el tipo
		if (!color) {
			return type === 'city'
				? '#2563eb'
				: type === 'forest'
					? '#047857'
					: type === 'mountain'
						? '#b91c1c'
						: type === 'desert'
							? '#d97706'
							: '#064e3b';
		}

		// Oscurecer el color primario para el secundario
		try {
			// Convertir hex a RGB
			const r = Number.parseInt(color.slice(1, 3), 16);
			const g = Number.parseInt(color.slice(3, 5), 16);
			const b = Number.parseInt(color.slice(5, 7), 16);

			// Oscurecer los componentes
			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			// Convertir de vuelta a hex
			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (_e) {
			// Si hay algún error, volver al valor por defecto
			return '#064e3b';
		}
	}, [color, type]);

	// Datos de rareza y poder para el diseño TCG
	const rarityLevel = metadata?.rarityLevel || 1;
	const power = metadata?.power || 1;
	const healthPoints = metadata?.healthPoints || 100;
	const valueLevel = metadata?.valueLevel || 1;
	const cardId = metadata?.cardId || `P${id.substring(0, 6)}`;

	// Imágenes y videos para la tarjeta
	const imagesCount = _count?.images || 0;
	const videosCount = _count?.videos || 0;

	// Manejar eventos de teclado para accesibilidad
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick) {
				e.preventDefault();
				onClick();
			}
		},
		[onClick, disabled]
	);

	return (
		<motion.div
			className={cn(
				'w-[300px] md:w-[320px]',
				tcgMode ? 'h-[470px]' : 'h-[400px]',
				compact && 'h-[220px]',
				disabled && 'opacity-70 pointer-events-none',
				className
			)}
			whileHover={!disabled ? { y: -8, transition: { duration: 0.3 } } : {}}
			whileTap={!disabled && onClick ? { scale: 0.98 } : {}}
			onClick={disabled ? undefined : onClick}
			onKeyDown={handleKeyDown}
			tabIndex={disabled || !onClick ? -1 : 0}
			role={onClick ? 'button' : 'article'}
			aria-label={`Lugar: ${name}`}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			<CardContainer
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
				className={cn(
					'transition-all duration-300',
					isHovered && 'scale-[1.02]',
					isSelected && 'ring-4 ring-primary/60'
				)}
			>
				{/* Efectos holográficos especiales para el modo TCG */}
				{tcgMode && (
					<>
						{/* Efecto holográfico de resplandor que se mueve con hover */}
						<div
							className="absolute inset-0 opacity-0 hover:opacity-30 transition-opacity duration-300 pointer-events-none z-1"
							style={{
								backgroundImage: `
									linear-gradient(125deg,
									transparent 0%,
									${primaryColor}30 25%,
									${secondaryColor}30 50%,
									${primaryColor}30 75%,
									transparent 100%)
								`,
								backgroundSize: '200% 200%',
								animation: 'gradient-shift 3s ease infinite',
							}}
						/>

						{/* Efecto holográfico de rareza */}
						<div className="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity duration-300 pointer-events-none z-1">
							<div
								className="absolute inset-0"
								style={{
									background:
										rarityLevel >= 9
											? `linear-gradient(45deg, transparent, ${primaryColor}70, gold, ${primaryColor}70, transparent)`
											: rarityLevel >= 7
												? `linear-gradient(45deg, transparent, ${primaryColor}70, silver, ${primaryColor}70, transparent)`
												: rarityLevel >= 5
													? `linear-gradient(45deg, transparent, ${primaryColor}70, ${secondaryColor}70, transparent)`
													: `linear-gradient(45deg, transparent, ${primaryColor}40, transparent)`,
									backgroundSize: '300% 300%',
									animation: 'shine 6s linear infinite',
								}}
							/>
						</div>

						{/* Sello de valor estratégico en el modo TCG */}
						<div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 opacity-10 pointer-events-none z-1">
							<div
								className="w-full h-full rounded-full border-2 border-dashed flex items-center justify-center"
								style={{ borderColor: primaryColor }}
							>
								<div className="text-xs font-bold" style={{ color: primaryColor }}>
									VALOR
									<br />
									{valueLevel}
								</div>
							</div>
						</div>

						{/* Sello de rareza holográfico cuando es favorito */}
						{isFavorite && (
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
					{/* Cabecera con nombre, emoji, región y tipo */}
					<PlaceCardHeader
						name={name}
						emoji={emoji}
						color={primaryColor}
						region={region}
						type={type}
						climate={climate}
						isFavorite={isFavorite}
						tcgMode={tcgMode}
						compact={compact}
					/>

					{/* En modo compacto solo mostrar header y footer */}
					{!compact && (
						<>
							{/* Galería de imágenes */}
							<PlaceCardImages
								mainImage={cardMedia[0]}
								images={cardMedia}
								primaryColor={primaryColor}
								rarityLevel={rarityLevel}
								tcgMode={tcgMode}
								compact={false}
							/>

							{/* Contenido principal con descripción, recursos y estadísticas */}
							<PlaceCardContent
								description={description || undefined}
								region={region}
								type={type}
								climate={climate}
								population={population}
								government={government}
								parsedResources={parsedResources}
								parsedDangers={parsedDangers}
								parsedStats={place.parsedStats}
								primaryColor={primaryColor}
								tcgMode={tcgMode}
								compact={compact}
							/>

							{/* Pie de carta con conteos y valores TCG */}
							<PlaceCardFooter
								createdAt={createdAt}
								imagesCount={imagesCount}
								videosCount={videosCount}
								primaryColor={primaryColor}
								secondaryColor={secondaryColor}
								power={power}
								healthPoints={healthPoints}
								cardId={cardId}
								tcgMode={tcgMode}
								compact={compact}
							/>
						</>
					)}
				</div>
			</CardContainer>
		</motion.div>
	);
}

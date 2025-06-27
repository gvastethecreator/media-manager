'use client';

import { cn } from '@/lib/utils';
import type { CharacterWithStats } from '@/types/entities/character';
import { motion } from 'motion/react';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { CardContainer } from '../card-container';
import { adaptCharacterWithStats, isCharacterWithStats } from './character-card-adapter';
import { CharacterCardContent } from './character-card-content';
import { CharacterCardFooter } from './character-card-footer';
import { CharacterCardHeader } from './character-card-header';
import { CharacterCardImages } from './character-card-images';
import type { CharacterCardData } from './character-server-actions';

export interface CharacterCardProps {
	/** Datos del personaje a mostrar */
	character: CharacterCardData | CharacterWithStats;
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
 * CharacterCard - Componente de tarjeta para personajes inspirado en el diseño de cartas TCG
 *
 * Este componente muestra información detallada de un personaje en un formato
 * inspirado en cartas TCG (Trading Card Game), con múltiples secciones que muestran datos
 * y miniaturas de las imágenes contenidas.
 */
export function CharacterCard({
	character: rawCharacter,
	compact = false,
	tcgMode = true,
	disabled = false,
	className,
	onClick,
	isSelected = false,
}: CharacterCardProps) {
	const [isHovered, setIsHovered] = useState(false);

	// Adaptar el personaje al formato esperado si es necesario
	const character = useMemo(() => {
		// Si es CharacterWithStats, adaptarlo a CharacterCardData
		if (isCharacterWithStats(rawCharacter)) {
			return adaptCharacterWithStats(rawCharacter);
		}
		// Si ya es CharacterCardData, usar tal como está
		return rawCharacter as CharacterCardData;
	}, [rawCharacter]);

	// Preparar las imágenes para el componente de galería
	const cardMedia = useMemo(() => {
		const media = [];

		// Añadir imágenes si están disponibles (CharacterCardData)
		if ('recentImages' in character && character.recentImages?.length) {
			media.push(
				...character.recentImages.map((path) => ({
					id: path,
					thumbnailUrl: path,
					isVideo: false,
				}))
			);
		}

		// Añadir videos si están disponibles (CharacterCardData)
		if ('recentVideos' in character && character.recentVideos?.length) {
			media.push(
				...character.recentVideos.map((path) => ({
					id: path,
					thumbnailUrl: path,
					isVideo: true,
				}))
			);
		}

		return media;
	}, [character]);

	// Preparar etiquetas para el pie de la tarjeta
	const footerTags = useMemo(() => {
		const tags = [];

		// Añadir clase y raza si están disponibles
		if (character.class) tags.push(character.class);
		if (character.race) tags.push(character.race);

		// Añadir nivel si está disponible
		if (character.level) tags.push(`Lvl ${character.level}`);

		// Añadir alineamiento si está disponible
		if (character.alignment) tags.push(character.alignment);

		// Añadir habilidades del personaje (solo para CharacterCardData)
		if ('parsedAbilities' in character && character.parsedAbilities?.length) {
			// Solo las primeras 2 habilidades para no sobrecargar la tarjeta
			tags.push(...character.parsedAbilities.slice(0, 2));
		}

		return tags;
	}, [character.class, character.race, character.level, character.alignment]);

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

	// Calcular colores para la tarjeta TCG
	const primaryColor = useMemo(() => character.color || '#8e44ad', [character.color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar color predeterminado basado en la clase
		if (!character.color) {
			return character.class === 'Warrior'
				? '#c0392b'
				: character.class === 'Mage'
					? '#2980b9'
					: character.class === 'Rogue'
						? '#27ae60'
						: '#8e44ad';
		}

		// Oscurecer el color primario para el secundario
		try {
			// Convertir hex a RGB
			const r = Number.parseInt(character.color.slice(1, 3), 16);
			const g = Number.parseInt(character.color.slice(3, 5), 16);
			const b = Number.parseInt(character.color.slice(5, 7), 16);

			// Oscurecer los componentes
			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			// Convertir de vuelta a hex
			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (_e) {
			// Si hay algún error, volver al valor por defecto
			return '#6d28d9';
		}
	}, [character.color, character.class]);

	// Determinar rareza y poder para el diseño TCG
	const rarityLevel = character.metadata?.rarityLevel || 'Common';
	const power = character.metadata?.power || character.level * 10;
	const cardId = character.metadata?.cardId || `C${character.id.substring(0, 6)}-${character.level}`;
	const healthPoints = character.metadata?.healthPoints || 100;
	const manaPoints = character.metadata?.manaPoints || 50;

	const rarityMap: Record<string, number> = {
		Common: 1,
		Uncommon: 2,
		Rare: 3,
		Mythic: 4,
	};
	const numericRarityLevel = rarityMap[rarityLevel] || 1;

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
			aria-label={`Character: ${character.name}`}
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
										rarityLevel === 'Mythic'
											? `linear-gradient(45deg, transparent, ${primaryColor}70, gold, ${primaryColor}70, transparent)`
											: rarityLevel === 'Rare'
												? `linear-gradient(45deg, transparent, ${primaryColor}70, silver, ${primaryColor}70, transparent)`
												: rarityLevel === 'Uncommon'
													? `linear-gradient(45deg, transparent, ${primaryColor}70, ${secondaryColor}70, transparent)`
													: `linear-gradient(45deg, transparent, ${primaryColor}40, transparent)`,
									backgroundSize: '300% 300%',
									animation: 'shine 6s linear infinite',
								}}
							/>
						</div>

						{/* Sello de poder en el modo TCG */}
						<div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 opacity-10 pointer-events-none z-1">
							<div
								className="w-full h-full rounded-full border-2 border-dashed flex items-center justify-center"
								style={{ borderColor: primaryColor }}
							>
								<div className="text-xs font-bold" style={{ color: primaryColor }}>
									POWER
									<br />
									{power}
								</div>
							</div>
						</div>

						{/* Sello de rareza holográfico cuando es favorito */}
						{character.isFavorite && (
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
					{/* Cabecera con nombre, emoji, color y categoría */}
					<CharacterCardHeader
						name={character.name || 'Sin nombre'}
						emoji={character.emoji}
						color={primaryColor}
						isFavorite={character.isFavorite || false}
						class={character.class}
						level={character.level}
						race={character.race}
						tcgMode={tcgMode}
						compact={compact}
					/>

					{/* En modo compacto solo mostrar header y footer */}
					{!compact && (
						<>
							{/* Galería de imágenes */}
							<CharacterCardImages
								images={cardMedia.map((m) => m.thumbnailUrl)}
								emoji={character.emoji}
								tcgMode={tcgMode}
								compact={false}
							/>

							{/* Contenido con descripción y contadores */}
							<CharacterCardContent
								description={character.description || ''}
								stats={character.parsedStats}
								abilities={character.parsedAbilities}
								backstory={character.backstory}
								alignment={character.alignment}
								primaryColor={primaryColor}
								secondaryColor={secondaryColor}
								healthPoints={healthPoints}
								manaPoints={manaPoints}
								tcgMode={tcgMode}
							/>
						</>
					)}

					{/* Pie con etiquetas y metadatos */}
					<CharacterCardFooter
						tags={footerTags}
						cardId={cardId}
						rarityLevel={numericRarityLevel}
						primaryColor={primaryColor}
						secondaryColor={secondaryColor}
						level={character.level}
						compact={compact}
					/>
				</div>
			</CardContainer>
		</motion.div>
	);
}

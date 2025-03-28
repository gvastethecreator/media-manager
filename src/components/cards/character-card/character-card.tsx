'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { CharacterCardContent } from './character-card-content';
import { CharacterCardFooter } from './character-card-footer';
import { CharacterCardHeader } from './character-card-header';
import { CharacterCardImages } from './character-card-images';

// Importar tipos de Prisma desde types/entities
import type { Character } from '@/types/entities/characters';

export interface CharacterCardProps {
	character: Character & {
		_count?: {
			images: number;
		};
		imageCount?: number;
	};
	onClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
}

/**
 * CharacterCard - Componente de tarjeta para personajes inspirado en el diseño de cartas Magic
 *
 * Este componente muestra información detallada de un personaje en un formato
 * inspirado en cartas Magic, con múltiples secciones que muestran datos
 * y miniaturas de las imágenes contenidas.
 */
export function CharacterCard({ character, onClick, className, style }: CharacterCardProps) {
	// Calcular valores derivados
	const imagesCount = character._count?.images || character.imageCount || 0;

	// Calcular color primario y secundario
	const primaryColor = useMemo(() => character.color || '#f59e0b', [character.color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto
		if (!character.color) return '#d97706';

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
		} catch (e) {
			// Si hay algún error, volver al valor por defecto
			return '#d97706';
		}
	}, [character.color]);

	// Manejar eventos de teclado para accesibilidad
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (onClick && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onClick();
			}
		},
		[onClick]
	);

	// Parsear stats si es un string
	const characterStats = useMemo(() => {
		if (typeof character.stats === 'string' && character.stats) {
			try {
				return JSON.parse(character.stats);
			} catch (e) {
				return {};
			}
		}
		return character.stats || {};
	}, [character.stats]);

	// Definir estilos de la tarjeta
	const cardStyle = useMemo(
		() => ({
			// Borde basado en el color primario
			borderColor: primaryColor,
			// Fondo con gradiente sutil basado en el color primario
			background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
			...style,
		}),
		[primaryColor, style]
	);

	// Render del componente
	return (
		<motion.div
			className={cn(
				// Base
				'relative bg-card',
				'w-[300px] h-[420px] rounded-[4.75%] overflow-hidden',
				'border-2 shadow-md',
				// Interacción
				'transition-all duration-300 ease-out',
				'hover:shadow-lg hover:scale-[1.02]',
				'active:scale-[0.98]',
				// Cursor
				onClick ? 'cursor-pointer' : '',
				// Clase personalizada
				className
			)}
			whileHover={{ y: -5 }}
			whileTap={{ scale: 0.98 }}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			tabIndex={onClick ? 0 : -1}
			role={onClick ? 'button' : 'article'}
			aria-label={`Personaje: ${character.name}`}
			data-character-id={character.id}
			style={cardStyle}
		>
			{/* Resplandor de borde en hover */}
			<div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
				<div
					className="absolute inset-0 rounded-[4.75%] blur-sm -z-10"
					style={{ boxShadow: `0 0 15px 2px ${primaryColor}` }}
				/>
			</div>

			{/* Contenido estructurado de la tarjeta */}

			{/* Encabezado de la tarjeta */}
			<CharacterCardHeader
				name={character.name}
				emoji={character.emoji}
				color={primaryColor}
				level={character.level}
				class={character.class}
				race={character.race}
			/>

			{/* Sección de imágenes */}
			<CharacterCardImages
				characterId={character.id}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			/>

			{/* Contenido principal */}
			<CharacterCardContent
				description={character.description}
				alignment={character.alignment}
				primaryColor={primaryColor}
				stats={character.stats}
			/>

			{/* Pie de la tarjeta */}
			<CharacterCardFooter
				createdAt={character.createdAt}
				updatedAt={character.updatedAt}
				imagesCount={imagesCount}
				isFavorite={character.isFavorite}
				category={character.category}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			/>
		</motion.div>
	);
}
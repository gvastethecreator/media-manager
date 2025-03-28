'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { TagCardContent } from './tag-card-content';
import { TagCardFooter } from './tag-card-footer';
import { TagCardHeader } from './tag-card-header';
import { TagCardImages } from './tag-card-images';

// Importar tipos desde types/entities
import type { Tag } from '@/types/entities/tags';

export interface TagCardProps {
	tag: Tag & {
		_count?: {
			images?: number;
		};
	};
	onClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
}

/**
 * TagCard - Componente de tarjeta para etiquetas inspirado en el diseño de cartas Magic
 *
 * Este componente muestra información detallada de una etiqueta en un formato
 * inspirado en cartas Magic, con múltiples secciones que muestran datos
 * y miniaturas de las imágenes asociadas.
 */
export function TagCard({ tag, onClick, className, style }: TagCardProps) {
	// Calcular valores derivados
	const imagesCount = tag._count?.images || 0;

	// Calcular color primario y secundario
	const primaryColor = useMemo(() => tag.color || '#ec4899', [tag.color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto
		if (!tag.color) return '#be185d';

		// Oscurecer el color primario para el secundario
		try {
			// Convertir hex a RGB
			const r = Number.parseInt(tag.color.slice(1, 3), 16);
			const g = Number.parseInt(tag.color.slice(3, 5), 16);
			const b = Number.parseInt(tag.color.slice(5, 7), 16);

			// Oscurecer los componentes
			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			// Convertir de vuelta a hex
			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (e) {
			// Si hay algún error, volver al valor por defecto
			return '#be185d';
		}
	}, [tag.color]);

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
			aria-label={`Etiqueta: ${tag.name}`}
			data-tag-id={tag.id}
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
			<div className="flex flex-col h-full">
				{/* Encabezado de la tarjeta */}
				<TagCardHeader
					name={tag.name}
					emoji={tag.emoji}
					color={primaryColor}
					category={tag.category}
					rarity={tag.rarity}
				/>

				{/* Sección de imágenes */}
				<TagCardImages
					tagId={tag.id}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
				/>

				{/* Contenido principal */}
				<TagCardContent
					description={tag.description}
					shortcut={tag.shortcut}
					primaryColor={primaryColor}
				/>

				{/* Pie de la tarjeta */}
				<TagCardFooter
					createdAt={tag.createdAt}
					updatedAt={tag.updatedAt}
					imagesCount={imagesCount}
					texture={tag.texture}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
					isFavorite={tag.isFavorite}
				/>
			</div>
		</motion.div>
	);
}
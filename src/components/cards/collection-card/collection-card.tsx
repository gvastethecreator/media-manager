'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { CollectionCardContent } from './collection-card-content';
import { CollectionCardFooter } from './collection-card-footer';
import { CollectionCardHeader } from './collection-card-header';
import { CollectionCardImages } from './collection-card-images';

// Importar tipos de Prisma desde types/entities
import type { Collection } from '@/types/entities/collections';

export interface CollectionCardProps {
	collection: Collection & {
		_count?: {
			images?: number;
		};
	};
	onClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
}

/**
 * CollectionCard - Componente de tarjeta para colecciones inspirado en el diseño de cartas Magic
 *
 * Este componente muestra información detallada de una colección en un formato
 * inspirado en cartas Magic, con múltiples secciones que muestran datos
 * y miniaturas de las imágenes contenidas.
 */
export function CollectionCard({ collection, onClick, className, style }: CollectionCardProps) {
	// Calcular valores derivados
	const imagesCount = collection._count?.images || 0;

	// Calcular color primario y secundario
	const primaryColor = useMemo(() => collection.color || '#10b981', [collection.color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto
		if (!collection.color) return '#059669';

		// Oscurecer el color primario para el secundario
		try {
			// Convertir hex a RGB
			const r = Number.parseInt(collection.color.slice(1, 3), 16);
			const g = Number.parseInt(collection.color.slice(3, 5), 16);
			const b = Number.parseInt(collection.color.slice(5, 7), 16);

			// Oscurecer los componentes
			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			// Convertir de vuelta a hex
			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (e) {
			// Si hay algún error, volver al valor por defecto
			return '#059669';
		}
	}, [collection.color]);

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
			aria-label={`Colección: ${collection.name}`}
			data-collection-id={collection.id}
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
				<CollectionCardHeader
					name={collection.name}
					emoji={collection.emoji}
					color={primaryColor}
					category={collection.category}
					rarity={collection.rarity}
				/>

				{/* Sección de imágenes */}
				<CollectionCardImages
					collectionId={collection.id}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
				/>

				{/* Contenido principal */}
				<CollectionCardContent
					description={collection.description}
					platform={collection.platform}
					price={collection.price}
					editions={collection.editions}
					primaryColor={primaryColor}
				/>

				{/* Pie de la tarjeta */}
				<CollectionCardFooter
					createdAt={collection.createdAt}
					updatedAt={collection.updatedAt}
					imagesCount={imagesCount}
					texture={collection.texture}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
					isFavorite={collection.isFavorite}
				/>
			</div>
		</motion.div>
	);
}
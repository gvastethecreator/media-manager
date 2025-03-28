'use client';

import { cn } from '@/lib/utils';
import type { WorldItem } from '@/types/entities/world-items';
import { BookType, Box, GemIcon, StoreIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useMemo } from 'react';
import { CardHeader } from '../card-header';
import { WorldItemCardContent } from './world-item-card-content';
import { WorldItemCardFooter } from './world-item-card-footer';
import { WorldItemCardImages } from './world-item-card-images';

interface WorldItemCardProps {
	worldItem: WorldItem & {
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
 * Card para mostrar un objeto del mundo, con un diseño inspirado en cartas de Magic.
 */
export function WorldItemCard({ worldItem, onClick, className, style }: WorldItemCardProps) {
	// Calcular valores derivados
	const imagesCount = worldItem._count?.images || worldItem.imageCount || 0;

	// Colores para el gradiente y el icono - derivados del tipo de objeto
	const { primaryColor, secondaryColor, icon } = useMemo(() => {
		const color = worldItem.color || '#4F46E5';

		// Colores según el tipo de objeto o usar el color personalizado
		switch (worldItem.type?.toUpperCase()) {
			case 'ARTIFACT':
				return {
					primaryColor: worldItem.color || '#ad5389',
					secondaryColor: darkenColor(worldItem.color) || '#3c1053',
					icon: <GemIcon className="w-4 h-4" />,
				};
			case 'BOOK':
				return {
					primaryColor: worldItem.color || '#007991',
					secondaryColor: darkenColor(worldItem.color) || '#78ffd6',
					icon: <BookType className="w-4 h-4" />,
				};
			case 'CONSUMABLE':
				return {
					primaryColor: worldItem.color || '#659999',
					secondaryColor: darkenColor(worldItem.color) || '#f4791f',
					icon: <StoreIcon className="w-4 h-4" />,
				};
			default:
				return {
					primaryColor: worldItem.color || '#0f0c29',
					secondaryColor: darkenColor(worldItem.color) || '#302b63',
					icon: <Box className="w-4 h-4" />,
				};
		}
	}, [worldItem.color, worldItem.type]);

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

	// Parsear propiedades si es un string
	const properties = useMemo(() => {
		if (typeof worldItem.properties === 'string' && worldItem.properties) {
			try {
				return JSON.parse(worldItem.properties);
			} catch (e) {
				return [];
			}
		}
		return worldItem.properties || [];
	}, [worldItem.properties]);

	// Parsear requerimientos si es un string
	const requirements = useMemo(() => {
		if (typeof worldItem.requirements === 'string' && worldItem.requirements) {
			try {
				return JSON.parse(worldItem.requirements);
			} catch (e) {
				return {};
			}
		}
		return worldItem.requirements || {};
	}, [worldItem.requirements]);

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
			aria-label={`Objeto: ${worldItem.name}`}
			data-world-item-id={worldItem.id}
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
			<CardHeader
				title={worldItem.name}
				subtitle={worldItem.type || 'Objeto'}
				icon={icon}
				primaryColor={primaryColor}
			/>

			{/* Sección de imágenes */}
			<WorldItemCardImages
				worldItemId={worldItem.id}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			/>

			{/* Contenido principal */}
			<WorldItemCardContent
				description={worldItem.description}
				properties={worldItem.properties}
				requirements={worldItem.requirements}
				origin={worldItem.origin}
				rarity={worldItem.rarity}
				primaryColor={primaryColor}
			/>

			{/* Pie de la tarjeta */}
			<WorldItemCardFooter
				createdAt={worldItem.createdAt}
				updatedAt={worldItem.updatedAt}
				imagesCount={imagesCount}
				isFavorite={worldItem.isFavorite}
				category={worldItem.category}
				type={worldItem.type}
				primaryColor={primaryColor}
				secondaryColor={secondaryColor}
			/>
		</motion.div>
	);
}

// Función utilitaria para oscurecer un color
function darkenColor(color?: string | null): string | null {
	if (!color) return null;

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
	} catch (e) {
		// Si hay algún error, volver al valor por defecto
		return null;
	}
}
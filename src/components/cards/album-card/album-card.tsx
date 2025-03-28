'use client';

import { cn } from '@/lib/utils';
import { motion } from 'motion/react';
import type React from 'react';
import { useCallback, useMemo } from 'react';
import { AlbumCardContent } from './album-card-content';
import { AlbumCardFooter } from './album-card-footer';
import { AlbumCardHeader } from './album-card-header';
import { AlbumCardImages } from './album-card-images';

// Importar tipos de Prisma desde types/entities
import type { Album } from '@/types/entities/albums';

export interface AlbumCardProps {
	album: Album & {
		_count?: {
			images: number;
		};
	};
	onClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
}

/**
 * AlbumCard - Componente de tarjeta para álbumes inspirado en el diseño de cartas Magic
 *
 * Este componente muestra información detallada de un álbum en un formato
 * inspirado en cartas Magic, con múltiples secciones que muestran datos
 * y miniaturas de las imágenes contenidas.
 */
export function AlbumCard({ album, onClick, className, style }: AlbumCardProps) {
	// Calcular valores derivados
	const imagesCount = album._count?.images || 0;

	// Calcular color primario y secundario
	const primaryColor = useMemo(() => album.color || '#8b5cf6', [album.color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto
		if (!album.color) return '#6d28d9';

		// Oscurecer el color primario para el secundario
		try {
			// Convertir hex a RGB
			const r = Number.parseInt(album.color.slice(1, 3), 16);
			const g = Number.parseInt(album.color.slice(3, 5), 16);
			const b = Number.parseInt(album.color.slice(5, 7), 16);

			// Oscurecer los componentes
			const darkenFactor = 0.7;
			const darkerR = Math.floor(r * darkenFactor);
			const darkerG = Math.floor(g * darkenFactor);
			const darkerB = Math.floor(b * darkenFactor);

			// Convertir de vuelta a hex
			return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
		} catch (e) {
			// Si hay algún error, volver al valor por defecto
			return '#6d28d9';
		}
	}, [album.color]);

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
			aria-label={`Álbum: ${album.name}`}
			data-album-id={album.id}
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
				<AlbumCardHeader
					name={album.name}
					emoji={album.emoji}
					color={primaryColor}
					category={album.category}
					rarity={album.rarity}
				/>

				{/* Sección de imágenes */}
				<AlbumCardImages
					albumId={album.id}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
				/>

				{/* Contenido principal */}
				<AlbumCardContent
					description={album.description}
					sortBy={album.sortBy}
					filters={album.filters}
					primaryColor={primaryColor}
				/>

				{/* Pie de la tarjeta */}
				<AlbumCardFooter
					createdAt={album.createdAt}
					updatedAt={album.updatedAt}
					imagesCount={imagesCount}
					texture={album.texture}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
				/>
			</div>
		</motion.div>
	);
}
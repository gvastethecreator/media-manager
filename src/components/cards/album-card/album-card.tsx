import { cn } from '@/lib/utils';
import type { AlbumWithStats } from '@/types/entities/album';
import { motion } from 'motion/react';
import React, { useCallback, useMemo } from 'react';
import { AlbumCardContent } from './album-card-content';
import { AlbumCardFooter } from './album-card-footer';
import { AlbumCardHeader } from './album-card-header';
import { AlbumCardImages } from './album-card-images';

export interface AlbumCardProps {
	album: AlbumWithStats & {
		recentImages?: string[];
		recentVideos?: string[];
		totalSize?: number;
		metadata?: {
			itemCount?: number;
			imageCount?: number;
			videoCount?: number;
			coverImageUrl?: string;
			thumbnailUrls?: string[];
			lastModified?: Date | string;
		};
		viewConfig?: {
			theme?: string;
			layout?: string;
			thumbnailSize?: 'small' | 'medium' | 'large';
		};
	};
	onClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
	compact?: boolean;
	isSelected?: boolean;
	tcgMode?: boolean;
}

/**
 * AlbumCard - Componente de tarjeta para álbumes inspirado en el diseño de cartas TCG
 *
 * Este componente muestra información detallada de un álbum en un formato
 * inspirado en cartas de juegos como Magic/Yu-Gi-Oh/Pokémon, con múltiples
 * secciones que muestran datos y miniaturas de las imágenes contenidas.
 */
export function AlbumCard({
	album,
	onClick,
	className,
	style,
	compact = false,
	isSelected = false,
	tcgMode = false,
}: AlbumCardProps) {
	// Calcular valores derivados - usar stats en lugar de _count
	const imagesCount = album.stats?.imageCount || 0;
	const videosCount = album.stats?.videoCount || 0;
	const totalMedia = imagesCount + videosCount;

	// Calcular total de entidades relacionadas - usar stats en lugar de _count
	const totalEntities =
		(album.stats?.collectionCount || 0) +
		(album.stats?.tagCount || 0) +
		(album.stats?.characterCount || 0) +
		(album.stats?.placeCount || 0) +
		(album.stats?.worldItemCount || 0) +
		(album.stats?.conceptCount || 0) +
		(album.stats?.promptCount || 0) +
		(album.stats?.noteCount || 0) +
		(album.stats?.wildcardCount || 0) +
		(album.stats?.propertyCount || 0) +
		(album.stats?.groupCount || 0);

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
		} catch (_e) {
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

	// Parsear los filtros si están almacenados como JSON string
	const _filters = useMemo(() => {
		if (typeof album.filters === 'string' && album.filters !== 'empty_array') {
			try {
				return JSON.parse(album.filters);
			} catch (_e) {
				return [];
			}
		}
		return album.filters || [];
	}, [album.filters]);

	// Definir estilos de la tarjeta TCG
	const cardStyle = useMemo(
		() => ({
			// Borde basado en el color primario
			borderColor: `${primaryColor}`,
			// Fondo con gradiente más pronunciado tipo TCG
			background: compact
				? `linear-gradient(135deg, ${primaryColor}20, ${primaryColor}10)`
				: `linear-gradient(135deg, ${primaryColor}40, ${secondaryColor}50, ${primaryColor}30)`,
			...style,
		}),
		[primaryColor, secondaryColor, compact, style]
	);

	// Estilos para el resplandor de la carta
	const glowStyle = useMemo(
		() => ({
			boxShadow: `0 0 20px 5px ${primaryColor}80`,
		}),
		[primaryColor]
	);

	// Generar un "ID" de carta estilo TCG
	const cardId = useMemo(() => {
		// Tomar los primeros 8 caracteres del ID real
		const id = album.id.substring(0, 8);
		// Combinar con la cantidad de imágenes para crear un "número de serie" de la carta
		return `${id}-${totalMedia}`;
	}, [album.id, totalMedia]);

	// Calcular nivel de rareza basado en la cantidad total de media y entidades
	const rarityLevel = useMemo(() => {
		const total = totalMedia + totalEntities;
		if (total > 200) return 'Mítica';
		if (total > 100) return 'Rara';
		if (total > 50) return 'Poco común';
		return 'Común';
	}, [totalMedia, totalEntities]);

	// Render del componente
	return (
		<motion.div
			className={cn(
				// Base
				'relative bg-card',
				'w-[300px] rounded-[4.75%] overflow-hidden',
				compact ? 'h-[220px]' : 'h-[420px]',
				'border-2 shadow-md',
				// Textura y efectos
				'after:content-[""] after:absolute after:inset-0 after:bg-noise-subtle after:opacity-30 after:pointer-events-none after:z-10',
				// Interacción
				'transition-all duration-300 ease-out',
				tcgMode ? 'hover:shadow-lg hover:scale-[1.02]' : '',
				tcgMode ? 'active:scale-[0.98]' : '',
				// Estado seleccionado
				isSelected && 'ring-4 ring-primary/60',
				// Cursor
				onClick ? 'cursor-pointer' : '',
				// Clase personalizada
				className
			)}
			whileHover={tcgMode ? { y: -8, transition: { duration: 0.3 } } : undefined}
			whileTap={tcgMode ? { scale: 0.98 } : undefined}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			tabIndex={onClick ? 0 : -1}
			role={onClick ? 'button' : 'article'}
			aria-label={`Álbum: ${album.name}`}
			data-album-id={album.id}
			style={cardStyle}
		>
			{/* Resplandor de borde en hover - solo visible en modo TCG */}
			{tcgMode && (
				<div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none">
					<div className="absolute inset-0 rounded-[4.75%] blur-md -z-10" style={glowStyle} />
				</div>
			)}

			{/* Textura holográfica tipo TCG mejorada - solo visible en modo TCG */}
			{tcgMode && (
				<>
					<div className="absolute inset-0 bg-noise-subtle opacity-5 mix-blend-overlay pointer-events-none z-1" />
					<div
						className="absolute inset-0 bg-gradient-to-br opacity-10 pointer-events-none z-1 hover:opacity-20 transition-opacity duration-300"
						style={{ background: `linear-gradient(45deg, transparent 25%, ${primaryColor}50 50%, transparent 75%)` }}
					/>

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
				</>
			)}

			{/* Marco interior tipo TCG - solo visible en modo TCG */}
			{tcgMode && <div className="absolute inset-2 rounded-[4%] border border-white/20 pointer-events-none z-0" />}

			{/* Esquinas y marcos decorativos estilo TCG - solo visibles en modo TCG */}
			{tcgMode && (
				<>
					<div
						className="absolute top-1 left-1 w-5 h-5 border-t-2 border-l-2 rounded-tl-md z-20"
						style={{ borderColor: `${primaryColor}` }}
					/>
					<div
						className="absolute top-1 right-1 w-5 h-5 border-t-2 border-r-2 rounded-tr-md z-20"
						style={{ borderColor: `${primaryColor}` }}
					/>
					<div
						className="absolute bottom-1 left-1 w-5 h-5 border-b-2 border-l-2 rounded-bl-md z-20"
						style={{ borderColor: `${primaryColor}` }}
					/>
					<div
						className="absolute bottom-1 right-1 w-5 h-5 border-b-2 border-r-2 rounded-br-md z-20"
						style={{ borderColor: `${primaryColor}` }}
					/>

					{/* Ornamentos decorativos en las esquinas */}
					<div
						className="absolute top-3 left-3 w-3 h-3 rounded-full z-20 opacity-70"
						style={{ backgroundColor: `${primaryColor}` }}
					/>
					<div
						className="absolute top-3 right-3 w-3 h-3 rounded-full z-20 opacity-70"
						style={{ backgroundColor: `${primaryColor}` }}
					/>
					<div
						className="absolute bottom-3 left-3 w-3 h-3 rounded-full z-20 opacity-70"
						style={{ backgroundColor: `${primaryColor}` }}
					/>
					<div
						className="absolute bottom-3 right-3 w-3 h-3 rounded-full z-20 opacity-70"
						style={{ backgroundColor: `${primaryColor}` }}
					/>
				</>
			)}

			{/* Estructura de la tarjeta */}
			<div className="flex flex-col h-full z-10 relative">
				{/* Cabecera con nombre, emoji e info básica */}
				<AlbumCardHeader album={album} compact={compact} primaryColor={primaryColor} />

				{/* Contenido principal: imágenes, contadores y stats */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Imágenes del álbum */}
					<AlbumCardImages
						recentImages={album.recentImages || []}
						recentVideos={album.recentVideos || []}
						compact={compact}
						className="flex-1"
					/>

					{/* Mostrar contenido solo si no está en modo compacto */}
					{!compact && (
						<AlbumCardContent
							imagesCount={imagesCount}
							videosCount={videosCount}
							album={album}
							primaryColor={primaryColor}
							tcgMode={tcgMode}
						/>
					)}
				</div>

				{/* Footer con stats adicionales, etiquetas e ID de la carta */}
				{!compact && (
					<AlbumCardFooter
						album={album}
						totalEntities={totalEntities}
						cardId={cardId}
						rarityLevel={rarityLevel}
						tcgMode={tcgMode}
						primaryColor={primaryColor}
					/>
				)}
			</div>
		</motion.div>
	);
}

// Exportar también un componente memorizado para mejorar rendimiento
export const MemoizedAlbumCard = React.memo(AlbumCard);

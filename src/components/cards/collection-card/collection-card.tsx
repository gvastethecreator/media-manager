import React, { useCallback, useMemo } from 'react';
import { motion } from '@/components/ui/animejs-shim';
import { cn } from '@/lib/utils';
// Importar tipos correctos de entities
import type { CollectionWithStats } from '@/types/entities/collection';
import { CollectionCardContent } from './collection-card-content';
import { CollectionCardFooter } from './collection-card-footer';
import { CollectionCardHeader } from './collection-card-header';
import { CollectionCardImages } from './collection-card-images';

export interface CollectionCardProps {
	collection: CollectionWithStats;
	onClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
	compact?: boolean;
	showEntitiesCount?: boolean;
	showImagesCount?: boolean;
}

/**
 * CollectionCard - Componente de tarjeta para colecciones inspirado en el diseño de cartas TCG
 *
 * Este componente muestra información detallada de una colección en un formato
 * inspirado en cartas de juegos como Magic/Yu-Gi-Oh/Pokémon, con múltiples
 * secciones que muestran datos y miniaturas de las imágenes contenidas.
 *
 * ✅ OPTIMIZADO: Ya tiene MemoizedCollectionCard export
 */
export function CollectionCard({
	collection,
	onClick,
	className,
	style,
	compact = false,
	showEntitiesCount = true,
	showImagesCount = true,
}: CollectionCardProps) {
	const stats = collection.stats || {};
	const {
		imageCount = 0,
		videoCount = 0,
		albumCount = 0,
		tagCount = 0,
		characterCount = 0,
		placeCount = 0,
		worldItemCount = 0,
		conceptCount = 0,
		promptCount = 0,
		noteCount = 0,
		wildcardCount = 0,
		propertyCount = 0,
		groupCount = 0,
	} = stats;

	const totalMedia = imageCount + videoCount;
	const totalEntities =
		albumCount +
		tagCount +
		characterCount +
		placeCount +
		worldItemCount +
		conceptCount +
		promptCount +
		noteCount +
		wildcardCount +
		propertyCount +
		groupCount;

	// Calcular color primario y secundario
	const primaryColor = useMemo(() => collection.color || 'var(--entity-collection)', [collection.color]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto (cyan de colecciones)
		if (!collection.color) {
			return 'oklch(0.63 0.2 195)';
		}

		return `color-mix(in oklab, ${primaryColor}, black 20%)`;
	}, [collection.color, primaryColor]);

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

	// Definir estilos de la tarjeta TCG
	const cardStyle = useMemo(
		() => ({
			// Borde basado en el color primario
			borderColor: `${primaryColor}`,
			// Fondo con gradiente más pronunciado tipo TCG
			background: compact
				? `linear-gradient(135deg, color-mix(in oklab, ${primaryColor}, transparent 80%), color-mix(in oklab, ${primaryColor}, transparent 90%))`
				: `linear-gradient(135deg, color-mix(in oklab, ${primaryColor}, transparent 60%), color-mix(in oklab, ${secondaryColor}, transparent 50%), color-mix(in oklab, ${primaryColor}, transparent 70%))`,
			...style,
		}),
		[primaryColor, secondaryColor, compact, style]
	);

	// Estilos para el resplandor de la carta
	const glowStyle = useMemo(
		() => ({
			boxShadow: `0 0 20px 5px color-mix(in oklab, ${primaryColor}, transparent 20%)`,
		}),
		[primaryColor]
	);

	// Render del componente
	return (
		<motion.div
			aria-label={`Colección: ${collection.name}`}
			className={cn(
				// Base
				'relative bg-card',
				'w-[300px] overflow-hidden rounded-[4.75%]',
				compact ? 'h-[220px]' : 'h-[420px]',
				'border-2 shadow-md',
				// Textura y efectos
				'after:pointer-events-none after:absolute after:inset-0 after:z-10 after:bg-noise-subtle after:opacity-30 after:content-[""]',
				// Interacción
				'transition-all duration-300 ease-out',
				'hover:scale-[1.02] hover:shadow-lg',
				'active:scale-[0.98]',
				// Cursor
				onClick ? 'cursor-pointer' : '',
				// Clase personalizada
				className
			)}
			data-collection-id={collection.id}
			onClick={onClick}
			onKeyDown={handleKeyDown}
			role={onClick ? 'button' : 'article'}
			style={cardStyle}
			tabIndex={onClick ? 0 : -1}
			whileHover={{ y: -8, transition: { duration: 0.3 } }}
			whileTap={{ scale: 0.98 }}
		>
			{/* Resplandor de borde en hover */}
			<div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-100">
				<div className="absolute inset-0 -z-10 rounded-[4.75%] blur-md" style={glowStyle} />
			</div>

			{/* Textura holográfica tipo TCG */}
			<div className="pointer-events-none absolute inset-0 z-1 bg-noise-subtle opacity-5 mix-blend-overlay" />
			<div
				className="pointer-events-none absolute inset-0 z-1 bg-gradient-to-br opacity-10 transition-opacity duration-300 hover:opacity-20"
				style={{
					background: `linear-gradient(45deg, transparent 25%, color-mix(in oklab, ${primaryColor}, transparent 50%) 50%, transparent 75%)`,
				}}
			/>

			{/* Marco interior tipo TCG */}
			<div className="pointer-events-none absolute inset-2 z-0 rounded-[4%] border border-border/60" />

			{/* Esquinas y marcos decorativos estilo TCG */}
			<div
				className="absolute top-1 left-1 z-20 h-5 w-5 rounded-tl-md border-t-2 border-l-2"
				style={{ borderColor: primaryColor }}
			/>
			<div
				className="absolute top-1 right-1 z-20 h-5 w-5 rounded-tr-md border-t-2 border-r-2"
				style={{ borderColor: primaryColor }}
			/>
			<div
				className="absolute bottom-1 left-1 z-20 h-5 w-5 rounded-bl-md border-b-2 border-l-2"
				style={{ borderColor: primaryColor }}
			/>
			<div
				className="absolute right-1 bottom-1 z-20 h-5 w-5 rounded-br-md border-r-2 border-b-2"
				style={{ borderColor: primaryColor }}
			/>

			{/* Ornamentos decorativos en las esquinas */}
			<div
				className="absolute top-3 left-3 z-20 h-4 w-4 rounded-full opacity-70"
				style={{ backgroundColor: primaryColor }}
			/>
			<div
				className="absolute top-3 right-3 z-20 h-4 w-4 rounded-full opacity-70"
				style={{ backgroundColor: primaryColor }}
			/>
			<div
				className="absolute bottom-3 left-3 z-20 h-4 w-4 rounded-full opacity-70"
				style={{ backgroundColor: primaryColor }}
			/>
			<div
				className="absolute right-3 bottom-3 z-20 h-4 w-4 rounded-full opacity-70"
				style={{ backgroundColor: primaryColor }}
			/>

			{/* Contenido estructurado de la tarjeta */}
			<div className="relative z-1 flex h-full flex-col">
				{/* Encabezado de la tarjeta */}
				<CollectionCardHeader
					category={collection.category ?? 'Colección'}
					color={primaryColor}
					emoji={collection.emoji ?? '📦'}
					name={collection.name}
					platform={collection.platform ?? 'General'}
				/>

				{/* En modo compacto, solo mostrar encabezado y pie */}
				{!compact && (
					<>
						{/* Sección de imágenes */}
						<CollectionCardImages
							collectionId={collection.id}
							primaryColor={primaryColor}
							secondaryColor={secondaryColor}
						/>

						{/* Contenido principal */}
						<CollectionCardContent
							description={collection.description}
							editions={collection.editions}
							featuredImage={collection.featuredImage}
							network={collection.network}
							platform={collection.platform}
							price={collection.price}
							primaryColor={primaryColor}
							sourceImage={collection.sourceImage}
							tokenId={collection.tokenId}
							url={collection.url}
						/>
					</>
				)}

				{/* Pie de la tarjeta */}
				<CollectionCardFooter
					compact={compact}
					createdAt={collection.createdAt}
					entitiesCount={showEntitiesCount ? totalEntities : undefined}
					imagesCount={showImagesCount ? totalMedia : undefined}
					isFavorite={collection.isFavorite}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
					updatedAt={collection.updatedAt}
				/>

				{/* Número de rareza estilo TCG */}
				{!compact && (
					<div
						className="absolute right-1/2 bottom-1 z-20 translate-x-1/2 transform font-mono text-[8px] opacity-70"
						style={{ color: primaryColor }}
					>
						{collection.id.substring(0, 6)}/{collection.id.substring(collection.id.length - 6)}
					</div>
				)}
			</div>
		</motion.div>
	);
}

// Exportar componente memorizado para mejor rendimiento
export const MemoizedCollectionCard = React.memo(CollectionCard);

import { motion } from 'motion/react';
import React, { useCallback, useMemo } from 'react';
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
	const {
		imageCount,
		videoCount,
		albumCount,
		tagCount,
		characterCount,
		placeCount,
		worldItemCount,
		conceptCount,
		promptCount,
		noteCount,
		wildcardCount,
		propertyCount,
		groupCount,
	} = collection.stats;

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
		} catch (_e) {
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
				'hover:shadow-lg hover:scale-[1.02]',
				'active:scale-[0.98]',
				// Cursor
				onClick ? 'cursor-pointer' : '',
				// Clase personalizada
				className
			)}
			whileHover={{ y: -8, transition: { duration: 0.3 } }}
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
				<div className="absolute inset-0 rounded-[4.75%] blur-md -z-10" style={glowStyle} />
			</div>

			{/* Textura holográfica tipo TCG */}
			<div className="absolute inset-0 bg-noise-subtle opacity-5 mix-blend-overlay pointer-events-none z-1" />
			<div
				className="absolute inset-0 bg-gradient-to-br opacity-10 pointer-events-none z-1 hover:opacity-20 transition-opacity duration-300"
				style={{ background: `linear-gradient(45deg, transparent 25%, ${primaryColor}50 50%, transparent 75%)` }}
			/>

			{/* Marco interior tipo TCG */}
			<div className="absolute inset-2 rounded-[4%] border border-white/20 pointer-events-none z-0" />

			{/* Esquinas y marcos decorativos estilo TCG */}
			<div
				className="absolute top-1 left-1 w-5 h-5 border-t-2 border-l-2 rounded-tl-md z-20"
				style={{ borderColor: primaryColor }}
			/>
			<div
				className="absolute top-1 right-1 w-5 h-5 border-t-2 border-r-2 rounded-tr-md z-20"
				style={{ borderColor: primaryColor }}
			/>
			<div
				className="absolute bottom-1 left-1 w-5 h-5 border-b-2 border-l-2 rounded-bl-md z-20"
				style={{ borderColor: primaryColor }}
			/>
			<div
				className="absolute bottom-1 right-1 w-5 h-5 border-b-2 border-r-2 rounded-br-md z-20"
				style={{ borderColor: primaryColor }}
			/>

			{/* Ornamentos decorativos en las esquinas */}
			<div
				className="absolute top-3 left-3 w-3 h-3 rounded-full z-20 opacity-70"
				style={{ backgroundColor: primaryColor }}
			/>
			<div
				className="absolute top-3 right-3 w-3 h-3 rounded-full z-20 opacity-70"
				style={{ backgroundColor: primaryColor }}
			/>
			<div
				className="absolute bottom-3 left-3 w-3 h-3 rounded-full z-20 opacity-70"
				style={{ backgroundColor: primaryColor }}
			/>
			<div
				className="absolute bottom-3 right-3 w-3 h-3 rounded-full z-20 opacity-70"
				style={{ backgroundColor: primaryColor }}
			/>

			{/* Contenido estructurado de la tarjeta */}
			<div className="flex flex-col h-full relative z-1">
				{/* Encabezado de la tarjeta */}
				<CollectionCardHeader
					name={collection.name}
					emoji={collection.emoji ?? '📦'}
					color={primaryColor}
					category={collection.category ?? 'Colección'}
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
							platform={collection.platform}
							price={collection.price}
							network={collection.network}
							tokenId={collection.tokenId}
							url={collection.url}
							editions={collection.editions}
							primaryColor={primaryColor}
							featuredImage={collection.featuredImage}
							sourceImage={collection.sourceImage}
						/>
					</>
				)}

				{/* Pie de la tarjeta */}
				<CollectionCardFooter
					createdAt={collection.createdAt}
					updatedAt={collection.updatedAt}
					imagesCount={showImagesCount ? totalMedia : undefined}
					entitiesCount={showEntitiesCount ? totalEntities : undefined}
					primaryColor={primaryColor}
					secondaryColor={secondaryColor}
					isFavorite={collection.isFavorite}
					compact={compact}
				/>

				{/* Número de rareza estilo TCG */}
				{!compact && (
					<div
						className="absolute bottom-1 right-1/2 transform translate-x-1/2 text-[8px] font-mono opacity-70 z-20"
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

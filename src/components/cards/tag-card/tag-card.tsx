'use client';

import { cn } from '@/lib/utils';
import type { TagWithRelations } from '@/types/entities/tag';
import { type TagCategory, TagRarity } from '@/types/entities/tag';
import { Sparkles, Tag } from 'lucide-react';
import { motion } from 'motion/react';
import type React from 'react';
import { useCallback, useMemo, useState } from 'react';
import { TagCardContent } from './tag-card-content';
import { TagCardFooter } from './tag-card-footer';
import { TagCardHeader } from './tag-card-header';
import { TagCardImages } from './tag-card-images';

export interface TagCardProps {
	tag: TagWithRelations;
	onClick?: () => void;
	className?: string;
	style?: React.CSSProperties;
	tcgMode?: boolean;
	isSelected?: boolean;
	compact?: boolean;
	disabled?: boolean;
	interactive?: boolean;
}

/**
 * TagCard - Componente de tarjeta para etiquetas inspirado en el diseño de cartas TCG
 *
 * Este componente muestra información detallada de una etiqueta en un formato
 * tipo cartas de colección, con efectos visuales y presentación de datos
 * organizada en secciones.
 */
export function TagCard({
	tag,
	onClick,
	className,
	style,
	tcgMode = true,
	isSelected = false,
	compact = false,
	disabled = false,
	interactive = true,
	...rest
}: TagCardProps) {
	const [isHovered, setIsHovered] = useState(false);

	// Extraer propiedades básicas del tag
	const {
		id,
		name,
		emoji = '🏷️',
		color,
		category,
		description,
		shortcut,
		createdAt,
		updatedAt,
		isFavorite = false,
		viewMode,
		featuredImage,
	} = tag;

	// Calcular valores derivados
	const imagesCount = tag._count?.images || 0;
	const videosCount = tag._count?.videos || 0;
	const albumsCount = tag._count?.albums || 0;
	const collectionsCount = tag._count?.collections || 0;
	const charactersCount = tag._count?.characters || 0;
	const placesCount = tag._count?.places || 0;
	const worldItemsCount = tag._count?.worldItems || 0;
	const conceptsCount = tag._count?.concepts || 0;
	const promptsCount = tag._count?.prompts || 0;
	const notesCount = tag._count?.notes || 0;
	const wildcardsCount = tag._count?.wildcards || 0;
	const propertiesCount = tag._count?.properties || 0;
	const groupsCount = tag._count?.groups || 0;

	// Calcular total de relaciones para mostrar la rareza
	const totalRelations =
		imagesCount +
		videosCount +
		albumsCount +
		collectionsCount +
		charactersCount +
		placesCount +
		worldItemsCount +
		conceptsCount +
		promptsCount +
		notesCount +
		wildcardsCount +
		propertiesCount +
		groupsCount;

	// Determinar rareza basada en relaciones
	const determineRarity = (): TagRarity => {
		if (tag.rarity) return tag.rarity as TagRarity;

		if (totalRelations > 200) return TagRarity.LEGENDARY;
		if (totalRelations > 100) return TagRarity.VERY_RARE;
		if (totalRelations > 50) return TagRarity.RARE;
		if (totalRelations > 10) return TagRarity.UNCOMMON;
		return TagRarity.COMMON;
	};

	const calculatedRarity = determineRarity();

	// Colores basados en rareza para el efecto TCG
	const rarityColorMap: Record<string, string> = {
		[TagRarity.COMMON]: '#6b7280',
		[TagRarity.UNCOMMON]: '#22c55e',
		[TagRarity.RARE]: '#3b82f6',
		[TagRarity.VERY_RARE]: '#8b5cf6',
		[TagRarity.LEGENDARY]: '#f59e0b',
	};

	// Color de efecto basado en rareza
	const rarityColor = rarityColorMap[calculatedRarity] || rarityColorMap[TagRarity.COMMON];

	// Nivel de brillo basado en rareza para efectos
	const rarityGlowMap: Record<string, number> = {
		[TagRarity.COMMON]: 0,
		[TagRarity.UNCOMMON]: 5,
		[TagRarity.RARE]: 10,
		[TagRarity.VERY_RARE]: 15,
		[TagRarity.LEGENDARY]: 20,
	};

	const rarityGlow = rarityGlowMap[calculatedRarity] || 0;

	// Calcular color primario y secundario
	const cardColor = useMemo(() => color || rarityColor, [color, rarityColor]);
	const secondaryColor = useMemo(() => {
		// Si no hay color definido, usar un valor por defecto
		if (!color) return '#be185d';

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
			return '#be185d';
		}
	}, [color]);

	// Manejar eventos de teclado para accesibilidad
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onClick();
			}
		},
		[onClick, disabled]
	);

	// Procesar la imagen destacada para asegurarnos de que tiene el formato correcto
	const processedFeaturedImage = featuredImage && typeof featuredImage === 'object' ? featuredImage : null;

	// Render
	return (
		<motion.article
			className={cn(
				'flex flex-col overflow-hidden border-border relative z-0',
				disabled && 'opacity-70 pointer-events-none',
				interactive && !disabled && 'cursor-pointer hover:shadow-lg transition-shadow duration-300',
				className
			)}
			style={{
				background: 'rgba(0, 0, 0, 0.05)',
				border: tcgMode ? `1px solid ${cardColor}60` : undefined,
				borderRadius: tcgMode ? '8px' : undefined,
				maxWidth: compact ? 300 : undefined,
				boxShadow: tcgMode ? `0 0 ${rarityGlow}px ${cardColor}30` : undefined,
				...style,
			}}
			whileHover={!disabled && interactive ? { y: -5 } : {}}
			whileTap={!disabled && interactive && onClick ? { scale: 0.98 } : {}}
			onClick={disabled || !interactive ? undefined : onClick}
			onKeyDown={handleKeyDown}
			tabIndex={disabled || !interactive || !onClick ? -1 : 0}
			role={onClick && interactive ? 'button' : 'article'}
			aria-label={`Etiqueta: ${name}`}
			data-tag-id={id}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			{...rest}
		>
			{/* Card Container con efecto TCG */}
			<div
				className={cn(
					'rounded-xl h-full w-full overflow-hidden transition-all duration-300 ease-out',
					tcgMode && 'shadow-md',
					isHovered && tcgMode && 'scale-[1.01]'
				)}
				style={{
					background: `linear-gradient(135deg, ${cardColor}15, ${cardColor}05)`,
				}}
			>
				{/* Efectos TCG */}
				{tcgMode && (
					<>
						<div
							className="absolute inset-0 opacity-0 hover:opacity-30 transition-opacity duration-300 pointer-events-none"
							style={{
								backgroundImage: `
									linear-gradient(125deg,
									transparent 0%,
									${cardColor}30 25%,
									${rarityColor}30 50%,
									${cardColor}30 75%,
									transparent 100%)
								`,
								backgroundSize: '200% 200%',
								animation: 'gradient-shift 3s ease infinite',
							}}
						/>

						{/* Sello de rareza */}
						<div
							className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 opacity-10 pointer-events-none"
							style={{
								background: `radial-gradient(circle, ${rarityColor}50 0%, transparent 70%)`,
							}}
						>
							<div className="w-full h-full flex items-center justify-center">
								<Tag className="w-10 h-10" style={{ color: rarityColor }} />
							</div>
						</div>

						{/* Indicador visual de rareza */}
						{calculatedRarity !== TagRarity.COMMON && (
							<div className="absolute top-2 right-2 z-10">
								<div
									className={cn('rounded-full p-1', calculatedRarity === TagRarity.LEGENDARY && 'animate-pulse')}
									style={{ backgroundColor: `${rarityColor}30` }}
								>
									<Sparkles className="h-4 w-4" style={{ color: rarityColor }} />
								</div>
							</div>
						)}
					</>
				)}

				{/* Estructura principal de la tarjeta */}
				<div className="flex flex-col h-full">
					{/* Cabecera con nombre e icono */}
					<TagCardHeader
						name={name}
						emoji={emoji}
						color={cardColor}
						category={category as TagCategory}
						rarity={calculatedRarity}
						isFavorite={isFavorite}
						tcgMode={tcgMode}
						compact={compact}
					/>

					{/* Sección de imágenes */}
					<TagCardImages
						tagId={id}
						primaryColor={cardColor}
						secondaryColor={secondaryColor}
						rarity={calculatedRarity}
						featuredImage={processedFeaturedImage}
						tcgMode={tcgMode}
						compact={compact}
					/>

					{/* Contenido principal */}
					<TagCardContent
						description={description}
						shortcut={shortcut}
						primaryColor={cardColor}
						secondaryColor={secondaryColor}
						rarity={calculatedRarity}
						tcgMode={tcgMode}
						imagesCount={imagesCount}
						videosCount={videosCount}
						albumsCount={albumsCount}
						collectionsCount={collectionsCount}
						charactersCount={charactersCount}
						placesCount={placesCount}
						worldItemsCount={worldItemsCount}
						conceptsCount={conceptsCount}
						promptsCount={promptsCount}
						notesCount={notesCount}
						wildcardsCount={wildcardsCount}
						propertiesCount={propertiesCount}
						groupsCount={groupsCount}
					/>

					{/* Pie de tarjeta */}
					<TagCardFooter
						createdAt={createdAt}
						updatedAt={updatedAt}
						primaryColor={cardColor}
						secondaryColor={secondaryColor}
						rarity={calculatedRarity}
						isFavorite={isFavorite}
						tcgMode={tcgMode}
						compact={compact}
						imagesCount={imagesCount}
						videosCount={videosCount}
					/>
				</div>
			</div>
		</motion.article>
	);
}

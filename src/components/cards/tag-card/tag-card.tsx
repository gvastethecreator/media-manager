import { Sparkles, Tag } from 'lucide-react';
import type React from 'react';
import { memo, useCallback, useMemo, useState } from 'react';
import { motion } from '@/components/ui/motion-shim';
import { cn } from '@/lib/utils';
import { type TagCategory, TagRarity } from '@/store/entities/tag/types';
import type { TagWithStats } from '@/types/entities/tag';
import { TagCardContent } from './tag-card-content';
import { TagCardFooter } from './tag-card-footer';
import { TagCardHeader } from './tag-card-header';
import { TagCardImages } from './tag-card-images';

// Helper function para determinar rareza basada en relaciones
function calculateTagRarity(totalRelations: number): TagRarity {
	if (totalRelations > 200) {
		return TagRarity.LEGENDARY;
	}
	if (totalRelations > 100) {
		return TagRarity.VERY_RARE;
	}
	if (totalRelations > 50) {
		return TagRarity.RARE;
	}
	if (totalRelations > 10) {
		return TagRarity.UNCOMMON;
	}
	return TagRarity.COMMON;
}

// Helper function para generar color secundario
function generateSecondaryColor(color?: string): string {
	// Si no hay color definido, usar un valor por defecto (rosa de tags)
	if (!color) {
		return 'oklch(0.65 0.25 350)';
	}

	return `color-mix(in oklab, ${color}, black 20%)`;
}

// Helper function para obtener configuración de rareza
function getRarityConfig(rarity: TagRarity) {
	const rarityColorMap: Record<string, string> = {
		[TagRarity.COMMON]: 'var(--dt-neutral-400)',
		[TagRarity.UNCOMMON]: 'var(--preset-green)',
		[TagRarity.RARE]: 'var(--preset-blue)',
		[TagRarity.VERY_RARE]: 'var(--preset-purple)',
		[TagRarity.LEGENDARY]: 'var(--preset-yellow)',
	};

	const rarityGlowMap: Record<string, number> = {
		[TagRarity.COMMON]: 0,
		[TagRarity.UNCOMMON]: 5,
		[TagRarity.RARE]: 10,
		[TagRarity.VERY_RARE]: 15,
		[TagRarity.LEGENDARY]: 20,
	};

	return {
		color: rarityColorMap[rarity] || rarityColorMap[TagRarity.COMMON],
		glow: rarityGlowMap[rarity] || 0,
	};
}

// Custom hook para manejar datos del tag
function useTagCardData(tag: TagWithStats) {
	return useMemo(() => {
		const counts = {
			imagesCount: tag._count?.images || 0,
			videosCount: tag._count?.videos || 0,
			albumsCount: tag._count?.albums || 0,
			collectionsCount: tag._count?.collections || 0,
			charactersCount: tag._count?.characters || 0,
			placesCount: tag._count?.places || 0,
			worldItemsCount: tag._count?.worldItems || 0,
			conceptsCount: tag._count?.concepts || 0,
			promptsCount: tag._count?.prompts || 0,
			notesCount: tag._count?.notes || 0,
			wildcardsCount: tag._count?.wildcards || 0,
			propertiesCount: tag._count?.properties || 0,
			groupsCount: tag._count?.groups || 0,
		};

		const totalRelations = tag.stats?.totalRelations ?? 0;
		const calculatedRarity = calculateTagRarity(totalRelations);
		const rarityConfig = getRarityConfig(calculatedRarity);

		return {
			...counts,
			totalRelations,
			calculatedRarity,
			rarityConfig,
		};
	}, [tag]);
}

// Componente para efectos TCG
function TCGEffects({
	tcgMode,
	cardColor,
	rarityColor,
	calculatedRarity,
}: {
	tcgMode: boolean;
	cardColor: string;
	rarityColor: string;
	calculatedRarity: TagRarity;
}) {
	if (!tcgMode) {
		return null;
	}

	return (
		<>
			<div
				className="ui-overlay-hover-strong"
				style={{
					backgroundImage: `
						linear-gradient(125deg,
						transparent 0%,
						color-mix(in oklab, ${cardColor}, transparent 70%) 25%,
						color-mix(in oklab, ${rarityColor}, transparent 70%) 50%,
						color-mix(in oklab, ${cardColor}, transparent 70%) 75%,
						transparent 100%)
					`,
					backgroundSize: '200% 200%',
					animation: 'gradient-shift 3s ease infinite',
				}}
			/>

			{/* Sello de rareza */}
			<div
				className="pointer-events-none absolute top-1/4 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 opacity-10"
				style={{
					background: `radial-gradient(circle, color-mix(in oklab, ${rarityColor}, transparent 50%) 0%, transparent 70%)`,
				}}
			>
				<div className="flex h-full w-full items-center justify-center">
					<Tag className="h-10 w-10" style={{ color: rarityColor }} />
				</div>
			</div>

			{/* Indicador visual de rareza */}
			{calculatedRarity !== TagRarity.COMMON && (
				<div className="absolute top-2 right-2 z-10">
					<div
						className={cn('rounded-full p-1', calculatedRarity === TagRarity.LEGENDARY && 'animate-pulse')}
						style={{ backgroundColor: `color-mix(in oklab, ${rarityColor}, transparent 70%)` }}
					>
						<Sparkles className="h-4 w-4" style={{ color: rarityColor }} />
					</div>
				</div>
			)}
		</>
	);
}

// Custom hook para manejar colores y estilos
function useTagCardStyles(tagData: ReturnType<typeof useTagCardData>, color?: string | null) {
	const cardColor = useMemo(() => color || tagData.rarityConfig.color, [color, tagData.rarityConfig.color]);
	const secondaryColor = useMemo(() => generateSecondaryColor(color || undefined), [color]);

	return {
		cardColor,
		secondaryColor,
	};
}

// Custom hook para manejar interacciones
function useTagCardInteractions(onClick?: () => void, disabled?: boolean) {
	const [isHovered, setIsHovered] = useState(false);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>) => {
			if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
				e.preventDefault();
				onClick();
			}
		},
		[onClick, disabled]
	);

	return {
		isHovered,
		setIsHovered,
		handleKeyDown,
	};
}

export interface TagCardProps {
	className?: string;
	compact?: boolean;
	disabled?: boolean;
	interactive?: boolean;
	isSelected?: boolean;
	onClick?: () => void;
	style?: React.CSSProperties;
	tag: TagWithStats;
	tcgMode?: boolean;
}

// Componente interior para el contenido de la tarjeta
interface TagCardInnerContentProps {
	cardColor: string;
	category: string | null;
	compact: boolean;
	createdAt: Date;
	description?: string | null;
	emoji: string | null;
	id: string;
	isFavorite: boolean;
	isHovered: boolean;
	name: string;
	processedFeaturedImage: any;
	secondaryColor: string;
	shortcut?: string | null;
	tagData: any;
	tcgMode: boolean;
	updatedAt: Date;
}

function TagCardInnerContent(props: TagCardInnerContentProps) {
	const {
		tagData,
		cardColor,
		secondaryColor,
		tcgMode,
		isHovered,
		category,
		compact,
		emoji,
		isFavorite,
		name,
		processedFeaturedImage,
		id,
		description,
		shortcut,
		createdAt,
		updatedAt,
	} = props;
	return (
		<div
			className={cn(
				'h-full w-full overflow-hidden rounded-xl transition-all duration-300 ease-out',
				tcgMode && 'shadow-md',
				isHovered && tcgMode && 'scale-[1.01]'
			)}
			style={{
				background: `linear-gradient(135deg, color-mix(in oklab, ${cardColor}, transparent 85%), color-mix(in oklab, ${cardColor}, transparent 95%))`,
			}}
		>
			<TCGEffects
				calculatedRarity={tagData.calculatedRarity}
				cardColor={cardColor}
				rarityColor={tagData.rarityConfig.color}
				tcgMode={tcgMode}
			/>
			<div className="flex h-full flex-col">
				<TagCardHeader
					category={(category || 'general') as TagCategory}
					color={cardColor}
					compact={compact}
					emoji={emoji ?? '🏷️'}
					isFavorite={isFavorite}
					name={name}
					rarity={tagData.calculatedRarity}
					tcgMode={tcgMode}
				/>
				<TagCardImages
					compact={compact}
					featuredImage={processedFeaturedImage}
					primaryColor={cardColor}
					rarity={tagData.calculatedRarity}
					secondaryColor={secondaryColor}
					tagId={id}
					tcgMode={tcgMode}
				/>
				<TagCardContent
					albumsCount={tagData.albumsCount}
					charactersCount={tagData.charactersCount}
					collectionsCount={tagData.collectionsCount}
					conceptsCount={tagData.conceptsCount}
					description={description}
					groupsCount={tagData.groupsCount}
					imagesCount={tagData.imagesCount}
					notesCount={tagData.notesCount}
					placesCount={tagData.placesCount}
					primaryColor={cardColor}
					promptsCount={tagData.promptsCount}
					propertiesCount={tagData.propertiesCount}
					rarity={tagData.calculatedRarity}
					secondaryColor={secondaryColor}
					shortcut={shortcut}
					tcgMode={tcgMode}
					videosCount={tagData.videosCount}
					wildcardsCount={tagData.wildcardsCount}
					worldItemsCount={tagData.worldItemsCount}
				/>
				<TagCardFooter
					compact={compact}
					createdAt={createdAt}
					imagesCount={tagData.imagesCount}
					isFavorite={isFavorite}
					primaryColor={cardColor}
					rarity={tagData.calculatedRarity}
					secondaryColor={secondaryColor}
					tcgMode={tcgMode}
					updatedAt={updatedAt}
					videosCount={tagData.videosCount}
				/>
			</div>
		</div>
	);
}

// Helper para calcular estilos de contenedor
function getContainerStyles(cardColor: string, tcgMode: boolean, compact?: boolean, style?: React.CSSProperties) {
	let minHeight: string;
	if (compact) {
		minHeight = '200px';
	} else if (tcgMode) {
		minHeight = '420px';
	} else {
		minHeight = 'auto';
	}

	return {
		background: 'rgba(var(--effect-shadow-rgb), 0.05)',
		borderRadius: tcgMode ? '12px' : '8px',
		border: tcgMode
			? `2px solid color-mix(in oklab, ${cardColor}, transparent 60%)`
			: '1px solid rgba(var(--effect-highlight-rgb), 0.1)',
		transition: 'all 0.3s ease',
		backdropFilter: 'blur(10px)',
		boxShadow: tcgMode
			? `0 8px 32px rgba(var(--effect-shadow-rgb), 0.1), 0 4px 16px color-mix(in oklab, ${cardColor}, transparent 70%), inset 0 1px 0 rgba(var(--effect-highlight-rgb), 0.1)`
			: '0 4px 8px rgba(var(--effect-shadow-rgb), 0.1)',
		minHeight,
		width: compact ? '180px' : '280px',
		transformStyle: 'preserve-3d' as const,
		perspective: '1000px',
		...style,
	};
}

// Helper para calcular clases de contenedor
function getContainerClasses(disabled?: boolean, interactive?: boolean, className?: string) {
	return cn(
		'group relative flex cursor-pointer flex-col overflow-hidden',
		disabled && 'cursor-not-allowed opacity-50',
		!interactive && 'cursor-default',
		className
	);
}

// Helper para obtener configuración completa del componente
function getTagCardConfiguration(tagObj: any, onClick?: (tag: any) => void, disabled?: boolean) {
	const tagData = useTagCardData(tagObj);
	const { cardColor, secondaryColor } = useTagCardStyles(tagData, tagObj.color);

	// Crear handler compatible con el hook
	const handleClick = useCallback(() => {
		if (onClick) {
			onClick(tagObj);
		}
	}, [onClick, tagObj]);

	const { isHovered, setIsHovered, handleKeyDown } = useTagCardInteractions(handleClick, disabled);
	const tagProps = extractTagProperties(tagObj);

	return {
		tagData,
		cardColor,
		secondaryColor,
		isHovered,
		setIsHovered,
		handleKeyDown,
		...tagProps,
	};
}

// Helper para extraer propiedades del tag
function extractTagProperties(tag: TagWithStats) {
	const {
		id,
		name,
		emoji = '🏷️',
		category,
		description,
		shortcut,
		createdAt,
		updatedAt,
		isFavorite = false,
		featuredImage,
	} = tag;

	// Procesar la imagen destacada para asegurarnos de que tiene el formato correcto
	const processedFeaturedImage = featuredImage && typeof featuredImage === 'object' ? featuredImage : null;

	return {
		id,
		name,
		emoji,
		category,
		description,
		shortcut,
		createdAt,
		updatedAt,
		isFavorite,
		processedFeaturedImage,
	};
}

/**
 * TagCard - Tarjeta para mostrar etiquetas con estilo TCG
 *
 * Este componente muestra información detallada de una etiqueta en un formato
 * tipo cartas de colección, con efectos visuales y presentación de datos
 * organizada en secciones.
 */
// ✅ OPTIMIZADO: Memoizado para evitar re-renders innecesarios
export const TagCard = memo(function TagCard({
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
	// Obtener configuración usando helper simplificado
	const config = getTagCardConfiguration(tag, onClick, disabled);

	return (
		<motion.article
			aria-label={`Tag: ${config.name}`}
			className={getContainerClasses(disabled, interactive, className)}
			data-tag-id={config.id}
			onClick={disabled || !interactive ? undefined : onClick}
			onKeyDown={config.handleKeyDown}
			onMouseEnter={() => config.setIsHovered(true)}
			onMouseLeave={() => config.setIsHovered(false)}
			role={onClick && interactive ? 'button' : 'article'}
			style={getContainerStyles(config.cardColor, tcgMode, compact, style)}
			tabIndex={disabled || !interactive || !onClick ? -1 : 0}
			whileHover={!disabled && interactive ? { y: -5 } : {}}
			whileTap={!disabled && interactive && onClick ? { scale: 0.98 } : {}}
			{...rest}
		>
			{/* Card Container con efecto TCG */}
			<TagCardInnerContent
				cardColor={config.cardColor}
				category={config.category}
				compact={compact}
				createdAt={config.createdAt}
				description={config.description}
				emoji={config.emoji}
				id={config.id}
				isFavorite={config.isFavorite}
				isHovered={config.isHovered}
				name={config.name}
				processedFeaturedImage={config.processedFeaturedImage}
				secondaryColor={config.secondaryColor}
				shortcut={config.shortcut}
				tagData={config.tagData}
				tcgMode={tcgMode}
				updatedAt={config.updatedAt}
			/>
		</motion.article>
	);
});

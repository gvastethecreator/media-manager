import { Beaker, BookOpenText, Box, GemIcon, Sparkles, StoreIcon, Sword } from 'lucide-react';
import React, { memo, useCallback, useMemo, useState } from 'react';
import { motion } from '@/components/ui/motion-shim';
import { cn } from '@/lib/utils';
import { WorldItemRarity, WorldItemType, WorldItemWithStats } from '@/types/entities/world-item';
import { CardHeader } from '../card-header';
import { WorldItemCardContent } from './world-item-card-content';
import { WorldItemCardFooter } from './world-item-card-footer';
import { WorldItemCardImages } from './world-item-card-images';

// Helper genérico para parsear JSON seguro
function parseJSONOr<TFallback>(value: unknown, fallback: TFallback): TFallback {
	if (!value) {
		return fallback;
	}
	if (typeof value === 'string') {
		try {
			return JSON.parse(value) as TFallback;
		} catch {
			return fallback;
		}
	}
	return (value as TFallback) || fallback;
}

// Visuales por rareza centralizados
function getRarityVisuals(rarity?: string | null) {
	const colorMap: Record<string, string> = {
		common: 'var(--dt-neutral-500)',
		uncommon: 'var(--dt-success-500)',
		rare: 'var(--dt-primary-500)',
		epic: 'var(--entity-character)',
		legendary: 'var(--dt-warning-500)',
	};
	const glowMap: Record<string, number> = {
		common: 0,
		uncommon: 5,
		rare: 10,
		epic: 15,
		legendary: 20,
	};
	const key = rarity?.toLowerCase() || 'common';
	return { rarityColor: colorMap[key] || colorMap.common, rarityGlow: glowMap[key] ?? 0 };
}

// Subcomponentes ligeros para estados
function WorldItemCardSkeleton({ className }: { className?: string }) {
	return (
		<div
			className={cn(
				'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-muted md:w-[320px] dark:bg-background',
				className
			)}
		>
			<p className="text-muted-foreground">Cargando objeto del mundo...</p>
		</div>
	);
}

function WorldItemCardError({ error, className }: { error?: Error; className?: string }) {
	return (
		<div
			className={cn(
				'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-red-100 md:w-[320px] dark:bg-red-900',
				className
			)}
		>
			<p className="text-destructive">Error: {error?.message || 'Objeto del mundo no encontrado'}</p>
		</div>
	);
}

function TCGVisualEffects({
	tcgMode,
	primaryColor,
	rarityColor,
	rarity,
	icon,
}: {
	tcgMode: boolean;
	primaryColor: string;
	rarityColor: string;
	rarity?: string;
	icon: React.ReactNode;
}) {
	if (!tcgMode) {
		return null;
	}
	return (
		<>
			<div
				className="ui-overlay-hover-strong"
				style={{
					backgroundImage: `linear-gradient(125deg, transparent 0%, color-mix(in oklab, ${primaryColor}, transparent 70%) 25%, color-mix(in oklab, ${rarityColor}, transparent 70%) 50%, color-mix(in oklab, ${primaryColor}, transparent 70%) 75%, transparent 100%)`,
					backgroundSize: '200% 200%',
					animation: 'gradient-shift 3s ease infinite',
				}}
			/>
			<div
				className="pointer-events-none absolute top-1/4 left-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 opacity-10"
				style={{
					background: `radial-gradient(circle, color-mix(in oklab, ${rarityColor}, transparent 50%) 0%, transparent 70%)`,
				}}
			>
				<div className="flex h-full w-full items-center justify-center">{icon}</div>
			</div>
			{rarity && rarity.toLowerCase() !== 'common' && (
				<div className="absolute top-2 right-2 z-10">
					<div
						className={cn('rounded-full p-1', rarity.toLowerCase() === 'legendary' && 'animate-pulse')}
						style={{ backgroundColor: `color-mix(in oklab, ${rarityColor}, transparent 70%)` }}
					>
						<Sparkles className="h-4 w-4" style={{ color: rarityColor }} />
					</div>
				</div>
			)}
		</>
	);
}

export interface WorldItemCardProps {
	className?: string;
	compact?: boolean;
	disabled?: boolean;
	error?: Error;
	interactive?: boolean;
	isLoading?: boolean;
	isSelected?: boolean;
	onClick?: (worldItemData: WorldItemWithStats) => void;
	style?: React.CSSProperties;
	tcgMode?: boolean;
	worldItem?: WorldItemWithStats;
	worldItemId: string;
}

/**
 * Card para mostrar un objeto del mundo, con un diseño inspirado en cartas de TCG.
 * Muestra propiedades, atributos, descripción y estadísticas en formato
 * visualmente atractivo.
 */
// Cálculo de colores/icono según tipo y rareza
function computeItemVisuals(worldItem?: Pick<WorldItemWithStats, 'color' | 'type' | 'rarity'> | null) {
	const baseColor = worldItem?.color || 'var(--dt-primary-600)';
	const key = worldItem?.type?.toLowerCase() || 'default';
	const map: Record<string, { icon: React.ReactNode; p: string; s: string }> = {
		artifact: {
			icon: <GemIcon className="h-4 w-4" />,
			p: baseColor,
			s: `color-mix(in oklab, ${baseColor}, black 20%)`,
		},
		book: {
			icon: <BookOpenText className="h-4 w-4" />,
			p: baseColor,
			s: `color-mix(in oklab, ${baseColor}, black 20%)`,
		},
		consumable: {
			icon: <Beaker className="h-4 w-4" />,
			p: baseColor,
			s: `color-mix(in oklab, ${baseColor}, black 20%)`,
		},
		weapon: { icon: <Sword className="h-4 w-4" />, p: baseColor, s: `color-mix(in oklab, ${baseColor}, black 20%)` },
		equipment: {
			icon: <StoreIcon className="h-4 w-4" />,
			p: baseColor,
			s: `color-mix(in oklab, ${baseColor}, black 20%)`,
		},
		default: { icon: <Box className="h-4 w-4" />, p: baseColor, s: `color-mix(in oklab, ${baseColor}, black 20%)` },
	};
	const def = map[key] || map.default;
	const intensityMap: Record<string, number> = { common: 1, uncommon: 1.1, rare: 1.2, epic: 1.3, legendary: 1.5 };
	return {
		primaryColor: def.p,
		secondaryColor: def.s,
		icon: def.icon,
		intensityFactor: intensityMap[worldItem?.rarity?.toLowerCase() || 'common'] || 1,
	};
}

function computeRelationCounts(worldItem: WorldItemWithStats) {
	const s = worldItem.stats || {};
	return {
		imagesCount: s.imageCount || 0,
		videosCount: s.videoCount || 0,
		albumsCount: s.albumCount || 0,
		collectionsCount: s.collectionCount || 0,
		tagsCount: s.tagCount || 0,
		charactersCount: s.characterCount || 0,
		placesCount: s.placeCount || 0,
		conceptsCount: s.conceptCount || 0,
		promptsCount: s.promptCount || 0,
		notesCount: s.noteCount || 0,
		wildcardsCount: s.wildcardCount || 0,
		propertiesCount: s.propertyCount || 0,
		groupsCount: s.groupCount || 0,
	};
}

function sumRelations(c: ReturnType<typeof computeRelationCounts>) {
	return (
		c.imagesCount +
		c.videosCount +
		c.albumsCount +
		c.collectionsCount +
		c.tagsCount +
		c.charactersCount +
		c.placesCount +
		c.conceptsCount +
		c.promptsCount +
		c.notesCount +
		c.wildcardsCount +
		c.propertiesCount +
		c.groupsCount
	);
}

function useWorldItemDerived(worldItem?: WorldItemWithStats) {
	return useMemo(() => {
		if (!worldItem) {
			const emptyCounts = computeRelationCounts({ stats: {} } as WorldItemWithStats);
			return {
				parsedAttributes: [] as string[],
				parsedEffects: [] as any[],
				parsedProperties: [] as any[],
				parsedRequirements: {} as Record<string, any>,
				parsedStats: {} as Record<string, any>,
				relationCounts: emptyCounts,
				_totalRelations: 0,
			};
		}
		const parsedAttributes = parseJSONOr(worldItem.attributes, [] as string[]);
		const parsedEffects = parseJSONOr(worldItem.effects, [] as any[]);
		const parsedProperties = parseJSONOr(worldItem.properties, [] as any[]);
		const parsedRequirements = parseJSONOr(worldItem.requirements, {} as Record<string, any>);
		const parsedStats = parseJSONOr(worldItem.stats, {} as Record<string, any>);
		const relationCounts = computeRelationCounts(worldItem);
		const _totalRelations = sumRelations(relationCounts);
		return {
			parsedAttributes,
			parsedEffects,
			parsedProperties,
			parsedRequirements,
			parsedStats,
			relationCounts,
			_totalRelations,
		};
	}, [worldItem]);
}

function WorldItemCardBase({
	worldItem,
	className,
	style,
	compact = false,
	tcgMode = false,
	interactive = true,
	disabled = false,
	isLoading = false,
	error,
	onClick,
	...rest
}: WorldItemCardProps) {
	// Hover (para futura expansión visual)
	const [isHovered, setIsHovered] = useState(false);

	const {
		parsedAttributes,
		parsedEffects,
		parsedProperties,
		parsedRequirements,
		parsedStats,
		relationCounts,
		_totalRelations,
	} = useWorldItemDerived(worldItem);
	const { primaryColor, secondaryColor, icon, intensityFactor } = useMemo(
		() => computeItemVisuals(worldItem),
		[worldItem]
	);

	// Manejar eventos de teclado para accesibilidad
	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled && worldItem) {
				e.preventDefault();
				onClick(worldItem);
			}
		},
		[onClick, disabled, worldItem]
	);

	// Estados básicos
	if (isLoading) {
		return <WorldItemCardSkeleton className={className} />;
	}
	if (error || !worldItem) {
		return <WorldItemCardError className={className} error={error} />;
	}

	// Extraer propiedades básicas del objeto
	const {
		id,
		name,
		emoji = '🎯',
		color,
		category,
		description,
		shortcut,
		createdAt,
		updatedAt,
		isFavorite = false,
		type = 'misc' as WorldItemType,
		rarity = 'common' as WorldItemRarity,
		origin,
		attributes,
		effects,
		requirements,
		stats,
		properties,
		featuredImage,
	} = worldItem;

	// Colores basados en rareza para el efecto TCG
	const { rarityColor, rarityGlow } = getRarityVisuals(rarity);

	return (
		<WorldItemCardPresentational
			_cardProps={{ className, compact, disabled, interactive, onClick, rest, style }}
			colors={{ primaryColor, rarityColor, rarityGlow, secondaryColor }}
			data={{
				_totalRelations,
				attributes: parsedAttributes,
				effects: parsedEffects,
				id,
				intensityFactor,
				name,
				origin,
				parsedProperties,
				parsedRequirements,
				parsedStats,
				rarity: (rarity || 'common') as WorldItemRarity,
				type: (type || 'misc') as WorldItemType,
				description,
			}}
			handleKeyDown={handleKeyDown}
			icon={icon}
			onHoverChange={setIsHovered}
			tcgMode={tcgMode}
		/>
	);
}

interface WorldItemCardPresentationalProps {
	_cardProps: {
		className?: string;
		compact?: boolean;
		disabled?: boolean;
		interactive?: boolean;
		onClick?: ((w: WorldItemWithStats) => void) | undefined;
		rest: Record<string, unknown>;
		style?: React.CSSProperties | undefined;
	};
	colors: { primaryColor: string; rarityColor: string; rarityGlow: number; secondaryColor: string | null };
	data: {
		_totalRelations: number;
		attributes: string[];
		effects: any[];
		id: string;
		intensityFactor: number;
		name: string;
		origin?: string | null;
		parsedProperties: any[];
		parsedRequirements: Record<string, any>;
		parsedStats: Record<string, any>;
		rarity: WorldItemRarity;
		type: WorldItemType;
		description?: string | null;
	};
	handleKeyDown: (e: React.KeyboardEvent) => void;
	icon: React.ReactNode;
	onHoverChange: (v: boolean) => void;
	tcgMode: boolean;
}

function WorldItemCardPresentational({
	_cardProps,
	colors,
	data,
	icon,
	onHoverChange,
	handleKeyDown,
	tcgMode,
}: WorldItemCardPresentationalProps) {
	const { className, compact, disabled, interactive, onClick, rest, style } = _cardProps;
	const { primaryColor, rarityColor, rarityGlow, secondaryColor } = colors;
	const safeSecondary = secondaryColor || 'var(--dt-neutral-950)';
	return (
		<ArticleWrapper
			ariaLabel={data.name}
			className={className}
			compact={compact}
			disabled={disabled}
			handleKeyDown={handleKeyDown}
			id={data.id}
			interactive={interactive}
			onClick={onClick as any}
			onHoverChange={onHoverChange}
			primaryColor={primaryColor}
			rarityGlow={rarityGlow}
			rest={rest}
			style={style}
			tcgMode={tcgMode}
		>
			<WorldItemCardInner
				attributes={data.attributes}
				compact={compact}
				description={data.description}
				effects={data.effects}
				icon={icon}
				id={data.id}
				intensityFactor={data.intensityFactor}
				name={data.name}
				origin={data.origin}
				parsedProperties={data.parsedProperties}
				parsedRequirements={data.parsedRequirements}
				parsedStats={data.parsedStats}
				primaryColor={primaryColor}
				rarity={data.rarity}
				rarityColor={rarityColor}
				safeSecondary={safeSecondary}
				tcgMode={tcgMode}
				totalRelations={data._totalRelations}
				type={data.type}
			/>
		</ArticleWrapper>
	);
}

interface ArticleWrapperProps {
	ariaLabel: string;
	children: React.ReactNode;
	className?: string;
	compact?: boolean;
	disabled?: boolean;
	handleKeyDown: (e: React.KeyboardEvent) => void;
	id: string;
	interactive?: boolean;
	onClick?: (w: WorldItemWithStats) => void;
	onHoverChange: (v: boolean) => void;
	primaryColor: string;
	rarityGlow: number;
	rest: Record<string, unknown>;
	style?: React.CSSProperties;
	tcgMode: boolean;
}

function ArticleWrapper(props: ArticleWrapperProps) {
	const {
		ariaLabel,
		className,
		compact,
		disabled,
		id,
		interactive,
		onClick,
		onHoverChange,
		primaryColor,
		rarityGlow,
		rest,
		handleKeyDown,
		style,
		tcgMode,
		children,
	} = props;
	const clickable = interactive && !disabled && onClick;
	const articleStyle: React.CSSProperties = {
		background: 'oklch(0 0 0 / 5%)',
		border: tcgMode ? `1px solid color-mix(in oklab, ${primaryColor}, transparent 40%)` : undefined,
		borderRadius: tcgMode ? '8px' : undefined,
		maxWidth: compact ? 300 : undefined,
		boxShadow: tcgMode ? `0 0 ${rarityGlow}px color-mix(in oklab, ${primaryColor}, transparent 70%)` : undefined,
		...style,
	};
	return (
		<motion.article
			aria-label={`Objeto: ${ariaLabel}`}
			className={cn(
				'relative z-0 flex flex-col overflow-hidden border-border',
				disabled && 'pointer-events-none opacity-70',
				clickable && 'cursor-pointer transition-shadow duration-300 hover:shadow-lg',
				className
			)}
			data-world-item-id={id}
			onClick={clickable && onClick ? () => onClick({ id } as WorldItemWithStats) : undefined}
			onKeyDown={handleKeyDown}
			onMouseEnter={() => onHoverChange(true)}
			onMouseLeave={() => onHoverChange(false)}
			role={clickable ? 'button' : 'article'}
			style={articleStyle}
			tabIndex={clickable ? 0 : -1}
			whileHover={clickable ? { y: -5 } : {}}
			whileTap={clickable ? { scale: 0.98 } : {}}
			{...(rest as any)}
		>
			{children}
		</motion.article>
	);
}

interface WorldItemCardInnerProps {
	attributes: string[];
	compact?: boolean;
	description?: string | null;
	effects: any[];
	icon: React.ReactNode;
	id: string;
	intensityFactor: number;
	name: string;
	origin?: string | null;
	parsedProperties: any[];
	parsedRequirements: Record<string, any>;
	parsedStats: Record<string, any>;
	primaryColor: string;
	rarity: WorldItemRarity;
	rarityColor: string;
	safeSecondary: string;
	tcgMode: boolean;
	totalRelations: number;
	type: WorldItemType;
}

function WorldItemCardInner({
	attributes,
	compact,
	description,
	effects,
	icon,
	id,
	intensityFactor,
	name,
	origin,
	parsedProperties,
	parsedRequirements,
	parsedStats,
	primaryColor,
	rarity,
	rarityColor,
	safeSecondary,
	tcgMode,
	totalRelations,
	type,
}: WorldItemCardInnerProps) {
	return (
		<div
			className={cn(
				'h-full w-full overflow-hidden rounded-xl transition-all duration-300 ease-out',
				tcgMode && 'shadow-md',
				tcgMode && 'scale-[1.01]'
			)}
			style={{
				background: `linear-gradient(135deg, color-mix(in oklab, ${primaryColor}, transparent 85%), color-mix(in oklab, ${primaryColor}, transparent 95%))`,
			}}
		>
			<TCGVisualEffects
				icon={icon}
				primaryColor={primaryColor}
				rarity={rarity || undefined}
				rarityColor={rarityColor}
				tcgMode={tcgMode}
			/>
			<CardHeader icon={icon} primaryColor={primaryColor} subtitle={type || 'Objeto'} title={name} />
			<WorldItemCardImages primaryColor={primaryColor} secondaryColor={safeSecondary} worldItemId={id} />
			<WorldItemCardContent
				attributes={attributes as string[]}
				description={description}
				effects={effects as any}
				origin={origin}
				primaryColor={rarityColor}
				properties={parsedProperties as any}
				rarity={rarity}
				requirements={parsedRequirements as any}
				stats={parsedStats as any}
			/>
			<WorldItemCardFooter
				_totalRelations={totalRelations}
				compact={compact}
				intensityFactor={intensityFactor}
				primaryColor={rarityColor}
				secondaryColor={safeSecondary}
				worldItem={{ id, name, rarity, type } as unknown as WorldItemWithStats}
			/>
		</div>
	);
}

export const WorldItemCard = memo(function WorldItemCard(props: WorldItemCardProps) {
	return <WorldItemCardBase {...props} />;
});

import { Beaker, BookOpenText, Box, GemIcon, Sparkles, StoreIcon, Sword } from 'lucide-react';
import { motion } from 'motion/react';
import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { WorldItemRarity, WorldItemType, WorldItemWithStats } from '@/types/entities/world-item';
import { CardHeader } from '../card-header';
import { WorldItemCardContent } from './world-item-card-content';
import { WorldItemCardFooter } from './world-item-card-footer';
import { WorldItemCardImages } from './world-item-card-images';

// Función auxiliar para oscurecer colores
function darkenColor(color: string): string {
	if (!color) return '#000000';
	// Convertir hex a RGB
	const hex = color.replace('#', '');
	const r = Number.parseInt(hex.substr(0, 2), 16);
	const g = Number.parseInt(hex.substr(2, 2), 16);
	const b = Number.parseInt(hex.substr(4, 2), 16);
	// Oscurecer reduciendo cada componente en un 30%
	const newR = Math.floor(r * 0.7);
	const newG = Math.floor(g * 0.7);
	const newB = Math.floor(b * 0.7);
	// Convertir de vuelta a hex
	return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

export interface WorldItemCardProps {
	worldItemId: string;
	worldItem?: WorldItemWithStats;
	isLoading?: boolean;
	error?: Error;
	onClick?: (worldItemData: WorldItemWithStats) => void;
	className?: string;
	style?: React.CSSProperties;
	tcgMode?: boolean;
	isSelected?: boolean;
	compact?: boolean;
	disabled?: boolean;
	interactive?: boolean;
}

/**
 * Card para mostrar un objeto del mundo, con un diseño inspirado en cartas de TCG.
 * Muestra propiedades, atributos, descripción y estadísticas en formato
 * visualmente atractivo.
 */
export function WorldItemCard({
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
	// Estado para efectos hover
	const [isHovered, setIsHovered] = useState(false);

	// Procesar propiedades si es un string o formato JSON
	const parsedProperties = useMemo(() => {
		if (!worldItem?.properties) return [];
		if (typeof worldItem.properties === 'string' && worldItem.properties) {
			try {
				return JSON.parse(worldItem.properties);
			} catch (_e) {
				return [];
			}
		}
		return worldItem.properties || [];
	}, [worldItem?.properties]);

	// Procesar requerimientos si es un string o formato JSON
	const parsedRequirements = useMemo(() => {
		if (!worldItem?.requirements) return [];
		if (typeof worldItem.requirements === 'string' && worldItem.requirements) {
			try {
				return JSON.parse(worldItem.requirements);
			} catch (_e) {
				return [];
			}
		}
		return worldItem.requirements || [];
	}, [worldItem?.requirements]);

	// Procesar atributos si es un string o formato JSON
	const parsedAttributes = useMemo(() => {
		if (!worldItem?.attributes) return [];
		if (typeof worldItem.attributes === 'string' && worldItem.attributes) {
			try {
				return JSON.parse(worldItem.attributes);
			} catch (_e) {
				return [];
			}
		}
		return worldItem.attributes || [];
	}, [worldItem?.attributes]);

	// Procesar efectos si es un string o formato JSON
	const parsedEffects = useMemo(() => {
		if (!worldItem?.effects) return [];
		if (typeof worldItem.effects === 'string' && worldItem.effects) {
			try {
				return JSON.parse(worldItem.effects);
			} catch (_e) {
				return [];
			}
		}
		return worldItem.effects || [];
	}, [worldItem?.effects]);

	// Procesar estadísticas si es un string o formato JSON
	const parsedStats = useMemo(() => {
		if (!worldItem?.stats) return {};
		if (typeof worldItem.stats === 'string' && worldItem.stats) {
			try {
				return JSON.parse(worldItem.stats);
			} catch (_e) {
				return {};
			}
		}
		return worldItem.stats || {};
	}, [worldItem?.stats]);

	// Colores para el gradiente y el icono - derivados del tipo y rareza del objeto
	const { primaryColor, secondaryColor, icon, intensityFactor } = useMemo(() => {
		// Color base desde la propiedad o predeterminado
		const baseColor = worldItem?.color || '#4F46E5';

		// Colores según el tipo de objeto
		let iconComponent: React.ReactNode;
		let primaryCol: string;
		let secondaryCol: string | null;

		switch (worldItem?.type?.toLowerCase()) {
			case 'artifact':
				iconComponent = <GemIcon className="h-4 w-4" />;
				primaryCol = baseColor || '#ad5389';
				secondaryCol = darkenColor(baseColor) || '#3c1053';
				break;
			case 'book':
				iconComponent = <BookOpenText className="h-4 w-4" />;
				primaryCol = baseColor || '#007991';
				secondaryCol = darkenColor(baseColor) || '#78ffd6';
				break;
			case 'consumable':
				iconComponent = <Beaker className="h-4 w-4" />;
				primaryCol = baseColor || '#659999';
				secondaryCol = darkenColor(baseColor) || '#f4791f';
				break;
			case 'weapon':
				iconComponent = <Sword className="h-4 w-4" />;
				primaryCol = baseColor || '#8A2387';
				secondaryCol = darkenColor(baseColor) || '#F27121';
				break;
			case 'equipment':
				iconComponent = <StoreIcon className="h-4 w-4" />;
				primaryCol = baseColor || '#3A1C71';
				secondaryCol = darkenColor(baseColor) || '#FFAF7B';
				break;
			default:
				iconComponent = <Box className="h-4 w-4" />;
				primaryCol = baseColor || '#0f0c29';
				secondaryCol = darkenColor(baseColor) || '#302b63';
		}

		// Ajustar intensidad según rareza
		const rarityFactors: Record<string, number> = {
			common: 1,
			uncommon: 1.1,
			rare: 1.2,
			epic: 1.3,
			legendary: 1.5,
		};

		const intensityFactor = rarityFactors[worldItem?.rarity?.toLowerCase() || 'common'] || 1;

		return {
			primaryColor: primaryCol,
			secondaryColor: secondaryCol,
			icon: iconComponent,
			intensityFactor,
		};
	}, [worldItem?.color, worldItem?.type, worldItem?.rarity]);

	// Manejar eventos de teclado para accesibilidad
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled && worldItem) {
			e.preventDefault();
			onClick(worldItem);
		}
	};

	// Si no hay datos del objeto del mundo o está cargando, mostrar un esqueleto o un mensaje de error
	if (isLoading) {
		return (
			<div
				className={cn(
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-gray-100 md:w-[320px] dark:bg-gray-900',
					className
				)}
			>
				<p className="text-gray-500">Cargando objeto del mundo...</p>
			</div>
		);
	}

	if (error || !worldItem) {
		return (
			<div
				className={cn(
					'flex h-[470px] w-[300px] items-center justify-center overflow-hidden rounded-lg bg-red-100 md:w-[320px] dark:bg-red-900',
					className
				)}
			>
				<p className="text-red-800">Error: {error?.message || 'Objeto del mundo no encontrado'}</p>
			</div>
		);
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

	// Calcular valores derivados
	const imagesCount = stats?.imageCount || worldItem.stats?.imageCount || 0;
	const videosCount = stats?.videoCount || worldItem.stats?.videoCount || 0;
	const albumsCount = stats?.albumCount || worldItem.stats?.albumCount || 0;
	const collectionsCount = stats?.collectionCount || worldItem.stats?.collectionCount || 0;
	const tagsCount = stats?.tagCount || worldItem.stats?.tagCount || 0;
	const charactersCount = stats?.characterCount || worldItem.stats?.characterCount || 0;
	const placesCount = stats?.placeCount || worldItem.stats?.placeCount || 0;
	const conceptsCount = stats?.conceptCount || worldItem.stats?.conceptCount || 0;
	const promptsCount = stats?.promptCount || worldItem.stats?.promptCount || 0;
	const notesCount = stats?.noteCount || worldItem.stats?.noteCount || 0;
	const wildcardsCount = stats?.wildcardCount || worldItem.stats?.wildcardCount || 0;
	const propertiesCount = stats?.propertyCount || worldItem.stats?.propertyCount || 0;
	const groupsCount = stats?.groupCount || worldItem.stats?.groupCount || 0;

	// Calcular total de relaciones para efectos visuales
	const _totalRelations =
		imagesCount +
		videosCount +
		albumsCount +
		collectionsCount +
		tagsCount +
		charactersCount +
		placesCount +
		conceptsCount +
		promptsCount +
		notesCount +
		wildcardsCount +
		propertiesCount +
		groupsCount;

	// Colores basados en rareza para el efecto TCG
	const rarityColorMap: Record<string, string> = {
		common: '#6b7280',
		uncommon: '#22c55e',
		rare: '#3b82f6',
		epic: '#8b5cf6',
		legendary: '#f59e0b',
	};

	// Color de efecto basado en rareza
	const rarityColor = rarityColorMap[rarity?.toLowerCase() || 'common'];

	// Nivel de brillo basado en rareza para efectos
	const rarityGlowMap: Record<string, number> = {
		common: 0,
		uncommon: 5,
		rare: 10,
		epic: 15,
		legendary: 20,
	};

	const rarityGlow = rarityGlowMap[rarity?.toLowerCase() || 'common'] || 0;

	// Procesar la imagen destacada
	const _processedFeaturedImage = featuredImage && typeof featuredImage === 'object' ? featuredImage : null;

	// Render del componente
	return (
		<motion.article
			aria-label={`Objeto: ${name}`}
			className={cn(
				'relative z-0 flex flex-col overflow-hidden border-border',
				disabled && 'pointer-events-none opacity-70',
				interactive && !disabled && 'cursor-pointer transition-shadow duration-300 hover:shadow-lg',
				className
			)}
			data-world-item-id={id}
			onClick={disabled || !interactive || !onClick || !worldItem ? undefined : () => onClick(worldItem)}
			onKeyDown={handleKeyDown}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			role={onClick && interactive ? 'button' : 'article'}
			style={{
				background: 'rgba(0, 0, 0, 0.05)',
				border: tcgMode ? `1px solid ${primaryColor}60` : undefined,
				borderRadius: tcgMode ? '8px' : undefined,
				maxWidth: compact ? 300 : undefined,
				boxShadow: tcgMode ? `0 0 ${rarityGlow}px ${primaryColor}30` : undefined,
				...style,
			}}
			tabIndex={disabled || !interactive || !onClick ? -1 : 0}
			whileHover={!disabled && interactive ? { y: -5 } : {}}
			whileTap={!disabled && interactive && onClick ? { scale: 0.98 } : {}}
			{...rest}
		>
			{/* Card Container con efecto TCG */}
			<div
				className={cn(
					'h-full w-full overflow-hidden rounded-xl transition-all duration-300 ease-out',
					tcgMode && 'shadow-md',
					isHovered && tcgMode && 'scale-[1.01]'
				)}
				style={{
					background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
				}}
			>
				{/* Efectos TCG */}
				{tcgMode && (
					<>
						{/* Efecto holográfico con gradiente */}
						<div
							className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 hover:opacity-30"
							style={{
								backgroundImage: `
									linear-gradient(125deg,
									transparent 0%,
									${primaryColor}30 25%,
									${rarityColor}30 50%,
									${primaryColor}30 75%,
									transparent 100%)
								`,
								backgroundSize: '200% 200%',
								animation: 'gradient-shift 3s ease infinite',
							}}
						/>

						{/* Sello de rareza */}
						<div
							className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/4 left-1/2 h-24 w-24 opacity-10"
							style={{
								background: `radial-gradient(circle, ${rarityColor}50 0%, transparent 70%)`,
							}}
						>
							<div className="flex h-full w-full items-center justify-center">{icon}</div>
						</div>

						{/* Indicador visual de rareza */}
						{rarity && rarity.toLowerCase() !== 'common' && (
							<div className="absolute top-2 right-2 z-10">
								<div
									className={cn('rounded-full p-1', rarity.toLowerCase() === 'legendary' && 'animate-pulse')}
									style={{ backgroundColor: `${rarityColor}30` }}
								>
									<Sparkles className="h-4 w-4" style={{ color: rarityColor }} />
								</div>
							</div>
						)}
					</>
				)}

				{/* Contenido estructurado de la tarjeta */}

				{/* Encabezado de la tarjeta */}
				<CardHeader icon={icon} primaryColor={primaryColor} subtitle={type || 'Objeto'} title={name} />

				{/* Sección de imágenes */}
				<WorldItemCardImages primaryColor={primaryColor} secondaryColor={secondaryColor} worldItemId={id} />

				{/* Contenido principal */}
				<WorldItemCardContent
					attributes={parsedAttributes}
					description={description}
					effects={parsedEffects}
					origin={origin}
					primaryColor={rarityColor}
					properties={parsedProperties}
					rarity={rarity}
					requirements={parsedRequirements}
					stats={parsedStats}
				/>
				<WorldItemCardFooter
					_totalRelations={_totalRelations}
					compact={compact}
					intensityFactor={intensityFactor}
					primaryColor={rarityColor}
					secondaryColor={secondaryColor || '#000000'}
					worldItem={worldItem}
				/>
			</div>
		</motion.article>
	);
}

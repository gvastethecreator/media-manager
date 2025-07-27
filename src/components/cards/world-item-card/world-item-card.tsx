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
		if (!worldItem?._stats) return {};
		if (typeof worldItem._stats === 'string' && worldItem._stats) {
			try {
				return JSON.parse(worldItem._stats);
			} catch (_e) {
				return {};
			}
		}
		return worldItem._stats || {};
	}, [worldItem?._stats]);

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
				iconComponent = <GemIcon className="w-4 h-4" />;
				primaryCol = baseColor || '#ad5389';
				secondaryCol = darkenColor(baseColor) || '#3c1053';
				break;
			case 'book':
				iconComponent = <BookOpenText className="w-4 h-4" />;
				primaryCol = baseColor || '#007991';
				secondaryCol = darkenColor(baseColor) || '#78ffd6';
				break;
			case 'consumable':
				iconComponent = <Beaker className="w-4 h-4" />;
				primaryCol = baseColor || '#659999';
				secondaryCol = darkenColor(baseColor) || '#f4791f';
				break;
			case 'weapon':
				iconComponent = <Sword className="w-4 h-4" />;
				primaryCol = baseColor || '#8A2387';
				secondaryCol = darkenColor(baseColor) || '#F27121';
				break;
			case 'equipment':
				iconComponent = <StoreIcon className="w-4 h-4" />;
				primaryCol = baseColor || '#3A1C71';
				secondaryCol = darkenColor(baseColor) || '#FFAF7B';
				break;
			default:
				iconComponent = <Box className="w-4 h-4" />;
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
		if ((e.key === 'Enter' || e.key === ' ') && onClick && !disabled) {
			e.preventDefault();
			onClick(worldItem);
		}
	};

	// Si no hay datos del objeto del mundo o está cargando, mostrar un esqueleto o un mensaje de error
	if (isLoading) {
		return (
			<div
				className={cn(
					'w-[300px] md:w-[320px] h-[470px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center',
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
					'w-[300px] md:w-[320px] h-[470px] rounded-lg overflow-hidden bg-red-100 dark:bg-red-900 flex items-center justify-center',
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
		_stats,
		properties,
		featuredImage,
	} = worldItem;

	// Calcular valores derivados
	const imagesCount = _stats?.totalImages || worldItem._count?.images || 0;
	const videosCount = _stats?.totalVideos || worldItem._count?.videos || 0;
	const albumsCount = _stats?.totalAlbums || worldItem._count?.albums || 0;
	const collectionsCount = _stats?.totalCollections || worldItem._count?.collections || 0;
	const tagsCount = _stats?.totalTags || worldItem._count?.tags || 0;
	const charactersCount = _stats?.totalCharacters || worldItem._count?.characters || 0;
	const placesCount = _stats?.totalPlaces || worldItem._count?.places || 0;
	const conceptsCount = _stats?.totalConcepts || worldItem._count?.concepts || 0;
	const promptsCount = _stats?.totalPrompts || worldItem._count?.prompts || 0;
	const notesCount = _stats?.totalNotes || worldItem._count?.notes || 0;
	const wildcardsCount = _stats?.totalWildcards || worldItem._count?.wildcards || 0;
	const propertiesCount = _stats?.totalProperties || worldItem._count?.properties || 0;
	const groupsCount = _stats?.totalGroups || worldItem._count?.groups || 0;

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
			className={cn(
				'flex flex-col overflow-hidden border-border relative z-0',
				disabled && 'opacity-70 pointer-events-none',
				interactive && !disabled && 'cursor-pointer hover:shadow-lg transition-shadow duration-300',
				className
			)}
			style={{
				background: 'rgba(0, 0, 0, 0.05)',
				border: tcgMode ? `1px solid ${primaryColor}60` : undefined,
				borderRadius: tcgMode ? '8px' : undefined,
				maxWidth: compact ? 300 : undefined,
				boxShadow: tcgMode ? `0 0 ${rarityGlow}px ${primaryColor}30` : undefined,
				...style,
			}}
			whileHover={!disabled && interactive ? { y: -5 } : {}}
			whileTap={!disabled && interactive && onClick ? { scale: 0.98 } : {}}
			onClick={disabled || !interactive || !onClick ? undefined : () => onClick(worldItem)}
			onKeyDown={handleKeyDown}
			tabIndex={disabled || !interactive || !onClick ? -1 : 0}
			role={onClick && interactive ? 'button' : 'article'}
			aria-label={`Objeto: ${name}`}
			data-world-item-id={id}
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
					background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)`,
				}}
			>
				{/* Efectos TCG */}
				{tcgMode && (
					<>
						{/* Efecto holográfico con gradiente */}
						<div
							className="absolute inset-0 opacity-0 hover:opacity-30 transition-opacity duration-300 pointer-events-none"
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
							className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 opacity-10 pointer-events-none"
							style={{
								background: `radial-gradient(circle, ${rarityColor}50 0%, transparent 70%)`,
							}}
						>
							<div className="w-full h-full flex items-center justify-center">{icon}</div>
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
				<CardHeader title={name} subtitle={type || 'Objeto'} icon={icon} primaryColor={primaryColor} />

				{/* Sección de imágenes */}
				<WorldItemCardImages worldItemId={id} primaryColor={primaryColor} secondaryColor={secondaryColor} />

				{/* Contenido principal */}
				<WorldItemCardContent
					description={description}
					properties={parsedProperties}
					requirements={parsedRequirements}
					attributes={parsedAttributes}
					effects={parsedEffects}
					stats={parsedStats}
					origin={origin}
					rarity={rarity}
					primaryColor={rarityColor}
				/>
				<WorldItemCardFooter
					worldItem={worldItem}
					_totalRelations={_totalRelations}
					primaryColor={rarityColor}
					secondaryColor={secondaryColor || '#000000'}
					intensityFactor={intensityFactor}
					compact={compact}
				/>
			</div>
		</motion.article>
	);
}

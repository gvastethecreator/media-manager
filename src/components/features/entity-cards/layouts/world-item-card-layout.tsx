'use client';

import { VisualizationConfig } from '@/components/features/entity-cards/config/visualization-config';
import type { CardDesignPreset, CardOptions } from '@/components/features/entity-cards/types/base-card-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WorldItem } from '@/types/entities/world-items';
import { ArrowUpRight, Box, Gem, Globe, ImageIcon, PencilIcon, Star, Tag, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { EntityCard } from '../entity-card';
import { usePreset } from '../hooks/use-preset';
import { AnimationSystem } from '../modules/animation/types';
import type { DesignSystem } from '../modules/design/types';
import type { ImageGridImage } from '../modules/image-grid/image-grid';
import { ImageGrid } from './image-grid';

// Opciones visuales optimizadas para objetos del mundo
const DEFAULT_WORLD_ITEM_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: false,

	// Configuración de diseño específica para objetos del mundo
	designSystem: {
		preset: 'item' as CardDesignPreset,
		variant: 'default',
		aspectRatio: '7/10',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: 'soft',
	},

	// Sistema de capas optimizado para objetos del mundo
	layerSystem: {
		order: ['content', 'holographic', 'border', 'filter'],
		blendMode: 'normal',
	},

	// Interactividad específica para objetos del mundo
	interactivity: {
		hover: {
			scale: 1.02,
			rotate: true,
			lift: true,
			glow: true,
		},
		click: {
			feedback: 'scale',
		},
	},

	// Estados específicos para objetos del mundo
	states: {
		loading: {
			skeleton: true,
			blur: true,
		},
		selected: {
			style: 'border',
		},
	},

	// Rendimiento optimizado
	performance: {
		lazyLoad: true,
		imageOptimization: true,
		animationOptimization: true,
		renderQuality: 'high',
	},

	// Configuración visual básica
	hoverLiftHeight: 10,
	maxRotation: 12,
	primaryColor: '0, 153, 255',
	secondaryColor: '128, 0, 255',

	// Contenido y estructura
	contentLayout: 'default',
	contentPadding: 1,
	contentSpacing: 0.5,
	contentAlignment: 'start',
};

// Tipos de rareza para objetos del mundo
const RARITY_TYPES = {
	legendary: {
		min: 90,
		color: 'from-purple-600/20 to-indigo-600/20',
		border: 'border-purple-500/70',
		label: 'Legendario',
		badgeClass: 'bg-gradient-to-r from-purple-500 to-indigo-500',
		barClass: 'bg-gradient-to-r from-purple-500 to-indigo-500',
	},
	epic: {
		min: 70,
		color: 'from-fuchsia-600/20 to-pink-600/20',
		border: 'border-fuchsia-500/70',
		label: 'Épico',
		badgeClass: 'bg-gradient-to-r from-fuchsia-500 to-pink-500',
		barClass: 'bg-gradient-to-r from-fuchsia-500 to-pink-500',
	},
	rare: {
		min: 50,
		color: 'from-sky-500/20 to-blue-600/20',
		border: 'border-sky-500/70',
		label: 'Raro',
		badgeClass: 'bg-gradient-to-r from-sky-500 to-blue-500',
		barClass: 'bg-gradient-to-r from-sky-500 to-blue-500',
	},
	uncommon: {
		min: 20,
		color: 'from-emerald-500/20 to-teal-600/20',
		border: 'border-emerald-500/70',
		label: 'Poco común',
		badgeClass: 'bg-gradient-to-r from-emerald-500 to-teal-500',
		barClass: 'bg-gradient-to-r from-emerald-500 to-teal-500',
	},
	common: {
		min: 1,
		color: 'from-stone-500/20 to-gray-600/20',
		border: 'border-stone-500/70',
		label: 'Común',
		badgeClass: 'bg-gradient-to-r from-stone-500 to-gray-500',
		barClass: 'bg-gradient-to-r from-stone-500 to-gray-500',
	},
	unknown: {
		min: 0,
		color: 'from-slate-500/20 to-gray-600/20',
		border: 'border-slate-500/50',
		label: 'Desconocido',
		badgeClass: 'bg-gradient-to-r from-slate-500 to-gray-500',
		barClass: 'bg-gradient-to-r from-slate-500 to-gray-500',
	},
};

interface WorldItemCardProps {
	worldItem: WorldItem;
	onEdit?: (worldItem: WorldItem) => void;
	onDelete?: (id: string) => void;
	onClick?: () => void;
	className?: string;
	/** Indica si se debe mostrar el botón de configuración visual */
	showVisualConfig?: boolean;
	/** Opciones visuales personalizadas, si no se proporcionan se usarán valores predeterminados */
	visualOptions?: typeof DEFAULT_WORLD_ITEM_OPTIONS;
	/** Activa/desactiva la funcionalidad de vista explosionada */
	enableExplode?: boolean;
}

// Función para obtener la rareza basada en el tipo de rareza del objeto
function getWorldItemRarity(worldItem: WorldItem) {
	const rarityValue = worldItem.rarity?.toLowerCase() || 'common';

	switch (rarityValue) {
		case 'legendary':
			return RARITY_TYPES.legendary;
		case 'epic':
			return RARITY_TYPES.epic;
		case 'rare':
			return RARITY_TYPES.rare;
		case 'uncommon':
			return RARITY_TYPES.uncommon;
		case 'common':
			return RARITY_TYPES.common;
		default:
			return RARITY_TYPES.unknown;
	}
}

// Función para determinar el nivel de potencia del objeto del mundo
function getWorldItemPower(worldItem: WorldItem) {
	const imageCount = worldItem._count?.images || 0;
	const properties = worldItem.properties ? JSON.parse(worldItem.properties as string) : [];
	const stats = worldItem.stats ? JSON.parse(worldItem.stats as string) : {};

	// Valor base según rareza
	let baseValue = 1;
	switch (worldItem.rarity?.toLowerCase()) {
		case 'legendary':
			baseValue = 8;
			break;
		case 'epic':
			baseValue = 6;
			break;
		case 'rare':
			baseValue = 4;
			break;
		case 'uncommon':
			baseValue = 2;
			break;
		default:
			baseValue = 1;
	}

	// Bonus por propiedades y stats
	const propertyBonus = Math.min(3, properties.length);
	const statsBonus = Object.keys(stats).length > 0 ? 1 : 0;

	// Bonus por imágenes
	const imageBonus = Math.min(2, Math.floor(imageCount / 5));

	// Valor entre 1-12
	return Math.max(1, Math.min(12, baseValue + propertyBonus + statsBonus + imageBonus));
}

export function WorldItemCard({
	worldItem,
	onEdit,
	onDelete,
	onClick,
	className,
	showVisualConfig = false,
	visualOptions,
	enableExplode = true,
}: WorldItemCardProps) {
	// Usar el hook para obtener configuración de preset si existe
	const { cardOptions } = usePreset({
		entityType: 'worldItem',
		entityId: worldItem.id,
		presetId: worldItem.presetId || null,
		baseOptions: visualOptions,
	});

	// Estados necesarios
	const [configOpen, setConfigOpen] = React.useState(false);
	const [isExploded, setIsExploded] = React.useState(false);
	const [activeLayer, setActiveLayer] = React.useState<string | null>(null);
	const [isHovered, setIsHovered] = React.useState(false);

	// Crear un objeto compatible usando el patrón de adaptador
	const {
		enable3DEffect,
		enableHolographicEffect,
		enableScanlinesEffect,
		enableGlowEffect,
		enableBorderEffect,
		enableGrainEffect,
		designSystem,
		holographicOptions,
		glowOptions,
		borderOptions,
		grainOptions,
		useImageGrid,
		imageGridLayout,
		imageGridGap,
		imageGridStyle,
		...restOptions
	} = cardOptions;

	// Crear un nuevo objeto compatible
	const compatibleOptions = {
		enable3DEffect,
		enableHolographicEffect,
		enableScanlinesEffect,
		enableGlowEffect,
		enableBorderEffect,
		enableGrainEffect,
		designSystem: designSystem
			? {
					...designSystem,
					preset: designSystem.preset as CardDesignPreset,
				}
			: undefined,
		holographicOptions,
		glowOptions,
		borderOptions,
		grainOptions,
		useImageGrid,
		imageGridLayout,
		imageGridGap,
		imageGridStyle,
		...restOptions,
	};

	// Obtener datos de rareza para el objeto
	const rarityConfig = getWorldItemRarity(worldItem);
	const powerDisplayData = getWorldItemPower(worldItem);

	// Preparamos un array de imágenes compatible con ImageGridImage
	const images: ImageGridImage[] = worldItem.featuredImage
		? [
				{
					id: 'world-item-image',
					src: worldItem.featuredImage,
					alt: worldItem.name,
				},
			]
		: [];

	// Convertimos el designSystem a un formato compatible con el nuevo EntityCard
	const designConfig: DesignSystem = {
		preset: (designSystem?.preset || 'worldItem') as any,
		variant: designSystem?.variant || 'default',
		aspectRatio: designSystem?.aspectRatio || '7/10',
		cornerStyle: designSystem?.cornerStyle || 'rounded',
		cornerRadius: designSystem?.cornerRadius || 12,
		elevation: designSystem?.elevation || 2,
		shadowStyle: designSystem?.shadowStyle || 'soft',
		// Propiedades adicionales requeridas
		padding: 'md',
		maxWidth: '100%',
		shadowColor: 'rgba(0,0,0,0.2)',
		shadowOffset: { x: 0, y: 4 },
		shadowBlur: 8,
		borderWidth: 0,
		borderColor: 'transparent',
		backgroundColor: 'transparent',
		backgroundOpacity: 1,
		glassmorphism: false,
		glassmorphismBlur: 0,
	};

	// Convertimos la animación a un formato compatible
	const animationConfig: AnimationSystem = {
		enabled: true,
		reducedMotion: false,
		transitionDuration: 0.3,
		timingFunction: 'ease',
		entranceAnimation: 'fade',
		exitAnimation: 'fade',
		entranceDelay: 0,
		loopAnimations: false,
		hoverEffect: true,
		hoverScale: 1.02,
		hoverRotate: true,
		hoverLift: true,
		liftHeight: 10,
		maxRotation: 5,
		clickEffect: true,
		activeScale: 0.98,
		activeBrightness: 1.1,
	};

	return (
		<>
			{configOpen && (
				<VisualizationConfig
					onClose={() => setConfigOpen(false)}
					options={cardOptions}
					onOptionsChange={(newOptions) => {
						// No es necesario para la integración inicial
					}}
					entityId={worldItem.id}
					entityType="worldItem"
				/>
			)}

			<div className={cn('relative', className)}>
				<EntityCard
					id={worldItem.id || ''}
					className="world-item-card"
					options={{}}
					title={worldItem.name}
					description={worldItem.description || ''}
					image={images}
					imageLayout={'single'}
					imageStyle={'standard'}
					design={designConfig}
					animation={animationConfig}
					enableLayers={true}
					enableDesign={true}
					enableAnimation={true}
					onClick={onClick}
				>
					{/* Estructura principal de la carta de objeto */}
					<div
						className={cn(
							'relative h-full flex flex-col',
							cardOptions.contentLayout === 'default' && 'justify-between',
							typeof cardOptions.contentPadding === 'number' && `p-${cardOptions.contentPadding}`,
							typeof cardOptions.contentSpacing === 'number' && `gap-${cardOptions.contentSpacing}`
						)}
					>
						{/* Medidor de rareza como círculo en esquina superior izquierda */}
						<div className="absolute top-3 left-3 w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm border-2 flex items-center justify-center z-10 shadow-lg overflow-hidden">
							<div className={cn('absolute inset-0 opacity-70', rarityConfig.badgeClass)} />
							<Gem className="relative w-6 h-6 text-white drop-shadow-sm" />
						</div>

						{/* Nombre del objeto en franja superior */}
						<div className="relative px-3 py-2 bg-background/80 backdrop-blur-md shadow-sm border-b border-border z-10">
							<div className="flex items-center gap-1.5">
								<Box className="h-4 w-4 text-primary" />
								<h3 className="font-bold text-base leading-tight line-clamp-1">{worldItem.name}</h3>
								{worldItem.isFavorite === true && <Star className="h-4 w-4 text-amber-400 ml-auto" />}
							</div>
							<div className="text-xs font-medium text-muted-foreground flex items-center mt-0.5">
								<span>Objeto • {rarityConfig.label}</span>
								{worldItem.type && <span className="ml-1">• {worldItem.type}</span>}
							</div>
						</div>

						{/* Área de ilustración - Imagen destacada o icono */}
						<div className="flex-1 relative">
							{cardOptions.useImageGrid ? (
								<ImageGrid
									layout={'single'}
									gap={4}
									style={'standard'}
									images={[
										{
											id: 'world-item-image',
											src: worldItem.featuredImage || '',
											alt: worldItem.name,
										},
									]}
								/>
							) : (
								<>
									{worldItem.featuredImage ? (
										<div className="absolute inset-0">
											<img src={worldItem.featuredImage} alt={worldItem.name} className="w-full h-full object-cover" />
											<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
										</div>
									) : (
										<div
											className={cn(
												'h-full flex flex-col items-center justify-center',
												'bg-gradient-to-b from-background to-muted/30'
											)}
										>
											<div className="flex items-center justify-center p-4 rounded-full bg-muted/50">
												<Box className="w-16 h-16 text-primary/70" />
											</div>
										</div>
									)}
								</>
							)}

							{/* Categoría como overlay */}
							{worldItem.category && (
								<div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm rounded px-1.5 py-0.5 text-xs flex items-center gap-1 z-10">
									<Tag className="h-3 w-3" />
									<span>{worldItem.category}</span>
								</div>
							)}
						</div>

						{/* Panel con propiedades */}
						<div className="text-xs border-t border-b border-border bg-background/80 backdrop-blur-sm py-1.5 px-3">
							<div className="font-semibold mb-0.5 flex items-center text-[10px] uppercase tracking-wider text-muted-foreground">
								Propiedades
							</div>
							<div className="flex flex-wrap gap-1">
								{properties.length > 0 ? (
									properties.slice(0, 3).map((prop: string) => (
										<span
											key={`prop-${worldItem.id}-${prop}`}
											className="px-1.5 py-0.5 bg-muted rounded-sm text-[10px]"
										>
											{prop}
										</span>
									))
								) : (
									<span className="text-[10px] text-muted-foreground">Sin propiedades</span>
								)}
								{properties.length > 3 && (
									<span className="px-1.5 py-0.5 bg-muted rounded-sm text-[10px]">+{properties.length - 3} más</span>
								)}
							</div>
						</div>

						{/* Área de estadísticas inferior */}
						<div className="bg-background/90 backdrop-blur-md p-3 flex flex-col gap-2">
							{/* Estadísticas principales en grid */}
							<div className="grid grid-cols-3 gap-3">
								<div className="flex flex-col items-center">
									<div className="text-2xl font-bold">{worldItem._count?.images || 0}</div>
									<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
										<ImageIcon className="h-3 w-3" />
										Imágenes
									</div>
								</div>
								<div className="flex flex-col items-center">
									<div className="text-2xl font-bold">{worldItem.type?.substring(0, 4) || '-'}</div>
									<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
										<Box className="h-3 w-3" />
										Tipo
									</div>
								</div>
								<div className="flex flex-col items-center">
									<div className="text-2xl font-bold">{worldItem.origin?.substring(0, 4) || '-'}</div>
									<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
										<Globe className="h-3 w-3" />
										Origen
									</div>
								</div>
							</div>

							{/* Barra de poder */}
							<div className="mt-1 flex items-center justify-between">
								<div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
									<div
										className={cn('h-full rounded-full', rarityConfig.barClass)}
										style={{ width: `${(powerDisplayData / 12) * 100}%` }}
									/>
								</div>
								<div className="ml-2 text-xs font-semibold">{powerDisplayData}/12</div>
							</div>
						</div>

						{/* Acciones - botones flotantes */}
						{(onEdit || onDelete) && (
							<motion.div
								className="absolute bottom-2 right-2 flex gap-1 z-50"
								initial={{ opacity: 0 }}
								animate={{ opacity: isHovered ? 1 : 0 }}
								onHoverStart={() => setIsHovered(true)}
								onHoverEnd={() => setIsHovered(false)}
								onClick={(e: React.MouseEvent) => {
									e.stopPropagation();
								}}
							>
								{onEdit && (
									<Button
										variant="secondary"
										size="icon"
										className="h-8 w-8 shadow-md"
										onClick={() => {
											onEdit(worldItem);
										}}
									>
										<PencilIcon className="h-4 w-4" />
									</Button>
								)}
								{onDelete && (
									<Button
										variant="secondary"
										size="icon"
										className="h-8 w-8 shadow-md text-destructive"
										onClick={() => {
											if (worldItem.id) {
												onDelete(worldItem.id);
											}
										}}
									>
										<Trash2 className="h-4 w-4" />
									</Button>
								)}
							</motion.div>
						)}

						{/* Botón de explorar en hover */}
						{onClick && (
							<motion.div
								className="absolute inset-0 flex items-center justify-center z-40"
								initial={{ opacity: 0 }}
								animate={{ opacity: isHovered ? 1 : 0 }}
								onHoverStart={() => setIsHovered(true)}
								onHoverEnd={() => setIsHovered(false)}
								onClick={(e: React.MouseEvent) => {
									if ((e.target as HTMLElement).closest('button')) {
										e.stopPropagation();
									}
								}}
							>
								<motion.div
									className="bg-black/60 backdrop-blur-md rounded-full p-4 text-white shadow-lg"
									initial={{ scale: 0.8 }}
									animate={{ scale: 1 }}
									transition={{ duration: 0.2 }}
								>
									<ArrowUpRight className="h-8 w-8" />
								</motion.div>
							</motion.div>
						)}
					</div>
				</EntityCard>
			</div>
		</>
	);
}

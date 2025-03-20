'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WorldItem } from '@/types/entities/world-items';
import {
	Backpack,
	BookOpen,
	Box,
	Calendar,
	Gem,
	GripVertical,
	HeartPulse,
	PencilIcon,
	Scroll,
	Shield,
	Sparkles,
	Star,
	Swords,
	Trash2
} from 'lucide-react';
import { useCallback, useMemo } from 'react';

// Importar componentes base
import {
	CardDescriptionSection,
	CardFooter,
	CardHeader,
	CardImageSection,
	CardMetadataSection
} from '../base';

// Importar tipos y utilidades
import { EntityCardWrapper } from '../entity-card-wrapper';
import { usePreset } from '../hooks/use-preset';
import { adaptCardOptions } from '../types';
import type { CardOptions } from '../types/unified-card-types';

import '../styles/world-item-card.css';

// TIPOS DE DATOS
// ==============================

// Define niveles de rareza para objetos con estilo RPG
interface ItemRarity {
	color: string;
	borderColor: string;
	glowColor: string;
	label: string;
	rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'artifact';
	stars: number;
	textureType: string;
	glowIntensity: number;
	textureOpacity: number;
	holographic?: boolean;
	borderAnimation?: string;
}

const ITEM_RARITY: Record<string, ItemRarity> = {
	common: {
		color: '#9ca3af',
		borderColor: 'rgba(156, 163, 175, 0.8)',
		glowColor: 'rgba(156, 163, 175, 0.6)',
		label: 'Común',
		rarity: 'common' as const,
		stars: 1,
		textureType: 'noise',
		glowIntensity: 0.4,
		textureOpacity: 0.15
	},
	uncommon: {
		color: '#22c55e',
		borderColor: 'rgba(34, 197, 94, 0.8)',
		glowColor: 'rgba(34, 197, 94, 0.6)',
		label: 'Poco Común',
		rarity: 'uncommon' as const,
		stars: 2,
		textureType: 'dots',
		glowIntensity: 0.5,
		textureOpacity: 0.2
	},
	rare: {
		color: '#3b82f6',
		borderColor: 'rgba(59, 130, 246, 0.8)',
		glowColor: 'rgba(59, 130, 246, 0.6)',
		label: 'Raro',
		rarity: 'rare' as const,
		stars: 3,
		textureType: 'grid',
		glowIntensity: 0.65,
		textureOpacity: 0.25,
		borderAnimation: 'pulse'
	},
	epic: {
		color: '#8b5cf6',
		borderColor: 'rgba(139, 92, 246, 0.8)',
		glowColor: 'rgba(139, 92, 246, 0.6)',
		label: 'Épico',
		rarity: 'epic' as const,
		stars: 4,
		textureType: 'sparkle',
		glowIntensity: 0.8,
		textureOpacity: 0.3,
		borderAnimation: 'pulse'
	},
	legendary: {
		color: '#eab308',
		borderColor: 'rgba(234, 179, 8, 0.8)',
		glowColor: 'rgba(234, 179, 8, 0.7)',
		label: 'Legendario',
		rarity: 'legendary' as const,
		stars: 5,
		holographic: true,
		textureType: 'sparkle',
		glowIntensity: 0.9,
		textureOpacity: 0.35,
		borderAnimation: 'flow'
	},
	artifact: {
		color: '#d946ef',
		borderColor: 'rgba(217, 70, 239, 0.8)',
		glowColor: 'rgba(217, 70, 239, 0.7)',
		label: 'Artefacto',
		rarity: 'artifact' as const,
		stars: 6,
		holographic: true,
		textureType: 'rainbow',
		glowIntensity: 1,
		textureOpacity: 0.4,
		borderAnimation: 'rainbow'
	},
};

// Tipos de objetos con sus iconos y colores
interface ItemType {
	type: string;
	icon: React.ReactNode;
	color: string;
	className: string;
}

const ITEM_TYPES: Record<string, ItemType> = {
	weapon: {
		type: 'weapon',
		icon: <Swords className="h-5 w-5" />,
		color: '#ef4444',
		className: 'item-type-weapon'
	},
	armor: {
		type: 'armor',
		icon: <Shield className="h-5 w-5" />,
		color: '#3b82f6',
		className: 'item-type-armor'
	},
	consumable: {
		type: 'consumable',
		icon: <HeartPulse className="h-5 w-5" />,
		color: '#22c55e',
		className: 'item-type-consumable'
	},
	accessory: {
		type: 'accessory',
		icon: <Gem className="h-5 w-5" />,
		color: '#8b5cf6',
		className: 'item-type-accessory'
	},
	quest: {
		type: 'quest',
		icon: <Scroll className="h-5 w-5" />,
		color: '#eab308',
		className: 'item-type-quest'
	},
	book: {
		type: 'book',
		icon: <BookOpen className="h-5 w-5" />,
		color: '#10b981',
		className: 'item-type-book'
	},
	container: {
		type: 'container',
		icon: <Backpack className="h-5 w-5" />,
		color: '#f59e0b',
		className: 'item-type-container'
	},
	miscellaneous: {
		type: 'miscellaneous',
		icon: <Box className="h-5 w-5" />,
		color: '#6b7280',
		className: 'item-type-miscellaneous'
	},
};

// Configuración predeterminada para tarjetas de objetos
const DEFAULT_WORLD_ITEM_OPTIONS: Partial<CardOptions> = {
	// Efectos principales
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: true,

	// Configuración de diseño específica para objetos
	designSystem: {
		preset: 'worldItem',
		variant: 'rpg',
		aspectRatio: '3/4', // Proporción similar a cartas de objetos en RPGs
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft',
	},

	// Efectos específicos para objetos
	holographicOptions: {
		patternType: 'geometric',
		intensity: 0.6,
		animationSpeed: 1.2,
		visibleOnHover: true,
	},

	glowOptions: {
		intensity: 0.7,
		size: 20,
		blurAmount: 15,
		animationType: 'pulse',
		pulseSpeed: 2.5,
		visibleOnHover: true,
	},

	borderOptions: {
		width: 2,
		pattern: 'gradient',
		animationType: 'pulse',
		animation: {
			type: 'flow',
			duration: 3000,
			timing: 'ease-in-out',
			iteration: 'infinite',
		},
		glowIntensity: 0.7,
	},

	grainOptions: {
		intensity: 0.15,
		density: 0.6,
		contrast: 1.2,
		noise: 'subtle',
		animated: true,
		visibleOnHover: true,
	},

	// Parámetros de interactividad
	interactivity: {
		enableHoverEffects: true,
		enableClickEffects: true,
		hover: {
			scale: 1.05,
			rotate: true,
			lift: true,
			glow: true,
		}
	},

	// Configuración de estados
	states: {
		enableHover: true,
		stateDuration: 300,
	},

	// Animación
	maxRotation: 15,
};

// Add PropertyItem type
interface PropertyItem {
	name: string;
	value?: string | number;
	isSpecial?: boolean;
}

// Add WorldItemExtended type that extends WorldItem with properties we need
interface WorldItemExtended extends Omit<WorldItem, 'properties' | 'stats' | 'requirements'> {
	level?: number;
	weight?: number;
	value?: number;
	image?: string;
	isArtifact?: boolean;
	isUnique?: boolean;
	properties?: PropertyItem[];
	imageCount?: number;
	presetId?: string;
}

// Update props to use the extended type
export interface WorldItemCardProps {
	item: WorldItemExtended;
	options?: Partial<CardOptions>;
	onClick?: () => void;
	showVisualConfig?: boolean;
	onVisualConfigClick?: () => void;
	enableExplode?: boolean;
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
	className?: string;
	onEdit?: (item: WorldItemExtended) => void;
	onDelete?: (id: string) => void;
}

// UTILIDADES Y COMPONENTES AUXILIARES
// ==============================

// Componente para mostrar estrellas de rareza
function RarityStars({ count }: { count: number }) {
	return (
		<div className="flex items-center justify-center mt-1">
			{Array.from({ length: count }).map((_, i) => (
				<Star
					key={`star-${i}-${count}`}
					className={cn(
						"h-3 w-3 mx-0.5",
						count >= 6 ? "text-fuchsia-400" :
							count >= 5 ? "text-yellow-400" :
								count >= 4 ? "text-purple-400" :
									count >= 3 ? "text-blue-400" :
										count >= 2 ? "text-green-400" :
											"text-gray-400"
					)}
					fill="currentColor"
				/>
			))}
		</div>
	);
}

// Determinar la rareza basada en el nivel y las propiedades del objeto
function calculateItemRarity(item: WorldItemExtended): keyof typeof ITEM_RARITY {
	const level = item.level || 1;
	const value = item.value || 0;

	// Considerar otros atributos que podrían indicar la rareza del objeto
	const isArtifact = item.isArtifact || false;
	const isUnique = item.isUnique || false;
	const hasSpecialProperties = item.properties?.some(p => p.isSpecial) || false;

	if (isArtifact) return 'artifact';
	if (level >= 80 || isUnique) return 'legendary';
	if (level >= 60 || (hasSpecialProperties && level >= 40)) return 'epic';
	if (level >= 40 || (hasSpecialProperties && level >= 20)) return 'rare';
	if (level >= 20 || value >= 500) return 'uncommon';
	return 'common';
}

// Generar configuración de rareza para un objeto
function generateItemRarityConfig(item: WorldItemExtended) {
	const rarityKey = calculateItemRarity(item);
	const rarity = ITEM_RARITY[rarityKey];

	return {
		enabled: true,
		rarity: rarityKey,
		color: rarity.color,
		borderColor: rarity.borderColor,
		glowColor: rarity.glowColor,
		borderStyle: 'solid',
		borderWidth: 2,
		frameType: 'standard',
	};
}

// Determinar el tipo de objeto y obtener su información
function getItemTypeInfo(item: WorldItemExtended): ItemType {
	const type = item.type?.toLowerCase() || 'miscellaneous';
	return ITEM_TYPES[type] || ITEM_TYPES.miscellaneous;
}

// COMPONENTE PRINCIPAL
// ==============================
export function WorldItemCardLayout({
	item: initialItem,
	options = {},
	onClick,
	showVisualConfig = false,
	onVisualConfigClick,
	enableExplode = false,
	isExploded,
	activeLayer,
	onExplodedChange,
	onActiveLayerChange,
	className,
	onEdit,
	onDelete,
}: WorldItemCardProps) {
	// Garantizar que nunca procesamos un objeto undefined
	const item = initialItem || {
		id: 'placeholder',
		name: 'Objeto sin nombre',
		emoji: '',
		color: '#6b7280',
		description: 'Sin descripción',
		type: 'miscellaneous',
		level: 1,
		weight: 0,
		value: 0,
		properties: [],
		createdAt: new Date(),
		updatedAt: new Date(),
	} as WorldItemExtended;

	// Usar el hook para obtener configuración de preset
	const { cardOptions } = usePreset({
		entityType: 'worldItem',
		entityId: item.id,
		presetId: 'presetId' in item && item.presetId ? item.presetId : null,
		baseOptions: options,
	});

	// Configurar las capas para el modo explode
	const explodeLayers = [
		{ id: 'background', label: 'Fondo', icon: <Backpack className="h-4 w-4" /> },
		{ id: 'frame', label: 'Marco', icon: <Box className="h-4 w-4" /> },
		{ id: 'image', label: 'Imagen', icon: <Gem className="h-4 w-4" /> },
		{ id: 'stats', label: 'Estadísticas', icon: <GripVertical className="h-4 w-4" /> },
		{ id: 'effects', label: 'Efectos', icon: <Sparkles className="h-4 w-4" /> },
	];

	// Obtener la rareza del objeto
	const rarityKey = calculateItemRarity(item);
	const rarityInfo = ITEM_RARITY[rarityKey];
	const rarityConfig = generateItemRarityConfig(item);
	const rarityClass = `item-card-rarity-${rarityKey}`;

	// Obtener información sobre el tipo de objeto
	const itemTypeInfo = getItemTypeInfo(item);

	// Manejadores de eventos
	const handleEdit = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEdit && item) {
			onEdit(item);
		}
	}, [onEdit, item]);

	const handleDelete = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete && item?.id) {
			onDelete(item.id);
		}
	}, [onDelete, item?.id]);

	// Generar configuración avanzada basada en la rareza
	const enhancedCardOptions = useMemo(() => {
		// Valores por defecto
		const defaults = DEFAULT_WORLD_ITEM_OPTIONS;

		// Ajustar intensidad de efectos según rareza
		const intensity = rarityInfo.glowIntensity || 0.5;

		// Habilitar efectos especiales para objetos especiales
		const isSpecial = rarityKey === 'legendary' || rarityKey === 'artifact' || rarityKey === 'epic';

		// Crear opciones combinadas
		return {
			...defaults,
			enableHolographicEffect: isSpecial,
			enableScanlinesEffect: isSpecial,

			// Configurar glows basados en rareza
			glowOptions: {
				...(defaults.glowOptions || {}),
				intensity: intensity,
				color: rarityInfo.glowColor,
				size: 20 + (rarityInfo.stars * 2),
				visibleOnIdle: rarityKey === 'artifact',
				animationType: isSpecial ? 'pulse' : 'static',
			},

			// Configurar bordes animados
			borderOptions: {
				...(defaults.borderOptions || {}),
				width: rarityInfo.stars * 0.5,
				color: rarityInfo.borderColor,
				pattern: isSpecial ? 'gradient' : 'solid',
				animationType: rarityInfo.borderAnimation || 'none',
				glowIntensity: intensity,
			},

			// Configurar texturas específicas
			textureConfig: {
				type: rarityInfo.textureType || 'noise',
				intensity: rarityInfo.textureOpacity || 0.15,
				scale: 1 + (rarityInfo.stars * 0.1),
				blendMode: 'overlay',
			},

			// Configuración de rareza
			rarityConfig,

			// Efectos adicionales
			effects: {
				...(defaults.effects || {}),
				chromaticAberration: {
					enabled: isSpecial,
					visibleOnHover: true,
					intensity: rarityKey === 'artifact' ? 0.4 : 0.2,
				},
				noiseTexture: {
					enabled: true,
					visibleOnHover: !isSpecial,
					intensity: rarityInfo.textureOpacity || 0.15,
				},
				glitchEffect: {
					enabled: rarityKey === 'artifact',
					visibleOnHover: true,
					intensity: 0.3,
					frequency: 0.1,
				},
			},
		};
	}, [rarityKey, rarityInfo, rarityConfig]);

	// Formatear fecha
	const formattedDate = useMemo(() => {
		if (!item.createdAt) return '';

		const date = typeof item.createdAt === 'string'
			? new Date(item.createdAt)
			: item.createdAt;

		return date.toLocaleDateString();
	}, [item.createdAt]);

	// Procesar las estadísticas y propiedades del objeto
	const itemStats = useMemo(() => {
		const stats = [];

		if (item.level !== undefined) {
			stats.push({
				label: 'Nivel',
				value: item.level.toString(),
				icon: <Star className="h-3.5 w-3.5 text-yellow-400" />
			});
		}

		if (item.value !== undefined) {
			stats.push({
				label: 'Valor',
				value: item.value.toString(),
				icon: <Gem className="h-3.5 w-3.5 text-purple-400" />
			});
		}

		if (item.weight !== undefined) {
			stats.push({
				label: 'Peso',
				value: item.weight.toString(),
				icon: <GripVertical className="h-3.5 w-3.5 text-gray-400" />
			});
		}

		return stats;
	}, [item.level, item.value, item.weight]);

	// Obtener las propiedades especiales del objeto
	const itemProperties = useMemo(() => {
		if (!item.properties || !item.properties.length) return [];

		return item.properties.map(prop => ({
			label: prop.name,
			value: prop.value?.toString() || '',
			icon: <Sparkles className={cn(
				"h-3.5 w-3.5",
				prop.isSpecial ? "text-yellow-400" : "text-blue-400"
			)} />
		}));
	}, [item.properties]);

	return (
		<div className={cn(
			'world-item-card-container relative w-full h-full group',
			rarityClass,
			onClick && 'cursor-pointer',
			className
		)}>
			<EntityCardWrapper
				title={item.name}
				description={item.description || ''}
				entityId={item.id}
				entityType="worldItem"
				className={cn('world-item-card-wrapper relative w-full h-full', rarityClass)}
				options={adaptCardOptions(enhancedCardOptions)}
				showVisualConfig={showVisualConfig}
				onVisualConfigClick={onVisualConfigClick}
				enableExplode={enableExplode}
				isExploded={isExploded}
				activeLayer={activeLayer}
				onExplodedChange={onExplodedChange}
				onActiveLayerChange={onActiveLayerChange}
				explodeLayers={explodeLayers}
				onClick={onClick}
			>
				<div className="world-item-card-content flex flex-col h-full w-full relative">
					{/* Cabecera con el tipo y nombre del objeto */}
					<CardHeader
						title={item.name}
						entityType="worldItem"
						className="mb-2 relative z-10"
						showIcon={false}
						rightContent={
							<>
								<div className={cn(
									"item-rarity px-2 py-0.5 rounded-full text-[10px] font-medium",
									rarityKey === 'artifact' ? "bg-fuchsia-500/20 text-fuchsia-200" :
										rarityKey === 'legendary' ? "bg-amber-500/20 text-amber-200" :
											rarityKey === 'epic' ? "bg-purple-500/20 text-purple-200" :
												rarityKey === 'rare' ? "bg-blue-500/20 text-blue-200" :
													rarityKey === 'uncommon' ? "bg-green-500/20 text-green-200" :
														"bg-gray-500/20 text-gray-200"
								)}>
									{ITEM_RARITY[rarityKey].label}
								</div>

								<RarityStars count={rarityInfo.stars} />

								{/* Botones de acción */}
								{(onEdit || onDelete) && (
									<div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto z-50">
										{onEdit && (
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7 p-0 bg-background/80"
												onClick={handleEdit}
											>
												<PencilIcon className="h-3.5 w-3.5" />
											</Button>
										)}
										{onDelete && (
											<Button
												size="icon"
												variant="ghost"
												className="h-7 w-7 p-0 bg-background/80 hover:bg-destructive/20"
												onClick={handleDelete}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</Button>
										)}
									</div>
								)}
							</>
						}
					/>

					{/* Item type icon */}
					<div className="flex items-center ml-3 -mt-2 mb-2">
						<div className={cn(
							"item-type-icon flex items-center justify-center w-10 h-10 rounded-full border-2 bg-background shadow-md"
						)}
							style={{ borderColor: itemTypeInfo.color }}>
							<div style={{ color: itemTypeInfo.color }}>
								{itemTypeInfo.icon}
							</div>
						</div>
					</div>

					{/* Imagen del objeto */}
					<div className={cn(
						"item-image relative h-32 mb-3 rounded overflow-hidden border",
						`border-${rarityKey === 'artifact' ? 'fuchsia' :
							rarityKey === 'legendary' ? 'amber' :
								rarityKey === 'epic' ? 'purple' :
									rarityKey === 'rare' ? 'blue' :
										rarityKey === 'uncommon' ? 'green' : 'gray'}-500`,
					)}>
						{item.image ? (
							<CardImageSection
								imageUrl={item.image}
								alt={item.name}
								aspectRatio="wide"
								overlayContent={
									<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
								}
							/>
						) : (
							<div className={cn(
								"absolute inset-0 bg-gradient-to-br",
								rarityKey === 'artifact' ? "from-fuchsia-500/20 to-purple-900/40" :
									rarityKey === 'legendary' ? "from-amber-500/20 to-yellow-900/40" :
										rarityKey === 'epic' ? "from-purple-500/20 to-purple-900/40" :
											rarityKey === 'rare' ? "from-blue-500/20 to-blue-900/40" :
												rarityKey === 'uncommon' ? "from-green-500/20 to-green-900/40" :
													"from-gray-500/20 to-gray-900/40"
							)}>
								{/* Patrón decorativo según la rareza */}
								<div className={cn(
									"absolute inset-0 opacity-10 mix-blend-overlay",
									rarityKey === 'artifact' || rarityKey === 'legendary' ? "bg-sparkle-pattern" : "bg-noise-pattern"
								)} />
							</div>
						)}

						{/* Icono central si no hay imagen */}
						{!item.image && (
							<div className="absolute inset-0 flex items-center justify-center">
								{itemTypeInfo.icon}
							</div>
						)}
					</div>

					{/* Estadísticas del objeto */}
					<div className="item-stats-container mb-2">
						<div className="text-xs font-medium mb-1 flex items-center">
							<GripVertical className="h-3 w-3 mr-1" />
							Estadísticas
						</div>
						<CardMetadataSection
							items={itemStats}
							className="grid-cols-3 gap-1 text-xs"
						/>
					</div>

					{/* Propiedades especiales del objeto */}
					{itemProperties.length > 0 && (
						<div className="item-properties-container mb-2">
							<div className="text-xs font-medium mb-1 flex items-center">
								<Sparkles className="h-3 w-3 mr-1" />
								Propiedades
							</div>
							<CardMetadataSection
								items={itemProperties}
								className="grid-cols-2 gap-1 text-xs"
							/>
						</div>
					)}

					{/* Descripción del objeto */}
					<CardDescriptionSection
						description={item.description || 'Sin descripción disponible'}
						maxLines={4}
						className="flex-grow relative p-1.5 text-xs border border-stone-800/30 rounded bg-card/80"
					/>

					{/* Pie de la tarjeta con información adicional */}
					<CardFooter
						className="mt-2 text-xs"
						leftContent={
							<div className={cn(
								"item-type px-3 py-1 rounded-full text-[10px] font-medium",
								"bg-indigo-500/10 text-indigo-100"
							)}>
								{item.type || 'Misceláneo'}
							</div>
						}
						rightContent={
							<div className="flex items-center gap-1">
								<Calendar className="h-3 w-3 opacity-70" />
								<span className="text-[10px] opacity-70">{formattedDate}</span>
							</div>
						}
					/>
				</div>
			</EntityCardWrapper>
		</div>
	);
}

// Componente público para usar en la aplicación
export function WorldItemCard(props: WorldItemCardProps) {
	return <WorldItemCardLayout {...props} />;
}
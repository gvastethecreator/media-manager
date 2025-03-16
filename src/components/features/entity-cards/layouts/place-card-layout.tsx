'use client';

import type { RarityConfig } from '@/components/features/entity-cards/types/base-card-types';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Place } from '@/types/entities/places';
import {
	ArrowUpRight,
	Cloud,
	Globe,
	ImageIcon,
	MapPin,
	PencilIcon,
	Star,
	Thermometer,
	Trash2,
	Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import * as React from 'react';
import { VisualizationConfig } from '../config/visualization-config';
import { EntityCardWrapper } from '../entity-card-wrapper';
import { usePreset } from '../hooks/use-preset';
import { ImageGrid } from './image-grid';

// Opciones visuales optimizadas para lugares
const DEFAULT_PLACE_OPTIONS = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: false,

	// Configuración de diseño específica para lugares
	designSystem: {
		preset: 'place',
		variant: 'default',
		aspectRatio: '7/10',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: 'soft',
	},

	// Sistema de capas optimizado para lugares
	layerSystem: {
		order: ['content', 'holographic', 'border', 'filter'],
		layerBlending: 'normal',
	},

	// Interactividad específica para lugares
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

	// Estados específicos para lugares
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
	primaryColor: '56, 189, 248',
	secondaryColor: '236, 72, 153',

	// Contenido y estructura
	contentLayout: 'stats-focus',
	contentPadding: '1rem',
	contentSpacing: '0.5rem',
	contentAlignment: 'start',
};

// Tipos de clima con colores personalizados
const CLIMATE_TYPES = {
	arctic: {
		color: 'from-blue-600/20 to-sky-600/20',
		border: 'border-blue-500/70',
		label: 'Ártico',
		badgeClass: 'bg-gradient-to-r from-blue-500 to-sky-500',
		barClass: 'bg-gradient-to-r from-blue-500 to-sky-500',
		icon: <Cloud className="h-4 w-4" />,
	},
	cold: {
		color: 'from-cyan-600/20 to-teal-600/20',
		border: 'border-cyan-500/70',
		label: 'Frío',
		badgeClass: 'bg-gradient-to-r from-cyan-500 to-teal-500',
		barClass: 'bg-gradient-to-r from-cyan-500 to-teal-500',
		icon: <Cloud className="h-4 w-4" />,
	},
	temperate: {
		color: 'from-emerald-600/20 to-green-600/20',
		border: 'border-emerald-500/70',
		label: 'Templado',
		badgeClass: 'bg-gradient-to-r from-emerald-500 to-green-500',
		barClass: 'bg-gradient-to-r from-emerald-500 to-green-500',
		icon: <Thermometer className="h-4 w-4" />,
	},
	warm: {
		color: 'from-yellow-600/20 to-amber-600/20',
		border: 'border-yellow-500/70',
		label: 'Cálido',
		badgeClass: 'bg-gradient-to-r from-yellow-500 to-amber-500',
		barClass: 'bg-gradient-to-r from-yellow-500 to-amber-500',
		icon: <Thermometer className="h-4 w-4" />,
	},
	hot: {
		color: 'from-orange-600/20 to-red-600/20',
		border: 'border-orange-500/70',
		label: 'Caluroso',
		badgeClass: 'bg-gradient-to-r from-orange-500 to-red-500',
		barClass: 'bg-gradient-to-r from-orange-500 to-red-500',
		icon: <Thermometer className="h-4 w-4" />,
	},
	desert: {
		color: 'from-amber-600/20 to-yellow-600/20',
		border: 'border-amber-500/70',
		label: 'Desértico',
		badgeClass: 'bg-gradient-to-r from-amber-500 to-yellow-500',
		barClass: 'bg-gradient-to-r from-amber-500 to-yellow-500',
		icon: <Thermometer className="h-4 w-4" />,
	},
	tropical: {
		color: 'from-lime-600/20 to-green-600/20',
		border: 'border-lime-500/70',
		label: 'Tropical',
		badgeClass: 'bg-gradient-to-r from-lime-500 to-green-500',
		barClass: 'bg-gradient-to-r from-lime-500 to-green-500',
		icon: <Cloud className="h-4 w-4" />,
	},
	unknown: {
		color: 'from-slate-500/20 to-gray-600/20',
		border: 'border-slate-500/50',
		label: 'Desconocido',
		badgeClass: 'bg-gradient-to-r from-slate-500 to-gray-500',
		barClass: 'bg-gradient-to-r from-slate-500 to-gray-500',
		icon: <Thermometer className="h-4 w-4" />,
	},
};

interface PlaceCardProps {
	place: Place;
	onEdit?: (place: Place) => void;
	onDelete?: (id: string) => void;
	onClick?: () => void;
	className?: string;
	/** Indica si se debe mostrar el botón de configuración visual */
	showVisualConfig?: boolean;
	/** Opciones visuales personalizadas, si no se proporcionan se usarán valores predeterminados */
	visualOptions?: typeof DEFAULT_PLACE_OPTIONS;
	/** Activa/desactiva la funcionalidad de vista explosionada */
	enableExplode?: boolean;
}

// Función para obtener el clima del lugar
function getPlaceClimate(place: Place) {
	const climateValue = place.climate?.toLowerCase() || 'unknown';

	switch (climateValue) {
		case 'arctic':
		case 'polar':
		case 'freezing':
			return CLIMATE_TYPES.arctic;
		case 'cold':
		case 'cool':
		case 'chilly':
			return CLIMATE_TYPES.cold;
		case 'temperate':
		case 'moderate':
		case 'mild':
			return CLIMATE_TYPES.temperate;
		case 'warm':
		case 'pleasant':
			return CLIMATE_TYPES.warm;
		case 'hot':
		case 'scorching':
		case 'burning':
			return CLIMATE_TYPES.hot;
		case 'desert':
		case 'arid':
		case 'dry':
			return CLIMATE_TYPES.desert;
		case 'tropical':
		case 'humid':
		case 'jungle':
			return CLIMATE_TYPES.tropical;
		default:
			return CLIMATE_TYPES.unknown;
	}
}

// Función para calcular la "importancia" del lugar
function getPlaceImportance(place: Place) {
	const imageCount = place._count?.images || 0;
	const population = place.population || 0;

	// Valor base por población
	let baseValue = 1;
	if (population > 1000000) {
		baseValue = 8;
	} else if (population > 100000) {
		baseValue = 6;
	} else if (population > 10000) {
		baseValue = 4;
	} else if (population > 1000) {
		baseValue = 2;
	}

	// Recursos y peligros
	const resources = place.resources ? JSON.parse(place.resources as string) : [];
	const dangers = place.dangers ? JSON.parse(place.dangers as string) : [];

	const resourceBonus = Math.min(2, Math.floor(resources.length / 2));
	const dangerBonus = Math.min(2, Math.floor(dangers.length / 2));

	// Bonus por cantidad de imágenes
	const imageBonus = Math.min(1, Math.floor(imageCount / 3));

	// Valor entre 1-12
	return Math.max(1, Math.min(12, baseValue + resourceBonus + dangerBonus + imageBonus));
}

// Función para formatear población
function formatPopulation(population: number | undefined) {
	if (population === undefined || population === null) {
		return '-';
	}
	if (population === 0) {
		return '0';
	}

	if (population >= 1000000) {
		return `${(population / 1000000).toFixed(1)}M`;
	}
	if (population >= 1000) {
		return `${(population / 1000).toFixed(1)}K`;
	}
	return population.toString();
}

export function PlaceCard({
	place,
	onEdit,
	onDelete,
	onClick,
	className,
	showVisualConfig = false,
	visualOptions,
	enableExplode = true,
}: PlaceCardProps) {
	// Verificar si place existe y tiene las propiedades necesarias
	if (!place) {
		console.warn('PlaceCard: Se recibió un objeto place indefinido');
		// Crear un place por defecto para evitar errores
		place = {
			id: 'placeholder',
			name: 'Lugar sin nombre',
			description: 'Sin descripción',
			type: 'Unknown',
			climate: 'temperate',
			createdAt: new Date(),
			updatedAt: new Date(),
		} as Place;
	}

	// Usar el hook para obtener configuración de preset si existe
	const { cardOptions } = usePreset({
		entityType: 'place',
		entityId: place.id,
		presetId: place.presetId || null,
		baseOptions: visualOptions,
	});

	// Configurar las capas para el modo explode
	const explodeLayers = [
		{
			id: 'background',
			label: 'Fondo',
			icon: <MapPin className="h-4 w-4" />,
		},
		{
			id: 'content',
			label: 'Contenido',
			icon: <MapPin className="h-4 w-4" />,
		},
		{
			id: 'frame',
			label: 'Marco',
			icon: <Globe className="h-4 w-4" />,
		},
	];

	// Estado para la configuración visual
	const [configOpen, setConfigOpen] = React.useState(false);
	const [isExploded, setIsExploded] = React.useState(false);
	const [activeLayer, setActiveLayer] = React.useState<string | null>(null);

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
					preset: designSystem.preset,
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

	// Obtener datos de clima y configuración de rareza para el lugar
	const climate = React.useMemo(() => getPlaceClimate(place), [place]);
	const importance = React.useMemo(() => getPlaceImportance(place), [place]);

	// Parsear datos JSON
	const resources = React.useMemo(() => {
		try {
			return JSON.parse(place.resources || '[]');
		} catch {
			return [];
		}
	}, [place.resources]);

	// Generar configuración de rareza basada en el clima
	const rarityConfig: RarityConfig = {
		name: climate.label.toLowerCase(),
		color: climate.badgeClass.split('from-')[1].split(' ')[0],
		borderWidth: 2,
		borderEffect: importance > 8 ? 'animated' : 'static',
		glowColor: importance > 8 ? climate.barClass.split('from-')[1].split(' ')[0] : undefined,
	};

	return (
		<>
			{configOpen && (
				<VisualizationConfig
					onClose={() => setConfigOpen(false)}
					options={cardOptions as any}
					onOptionsChange={(newOptions) => {
						const typedOptions = newOptions as any;
						// Este componente viene del hook usePreset, que gestiona el estado
					}}
					entityId={place.id}
					entityType="place"
				/>
			)}

			<div className={cn('relative', className)}>
				<EntityCardWrapper
					className="place-card"
					entityType="place"
					options={compatibleOptions}
					onClick={onClick}
					showVisualizationConfig={showVisualConfig}
					onVisualizationConfigClick={() => setConfigOpen(true)}
					enableExplode={enableExplode}
					explodeLayers={explodeLayers}
					isExploded={isExploded}
					activeLayer={activeLayer}
					onExplodedChange={setIsExploded}
					onActiveLayerChange={setActiveLayer}
				>
					{/* Estructura principal de la carta de lugar */}
					<div className="place-card-content">
						{/* Indicador de clima como círculo en esquina superior izquierda */}
						<div className="absolute top-3 left-3 w-12 h-12 rounded-full bg-background/90 backdrop-blur-sm border-2 flex items-center justify-center z-10 shadow-lg overflow-hidden">
							<div className={cn('absolute inset-0 opacity-70', climate.badgeClass)} />
							{climate.icon}
						</div>

						{/* Nombre del lugar en franja superior */}
						<div className="relative px-3 py-2 bg-background/80 backdrop-blur-md shadow-sm border-b border-border z-10">
							<div className="flex items-center gap-1.5">
								<MapPin className="h-4 w-4 text-primary" />
								<h3 className="font-bold text-base leading-tight line-clamp-1">{place.name}</h3>
								{place.isFavorite === true && <Star className="h-4 w-4 text-amber-400 ml-auto" />}
							</div>
							<div className="text-xs font-medium text-muted-foreground flex items-center mt-0.5">
								<span>
									{place.type || 'Lugar'} • {climate.label}
								</span>
							</div>
						</div>

						{/* Área de ilustración - Imagen destacada o icono */}
						<div className="flex-1 relative">
							{useImageGrid ? (
								<ImageGrid
									layout={imageGridLayout || 'single'}
									gap={imageGridGap || 4}
									style={imageGridStyle || 'standard'}
									images={[
										{
											id: 'place-image',
											path: place.featuredImage || '',
											thumbnail: place.featuredImage || '',
										},
									]}
								/>
							) : (
								<>
									{place.featuredImage ? (
										<div className="absolute inset-0">
											<img src={place.featuredImage} alt={place.name} className="w-full h-full object-cover" />
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
												<Globe className="w-16 h-16 text-primary/70" />
											</div>
											<div className="mt-3 px-4 text-center">
												<p className="text-xs text-muted-foreground">
													{place.description || 'Sin descripción disponible'}
												</p>
											</div>
										</div>
									)}
								</>
							)}

							{/* Región como overlay */}
							{place.region && (
								<div className="absolute top-2 right-2 bg-background/70 backdrop-blur-sm rounded px-1.5 py-0.5 text-xs flex items-center gap-1 z-10">
									<Globe className="h-3 w-3" />
									<span>{place.region}</span>
								</div>
							)}
						</div>

						{/* Panel con recursos */}
						<div className="text-xs border-t border-b border-border bg-background/80 backdrop-blur-sm py-1.5 px-3">
							<div className="font-semibold mb-0.5 flex items-center text-[10px] uppercase tracking-wider text-muted-foreground">
								Recursos
							</div>
							<div className="flex flex-wrap gap-1">
								{resources.length > 0 ? (
									resources.slice(0, 3).map((resource: string) => (
										<span
											key={`resource-${place.id}-${resource}`}
											className="px-1.5 py-0.5 bg-muted rounded-sm text-[10px]"
										>
											{resource}
										</span>
									))
								) : (
									<span className="text-[10px] text-muted-foreground">Sin recursos disponibles</span>
								)}
								{resources.length > 3 && (
									<span className="px-1.5 py-0.5 bg-muted rounded-sm text-[10px]">+{resources.length - 3} más</span>
								)}
							</div>
						</div>

						{/* Área de estadísticas inferior */}
						<div className="bg-background/90 backdrop-blur-md p-3 flex flex-col gap-2">
							{/* Estadísticas principales en grid */}
							<div className="grid grid-cols-3 gap-3">
								<div className="flex flex-col items-center">
									<div className="text-2xl font-bold">{place._count?.images || 0}</div>
									<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
										<ImageIcon className="h-3 w-3" />
										Imágenes
									</div>
								</div>
								<div className="flex flex-col items-center">
									<div className="text-2xl font-bold">{formatPopulation(place.population)}</div>
									<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
										<Users className="h-3 w-3" />
										Población
									</div>
								</div>
								<div className="flex flex-col items-center">
									<div className="text-2xl font-bold">{place.government?.substring(0, 4) || '-'}</div>
									<div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1">
										<Globe className="h-3 w-3" />
										Gobierno
									</div>
								</div>
							</div>

							{/* Barra de importancia */}
							<div className="mt-1 flex items-center justify-between">
								<div className="flex-1 bg-muted h-2 rounded-full overflow-hidden">
									<div
										className={cn('h-full rounded-full', climate.barClass)}
										style={{ width: `${(importance / 12) * 100}%` }}
									/>
								</div>
								<div className="ml-2 text-xs font-semibold">{importance}/12</div>
							</div>
						</div>

						{/* Acciones - botones flotantes */}
						{(onEdit || onDelete) && (
							<motion.div
								className="absolute bottom-2 right-2 flex gap-1 z-50"
								initial={{ opacity: 0 }}
								animate={{ opacity: isExploded ? 1 : 0 }}
								onHoverStart={() => setIsExploded(true)}
								onHoverEnd={() => setIsExploded(false)}
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
											onEdit(place);
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
											if (place.id) {
												onDelete(place.id);
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
								animate={{ opacity: isExploded ? 1 : 0 }}
								onHoverStart={() => setIsExploded(true)}
								onHoverEnd={() => setIsExploded(false)}
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
				</EntityCardWrapper>
			</div>
		</>
	);
}

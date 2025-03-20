'use client';

import { cn } from '@/lib/utils';
import type { Place } from '@/types/entities/places';
import {
	Building2,
	Calendar,
	Cloud,
	Globe,
	Home,
	Landmark,
	Map,
	MapPin,
	Mountain,
	Palmtree,
	Scroll,
	Shield,
	Star,
	Swords,
	Users
} from 'lucide-react';
import Image from 'next/image';
import type * as React from 'react';
import { useMemo } from 'react';

// Importar componentes base
import {
	CardFooter,
	CardHeader,
	CardMetadataSection
} from '../base';

// Importar tipos y utilidades
import { EntityCardWrapper } from '../entity-card-wrapper';
import { usePreset } from '../hooks/use-preset';
import { adaptCardOptions } from '../types';
import type { CardOptions } from '../types/unified-card-types';

import '../../styles/place-card.css';

// TIPOS DE DATOS
// ==============================

// Define rarity levels for places with TCG styling
interface PlaceRarity {
	color: string;
	borderColor: string;
	glowColor: string;
	label: string;
	rarity: 'common' | 'uncommon' | 'rare' | 'legendary' | 'mythic';
	stars: number;
	textureType: string;
	glowIntensity: number;
	textureOpacity: number;
	holographic?: boolean;
	borderAnimation?: string;
}

const PLACE_RARITY: Record<string, PlaceRarity> = {
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
		label: 'Rara',
		rarity: 'rare' as const,
		stars: 3,
		textureType: 'grid',
		glowIntensity: 0.65,
		textureOpacity: 0.25,
		borderAnimation: 'pulse'
	},
	legendary: {
		color: '#eab308',
		borderColor: 'rgba(234, 179, 8, 0.8)',
		glowColor: 'rgba(234, 179, 8, 0.7)',
		label: 'Legendaria',
		rarity: 'legendary' as const,
		stars: 4,
		holographic: true,
		textureType: 'sparkle',
		glowIntensity: 0.8,
		textureOpacity: 0.3,
		borderAnimation: 'flow'
	},
	mythic: {
		color: '#d946ef',
		borderColor: 'rgba(217, 70, 239, 0.8)',
		glowColor: 'rgba(217, 70, 239, 0.7)',
		label: 'Mítica',
		rarity: 'mythic' as const,
		stars: 5,
		holographic: true,
		textureType: 'rainbow',
		glowIntensity: 1,
		textureOpacity: 0.35,
		borderAnimation: 'rainbow'
	},
};

// Opciones predeterminadas para la tarjeta de lugar con estilo TCG
const DEFAULT_PLACE_OPTIONS: Partial<CardOptions> = {
	// Efectos principales
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: true,

	// Configuración de diseño específica para lugares
	designSystem: {
		preset: 'place',
		variant: 'tcg',
		aspectRatio: '7/10', // Proporción estándar de cartas coleccionables
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft',
	},

	// Efectos específicos para lugares
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

// Extender la interfaz Place para añadir presetId
interface ExtendedPlace extends Place {
	presetId?: string | null;
}

export interface PlaceCardProps {
	place: ExtendedPlace;
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
						count >= 4 ? "text-yellow-400" :
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

// Determinar la rareza basada en las características del lugar
function calculatePlaceRarity(place: Place): keyof typeof PLACE_RARITY {
	// Determinar rareza basada en población y otros factores
	const population = place.population || 0;
	const hasLore = place.lore && place.lore.length > 100;
	const hasHistory = place.history && place.history.length > 100;
	const hasDangers = place.dangers && place.dangers !== 'empty_array' && place.dangers !== '[]';
	const hasResources = place.resources && place.resources !== 'empty_array' && place.resources !== '[]';

	// Contar factores especiales
	let specialFactors = 0;
	if (hasLore) specialFactors++;
	if (hasHistory) specialFactors++;
	if (hasDangers) specialFactors++;
	if (hasResources) specialFactors++;

	// Determinar rareza por población y factores especiales
	if (population >= 1000000 && specialFactors >= 3) return 'mythic';
	if (population >= 100000 && specialFactors >= 2) return 'legendary';
	if (population >= 10000 || specialFactors >= 2) return 'rare';
	if (population >= 1000 || specialFactors >= 1) return 'uncommon';
	return 'common';
}

function generatePlaceRarityConfig(place: Place) {
	const rarityKey = calculatePlaceRarity(place);
	const rarity = PLACE_RARITY[rarityKey];

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

// Obtener el icono del tipo de lugar
function getPlaceTypeIcon(placeType = '') {
	const typeIcons: Record<string, React.ReactNode> = {
		city: <Building2 className="h-full w-full" />,
		town: <Home className="h-full w-full" />,
		village: <Building2 className="h-full w-full" />,
		forest: <Palmtree className="h-full w-full" />,
		mountain: <Mountain className="h-full w-full" />,
		castle: <Landmark className="h-full w-full" />,
		dungeon: <Swords className="h-full w-full" />,
		temple: <Landmark className="h-full w-full" />,
		ruin: <Building2 className="h-full w-full" />,
		cave: <Mountain className="h-full w-full" />,
		island: <MapPin className="h-full w-full" />,
	};

	return typeIcons[placeType.toLowerCase()] || <Map className="h-full w-full" />;
}

// COMPONENTE PRINCIPAL
// ==============================
export function PlaceCardLayout({
	place: initialPlace,
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
}: PlaceCardProps) {
	// Adaptar el objeto place para asegurar compatibilidad
	const place: ExtendedPlace = initialPlace ? {
		...initialPlace,
		presetId: initialPlace.presetId || null
	} : {
		id: 'placeholder',
		name: 'Lugar sin nombre',
		emoji: '📍',
		color: '#3b82f6',
		description: 'Sin descripción',
		region: 'Desconocida',
		type: 'Desconocido',
		climate: 'Templado',
		population: 0,
		createdAt: new Date(),
		updatedAt: new Date(),
		presetId: null
	};

	// Usar el hook para obtener configuración de preset si existe
	const { cardOptions } = usePreset({
		entityType: 'place',
		entityId: place.id,
		presetId: place.presetId || null,
		baseOptions: options,
	});

	// Obtener la rareza del lugar
	const rarityKey = calculatePlaceRarity(place);
	const rarityInfo = PLACE_RARITY[rarityKey];
	const rarityConfig = generatePlaceRarityConfig(place);
	const rarityClass = `place-card-rarity-${rarityKey}`;

	// Parsear recursos y peligros si están disponibles
	const resources = useMemo(() => {
		if (!place.resources || place.resources === 'empty_array') return [];
		try {
			return JSON.parse(place.resources);
		} catch {
			return [];
		}
	}, [place.resources]);

	const dangers = useMemo(() => {
		if (!place.dangers || place.dangers === 'empty_array') return [];
		try {
			return JSON.parse(place.dangers);
		} catch {
			return [];
		}
	}, [place.dangers]);

	// Generar configuración avanzada basada en la rareza
	const enhancedCardOptions = useMemo(() => {
		// Valores por defecto
		const defaults = DEFAULT_PLACE_OPTIONS;

		// Ajustar intensidad de efectos según rareza
		const intensity = rarityInfo.glowIntensity || 0.5;

		// Habilitar efectos especiales para lugares legendarios y míticos
		const isSpecial = rarityKey === 'legendary' || rarityKey === 'mythic';

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
				size: 20 + (rarityInfo.stars * 2), // Más estrellas = más grande el glow
				visibleOnIdle: rarityKey === 'mythic', // Solo visible por defecto en míticas
				animationType: isSpecial ? 'pulse' : 'static',
			},

			// Configurar bordes animados
			borderOptions: {
				...(defaults.borderOptions || {}),
				width: rarityInfo.stars * 0.5, // Más estrellas = borde más grueso
				color: rarityInfo.borderColor,
				pattern: isSpecial ? 'gradient' : 'solid',
				animationType: rarityInfo.borderAnimation || 'none',
				glowIntensity: intensity,
			},

			// Configurar texturas específicas
			textureConfig: {
				type: rarityInfo.textureType || 'noise',
				intensity: rarityInfo.textureOpacity || 0.15,
				scale: 1 + (rarityInfo.stars * 0.1), // Escala aumenta con rareza
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
					intensity: rarityKey === 'mythic' ? 0.4 : 0.2,
				},
				noiseTexture: {
					enabled: true,
					visibleOnHover: !isSpecial, // Siempre visible en lugares especiales
					intensity: rarityInfo.textureOpacity || 0.15,
				},
				glitchEffect: {
					enabled: rarityKey === 'mythic',
					visibleOnHover: true,
					intensity: 0.3,
					frequency: 0.1,
				},
			},
		};
	}, [rarityKey, rarityInfo, rarityConfig]);

	// Configurar las capas para el modo explode
	const explodeLayers = [
		{ id: 'background', label: 'Fondo', icon: <Map className="h-4 w-4" /> },
		{ id: 'frame', label: 'Marco', icon: <Shield className="h-4 w-4" /> },
		{ id: 'portrait', label: 'Imagen', icon: <MapPin className="h-4 w-4" /> },
		{ id: 'info', label: 'Información', icon: <Globe className="h-4 w-4" /> },
		{ id: 'effects', label: 'Efectos', icon: <Star className="h-4 w-4" /> },
	];

	// Corregir la generación de placeMetadataItems para evitar elementos undefined
	const placeMetadataItems = useMemo(() => {
		const items: Array<{
			label: string;
			value: string;
			icon: React.ReactNode;
		}> = [];

		if (place.type) {
			items.push({
				label: 'Tipo',
				value: place.type,
				icon: <MapPin className="h-3.5 w-3.5 opacity-70" />
			});
		}

		if (place.climate) {
			items.push({
				label: 'Clima',
				value: place.climate,
				icon: <Cloud className="h-3.5 w-3.5 opacity-70" />
			});
		}

		if (place.population) {
			items.push({
				label: 'Población',
				value: place.population.toString(),
				icon: <Users className="h-3.5 w-3.5 opacity-70" />
			});
		}

		return items;
	}, [place.type, place.climate, place.population]);

	// Formatear fecha
	const formattedDate = useMemo(() => {
		if (!place.createdAt) return '';

		const date = typeof place.createdAt === 'string'
			? new Date(place.createdAt)
			: place.createdAt;

		return date.toLocaleDateString();
	}, [place.createdAt]);

	return (
		<div className={cn(
			'place-card-container relative w-full h-full group',
			rarityClass,
			onClick && 'cursor-pointer',
			className
		)}>
			<EntityCardWrapper
				title={place.name}
				description={place.description || ''}
				entityId={place?.id ? String(place.id) : 'unknown'}
				entityType="place"
				className={cn('place-card-wrapper relative w-full h-full', rarityClass)}
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
				<div className="place-card-content flex flex-col h-full w-full relative">
					{/* Cabecera con el emblema y nombre del lugar */}
					<CardHeader
						title={place.name}
						entityType="place"
						subtitle={place.region || 'Región desconocida'}
						className="mb-2 relative z-10"
						showIcon={false}
						rightContent={
							<RarityStars count={rarityInfo.stars} />
						}
					/>

					{/* Place icon con emoji */}
					<div className="flex items-center ml-3 -mt-1 mb-3">
						<div className={cn(
							"place-emoji flex items-center justify-center w-10 h-10 rounded-full border-2 z-10 relative",
							"text-xl bg-background shadow-md",
							`border-${rarityKey === 'mythic' ? 'fuchsia' :
								rarityKey === 'legendary' ? 'amber' :
									rarityKey === 'rare' ? 'blue' :
										rarityKey === 'uncommon' ? 'green' : 'gray'}-500`
						)}>
							{place.emoji || <MapPin className="h-5 w-5" />}
						</div>
					</div>

					{/* Imagen o ilustración del lugar */}
					<div className={cn(
						"place-card-image relative h-28 mb-3 rounded overflow-hidden border",
						`border-${rarityKey === 'mythic' ? 'fuchsia' :
							rarityKey === 'legendary' ? 'amber' :
								rarityKey === 'rare' ? 'blue' :
									rarityKey === 'uncommon' ? 'green' : 'gray'}-500`,
					)}>
						{place.featuredImage ? (
							<>
								<Image
									src={place.featuredImage}
									alt={place.name}
									fill
									sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
									className="object-cover"
									priority={false}
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
							</>
						) : (
							<div className={cn(
								"absolute inset-0 bg-gradient-to-br",
								rarityKey === 'mythic' ? "from-fuchsia-500/20 to-purple-900/40" :
									rarityKey === 'legendary' ? "from-amber-500/20 to-yellow-900/40" :
										rarityKey === 'rare' ? "from-blue-500/20 to-blue-900/40" :
											rarityKey === 'uncommon' ? "from-green-500/20 to-green-900/40" :
												"from-gray-500/20 to-gray-900/40"
							)}>
								{/* Patrón decorativo según la rareza */}
								<div className={cn(
									"absolute inset-0 opacity-10 mix-blend-overlay",
									rarityKey === 'mythic' || rarityKey === 'legendary' ? "bg-sparkle-pattern" : "bg-noise-pattern"
								)} />
							</div>
						)}

						{/* Icono central o tipo de lugar si no hay imagen */}
						{!place.featuredImage && (
							<div className="absolute inset-0 flex items-center justify-center">
								{getPlaceTypeIcon(place.type)}
							</div>
						)}
					</div>

					{/* Características del lugar - usando CardMetadataSection */}
					<CardMetadataSection
						items={placeMetadataItems}
						className="flex-grow relative p-1.5 bg-card/80 rounded border border-stone-800/30"
					/>

					{/* Recursos y peligros */}
					{(resources.length > 0 || dangers.length > 0) && (
						<div className="mt-2 p-1.5 bg-card/80 rounded border border-stone-800/30 text-xs">
							{resources.length > 0 && (
								<div className="flex flex-col gap-0.5 mb-1">
									<div className="text-[10px] font-medium flex items-center">
										<Scroll className="h-3 w-3 mr-1 opacity-70" />
										Recursos:
									</div>
									<div className="flex flex-wrap gap-1">
										{resources.slice(0, 3).map((resource: string, index: number) => (
											<span
												key={`resource-${index}`}
												className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-200"
											>
												{resource}
											</span>
										))}
										{resources.length > 3 && (
											<span className="text-[9px] opacity-70">+{resources.length - 3}</span>
										)}
									</div>
								</div>
							)}

							{dangers.length > 0 && (
								<div className="flex flex-col gap-0.5">
									<div className="text-[10px] font-medium flex items-center">
										<Swords className="h-3 w-3 mr-1 opacity-70" />
										Peligros:
									</div>
									<div className="flex flex-wrap gap-1">
										{dangers.slice(0, 3).map((danger: string, index: number) => (
											<span
												key={`danger-${index}`}
												className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-200"
											>
												{danger}
											</span>
										))}
										{dangers.length > 3 && (
											<span className="text-[9px] opacity-70">+{dangers.length - 3}</span>
										)}
									</div>
								</div>
							)}
						</div>
					)}

					{/* Pie de la tarjeta con sello de rareza */}
					<CardFooter
						className="mt-auto"
						leftContent={
							<div className={cn(
								"place-rarity px-3 py-1 rounded-full text-[10px] font-medium",
								rarityKey === 'mythic' ? "bg-fuchsia-500/20 text-fuchsia-200" :
									rarityKey === 'legendary' ? "bg-amber-500/20 text-amber-200" :
										rarityKey === 'rare' ? "bg-blue-500/20 text-blue-200" :
											rarityKey === 'uncommon' ? "bg-green-500/20 text-green-200" :
												"bg-gray-500/20 text-gray-200"
							)}>
								{PLACE_RARITY[rarityKey].label}
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
export function PlaceCard(props: PlaceCardProps) {
	return <PlaceCardLayout {...props} />;
}
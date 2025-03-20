'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Character } from '@/types/entities/characters';
import {
	BadgeCheck,
	Book,
	Brain,
	Calendar,
	Crown,
	Dumbbell,
	FileSpreadsheet,
	Heart,
	PencilIcon,
	Shield,
	Sparkle,
	Star,
	Trash2,
	User
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useMemo } from 'react';

// Importar componentes base
import {
	CardDescriptionSection,
	CardFooter,
	CardHeader,
	CardMetadataSection
} from '../base';

// Importar tipos y utilidades
import { EntityCardWrapper } from '../entity-card-wrapper';
import { usePreset } from '../hooks/use-preset';
import { adaptCardOptions } from '../types';
import type { CardOptions } from '../types/unified-card-types';

import '../../styles/character-card.css';

// TIPOS DE DATOS
// ==============================

// Define niveles de rareza para personajes con estilo TCG
interface CharacterRarity {
	color: string;
	borderColor: string;
	glowColor: string;
	label: string;
	rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';
	stars: number;
	textureType: string;
	glowIntensity: number;
	textureOpacity: number;
	holographic?: boolean;
	borderAnimation?: string;
}

const CHARACTER_RARITY: Record<string, CharacterRarity> = {
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
	epic: {
		color: '#8b5cf6',
		borderColor: 'rgba(139, 92, 246, 0.8)',
		glowColor: 'rgba(139, 92, 246, 0.7)',
		label: 'Épica',
		rarity: 'epic' as const,
		stars: 4,
		textureType: 'sparkle',
		glowIntensity: 0.7,
		textureOpacity: 0.3,
		borderAnimation: 'pulse'
	},
	legendary: {
		color: '#eab308',
		borderColor: 'rgba(234, 179, 8, 0.8)',
		glowColor: 'rgba(234, 179, 8, 0.7)',
		label: 'Legendaria',
		rarity: 'legendary' as const,
		stars: 5,
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
		stars: 6,
		holographic: true,
		textureType: 'rainbow',
		glowIntensity: 1,
		textureOpacity: 0.35,
		borderAnimation: 'rainbow'
	},
};

// Configuración predeterminada para tarjetas de personaje
const DEFAULT_CHARACTER_OPTIONS: Partial<CardOptions> = {
	// Efectos principales
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: true,

	// Configuración de diseño específica para personajes
	designSystem: {
		preset: 'character',
		variant: 'tcg',
		aspectRatio: '7/10', // Proporción estándar de cartas coleccionables
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft',
	},

	// Efectos específicos para personajes
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

interface CharacterStats {
	strength?: number;
	dexterity?: number;
	intelligence?: number;
	charisma?: number;
	vitality?: number;
	[key: string]: number | undefined;
}

interface CharacterExtended extends Omit<Character, 'stats'> {
	stats?: CharacterStats;
	presetId?: string;
}

export interface CharacterCardProps {
	character: CharacterExtended;
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
	onEdit?: (character: CharacterExtended) => void;
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
						count >= 5 ? "text-purple-400" :
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

// Determinar la rareza basada en el nivel y las estadísticas
function calculateCharacterRarity(character: CharacterExtended): keyof typeof CHARACTER_RARITY {
	const level = character.level || 1;
	const stats = character.stats || {};
	let totalStats = 0;
	for (const stat of Object.values(stats)) {
		totalStats += stat || 0;
	}
	const averageStats = Object.keys(stats).length > 0 ? totalStats / Object.keys(stats).length : 0;

	if (level >= 25 && averageStats >= 18) return 'mythic';
	if (level >= 20 && averageStats >= 15) return 'legendary';
	if (level >= 15 && averageStats >= 12) return 'epic';
	if (level >= 10 && averageStats >= 10) return 'rare';
	if (level >= 5) return 'uncommon';
	return 'common';
}

// Generar configuración de rareza para un personaje
function generateCharacterRarityConfig(character: CharacterExtended) {
	const rarityKey = calculateCharacterRarity(character);
	const rarity = CHARACTER_RARITY[rarityKey];

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

// Obtener el color de la clase
function getClassColor(charClass = '') {
	const classColors: Record<string, string> = {
		warrior: '#ef4444',
		mage: '#3b82f6',
		rogue: '#22c55e',
		priest: '#f59e0b',
		paladin: '#8b5cf6',
		hunter: '#ec4899',
		warlock: '#6b7280',
		druid: '#10b981',
		monk: '#f97316',
		shaman: '#6366f1',
		deathknight: '#4f46e5',
		demonhunter: '#7c3aed',
	};

	return classColors[charClass.toLowerCase()] || '#3b82f6';
}

// Obtener el icono de la clase
function getClassIcon(charClass = '') {
	const classIcons: Record<string, string> = {
		warrior: '⚔️',
		mage: '🔮',
		rogue: '🗡️',
		priest: '✨',
		paladin: '🛡️',
		hunter: '🏹',
		warlock: '👿',
		druid: '🌿',
		monk: '🧘',
		shaman: '⚡',
		deathknight: '💀',
		demonhunter: '👹',
	};

	return classIcons[charClass.toLowerCase()] || '👤';
}

// COMPONENTE PRINCIPAL
// ==============================
export function CharacterCardLayout({
	character: initialCharacter,
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
}: CharacterCardProps) {
	// Garantizar que nunca procesamos un personaje undefined
	const character = initialCharacter || {
		id: 'placeholder',
		name: 'Personaje sin nombre',
		description: 'Sin descripción',
		class: 'Unknown',
		level: 1,
		createdAt: new Date(),
		updatedAt: new Date(),
	} as CharacterExtended;

	// Usar el hook para obtener configuración de preset
	const { cardOptions } = usePreset({
		entityType: 'character',
		entityId: character.id,
		presetId: typeof character.presetId === 'string' ? character.presetId : null,
		baseOptions: options,
	});

	// Configurar las capas para el modo explode
	const explodeLayers = [
		{ id: 'background', label: 'Fondo', icon: <Shield className="h-4 w-4" /> },
		{ id: 'frame', label: 'Marco', icon: <Crown className="h-4 w-4" /> },
		{ id: 'portrait', label: 'Retrato', icon: <User className="h-4 w-4" /> },
		{ id: 'stats', label: 'Estadísticas', icon: <FileSpreadsheet className="h-4 w-4" /> },
		{ id: 'effects', label: 'Efectos', icon: <Sparkle className="h-4 w-4" /> },
	];

	// Obtener la rareza del personaje
	const rarityKey = calculateCharacterRarity(character);
	const rarityInfo = CHARACTER_RARITY[rarityKey];
	const rarityConfig = generateCharacterRarityConfig(character);
	const rarityClass = `character-card-rarity-${rarityKey}`;

	// Obtener las estadísticas del personaje o crear valores por defecto
	const stats = character.stats || {};
	const characterStats = {
		strength: stats.strength || 10,
		dexterity: stats.dexterity || 10,
		intelligence: stats.intelligence || 10,
		charisma: stats.charisma || 10,
		vitality: stats.vitality || 10,
	};

	// Manejadores de eventos
	const handleEdit = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onEdit && character) {
			onEdit(character);
		}
	}, [onEdit, character]);

	const handleDelete = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (onDelete && character?.id) {
			onDelete(character.id);
		}
	}, [onDelete, character?.id]);

	// Generar configuración avanzada basada en la rareza
	const enhancedCardOptions = useMemo(() => {
		// Valores por defecto
		const defaults = DEFAULT_CHARACTER_OPTIONS;

		// Ajustar intensidad de efectos según rareza
		const intensity = rarityInfo.glowIntensity || 0.5;

		// Habilitar efectos especiales para personajes legendarios y míticos
		const isSpecial = rarityKey === 'legendary' || rarityKey === 'mythic' || rarityKey === 'epic';

		// Obtener color de clase para estilizado adicional
		const classColor = getClassColor(character.class);

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
				visibleOnIdle: rarityKey === 'mythic',
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

			// Configuración de color basada en la clase
			primaryColor: classColor,

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
					visibleOnHover: !isSpecial,
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
	}, [rarityKey, rarityInfo, rarityConfig, character.class]);

	// Formatear fecha
	const formattedDate = useMemo(() => {
		if (!character.createdAt) return '';

		const date = typeof character.createdAt === 'string'
			? new Date(character.createdAt)
			: character.createdAt;

		return date.toLocaleDateString();
	}, [character.createdAt]);

	// Crear los elementos de metadatos para las estadísticas
	const statItems = [
		{
			label: 'FUE',
			value: characterStats.strength.toString(),
			icon: <Dumbbell className="h-3.5 w-3.5 text-red-400" />
		},
		{
			label: 'DES',
			value: characterStats.dexterity.toString(),
			icon: <Sparkle className="h-3.5 w-3.5 text-green-400" />
		},
		{
			label: 'INT',
			value: characterStats.intelligence.toString(),
			icon: <Brain className="h-3.5 w-3.5 text-blue-400" />
		},
		{
			label: 'CAR',
			value: characterStats.charisma.toString(),
			icon: <BadgeCheck className="h-3.5 w-3.5 text-purple-400" />
		},
		{
			label: 'VIT',
			value: characterStats.vitality.toString(),
			icon: <Heart className="h-3.5 w-3.5 text-pink-400" />
		}
	];

	return (
		<div className={cn(
			'character-card-container relative w-full h-full group',
			rarityClass,
			onClick && 'cursor-pointer',
			className
		)}>
			<EntityCardWrapper
				title={character.name}
				description={character.description || ''}
				entityId={character.id}
				entityType="character"
				className={cn('character-card-wrapper relative w-full h-full', rarityClass)}
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
				<div className="character-card-content flex flex-col h-full w-full relative">
					{/* Cabecera con el emblema y nombre del personaje */}
					<CardHeader
						title={character.name}
						entityType="character"
						subtitle={`${character.class || 'Unknown'} Lvl.${character.level || 1}`}
						className="mb-2 relative z-10"
						showIcon={false}
						rightContent={
							<>
								{/* Indicador de rareza */}
								<div className={cn(
									"character-rarity px-2 py-0.5 rounded-full text-[10px] font-medium",
									rarityKey === 'mythic' ? "bg-fuchsia-500/20 text-fuchsia-200" :
										rarityKey === 'legendary' ? "bg-amber-500/20 text-amber-200" :
											rarityKey === 'epic' ? "bg-purple-500/20 text-purple-200" :
												rarityKey === 'rare' ? "bg-blue-500/20 text-blue-200" :
													"bg-green-500/20 text-green-200"
								)}>
									{CHARACTER_RARITY[rarityKey].label}
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

					{/* Class icon */}
					<div className="flex items-center ml-3 -mt-1 mb-3">
						<div className={cn(
							"character-class-icon flex items-center justify-center w-10 h-10 rounded-full border-2 bg-background shadow-md"
						)}
							style={{ borderColor: getClassColor(character.class) }}>
							<div style={{ color: getClassColor(character.class) }}>
								{getClassIcon(character.class)}
							</div>
						</div>
					</div>

					{/* Imagen o ilustración del personaje */}
					<div className={cn(
						"character-portrait relative h-32 mb-3 rounded overflow-hidden border",
						`border-${rarityKey === 'mythic' ? 'fuchsia' :
							rarityKey === 'legendary' ? 'amber' :
								rarityKey === 'epic' ? 'purple' :
									rarityKey === 'rare' ? 'blue' :
										rarityKey === 'uncommon' ? 'green' : 'gray'}-500`,
					)}>
						{character.featuredImage ? (
							<>
								<Image
									src={character.featuredImage}
									alt={character.name}
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
										rarityKey === 'epic' ? "from-purple-500/20 to-purple-900/40" :
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

						{/* Icono central si no hay imagen */}
						{!character.featuredImage && (
							<div className="absolute inset-0 flex items-center justify-center">
								<User className="h-16 w-16 text-white/40" />
							</div>
						)}
					</div>

					{/* Estadísticas del personaje */}
					<div className="character-stats-container mb-2">
						<div className="text-xs font-medium mb-1 flex items-center">
							<FileSpreadsheet className="h-3 w-3 mr-1" />
							Estadísticas
						</div>
						<CardMetadataSection
							items={statItems}
							className="grid-cols-2 gap-1 text-xs"
						/>
					</div>

					{/* Descripción del personaje */}
					<CardDescriptionSection
						description={character.description || 'Sin descripción disponible'}
						maxLines={4}
						className="flex-grow relative p-1.5 text-xs border border-stone-800/30 rounded bg-card/80"
					/>

					{/* Pie de la tarjeta con información adicional */}
					<CardFooter
						className="mt-2 text-xs"
						leftContent={
							<div className="flex items-center gap-1">
								<Book className="h-3 w-3 opacity-70" />
								<span>{character.race || 'Unknown'}</span>
							</div>
						}
						rightContent={
							<div className="flex items-center gap-1">
								<Calendar className="h-3 w-3 opacity-70" />
								<span>{formattedDate}</span>
							</div>
						}
					/>
				</div>
			</EntityCardWrapper>
		</div>
	);
}

// Componente público para usar en la aplicación
export function CharacterCard(props: CharacterCardProps) {
	return <CharacterCardLayout {...props} />;
}
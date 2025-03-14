'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { CharacterWithStats } from '@/types/character';
import { motion } from 'framer-motion';
import { ArrowUpRight, Award, Crown, FlameIcon, Heart, Shield, Sparkles, Sword, User, Zap } from 'lucide-react';
import { ImageIcon, StarIcon, UsersIcon } from 'lucide-react';
import type * as React from 'react';
import { useMemo, useState } from 'react';
import { EntityCardLayerWrapper } from '../entity-card-layer-wrapper';
import { generateRarityConfig } from '../entity-card-adapter';
import type {
	CardDesignData,
	CardDesignPreset,
	CardOptions,
	RarityConfig,
	TextureConfig,
} from '../types/base-card-types';
import { ImageGrid } from './image-grid';
import { VisualizationConfig } from '../config/visualization-config';

interface CharacterCardProps {
	character: CardDesignData;
	showStats?: boolean;
	showMetadata?: boolean;
	className?: string;
	options?: Partial<CardOptions>;
	rarity?: RarityConfig | null;
	texture?: TextureConfig | null;
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
	onHoverStart?: () => void;
	onHoverEnd?: () => void;
	showVisualizationConfig?: boolean;
	enableExplode?: boolean;
}

// Eliminar la función isFormData y agregar DEFAULT_CHARACTER_OPTIONS
const DEFAULT_CHARACTER_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlinesEffect: false,
	enableGlowEffect: true,
	enableBorderEffect: true,
	enableGrainEffect: true,

	// Sistema de diseño específico para personajes
	designSystem: {
		preset: 'character' as CardDesignPreset,
		variant: 'default',
		aspectRatio: '3/4',
		cornerStyle: 'rounded',
		cornerRadius: 8,
		elevation: 2,
		shadowStyle: 'soft',
	},

	// Configuración de movimiento
	hoverLiftHeight: 6,
	maxRotation: 8,
	primaryColor: '236, 72, 153', // Un tono rosa
	secondaryColor: '244, 114, 182', // Un tono rosa claro

	// Opciones de efectos
	holographicOptions: {
		patternType: 'linear',
		intensity: 0.5,
		animationSpeed: 1,
		visibleOnHover: true,
	},

	glowOptions: {
		intensity: 0.7,
		size: 15,
		blurAmount: 10,
		animationType: 'pulse',
		pulseSpeed: 1.5,
		visibleOnHover: true,
	},

	borderOptions: {
		width: 2,
		pattern: 'solid',
		animationType: 'pulse',
		animation: {
			type: 'flow',
			duration: 3000,
			timing: 'ease-in-out',
			iteration: 'infinite',
		},
		glowIntensity: 0.6,
	},

	grainOptions: {
		intensity: 0.12,
		density: 0.5,
		contrast: 1.1,
		noise: 'light',
		animated: false,
		visibleOnHover: true,
	},
};

export function CharacterCard({
	character,
	showStats = true,
	showMetadata = true,
	className,
	options,
	rarity,
	texture,
	onClick,
	onHoverStart,
	onHoverEnd,
	showVisualizationConfig = false,
	enableExplode = false,
}: CharacterCardProps) {
	// Estado para el panel de configuración visual
	const [configOpen, setConfigOpen] = useState(false);

	// Inicializar opciones con valores por defecto
	const [cardOptions, setCardOptions] = useState<Partial<CardOptions>>({
		...DEFAULT_CHARACTER_OPTIONS,
		...options,
	});

	// Obtener estadísticas del personaje o valores por defecto
	const stats = character.characterInfo?.stats || {
		strength: 5,
		dexterity: 5,
		intelligence: 5,
		charisma: 5,
		vitality: 5,
	};

	// Obtener color basado en la clase del personaje
	const getClassColor = useMemo(() => {
		return (characterClass: string): string => {
			const classColors: Record<string, string> = {
				mago: '#8b5cf6', // Violeta
				guerrero: '#dc2626', // Rojo
				arquero: '#16a34a', // Verde
				pícaro: '#f59e0b', // Ámbar
				clérigo: '#3b82f6', // Azul
				druida: '#65a30d', // Verde oliva
				bardo: '#ec4899', // Rosa
				paladín: '#f59e0b', // Dorado
				monje: '#a855f7', // Púrpura
				hechicero: '#06b6d4', // Cian
				brujo: '#7c3aed', // Violeta oscuro
				bárbaro: '#b91c1c', // Rojo oscuro
				unknown: '#6b7280', // Gris
			};

			const lowerCaseClass = characterClass.toLowerCase();
			for (const [key, color] of Object.entries(classColors)) {
				if (lowerCaseClass.includes(key)) {
					return color;
				}
			}
			return classColors.unknown;
		};
	}, []);

	// Obtener icono para cada estadística
	const getStatIcon = (statName: string) => {
		const iconProps = { className: 'h-3.5 w-3.5' };
		switch (statName.toLowerCase()) {
			case 'strength':
			case 'fuerza':
				return <Sword {...iconProps} />;
			case 'dexterity':
			case 'destreza':
				return <Zap {...iconProps} />;
			case 'intelligence':
			case 'inteligencia':
				return <Sparkles {...iconProps} />;
			case 'charisma':
			case 'carisma':
				return <Crown {...iconProps} />;
			case 'vitality':
			case 'vitalidad':
				return <Heart {...iconProps} />;
			case 'defense':
			case 'defensa':
				return <Shield {...iconProps} />;
			case 'power':
			case 'poder':
				return <FlameIcon {...iconProps} />;
			default:
				return <Award {...iconProps} />;
		}
	};

	// Calcular rareza basada en los datos del personaje
	const characterRarity = useMemo(() => {
		// Si se proporciona una rareza inicial, usarla
		if (rarity) {
			return rarity;
		}

		// Determinar la rareza basada en el promedio de estadísticas
		const statValues = Object.values(stats);
		const statSum = statValues.reduce((acc, curr) => acc + curr, 0);
		const statAvg = statSum / statValues.length;

		// Mapear el promedio a una rareza
		if (statAvg >= 8) {
			return generateRarityConfig('legendary', getClassColor(character.characterInfo?.class || 'unknown'));
		} else if (statAvg >= 6) {
			return generateRarityConfig('rare', getClassColor(character.characterInfo?.class || 'unknown'));
		} else if (statAvg >= 4) {
			return generateRarityConfig('uncommon', getClassColor(character.characterInfo?.class || 'unknown'));
		} else {
			return generateRarityConfig('common', getClassColor(character.characterInfo?.class || 'unknown'));
		}
	}, [character, rarity, stats, getClassColor]);

	return (
		<>
			{configOpen && (
				<VisualizationConfig
					onClose={() => setConfigOpen(false)}
					options={cardOptions}
					onOptionsChange={setCardOptions}
					entityId={character.id as string}
					entityType="character"
				/>
			)}

			<div className={cn('min-h-[350px] relative', className)}>
				<EntityCardLayerWrapper
					title={character.name || 'Personaje'}
					description={character.description || 'Sin descripción'}
					onClick={onClick}
					showVisualConfig={showVisualizationConfig}
					visualOptions={{
						...cardOptions,
						rarityConfig: characterRarity,
						textureConfig: texture || undefined
					}}
					entityType="character"
					entityId={character.id}
				/>

				<div className="relative z-20 h-full flex flex-col">
					{/* Cabecera con nombre y clase */}
					<div className="p-3 flex justify-between items-center">
						<div>
							<h3 className="text-lg font-bold">{character.name}</h3>
							<div className="flex items-center">
								<Badge
									className="bg-transparent px-1.5 text-xs"
									style={{ color: getClassColor(character.characterInfo?.class || 'unknown') }}
								>
									{character.characterInfo?.class || 'Sin clase'}
								</Badge>
								<div className="text-muted-foreground text-xs flex items-center ml-2">
									<UsersIcon className="h-3 w-3 mr-1" />
									<span>Nv. {character.characterInfo?.level || 1}</span>
								</div>
							</div>
						</div>
						<div className="flex items-center space-x-1">
							{[...Array(character.rating || 0)].map((_, i) => (
								<StarIcon key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
							))}
							{[...Array(5 - (character.rating || 0))].map((_, i) => (
								<StarIcon key={i} className="h-3.5 w-3.5 text-muted-foreground" />
							))}
						</div>
					</div>

					{/* Imagen/Avatar */}
					<div className="relative flex-1 min-h-[150px] bg-muted overflow-hidden">
						{character.useImageGrid && character.recentImages && character.recentImages.length > 0 ? (
							<ImageGrid
								layout={character.imageGridLayout || 'single'}
								gap={character.imageGridGap || 4}
								style={character.imageGridStyle || 'standard'}
								images={character.recentImages.map((path, index) => ({
									id: `image-${index}`,
									path,
									thumbnail: path,
								}))}
							/>
						) : (
							<>
								{character.avatar ? (
									<div
										className="w-full h-full bg-center bg-cover"
										style={{ backgroundImage: `url(${character.avatar})` }}
									/>
								) : (
									<div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-background/20 to-background/40">
										<User className="h-12 w-12 opacity-20" />
									</div>
								)}
							</>
						)}

						{/* Insignia de raza y alineamiento */}
						<div className="absolute bottom-2 left-2 flex gap-1">
							<Badge variant="secondary" className="bg-background/80 backdrop-blur-sm text-xs py-0.5">
								{character.characterInfo?.race || 'Raza desconocida'}
							</Badge>
							{character.characterInfo?.alignment && (
								<Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-xs py-0.5">
									{character.characterInfo.alignment}
								</Badge>
							)}
						</div>
					</div>

					{/* Estadísticas */}
					{showStats && (
						<div className="p-3 bg-background/90 backdrop-blur-sm border-t border-border">
							<div className="text-xs font-semibold uppercase tracking-wider mb-2 card-meta flex items-center">
								<span>Estadísticas</span>
								<ArrowUpRight className="h-3 w-3 ml-1" />
							</div>
							<div className="grid grid-cols-2 gap-x-4 gap-y-1">
								{Object.entries(stats).map(([statName, value]) => (
									<div key={statName} className="flex items-center justify-between">
										<div className="flex items-center gap-1.5">
											{getStatIcon(statName)}
											<span className="text-xs capitalize card-body">{statName}</span>
										</div>
										<div className="font-bold text-sm card-body" style={{ color: characterRarity.color }}>
											{value}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* Descripción o metadata */}
					{showMetadata && character.description && (
						<div className="p-3 pt-2 border-t border-border text-xs card-body line-clamp-3">{character.description}</div>
					)}
				</div>
			</div>
		</>
	);
}

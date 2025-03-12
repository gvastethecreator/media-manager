'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils/utils';
import { ArrowUpRight, Award, Crown, FlameIcon, Heart, Shield, Sparkles, Sword, User, Zap } from 'lucide-react';
import type * as React from 'react';
import { useMemo } from 'react';
import type { CardDesignData, CardOptions, RarityConfig, TextureConfig } from '../base/base-card-types';
import { generateRarityConfig } from '../base/card-adapter';
import { EntityCardWrapper } from '../base/entity-card-wrapper';

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

// Opciones por defecto específicas para tarjetas de personaje
const DEFAULT_CHARACTER_OPTIONS: Partial<CardOptions> = {
	enable3DEffect: true,
	enableHolographicEffect: true,
	enableScanlines: true,
	enableAnimatedBorder: true,
	enableGrainEffect: true,
	enableGlowEffect: true,

	// Sistema de rareza usando el formato correcto
	raritySystem: {
		enabled: true,
		defaultRarity: 'common',
	},

	// Configuración de diseño específica para personajes
	designSystem: {
		preset: 'character',
		variant: 'default',
		aspectRatio: '7/10',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 3,
		shadowStyle: 'soft', // Valor válido: 'none', 'soft', 'hard', 'layered'
	},

	// Sistema de capas optimizado para personajes
	layerSystem: {
		order: ['content', 'holographic', 'scanlines', 'grain', 'border', 'filter'],
		blendMode: 'overlay', // Corregido: layerBlending -> blendMode
		spacing: 4, // Valor numérico
	},

	// Interactividad específica para personajes
	interactivity: {
		hover: {
			scale: 1.03,
			rotate: true,
			lift: true,
			glow: true,
		},
		click: {
			feedback: 'scale',
		},
	},

	// Estados específicos para personajes
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
	maxRotation: 10,

	// Contenido y estructura - valores corregidos
	contentLayout: 'default', // Valor válido: 'default', 'grid', 'masonry', 'carousel'
	contentPadding: 16, // Número en lugar de string
	contentSpacing: 8, // Número en lugar de string
	contentAlignment: 'start',

	// Imagen
	imageStyle: {
		fit: 'cover',
		position: 'center',
	},
	imageOverlay: true,
	imageOverlayOpacity: 0.4,
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
	// Establecer opciones por defecto
	const cardOptions = useMemo(
		() => ({
			...DEFAULT_CHARACTER_OPTIONS,
			...options,
		}),
		[options]
	);

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

			return classColors[characterClass.toLowerCase()] || classColors.unknown;
		};
	}, []);

	// Calcular la rareza usando la función auxiliar
	const characterRarity = useMemo(() => {
		if (rarity) {
			return rarity;
		}

		const classColor = character.characterInfo?.class
			? getClassColor(character.characterInfo.class)
			: character.color || '#3b82f6';

		return generateRarityConfig(character.characterInfo?.class?.toLowerCase() || 'common', classColor);
	}, [rarity, character, getClassColor]);

	// Obtener icono según la estadística
	const getStatIcon = useMemo(() => {
		return (statName: string): React.ReactNode => {
			const icons: Record<string, React.ReactNode> = {
				strength: <Sword className="h-3.5 w-3.5" />,
				dexterity: <Zap className="h-3.5 w-3.5" />,
				intelligence: <Sparkles className="h-3.5 w-3.5" />,
				charisma: <Crown className="h-3.5 w-3.5" />,
				vitality: <Heart className="h-3.5 w-3.5" />,
				defense: <Shield className="h-3.5 w-3.5" />,
				power: <FlameIcon className="h-3.5 w-3.5" />,
			};

			return icons[statName.toLowerCase()] || <Award className="h-3.5 w-3.5" />;
		};
	}, []);

	return (
		<EntityCardWrapper
			className={cn('w-full h-full overflow-hidden', className)}
			options={cardOptions}
			entityType="character"
			rarity={characterRarity}
			texture={texture}
			onClick={onClick}
			onHoverStart={onHoverStart}
			onHoverEnd={onHoverEnd}
			showVisualizationConfig={showVisualizationConfig}
			enableExplode={enableExplode}
			explodeLayers={[
				{
					id: 'content',
					label: 'Contenido',
					icon: <div className="w-3 h-3 bg-primary rounded-sm" />,
				},
				{
					id: 'holographic',
					label: 'Efecto Holo',
					icon: <div className="w-3 h-3 bg-gradient-to-tr from-purple-400 to-blue-300 opacity-60" />,
				},
				{
					id: 'scanlines',
					label: 'Scanlines',
					icon: <div className="w-3 h-3 bg-neutral-300 rounded-sm opacity-60" />,
				},
				{
					id: 'border',
					label: 'Borde',
					icon: <div className="w-3 h-3 border border-primary rounded-sm" />,
				},
			]}
		>
			<div className="flex flex-col h-full">
				{/* Cabecera con nombre y clase */}
				<div className="p-3 pt-2 relative">
					<div className="flex items-center gap-2 mb-0.5">
						<div
							className="w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center border-2"
							style={{ borderColor: characterRarity.color }}
						>
							{character.emoji ? <span className="text-lg">{character.emoji}</span> : <User className="h-4 w-4" />}
						</div>
						<div className="flex-1">
							<h3 className="font-bold text-base line-clamp-1 card-title">
								{character.name || 'Personaje sin nombre'}
							</h3>
							<div className="flex items-center gap-1 text-xs text-muted-foreground card-meta">
								<span>{character.characterInfo?.class || 'Clase desconocida'}</span>•
								<span>Nvl. {character.characterInfo?.level || 1}</span>
							</div>
						</div>
					</div>
				</div>

				{/* Imagen o avatar del personaje */}
				<div className="relative flex-1 min-h-[150px] bg-muted/20">
					{character.featuredImage ? (
						<img
							src={character.featuredImage}
							alt={character.name || 'Personaje'}
							className="w-full h-full object-cover"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-background/20 to-background/40">
							<User className="h-12 w-12 opacity-20" />
						</div>
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
		</EntityCardWrapper>
	);
}

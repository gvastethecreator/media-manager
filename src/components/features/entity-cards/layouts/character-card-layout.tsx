'use client';

import { cn } from '@/lib/utils';
import type { Character } from '@/types/entities/characters';
import { useState } from 'react';
import { CardBackside } from '../layers/card-backside';
import { CardBorder } from '../layers/card-border';
import { CardContainer } from '../layers/card-container';
import { CardContent } from '../layers/card-content';
import { CardDescription } from '../layers/card-description';
import { CardExplode } from '../layers/card-explode';
import { CardFooter } from '../layers/card-footer';
import { CardGlow } from '../layers/card-glow';
import { CardGrain } from '../layers/card-grain';
import { CardHeader } from '../layers/card-header';
import { CardHolographic } from '../layers/card-holographic';
import { CardImage } from '../layers/card-image';
import { CardMetadata } from '../layers/card-metadata';
import { CardScanlines } from '../layers/card-scanlines';
import { CardStats } from '../layers/card-stats';
import { CardTexture } from '../layers/card-texture';
import type { CardOptions } from '../types/unified-card-types';

// Opciones predeterminadas para la tarjeta de personaje
const DEFAULT_CHARACTER_OPTIONS: CardOptions = {
	enable3DEffect: true,
	enableHolographicEffect: false,
	enableGlowEffect: true,
	enableAnimatedBorder: true,
	enableLightHalo: true,
	enableScanlines: false,
	enableGrainEffect: false,
	designSystem: {
		preset: 'character',
		variant: 'default',
		aspectRatio: '1/1',
		cornerStyle: 'rounded',
		cornerRadius: 12,
		elevation: 2,
		shadowStyle: 'soft',
	},
	states: {
		hover: {
			scale: 1.05,
			rotate: true,
			lift: true,
			duration: 0.3,
			easing: 'ease-out',
		},
		active: {
			scale: 0.95,
			brightness: 1.2,
		},
		disabled: {
			opacity: 0.5,
			grayscale: true,
		},
		selected: {
			style: 'glow',
			color: '#3b82f6',
		},
	},
	performance: {
		enableHardwareAcceleration: true,
		useRAF: true,
		batchUpdates: true,
		throttleMs: 16,
		enableImageOptimization: true,
		enableVirtualization: true,
		enableCaching: true,
	},
	showTitle: true,
	showType: true,
	showDescription: true,
	showRarity: true,
	showTexture: true,
	showInfo: true,
	showImageCount: true,
	imageGrid: {
		layout: 'single',
		gap: 8,
		style: 'standard',
		aspectRatio: '1/1',
	},
	primaryColor: '#3b82f6',
	secondaryColor: '#1d4ed8',
};

export interface CharacterCardProps {
	character: Character;
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

export function CharacterCard({
	character,
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
}: CharacterCardProps) {
	// Combinar las opciones predeterminadas con las opciones proporcionadas
	const cardOptions = { ...DEFAULT_CHARACTER_OPTIONS, ...options };

	// Estado para el hover
	const [isHovered, setIsHovered] = useState(false);

	// Calcular la rareza basada en el nivel y las estadísticas
	const calculateRarity = () => {
		const level = character.level || 1;
		const stats = character.stats || {};
		const totalStats = Object.values(stats).reduce((sum, stat) => sum + (stat || 0), 0);
		const averageStats = totalStats / Object.keys(stats).length;

		if (level >= 20 && averageStats >= 18) return 'legendary';
		if (level >= 15 && averageStats >= 16) return 'epic';
		if (level >= 10 && averageStats >= 14) return 'rare';
		if (level >= 5 && averageStats >= 12) return 'uncommon';
		return 'common';
	};

	// Obtener el color de la clase
	const getClassColor = () => {
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

		return classColors[character.class?.toLowerCase() || ''] || '#3b82f6';
	};

	// Obtener el icono de la clase
	const getClassIcon = () => {
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

		return classIcons[character.class?.toLowerCase() || ''] || '👤';
	};

	// Obtener las estadísticas del personaje
	const getCharacterStats = () => {
		const stats = character.stats || {};
		return {
			strength: stats.strength || 10,
			dexterity: stats.dexterity || 10,
			intelligence: stats.intelligence || 10,
			charisma: stats.charisma || 10,
			vitality: stats.vitality || 10,
		};
	};

	return (
		<CardContainer
			options={cardOptions}
			isHovered={isHovered}
			onHoverChange={setIsHovered}
			onClick={onClick}
			className={cn('relative overflow-hidden', className)}
		>
			{/* Capa de fondo */}
			<CardTexture options={cardOptions} />

			{/* Capa de holográfico */}
			<CardHolographic options={cardOptions} />

			{/* Capa de brillo */}
			<CardGlow options={cardOptions} />

			{/* Capa de scanlines */}
			<CardScanlines options={cardOptions} />

			{/* Capa de grano */}
			<CardGrain options={cardOptions} />

			{/* Capa de borde */}
			<CardBorder options={cardOptions} />

			{/* Capa de explosión */}
			<CardExplode
				options={cardOptions}
				enableExplode={enableExplode}
				isExploded={isExploded}
				onExplodedChange={onExplodedChange}
				activeLayer={activeLayer}
				onActiveLayerChange={onActiveLayerChange}
			/>

			{/* Contenido principal */}
			<div className="relative z-10 flex h-full flex-col">
				{/* Encabezado */}
				<CardHeader
					options={cardOptions}
					title={character.name}
					subtitle={`${getClassIcon()} ${character.class || 'Unknown Class'}`}
					level={character.level}
					rarity={calculateRarity()}
				/>

				{/* Imagen */}
				<CardImage options={cardOptions} src={character.featuredImage || ''} alt={character.name} />

				{/* Contenido */}
				<CardContent options={cardOptions}>
					{/* Estadísticas */}
					<CardStats options={cardOptions} stats={getCharacterStats()} classColor={getClassColor()} />

					{/* Descripción */}
					<CardDescription options={cardOptions} description={character.description || ''} />

					{/* Metadatos */}
					<CardMetadata
						options={cardOptions}
						metadata={{
							race: character.race,
							alignment: character.alignment,
							background: character.background,
						}}
					/>
				</CardContent>

				{/* Pie de página */}
				<CardFooter
					options={cardOptions}
					showVisualConfig={showVisualConfig}
					onVisualConfigClick={onVisualConfigClick}
				/>
			</div>

			{/* Reverso de la tarjeta */}
			<CardBackside
				options={cardOptions}
				content={{
					title: character.name,
					description: character.description || '',
					stats: getCharacterStats(),
					metadata: {
						race: character.race,
						alignment: character.alignment,
						background: character.background,
					},
				}}
			/>
		</CardContainer>
	);
}

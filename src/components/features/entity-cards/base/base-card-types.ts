import type * as React from 'react';

// Opciones generales para el sistema de tarjetas
export interface CardOptions {
	// Opciones visuales básicas
	enable3DEffect: boolean;
	enableHolographicEffect: boolean;
	enableScanlines: boolean;
	enableLightHalo: boolean;
	enableAnimatedBorder: boolean;
	enableGrainEffect: boolean;
	enableGlowEffect: boolean;

	// Configuración de movimiento
	hoverLiftHeight: number;
	maxRotation: number;

	// Colores base
	primaryColor: string;
	secondaryColor: string;

	// Sistemas avanzados
	raritySystem: boolean;
	textureSystem: boolean;
	categorySystem: boolean;

	// Configuraciones extendidas para cada efecto
	holographicOptions?: HolographicEffectOptions;
	scanlinesOptions?: ScanlinesOptions;
	glowOptions?: GlowEffectOptions;
	borderOptions?: BorderOptions;
	grainOptions?: GrainEffectOptions;
}

// Opciones para el efecto holográfico
export interface HolographicEffectOptions {
	primaryColor?: string;
	secondaryColor?: string;
	intensity?: number;
	animationSpeed?: number;
	patternType?: 'rainbow' | 'linear' | 'radial' | 'diagonal';
	visibleOnHover?: boolean;
	layerIndex?: number;
}

// Opciones para efecto de brillo
export interface GlowEffectOptions {
	color?: string;
	intensity?: number;
	size?: number;
	blurAmount?: number;
	animationType?: 'static' | 'pulse' | 'follow-mouse' | 'none';
	pulseSpeed?: number;
	visibleOnHover?: boolean;
	layerIndex?: number;
}

// Opciones para efecto de textura
export interface TextureOptions {
	patternType?: string;
	imageUrl?: string;
	color?: string;
	opacity?: number;
	layerIndex?: number;
}

// Opciones para efecto de grano
export interface GrainEffectOptions {
	intensity?: number;
	density?: number;
	contrast?: number;
	noise?: 'digital' | 'film' | 'light' | 'heavy';
	animated?: boolean;
	animationSpeed?: number;
	visibleOnHover?: boolean;
	layerIndex?: number;
}

// Opciones para efecto de borde
export interface BorderOptions {
	width?: number;
	color?: string;
	pattern?: 'solid' | 'dashed' | 'dotted' | 'double';
	animationType?: 'pulse' | 'rotate' | 'flow' | 'none';
	animationSpeed?: number;
	animationDuration?: number;
	glowColor?: string;
	glowIntensity?: number;
	glowOnHover?: boolean;
	layerIndex?: number;
}

// Opciones para efecto de scanlines
export interface ScanlinesOptions {
	opacity?: number;
	density?: number;
	spacing?: number;
	color?: string;
	animate?: boolean;
	animationSpeed?: number;
	direction?: 'horizontal' | 'vertical' | 'diagonal';
	visibleOnHover?: boolean;
	layerIndex?: number;
}

// Configuración de rareza
export interface RarityConfig {
	name: string;
	color: string;
	borderEffect?: string;
	glowColor?: string;
	borderWidth?: string | number;
}

// Configuración de textura
export interface TextureConfig {
	name: string;
	patternType?: string;
	imageUrl?: string;
	color?: string;
	opacity?: number;
}

// Capa para el modo de visualización "explosión"
export interface ExplodeLayer {
	id: string;
	label: string;
	icon: React.ReactNode;
	transform?: React.CSSProperties;
}

// Todas las propiedades del BaseCard
export interface BaseCardProps {
	children: React.ReactNode;
	className?: string;
	options?: Partial<CardOptions>;
	rarity?: RarityConfig;
	texture?: TextureConfig;
	onHoverStart?: () => void;
	onHoverEnd?: () => void;
	onClick?: (e?: React.MouseEvent<HTMLDivElement>) => void;
	showVisualizationConfig?: boolean;
	onVisualizationConfigClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
	enableExplode?: boolean;
	explodeLayers?: ExplodeLayer[];
	isExploded?: boolean;
	activeLayer?: string | null;
	onExplodedChange?: (isExploded: boolean) => void;
	onActiveLayerChange?: (layerId: string | null) => void;
}

// Estado interno del BaseCard
export interface BaseCardState {
	isHovered: boolean;
	mousePosition: { x: number; y: number };
	rotateX: number;
	rotateY: number;
	isExploded: boolean;
	activeLayer: string | null;
}

// Función para transformar capas en modo explodado
export type ExplodeLayerTransformFunction = (layerIndex: number) => React.CSSProperties;

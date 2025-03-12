import type { ReactNode } from 'react';

// Tipos base para efectos
export interface HolographicEffectOptions {
	patternType?: string;
	intensity?: number;
	animationSpeed?: number;
	visibleOnHover?: boolean;
	primaryColor?: string;
	secondaryColor?: string;
	layerIndex?: number;
}

export interface ScanlinesOptions {
	opacity?: number;
	spacing?: number;
	color?: string;
	animate?: boolean;
	direction?: 'horizontal' | 'vertical';
	visibleOnHover?: boolean;
	layerIndex?: number;
}

export interface GlowEffectOptions {
	color?: string;
	intensity?: number;
	size?: number;
	blurAmount?: number;
	animationType?: 'static' | 'pulse' | 'follow-mouse';
	pulseSpeed?: number;
	visibleOnHover?: boolean;
	layerIndex?: number;
}

export interface BorderOptions {
	color?: string;
	width?: number;
	pattern?: string;
	animationType?: string;
	glowColor?: string;
	glowIntensity?: number;
	glowOnHover?: boolean;
	layerIndex?: number;
	gradientColors?: string[];
	gradientAngle?: number;
	animation?: {
		type: string;
		duration: number;
		timing: string;
		iteration: string;
	};
}

export interface GrainEffectOptions {
	intensity?: number;
	density?: number;
	contrast?: number;
	noise?: string;
	animated?: boolean;
	animationSpeed?: number;
	visibleOnHover?: boolean;
	layerIndex?: number;
}

// Configuración de rareza y textura
export interface RarityConfig {
	id: string;
	name: string;
	color: string;
	borderWidth?: string | number;
	glowColor?: string;
	borderEffect?: 'static' | 'animated' | 'none';
	level?: number;
}

export interface TextureConfig {
	id: string;
	name: string;
	pattern: string;
	opacity?: number;
	scale?: number;
	blend?: string;
}

// Tipos para la configuración del grid de imágenes
export type ImageGridLayout = 'single' | 'dual' | 'quad' | 'six';
export type ImageGridStyle = 'standard' | 'masonry' | 'carousel';

// Interfaz base para opciones de tarjeta
export interface BaseCardOptions {
	// Efectos básicos
	enable3DEffect?: boolean;
	enableHolographicEffect?: boolean;
	enableScanlines?: boolean;
	enableGlowEffect?: boolean;
	enableBorderEffect?: boolean;
	enableGrainEffect?: boolean;
	enableLightHalo?: boolean;
	enableAnimatedBorder?: boolean;

	// Configuraciones de efectos
	holographicOptions?: HolographicEffectOptions;
	scanlinesOptions?: ScanlinesOptions;
	glowOptions?: GlowEffectOptions;
	borderOptions?: BorderOptions;
	grainOptions?: GrainEffectOptions;

	// Sistema de diseño
	designSystem?: {
		preset?: string;
		variant?: string;
		aspectRatio?: string;
		cornerStyle?: string;
		cornerRadius?: number;
		elevation?: number;
		shadowStyle?: string;
	};

	// Configuración de grid de imágenes
	imageGridLayout?: ImageGridLayout;
	imageGridGap?: number;
	imageGridStyle?: ImageGridStyle;
	showImageCount?: boolean;
	imageGridAspectRatio?: string;

	// Sistemas
	raritySystem?: boolean;
	textureSystem?: boolean;
	categorySystem?: boolean;

	// Valores numéricos
	hoverLiftHeight?: number;
	maxRotation?: number;

	// Colores
	primaryColor?: string;
	secondaryColor?: string;
}

// Interfaz para la transferencia de datos a la API
export interface CardConfigurationDto
	extends Omit<
		BaseCardOptions,
		'holographicOptions' | 'scanlinesOptions' | 'glowOptions' | 'borderOptions' | 'grainOptions'
	> {
	entityType: string;
	holographicOptions?: string;
	scanlinesOptions?: string;
	glowOptions?: string;
	borderOptions?: string;
	grainOptions?: string;
}

// Interfaz para estadísticas de entidad
export interface EntityStats {
	imageCount?: number;
	size?: number;
	age?: string | number;
	ageText?: string;
	lastUpdated?: Date | null;
	createdAt?: Date | null;
	customStats?: Array<{
		icon: ReactNode;
		value: string | number;
		label: string;
		id?: string;
	}>;
}

// Sistema de rarezas para categorizar entidades
export interface RarityLevel {
	id: string;
	label: string;
	minValue: number;
	color: string;
	borderColor: string;
	gradient: string;
	badgeClass: string;
	barClass: string;
}

// Tipo para propiedades comunes de datos
export interface CommonDataProps {
	id?: string;
	name?: string;
	emoji?: string;
	color?: string;
	createdAt?: Date | string;
	_count?: {
		images?: number;
		[key: string]: number | undefined;
	};
	totalSize?: number;
}

import type { MouseEvent, ReactNode } from 'react';
import type {
	ExplodeLayerTransformFunction,
	GlowEffectOptions,
	GrainEffectOptions,
	HolographicEffectOptions,
	ScanlinesOptions,
	TextureConfig,
} from './base-card-types';

/**
 * Respuesta estándar para las acciones del servidor relacionadas con capas
 */
export interface LayerConfigResponse<T = unknown> {
	success: boolean;
	message: string;
	data?: T;
}

/**
 * Props para el contenedor principal de la tarjeta
 */
export interface CardContainerProps {
	id?: string;
	isHovered: boolean;
	isExploded: boolean;
	enable3DEffect?: boolean;
	transformStyle?: Record<string, unknown>;
	rarityBorderStyle?: Record<string, unknown>;
	filterId?: string;
	onHoverStart?: () => void;
	onHoverEnd?: () => void;
	onMouseMove?: (e: MouseEvent<HTMLDivElement>) => void;
	onClick?: (e: MouseEvent<HTMLDivElement>) => void;
	children: ReactNode;
	// Propiedades adicionales para estilos
	disabled?: boolean;
	rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
	borderSize?: 'none' | 'sm' | 'md' | 'lg';
}

/**
 * Props base para todas las capas
 */
export interface BaseLayerProps {
	isExploded: boolean;
	isHovered: boolean;
	activeLayer: string | null;
	getExplodeLayerTransform: ExplodeLayerTransformFunction;
	visibleOnHover?: boolean;
}

/**
 * Props para la capa holográfica
 */
export interface HolographicLayerProps extends BaseLayerProps {
	primaryColor: string;
	secondaryColor: string;
	mousePosition: { x: number; y: number };
	options?: HolographicEffectOptions;
}

/**
 * Props para la capa de escaneo
 */
export interface ScanlinesLayerProps extends BaseLayerProps {
	options?: ScanlinesOptions;
}

/**
 * Props para la capa de brillo
 */
export interface GlowEffectLayerProps extends BaseLayerProps {
	mousePosition: { x: number; y: number };
	glowConfig: {
		color: string;
		intensity: number;
		size: number;
		animationType: string;
	};
	options?: GlowEffectOptions;
}

/**
 * Props para la capa de grano
 */
export interface GrainEffectLayerProps extends BaseLayerProps {
	texture?: TextureConfig;
	options?: GrainEffectOptions;
}

/**
 * Props para la capa de borde animado
 */
export interface AnimatedBorderLayerProps extends BaseLayerProps {
	borderConfig: {
		color: string;
		width: number;
		pattern: string;
		animationType: string;
		animation: {
			type: string;
			duration: number;
			timing: string;
			iteration: string;
		};
		glowColor?: string;
		glowIntensity?: number;
	};
}

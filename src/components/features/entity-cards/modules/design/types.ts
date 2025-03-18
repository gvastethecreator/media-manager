/**
 * 🎨 Tipos para el sistema de diseño de tarjetas
 */

import type { CardOptions } from '../../types/card-settings-types';

/**
 * Configuración del sistema de diseño
 */
export interface DesignSystem {
	// Configuración general
	borderRadius: number;
	padding: number;
	aspectRatio: string;
	maxWidth: number;

	// Sombras y elevación
	elevation: number;
	shadowColor: string;

	// Estilo de fondo
	backgroundColor: string;
	backgroundOpacity: number;
	backdropFilter: string;
	backdropBlurAmount: number;

	// Bordes
	borderWidth: number;
	borderStyle: string;
	borderColor: string;

	// Avanzado
	customCssClasses: string[];
	customCssVariables: Record<string, string>;

	// Propiedades adicionales para compatibilidad
	preset?: string;
	variant?: string;
	cornerStyle?: string;
	cornerRadius?: number;
	shadowStyle?: string;
	colorScheme?: string;
	fontFamily?: string;
	surfaceStyle?: string;
	layoutDensity?: string;
	contentPadding?: string | number;
	glassEffect?: boolean;
	accentColor?: string;
	textColor?: string;
}

/**
 * Preset del sistema de diseño
 */
export interface DesignSystemPreset {
	id: string;
	name: string;
	description: string;
	designSystem: DesignSystem;
}

/**
 * Props para el módulo de diseño
 */
export interface DesignModuleProps {
	initialDesignSystem?: Partial<DesignSystem>;
	onChange?: (designSystem: DesignSystem) => void;
	cardOptions?: CardOptions;
	onCardOptionsChange?: (options: Partial<CardOptions>) => void;
}

/**
 * Props para el panel de diseño
 */
export interface DesignPanelProps {
	designSystem: DesignSystem;
	onChange: (designSystem: DesignSystem) => void;
	cardOptions?: CardOptions;
	onCardOptionsChange?: (options: Partial<CardOptions>) => void;
}

/**
 * Hook para el sistema de diseño
 */
export interface UseDesignSystemHook {
	designSystem: DesignSystem;
	updateDesignSystem: (update: Partial<DesignSystem>) => void;
	resetDesignSystem: () => void;
	generateCssStyles: () => Record<string, string>;
}

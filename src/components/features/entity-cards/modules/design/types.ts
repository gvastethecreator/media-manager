/**
 * Tipos para el sistema de diseño de tarjetas
 */

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
 * Props para el componente DesignPanel
 */
export interface DesignPanelProps {
	designSystem: DesignSystem;
	onChange: (designSystem: DesignSystem) => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Props para el componente DesignModule
 */
export interface DesignModuleProps {
	initialDesignSystem?: Partial<DesignSystem>;
	onChange?: (designSystem: DesignSystem) => void;
	disabled?: boolean;
	className?: string;
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

/**
 * Tipos para el sistema de explosión de capas
 */

/**
 * Dirección de explosión
 */
export type ExplodeDirection = 'x' | 'y' | 'z' | '3d';

/**
 * Configuración del sistema de explosión
 */
export interface ExplodeSystem {
	// Configuración general
	enabled: boolean;
	distance: number;
	direction: ExplodeDirection;
	perspective: number;

	// Configuración de ángulos
	rotationX: number;
	rotationY: number;
	rotationZ: number;

	// Configuración de animación
	animated: boolean;
	animationDuration: number;
	staggered: boolean;
	staggerDelay: number;

	// Opciones adicionales
	showLabels: boolean;
	autoRotate: boolean;
	autoRotateSpeed: number;
	centerLayer: string;
	expandOnHover: boolean;
	hoverExpandFactor: number;
}

/**
 * Preset del sistema de explosión
 */
export interface ExplodeSystemPreset {
	id: string;
	name: string;
	description: string;
	explodeSystem: ExplodeSystem;
}

/**
 * Props para el componente ExplodePanel
 */
export interface ExplodePanelProps {
	explodeSystem: ExplodeSystem;
	onChange: (explodeSystem: ExplodeSystem) => void;
	layersList?: string[];
	disabled?: boolean;
	className?: string;
}

/**
 * Props para el componente ExplodeModule
 */
export interface ExplodeModuleProps {
	initialExplodeSystem?: Partial<ExplodeSystem>;
	layersList?: string[];
	onChange?: (explodeSystem: ExplodeSystem) => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Hook para el sistema de explosión
 */
export type UseExplodeSystemHook = (initialSystem?: Partial<ExplodeSystem>) => {
	explodeSystem: ExplodeSystem;
	updateExplodeSystem: (update: Partial<ExplodeSystem>) => void;
	resetExplodeSystem: () => void;
	generateExplodeStyles: (layerIndex: number, totalLayers: number) => React.CSSProperties;
};

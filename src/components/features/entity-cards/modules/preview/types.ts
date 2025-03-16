/**
 * Tipos para el módulo de previsualización
 */

/**
 * Opciones de configuración de previsualización
 */
export interface PreviewOptions {
	size: 'small' | 'medium' | 'large' | 'custom';
	customWidth?: number;
	customHeight?: number;
	showControls: boolean;
	showInfo: boolean;
	showBorder: boolean;
	backgroundColor?: string;
	enableInteraction: boolean;
	autoRotate: boolean;
	rotationSpeed?: number;
	zoomLevel?: number;
}

/**
 * Opciones predeterminadas de previsualización
 */
export const DEFAULT_PREVIEW_OPTIONS: PreviewOptions = {
	size: 'medium',
	customWidth: 300,
	customHeight: 400,
	showControls: true,
	showInfo: true,
	showBorder: true,
	backgroundColor: 'transparent',
	enableInteraction: true,
	autoRotate: false,
	rotationSpeed: 1,
	zoomLevel: 1,
};

/**
 * Opciones de tamaño para la previsualización
 */
export const PREVIEW_SIZE_OPTIONS = [
	{ value: 'small', label: 'Pequeño' },
	{ value: 'medium', label: 'Mediano' },
	{ value: 'large', label: 'Grande' },
	{ value: 'custom', label: 'Personalizado' },
];

/**
 * Props para el módulo de previsualización
 */
export interface PreviewModuleProps {
	initialOptions?: Partial<PreviewOptions>;
	onChange?: (options: PreviewOptions) => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Props para el panel de previsualización
 */
export interface PreviewPanelProps {
	cardOptions: any;
	rarity?: any;
	texture?: any;
	showInfo?: boolean;
	showControls?: boolean;
	showBorder?: boolean;
	enableInteraction?: boolean;
	previewMode?: 'full' | 'thumbnail' | 'compact';
	className?: string;
	entityType?: string;
}

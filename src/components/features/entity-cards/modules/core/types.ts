/**
 * 🔧 Tipos para el módulo core
 */
import type { SettingsPanelProps } from '../../types';

/**
 * Opciones de configuración del core
 */
export interface CoreOptions {
	enabled: boolean;
	layerSystem?: {
		order?: string[];
		layerBlending?: string;
		layerSpacing?: number;
	};
	interactiveMode?: string;
	hoverDelay?: number;
	touchBehavior?: string;
	pointerPrecision?: string;
	motionReduction?: boolean;
	performanceMode?: string;
	enableCache?: boolean;
	loadingStrategy?: string;
	enablePreloading?: boolean;
	enableHaptics?: boolean;
	hapticIntensity?: number;
	enableSounds?: boolean;
	soundVolume?: number;
	soundTheme?: string;
	contentArrangement?: string;
	enableAutoHeight?: boolean;
	maxLines?: number;
	textTruncation?: string;
	mediaFit?: string;
}

/**
 * Valores predeterminados para opciones del core
 */
export const DEFAULT_CORE_OPTIONS: CoreOptions = {
	enabled: false,
	layerSystem: {
		order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
		layerBlending: 'screen',
		layerSpacing: 2,
	},
	interactiveMode: 'hover',
	hoverDelay: 100,
	touchBehavior: 'tap',
	pointerPrecision: 'medium',
	motionReduction: false,
	performanceMode: 'balanced',
	enableCache: true,
	loadingStrategy: 'progressive',
	enablePreloading: true,
	enableHaptics: false,
	hapticIntensity: 0.5,
	enableSounds: false,
	soundVolume: 0.5,
	soundTheme: 'minimal',
	contentArrangement: 'standard',
	enableAutoHeight: true,
	maxLines: 3,
	textTruncation: 'ellipsis',
	mediaFit: 'cover',
};

/**
 * Props para el componente de configuración del core
 */
export interface CorePanelProps extends SettingsPanelProps {
	/**
	 * Opciones iniciales para el panel
	 */
	initialOptions?: Partial<CoreOptions>;
}

/**
 * Opciones para los modos interactivos
 */
export const INTERACTIVE_MODE_OPTIONS = [
	{ value: 'hover', label: 'Hover' },
	{ value: 'click', label: 'Click' },
	{ value: 'both', label: 'Ambos' },
	{ value: 'none', label: 'Ninguno' },
];

/**
 * Opciones para el comportamiento táctil
 */
export const TOUCH_BEHAVIOR_OPTIONS = [
	{ value: 'tap', label: 'Tap' },
	{ value: 'press', label: 'Press' },
	{ value: 'double-tap', label: 'Double Tap' },
];

/**
 * Opciones para la precisión del puntero
 */
export const POINTER_PRECISION_OPTIONS = [
	{ value: 'low', label: 'Baja' },
	{ value: 'medium', label: 'Media' },
	{ value: 'high', label: 'Alta' },
];

/**
 * Interfaz para las opciones de video
 * @typedef {Object} VideoOptions
 */
export interface VideoOptions {
	// Diseño
	enable3DEffect: boolean;
	designSystem?: {
		cornerStyle?: string;
		elevation?: number;
	};

	// Efectos Básicos
	enableHolographicEffect: boolean;
	enableGlowEffect: boolean;
	enableAnimatedBorder: boolean;
	enableLightHalo: boolean;

	// Efectos de Profundidad
	effects?: {
		shadow?: {
			enabled?: boolean;
			color?: string;
			blur?: number;
			spread?: number;
		};
		reflection?: {
			enabled?: boolean;
			opacity?: number;
			blur?: number;
		};
		parallax?: {
			enabled?: boolean;
			intensity?: number;
			perspective?: number;
		};
	};

	// Rendimiento
	performance?: {
		enableHardwareAcceleration?: boolean;
		useRAF?: boolean;
		batchUpdates?: boolean;
		throttleMs?: number;
	};

	// Específico para Video
	videoAutoplay?: boolean;
	videoLoop?: boolean;
	videoMuted?: boolean;
	videoControls?: boolean;
	videoPlaybackRate?: number;
}

/**
 * Valores predeterminados para las opciones de video
 */
export const DEFAULT_VIDEO_OPTIONS: VideoOptions = {
	enable3DEffect: false,
	designSystem: {
		cornerStyle: 'rounded',
		elevation: 2,
	},
	enableHolographicEffect: false,
	enableGlowEffect: false,
	enableAnimatedBorder: false,
	enableLightHalo: false,
	effects: {
		shadow: {
			enabled: true,
			color: 'rgba(0,0,0,0.25)',
			blur: 10,
			spread: 0,
		},
		reflection: {
			enabled: false,
			opacity: 0.2,
			blur: 5,
		},
		parallax: {
			enabled: false,
			intensity: 10,
			perspective: 1000,
		},
	},
	performance: {
		enableHardwareAcceleration: true,
		useRAF: true,
		batchUpdates: true,
		throttleMs: 100,
	},
	videoAutoplay: false,
	videoLoop: true,
	videoMuted: true,
	videoControls: true,
	videoPlaybackRate: 1.0,
};

/**
 * Opciones para estilos de esquinas
 */
export const cornerStyleOptions = [
	{ value: 'square', label: 'Cuadrada' },
	{ value: 'rounded', label: 'Redondeada' },
	{ value: 'beveled', label: 'Biselada' },
];

/**
 * Props para el módulo de video
 */
export interface VideoModuleProps {
	initialOptions?: Partial<VideoOptions>;
	onChange?: (options: VideoOptions) => void;
	disabled?: boolean;
	className?: string;
}

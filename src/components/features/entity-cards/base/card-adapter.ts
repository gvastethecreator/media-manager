import type {
	BorderOptions as BaseBorderOptions,
	CardOptions as BaseCardOptions,
	RarityConfig,
} from '../types/base-card-types';
import type { CardOptions as SettingsCardOptions } from '../types/card-settings-types';

/**
 * Adapta las opciones de configuración al formato que espera BaseCard
 *
 * @param options Opciones desde el panel de configuración
 * @returns Opciones formateadas para BaseCard
 */
export function adaptSettingsToBaseOptions(options: SettingsCardOptions): Partial<BaseCardOptions> {
	// Convertir las opciones de configuración al formato que espera BaseCard
	return {
		// Opciones visuales básicas
		enable3DEffect: options.enable3DEffect,
		enableHolographicEffect: options.enableHolographicEffect,
		enableScanlines: options.enableScanlines,
		enableGlowEffect: options.enableGlow || options.enableGlowEffect,
		enableAnimatedBorder: options.enableAnimatedBorder,
		enableGrainEffect: options.enableGrainEffect,

		// Configuraciones específicas de efectos
		scanlinesOptions: options.scanlinesOptions,
		borderOptions: options.borderOptions
			? {
					width: options.borderOptions.width || 2,
					pattern: (options.borderOptions.pattern || 'solid') as 'solid' | 'dashed' | 'dotted' | 'double' | 'gradient',
					animationType: (options.borderOptions.animationType || 'none') as
						| 'none'
						| 'flow'
						| 'pulse'
						| 'rainbow'
						| 'shimmer',
					animation: {
						type: (options.borderOptions.animation?.type || options.borderOptions.animationType || 'none') as
							| 'none'
							| 'flow'
							| 'pulse'
							| 'rainbow'
							| 'shimmer',
						duration: options.borderOptions.animation?.duration || 3000,
						timing: options.borderOptions.animation?.timing || 'linear',
						iteration:
							options.borderOptions.animation?.iteration === 'infinite'
								? 'infinite'
								: typeof options.borderOptions.animation?.iteration === 'number'
									? options.borderOptions.animation?.iteration
									: ('infinite' as const),
					},
					// Otras propiedades opcionales
					color: options.borderOptions.color,
					glowColor: options.borderOptions.color,
					glowIntensity: 5,
					glowOnHover: true,
				}
			: undefined,
		grainOptions: options.grainOptions,

		// Sistema de rareza (adaptación de formato)
		raritySystem: options.raritySystem ? { enabled: true } : undefined,

		// Configuraciones de movimiento
		hoverLiftHeight: options.hoverLiftHeight,
		maxRotation: options.maxRotation,

		// Imagen
		imageOverlay: options.imageOverlay,
		imageOverlayOpacity: options.imageOverlayOpacity,

		// Colores
		primaryColor: options.primaryColor,
		secondaryColor: options.secondaryColor,
	};
}

/**
 * Adapta las opciones de BaseCard al formato que esperan los componentes de configuración
 *
 * @param options Opciones del componente base
 * @returns Opciones formateadas para el panel de configuración
 */
export function adaptBaseToSettingsOptions(options: Partial<BaseCardOptions>): SettingsCardOptions {
	// Valores por defecto para las propiedades requeridas
	const defaultValues: Partial<SettingsCardOptions> = {
		imageGridLayout: 'single',
		imageGridGap: 4,
		showImageCount: true,
		imageGridStyle: 'standard',
		enableScanlines: false,
		enableGrainEffect: false,
		enableLightHalo: false,
		enableAnimatedBorder: false,
		enableGlow: false,
		enableLazyLoading: true,
		showTitle: true,
		showType: true,
		showDescription: true,
		showRarity: true,
		showTexture: true,
		showInfo: true,
		enableShadow: true,
		cardShadowSize: 'md',
		cardShadowColor: 'rgba(0,0,0,0.1)',
		cardRoundedSize: 'md',
		enableHoverAnimation: true,
		cardBorderSize: 'none',
		enableParallaxEffect: false,
		enableBlurEffect: false,
		enableSkeleton: true,
		enablePrefetch: true,
		enableHover: true,
		enableActive: true,
		enableFocus: true,
		enableDisabled: false,
		raritySystem: false,
		textureSystem: false,
		categorySystem: false,
	};

	// Convertir raritySystem de objeto a booleano
	const adaptedOptions: Record<string, unknown> = {
		...options,
		raritySystem: !!options.raritySystem?.enabled,
		enableGlow: options.enableGlowEffect,
	};

	return { ...defaultValues, ...adaptedOptions } as SettingsCardOptions;
}

/**
 * Adapta las opciones para un tipo específico de layout
 * Cada entidad tiene características específicas que se aplican automáticamente
 * según su tipo (album, tag, character, etc.)
 *
 * @param options Opciones base
 * @param layoutType Tipo de layout/entidad
 * @returns Opciones adaptadas para el tipo específico
 */
export function adaptOptionsForLayout(options: Partial<BaseCardOptions>, layoutType: string): Partial<BaseCardOptions> {
	// Ajustes específicos según el tipo de layout
	switch (layoutType) {
		case 'album':
			return {
				...options,
				enableHolographicEffect: options.enableHolographicEffect ?? true,
				enableGlowEffect: options.enableGlowEffect ?? true,
			};
		case 'tag':
			return {
				...options,
				enableScanlinesEffect: options.enableScanlinesEffect ?? false,
				enableGrainEffect: options.enableGrainEffect ?? true,
			};
		case 'character':
			return {
				...options,
				enableHolographicEffect: options.enableHolographicEffect ?? true,
				enableAnimatedBorder: options.enableAnimatedBorder ?? true,
			};
		case 'place':
		case 'world-item':
			return {
				...options,
				enable3DEffect: options.enable3DEffect ?? true,
				enableGlowEffect: options.enableGlowEffect ?? true,
			};
		case 'concept':
		case 'prompt':
		case 'note':
			return {
				...options,
				enableScanlinesEffect: options.enableScanlinesEffect ?? true,
				enableGrainEffect: options.enableGrainEffect ?? false,
			};
		default:
			return options;
	}
}

/**
 * Verifica si las opciones pasadas son del tipo SettingsCardOptions
 * @param options - Opciones a verificar
 * @returns True si las opciones son del tipo SettingsCardOptions
 */
export function isSettingsCardOptions(options: unknown): boolean {
	if (!options || typeof options !== 'object') {
		return false;
	}

	// Verificar propiedades específicas del tipo SettingsCardOptions
	const settingsOptionProps = [
		'showTitle',
		'showType',
		'showDescription',
		'imageGridLayout',
		'imageGridGap',
		'enableGlow',
		'enableScanlines',
	];

	for (const prop of settingsOptionProps) {
		if (prop in (options as Record<string, unknown>)) {
			return true;
		}
	}

	return false;
}

/**
 * Genera una configuración de rareza basada en los atributos de una entidad.
 * Esto ayuda a mantener la consistencia entre diferentes layouts.
 *
 * @param rarityName Nombre de la rareza (common, uncommon, rare, epic, legendary)
 * @param color Color personalizado (opcional) - usado si no se especifica rareza
 * @returns Configuración de rareza para usar con BaseCard
 */
export function generateRarityConfig(rarityName?: string, color?: string): RarityConfig {
	// Colores por defecto para cada nivel de rareza
	const rarityColors = {
		common: '#6b7280', // Gray
		uncommon: '#1e90ff', // Blue
		rare: '#ffd700', // Gold
		epic: '#9932cc', // Purple
		legendary: '#ff4500', // Red-Orange
	};

	// Colores de brillo para cada nivel de rareza
	const glowColors = {
		common: undefined,
		uncommon: undefined,
		rare: '#ffd700',
		epic: '#9932cc',
		legendary: '#ff4500',
	};

	// Determinar el ancho del borde según la rareza
	const getBorderWidth = () => {
		switch (rarityName) {
			case 'legendary':
			case 'epic':
				return '2px';
			default:
				return '1px';
		}
	};

	// Determinar el efecto de borde según la rareza
	const getBorderEffect = () => {
		switch (rarityName) {
			case 'legendary':
				return 'animated';
			default:
				return 'static';
		}
	};

	// Crear configuración final
	return {
		name: rarityName || 'common',
		color: rarityName ? rarityColors[rarityName as keyof typeof rarityColors] : color || '#3b82f6',
		borderWidth: getBorderWidth(),
		borderEffect: getBorderEffect(),
		glowColor: rarityName ? glowColors[rarityName as keyof typeof glowColors] : undefined,
	};
}

/**
 * Serializa las opciones complejas para guardar en la base de datos
 * @param options - Opciones a serializar
 * @returns Opciones serializadas para almacenamiento
 */
export function serializeOptionsForStorage(options: SettingsCardOptions): Record<string, unknown> {
	const serializedOptions: Record<string, unknown> = { ...options };

	// Convertir objetos a JSON para almacenamiento en DB
	if (options.holographicOptions) {
		serializedOptions.holographicOptions = JSON.stringify(options.holographicOptions);
	}

	if (options.scanlinesOptions) {
		serializedOptions.scanlinesOptions = JSON.stringify(options.scanlinesOptions);
	}

	if (options.glowOptions) {
		serializedOptions.glowOptions = JSON.stringify(options.glowOptions);
	}

	if (options.borderOptions) {
		serializedOptions.borderOptions = JSON.stringify(options.borderOptions);
	}

	if (options.grainOptions) {
		serializedOptions.grainOptions = JSON.stringify(options.grainOptions);
	}

	return serializedOptions;
}

/**
 * Deserializa las opciones desde la base de datos
 * @param data - Datos serializados desde DB
 * @returns Opciones deserializadas
 */
export function deserializeOptionsFromStorage(data: Record<string, unknown>): SettingsCardOptions {
	const deserializedOptions: Record<string, unknown> = { ...data };

	// Convertir cadenas JSON a objetos
	try {
		if (typeof data.holographicOptions === 'string') {
			deserializedOptions.holographicOptions = JSON.parse(data.holographicOptions);
		}

		if (typeof data.scanlinesOptions === 'string') {
			deserializedOptions.scanlinesOptions = JSON.parse(data.scanlinesOptions);
		}

		if (typeof data.glowOptions === 'string') {
			deserializedOptions.glowOptions = JSON.parse(data.glowOptions);
		}

		if (typeof data.borderOptions === 'string') {
			deserializedOptions.borderOptions = JSON.parse(data.borderOptions);
		}

		if (typeof data.grainOptions === 'string') {
			deserializedOptions.grainOptions = JSON.parse(data.grainOptions);
		}
	} catch (error) {
		console.error('Error al deserializar opciones:', error);
	}

	return deserializedOptions as SettingsCardOptions;
}

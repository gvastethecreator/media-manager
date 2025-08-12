/**
 * @file Esquemas de validación para configuración
 * @module transformers/settings/schema
 */

import { z } from 'zod';

// Esquema para configuración de columnas de ListView
export const listColumnConfigSchema = z.object({
	key: z.string(),
	label: z.string(),
	width: z.union([z.number(), z.literal('auto')]),
	sortable: z.boolean(),
	visible: z.boolean(),
	align: z.enum(['left', 'center', 'right']).optional(),
	resizable: z.boolean().optional(),
	minWidth: z.number().optional(),
	maxWidth: z.number().optional(),
	order: z.number().optional(),
	// Note: renderer function is handled separately in runtime, not in schema
});

// Esquema para configuración de ListView
export const listViewConfigSchema = z
	.object({
		columns: z.array(listColumnConfigSchema),
		rowHeight: z.number().min(40).max(120).default(40),
		showZebraStripes: z.boolean().default(false),
		showHeader: z.boolean().default(true),
		allowResize: z.boolean().default(true),
		allowReorder: z.boolean().default(true),
		showThumbnails: z.boolean().default(true),
		thumbnailSize: z.enum(['none', 'small', 'medium', 'large']).default('medium'),
		rowGap: z.number().min(0).max(20).default(4),
		cellPadding: z.number().min(4).max(24).default(8),
	})
	.default({
		columns: [],
		rowHeight: 40,
		showZebraStripes: false,
		showHeader: true,
		allowResize: true,
		allowReorder: true,
		showThumbnails: true,
		thumbnailSize: 'medium',
		rowGap: 4,
		cellPadding: 8,
	});

// Esquema para configuración de metadata de CardsView
export const cardMetadataConfigSchema = z.object({
	showSize: z.boolean().default(true),
	showDate: z.boolean().default(true),
	showType: z.boolean().default(true),
	showDimensions: z.boolean().default(true),
	showDuration: z.boolean().default(true),
	showTags: z.boolean().default(true),
	showCollection: z.boolean().default(false),
	maxTags: z.number().min(0).max(10).default(3),
});

// Esquema para botones de acción de CardsView
export const cardActionButtonSchema = z.object({
	id: z.string(),
	icon: z.string(),
	tooltip: z.string(),
	visible: z.boolean().default(true),
	position: z.enum(['top-left', 'top-right', 'bottom-left', 'bottom-right']).default('top-right'),
});

// Esquema para configuración interactiva de CardsView
export const cardInteractiveConfigSchema = z.object({
	enabled: z.boolean().default(true),
	showActionButtons: z.boolean().default(true),
	actionButtons: z.array(cardActionButtonSchema).default([]),
	showInfoOverlay: z.boolean().default(false),
	overlayPosition: z.enum(['top', 'bottom', 'center']).default('bottom'),
	showQuickPreview: z.boolean().default(false),
	hoverDelay: z.number().min(0).max(2000).default(300),
});

// Esquema completo para configuración de CardsView
export const cardsViewConfigSchema = z.object({
	cardStyle: z.enum(['compact', 'detailed', 'minimal']).default('detailed'),
	thumbnailSize: z.enum(['none', 'small', 'medium', 'large']).default('medium'),
	cardWidth: z.number().min(120).max(500).default(280),
	minCardWidth: z.number().min(100).max(300).default(200),
	maxCardWidth: z.number().min(200).max(600).default(400),
	aspectRatio: z.number().min(0.5).max(3).default(1.25),
	gap: z.number().min(0).max(50).default(16),
	padding: z.number().min(0).max(50).default(24),
	metadataConfig: cardMetadataConfigSchema.default({}),
	interactiveConfig: cardInteractiveConfigSchema.default({}),
	showShadows: z.boolean().default(true),
	roundedCorners: z.boolean().default(true),
	animationsEnabled: z.boolean().default(true),
	animationDuration: z.number().min(50).max(1000).default(300),
	allowMultiSelect: z.boolean().default(true),
	showSelectionIndicators: z.boolean().default(true),
});

// Esquema para configuración de espaciado de MasonryView
export const masonrySpacingConfigSchema = z.object({
	gap: z.number().min(0).max(50).default(16),
	padding: z.number().min(0).max(50).default(24),
	minColumnWidth: z.number().min(100).max(300).default(200),
	maxColumnWidth: z.number().min(200).max(600).default(400),
	minColumns: z.number().min(1).max(3).default(1),
	maxColumns: z.number().min(3).max(12).default(8),
});

// Esquema para configuración de altura de MasonryView
export const masonryHeightConfigSchema = z.object({
	baseHeight: z.number().min(100).max(500).default(240),
	minHeight: z.number().min(80).max(200).default(120),
	maxHeight: z.number().min(300).max(1000).default(600),
	useRealDimensions: z.boolean().default(true),
	variationFactor: z.number().min(0).max(1).default(0.3),
	defaultAspectRatios: z.record(z.string(), z.number()).default({
		image: 1.25,
		video: 0.5625,
		folder: 1.0,
		audio: 2.0,
		document: Math.SQRT2,
		default: 1.2,
	}),
});

// Esquema para configuración de optimización de MasonryView
export const masonryOptimizationConfigSchema = z.object({
	algorithm: z.enum(['shortest-column', 'balanced', 'left-to-right']).default('shortest-column'),
	autoRebalance: z.boolean().default(true),
	minimizeGaps: z.boolean().default(true),
	respectAspectRatio: z.boolean().default(true),
	batchSize: z.number().min(10).max(200).default(50),
	recalculateDebounce: z.number().min(50).max(500).default(150),
});

// Esquema completo para configuración de MasonryView
export const masonryViewConfigSchema = z.object({
	spacing: masonrySpacingConfigSchema.default({}),
	height: masonryHeightConfigSchema.default({}),
	optimization: masonryOptimizationConfigSchema.default({}),
	animationsEnabled: z.boolean().default(true),
	animationDuration: z.number().min(50).max(1000).default(300),
	hoverEffects: z.boolean().default(true),
	showShadows: z.boolean().default(true),
	roundedCorners: z.boolean().default(true),
	allowMultiSelect: z.boolean().default(true),
	showSelectionIndicators: z.boolean().default(true),
});

// Esquema para configuración de GridView
// Esquema para la configuración de vista de cuadrícula
export const gridViewConfigSchema = z
	.object({
		thumbnailSize: z.enum(['none', 'small', 'medium', 'large']).default('medium'),
		itemSize: z.number().min(50).max(800).default(200),
		aspectRatio: z.enum(['auto', 'square', '4:3', '16:9', 'custom']).default('auto'),
		customAspectRatio: z
			.object({
				width: z.number().min(1),
				height: z.number().min(1),
			})
			.optional(),
		gap: z.number().min(0).max(50).default(16),
		columns: z.union([z.number().min(1).max(20), z.literal('auto')]).default('auto'),
		showLabels: z.boolean().default(true),
		labelPosition: z.enum(['top', 'bottom', 'overlay']).default('bottom'),
		hoverInfo: z.enum(['none', 'basic', 'detailed']).default('basic'),
		animations: z
			.object({
				enabled: z.boolean().default(true),
				duration: z.number().min(50).max(1000).default(200),
				hoverScale: z.number().min(1).max(1.2).default(1.05),
			})
			.default({
				enabled: true,
				duration: 200,
				hoverScale: 1.05,
			}),
	})
	.default({
		thumbnailSize: 'medium',
		itemSize: 200,
		aspectRatio: 'auto',
		gap: 16,
		columns: 'auto',
		showLabels: true,
		labelPosition: 'bottom',
		hoverInfo: 'basic',
		animations: {
			enabled: true,
			duration: 200,
			hoverScale: 1.05,
		},
	});

// Esquema para configuración de animaciones globales
export const animationConfigSchema = z.object({
	enabled: z.boolean().default(true),
	duration: z.number().min(0).max(2000).default(200),
	easing: z.enum(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out']).default('ease-out'),
	types: z
		.object({
			hover: z
				.object({
					enabled: z.boolean().default(true),
					duration: z.number().min(0).max(1000).default(150),
					scale: z.number().min(1).max(1.5).default(1.05),
				})
				.default({}),
			selection: z
				.object({
					enabled: z.boolean().default(true),
					duration: z.number().min(0).max(1000).default(200),
					highlightColor: z.string().default('#3b82f6'),
				})
				.default({}),
			loading: z
				.object({
					enabled: z.boolean().default(true),
					type: z.enum(['spinner', 'skeleton', 'pulse']).default('skeleton'),
				})
				.default({}),
			viewTransition: z
				.object({
					enabled: z.boolean().default(true),
					duration: z.number().min(0).max(1000).default(300),
					type: z.enum(['fade', 'slide', 'scale']).default('fade'),
				})
				.default({}),
		})
		.default({}),
});

// Esquema para configuración de accesibilidad
export const accessibilityConfigSchema = z.object({
	keyboardNavigation: z.boolean().default(true),
	screenReaderAnnouncements: z.boolean().default(true),
	highContrast: z.boolean().default(false),
	reduceMotion: z.boolean().default(false),
	largeFonts: z.boolean().default(false),
	focus: z
		.object({
			showIndicators: z.boolean().default(true),
			indicatorColor: z.string().default('#3b82f6'),
			indicatorWidth: z.number().min(1).max(5).default(2),
		})
		.default({}),
});

// Esquema para configuración de rendimiento
export const performanceConfigSchema = z.object({
	maxRenderItems: z.number().min(10).max(10_000).default(1000),
	virtualization: z.boolean().default(true),
	virtualizationBuffer: z.number().min(1).max(20).default(5),
	lazyThumbnails: z.boolean().default(true),
	thumbnailQuality: z.enum(['low', 'medium', 'high']).default('medium'),
	cache: z
		.object({
			thumbnails: z.boolean().default(true),
			maxSize: z.number().min(10).max(1000).default(100),
			ttl: z.number().min(60_000).max(86_400_000).default(3_600_000),
		})
		.default({}),
	debounce: z
		.object({
			search: z.number().min(0).max(2000).default(300),
			scroll: z.number().min(0).max(100).default(16),
			resize: z.number().min(0).max(500).default(100),
		})
		.default({}),
});

// Esquema para configuración por tipo de entidad
export const entityViewConfigSchema = z.object({
	preferredView: z.enum(['list', 'grid', 'cards', 'masonry']).default('grid'),
	viewConfigs: z.record(z.enum(['list', 'grid', 'cards', 'masonry']), z.any()).default({}),
	defaultMetadata: z.array(z.string()).default([]),
	availableActions: z.array(z.string()).default([]),
});

// Esquema para configuración global de vistas
export const globalViewConfigSchema = z.object({
	defaultViewMode: z.enum(['list', 'grid', 'cards', 'masonry']).default('grid'),
	entityTypeConfigs: z.record(z.string(), entityViewConfigSchema).default({}),
	animations: animationConfigSchema.default({}),
	accessibility: accessibilityConfigSchema.default({}),
	performance: performanceConfigSchema.default({}),
});

// Esquema para configuración completa de vistas
// Helper para crear un schema por defecto
const createDefaultSchema = (schema: any) => {
	try {
		return schema.parse(undefined);
	} catch (error) {
		return {};
	}
};

export const viewConfigurationSchema = z
	.object({
		listView: listViewConfigSchema,
		gridView: gridViewConfigSchema,
		cardsView: cardsViewConfigSchema,
		masonryView: masonryViewConfigSchema,
		global: globalViewConfigSchema,
	})
	.default({
		listView: createDefaultSchema(listViewConfigSchema),
		gridView: createDefaultSchema(gridViewConfigSchema),
		cardsView: createDefaultSchema(cardsViewConfigSchema),
		masonryView: createDefaultSchema(masonryViewConfigSchema),
		global: createDefaultSchema(globalViewConfigSchema),
	});

// Esquema para configuración de ViewConfiguration unificada
export const viewConfigurationMetadataSchema = z.object({
	name: z.string().min(1).max(100),
	description: z.string().max(500).optional(),
	createdAt: z.number(),
	lastModified: z.number(),
	version: z.string().default('1.0.0'),
	isCustom: z.boolean().default(false),
	isDefault: z.boolean().default(false),
});

export const commonViewSettingsSchema = z.object({
	showThumbnails: z.boolean().default(true),
	showMetadata: z.boolean().default(true),
	showTags: z.boolean().default(true),
	showStats: z.boolean().default(false),
	sortBy: z.string().default('name'),
	sortDirection: z.enum(['asc', 'desc']).default('asc'),
	enableAnimations: z.boolean().default(true),
	animationDuration: z.number().min(0).max(1000).default(200),
	showHiddenFiles: z.boolean().default(false),
	enableHoverEffects: z.boolean().default(true),
});

export const unifiedViewConfigurationSchema = z.object({
	type: z.enum(['list', 'grid', 'cards', 'masonry']),
	common: commonViewSettingsSchema,
	specific: z.union([
		z.object({ type: z.literal('list'), config: listViewConfigSchema }),
		z.object({ type: z.literal('grid'), config: gridViewConfigSchema }),
		z.object({ type: z.literal('cards'), config: cardsViewConfigSchema }),
		z.object({ type: z.literal('masonry'), config: masonryViewConfigSchema }),
	]),
	metadata: viewConfigurationMetadataSchema,
});

export const viewPresetSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string(),
	category: z.enum(['default', 'compact', 'detailed', 'custom']),
	configuration: unifiedViewConfigurationSchema,
	supportedEntityTypes: z.array(z.string()).optional(),
});

// Esquema para configuración de FileBrowser (actualizado con ViewConfiguration)
export const fileBrowserConfigSchema = z.object({
	// Configuraciones específicas por vista (legacy support)
	listView: listViewConfigSchema.optional(),
	gridView: gridViewConfigSchema.optional(),
	cardsView: cardsViewConfigSchema.optional(),
	masonryView: masonryViewConfigSchema.optional(),
	global: globalViewConfigSchema.optional(),

	// Nuevo sistema unificado de configuración de vistas
	viewConfigurations: z.record(z.enum(['list', 'grid', 'cards', 'masonry']), unifiedViewConfigurationSchema).optional(),

	// Presets personalizados por tipo de vista
	customPresets: z.record(z.enum(['list', 'grid', 'cards', 'masonry']), z.array(viewPresetSchema)).optional(),

	// Configuración global del navegador de archivos
	defaultViewType: z.enum(['list', 'grid', 'cards', 'masonry']).default('grid'),
	lastUsedViewType: z.enum(['list', 'grid', 'cards', 'masonry']).optional(),
	rememberViewPerFolder: z.boolean().default(false),
	folderViewPreferences: z.record(z.string(), z.enum(['list', 'grid', 'cards', 'masonry'])).optional(),

	// Configuraciones directas para compatibilidad con hooks
	accessibility: accessibilityConfigSchema.optional(),
	performance: performanceConfigSchema.optional(),
});

// Esquemas para temas y lenguajes
export const themeModeSchema = z.enum(['light', 'dark', 'system']);
export const languageSchema = z.enum(['es', 'en']);

// Esquema para la sección de apariencia
export const appearanceSchema = z.object({
	theme: themeModeSchema,
	fontSize: z.number().min(12).max(24),
	language: languageSchema,
	reducedAnimations: z.boolean(),
	highContrast: z.boolean(),
});

// Esquema para la sección de notificaciones
export const notificationsSchema = z.object({
	enabled: z.boolean(),
	email: z.boolean(),
	desktop: z.boolean(),
	frequency: z.enum(['daily', 'weekly', 'monthly']),
});

// Esquema para la sección de privacidad
export const privacySchema = z.object({
	shareUsageData: z.boolean(),
	storeCookies: z.boolean(),
	storeHistory: z.boolean(),
});

// Esquema para la sección avanzada
export const advancedSchema = z.object({
	apiKey: z.string().nullable(),
	devMode: z.boolean(),
	experimentalFeatures: z.boolean(),
});

// Esquema completo de configuración
export const settingsSchema = z.object({
	appearance: appearanceSchema,
	notifications: notificationsSchema,
	privacy: privacySchema,
	advanced: advancedSchema,
	fileBrowser: fileBrowserConfigSchema.default({}),
	version: z.string().default('1.0.0'),
	lastUpdate: z.date().default(() => new Date()),
	system: z
		.object({
			platform: z.string().default('web'),
			version: z.string().default('1.0.0'),
		})
		.default({}),
});

// Esquema para actualizaciones parciales
export const updateSettingsSchema = z
	.object({
		appearance: appearanceSchema.partial().optional(),
		notifications: notificationsSchema.partial().optional(),
		privacy: privacySchema.partial().optional(),
		advanced: advancedSchema.partial().optional(),
		fileBrowser: fileBrowserConfigSchema.partial().optional(),
	})
	.partial();

// Tipos inferidos
export type ThemeMode = z.infer<typeof themeModeSchema>;
export type Language = z.infer<typeof languageSchema>;
export type AppearanceSettings = z.infer<typeof appearanceSchema>;
export type NotificationsSettings = z.infer<typeof notificationsSchema>;
export type PrivacySettings = z.infer<typeof privacySchema>;
export type AdvancedSettings = z.infer<typeof advancedSchema>;
export type ListColumnConfig = z.infer<typeof listColumnConfigSchema>;
export type ListViewConfig = z.infer<typeof listViewConfigSchema>;
export type CardMetadataConfig = z.infer<typeof cardMetadataConfigSchema>;
export type CardActionButton = z.infer<typeof cardActionButtonSchema>;
export type CardInteractiveConfig = z.infer<typeof cardInteractiveConfigSchema>;
export type CardsViewConfig = z.infer<typeof cardsViewConfigSchema>;
export type MasonrySpacingConfig = z.infer<typeof masonrySpacingConfigSchema>;
export type MasonryHeightConfig = z.infer<typeof masonryHeightConfigSchema>;
export type MasonryOptimizationConfig = z.infer<typeof masonryOptimizationConfigSchema>;
export type MasonryViewConfig = z.infer<typeof masonryViewConfigSchema>;
export type GridViewConfig = z.infer<typeof gridViewConfigSchema>;
export type AnimationConfig = z.infer<typeof animationConfigSchema>;
export type AccessibilityConfig = z.infer<typeof accessibilityConfigSchema>;
export type PerformanceConfig = z.infer<typeof performanceConfigSchema>;
export type EntityViewConfig = z.infer<typeof entityViewConfigSchema>;
export type GlobalViewConfig = z.infer<typeof globalViewConfigSchema>;
export type ViewConfiguration = z.infer<typeof viewConfigurationSchema>;
export type UnifiedViewConfiguration = z.infer<typeof unifiedViewConfigurationSchema>;
export type ViewConfigurationMetadata = z.infer<typeof viewConfigurationMetadataSchema>;
export type CommonViewSettings = z.infer<typeof commonViewSettingsSchema>;
export type ViewPreset = z.infer<typeof viewPresetSchema>;
export type FileBrowserConfig = z.infer<typeof fileBrowserConfigSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type UpdateSettings = z.infer<typeof updateSettingsSchema>;

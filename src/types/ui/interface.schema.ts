// src/types/ui/interface.schema.ts
// Esquema Zod para validar preferencias de interfaz
// 📏 Cumple lineamientos de validación y runtime safety

import { z } from 'zod';

/**
 * Schema para configuración de vista Grid
 */
const gridViewConfigSchema = z.object({
	minColumns: z.number().min(1).max(10),
	maxColumns: z.number().min(2).max(12),
	itemSize: z.number().min(80).max(400),
	gap: z.number().min(0).max(32),
	aspectRatio: z.number().min(0.5).max(3),
	showInfoOnHover: z.boolean(),
	enableHoverAnimations: z.boolean(),
});

/**
 * Schema para configuración de vista Cards
 */
const cardsViewConfigSchema = z.object({
	minColumns: z.number().min(1).max(6),
	maxColumns: z.number().min(2).max(8),
	cardWidth: z.number().min(200).max(600),
	cardHeight: z.number().min(250).max(800),
	gap: z.number().min(8).max(48),
	showMetadata: z.boolean(),
	showTechnicalInfo: z.boolean(),
	showBadges: z.boolean(),
	previewSize: z.enum(['small', 'medium', 'large']),
});

/**
 * Schema para configuración de vista Masonry
 */
const masonryViewConfigSchema = z.object({
	minColumns: z.number().min(2).max(8),
	maxColumns: z.number().min(3).max(12),
	columnWidth: z.number().min(120).max(400),
	columnGap: z.number().min(2).max(24),
	rowGap: z.number().min(2).max(24),
	maxItemHeight: z.number().min(200).max(800),
	minItemHeight: z.number().min(80).max(300),
	respectAspectRatio: z.boolean(),
	autoBalance: z.boolean(),
});

/**
 * Schema para configuración de vista List
 */
const listViewConfigSchema = z.object({
	rowHeight: z.number().min(40).max(120),
	rowGap: z.number().min(0).max(16),
	showThumbnails: z.boolean(),
	thumbnailSize: z.enum(['small', 'medium', 'large']),
	visibleColumns: z.object({
		name: z.boolean(),
		size: z.boolean(),
		dateModified: z.boolean(),
		dateCreated: z.boolean(),
		type: z.boolean(),
		dimensions: z.boolean(),
		tags: z.boolean(),
	}),
	showZebraStripes: z.boolean(),
	compactMode: z.boolean(),
});

/**
 * Schema para configuración general del FileBrowser
 */
const fileBrowserConfigSchema = z.object({
	views: z.object({
		grid: gridViewConfigSchema,
		cards: cardsViewConfigSchema,
		masonry: masonryViewConfigSchema,
		list: listViewConfigSchema,
	}),
	general: z.object({
		defaultViewMode: z.enum(['grid', 'cards', 'masonry', 'list']),
		enableProgressiveLoading: z.boolean(),
		itemsPerBatch: z.number().min(10).max(200),
		enableViewTransitions: z.boolean(),
		enableMultiSelect: z.boolean(),
		enableDragAndDrop: z.boolean(),
		showItemCount: z.boolean(),
		showTotalSize: z.boolean(),
	}),
	performance: z.object({
		enableVirtualization: z.boolean(),
		overscanCount: z.number().min(5).max(100),
		enableThumbnailCache: z.boolean(),
		thumbnailCacheLimit: z.number().min(50).max(1000),
		thumbnailQuality: z.enum(['low', 'medium', 'high']),
	}),
});

/**
 * Esquema de validación para InterfacePreferences
 */
export const interfacePreferencesSchema = z
	.object({
		fontFamily: z.enum(['system', 'serif', 'mono', 'rounded']),
		fontSize: z.enum(['sm', 'md', 'lg']),
		theme: z.enum(['light', 'dark', 'system']),
		animations: z.boolean(),
		thumbnailsRespectAspectRatio: z.boolean(),
		thumbnailsBorderRadius: z.object({
			grid: z.number().min(0).max(32),
			card: z.number().min(0).max(32),
			mosaic: z.number().min(0).max(32),
		}),
		thumbnailsAnimations: z.boolean(),
		thumbnailsUltraPerformance: z.boolean(),
		fileBrowser: fileBrowserConfigSchema,
	})
	.passthrough(); // Permite flags futuros

export type InterfacePreferencesInput = z.input<typeof interfacePreferencesSchema>;
export type InterfacePreferencesOutput = z.output<typeof interfacePreferencesSchema>;

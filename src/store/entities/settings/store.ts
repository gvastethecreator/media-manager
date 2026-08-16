// src/store/entities/settings/store.ts
// Zustand store para preferencias de interfaz de usuario
// 🗃️ Persistencia local y reactividad para settings de interfaz

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clientLogger } from '@/lib/logger/client-logger';
import { interfacePreferencesSchema } from '@/types/ui/interface.schema';
import type { InterfacePreferences, InterfaceSettingsState } from '@/types/ui/types';

// Estado inicial por defecto
const defaultPreferences: InterfacePreferences = {
	fontFamily: 'inter',
	fontSize: 'base',
	theme: 'system', // soporta también temas custom declarados en schema
	animations: true,
	thumbnailsRespectAspectRatio: true,
	thumbnailsBorderRadius: {
		grid: 8,
		card: 12,
		mosaic: 4,
	},
	thumbnailsAnimations: true,
	thumbnailsUltraPerformance: false,
	fileBrowser: {
		views: {
			grid: {
				minColumns: 4,
				maxColumns: 8,
				itemSize: 160,
				gap: 8,
				aspectRatio: 1,
				showInfoOnHover: true,
				enableHoverAnimations: true,
			},
			cards: {
				minColumns: 2,
				maxColumns: 4,
				cardWidth: 320,
				cardHeight: 400,
				gap: 16,
				showMetadata: true,
				showTechnicalInfo: true,
				showBadges: true,
				previewSize: 'medium',
			},
			masonry: {
				minColumns: 3,
				maxColumns: 6,
				columnWidth: 200,
				columnGap: 8,
				rowGap: 8,
				maxItemHeight: 400,
				minItemHeight: 120,
				respectAspectRatio: true,
				autoBalance: true,
			},
			list: {
				rowHeight: 60,
				rowGap: 2,
				showThumbnails: true,
				thumbnailSize: 'small',
				visibleColumns: {
					name: true,
					size: true,
					dateModified: true,
					dateCreated: false,
					type: true,
					dimensions: false,
					tags: false,
				},
				showZebraStripes: true,
				compactMode: false,
			},
		},
		general: {
			defaultViewMode: 'grid',
			enableProgressiveLoading: true,
			itemsPerBatch: 50,
			enableViewTransitions: true,
			enableMultiSelect: true,
			enableDragAndDrop: true,
			showItemCount: true,
			showTotalSize: true,
		},
		performance: {
			enableVirtualization: true,
			overscanCount: 20,
			enableThumbnailCache: true,
			thumbnailCacheLimit: 200,
			thumbnailQuality: 'medium',
		},
	},
};

export const useInterfaceSettingsStore = create<InterfaceSettingsState>()(
	persist(
		(set, get) => ({
			preferences: defaultPreferences,
			updatedAt: Date.now(),
			setPreferences: (prefs: Partial<InterfacePreferences>) => {
				// Validar con Zod antes de persistir
				const parsed = interfacePreferencesSchema.safeParse({
					...get().preferences,
					...prefs,
				});
				if (parsed.success) {
					set({
						preferences: parsed.data,
						updatedAt: Date.now(),
					});
				} else {
					// 🚨 Log de error de validación

					clientLogger.warn('Preferencias de interfaz inválidas', parsed.error);
				}
			},
		}),
		{
			name: 'interface-settings', // clave de persistencia local
			partialize: (state) => ({ preferences: state.preferences, updatedAt: state.updatedAt }),
		}
	)
);

/**
 * Selector para preferencias de interfaz
 */
export const selectInterfacePreferences = (state: InterfaceSettingsState) => state.preferences;

// src/store/entities/settings/store.ts
// Zustand store para preferencias de interfaz de usuario
// 🗃️ Persistencia local y reactividad para settings de interfaz

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { interfacePreferencesSchema } from '@/types/entities/settings/interface.schema';
import type { InterfacePreferences, InterfaceSettingsState } from '@/types/entities/settings/types';

// Estado inicial por defecto
const defaultPreferences: InterfacePreferences = {
	fontFamily: 'system',
	fontSize: 'md',
	theme: 'system',
	animations: true,
	thumbnailsRespectAspectRatio: true,
	thumbnailsBorderRadius: {
		grid: 8,
		card: 12,
		mosaic: 4,
	},
	thumbnailsAnimations: true,
	thumbnailsUltraPerformance: false,
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
					// eslint-disable-next-line no-console
					console.warn('Preferencias de interfaz inválidas', parsed.error);
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

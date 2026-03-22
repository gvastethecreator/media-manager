/**
 * @file Custom Theme Store
 * @module store/entities/themes/custom-theme.store
 * @description Store de Zustand para gestión de temas personalizados
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { clientLogger } from '@/lib/logger/client-logger';
import type { CustomTheme, ThemeColors } from '@/types/theme';
import { BUILT_IN_THEMES, DEFAULT_THEME_COLORS, THEME_CSS_VAR_MAP } from '@/types/theme';

const logger = clientLogger.withContext('CustomThemeStore');

/**
 * Estado del store de temas personalizados
 */
interface CustomThemeStoreState {
	/** Lista de temas personalizados guardados */
	customThemes: CustomTheme[];
	/** ID del tema actualmente en edición (null si no hay editor abierto) */
	editingThemeId: string | null;
	/** Si estamos en modo preview */
	isPreviewMode: boolean;
	/** Tema temporal para preview sin guardar */
	previewTheme: CustomTheme | null;
}

/**
 * Acciones del store
 */
interface CustomThemeStoreActions {
	// CRUD de temas
	addCustomTheme: (theme: CustomTheme) => void;
	applyPreview: () => void;

	// Aplicar al DOM
	applyThemeToDOM: (theme: CustomTheme) => void;
	cancelPreview: () => void;

	// Creación desde base
	createFromBuiltIn: (builtInId: string, name: string) => CustomTheme;
	deleteCustomTheme: (id: string) => void;
	duplicateTheme: (themeId: string, newName: string) => CustomTheme;

	// Importar/Exportar
	exportTheme: (themeId: string) => string | null;

	// Utilidades
	getThemeById: (id: string) => CustomTheme | null;
	importTheme: (json: string) => CustomTheme | null;
	isCustomTheme: (id: string) => boolean;
	resetToActiveTheme: () => void;

	// Preview
	setPreviewTheme: (theme: CustomTheme | null) => void;

	// Edición
	startEditing: (themeId: string | null) => void;
	stopEditing: () => void;
	updateCustomTheme: (id: string, updates: Partial<Omit<CustomTheme, 'id'>>) => void;
}

type CustomThemeStore = CustomThemeStoreState & CustomThemeStoreActions;

/**
 * Genera un ID único para temas
 */
function generateThemeId(): string {
	return `custom-theme-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Extrae colores de un tema built-in desde el DOM
 */
function extractBuiltInThemeColors(themeId: string): ThemeColors {
	// Temporalmente aplicar el tema para extraer colores
	const root = document.documentElement;
	const previousTheme = root.getAttribute('data-theme');

	root.setAttribute('data-theme', themeId);

	const computedStyle = getComputedStyle(root);
	const colors: Partial<ThemeColors> = {};

	for (const [key, cssVar] of Object.entries(THEME_CSS_VAR_MAP)) {
		const value = computedStyle.getPropertyValue(cssVar).trim();
		if (value) {
			colors[key as keyof ThemeColors] = value;
		}
	}

	// Restaurar tema anterior
	if (previousTheme) {
		root.setAttribute('data-theme', previousTheme);
	}

	return { ...DEFAULT_THEME_COLORS, ...colors };
}

/**
 * Store principal de temas personalizados
 */
export const useCustomThemeStore = create<CustomThemeStore>()(
	persist(
		immer((set, get) => ({
			// Estado inicial
			customThemes: [],
			editingThemeId: null,
			previewTheme: null,
			isPreviewMode: false,

			// ==================== CRUD ====================

			addCustomTheme: (theme) => {
				set((state) => {
					// Verificar que no exista ya
					if (state.customThemes.some((t) => t.id === theme.id)) {
						logger.warn('Tema ya existe:', theme.id);
						return;
					}
					state.customThemes.push(theme);
					logger.info('Tema añadido:', theme.name);
				});
			},

			updateCustomTheme: (id, updates) => {
				set((state) => {
					const index = state.customThemes.findIndex((t) => t.id === id);
					if (index === -1) {
						logger.warn('Tema no encontrado para actualizar:', id);
						return;
					}
					state.customThemes[index] = {
						...state.customThemes[index],
						...updates,
						updatedAt: new Date().toISOString(),
					};
					logger.info('Tema actualizado:', id);
				});
			},

			deleteCustomTheme: (id) => {
				set((state) => {
					const index = state.customThemes.findIndex((t) => t.id === id);
					if (index === -1) {
						logger.warn('Tema no encontrado para eliminar:', id);
						return;
					}
					state.customThemes.splice(index, 1);
					logger.info('Tema eliminado:', id);
				});
			},

			// ==================== EDICIÓN ====================

			startEditing: (themeId) => {
				set((state) => {
					state.editingThemeId = themeId;
				});
			},

			stopEditing: () => {
				set((state) => {
					state.editingThemeId = null;
					state.previewTheme = null;
					state.isPreviewMode = false;
				});
			},

			// ==================== PREVIEW ====================

			setPreviewTheme: (theme) => {
				set((state) => {
					state.previewTheme = theme;
					state.isPreviewMode = theme !== null;
				});

				if (theme) {
					get().applyThemeToDOM(theme);
				} else {
					get().resetToActiveTheme();
				}
			},

			applyPreview: () => {
				const { previewTheme } = get();
				if (previewTheme) {
					// Si es nuevo, añadir; si existe, actualizar
					const existing = get().customThemes.find((t) => t.id === previewTheme.id);
					if (existing) {
						get().updateCustomTheme(previewTheme.id, previewTheme);
					} else {
						get().addCustomTheme(previewTheme);
					}
				}
				get().stopEditing();
			},

			cancelPreview: () => {
				get().resetToActiveTheme();
				get().stopEditing();
			},

			// ==================== CREACIÓN ====================

			createFromBuiltIn: (builtInId, name) => {
				const builtIn = BUILT_IN_THEMES.find((t) => t.id === builtInId);
				if (!builtIn) {
					throw new Error(`Built-in theme not found: ${builtInId}`);
				}

				const colors = extractBuiltInThemeColors(builtInId);
				const now = new Date().toISOString();

				const newTheme: CustomTheme = {
					id: generateThemeId(),
					name,
					description: `Basado en ${builtIn.name}`,
					author: 'Usuario',
					isDark: builtIn.isDark,
					createdAt: now,
					updatedAt: now,
					baseTheme: builtInId,
					colors,
				};

				get().addCustomTheme(newTheme);
				return newTheme;
			},

			duplicateTheme: (themeId, newName) => {
				const source = get().getThemeById(themeId);
				if (!source) {
					// Puede ser built-in
					return get().createFromBuiltIn(themeId, newName);
				}

				const now = new Date().toISOString();
				const newTheme: CustomTheme = {
					...source,
					id: generateThemeId(),
					name: newName,
					description: `Copia de ${source.name}`,
					createdAt: now,
					updatedAt: now,
					baseTheme: source.id,
				};

				get().addCustomTheme(newTheme);
				return newTheme;
			},

			// ==================== IMPORT/EXPORT ====================

			exportTheme: (themeId) => {
				const theme = get().getThemeById(themeId);
				if (!theme) {
					logger.warn('Tema no encontrado para exportar:', themeId);
					return null;
				}

				return JSON.stringify(theme, null, 2);
			},

			importTheme: (json) => {
				try {
					const parsed = JSON.parse(json) as CustomTheme;

					// Validación básica
					if (!(parsed.name && parsed.colors)) {
						throw new Error('Formato de tema inválido');
					}

					// Generar nuevo ID para evitar conflictos
					const now = new Date().toISOString();
					const imported: CustomTheme = {
						...parsed,
						id: generateThemeId(),
						createdAt: now,
						updatedAt: now,
						description: parsed.description || 'Tema importado',
					};

					get().addCustomTheme(imported);
					logger.info('Tema importado:', imported.name);
					return imported;
				} catch (error) {
					logger.error('Error importando tema:', error);
					return null;
				}
			},

			// ==================== DOM ====================

			applyThemeToDOM: (theme) => {
				const root = document.documentElement;

				// Aplicar cada variable CSS
				for (const [key, cssVar] of Object.entries(THEME_CSS_VAR_MAP)) {
					const value = theme.colors[key as keyof ThemeColors];
					if (value) {
						root.style.setProperty(cssVar, value);
					}
				}

				// Marcar como tema custom
				root.setAttribute('data-custom-theme', theme.id);
				logger.debug('Tema aplicado al DOM:', theme.name);
			},

			resetToActiveTheme: () => {
				const root = document.documentElement;

				// Remover todas las propiedades custom
				for (const cssVar of Object.values(THEME_CSS_VAR_MAP)) {
					root.style.removeProperty(cssVar);
				}

				root.removeAttribute('data-custom-theme');
				logger.debug('Tema reseteado a tema activo');
			},

			// ==================== UTILIDADES ====================

			getThemeById: (id) => {
				return get().customThemes.find((t) => t.id === id) || null;
			},

			isCustomTheme: (id) => {
				return get().customThemes.some((t) => t.id === id);
			},
		})),
		{
			name: 'custom-themes-storage',
			version: 1,
			partialize: (state) => ({
				customThemes: state.customThemes,
			}),
		}
	)
);

/**
 * Selectores para uso en componentes
 */
export const selectCustomThemes = (state: CustomThemeStore) => state.customThemes;
export const selectEditingThemeId = (state: CustomThemeStore) => state.editingThemeId;
export const selectPreviewTheme = (state: CustomThemeStore) => state.previewTheme;
export const selectIsPreviewMode = (state: CustomThemeStore) => state.isPreviewMode;

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { getActiveProfile, getPaginatedProfiles, setActiveProfile } from '@/lib/utils/profile/profile-utils';
import { type ProfileTransformed, transformProfile } from '@/transformers/profile/profile-transformers';
import {
	Language,
	type PaginatedProfiles,
	type ProfileFilters,
	type ProfilePaginationOptions,
	type ProfilePreferences,
	ThemeMode,
} from '@/types/entities/profile/types';

// Estado inicial
const initialState = {
	// Estado actual
	activeProfile: null as ProfileTransformed | null,
	isLoadingActive: false,
	activeProfileError: null as string | null,

	// Lista de perfiles
	profiles: [] as ProfileTransformed[],
	isLoadingProfiles: false,
	profilesError: null as string | null,
	totalProfiles: 0,
	currentPage: 1,

	// Filtros y paginación
	filters: {} as ProfileFilters,
	pagination: {
		page: 1,
		limit: 10,
		sortBy: 'name',
		sortDirection: 'asc',
	} as ProfilePaginationOptions,
};

// Definición del store
type ProfileState = typeof initialState;

// Acciones del store
interface ProfileActions {
	// Acciones para perfil activo
	fetchActiveProfile: () => Promise<ProfileTransformed | null>;
	setActiveProfileById: (id: string) => Promise<boolean>;

	// Acciones para lista de perfiles
	fetchProfiles: (filters?: ProfileFilters, pagination?: ProfilePaginationOptions) => Promise<PaginatedProfiles>;
	setFilters: (filters: Partial<ProfileFilters>) => void;
	setPagination: (pagination: Partial<ProfilePaginationOptions>) => void;

	// Gestión de preferencias
	updateTheme: (theme: ThemeMode) => void;
	updatePreference: <K extends keyof ProfilePreferences>(key: K, value: ProfilePreferences[K]) => void;
	applySystemTheme: () => void;

	// Resetear el store
	reset: () => void;
}

// Tipo completo del store
type ProfileStore = ProfileState & ProfileActions;

// Crear store con Zustand
export const useProfileStore = create<ProfileStore>()(
	devtools(
		persist(
			immer((set, get) => ({
				...initialState,

				// ===== ACCIONES PARA PERFIL ACTIVO =====

				fetchActiveProfile: async () => {
					set({ isLoadingActive: true, activeProfileError: null });

					try {
						const profile = await getActiveProfile();

						if (profile) {
							const transformedProfile = transformProfile(profile);
							set({ activeProfile: transformedProfile });
							return transformedProfile;
						}
						set({ activeProfile: null });
						return null;
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : 'Error obteniendo perfil activo';
						set({ activeProfileError: errorMessage });
						return null;
					} finally {
						set({ isLoadingActive: false });
					}
				},

				setActiveProfileById: async (id: string) => {
					set({ isLoadingActive: true, activeProfileError: null });

					try {
						const success = await setActiveProfile(id);

						if (success) {
							// Si fue exitoso, obtenemos el perfil actualizado
							await get().fetchActiveProfile();

							// Actualizamos también la lista de perfiles si están cargados
							if (get().profiles.length > 0) {
								await get().fetchProfiles(get().filters, get().pagination);
							}

							return true;
						}
						set({ activeProfileError: 'No se pudo activar el perfil' });
						return false;
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : 'Error estableciendo perfil activo';
						set({ activeProfileError: errorMessage });
						return false;
					} finally {
						set({ isLoadingActive: false });
					}
				},

				// ===== ACCIONES PARA LISTA DE PERFILES =====

				fetchProfiles: async (
					filters: ProfileFilters = get().filters,
					pagination: ProfilePaginationOptions = get().pagination
				) => {
					set({ isLoadingProfiles: true, profilesError: null });

					try {
						const result = await getPaginatedProfiles(filters, pagination);

						set((state) => {
							state.profiles = result.items.map(transformProfile);
							state.totalProfiles = result.total;
							state.currentPage = result.page;
							state.filters = filters;
							state.pagination = pagination;

							// Inicializar preferences si no existe en el perfil activo
							if (state.activeProfile && !state.activeProfile.preferences) {
								state.activeProfile.preferences = {
									theme: ThemeMode.SYSTEM,
									color: '#3b82f6',
									emoji: '👤',
									language: Language.SPANISH,
									enableAnimations: true,
									enableSounds: false,
									enableHaptics: false,
									enableNotifications: true,
									defaultView: 'grid',
									defaultSort: 'name',
									itemsPerPage: 20,
									showHiddenFiles: false,
									highContrast: false,
									reducedMotion: false,
									fontSize: 'medium',
									outlineElements: false,
								};
							}
						});

						return result;
					} catch (error) {
						const errorMessage = error instanceof Error ? error.message : 'Error obteniendo perfiles';
						set({ profilesError: errorMessage });

						return {
							items: [],
							total: 0,
							page: 1,
							limit: 10,
							totalPages: 0,
						};
					} finally {
						set({ isLoadingProfiles: false });
					}
				},

				setFilters: (filters: Partial<ProfileFilters>) => {
					set((state) => {
						state.filters = { ...state.filters, ...filters };
						state.pagination.page = 1; // Reiniciar paginación al cambiar filtros
					});

					// Obtener perfiles con los nuevos filtros
					get().fetchProfiles(get().filters, get().pagination);
				},

				setPagination: (pagination: Partial<ProfilePaginationOptions>) => {
					set((state) => {
						state.pagination = { ...state.pagination, ...pagination };
					});

					// Obtener perfiles con la nueva paginación
					get().fetchProfiles(get().filters, get().pagination);
				},

				// ===== GESTIÓN DE PREFERENCIAS =====

				updateTheme: (_theme: ThemeMode) => {
					// TODO: Implement theme update logic. This should not directly call React hooks.
					// Consider dispatching an event or calling a utility function that handles theme updates.
					console.warn('Theme update logic needs to be implemented outside the store.');
				},

				updatePreference: <K extends keyof ProfilePreferences>(key: K, value: ProfilePreferences[K]) => {
					if (!get().activeProfile) return;

					set((state) => {
						if (state.activeProfile) {
							if (!state.activeProfile.preferences) {
								state.activeProfile.preferences = {
									theme: ThemeMode.SYSTEM,
									color: '#3b82f6',
									emoji: '👤',
									language: Language.SPANISH,
									enableAnimations: true,
									enableSounds: false,
									enableHaptics: false,
									enableNotifications: true,
									defaultView: 'grid',
									defaultSort: 'name',
									itemsPerPage: 20,
									showHiddenFiles: false,
									highContrast: false,
									reducedMotion: false,
									fontSize: 'medium',
									outlineElements: false,
								};
							}

							// Actualizar preferencia específica
							state.activeProfile.preferences[key] = value;

							// Si estamos actualizando el tema, aplicarlo
							if (key === 'theme') {
								get().updateTheme(value as ThemeMode);
							}
						}
					});
				},

				applySystemTheme: () => {
					// Aplicar tema según la preferencia del sistema
					const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

					if (prefersDark) {
						document.documentElement.classList.add('dark');
						document.documentElement.classList.remove('light');
					} else {
						document.documentElement.classList.add('light');
						document.documentElement.classList.remove('dark');
					}
				},

				// ===== RESETEAR STORE =====

				reset: () => {
					set(initialState);
				},
			})),
			{
				name: 'profile-storage',
				// Solo persistir ciertos datos
				partialize: (state) => ({
					activeProfile: state.activeProfile,
					filters: state.filters,
					pagination: state.pagination,
				}),
			}
		),
		{ name: 'profile-store' }
	)
);

// ===== SELECTORES =====

// Selector para obtener el tema actual
export const selectTheme = (state: ProfileStore) => state.activeProfile?.theme || ThemeMode.SYSTEM;

// Selector para obtener preferencias específicas
export const selectPreference =
	<K extends keyof ProfilePreferences>(key: K) =>
	(state: ProfileStore) =>
		state.activeProfile?.preferences?.[key];

// Selector para obtener el color del perfil activo
export const selectProfileColor = (state: ProfileStore) => state.activeProfile?.color || '#3b82f6';

// Selector para verificar si hay un perfil activo
export const selectHasActiveProfile = (state: ProfileStore) => !!state.activeProfile;

// Selector para obtener información del perfil activo
export const selectActiveProfileInfo = (state: ProfileStore) => ({
	id: state.activeProfile?.id || '',
	name: state.activeProfile?.name || '',
	emoji: state.activeProfile?.emoji || '👤',
	color: state.activeProfile?.color || '#3b82f6',
});

// Selector para verificar si el sistema está en modo oscuro
export const selectIsDarkMode = (state: ProfileStore) => {
	const theme = state.activeProfile?.theme || ThemeMode.SYSTEM;

	if (theme === ThemeMode.DARK) return true;
	if (theme === ThemeMode.LIGHT) return false;

	// Si es SYSTEM, verificar preferencia del sistema
	if (typeof window !== 'undefined') {
		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	}

	return false;
};

'use client';

import { useActiveProfile } from '@/lib/api/profiles';
import { selectIsDarkMode, useProfileStore } from '@/store/entities/profile/profile-store';
import { type ProfileBase, ThemeMode } from '@/types/entities/profile';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

// Contexto para acceso síncrono al perfil
export interface ProfileContextValue {
	/**
	 * Perfil activo - puede ser null si aún no se ha cargado
	 */
	profile: ProfileBase | null;

	/**
	 * Indicador de carga del perfil
	 */
	isLoading: boolean;

	/**
	 * Modo oscuro actual (true = oscuro, false = claro)
	 */
	isDarkMode: boolean;

	/**
	 * Error asociado al perfil
	 */
	error: string | null;

	/**
	 * Función para aplicar un tema
	 */
	applyTheme: (theme: ThemeMode) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
	isDarkMode: false,
	isLoading: true,
	profile: null,
	error: null,
	applyTheme: () => { },
});

export const useProfile = () => useContext(ProfileContext);

// Componente Provider
export function ProfileProvider({ children }: { children: ReactNode }) {
	const [_isInitialized, setIsInitialized] = useState(false);

	// Hook para obtener el perfil activo desde la API
	const { data: activeProfile, isLoading: isLoadingAPI, error: errorAPI } = useActiveProfile();

	// Acceder al store de Zustand
	const { activeProfile: storeProfile, isLoadingActive, activeProfileError, fetchActiveProfile, updateTheme } = useProfileStore();

	// Calcular si está en modo oscuro usando el selector
	const isDarkMode = useProfileStore(selectIsDarkMode);

	// Función para aplicar un tema (memoizada para useEffect)
	const applyTheme = useCallback(
		(theme: ThemeMode) => {
			if (theme === ThemeMode.DARK) {
				document.documentElement.classList.add('dark');
				document.documentElement.classList.remove('light');
			} else if (theme === ThemeMode.LIGHT) {
				document.documentElement.classList.add('light');
				document.documentElement.classList.remove('dark');
			} else {
				// SYSTEM: Aplicar según preferencia del sistema
				const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

				if (prefersDark) {
					document.documentElement.classList.add('dark');
					document.documentElement.classList.remove('light');
				} else {
					document.documentElement.classList.add('light');
					document.documentElement.classList.remove('dark');
				}
			}

			// Actualizar también en el store
			updateTheme(theme);
		},
		[updateTheme]
	);

	// Inicializar y asegurar que existe un perfil por defecto
	useEffect(() => {
		const init = async () => {
			try {
				// Si tenemos datos del API, actualizar el store
				if (activeProfile) {
					// Usar el perfil obtenido desde la API
					// El store puede mantener su propio estado para mutaciones locales
					await fetchActiveProfile();
				}

				setIsInitialized(true);
			} catch (error) {
				console.error('Error inicializando perfil:', error);
			}
		};

		// Solo inicializar si no estamos cargando desde la API
		if (!isLoadingAPI) {
			init();
		}
	}, [activeProfile, isLoadingAPI, fetchActiveProfile]);

	// Aplicar tema cuando cambie el perfil activo (priorizar API sobre store)
	useEffect(() => {
		const currentProfile = activeProfile || storeProfile;
		if (currentProfile?.theme) {
			applyTheme(currentProfile.theme);
		}
	}, [activeProfile?.theme, storeProfile?.theme, applyTheme]);

	// Escuchar cambios en la preferencia del sistema cuando el tema es SYSTEM
	useEffect(() => {
		const currentProfile = activeProfile || storeProfile;
		if (!currentProfile || currentProfile.theme !== ThemeMode.SYSTEM) return;

		// Función para aplicar tema según cambios en preferencia del sistema
		const handleSystemThemeChange = (e: MediaQueryListEvent) => {
			if (e.matches) {
				document.documentElement.classList.add('dark');
				document.documentElement.classList.remove('light');
			} else {
				document.documentElement.classList.add('light');
				document.documentElement.classList.remove('dark');
			}
		};

		// Detector de cambios en preferencia del sistema
		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', handleSystemThemeChange);

		return () => {
			mediaQuery.removeEventListener('change', handleSystemThemeChange);
		};
	}, [activeProfile, storeProfile]);

	// Valor del contexto - priorizar datos de API sobre store
	const contextValue: ProfileContextValue = {
		isDarkMode,
		isLoading: isLoadingAPI || isLoadingActive,
		profile: activeProfile || storeProfile,
		error: errorAPI?.message || activeProfileError,
		applyTheme,
	};

	return <ProfileContext.Provider value={contextValue}>{children}</ProfileContext.Provider>;
}

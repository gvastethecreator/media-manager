'use client';

import { getActiveProfile } from '@/app/actions/profiles';
import { selectIsDarkMode, useProfileStore } from '@/store/entities/profile/profile-store';
import { ThemeMode, type ProfileBase } from '@/types/entities/profile';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

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
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Acceder al store de Zustand
	const { activeProfile, isLoadingActive, activeProfileError, fetchActiveProfile, updateTheme } = useProfileStore();

	// Calcular si está en modo oscuro usando el selector
	const isDarkMode = useProfileStore(selectIsDarkMode);

	// Función para aplicar un tema (memoizada para useEffect)
	const applyTheme = useCallback((theme: ThemeMode) => {
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
	}, [updateTheme]);

	// Inicializar y asegurar que existe un perfil por defecto
	useEffect(() => {
		const init = async () => {
			try {
				// Asegurar que existe un perfil por defecto
				// Simplemente intentamos obtener el perfil activo, que creará uno por defecto si no existe
				await getActiveProfile();

				// Cargar el perfil activo en el store
				await fetchActiveProfile();

				setIsInitialized(true);
			} catch (error) {
				console.error('Error inicializando perfil:', error);
				setError('Error inicializando perfil');
			} finally {
				setIsLoading(false);
			}
		};

		init();
	}, [fetchActiveProfile]);

	// Aplicar tema cuando cambie el perfil activo
	useEffect(() => {
		if (activeProfile?.theme) {
			applyTheme(activeProfile.theme);
		}
	}, [activeProfile?.theme, applyTheme]);

	// Escuchar cambios en la preferencia del sistema cuando el tema es SYSTEM
	useEffect(() => {
		if (!activeProfile || activeProfile.theme !== ThemeMode.SYSTEM) return;

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
	}, [activeProfile]);

	// Valor del contexto
	const contextValue: ProfileContextValue = {
		isDarkMode,
		isLoading: isLoading || isLoadingActive,
		profile: activeProfile,
		error: error || activeProfileError,
		applyTheme,
	};

	return <ProfileContext.Provider value={contextValue}>{children}</ProfileContext.Provider>;
}

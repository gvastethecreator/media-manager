'use client';

import { useActiveProfile } from '@/lib/api/profiles';
import { selectIsDarkMode, useProfileStore } from '@/store/entities/profile/profile-store';
import { type ProfileBase, ThemeMode } from '@/types/entities/profile';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

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
}

const ProfileContext = createContext<ProfileContextValue>({
	isDarkMode: false,
	isLoading: true,
	profile: null,
	error: null,
});

export const useProfile = () => useContext(ProfileContext);

// Componente Provider
export function ProfileProvider({ children }: { children: ReactNode }) {
	const [_isInitialized, setIsInitialized] = useState(false);

	// Hook para obtener el perfil activo desde la API (TanStack Query)
	const { data: activeProfile, isLoading: isLoadingAPI, error: errorAPI } = useActiveProfile();

	// Acceder al store de Zustand (para estado local y acciones)
	const { activeProfile: storeProfile, isLoadingActive, activeProfileError, fetchActiveProfile } = useProfileStore();

	// Calcular si está en modo oscuro usando el selector de Zustand
	const isDarkMode = useProfileStore(selectIsDarkMode);

	// Inicializar el store con datos de la API cuando estén disponibles
	useEffect(() => {
		const init = async () => {
			try {
				if (activeProfile) {
					// Sincronizar el store de Zustand con los datos de la API
					await fetchActiveProfile();
				}
				setIsInitialized(true);
			} catch (error) {
				console.error('Error inicializando perfil:', error);
			}
		};

		if (!isLoadingAPI) {
			init();
		}
	}, [activeProfile, isLoadingAPI, fetchActiveProfile]);

	// EFECTO: Aplicar el tema al DOM cuando cambie el perfil
	useEffect(() => {
		const currentProfile = activeProfile || storeProfile;
		const theme = currentProfile?.theme || ThemeMode.SYSTEM;

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
	}, [activeProfile, storeProfile]); // Depende de los objetos de perfil

	// EFECTO: Escuchar cambios en la preferencia del sistema cuando el tema es SYSTEM
	useEffect(() => {
		const currentProfile = activeProfile || storeProfile;
		if (!currentProfile || currentProfile.theme !== ThemeMode.SYSTEM) return;

		const handleSystemThemeChange = (e: MediaQueryListEvent) => {
			if (e.matches) {
				document.documentElement.classList.add('dark');
				document.documentElement.classList.remove('light');
			} else {
				document.documentElement.classList.add('light');
				document.documentElement.classList.remove('dark');
			}
		};

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
		mediaQuery.addEventListener('change', handleSystemThemeChange);

		return () => {
			mediaQuery.removeEventListener('change', handleSystemThemeChange);
		};
	}, [activeProfile, storeProfile]);

	// Valor del contexto: priorizar datos de API (TanStack Query) sobre el store de Zustand
	const contextValue: ProfileContextValue = {
		isDarkMode,
		isLoading: isLoadingAPI || isLoadingActive,
		profile: activeProfile || storeProfile,
		error: errorAPI?.message || activeProfileError,
	};

	return <ProfileContext.Provider value={contextValue}>{children}</ProfileContext.Provider>;
}

// Hook para obtener el perfil activo de forma síncrona
export const useActiveProfileSync = () => {
	const { profile, isLoading, error } = useProfile();
	return { profile, isLoading, error };
};
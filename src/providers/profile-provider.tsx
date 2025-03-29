'use client';

import { ensureDefaultProfile } from '@/server/actions/profile-actions';
import { selectIsDarkMode, useProfileStore } from '@/store/entities/profile/profile-store';
import { ThemeMode, type ProfileExtended } from '@/types/entities/profile/types';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

// Contexto para acceso síncrono al perfil
interface ProfileContextType {
	isDarkMode: boolean;
	isLoading: boolean;
	profile: ProfileExtended | null;
	error: string | null;
	applyTheme: (theme: ThemeMode) => void;
}

const ProfileContext = createContext<ProfileContextType>({
	isDarkMode: false,
	isLoading: true,
	profile: null,
	error: null,
	applyTheme: () => { },
});

export const useProfile = () => useContext(ProfileContext);

// Componente Provider
export function ProfileProvider({ children }: { children: ReactNode }) {
	const [isInitialized, setIsInitialized] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Acceder al store de Zustand
	const { activeProfile, isLoadingActive, activeProfileError, fetchActiveProfile, updateTheme } = useProfileStore();

	// Calcular si está en modo oscuro usando el selector
	const isDarkMode = useProfileStore(selectIsDarkMode);

	// Inicializar y asegurar que existe un perfil por defecto
	useEffect(() => {
		const init = async () => {
			try {
				// Asegurar que existe un perfil por defecto
				await ensureDefaultProfile();

				// Cargar el perfil activo
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
	}, [activeProfile?.theme]);

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

	// Función para aplicar un tema
	const applyTheme = (theme: ThemeMode) => {
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
	};

	// Valor del contexto
	const contextValue: ProfileContextType = {
		isDarkMode,
		isLoading: isLoading || isLoadingActive,
		profile: activeProfile,
		error: error || activeProfileError,
		applyTheme,
	};

	return <ProfileContext.Provider value={contextValue}>{children}</ProfileContext.Provider>;
}

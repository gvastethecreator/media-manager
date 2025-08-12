'use client';

import { useMemo } from 'react';
import { useProfile } from '@/providers/profile-provider';
import { selectProfileColor, useProfileStore } from '@/store/entities/profile/profile-store';
import { getColorStyles, getContrastColor, getThemeClass } from '@/transformers/profile/profile-transformers';
import { ThemeMode } from '@/types/entities/profile/types';

export function useProfileTheme() {
	const { profile, isDarkMode, isLoading } = useProfile();
	const applyTheme = (profile as any)?.applyTheme || (() => {});
	const profileColor = useProfileStore(selectProfileColor);

	const styles = useMemo(() => {
		return getColorStyles(profileColor);
	}, [profileColor]);

	const themeClass = useMemo(() => {
		return getThemeClass((profile as any)?.theme);
	}, [profile]);

	const contrastTextColor = useMemo(() => {
		return getContrastColor(profileColor);
	}, [profileColor]);

	// Funciones de utilidad
	const setTheme = (theme: ThemeMode) => {
		applyTheme(theme);
	};

	const toggleTheme = () => {
		if (!profile) {
			return;
		}

		if ((profile as any).theme === ThemeMode.DARK) {
			setTheme(ThemeMode.LIGHT);
		} else if ((profile as any).theme === ThemeMode.LIGHT) {
			setTheme(ThemeMode.SYSTEM);
		} else {
			setTheme(ThemeMode.DARK);
		}
	};

	return {
		theme: (profile as any)?.theme || ThemeMode.SYSTEM,
		themeClass,
		isDarkMode,
		profileColor,
		contrastTextColor,
		styles,
		isLoading,
		setTheme,
		toggleTheme,
	};
}

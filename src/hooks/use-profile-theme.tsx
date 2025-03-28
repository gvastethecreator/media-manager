'use client';

import { useProfile } from '@/components/providers/profile-provider';
import { selectProfileColor, useProfileStore } from '@/store/entities/profile/profile-store';
import { getColorStyles, getContrastColor, getThemeClass } from '@/transformers/profile/profile-transformers';
import { ThemeMode } from '@/types/entities/profile/profile-types';
import { useMemo } from 'react';

export function useProfileTheme() {
	const { profile, isDarkMode, applyTheme, isLoading } = useProfile();
	const profileColor = useProfileStore(selectProfileColor);

	const styles = useMemo(() => {
		return getColorStyles(profileColor);
	}, [profileColor]);

	const themeClass = useMemo(() => {
		return getThemeClass(profile?.theme);
	}, [profile?.theme]);

	const contrastTextColor = useMemo(() => {
		return getContrastColor(profileColor);
	}, [profileColor]);

	// Funciones de utilidad
	const setTheme = (theme: ThemeMode) => {
		applyTheme(theme);
	};

	const toggleTheme = () => {
		if (!profile) return;

		if (profile.theme === ThemeMode.DARK) {
			setTheme(ThemeMode.LIGHT);
		} else if (profile.theme === ThemeMode.LIGHT) {
			setTheme(ThemeMode.SYSTEM);
		} else {
			setTheme(ThemeMode.DARK);
		}
	};

	return {
		theme: profile?.theme || ThemeMode.SYSTEM,
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

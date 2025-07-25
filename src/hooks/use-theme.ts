/**
 * @file Hook de tema personalizado
 * @module hooks/use-theme
 * @description Hook para manejo de temas migrado de next-themes
 * @updated 2025-01-27 - Migrado de Next.js a React nativo
 */

import { useCallback, useEffect, useState } from 'react';

// Definimos los temas personalizados
const customThemes = [
	'light',
	'dark',
	'cafe',
	'violeta',
	'madera',
	'nocturno',
	'verde',
	'atardecer',
	'corporativo',
	'carbon',
	'teal',
	'citrico',
] as const;

type Theme = (typeof customThemes)[number] | 'system';

interface UseThemeReturn {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	resolvedTheme: (typeof customThemes)[number];
	themes: readonly string[];
}

export function useTheme(): UseThemeReturn {
	const [theme, setThemeState] = useState<Theme>('light');
	const [resolvedTheme, setResolvedTheme] = useState<(typeof customThemes)[number]>('light');

	// Detectar preferencia del sistema
	const getSystemTheme = useCallback((): (typeof customThemes)[number] => {
		if (typeof window === 'undefined') return 'light';
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}, []);

	// Resolver tema actual
	const resolveTheme = useCallback(
		(currentTheme: Theme): (typeof customThemes)[number] => {
			if (currentTheme === 'system') {
				return getSystemTheme();
			}
			return currentTheme as (typeof customThemes)[number];
		},
		[getSystemTheme]
	);

	// Aplicar tema al DOM
	const applyTheme = useCallback((themeToApply: (typeof customThemes)[number]) => {
		const root = document.documentElement;

		// Remover todas las clases de tema anteriores
		customThemes.forEach((t) => root.classList.remove(t));

		// Aplicar nueva clase de tema
		root.classList.add(themeToApply);

		// Aplicar atributo data-theme
		root.setAttribute('data-theme', themeToApply);
	}, []);

	// Inicializar tema desde localStorage
	useEffect(() => {
		const storedTheme = localStorage.getItem('theme') as Theme;
		if (storedTheme && (customThemes.includes(storedTheme as any) || storedTheme === 'system')) {
			setThemeState(storedTheme);
		}
	}, []);

	// Actualizar tema resuelto cuando cambia el tema
	useEffect(() => {
		const resolved = resolveTheme(theme);
		setResolvedTheme(resolved);
		applyTheme(resolved);

		// Escuchar cambios en la preferencia del sistema
		if (theme === 'system') {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handleChange = () => {
				const newResolved = resolveTheme(theme);
				setResolvedTheme(newResolved);
				applyTheme(newResolved);
			};

			mediaQuery.addEventListener('change', handleChange);
			return () => mediaQuery.removeEventListener('change', handleChange);
		}
	}, [theme, applyTheme, resolveTheme]);

	// Función para cambiar tema
	const setTheme = (newTheme: Theme) => {
		setThemeState(newTheme);
		localStorage.setItem('theme', newTheme);
	};

	return {
		theme,
		setTheme,
		resolvedTheme,
		themes: customThemes,
	};
}

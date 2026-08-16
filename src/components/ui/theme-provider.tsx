/**
 * @file Theme Provider migrado de Next.js a React nativo
 * @module components/ui/theme-provider
 * @description Proveedor de temas con soporte para temas personalizados
 * @updated 2025-01-27 - Migrado de next-themes a React nativo
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { clientLogger } from '@/lib/logger/client-logger';

// Definimos los temas personalizados disponibles
// Cada tema tiene su definición en src/app/themes.css
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
	'aurora',
	'neon',
] as const;

type Theme = (typeof customThemes)[number] | 'system';

interface ThemeContextType {
	resolvedTheme: (typeof customThemes)[number];
	setTheme: (theme: Theme) => void;
	theme: Theme;
	themes: typeof customThemes;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
	attribute?: string;
	children: React.ReactNode;
	defaultTheme?: Theme;
	enableSystem?: boolean;
	storageKey?: string;
}

// Componente de debug para monitorear cambios en el tema (mantenido)
function ThemeDebugger() {
	useEffect(() => {
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
					const target = mutation.target as HTMLElement;
					clientLogger.debug(`Theme changed to: ${target.getAttribute('data-theme')}`);
					clientLogger.debug(`HTML tiene atributo data-theme: ${document.documentElement.getAttribute('data-theme')}`);
				}
			}
		});

		observer.observe(document.documentElement, { attributes: true });

		return () => observer.disconnect();
	}, []);

	return null;
}

function isTheme(value: string | null): value is Theme {
	return value === 'system' || customThemes.some((theme) => theme === value);
}

export function ThemeProvider({
	children,
	defaultTheme = 'light',
	storageKey = 'theme',
	attribute = 'data-theme',
	enableSystem = true,
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(() => {
		if (typeof window === 'undefined') {
			return defaultTheme;
		}
		try {
			const storedTheme = window.localStorage.getItem(storageKey);
			if (isTheme(storedTheme)) {
				return storedTheme;
			}
			if (storedTheme !== null) {
				window.localStorage.removeItem(storageKey);
			}
		} catch (error) {
			clientLogger.warn('The persisted theme could not be read; using the fallback.', error);
		}
		return defaultTheme;
	});
	const [resolvedTheme, setResolvedTheme] = useState<(typeof customThemes)[number]>('light');

	// Detectar preferencia del sistema
	const getSystemTheme = useCallback((): (typeof customThemes)[number] => {
		if (typeof window === 'undefined') {
			return 'light';
		}
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}, []);

	// Resolver tema actual
	const resolveTheme = React.useCallback(
		(currentTheme: Theme): (typeof customThemes)[number] => {
			if (currentTheme === 'system') {
				return getSystemTheme();
			}
			return currentTheme as (typeof customThemes)[number];
		},
		[getSystemTheme]
	);

	// Aplicar tema al DOM con transición fluida
	const applyTheme = React.useCallback(
		(themeToApply: (typeof customThemes)[number]) => {
			const root = document.documentElement;

			// Activar transición fluida
			root.classList.add('theme-transitioning');

			// Remover todas las clases de tema anteriores
			for (const t of customThemes) {
				root.classList.remove(t);
			}

			// Aplicar nueva clase de tema
			root.classList.add(themeToApply);

			// Las clases siempre se administran arriba; un atributo adicional es opcional.
			if (attribute && attribute !== 'class') {
				root.setAttribute(attribute, themeToApply);
			}

			// Remover clase de transición después de completar
			window.setTimeout(() => {
				root.classList.remove('theme-transitioning');
			}, 350);
		},
		[attribute]
	);

	// Actualizar tema resuelto cuando cambia el tema o la preferencia del sistema
	useEffect(() => {
		const resolved = resolveTheme(theme);
		setResolvedTheme(resolved);
		applyTheme(resolved);

		// Escuchar cambios en la preferencia del sistema
		if (theme === 'system' && enableSystem) {
			const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
			const handleChange = () => {
				const newResolved = resolveTheme(theme);
				setResolvedTheme(newResolved);
				applyTheme(newResolved);
			};

			mediaQuery.addEventListener('change', handleChange);
			return () => mediaQuery.removeEventListener('change', handleChange);
		}
	}, [theme, enableSystem, applyTheme, resolveTheme]);

	// Función para cambiar tema
	const handleSetTheme = useCallback(
		(newTheme: Theme) => {
			setTheme(newTheme);
			try {
				localStorage.setItem(storageKey, newTheme);
			} catch (error) {
				clientLogger.warn('The theme changed but could not be persisted.', error);
			}
		},
		[storageKey]
	);

	const value: ThemeContextType = {
		theme,
		setTheme: handleSetTheme,
		resolvedTheme,
		themes: customThemes,
	};

	return (
		<ThemeContext.Provider value={value}>
			{children}
			{import.meta.env.DEV ? <ThemeDebugger /> : null}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
	}
	return context;
}

// Exportar tipos para compatibilidad
export type { Theme, ThemeContextType };

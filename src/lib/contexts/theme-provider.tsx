/**
 * @file Theme Provider nativo de React
 * @module lib/contexts/theme-provider
 * @description Proveedor de temas migrado de next-themes a React nativo
 * @updated 2025-01-27 - Migrado de Next.js a React nativo
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

// Definimos los temas personalizados (mantenidos de la versión original)
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

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	resolvedTheme: (typeof customThemes)[number];
	themes: readonly string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export interface ThemeProviderProps {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
	attribute?: string;
	enableSystem?: boolean;
}

// Componente de debug para monitorear cambios en el tema (mantenido)
function ThemeDebugger() {
	useEffect(() => {
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
					const target = mutation.target as HTMLElement;
					console.log(`Tema cambiado a: ${target.getAttribute('data-theme')}`);
					console.log(`HTML tiene atributo data-theme: ${document.documentElement.getAttribute('data-theme')}`);
				}
			}
		});

		observer.observe(document.documentElement, { attributes: true });

		return () => observer.disconnect();
	}, []);

	return null;
}

// Componente para forzar la aplicación del tema actual (mantenido)
function ThemeEnforcer() {
	const { theme, resolvedTheme } = useTheme();

	useEffect(() => {
		if (resolvedTheme && typeof document !== 'undefined') {
			console.log(`Forzando aplicación del tema: ${resolvedTheme}`);
			document.documentElement.setAttribute('data-theme', resolvedTheme);
		}
	}, [theme, resolvedTheme]);

	return null;
}

export function ThemeProvider({
	children,
	defaultTheme = 'light',
	storageKey = 'theme',
	attribute = 'data-theme',
	enableSystem = true,
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(defaultTheme);
	const [resolvedTheme, setResolvedTheme] = useState<(typeof customThemes)[number]>('light');

	// Detectar preferencia del sistema
	const getSystemTheme = (): (typeof customThemes)[number] => {
		if (typeof window === 'undefined') return 'light';
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	};

	// Resolver tema actual
	const resolveTheme = (currentTheme: Theme): (typeof customThemes)[number] => {
		if (currentTheme === 'system') {
			return getSystemTheme();
		}
		return currentTheme as (typeof customThemes)[number];
	};

	// Aplicar tema al DOM
	const applyTheme = (themeToApply: (typeof customThemes)[number]) => {
		const root = document.documentElement;

		// Remover todas las clases de tema anteriores
		customThemes.forEach((t) => root.classList.remove(t));

		// Aplicar nueva clase de tema
		root.classList.add(themeToApply);

		// Aplicar atributo data-theme
		if (attribute) {
			root.setAttribute(attribute, themeToApply);
		}
	};

	// Inicializar tema desde localStorage
	useEffect(() => {
		const storedTheme = localStorage.getItem(storageKey) as Theme;
		if (storedTheme && (customThemes.includes(storedTheme as any) || storedTheme === 'system')) {
			setTheme(storedTheme);
		}
	}, [storageKey]);

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
	}, [theme, enableSystem]);

	// Función para cambiar tema
	const handleSetTheme = (newTheme: Theme) => {
		setTheme(newTheme);
		localStorage.setItem(storageKey, newTheme);
	};

	const value: ThemeContextType = {
		theme,
		setTheme: handleSetTheme,
		resolvedTheme,
		themes: customThemes,
	};

	return (
		<ThemeContext.Provider value={value}>
			{children}
			<ThemeDebugger />
			<ThemeEnforcer />
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

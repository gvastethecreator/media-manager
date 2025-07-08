/**
 * @file Contexto de tema nativo de React
 * @module lib/contexts/theme-context
 * @description Reemplazo de next-themes para Vite + React
 * @updated 2025-01-27 - Migrado de Next.js a React nativo
 */

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	resolvedTheme: 'dark' | 'light';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
	attribute?: string;
	enableSystem?: boolean;
}

export function ThemeProvider({
	children,
	defaultTheme = 'system',
	storageKey = 'theme',
	attribute = 'class',
	enableSystem = true,
}: ThemeProviderProps) {
	const [theme, setTheme] = useState<Theme>(defaultTheme);
	const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light'>('light');

	// Detectar preferencia del sistema
	const getSystemTheme = React.useCallback((): 'dark' | 'light' => {
		if (typeof window === 'undefined') return 'light';
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	}, []);

	// Resolver tema actual
	const resolveTheme = React.useCallback((currentTheme: Theme): 'dark' | 'light' => {
		if (currentTheme === 'system') {
			return getSystemTheme();
		}
		return currentTheme;
	}, [getSystemTheme]);

	// Aplicar tema al DOM
	const applyTheme = React.useCallback((themeToApply: 'dark' | 'light') => {
		const root = document.documentElement;

		// Remover clases anteriores
		root.classList.remove('light', 'dark');

		// Aplicar nueva clase
		root.classList.add(themeToApply);

		// Aplicar atributo si se especifica y no es 'class'
		if (attribute && attribute !== 'class') {
			root.setAttribute(attribute, themeToApply);
		}
	}, [attribute]);

	// Inicializar tema desde localStorage
	useEffect(() => {
		const storedTheme = localStorage.getItem(storageKey) as Theme;
		if (storedTheme && ['dark', 'light', 'system'].includes(storedTheme)) {
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
	}, [theme, enableSystem, applyTheme, resolveTheme]);

	// Función para cambiar tema
	const handleSetTheme = (newTheme: Theme) => {
		setTheme(newTheme);
		localStorage.setItem(storageKey, newTheme);
	};

	const value: ThemeContextType = {
		theme,
		setTheme: handleSetTheme,
		resolvedTheme,
	};

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
	}
	return context;
}

// Exportar tipos para compatibilidad
export type { Theme, ThemeProviderProps };

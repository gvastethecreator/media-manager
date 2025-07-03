/**
 * @file Componente de toggle de tema
 * @module components/core/theme/theme-toggle
 * @description Toggle de tema migrado de next-themes a implementación nativa
 * @updated 2025-01-27 - Migrado de Next.js a React nativo
 */

import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';

// Hook de tema simplificado
function useTheme() {
	const [theme, setThemeState] = useState<'light' | 'dark'>('light');

	// Detectar preferencia del sistema
	const getSystemTheme = (): 'light' | 'dark' => {
		if (typeof window === 'undefined') return 'light';
		return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
	};

	// Aplicar tema al DOM
	const applyTheme = (themeToApply: 'light' | 'dark') => {
		const root = document.documentElement;
		root.classList.remove('light', 'dark');
		root.classList.add(themeToApply);
		root.setAttribute('data-theme', themeToApply);
	};

	// Inicializar tema desde localStorage
	useEffect(() => {
		const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
		if (storedTheme === 'system' || !storedTheme) {
			const systemTheme = getSystemTheme();
			setThemeState(systemTheme);
			applyTheme(systemTheme);
		} else if (storedTheme === 'light' || storedTheme === 'dark') {
			setThemeState(storedTheme);
			applyTheme(storedTheme);
		}
	}, []);

	// Función para cambiar tema
	const setTheme = (newTheme: 'light' | 'dark') => {
		setThemeState(newTheme);
		localStorage.setItem('theme', newTheme);
		applyTheme(newTheme);
	};

	return { theme, setTheme };
}

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	return (
		<Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
			<Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
			<span className="sr-only">Toggle theme</span>
		</Button>
	);
}

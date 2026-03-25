'use client';

import { useEffect } from 'react';
import type { ThemeProviderProps } from '@/lib/contexts/theme-context';
import { ThemeProvider as NativeThemeProvider, useTheme } from '@/lib/contexts/theme-context';
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
];

// Componente de debug para monitorear cambios en el tema
function ThemeDebugger() {
	useEffect(() => {
		const observer = new MutationObserver((mutations) => {
			for (const mutation of mutations) {
				if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
					const target = mutation.target as HTMLElement;
					clientLogger.debug(`Tema cambiado a: ${target.getAttribute('data-theme')}`);
					clientLogger.debug(
						`HTML tiene atributo data-theme: ${document.documentElement.getAttribute('data-theme')}`
					);
				}
			}
		});

		observer.observe(document.documentElement, { attributes: true });

		return () => observer.disconnect();
	}, []);

	return null;
}

// Componente para forzar la aplicación del tema actual (solo una vez)
function ThemeEnforcer() {
	const { theme } = useTheme();

	useEffect(() => {
		// Solo aplicar si el tema cambió realmente y no está ya aplicado
		if (theme && typeof globalThis !== 'undefined' && globalThis.document) {
			const root = globalThis.document.documentElement;

			// Remover clases anteriores
			root.classList.remove('light', 'dark', 'system');

			// Aplicar clase del tema resuelto
			if (theme === 'system') {
				const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
				root.classList.add(systemTheme);
				// Actualizar el atributo solo para debug
				root.setAttribute('data-theme', systemTheme);
			} else {
				root.classList.add(theme);
				// Actualizar el atributo solo para debug
				root.setAttribute('data-theme', theme);
			}
		}
	}, [theme]);

	return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	return (
		<NativeThemeProvider {...props}>
			{children}
			{import.meta.env.DEV ? <ThemeDebugger /> : null}
			<ThemeEnforcer />
		</NativeThemeProvider>
	);
}

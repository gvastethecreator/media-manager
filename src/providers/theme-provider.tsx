'use client';

import { ThemeProvider as NativeThemeProvider, useTheme } from '@/lib/contexts/theme-context';
import type { ThemeProviderProps } from '@/lib/contexts/theme-context';
import { useEffect } from 'react';

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
];

// Componente de debug para monitorear cambios en el tema
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

// Componente para forzar la aplicación del tema actual (solo una vez)
function ThemeEnforcer() {
	const { theme } = useTheme();

	useEffect(() => {
		// Solo aplicar si el tema cambió realmente y no está ya aplicado
		if (theme && typeof globalThis !== 'undefined' && globalThis.document) {
			const currentTheme = globalThis.document.documentElement.getAttribute('data-theme');

			// Verificar si realmente necesitamos cambiar el tema
			if (currentTheme !== theme) {
				globalThis.document.documentElement.setAttribute('data-theme', theme);
			}
		}
	}, [theme]);

	return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	return (
		<NativeThemeProvider {...props}>
			{children}
			<ThemeDebugger />
			<ThemeEnforcer />
		</NativeThemeProvider>
	);
}

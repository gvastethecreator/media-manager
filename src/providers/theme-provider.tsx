'use client';

import type { ThemeProviderProps } from 'next-themes';
import { ThemeProvider as NextThemeProvider, useTheme } from 'next-themes';
import { useEffect } from 'react';

// Definimos los temas personalizados
const customThemes = ['light', 'dark', 'cafe', 'violeta', 'madera', 'nocturno', 'verde', 'atardecer', 'corporativo', 'carbon', 'teal', 'citrico'];

// Componente de debug para monitorear cambios en el tema
function ThemeDebugger() {
	useEffect(() => {
		const observer = new MutationObserver((mutations) => {
			mutations.forEach(mutation => {
				if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
					const target = mutation.target as HTMLElement;
					console.log(`Tema cambiado a: ${target.getAttribute('data-theme')}`);
					console.log(`HTML tiene atributo data-theme: ${document.documentElement.getAttribute('data-theme')}`);
				}
			});
		});

		observer.observe(document.documentElement, { attributes: true });

		return () => observer.disconnect();
	}, []);

	return null;
}

// Componente para forzar la aplicación del tema actual
function ThemeEnforcer() {
	const { theme } = useTheme();

	useEffect(() => {
		if (theme && typeof document !== 'undefined') {
			console.log(`Forzando aplicación del tema: ${theme}`);
			document.documentElement.setAttribute('data-theme', theme);
		}
	}, [theme]);

	return null;
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
	return (
		<NextThemeProvider
			attribute="data-theme"
			defaultTheme="light"
			themes={customThemes}
			{...props}
		>
			{children}
			<ThemeDebugger />
			<ThemeEnforcer />
		</NextThemeProvider>
	);
}

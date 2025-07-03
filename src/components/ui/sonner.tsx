/**
 * @file Componente Sonner (toaster)
 * @module components/ui/sonner
 * @description Componente de notificaciones migrado de next-themes
 * @updated 2025-01-27 - Migrado de Next.js a React nativo
 */

import { useEffect, useState } from 'react';
import { Toaster as Sonner, ToasterProps } from 'sonner';

// Hook de tema simplificado para Sonner
function useTheme() {
	const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

	useEffect(() => {
		const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system';
		if (storedTheme) {
			setTheme(storedTheme);
		}

		// Escuchar cambios en localStorage
		const handleStorageChange = (e: StorageEvent) => {
			if (e.key === 'theme' && e.newValue) {
				setTheme(e.newValue as 'light' | 'dark' | 'system');
			}
		};

		window.addEventListener('storage', handleStorageChange);
		return () => window.removeEventListener('storage', handleStorageChange);
	}, []);

	return { theme };
}

const Toaster = ({ ...props }: ToasterProps) => {
	const { theme = 'system' } = useTheme();

	return (
		<Sonner
			theme={theme as ToasterProps['theme']}
			className="toaster group"
			style={
				{
					'--normal-bg': 'var(--popover)',
					'--normal-text': 'var(--popover-foreground)',
					'--normal-border': 'var(--border)',
				} as React.CSSProperties
			}
			{...props}
		/>
	);
};

export { Toaster };


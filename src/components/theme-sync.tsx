'use client';

import { useEffect } from 'react';
import { useSettings } from '@/lib/contexts/settings-context';
import { useTheme } from '@/lib/contexts/theme-context';
import { clientLogger } from '@/lib/logger/client-logger';

/**
 * Componente que sincroniza el tema entre settings-context y theme-context
 * Debe ser colocado dentro de ambos providers
 */
export function ThemeSync() {
	const { settings } = useSettings();
	const { setTheme, theme: themeContextTheme } = useTheme();

	// Sincronizar el tema de settings con theme-context
	useEffect(() => {
		if (settings.theme !== themeContextTheme) {
			clientLogger.debug(`🔄 Sincronizando tema: ${settings.theme} -> theme-context`);
			setTheme(settings.theme);
		}
	}, [settings.theme, themeContextTheme, setTheme]);

	return null;
}

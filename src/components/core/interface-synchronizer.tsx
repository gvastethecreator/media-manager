import React from 'react';
import { useInterfaceSettingsStore } from '@/store/entities/settings/store';

export function InterfaceSynchronizer() {
	const preferences = useInterfaceSettingsStore((s) => s.preferences);

	React.useEffect(() => {
		const root = document.documentElement;
		// Google Fonts: dynamically load if not 'system'
		if (preferences.fontFamily && preferences.fontFamily !== 'system') {
			const fontUrl = `https://fonts.googleapis.com/css2?family=${preferences.fontFamily.replace(/-/g, '+')}:wght@400;700&display=swap`;
			let fontLink = document.getElementById('dynamic-font-link') as HTMLLinkElement | null;
			if (!fontLink) {
				fontLink = document.createElement('link');
				fontLink.id = 'dynamic-font-link';
				fontLink.rel = 'stylesheet';
				document.head.appendChild(fontLink);
			}
			fontLink.href = fontUrl;
			// Escaping quotes for font-family string
			root.style.setProperty('--app-font-family', `'${preferences.fontFamily.replace(/-/g, ' ')}', sans-serif`);
		} else {
			root.style.setProperty('--app-font-family', 'inherit');
		}

		// Font size
		const fontSizeMap: Record<string, string> = {
			xs: '0.70rem',
			sm: '0.8rem',
			base: '0.9rem',
			md: '1rem',
			lg: '1.1rem',
			xl: '1.25rem',
			'2xl': '1.4rem',
			'3xl': '1.6rem',
			'4xl': '1.8rem',
		};
		if (preferences.fontSize) {
			root.style.setProperty('--app-font-size', fontSizeMap[preferences.fontSize] || '1rem');
		}
	}, [preferences.fontFamily, preferences.fontSize]);

	return null;
}

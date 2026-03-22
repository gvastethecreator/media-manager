import React from 'react';
import { useInterfaceSettingsStore } from '@/store/entities/settings/store';

const FONT_STACK: Record<string, string> = {
	system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	inter: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	roboto: 'Roboto, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	'open-sans': '"Open Sans", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	lato: 'Lato, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	montserrat: 'Montserrat, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	poppins: 'Poppins, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	'source-sans': '"Source Sans 3", "Source Sans Pro", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
	serif: 'Georgia, Cambria, "Times New Roman", Times, serif',
	georgia: 'Georgia, Cambria, "Times New Roman", Times, serif',
	playfair: '"Playfair Display", Georgia, Cambria, "Times New Roman", Times, serif',
	merriweather: 'Merriweather, Georgia, Cambria, "Times New Roman", Times, serif',
	mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
	'jetbrains-mono': '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
	'fira-code': '"Fira Code", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
	'ubuntu-mono': '"Ubuntu Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
	rounded: 'Nunito, Quicksand, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

export function InterfaceSynchronizer() {
	const preferences = useInterfaceSettingsStore((s) => s.preferences);

	React.useEffect(() => {
		const root = document.documentElement;
		const fontStack = FONT_STACK[preferences.fontFamily] || FONT_STACK.system;
		root.style.setProperty('--app-font-family', fontStack);
		document.body.style.fontFamily = fontStack;

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

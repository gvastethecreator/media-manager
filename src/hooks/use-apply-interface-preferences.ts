import { useEffect } from 'react';
import { useInterfaceSettingsStore } from '@/store/entities/settings/store';

const FONT_STACK: Record<string, string> = {
	system: 'system-ui, sans-serif',
	inter: 'Inter, system-ui, sans-serif',
	roboto: 'Roboto, system-ui, sans-serif',
	'open-sans': '"Open Sans", system-ui, sans-serif',
	lato: 'Lato, system-ui, sans-serif',
	montserrat: 'Montserrat, system-ui, sans-serif',
	poppins: 'Poppins, system-ui, sans-serif',
	'source-sans': '"Source Sans Pro", system-ui, sans-serif',
	serif: 'Georgia, serif',
	georgia: 'Georgia, serif',
	playfair: '"Playfair Display", Georgia, serif',
	merriweather: 'Merriweather, Georgia, serif',
	mono: 'ui-monospace, SFMono-Regular, Menlo, monospace',
	'jetbrains-mono': '"JetBrains Mono", ui-monospace, monospace',
	'fira-code': '"Fira Code", ui-monospace, monospace',
	'ubuntu-mono': '"Ubuntu Mono", ui-monospace, monospace',
	rounded: '"Nunito", "Quicksand", system-ui, sans-serif',
};

const FONT_SIZE_MAP: Record<string, string> = {
	xs: '12px',
	sm: '13px',
	base: '14px',
	md: '15px',
	lg: '16px',
	xl: '17px',
	'2xl': '18px',
};

function ensureFontLoaded(family: string) {
	const id = `dynamic-font-${family}`;
	if (document.getElementById(id)) return;
	const GOOGLE_FONTS: Record<string, string> = {
		inter: 'Inter:wght@400;500;600;700',
		roboto: 'Roboto:wght@400;500;700',
		'open-sans': 'Open+Sans:wght@400;600;700',
		lato: 'Lato:wght@400;700',
		montserrat: 'Montserrat:wght@400;600;700',
		poppins: 'Poppins:wght@400;500;600;700',
		'source-sans': 'Source+Sans+3:wght@400;600;700',
		playfair: 'Playfair+Display:wght@400;600;700',
		merriweather: 'Merriweather:wght@400;700',
		'jetbrains-mono': 'JetBrains+Mono:wght@400;600;700',
		'fira-code': 'Fira+Code:wght@400;600;700',
		'ubuntu-mono': 'Ubuntu+Mono:wght@400;700',
		rounded: 'Nunito:wght@400;600;700',
	};
	const spec = GOOGLE_FONTS[family];
	if (!spec) return;
	const link = document.createElement('link');
	link.id = id;
	link.rel = 'stylesheet';
	link.href = `https://fonts.googleapis.com/css2?family=${spec}&display=swap`;
	document.head.appendChild(link);
}

export function useApplyInterfacePreferences() {
	const preferences = useInterfaceSettingsStore((s) => s.preferences);

	useEffect(() => {
		if (!preferences) return;
		const root = document.documentElement;
		const body = document.body;
		const fontStack = FONT_STACK[preferences.fontFamily] || FONT_STACK.system;
		body.style.fontFamily = fontStack;
		const baseSize = FONT_SIZE_MAP[preferences.fontSize] || FONT_SIZE_MAP.base;
		root.style.setProperty('--app-font-size-base', baseSize);
		body.style.fontSize = baseSize;
		root.dataset.theme = preferences.theme;
		if (preferences.animations) {
			root.classList.remove('reduce-motion');
		} else {
			root.classList.add('reduce-motion');
		}

		// Border radius CSS variables
		const borderRadius = preferences.thumbnailsBorderRadius;
		root.style.setProperty('--border-radius-grid', `${borderRadius.grid}px`);
		root.style.setProperty('--border-radius-card', `${borderRadius.card}px`);
		root.style.setProperty('--border-radius-mosaic', `${borderRadius.mosaic}px`);

		ensureFontLoaded(preferences.fontFamily);
	}, [preferences]);
}

export default useApplyInterfacePreferences;

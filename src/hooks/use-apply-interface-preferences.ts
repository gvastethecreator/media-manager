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
		root.style.setProperty('--app-font-family', fontStack);

		// Border radius CSS variables
		const borderRadius = preferences.thumbnailsBorderRadius;
		root.style.setProperty('--border-radius-grid', `${borderRadius.grid}px`);
		root.style.setProperty('--border-radius-card', `${borderRadius.card}px`);
		root.style.setProperty('--border-radius-mosaic', `${borderRadius.mosaic}px`);
	}, [preferences]);
}

export default useApplyInterfacePreferences;

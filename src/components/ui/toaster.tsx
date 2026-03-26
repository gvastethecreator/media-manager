'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/components/ui/theme-provider';

export function Toaster() {
	const { resolvedTheme = 'light' } = useTheme();
	const sonnerTheme = resolvedTheme === 'light' ? 'light' : 'dark';

	return (
		<SonnerToaster
			className="toaster group"
			expand
			position="bottom-right"
			richColors
			style={
				{
					'--normal-bg': 'var(--popover)',
					'--normal-text': 'var(--popover-foreground)',
					'--normal-border': 'var(--border)',
				} as React.CSSProperties
			}
			theme={sonnerTheme}
		/>
	);
}

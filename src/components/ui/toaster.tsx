'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/lib/contexts/theme-context';

export function Toaster() {
	const { resolvedTheme = 'light' } = useTheme();

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
			theme={resolvedTheme as 'light' | 'dark'}
		/>
	);
}

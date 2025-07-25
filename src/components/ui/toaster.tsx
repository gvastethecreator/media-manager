'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/lib/contexts/theme-context';

export function Toaster() {
	const { resolvedTheme = 'light' } = useTheme();

	return (
		<SonnerToaster
			theme={resolvedTheme as 'light' | 'dark'}
			className="toaster group"
			style={
				{
					'--normal-bg': 'var(--popover)',
					'--normal-text': 'var(--popover-foreground)',
					'--normal-border': 'var(--border)',
				} as React.CSSProperties
			}
			position="bottom-right"
			richColors
			expand
		/>
	);
}

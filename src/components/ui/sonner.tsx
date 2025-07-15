'use client';

import React from 'react';
import { Toaster as Sonner, ToasterProps } from 'sonner';
import { useTheme } from '@/lib/contexts/theme-context';

const Toaster = ({ ...props }: ToasterProps) => {
	const { resolvedTheme = 'light' } = useTheme();

	return (
		<Sonner
			theme={resolvedTheme as ToasterProps['theme']}
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

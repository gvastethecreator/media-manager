'use client';

import type { ReactNode } from 'react';
import { ThemeSync } from '@/components/theme-sync';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { SettingsProvider } from '@/lib/contexts/settings-context';
import { QueryProvider } from '@/providers/query-provider';

export function AppProvider({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem={true}>
			<SettingsProvider>
				<ThemeSync />
				<QueryProvider>
					<Toaster closeButton position="bottom-right" richColors />
					{children}
				</QueryProvider>
			</SettingsProvider>
		</ThemeProvider>
	);
}

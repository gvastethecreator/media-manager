'use client';

import type { ReactNode } from 'react';
import { ThemeSync } from '@/components/theme-sync';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { FileProvider } from '@/lib/contexts/file-context';
import { SettingsProvider } from '@/lib/contexts/settings-context';
import { CacheProvider } from '@/providers/cache-provider';
import { QueryProvider } from '@/providers/query-provider';

export function AppProvider({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem={true}>
			<SettingsProvider>
				<ThemeSync />
				<QueryProvider>
					<CacheProvider>
						<FileProvider>
							<Toaster closeButton position="bottom-right" richColors />
							{children}
						</FileProvider>
					</CacheProvider>
				</QueryProvider>
			</SettingsProvider>
		</ThemeProvider>
	);
}

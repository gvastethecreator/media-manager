'use client';

import { Toaster } from '@/components/ui/sonner';
import { FileProvider, SettingsProvider } from '@/lib/contexts';
import { CacheProvider } from '@/providers/cache-provider';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function AppProvider({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
			<CacheProvider>
				<SettingsProvider>
					<FileProvider>
						<Toaster position="bottom-right" richColors closeButton />
						{children}
					</FileProvider>
				</SettingsProvider>
			</CacheProvider>
		</ThemeProvider>
	);
}

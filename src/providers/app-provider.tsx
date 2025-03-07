'use client';

import { Toaster } from '@/components/ui/sonner';
import { FileProvider } from '@/context/file-context';
import { CacheProvider } from '@/providers/cache-provider';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function AppProvider({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
			<CacheProvider>
				<FileProvider>
					<Toaster position="bottom-right" richColors closeButton />
					{children}
				</FileProvider>
			</CacheProvider>
		</ThemeProvider>
	);
}

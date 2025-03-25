'use client';

import { CardDisplayProvider } from '@/components/features/entity-cards/context/card-display-context';
import { CardControlProvider } from '@/components/features/entity-cards/debug/card-control-context';
import { CardDebugProvider } from '@/components/features/entity-cards/debug/card-debug-mock';
import { UnifiedDebugMenu } from '@/components/features/entity-cards/ui/unified-debug-menu';
import { Toaster } from '@/components/ui/sonner';
import { FileProvider, SettingsProvider } from '@/lib/contexts';
import { CacheProvider } from '@/providers/cache-provider';
import { ThemeProvider } from 'next-themes';
import type { ReactNode } from 'react';

export function AppProvider({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} disableTransitionOnChange>
			<SettingsProvider>
				<CacheProvider>
					<FileProvider>
						<CardDebugProvider>
							<CardControlProvider>
								<CardDisplayProvider>
									<Toaster position="bottom-right" richColors closeButton />
									{children}
									<UnifiedDebugMenu />
								</CardDisplayProvider>
							</CardControlProvider>
						</CardDebugProvider>
					</FileProvider>
				</CacheProvider>
			</SettingsProvider>
		</ThemeProvider>
	);
}

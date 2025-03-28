'use client';

import { CardDisplayProvider } from '@/components/features/entity-cards/context/card-display-context';
import { CardControlProvider } from '@/components/features/entity-cards/debug/card-control-context';
import { CardDebugProvider } from '@/components/features/entity-cards/debug/card-debug-mock';
import { UnifiedDebugMenu } from '@/components/features/entity-cards/ui/unified-debug-menu';
import { Toaster } from '@/components/ui/sonner';
import { FileProvider, SettingsProvider } from '@/lib/contexts';
import { CacheProvider } from '@/providers/cache-provider';
import { QueryProvider } from '@/providers/query-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import type { ReactNode } from 'react';

export function AppProvider({ children }: { children: ReactNode }) {
	return (
		<ThemeProvider
			attribute="data-theme"
			defaultTheme="light"
			enableSystem={false}
			themes={['light', 'dark', 'cafe', 'violeta', 'madera', 'nocturno', 'verde', 'atardecer', 'corporativo', 'carbon', 'teal', 'citrico']}
			enableColorScheme
			disableTransitionOnChange
		>
			<SettingsProvider>
				<QueryProvider>
					<CacheProvider>
						<FileProvider>
							<CardDisplayProvider>
								<CardControlProvider>
									<CardDebugProvider>
										<Toaster position="bottom-right" richColors closeButton />
										{children}
										<UnifiedDebugMenu />
									</CardDebugProvider>
								</CardControlProvider>
							</CardDisplayProvider>
						</FileProvider>
					</CacheProvider>
				</QueryProvider>
			</SettingsProvider>
		</ThemeProvider>
	);
}

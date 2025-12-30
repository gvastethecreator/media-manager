/**
 * @file Componente principal de la aplicación
 * @module App
 */

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { useNavigationRefresh } from '@/hooks/use-navigation-refresh';
import { useEntityCatalogStore } from '@/store/entity-catalog-store';
import { ErrorBoundary } from './components/core/error-boundary';
import { ThemeProvider } from './components/ui/theme-provider';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';
import { ReactScanProvider } from './lib/dev/react-scan';
import lastLogContent from './logs/last-log.json' with { type: 'json' };
import { ViewTransitionProvider } from './providers/ViewTransitionProvider';
import { router } from './router';

function SSENavigationRefresher() {
	useNavigationRefresh();
	return null;
}

function EntityCatalogBootstrapper() {
	const preload = useEntityCatalogStore((s) => s.preload);
	React.useEffect(() => {
		preload();
	}, [preload]);
	return null;
}

export function App() {
	return (
		<ThemeProvider defaultTheme="system" storageKey="theme">
			<TooltipProvider>
				<ViewTransitionProvider>
					<ReactScanProvider>
						<ErrorBoundary lastLogContent={lastLogContent}>
							<SSENavigationRefresher />
							<EntityCatalogBootstrapper />
							<RouterProvider router={router} />
							<Toaster />
						</ErrorBoundary>
					</ReactScanProvider>
				</ViewTransitionProvider>
			</TooltipProvider>
		</ThemeProvider>
	);
}

export default App;

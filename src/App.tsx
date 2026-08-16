/**
 * @file Componente principal de la aplicación
 * @module App
 */

import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { useNavigationRefresh } from '@/hooks/use-navigation-refresh';
import { useEntityCatalogStore } from '@/store/entity-catalog-store';
import { ErrorBoundary } from './components/core/error-boundary';
import { InterfaceSynchronizer } from './components/core/interface-synchronizer';
import { FeedbackProvider } from './components/ui/feedback-provider';
import { SkipLink } from './components/ui/skip-link';
import { TooltipProvider } from './components/ui/tooltip';
import { ReactScanProvider } from './lib/dev/react-scan';
// import lastLogContent from './logs/last-log.json' with { type: 'json' };
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
		<TooltipProvider>
			<ViewTransitionProvider>
				<ReactScanProvider>
					<FeedbackProvider>
						<InterfaceSynchronizer />
						<ErrorBoundary>
							{/* SkipLink para accesibilidad - WCAG 2.4.1 */}
							<SkipLink targetId="main-content">Skip to main content</SkipLink>

						<SSENavigationRefresher />
						<EntityCatalogBootstrapper />
						<RouterProvider router={router} />
						</ErrorBoundary>
					</FeedbackProvider>
				</ReactScanProvider>
			</ViewTransitionProvider>
		</TooltipProvider>
	);
}

export default App;

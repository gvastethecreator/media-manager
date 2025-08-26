/**
 * @file Componente principal de la aplicación
 * @module App
 */

import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from './components/core/error-boundary';
import { ThemeProvider } from './components/ui/theme-provider';
import { ReactScanProvider } from './lib/dev/react-scan';
import lastLogContent from './logs/last-log.json' with { type: 'json' };
import { ViewTransitionProvider } from './providers/ViewTransitionProvider';
import { router } from './router';
import { useNavigationRefresh } from '@/hooks/use-navigation-refresh';

function SSENavigationRefresher() {
	useNavigationRefresh();
	return null;
}

export function App() {
	return (
		<ThemeProvider defaultTheme="system" storageKey="theme">
			<ViewTransitionProvider>
				<ReactScanProvider>
					<ErrorBoundary lastLogContent={lastLogContent}>
						<SSENavigationRefresher />
						<RouterProvider router={router} />
					</ErrorBoundary>
				</ReactScanProvider>
			</ViewTransitionProvider>
		</ThemeProvider>
	);
}

export default App;

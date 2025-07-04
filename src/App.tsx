/**
 * @file Componente principal de la aplicación
 * @module App
 */

import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from './components/core/error-boundary';
import { ThemeProvider } from './components/ui/theme-provider';
import { ReactScanProvider } from './lib/dev/react-scan';
import lastLogContent from './logs/last-log.json';
import { router } from './router';

export function App() {
	return (
		<ThemeProvider defaultTheme="system" storageKey="theme">
			<ReactScanProvider>
				<ErrorBoundary lastLogContent={lastLogContent}>
					<RouterProvider router={router} />
				</ErrorBoundary>
			</ReactScanProvider>
		</ThemeProvider>
	);
}

export default App;

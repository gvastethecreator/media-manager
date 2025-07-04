/**
 * @file Componente principal de la aplicación
 * @module App
 */

import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ReactScanProvider } from './lib/dev/react-scan';
import { ErrorBoundary } from './components/core/error-boundary';
import lastLogContent from './logs/last-log.json';
import { ThemeProvider } from './components/ui/theme-provider';

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

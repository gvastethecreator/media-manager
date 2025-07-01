/**
 * @file Componente principal de la aplicación
 * @module App
 */

import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/providers/app-provider';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { Router } from './router';

export function App() {
	return (
		<BrowserRouter>
			<ThemeProvider defaultTheme="system" storageKey="image-manager-theme">
				<AppProvider>
					<Router />
					<Toaster />
				</AppProvider>
			</ThemeProvider>
		</BrowserRouter>
	);
}

export default App;

import '@/app/globals.css';
import { GlobalErrorHandler } from '@/components/core/global-error-handler';
import { FileViewer } from '@/components/features/file-viewer/file-viewer';
import { ServerInitializer } from '@/components/server/server-initializer';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/use-toast';
import { ReactScanProvider } from '@/lib/react-scan';
import { cn } from '@/lib/utils';
import { AppProvider } from '@/providers/app-provider';
import '@/styles/form-animations.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type React from 'react';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Image Manager',
	description: 'Administrador de imágenes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es" suppressHydrationWarning>
			<head>
				<link rel="icon" href="/favicon.ico" />
				<link rel="apple-touch-icon" href="/app-logo.png" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			</head>
			<body
				className={cn(
					inter.className,
					'min-h-screen bg-background text-foreground antialiased',
					'selection:bg-primary selection:text-primary-foreground'
				)}
			>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					{/* Restaurado con manejo mejorado de errores y reintentos */}
					<ServerInitializer />

					<AppProvider>
						<ReactScanProvider>
							<TooltipProvider>
								<div className="relative min-h-screen w-full">
									<GlobalErrorHandler>{children}</GlobalErrorHandler>
								</div>
							</TooltipProvider>
						</ReactScanProvider>
					</AppProvider>
					<Toaster />
					<FileViewer />
				</ThemeProvider>
			</body>
		</html>
	);
}

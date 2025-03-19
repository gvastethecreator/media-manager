import '@/app/globals.css';
import { GlobalErrorHandler } from '@/components/core/global-error-handler';
import { ServerInitializer } from '@/components/server/server-initializer';
import { cn } from '@/lib/utils';
import { AppProvider } from '@/providers/app-provider';
import '@/styles/form-animations.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type React from 'react';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Image Manager',
	description: 'Administrador de imágenes',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es" suppressHydrationWarning className="dark">
			<head>
				<link rel="icon" href="/favicon.ico" />
				<link rel="apple-touch-icon" href="/app-logo.png" />
				<style>{`
          :root {
            color-scheme: dark;
          }
          body {
            background-color: rgb(9, 9, 11);
          }
        `}</style>
			</head>
			<body
				className={cn(
					inter.className,
					'min-h-screen bg-background text-foreground antialiased',
					'selection:bg-primary selection:text-primary-foreground'
				)}
			>
				<Providers>
					<ServerInitializer />
					<AppProvider>
						<div className="relative min-h-screen w-full">
							<GlobalErrorHandler>{children}</GlobalErrorHandler>
						</div>
					</AppProvider>
				</Providers>
			</body>
		</html>
	);
}

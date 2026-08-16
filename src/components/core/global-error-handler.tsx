import { AlertCircle, RefreshCw } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { clientLogger } from '@/lib/logger/client-logger';
import { ErrorBoundary } from './error-boundary';

/**
 * Componente de fallback para errores globales
 * 🚨 Muestra un mensaje de error amigable con opción de reintentar
 */
export function GlobalErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
	// Registrar el error en la consola para depuración
	React.useEffect(() => {
		clientLogger.error('Global error captured:', error);
	}, [error]);

	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center p-6" role="alert">
			<div className="w-full max-w-md rounded-lg border border-destructive/30 bg-card p-6 shadow-lg">
				<div className="flex flex-col items-center text-center">
					<AlertCircle className="mb-4 h-12 w-12 text-destructive" />
					<h2 className="mb-2 font-bold text-xl">An error occurred</h2>
					<p className="mb-4 text-muted-foreground">
						Something went wrong. We are working to resolve it.
					</p>
					{import.meta.env.DEV ? (
						<div className="mb-4 max-h-32 w-full overflow-auto rounded bg-muted/50 p-3">
							<p className="font-mono text-destructive/80 text-xs">{error.message || 'Unknown error'}</p>
						</div>
					) : null}
					<Button className="flex items-center" onClick={resetError} variant="primary">
						<RefreshCw className="mr-2 h-4 w-4" />
						Retry
					</Button>
				</div>
			</div>
		</div>
	);
}

/**
 * Componente GlobalErrorHandler que envuelve la aplicación con un ErrorBoundary
 * 🛡️ Captura errores no manejados y muestra un fallback amigable
 */
export function GlobalErrorHandler({ children }: { children: React.ReactNode }) {
	return <ErrorBoundary>{children}</ErrorBoundary>;
}

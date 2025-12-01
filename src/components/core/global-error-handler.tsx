import { AlertCircle, RefreshCw } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from './error-boundary';
import { clientLogger } from '@/lib/logger/client-logger';

/**
 * Componente de fallback para errores globales
 * 🚨 Muestra un mensaje de error amigable con opción de reintentar
 */
export function GlobalErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
	// Registrar el error en la consola para depuración
	React.useEffect(() => {
		clientLogger.error('Error global capturado:', error);
	}, [error]);

	return (
		<div className="flex min-h-[50vh] flex-col items-center justify-center p-6">
			<div className="w-full max-w-md rounded-lg border border-destructive/30 bg-card p-6 shadow-lg">
				<div className="flex flex-col items-center text-center">
					<AlertCircle className="mb-4 h-12 w-12 text-destructive" />
					<h2 className="mb-2 font-bold text-xl">Ha ocurrido un error</h2>
					<p className="mb-4 text-muted-foreground">
						Lo sentimos, algo salió mal. Estamos trabajando para solucionarlo.
					</p>
					<div className="mb-4 max-h-32 w-full overflow-auto rounded bg-muted/50 p-3">
						<p className="font-mono text-destructive/80 text-xs">{error.message || 'Error desconocido'}</p>
					</div>
					<Button className="flex items-center" onClick={resetError} variant="primary">
						<RefreshCw className="mr-2 h-4 w-4" />
						Reintentar
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
	const [key, setKey] = React.useState(0);

	// Función para reiniciar el estado del ErrorBoundary
	const handleReset = React.useCallback(() => {
		setKey((prev) => prev + 1);
	}, []);

	return <ErrorBoundary key={key}>{children}</ErrorBoundary>;
}

import { AlertCircle, RefreshCw } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from './error-boundary';

/**
 * Componente de fallback para errores globales
 * 🚨 Muestra un mensaje de error amigable con opción de reintentar
 */
function GlobalErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
	// Registrar el error en la consola para depuración
	React.useEffect(() => {
		console.error('Error global capturado:', error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center min-h-[50vh] p-6">
			<div className="max-w-md w-full bg-card border border-destructive/30 rounded-lg shadow-lg p-6">
				<div className="flex flex-col items-center text-center">
					<AlertCircle className="h-12 w-12 text-destructive mb-4" />
					<h2 className="text-xl font-bold mb-2">Ha ocurrido un error</h2>
					<p className="text-muted-foreground mb-4">
						Lo sentimos, algo salió mal. Estamos trabajando para solucionarlo.
					</p>
					<div className="bg-muted/50 rounded p-3 mb-4 w-full overflow-auto max-h-32">
						<p className="text-xs font-mono text-destructive/80">{error.message || 'Error desconocido'}</p>
					</div>
					<Button onClick={resetError} variant="default" className="flex items-center">
						<RefreshCw className="h-4 w-4 mr-2" />
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

	return (
		<ErrorBoundary key={key} fallback={(error) => <GlobalErrorFallback error={error} resetError={handleReset} />}>
			{children}
		</ErrorBoundary>
	);
}

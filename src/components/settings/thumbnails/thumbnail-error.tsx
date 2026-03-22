import { AlertCircle, Database, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ThumbnailErrorProps {
	description?: string;
	error: Error | string;
	onRetry?: () => void;
	showDetails?: boolean;
	title?: string;
}

/**
 * Componente para mostrar errores relacionados con thumbnails
 * 🚨 Muestra mensajes de error específicos para problemas con miniaturas
 */
export function ThumbnailError({
	error,
	onRetry,
	title = 'Error en miniaturas',
	description = 'No se pudieron cargar las estadísticas de miniaturas',
	showDetails = true,
}: ThumbnailErrorProps) {
	const errorMessage = typeof error === 'string' ? error : error?.message || 'Error desconocido';
	const isDatabaseError =
		errorMessage.toLowerCase().includes('database') || errorMessage.toLowerCase().includes('conexión');

	return (
		<Card className="border-destructive/30 bg-destructive/5 p-0">
			<Alert className="border-none bg-transparent" variant="destructive">
				<div className="flex items-start gap-3">
					{isDatabaseError ? (
						<Database className="h-5 w-5 text-destructive" />
					) : (
						<AlertCircle className="h-5 w-5 text-destructive" />
					)}
					<div className="flex-1">
						<AlertTitle className="text-destructive">{title}</AlertTitle>
						<AlertDescription className="mt-1 text-destructive/80">{description}</AlertDescription>

						{showDetails && (
							<div className="mt-3 max-h-20 overflow-auto rounded bg-background/20 p-2 font-mono text-destructive/70 text-xs">
								{errorMessage}
							</div>
						)}

						{onRetry && (
							<div className="mt-3">
								<Button
									className="border-destructive/30 bg-background/30 hover:bg-background/50"
									onClick={onRetry}
									size="sm"
									variant="outline"
								>
									<RefreshCw className="mr-2 h-3.5 w-3.5" />
									Reintentar
								</Button>
							</div>
						)}
					</div>
				</div>
			</Alert>
		</Card>
	);
}

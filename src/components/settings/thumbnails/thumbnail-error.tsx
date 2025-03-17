'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, Database, RefreshCw } from 'lucide-react';

interface ThumbnailErrorProps {
	error: Error | string;
	onRetry?: () => void;
	title?: string;
	description?: string;
	showDetails?: boolean;
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
		errorMessage.toLowerCase().includes('database') ||
		errorMessage.toLowerCase().includes('prisma') ||
		errorMessage.toLowerCase().includes('conexión');

	return (
		<Card className="border-destructive/30 bg-destructive/5 p-0">
			<Alert variant="destructive" className="border-none bg-transparent">
				<div className="flex items-start gap-3">
					{isDatabaseError ? (
						<Database className="h-5 w-5 text-destructive" />
					) : (
						<AlertCircle className="h-5 w-5 text-destructive" />
					)}
					<div className="flex-1">
						<AlertTitle className="text-destructive">{title}</AlertTitle>
						<AlertDescription className="text-destructive/80 mt-1">{description}</AlertDescription>

						{showDetails && (
							<div className="mt-3 bg-background/20 p-2 rounded text-xs font-mono text-destructive/70 max-h-20 overflow-auto">
								{errorMessage}
							</div>
						)}

						{onRetry && (
							<div className="mt-3">
								<Button
									variant="outline"
									size="sm"
									onClick={onRetry}
									className="bg-background/30 hover:bg-background/50 border-destructive/30"
								>
									<RefreshCw className="h-3.5 w-3.5 mr-2" />
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

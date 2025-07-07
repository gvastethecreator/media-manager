/**
 * Componente para mostrar el estado del backend en aplicaciones Tauri
 */

import { AlertCircle, CheckCircle, Loader2, RefreshCw, Server } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTauriBackend, useTauriContext } from '@/hooks/use-tauri-backend';

export function TauriBackendStatus() {
	const isTauri = useTauriContext();
	const { isRunning, isChecking, error, checkBackendHealth } = useTauriBackend();

	// Solo mostrar en contexto Tauri
	if (!isTauri) {
		return null;
	}

	const getStatusIcon = () => {
		if (isChecking) {
			return <Loader2 className="h-4 w-4 animate-spin" />;
		}
		if (isRunning) {
			return <CheckCircle className="h-4 w-4 text-green-500" />;
		}
		return <AlertCircle className="h-4 w-4 text-red-500" />;
	};

	const getStatusBadge = () => {
		if (isChecking) {
			return <Badge variant="secondary">Verificando...</Badge>;
		}
		if (isRunning) {
			return (
				<Badge variant="default" className="bg-green-500">
					Conectado
				</Badge>
			);
		}
		return <Badge variant="destructive">Desconectado</Badge>;
	};

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 text-sm">
					<Server className="h-4 w-4" />
					Estado del Backend
				</CardTitle>
				<CardDescription className="text-xs">Conexión con el servidor local</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{getStatusIcon()}
						<span className="text-sm font-medium">{isRunning ? 'Backend operativo' : 'Backend no disponible'}</span>
					</div>
					{getStatusBadge()}
				</div>

				{error && (
					<div className="text-xs text-muted-foreground bg-muted p-2 rounded">
						<strong>Error:</strong> {error}
					</div>
				)}

				<div className="flex gap-2">
					<Button size="sm" variant="outline" onClick={checkBackendHealth} disabled={isChecking} className="flex-1">
						<RefreshCw className={`h-3 w-3 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
						Verificar
					</Button>
				</div>

				<div className="text-xs text-muted-foreground space-y-1">
					<div>Puerto: 3001</div>
					<div>Modo: Aplicación de escritorio</div>
				</div>
			</CardContent>
		</Card>
	);
}

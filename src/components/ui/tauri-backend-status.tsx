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
			return <CheckCircle className="h-4 w-4 text-success" />;
		}
		return <AlertCircle className="h-4 w-4 text-destructive" />;
	};

	const getStatusBadge = () => {
		if (isChecking) {
			return <Badge variant="secondary">Verificando...</Badge>;
		}
		if (isRunning) {
			return (
				<Badge className="bg-success" variant="primary">
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
				<CardDescription className="text-xs">Local server connection</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						{getStatusIcon()}
						<span className="font-medium text-sm">{isRunning ? 'Backend operativo' : 'Backend no disponible'}</span>
					</div>
					{getStatusBadge()}
				</div>

				{error && (
					<div className="rounded bg-muted p-2 text-muted-foreground text-xs">
						<strong>Error:</strong> {error}
					</div>
				)}

				<div className="flex gap-2">
					<Button className="flex-1" disabled={isChecking} onClick={checkBackendHealth} size="sm" variant="outline">
						<RefreshCw className={`mr-1 h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
						Verificar
					</Button>
				</div>

				<div className="space-y-1 text-muted-foreground text-xs">
					<div>Puerto: 4000</div>
					<div>Mode: Desktop application</div>
				</div>
			</CardContent>
		</Card>
	);
}

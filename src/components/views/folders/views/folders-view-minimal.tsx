/**
 * Versión mínima de FoldersView para diagnóstico de imports
 */

import { FolderIcon } from 'lucide-react';
import type { ViewProps } from '../../types';

export function FoldersViewMinimal(_props: ViewProps) {
	return (
		<div className="h-full w-full flex flex-col items-center justify-center p-6">
			<FolderIcon className="w-16 h-16 text-muted-foreground mb-4" />
			<h2 className="text-2xl font-bold mb-2">Vista de Carpetas</h2>
			<p className="text-muted-foreground mb-4">Componente mínimo cargando correctamente</p>

			<div className="max-w-md w-full bg-card rounded-lg border border-border p-4">
				<h3 className="font-semibold mb-2">Estado del Componente</h3>
				<div className="space-y-2 text-sm">
					<div className="flex items-center">
						<div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
						<span>Imports básicos funcionando</span>
					</div>
					<div className="flex items-center">
						<div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
						<span>Lucide icons cargados</span>
					</div>
					<div className="flex items-center">
						<div className="w-2 h-2 bg-yellow-500 rounded-full mr-2" />
						<span>Esperando datos de API</span>
					</div>
				</div>
			</div>
		</div>
	);
}

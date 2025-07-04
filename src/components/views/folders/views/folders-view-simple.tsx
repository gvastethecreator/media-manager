import React from 'react';
import type { ViewProps } from '../../types';

export function FoldersViewSimple(_props: ViewProps) {
	return (
		<div className="h-full w-full flex flex-col items-center justify-center p-6">
			<div className="max-w-md w-full bg-card rounded-lg border border-border p-6 text-center">
				<div className="text-6xl mb-4">📁</div>
				<h2 className="text-xl font-semibold mb-2">Vista de Carpetas</h2>
				<p className="text-muted-foreground mb-4">
					El componente FoldersView se está cargando correctamente.
				</p>
				<div className="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 rounded-full text-sm">
					<div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
					Sistema funcionando
				</div>
			</div>
		</div>
	);
}
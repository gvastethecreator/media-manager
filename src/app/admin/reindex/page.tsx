/**
 * @file Página de administración del sistema de reindexado
 * @module app/admin/reindex/page
 * @description Interfaz administrativa para monitorear el sistema de reindexado y sus logs
 */

import { Metadata } from 'next';
import ReindexLogsViewer from '@/components/settings/folders/reindex-logs-viewer';

export const metadata: Metadata = {
	title: 'Sistema de Reindexado - Administración',
	description: 'Monitoreo y logs del sistema de reindexado de archivos',
};

export default function ReindexAdminPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="mb-2 font-bold text-3xl text-gray-900 dark:text-gray-100">
					Administración del Sistema de Reindexado
				</h1>
				<p className="text-muted-foreground dark:text-muted-foreground">
					Monitoreo, logs y estadísticas del sistema de reindexado automático de carpetas y archivos.
				</p>
			</div>

			<ReindexLogsViewer />
		</div>
	);
}

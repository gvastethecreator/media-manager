/**
 * @file Página de administración del sistema de reindexado
 * @module app/admin/reindex/page
 * @description Interfaz administrativa para monitorear el sistema de reindexado y sus logs
 */

import ReindexLogsViewer from '@/components/settings/folders/reindex-logs-viewer';

export default function ReindexAdminPage() {
	return (
		<div className="container mx-auto px-4 py-8">
			<div className="mb-8">
				<h1 className="mb-2 font-bold text-3xl text-gray-900 dark:text-gray-100">Reindex System Administration</h1>
				<p className="text-muted-foreground dark:text-muted-foreground">
					Monitoring, logs, and statistics for automatic folder and file reindexing.
				</p>
			</div>

			<ReindexLogsViewer />
		</div>
	);
}

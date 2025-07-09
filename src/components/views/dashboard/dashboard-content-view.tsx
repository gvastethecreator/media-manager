import { memo } from 'react';
import type { SystemStats } from '@/hooks/useSystemStats';

interface DashboardContentViewProps {
	stats: SystemStats | undefined;
	isLoading: boolean;
	isError: boolean;
	error: Error | null;
}

const DashboardContentView: React.FC<DashboardContentViewProps> = memo(function DashboardContentView({
	stats,
	isLoading,
	isError,
	error,
}) {
	if (isLoading) {
		return (
			<div className="h-full w-full flex flex-col items-center justify-center p-6">
				<p className="text-muted-foreground">Cargando estadísticas...</p>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="h-full w-full flex flex-col items-center justify-center p-6">
				<p className="text-red-500">Error al cargar las estadísticas: {error?.message}</p>
			</div>
		);
	}

	return (
		<div className="h-full w-full flex flex-col items-center justify-center p-6">
			<h2 className="text-2xl font-bold mb-2">🏠 Dashboard</h2>
			<p className="text-muted-foreground">Bienvenido al panel de control.</p>
			<div className="grid grid-cols-2 gap-4 mt-8">
				<div className="bg-card p-4 rounded-lg shadow">
					<p className="text-sm text-muted-foreground">Imágenes</p>
					<p className="text-2xl font-bold">{stats?.totalImages}</p>
				</div>
				<div className="bg-card p-4 rounded-lg shadow">
					<p className="text-sm text-muted-foreground">Carpetas</p>
					<p className="text-2xl font-bold">{stats?.totalFolders}</p>
				</div>
				<div className="bg-card p-4 rounded-lg shadow">
					<p className="text-sm text-muted-foreground">Colecciones</p>
					<p className="text-2xl font-bold">{stats?.totalCollections}</p>
				</div>
				<div className="bg-card p-4 rounded-lg shadow">
					<p className="text-sm text-muted-foreground">Etiquetas</p>
					<p className="text-2xl font-bold">{stats?.totalTags}</p>
				</div>
			</div>
		</div>
	);
});

export default DashboardContentView;

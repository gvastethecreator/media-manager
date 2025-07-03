import { NavPanel } from '@/components/navigation/navigation-panel';
import { useNavigationStats } from '@/lib/api/navigation';
import { useDetailsPanel } from '@/store/details-panel.store';

export function MainLayout() {
	const { isVisible } = useDetailsPanel();
	const { data: stats, isLoading: isLoadingStats } = useNavigationStats();

	return (
		<div className="h-screen w-full flex bg-background">
			{/* Panel de navegación izquierdo */}
			<div className="w-64 border-r border-border">
				<NavPanel
					isCollapsed={false}
				/>
			</div>

			{/* Panel central */}
			<div className="flex-1 flex flex-col">
				{/* Toolbar superior */}
				<div className="h-12 bg-blue-100 border-b border-border p-2 flex items-center">
					<span className="text-sm font-medium">🎉 MainLayout con API Migrada</span>
				</div>

				{/* Contenido principal */}
				<div className="flex-1 p-4 bg-background">
					<div className="h-full bg-muted/10 rounded-lg flex items-center justify-center">
						<div className="text-center">
							<h2 className="text-2xl font-bold mb-2">🚀 ¡MainLayout con API!</h2>
							<p className="text-muted-foreground mb-4">
								Navigation System migrado a API calls con React Query
							</p>
							{isLoadingStats ? (
								<div className="text-sm text-muted-foreground space-y-2">
									<div className="h-4 bg-muted animate-pulse rounded w-48 mx-auto" />
									<div className="h-4 bg-muted animate-pulse rounded w-32 mx-auto" />
									<div className="h-4 bg-muted animate-pulse rounded w-40 mx-auto" />
								</div>
							) : (
								<div className="text-sm text-muted-foreground">
									<p>Total imágenes: {stats?.totalImages || 0}</p>
									<p>Total carpetas: {stats?.totalFolders || 0}</p>
									<p>Total colecciones: {stats?.totalCollections || 0}</p>
									<p>Total tags: {stats?.totalTags || 0}</p>
									<p>Panel detalles: {isVisible ? 'Visible' : 'Oculto'}</p>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Panel de detalles */}
			{isVisible && (
				<div className="w-80 bg-background border-l border-border">
					<div className="p-4">
						<h3 className="font-semibold mb-2">Panel de Detalles</h3>
						<p className="text-sm text-muted-foreground">
							Panel de detalles funcionando correctamente
						</p>
					</div>
				</div>
			)}
		</div>
	);
}

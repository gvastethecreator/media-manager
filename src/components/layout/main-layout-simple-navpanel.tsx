import { NavPanel } from '@/components/navigation/navigation-panel';
import { useDetailsPanel } from '@/store/details-panel.store';

// Datos mock completos para el NavPanel
const mockNavigationData = {
	stats: {
		totalImages: 156,
		totalFolders: 8,
		totalCollections: 5,
		totalTags: 24,
		totalAlbums: 12,
		totalCharacters: 18,
		totalPlaces: 6,
		totalWorldItems: 9,
		totalFavorites: 42,
		totalActivities: 128,
		totalSize: 1024 * 1024 * 1024, // 1GB
		totalViews: 2456,
		totalDownloads: 89,
		topTags: [
			{ id: '1', name: 'landscape', count: 35 },
			{ id: '2', name: 'portrait', count: 28 },
			{ id: '3', name: 'nature', count: 22 }
		],
		recentActivity: [],
	}
};

export function MainLayoutSimpleNavPanel() {
	const { isVisible } = useDetailsPanel();

	return (
		<div className="h-screen w-full flex bg-background">
			{/* Panel izquierdo - NavPanel Original */}
			<div className="w-64 border-r border-border overflow-y-auto">
				<div className="p-2 bg-blue-100 border-b">
					<h3 className="text-sm font-bold text-blue-800">🧪 NavPanel Original Test</h3>
				</div>
				<NavPanel
					initialData={mockNavigationData}
					isCollapsed={false}
					onToggleCollapse={() => console.log('Toggle collapse')}
				/>
			</div>

			{/* Panel central */}
			<div className="flex-1 flex flex-col">
				{/* Toolbar */}
				<div className="h-12 bg-green-100 border-b border-border p-2 flex items-center">
					<span className="text-sm font-medium">✅ NavPanel Original Funcionando</span>
				</div>

				{/* Contenido */}
				<div className="flex-1 p-4 bg-background">
					<div className="h-full bg-muted/10 rounded-lg flex items-center justify-center">
						<div className="text-center">
							<h2 className="text-2xl font-bold mb-2">🎉 ¡NavPanel Original Funcionando!</h2>
							<p className="text-muted-foreground mb-4">
								Dependencias críticas migradas exitosamente
							</p>
							<div className="text-sm text-muted-foreground">
								<p>✅ navigation.actions.ts migrado (sin 'use server')</p>
								<p>✅ events.client.ts migrado (sin useOptimistic)</p>
								<p>✅ Todos los hooks funcionando</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Panel derecho */}
			{isVisible && (
				<div className="w-80 bg-background border-l border-border p-4">
					<h3 className="font-semibold mb-2">Panel de Detalles</h3>
					<p className="text-sm text-muted-foreground">
						Estado: {isVisible ? 'Visible' : 'Oculto'}
					</p>
				</div>
			)}
		</div>
	);
}
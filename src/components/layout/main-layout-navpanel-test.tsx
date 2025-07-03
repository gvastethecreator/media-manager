import { useState } from 'react';
// Import del NavPanel original para probar
import { NavPanel } from '@/components/navigation/navigation-panel';
import { useDetailsPanel } from '@/store/details-panel.store';

// Datos mock básicos mejorados
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

// Componente que prueba el NavPanel completo
const NavPanelTester = () => {
	const [testStatus, setTestStatus] = useState<'loading' | 'success' | 'error'>('loading');
	const [error, setError] = useState<Error | null>(null);

	// Intentar renderizar el NavPanel
	try {
		return (
			<div className="w-full space-y-4">
				<div className="bg-green-50 p-4 rounded border border-green-200">
					<h3 className="text-green-800 font-bold mb-2">✅ NavPanel Original - Test Directo</h3>
					<div className="space-y-2 text-green-700 text-sm">
						<p>🔄 Intentando renderizar NavPanel original...</p>
						<p className="text-xs">Dependencias críticas migradas ✅</p>
					</div>
				</div>

				{/* NavPanel Original */}
				<div className="w-full h-96 border border-gray-300 rounded overflow-hidden bg-white">
					<NavPanel
						initialData={mockNavigationData}
						isCollapsed={false}
						onToggleCollapse={() => console.log('Toggle collapse')}
					/>
				</div>
			</div>
		);
	} catch (e) {
		console.error('Error rendering NavPanel:', e);
		return (
			<div className="w-full bg-red-100 border border-red-300 p-4 rounded">
				<h3 className="text-red-800 font-bold mb-2">❌ NavPanel Original FALLA</h3>
				<div className="space-y-2 text-red-700 text-sm">
					<p>Error en NavPanel completo:</p>
					<p className="text-xs mt-2 font-mono bg-red-200 p-2 rounded">
						{e instanceof Error ? e.message : 'Error desconocido'}
					</p>
					<p className="text-xs mt-2">
						Stack: {e instanceof Error ? e.stack?.slice(0, 200) + '...' : 'N/A'}
					</p>
				</div>
			</div>
		);
	}
};

export function MainLayoutNavPanelTest() {
	const { isVisible } = useDetailsPanel();

	return (
		<div className="h-screen w-full flex bg-background">
			{/* Panel izquierdo - TEST SIMPLIFICADO */}
			<div className="w-80 border-r border-border overflow-y-auto p-4">
				<div className="space-y-4">
					<div className="bg-blue-50 p-3 rounded">
						<h4 className="font-bold text-blue-800">🧪 Test NavPanel Directo</h4>
						<p className="text-sm text-blue-600 mt-1">
							Probando NavPanel original después de migrar dependencias críticas
						</p>
					</div>

					<div className="bg-green-50 p-3 rounded">
						<h4 className="font-bold text-green-800">✅ Dependencias Migradas</h4>
						<ul className="text-sm text-green-600 mt-1 space-y-1">
							<li>• navigation.actions.ts (sin 'use server')</li>
							<li>• events.client.ts (sin useOptimistic)</li>
							<li>• Hooks individuales funcionando</li>
						</ul>
					</div>
				</div>
			</div>

			{/* Panel central */}
			<div className="flex-1 flex flex-col">
				{/* Toolbar */}
				<div className="h-12 bg-orange-100 border-b border-border p-2 flex items-center">
					<span className="text-sm font-medium">🧪 Testing NavPanel Original Post-Migration</span>
				</div>

				{/* Contenido */}
				<div className="flex-1 p-4 bg-background">
					<div className="h-full bg-muted/10 rounded-lg p-4">
						<div className="mb-4 text-center">
							<h2 className="text-2xl font-bold mb-2">🔍 NavPanel Original Test</h2>
							<p className="text-muted-foreground mb-4">
								Dependencias críticas migradas ✅ - Probando componente completo
							</p>
						</div>

						<NavPanelTester />
					</div>
				</div>
			</div>

			{/* Panel derecho */}
			{isVisible && (
				<div className="w-80 bg-background border-l border-border p-4">
					<h3 className="font-semibold mb-2">Panel de Detalles</h3>
					<p className="text-sm text-muted-foreground">
						Panel detalles: {isVisible ? 'Visible' : 'Oculto'}
					</p>
					<div className="mt-4 text-xs text-muted-foreground">
						<p>Estado: Testing NavPanel original 🔍</p>
					</div>
				</div>
			)}
		</div>
	);
}
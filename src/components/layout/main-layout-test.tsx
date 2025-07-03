import { useCategoryCollapse, useCategoryHandlers, useCategoryStats, useMainNavigation } from '@/components/navigation/hooks';
import { NavPanel } from '@/components/navigation/navigation-panel';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useMemo, useState } from 'react';

// Datos mock para el NavPanel
const mockNavigationData = {
	folders: [
		{ id: '1', name: 'Mis Fotos', path: '/photos', itemCount: 25 },
		{ id: '2', name: 'Documentos', path: '/docs', itemCount: 12 }
	],
	collections: [
		{ id: '1', name: 'Favoritas', description: 'Mis imágenes favoritas', itemCount: 15 }
	],
	tags: [
		{ id: '1', name: 'landscape', color: '#10b981' },
		{ id: '2', name: 'portrait', color: '#3b82f6' }
	],
	albums: [
		{ id: '1', name: 'Vacaciones 2024', description: 'Fotos de vacaciones' }
	],
	characters: [
		{ id: '1', name: 'Ana', description: 'Personaje principal' }
	],
	places: [
		{ id: '1', name: 'París', description: 'Ciudad de la luz' }
	],
	worldItems: [
		{ id: '1', name: 'Espada mágica', description: 'Arma legendaria' }
	],
	concepts: [
		{ id: '1', name: 'Libertad', description: 'Concepto filosófico' }
	],
	prompts: [
		{ id: '1', name: 'Paisaje épico', description: 'Prompt para IA' }
	],
	notes: [
		{ id: '1', name: 'Ideas', description: 'Notas importantes' }
	],
	groups: [
		{ id: '1', name: 'Equipo A', description: 'Grupo de trabajo' }
	],
	properties: [
		{ id: '1', name: 'Color', description: 'Propiedad visual' }
	],
	wildcards: [
		{ id: '1', name: 'Random', description: 'Elemento aleatorio' }
	],
	audios: [],
	documents: [],
	jsonFiles: [],
	file3ds: [],
	workflows: [],
	stats: {
		totalImages: 156,
		totalFolders: 12,
		totalCollections: 8,
		totalTags: 25,
		totalAlbums: 6,
		totalCharacters: 4,
		totalPlaces: 3,
		totalWorldItems: 2,
		totalFavorites: 45,
		totalActivities: 128,
		totalSize: 1024 * 1024 * 512,
		totalViews: 892,
		totalDownloads: 156,
		topTags: [],
		recentActivity: []
	}
};

// Componente para probar el NavPanel completo
const NavPanelTester = () => {
	const navigationData = useMemo(() => mockNavigationData, []);

	try {
		console.log('🧪 Probando NavPanel completo...');

		return (
			<div className="w-full h-full">
				<NavPanel
					initialData={navigationData}
					isCollapsed={false}
				/>
			</div>
		);
	} catch (error) {
		console.error('❌ Error en NavPanel completo:', error);
		return (
			<div className="w-full bg-red-50 p-4 rounded">
				<h3 className="text-red-800 font-bold mb-2">❌ Error en NavPanel Completo</h3>
				<div className="space-y-2 text-red-700 text-sm">
					<p>Los hooks individuales funcionan, pero el NavPanel completo falla:</p>
					<p className="text-xs mt-2 font-mono bg-red-100 p-2 rounded">
						{error instanceof Error ? error.message : 'Error desconocido'}
					</p>
				</div>
			</div>
		);
	}
};

// Componente que muestra los hooks funcionando
const HooksWorkingTester = () => {
	const navigationData = useMemo(() => mockNavigationData, []);

	const { isCategoryCollapsed, handleCollapseToggle, expandCategory } = useCategoryCollapse();
	const { getCategoryItemCount, getImagesForCategory, getCategoryItems, stats } = useCategoryStats(navigationData);
	const { handleOpenSettings, handleOpenDevelopment, handleOpenEntityCards, handleMainNavigate } = useMainNavigation();
	const categoryHandlers = useCategoryHandlers();

	return (
		<div className="w-full bg-green-50 p-4 rounded">
			<h3 className="text-green-800 font-bold mb-2">✅ Todos los hooks funcionando!</h3>
			<div className="space-y-2 text-green-700 text-sm">
				<p>✅ useCategoryCollapse: OK</p>
				<p>✅ useCategoryStats: OK</p>
				<p>✅ useMainNavigation: OK</p>
				<p>✅ useCategoryHandlers: OK</p>
				<p className="text-xs">Total items: {stats.totalImages}</p>
			</div>
		</div>
	);
};

// Componente principal que decide cuál usar
const HookTester = () => {
	const [testNavPanel, setTestNavPanel] = useState(false);

	if (testNavPanel) {
		return <NavPanelTester />;
	}

	return (
		<div className="space-y-2">
			<HooksWorkingTester />
			<button
				type="button"
				onClick={() => setTestNavPanel(true)}
				className="w-full px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs"
			>
				🧪 Probar NavPanel Completo
			</button>
		</div>
	);
};

export function MainLayoutTest() {
	const { isVisible } = useDetailsPanel();

	return (
		<div className="h-screen w-full flex bg-background">
			{/* Panel izquierdo - PROBANDO NAVPANEL COMPLETO */}
			<div className="w-64 border-r border-border">
				<HookTester />
			</div>

			{/* Panel central */}
			<div className="flex-1 flex flex-col">
				{/* Toolbar */}
				<div className="h-12 bg-blue-100 border-b border-border p-2 flex items-center">
					<span className="text-sm font-medium">🧪 NavPanel Testing: Hooks ✅ → NavPanel completo</span>
				</div>

				{/* Contenido */}
				<div className="flex-1 p-4 bg-background">
					<div className="h-full bg-muted/10 rounded-lg flex items-center justify-center">
						<div className="text-center">
							<h2 className="text-2xl font-bold mb-2">🧪 NavPanel Testing</h2>
							<p className="text-muted-foreground mb-4">
								Hooks individuales ✅ - Probando NavPanel completo
							</p>
							<div className="text-sm text-muted-foreground">
								<p>Panel detalles: {isVisible ? 'Visible' : 'Oculto'}</p>
								<p>Paso actual: NavPanel completo</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Panel derecho */}
			{isVisible && (
				<div className="w-80 bg-background border-l border-border p-4">
					<h3 className="font-semibold mb-2">Panel de Detalles</h3>
					<p className="text-sm text-muted-foreground">Funcionando correctamente</p>
				</div>
			)}
		</div>
	);
}
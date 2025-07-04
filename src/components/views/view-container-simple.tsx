import { memo, useEffect } from 'react';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { useDetailsPanel } from '@/store/details-panel.store';

// ViewContainer con switch básico para debug
export const ViewContainer = memo(function ViewContainer() {
	const { currentView } = useNavigationStore();
	const { isVisible, toggleVisibility } = useDetailsPanel();

	// Debug: log cuando cambia la vista
	useEffect(() => {
		console.log('🔄 [ViewContainer] Vista actual cambió a:', currentView);
	}, [currentView]);

	const renderView = () => {
		switch (currentView) {
			case 'settings':
				return (
					<div className="p-8">
						<h3 className="text-xl font-semibold mb-4">⚙️ Configuración</h3>
						<p className="text-muted-foreground">Vista de configuración</p>
					</div>
				);
			case 'folders':
				return (
					<div className="p-8">
						<h3 className="text-xl font-semibold mb-4">📁 Carpetas</h3>
						<p className="text-muted-foreground">Vista de carpetas (placeholder)</p>
						<div className="mt-4">
							<button
								type="button"
								onClick={toggleVisibility}
								className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
							>
								{isVisible ? 'Ocultar' : 'Mostrar'} Panel Derecho
							</button>
							<p className="text-sm mt-2">Panel derecho visible: {isVisible ? 'Sí' : 'No'}</p>
							<p className="text-xs mt-1 text-muted-foreground">Vista actual: {currentView}</p>
						</div>
					</div>
				);
			case 'albums':
				return (
					<div className="p-8">
						<h3 className="text-xl font-semibold mb-4">🎵 Álbumes</h3>
						<p className="text-muted-foreground">Vista de álbumes (placeholder)</p>
						<p className="text-sm mt-2 text-green-600">✅ Navegación funcionando correctamente!</p>
					</div>
				);
			case 'development':
				return (
					<div className="p-8">
						<h3 className="text-xl font-semibold mb-4">🔧 Desarrollo</h3>
						<p className="text-muted-foreground">Vista de desarrollo (placeholder)</p>
						<p className="text-xs text-yellow-600 mt-2">
							ℹ️ DevelopmentView original causa problemas - usando placeholder
						</p>
					</div>
				);
			default:
				return (
					<div className="p-8">
						<h3 className="text-xl font-semibold mb-4">🏠 Vista: {currentView}</h3>
						<p className="text-muted-foreground">
							Vista genérica para: <strong>{currentView}</strong>
						</p>
						<p className="text-xs text-blue-600 mt-2">ℹ️ Esta vista no tiene implementación específica</p>
					</div>
				);
		}
	};

	return (
		<div className="h-full w-full flex flex-col overflow-hidden">
			<div className="flex-1 min-h-0 flex flex-col">{renderView()}</div>
		</div>
	);
});

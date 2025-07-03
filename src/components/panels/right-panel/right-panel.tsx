import { PanelRightClose, X } from 'lucide-react';
import { lazy, memo, Suspense, useCallback, useEffect, useState } from 'react';
import { DetailsPanel } from '@/components/features/file-browser/details/details-panel';
import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';

// Carga perezosa del StatsPanel compatible con Vite/React 19
const StatsPanel = lazy(() => import('../stats/stats-panel'));

// Componente para manejar la carga perezosa del StatsPanel
const LazyStatsPanel = memo(function LazyStatsPanel() {
	// Usamos un estado para controlar si el panel ha sido visible por suficiente tiempo
	const [shouldRender, setShouldRender] = useState(false);

	useEffect(() => {
		// Solo renderizamos después de un breve retraso
		const timer = setTimeout(() => {
			setShouldRender(true);
		}, 300);

		return () => clearTimeout(timer);
	}, []);

	if (!shouldRender) {
		return (
			<div className="flex items-center justify-center w-full h-full">
				<div className="animate-pulse p-4 text-muted-foreground text-sm">Inicializando estadísticas...</div>
			</div>
		);
	}

	return (
		<Suspense fallback={<div className="p-4 text-muted-foreground text-sm">Cargando estadísticas...</div>}>
			<StatsPanel />
		</Suspense>
	);
});

interface RightPanelProps {
	className?: string;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
}

/**
 * Panel lateral derecho para la aplicación
 *
 * Este componente funciona como contenedor para diferentes tipos de contenido
 * que se pueden mostrar en el panel lateral derecho de la aplicación.
 * Muestra estadísticas por defecto o detalles de las imágenes seleccionadas.
 */
export function RightPanel({ className, isCollapsed, onToggleCollapse }: RightPanelProps) {
	const { isVisible, setVisible, selectedItems, showStatsWhenEmpty } = useDetailsPanel();
	const { currentView } = useNavigationStore();
	const [mounted, setMounted] = useState(false);
	const hasSelectedItems = selectedItems && selectedItems.length > 0;

	// Ocultar el panel cuando estamos en la vista de settings
	const isInSettingsView = currentView === 'settings';

	// Determina si debemos mostrar el panel
	const shouldShowPanel = !isInSettingsView && (isVisible || hasSelectedItems);
	// Determina si debemos mostrar las estadísticas
	const shouldShowStats = !isInSettingsView && !hasSelectedItems && showStatsWhenEmpty;

	// Al montar el componente, marcamos que estamos listos para renderizar
	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	// Efecto para manejar la visibilidad cuando cambia el estado de colapso
	useEffect(() => {
		// Solo actuamos si el componente está montado
		if (!mounted) return;
	}, [mounted]);

	// Manejar el cierre del panel
	const handleClose = useCallback(() => {
		setVisible(false);
	}, [setVisible]);

	// Determinamos el título según el contenido actual
	const panelTitle = hasSelectedItems ? 'Detalles' : 'Estadísticas';

	// No mostramos nada si no hay razón para mostrar el panel
	if (!shouldShowPanel && !shouldShowStats) {
		return null;
	}

	return (
		<div
			className={cn(
				'flex flex-col h-full bg-background transition-all duration-300',
				isCollapsed && 'right-panel-collapsed'
			)}
		>
			<div className="flex items-center justify-between p-2 border-b">
				<h3 className="text-sm font-medium">{panelTitle}</h3>
				<div className="flex items-center gap-1">
					{onToggleCollapse && (
						<Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={onToggleCollapse}>
							<PanelRightClose className="h-4 w-4" />
						</Button>
					)}
					<Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={handleClose}>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{!isCollapsed &&
				(hasSelectedItems ? (
					<ScrollArea className="flex-1">
						<div className="p-2">
							<DetailsPanel selectedItems={selectedItems} />
						</div>
					</ScrollArea>
				) : (
					shouldShowStats && <LazyStatsPanel />
				))}
		</div>
	);
}

/**
 * 📝 Actualizado para usar DetailsPanelV2
 * - Usa EntityWithStats desde el store
 * - No requiere casting de tipos
 * - Compatible con el nuevo sistema de tipos
 */

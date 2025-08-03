import { memo, Suspense, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DetailsPanelV2 } from '@/components/panels/details-panel/details-panel';
import { FolderStatsDisplay } from '@/components/panels/stats-panel/folder-stats-display';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';

// Carga perezosa del StatsPanel compatible con Vite/React 19
// const StatsPanel = lazy(() => import('../stats-panel/stats-panel')); // Temporalmente comentado - archivo no existe
// const FolderStats = lazy(() =>
// 	import('../stats-panel/components/folder-stats').then((m) => ({ default: m.FolderStats }))
// ); // Temporalmente comentado - archivo no existe

// Componente para manejar la carga perezosa del StatsPanel
const LazyStatsPanel = memo(function LazyStatsPanel({
	folderId,
}: {
	folderId?: string;
	folderName?: string;
}) {
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

	if (!folderId) {
		return (
			<div className="p-4 text-muted-foreground text-sm text-center">
				<p>No hay carpeta seleccionada</p>
			</div>
		);
	}

	return (
		<Suspense fallback={<div className="p-4 text-muted-foreground text-sm">Cargando estadísticas...</div>}>
			<FolderStatsDisplay folderId={folderId} />
		</Suspense>
	);
});

interface RightPanelProps {
	className?: string;
	isCollapsed?: boolean;
	onToggleCollapse?: () => void;
	isAnimating?: boolean;
}

/**
 * Panel lateral derecho para la aplicación
 *
 * Este componente funciona como contenedor para diferentes tipos de contenido
 * que se pueden mostrar en el panel lateral derecho de la aplicación.
 * Muestra estadísticas por defecto o detalles de las imágenes seleccionadas.
 */
export const RightPanel = memo(function RightPanel({
	isCollapsed,
	isAnimating = false,
}: RightPanelProps) {
	const { isVisible, selectedItems, showStatsWhenEmpty } = useDetailsPanel();
	const location = useLocation();
	const [mounted, setMounted] = useState(false);
	const hasSelectedItems = selectedItems && selectedItems.length > 0;

	// Ocultar el panel cuando estamos en la vista de settings
	const isInSettingsView = location.pathname === '/settings';

	// Extraer información de la carpeta desde la URL
	const currentFolderInfo = useMemo(() => {
		const pathParts = location.pathname.split('/');
		if (pathParts[1] === 'folders' && pathParts[2]) {
			return {
				folderId: decodeURIComponent(pathParts[2]),
				folderName: decodeURIComponent(pathParts[2]),
			};
		}
		return { folderId: undefined, folderName: undefined };
	}, [location.pathname]);

	// Determina si debemos mostrar el panel - siempre mostrar en views con contenido
	const shouldShowPanel = !isInSettingsView && (isVisible || hasSelectedItems || showStatsWhenEmpty);
	// Determina si debemos mostrar las estadísticas - mostrar cuando no hay items seleccionados
	const shouldShowStats = !isInSettingsView && !hasSelectedItems;

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

	// Determinamos el título según el contenido actual
	const panelTitle = hasSelectedItems ? 'Detalles' : 'Estadísticas';

	// No mostramos nada si no hay razón para mostrar el panel
	if (!shouldShowPanel) {
		return null;
	}

	return (
		<div
			className={cn(
				'flex flex-col h-full bg-background',
				isAnimating && 'transition-all duration-300',
				isCollapsed && 'right-panel-collapsed'
			)}
		>
			<div className="flex items-center justify-between p-2 border-b">
				<h3 className="text-sm font-medium">{panelTitle}</h3>
			</div>

			{!isCollapsed &&
				(hasSelectedItems ? (
					<ScrollArea className="flex-1">
						<DetailsPanelV2 selectedItems={selectedItems} />
					</ScrollArea>
				) : (
					shouldShowStats && (
						<LazyStatsPanel folderId={currentFolderInfo.folderId} folderName={currentFolderInfo.folderName} />
					)
				))}
		</div>
	);
});

/**
 * 📝 Actualizado para usar DetailsPanelV2
 * - Usa EntityWithStats desde el store
 * - No requiere casting de tipos
 * - Compatible con el nuevo sistema de tipos
 */

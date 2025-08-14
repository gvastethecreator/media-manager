import { lazy, memo as reactMemo, Suspense, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { DetailsPanel } from '@/components/panels/details-panel';
import { FolderStatsDisplay } from '@/components/panels/stats-panel/folder-stats-display';
import { SystemStatsDisplay } from '@/components/panels/stats-panel/system-stats-display';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';

// Lazy load InterfaceSection para no impactar bundle inicial
const InterfaceSection = lazy(() => import('@/components/settings/interface-section'));

// Componente para manejar la carga perezosa del StatsPanel
const LazyStatsPanel = reactMemo(function RightPanelLazyStatsPanel({
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
			<div className="flex h-full w-full items-center justify-center">
				<div className="animate-pulse p-4 text-muted-foreground text-sm">Inicializando estadísticas...</div>
			</div>
		);
	}

	// Si hay folderId, mostrar estadísticas de carpeta
	if (folderId) {
		return (
			<Suspense fallback={<div className="p-4 text-muted-foreground text-sm">Cargando estadísticas...</div>}>
				<FolderStatsDisplay folderId={folderId} />
			</Suspense>
		);
	}

	// Si no hay folderId, mostrar estadísticas del sistema
	return (
		<Suspense fallback={<div className="p-4 text-muted-foreground text-sm">Cargando estadísticas...</div>}>
			<SystemStatsDisplay />
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
export const RightPanel = reactMemo(function RightPanelComponent({
	isCollapsed,
	isAnimating = false,
}: RightPanelProps) {
	const { isVisible, selectedItems, showStatsWhenEmpty, showInterfaceSettings } = useDetailsPanel();
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

	// Nueva lógica: si el usuario ha marcado el panel como visible (isVisible), siempre se muestra (incluye EmptyPanel).
	// Cuando no hay selección y el panel está visible, mostrar estadísticas solo si showStatsWhenEmpty es true; de lo contrario mostrar EmptyPanel.
	const shouldShowPanel =
		!isInSettingsView && (isVisible || hasSelectedItems || showStatsWhenEmpty || showInterfaceSettings);
	const shouldShowStats = !(isInSettingsView || hasSelectedItems) && showStatsWhenEmpty && !showInterfaceSettings;

	// Al montar el componente, marcamos que estamos listos para renderizar
	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	// Efecto para manejar la visibilidad cuando cambia el estado de colapso
	useEffect(() => {
		// Solo actuamos si el componente está montado
		if (!mounted) {
			return;
		}
	}, [mounted]);

	// Determinamos el título según el contenido actual
	const panelTitle = showInterfaceSettings ? 'Configuración' : hasSelectedItems ? 'Detalles' : 'Panel';

	// No mostramos nada si no hay razón para mostrar el panel
	if (!shouldShowPanel) {
		return null;
	}

	return (
		<div
			className={cn(
				'flex h-full w-full bg-background',
				isAnimating && 'transition-all duration-300',
				isCollapsed && 'right-panel-collapsed'
			)}
		>
			{!isCollapsed &&
				(showInterfaceSettings ? (
					<Suspense fallback={<div className="p-4 text-muted-foreground text-sm">Cargando configuración...</div>}>
						<div className="w-full overflow-y-auto p-2 pr-3">
							<InterfaceSection />
						</div>
					</Suspense>
				) : hasSelectedItems ? (
					<DetailsPanel selectedItems={selectedItems} />
				) : shouldShowStats ? (
					<LazyStatsPanel folderId={currentFolderInfo.folderId} folderName={currentFolderInfo.folderName} />
				) : (
					<DetailsPanel selectedItems={[]} />
				))}
		</div>
	);
});

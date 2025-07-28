import { memo, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { DetailsPanel } from '../details-panel/details-panel';

interface RightPanelProps {
	isCollapsed?: boolean;
	isAnimating?: boolean;
}

/**
 * Panel lateral derecho para la aplicación
 *
 * Este componente funciona como contenedor para diferentes tipos de contenido
 * que se pueden mostrar en el panel lateral derecho de la aplicación.
 * Muestra estadísticas por defecto o detalles de las imágenes seleccionadas.
 */
export const RightPanel = memo(function RightPanel({ isCollapsed, isAnimating = false }: RightPanelProps) {
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
						<div className="p-1">
							<DetailsPanel selectedItems={selectedItems} />
						</div>
					</ScrollArea>
				) : (
					shouldShowStats && (
						<ScrollArea className="flex-1">
							<div className="p-1">
								<DetailsPanel selectedItems={[]} />
							</div>
						</ScrollArea>
					)
				))}
		</div>
	);
});

/**
 * 📝 Actualizado para usar DetailsPanel
 * - Usa EntityWithStats desde el store
 * - No requiere casting de tipos
 * - Compatible con el nuevo sistema de tipos
 */

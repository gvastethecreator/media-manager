'use client';

import { DetailsPanel } from '@/components/features/file-browser/details/details-panel';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import type { ImageItem } from '@/types/image-item';
import { PanelRightClose, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

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
 * Actualmente admite mostrar los detalles de las imágenes seleccionadas.
 */
export function RightPanel({ className, isCollapsed, onToggleCollapse }: RightPanelProps) {
	const { isVisible, setVisible, selectedItems } = useDetailsPanel();
	const [mounted, setMounted] = useState(false);

	// Al montar el componente, marcamos que estamos listos para renderizar
	useEffect(() => {
		setMounted(true);
		return () => setMounted(false);
	}, []);

	// Efecto para manejar la visibilidad cuando cambia el estado de colapso
	useEffect(() => {
		// Solo actuamos si el componente está montado
		if (!mounted) return;
	}, [isCollapsed, selectedItems, mounted]);

	// Manejar el cierre del panel
	const handleClose = useCallback(() => {
		setVisible(false);
	}, [setVisible]);

	// Si no hay elementos seleccionados o el panel no debería ser visible
	if (!isVisible || !selectedItems || selectedItems.length === 0) {
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
				<h3 className="text-sm font-medium">Detalles</h3>
				<div className="flex items-center gap-1">
					{onToggleCollapse && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 cursor-pointer"
							onClick={onToggleCollapse}
						>
							<PanelRightClose className="h-4 w-4" />
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 cursor-pointer"
						onClick={handleClose}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>

			{!isCollapsed && (
				<ScrollArea className="flex-1">
					<div className="p-2">
						<DetailsPanel selectedItems={selectedItems as ImageItem[]} />
					</div>
				</ScrollArea>
			)}
		</div>
	);
}

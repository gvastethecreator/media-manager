/**
 * @file Test simple para verificar que el menú contextual funciona
 */

import { CustomContextMenu } from '@/components/features/file-browser/context-menu/custom-context-menu';
import { useCustomContextMenu } from '@/hooks/use-custom-context-menu';

export function TestContextMenu() {
	const { isOpen, position, handleContextMenu, closeMenu } = useCustomContextMenu();

	const handleAction = (action: string, data?: any) => {
		console.log('Acción ejecutada:', action, data);
		// eslint-disable-next-line no-alert
		alert(`Acción: ${action}`);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			handleContextMenu(e as any);
		}
	};

	return (
		<div className="p-8">
			<button
				aria-label="Área de prueba del menú contextual"
				className="flex h-96 w-full cursor-default items-center justify-center rounded-lg border border-border bg-muted"
				onContextMenu={handleContextMenu}
				onKeyDown={handleKeyDown}
				tabIndex={0}
				type="button"
			>
				<p className="text-lg text-muted-foreground">Haz click derecho aquí para ver el menú contextual</p>
			</button>

			<CustomContextMenu
				isOpen={isOpen}
				onAction={handleAction}
				onClose={closeMenu}
				position={position} // Sin elementos seleccionados para probar menú de espacio vacío
				selectedItems={[]}
			/>
		</div>
	);
}

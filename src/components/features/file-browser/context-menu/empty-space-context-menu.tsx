import { Copy, FolderPlus, Loader2, MousePointer, RefreshCw } from 'lucide-react';
import { memo, useState } from 'react';
import { Separator } from '@/components/ui/separator';
import { useContextMenuNavigation } from '@/lib/keyboard';
import { clipboardManager } from './context-action-handler';

import type { EmptySpaceAction, EmptySpaceContextMenuProps } from './types';

/**
 * Menú contextual para espacio vacío en el navegador de archivos
 */
export const EmptySpaceContextMenu = memo<EmptySpaceContextMenuProps>(function EmptySpaceContextMenu({
	onAction,
	position,
	currentPath,
	canPaste = false,
	totalItems = 0,
}) {
	// Estado para controlar la acción en proceso
	const [processingAction, setProcessingAction] = useState<EmptySpaceAction | null>(null);

	// Verificar si se puede pegar desde el portapapeles interno
	const canPasteFromClipboard = canPaste || clipboardManager.canPaste();

	// Definir las acciones del menú en orden
	const menuActions: Array<{
		action: EmptySpaceAction;
		label: string;
		icon: React.ReactNode;
		disabled?: boolean;
		destructive?: boolean;
	}> = [
		{
			action: 'select-all',
			label: `Seleccionar todo (${totalItems})`,
			icon: <MousePointer className="mr-2 h-4 w-4" />,
			disabled: totalItems === 0,
		},
		{
			action: 'paste',
			label: 'Pegar',
			icon: <Copy className="mr-2 h-4 w-4" />,
			disabled: !canPasteFromClipboard,
		},
		{
			action: 'refresh',
			label: 'Actualizar',
			icon: <RefreshCw className="mr-2 h-4 w-4" />,
		},
		{
			action: 'new-folder',
			label: 'Nueva carpeta',
			icon: <FolderPlus className="mr-2 h-4 w-4" />,
		},
	];

	// Configurar navegación por teclado
	const { selectedIndex, getItemProps } = useContextMenuNavigation(menuActions.length, {
		enabled: true,
		onExecute: (index) => {
			const menuAction = menuActions[index];
			if (menuAction && !menuAction.disabled) {
				handleAction(menuAction.action);
			}
		},
		onClose: () => {
			// El menú se cerrará automáticamente cuando se ejecute una acción
		},
	});

	// Manejador de acciones con indicador de carga
	const handleAction = async (action: EmptySpaceAction, data?: Record<string, unknown>) => {
		setProcessingAction(action);
		try {
			await onAction(action, data);
		} finally {
			setProcessingAction(null);
		}
	};

	// Estilo para los elementos del menú
	const menuItemStyle =
		'flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';

	// Renderizar menú contextual con navegación por teclado
	return (
		<div className="w-64 py-1">
			{/* Acciones principales */}
			{menuActions.map((menuAction, index) => (
				<button
					className={`${menuItemStyle} ${
						menuAction.destructive ? 'text-red-600 hover:text-red-600' : ''
					} ${selectedIndex === index ? 'bg-accent text-accent-foreground' : ''}`}
					disabled={processingAction === menuAction.action || menuAction.disabled}
					key={menuAction.action}
					type="button"
					{...getItemProps(index)}
					onClick={() => handleAction(menuAction.action)}
				>
					{processingAction === menuAction.action ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : menuAction.icon}
					<span>{menuAction.label}</span>
				</button>
			))}

			{currentPath && (
				<>
					<Separator className="my-1" />
					<div className="px-2 py-1 text-muted-foreground text-xs">
						<span className="truncate" title={currentPath}>
							{currentPath}
						</span>
					</div>
				</>
			)}
		</div>
	);
});

import { Album, BookImage, Clock, Copy, Download, Loader2, Move3D, Tag, Trash, Users } from 'lucide-react';
import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useContextMenuNavigation } from '@/lib/keyboard';
import { toastService } from '@/lib/ui/toast';
import { useAlbumStore } from '@/store/entities/album';
import { useCollectionStore } from '@/store/entities/collection';
import { useTagStore } from '@/store/entities/tag';
import type { TagWithStats } from '@/types/entities/tag';
import { EnhancedSubmenu } from './components/enhanced-submenu';
import type { MultiSelectionAction, MultiSelectionContextMenuProps } from './types';

/**
 * Información de operación para mostrar tiempo estimado
 */
interface OperationInfo {
	action: string;
	estimatedTime: string;
	description: string;
}

/**
 * Calcula el tiempo estimado para una operación basado en el número de elementos
 */
const calculateEstimatedTime = (itemCount: number, action: MultiSelectionAction): string => {
	// Tiempos base en segundos por elemento
	const timePerItem: Record<string, number> = {
		'delete-multiple': 0.5,
		'move-multiple': 1.0,
		'copy-multiple': 1.5,
		'download-multiple': 2.0,
		'add-to-collection': 0.2,
		'add-to-album': 0.2,
		'add-tag': 0.1,
	};

	const baseTime = timePerItem[action] || 1.0;
	const totalSeconds = Math.ceil(itemCount * baseTime);

	if (totalSeconds < 60) {
		return `~${totalSeconds}s`;
	}
	if (totalSeconds < 3600) {
		const minutes = Math.ceil(totalSeconds / 60);
		return `~${minutes}m`;
	}
	const hours = Math.ceil(totalSeconds / 3600);
	return `~${hours}h`;
};

/**
 * Obtiene información de la operación
 */
const getOperationInfo = (action: MultiSelectionAction, itemCount: number): OperationInfo => {
	const estimatedTime = calculateEstimatedTime(itemCount, action);

	const operationInfoMap: Record<MultiSelectionAction, Omit<OperationInfo, 'estimatedTime'>> = {
		'delete-multiple': {
			action: 'Eliminar múltiples',
			description: `Se eliminarán ${itemCount} elemento${itemCount > 1 ? 's' : ''} permanentemente`,
		},
		'move-multiple': {
			action: 'Mover múltiples',
			description: `Se moverán ${itemCount} elemento${itemCount > 1 ? 's' : ''} a la ubicación seleccionada`,
		},
		'copy-multiple': {
			action: 'Copiar múltiples',
			description: `Se copiarán ${itemCount} elemento${itemCount > 1 ? 's' : ''} al portapapeles`,
		},
		'download-multiple': {
			action: 'Descargar múltiples',
			description: `Se descargarán ${itemCount} elemento${itemCount > 1 ? 's' : ''} como archivo ZIP`,
		},
		'add-to-collection': {
			action: 'Agregar a colección',
			description: `Se agregarán ${itemCount} elemento${itemCount > 1 ? 's' : ''} a la colección seleccionada`,
		},
		'add-to-album': {
			action: 'Agregar a álbum',
			description: `Se agregarán ${itemCount} elemento${itemCount > 1 ? 's' : ''} al álbum seleccionado`,
		},
		'add-tag': {
			action: 'Agregar etiqueta',
			description: `Se agregará la etiqueta a ${itemCount} elemento${itemCount > 1 ? 's' : ''}`,
		},
	};

	return {
		...operationInfoMap[action],
		estimatedTime,
	};
};

/**
 * Menú contextual para selección múltiple de archivos
 */
export const MultiSelectionContextMenu = memo<MultiSelectionContextMenuProps>(function MultiSelectionContextMenuInner({
	selectedItems,
	onAction,
	position: _position,
}) {
	const [processingAction, setProcessingAction] = useState<MultiSelectionAction | null>(null);
	const [confirmationDialog, setConfirmationDialog] = useState<{
		isOpen: boolean;
		action: MultiSelectionAction;
		operationInfo: OperationInfo;
	}>({
		isOpen: false,
		action: 'delete-multiple',
		operationInfo: { action: '', estimatedTime: '', description: '' },
	});

	// Obtener datos de los stores
	const collections = useCollectionStore((state) => Object.values(state.collections));
	const tags = useTagStore((state) => state.getTags());
	const albums = useAlbumStore((state) => Object.values(state.albums));

	const itemCount = selectedItems.length;

	// Definir las acciones del menú en orden
	const menuActions: Array<{
		action: MultiSelectionAction;
		label: string;
		icon: React.ReactNode;
		destructive?: boolean;
		requiresConfirmation?: boolean;
	}> = [
		{
			action: 'copy-multiple',
			label: `Copiar ${itemCount} elemento${itemCount > 1 ? 's' : ''}`,
			icon: <Copy className="mr-2 h-4 w-4" />,
		},
		{
			action: 'move-multiple',
			label: `Mover ${itemCount} elemento${itemCount > 1 ? 's' : ''}`,
			icon: <Move3D className="mr-2 h-4 w-4" />,
		},
		{
			action: 'download-multiple',
			label: `Descargar ${itemCount} elemento${itemCount > 1 ? 's' : ''}`,
			icon: <Download className="mr-2 h-4 w-4" />,
		},
		{
			action: 'delete-multiple',
			label: `Eliminar ${itemCount} elemento${itemCount > 1 ? 's' : ''}`,
			icon: <Trash className="mr-2 h-4 w-4" />,
			destructive: true,
			requiresConfirmation: true,
		},
	];

	// Configurar navegación por teclado
	const { selectedIndex, getItemProps } = useContextMenuNavigation(menuActions.length, {
		enabled: true,
		onExecute: (index) => {
			const menuAction = menuActions[index];
			if (menuAction) {
				handleAction(menuAction.action);
			}
		},
		onClose: () => {
			// El menú se cerrará automáticamente cuando se ejecute una acción
		},
	});

	// Manejador de acciones con confirmación para operaciones destructivas
	const handleAction = async (action: MultiSelectionAction, data?: Record<string, unknown>) => {
		const menuAction = menuActions.find((a) => a.action === action);

		if (menuAction?.requiresConfirmation) {
			const operationInfo = getOperationInfo(action, itemCount);
			setConfirmationDialog({
				isOpen: true,
				action,
				operationInfo,
			});
			return;
		}

		await executeAction(action, data);
	};

	// Ejecutar la acción después de confirmación
	const executeAction = async (action: MultiSelectionAction, data?: Record<string, unknown>) => {
		setProcessingAction(action);
		try {
			await onAction(action, selectedItems, data);

			// Mostrar toast de éxito con información de la operación
			const operationInfo = getOperationInfo(action, itemCount);
			toastService.success(`${operationInfo.action} completado - ${operationInfo.estimatedTime}`);
		} catch (error) {
			const operationInfo = getOperationInfo(action, itemCount);
			toastService.error(
				`Error en ${operationInfo.action}: ${error instanceof Error ? error.message : 'Error desconocido'}`
			);
		} finally {
			setProcessingAction(null);
			setConfirmationDialog((prev) => ({ ...prev, isOpen: false }));
		}
	};

	// Confirmar acción destructiva
	const handleConfirmAction = async () => {
		await executeAction(confirmationDialog.action);
	};

	// Cancelar confirmación
	const handleCancelConfirmation = () => {
		setConfirmationDialog((prev) => ({ ...prev, isOpen: false }));
	};

	// Estilo para los elementos del menú
	const menuItemStyle =
		'flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer';

	return (
		<>
			<div className="w-72 py-1">
				{/* Encabezado con información de selección */}
				<div className="border-border border-b px-2 py-2">
					<div className="flex items-center gap-2 font-medium text-sm">
						<Users className="h-4 w-4" />
						<span>
							{itemCount} elemento{itemCount > 1 ? 's' : ''} seleccionado{itemCount > 1 ? 's' : ''}
						</span>
					</div>
					<div className="mt-1 text-muted-foreground text-xs">
						Tamaño total:{' '}
						{selectedItems.reduce((acc, item) => acc + (('size' in item ? item.size : 0) || 0), 0).toLocaleString()}{' '}
						bytes
					</div>
				</div>

				{/* Acciones principales con navegación por teclado */}
				{menuActions.map((menuAction, index) => (
					<button
						className={`${menuItemStyle} ${
							menuAction.destructive ? 'text-red-600 hover:text-red-600' : ''
						} ${selectedIndex === index ? 'bg-accent text-accent-foreground' : ''}`}
						disabled={processingAction === menuAction.action}
						key={menuAction.action}
						type="button"
						{...getItemProps(index)}
					>
						{processingAction === menuAction.action ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							menuAction.icon
						)}
						<div className="flex-1">
							<div>{menuAction.label}</div>
							<div className="text-muted-foreground text-xs">
								<Clock className="mr-1 inline h-3 w-3" />
								{calculateEstimatedTime(itemCount, menuAction.action)}
							</div>
						</div>
					</button>
				))}

				<Separator className="my-1" />

				{/* Submenús para agregar a entidades */}
				<EnhancedSubmenu
					actionType="add-to-collection"
					createActionType="collection-create"
					file={selectedItems[0]}
					icon={<BookImage className="h-4 w-4" />}
					isLoading={false} // Usar el primer elemento como referencia
					items={collections.map((c) => ({
						...c,
						emoji: c.emoji ?? undefined,
						color: c.color || undefined,
						isFavorite: Boolean(c.isFavorite),
						isRecent: Boolean(c.isRecent),
					}))}
					onAction={async (action, _file, data) => {
						await onAction(action as MultiSelectionAction, selectedItems, data);
					}}
					onOpenChange={() => {
						// noop: el componente superior controla el estado de apertura
					}}
					title="Colecciones"
				/>

				<EnhancedSubmenu
					actionType="add-tag"
					createActionType="tag-create"
					dataIdField="tagId"
					dataNameField="tagName"
					file={selectedItems[0]} // Usar el primer elemento como referencia
					icon={<Tag className="h-4 w-4" />}
					isLoading={false}
					items={tags.map((t: TagWithStats) => ({
						id: t.id,
						name: t.name,
						emoji: t.emoji || undefined,
						isFavorite: false,
						isRecent: false,
					}))}
					onAction={async (action, _file, data) => {
						await onAction(action as MultiSelectionAction, selectedItems, data);
					}}
					onOpenChange={() => {
						// noop: el componente superior controla el estado de apertura
					}}
					title="Etiquetas"
				/>

				<EnhancedSubmenu
					actionType="add-to-album"
					createActionType="album-create"
					dataIdField="albumId"
					dataNameField="albumName"
					file={selectedItems[0]} // Usar el primer elemento como referencia
					icon={<Album className="h-4 w-4" />}
					isLoading={false}
					items={albums.map((a) => ({
						...a,
						emoji: a.emoji ?? undefined,
						color: a.color || undefined,
						isFavorite: Boolean(a.isFavorite),
						isRecent: Boolean(a.isRecent),
					}))}
					onAction={async (action, _file, data) => {
						await onAction(action as MultiSelectionAction, selectedItems, data);
					}}
					onOpenChange={() => {
						// noop: el componente superior controla el estado de apertura
					}}
					title="Álbumes"
				/>
			</div>

			{/* Diálogo de confirmación para operaciones destructivas */}
			<Dialog onOpenChange={handleCancelConfirmation} open={confirmationDialog.isOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							{confirmationDialog.action === 'delete-multiple' && <Trash className="h-5 w-5 text-red-600" />}
							Confirmar {confirmationDialog.operationInfo.action}
						</DialogTitle>
						<DialogDescription>{confirmationDialog.operationInfo.description}</DialogDescription>
					</DialogHeader>

					<div className="py-4">
						<div className="flex items-center gap-2 text-muted-foreground text-sm">
							<Clock className="h-4 w-4" />
							<span>Tiempo estimado: {confirmationDialog.operationInfo.estimatedTime}</span>
						</div>

						{confirmationDialog.action === 'delete-multiple' && (
							<div className="mt-3 rounded-md bg-red-50 p-3 dark:bg-red-950/20">
								<p className="text-red-800 text-sm dark:text-red-200">
									⚠️ Esta acción no se puede deshacer. Los elementos se eliminarán permanentemente.
								</p>
							</div>
						)}
					</div>

					<DialogFooter>
						<Button onClick={handleCancelConfirmation} variant="outline">
							Cancelar
						</Button>
						<Button
							disabled={processingAction !== null}
							onClick={handleConfirmAction}
							variant={confirmationDialog.action === 'delete-multiple' ? 'destructive' : 'primary'}
						>
							{processingAction !== null ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Procesando...
								</>
							) : (
								`Confirmar ${confirmationDialog.operationInfo.action}`
							)}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</>
	);
});

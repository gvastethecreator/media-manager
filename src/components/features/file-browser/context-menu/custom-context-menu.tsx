/**
 * @file Menú contextual personalizado tipo popover que aparece en click derecho
 * @module components/features/file-browser/context-menu/custom-context-menu
 */

import {
  ChevronRight,
  Copy,
  Download,
  FolderPlus,
  MoreHorizontal,
  Move3D,
  Scissors,
  Settings,
  Share2,
  Star,
  Tags,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import type { AnyEntityWithStats } from '@/types/migration';
import { RedoButton, UndoButton } from '../undo-redo/UndoRedoButton';

interface CustomContextMenuProps {
	/** Si el menú está visible */
	isOpen: boolean;
	/** Función para cerrar el menú */
	onClose: () => void;
	/** Posición del cursor donde apareció el click derecho */
	position: { x: number; y: number };
	/** Items seleccionados */
	selectedItems: AnyEntityWithStats[];
	/** Función para ejecutar acciones */
	onAction: (action: string, data?: any) => void;
}

interface MenuItemProps {
	icon: React.ReactNode;
	label: string;
	onClick: () => void;
	shortcut?: string;
	variant?: 'default' | 'destructive';
	disabled?: boolean;
	hasSubmenu?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
	icon,
	label,
	onClick,
	shortcut,
	variant = 'default',
	disabled = false,
	hasSubmenu = false,
}) => {
	return (
		<Button
			variant="ghost"
			className={cn(
				'w-full justify-start h-8 px-3 py-1.5 text-sm font-normal',
				'hover:bg-accent hover:text-accent-foreground',
				variant === 'destructive' && 'text-destructive hover:bg-destructive/10 hover:text-destructive',
				disabled && 'opacity-50 cursor-not-allowed'
			)}
			onClick={onClick}
			disabled={disabled}
		>
			<div className="flex items-center justify-between w-full">
				<div className="flex items-center gap-2">
					{icon}
					<span>{label}</span>
				</div>
				<div className="flex items-center gap-1">
					{shortcut && <span className="text-xs text-muted-foreground">{shortcut}</span>}
					{hasSubmenu && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
				</div>
			</div>
		</Button>
	);
};

export const CustomContextMenu: React.FC<CustomContextMenuProps> = ({
	isOpen,
	onClose,
	position,
	selectedItems,
	onAction,
}) => {
	const [menuPosition, setMenuPosition] = useState(position);

	// Actualizar posición cuando cambie
	useEffect(() => {
		if (isOpen) {
			// Ajustar posición para que el menú no se salga de la pantalla
			const windowWidth = window.innerWidth;
			const windowHeight = window.innerHeight;
			const menuWidth = 280; // Ancho estimado del menú
			const menuHeight = 400; // Alto estimado del menú

			let x = position.x;
			let y = position.y;

			// Ajustar horizontalmente
			if (x + menuWidth > windowWidth) {
				x = windowWidth - menuWidth - 10;
			}

			// Ajustar verticalmente
			if (y + menuHeight > windowHeight) {
				y = windowHeight - menuHeight - 10;
			}

			// Asegurar que no sea negativo
			x = Math.max(10, x);
			y = Math.max(10, y);

			setMenuPosition({ x, y });
		}
	}, [isOpen, position]);

	const selectedCount = selectedItems.length;
	const isMultiSelection = selectedCount > 1;

	const handleAction = (action: string, data?: any) => {
		onAction(action, data);
		onClose();
	};

	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === e.currentTarget) {
			onClose();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			onClose();
		}
	};

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: 0.15 }}
					className="fixed inset-0 z-[9999]"
					role="dialog"
					aria-modal="true"
					aria-label="Menú contextual"
					onClick={handleBackdropClick}
					onKeyDown={handleKeyDown}
					onContextMenu={(e) => e.preventDefault()}
					tabIndex={-1}
				>
					<motion.div
						initial={{ scale: 0.95, opacity: 0, y: -10 }}
						animate={{ scale: 1, opacity: 1, y: 0 }}
						exit={{ scale: 0.95, opacity: 0, y: -10 }}
						transition={{
							type: "spring",
							stiffness: 400,
							damping: 25,
							duration: 0.2
						}}
						className="absolute"
						style={{
							left: menuPosition.x,
							top: menuPosition.y,
						}}
						role="menu"
						onClick={(e) => e.stopPropagation()}
						onKeyDown={handleKeyDown}
					>
				<div className="bg-popover border border-border rounded-md shadow-lg min-w-[280px] max-w-[320px] py-2">
					{/* Encabezado con información de selección */}
					{selectedCount > 0 && (
						<>
							<div className="px-3 py-2 border-b border-border">
								<div className="flex items-center gap-2">
									<Badge variant="secondary" className="text-xs">
										{selectedCount} {selectedCount === 1 ? 'elemento' : 'elementos'}
									</Badge>
									{isMultiSelection && <span className="text-xs text-muted-foreground">seleccionados</span>}
								</div>
							</div>
						</>
					)}

					<div className="px-1 py-1">
						{/* Acciones de Undo/Redo */}
						<div className="flex items-center gap-1 px-2 py-1">
							<UndoButton variant="ghost" size="sm" className="h-7" />
							<RedoButton variant="ghost" size="sm" className="h-7" />
							<Button variant="ghost" size="sm" className="h-7" onClick={() => handleAction('configure')}>
								<Settings className="h-3.5 w-3.5" />
							</Button>
						</div>

						<Separator className="my-2" />

						{selectedCount > 0 ? (
							<>
								{/* Acciones principales para elementos seleccionados */}
								<MenuItem
									icon={<Copy className="h-4 w-4" />}
									label="Copiar"
									onClick={() => handleAction('copy')}
									shortcut="Ctrl+C"
								/>
								<MenuItem
									icon={<Scissors className="h-4 w-4" />}
									label="Cortar"
									onClick={() => handleAction('cut')}
									shortcut="Ctrl+X"
								/>
								<MenuItem
									icon={<Download className="h-4 w-4" />}
									label={isMultiSelection ? 'Descargar elementos' : 'Descargar'}
									onClick={() => handleAction('download')}
								/>

								<Separator className="my-2" />

								<MenuItem
									icon={<Star className="h-4 w-4" />}
									label={isMultiSelection ? 'Marcar como favoritos' : 'Marcar como favorito'}
									onClick={() => handleAction('toggle-favorite')}
								/>
								<MenuItem
									icon={<Tags className="h-4 w-4" />}
									label="Gestionar etiquetas"
									onClick={() => handleAction('manage-tags')}
									hasSubmenu
								/>
								<MenuItem
									icon={<Move3D className="h-4 w-4" />}
									label={isMultiSelection ? 'Mover elementos' : 'Mover'}
									onClick={() => handleAction('move')}
									hasSubmenu
								/>
								<MenuItem
									icon={<FolderPlus className="h-4 w-4" />}
									label="Añadir a colección"
									onClick={() => handleAction('add-to-collection')}
									hasSubmenu
								/>

								<Separator className="my-2" />

								<MenuItem
									icon={<Share2 className="h-4 w-4" />}
									label="Compartir"
									onClick={() => handleAction('share')}
									hasSubmenu
								/>
								<MenuItem
									icon={<MoreHorizontal className="h-4 w-4" />}
									label="Más acciones"
									onClick={() => handleAction('more-actions')}
									hasSubmenu
								/>

								<Separator className="my-2" />

								<MenuItem
									icon={<Trash2 className="h-4 w-4" />}
									label={isMultiSelection ? 'Eliminar elementos' : 'Eliminar'}
									onClick={() => handleAction('delete')}
									variant="destructive"
									shortcut="Delete"
								/>
							</>
						) : (
							<>
								{/* Acciones para espacio vacío */}
								<MenuItem
									icon={<FolderPlus className="h-4 w-4" />}
									label="Nueva carpeta"
									onClick={() => handleAction('new-folder')}
								/>
								<MenuItem
									icon={<Download className="h-4 w-4" />}
									label="Subir archivos"
									onClick={() => handleAction('upload-files')}
								/>

								<Separator className="my-2" />

								<MenuItem
									icon={<Copy className="h-4 w-4" />}
									label="Pegar"
									onClick={() => handleAction('paste')}
									shortcut="Ctrl+V"
									disabled={true} // TODO: Verificar si hay elementos en portapapeles
								/>

								<Separator className="my-2" />

								<MenuItem
									icon={<Settings className="h-4 w-4" />}
									label="Configuración de vista"
									onClick={() => handleAction('view-settings')}
								/>
							</>
						)}
					</div>
				</div>
			</motion.div>
		</motion.div>
			)}
		</AnimatePresence>
	);
};

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
			className={cn(
				'h-8 w-full justify-start px-3 py-1.5 font-normal text-sm',
				'hover:bg-accent hover:text-accent-foreground',
				variant === 'destructive' && 'text-destructive hover:bg-destructive/10 hover:text-destructive',
				disabled && 'cursor-not-allowed opacity-50'
			)}
			disabled={disabled}
			onClick={onClick}
			variant="ghost"
		>
			<div className="flex w-full items-center justify-between">
				<div className="flex items-center gap-2">
					{icon}
					<span>{label}</span>
				</div>
				<div className="flex items-center gap-1">
					{shortcut && <span className="text-muted-foreground text-xs">{shortcut}</span>}
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
					animate={{ opacity: 1 }}
					aria-label="Menú contextual"
					aria-modal="true"
					className="fixed inset-0 z-[9999]"
					exit={{ opacity: 0 }}
					initial={{ opacity: 0 }}
					onClick={handleBackdropClick}
					onContextMenu={(e) => e.preventDefault()}
					onKeyDown={handleKeyDown}
					role="dialog"
					tabIndex={-1}
					transition={{ duration: 0.15 }}
				>
					<motion.div
						animate={{ scale: 1, opacity: 1, y: 0 }}
						className="absolute"
						exit={{ scale: 0.95, opacity: 0, y: -10 }}
						initial={{ scale: 0.95, opacity: 0, y: -10 }}
						onClick={(e) => e.stopPropagation()}
						onKeyDown={handleKeyDown}
						role="menu"
						style={{
							left: menuPosition.x,
							top: menuPosition.y,
						}}
						transition={{
							type: 'spring',
							stiffness: 400,
							damping: 25,
							duration: 0.2,
						}}
					>
						<div className="min-w-[280px] max-w-[320px] rounded-md border border-border bg-popover py-2 shadow-lg">
							{/* Encabezado con información de selección */}
							{selectedCount > 0 && (
								<div className="border-border border-b px-3 py-2">
									<div className="flex items-center gap-2">
										<Badge className="text-xs" variant="secondary">
											{selectedCount} {selectedCount === 1 ? 'elemento' : 'elementos'}
										</Badge>
										{isMultiSelection && <span className="text-muted-foreground text-xs">seleccionados</span>}
									</div>
								</div>
							)}

							<div className="px-1 py-1">
								{/* Configuración (Undo/Redo eliminado) */}
								<div className="flex items-center gap-1 px-2 py-1">
									<Button className="h-7" onClick={() => handleAction('configure')} size="sm" variant="ghost">
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
											hasSubmenu
											icon={<Tags className="h-4 w-4" />}
											label="Gestionar etiquetas"
											onClick={() => handleAction('manage-tags')}
										/>
										<MenuItem
											hasSubmenu
											icon={<Move3D className="h-4 w-4" />}
											label={isMultiSelection ? 'Mover elementos' : 'Mover'}
											onClick={() => handleAction('move')}
										/>
										<MenuItem
											hasSubmenu
											icon={<FolderPlus className="h-4 w-4" />}
											label="Añadir a colección"
											onClick={() => handleAction('add-to-collection')}
										/>

										<Separator className="my-2" />

										<MenuItem
											hasSubmenu
											icon={<Share2 className="h-4 w-4" />}
											label="Compartir"
											onClick={() => handleAction('share')}
										/>
										<MenuItem
											hasSubmenu
											icon={<MoreHorizontal className="h-4 w-4" />}
											label="Más acciones"
											onClick={() => handleAction('more-actions')}
										/>

										<Separator className="my-2" />

										<MenuItem
											icon={<Trash2 className="h-4 w-4" />}
											label={isMultiSelection ? 'Eliminar elementos' : 'Eliminar'}
											onClick={() => handleAction('delete')}
											shortcut="Delete"
											variant="destructive"
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
											disabled={true}
											icon={<Copy className="h-4 w-4" />}
											label="Pegar"
											onClick={() => handleAction('paste')}
											shortcut="Ctrl+V" // TODO: Verificar si hay elementos en portapapeles
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

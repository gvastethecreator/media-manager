import { Copy, Download, Eye, FolderOpen, Pencil, Star, Tag, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ContextMenuAction, CustomContextMenuProps } from './types';

interface MenuItemProps {
	icon: React.ReactNode;
	label: string;
	action: ContextMenuAction;
	onSelect: (action: ContextMenuAction) => void;
}

function MenuItem({ icon, label, action, onSelect }: MenuItemProps) {
	return (
		<button
			className={cn(
				'flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm hover:bg-accent',
				'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
			)}
			onClick={() => onSelect(action)}
			type="button"
		>
			<span className="h-4 w-4">{icon}</span>
			<span>{label}</span>
		</button>
	);
}

export function CustomContextMenu<T>({
	isOpen,
	position,
	selectedItems,
	onAction,
	onClose,
}: CustomContextMenuProps<T>) {
	if (!isOpen) return null;
	if (!position) return null;

	const handleSelect = (action: ContextMenuAction) => {
		onAction(action, selectedItems);
		onClose();
	};

	return (
		<div
			className="fixed z-50 min-w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
			role="menu"
			style={{ left: position.x, top: position.y }}
		>
			<div className="grid grid-cols-1">
				<MenuItem action="open" icon={<FolderOpen className="h-4 w-4" />} label="Abrir" onSelect={handleSelect} />
				<MenuItem action="preview" icon={<Eye className="h-4 w-4" />} label="Vista previa" onSelect={handleSelect} />
				<MenuItem action="copy" icon={<Copy className="h-4 w-4" />} label="Copiar" onSelect={handleSelect} />
				<MenuItem action="rename" icon={<Pencil className="h-4 w-4" />} label="Renombrar" onSelect={handleSelect} />
				<MenuItem action="delete" icon={<Trash2 className="h-4 w-4" />} label="Eliminar" onSelect={handleSelect} />
				<MenuItem action="download" icon={<Download className="h-4 w-4" />} label="Descargar" onSelect={handleSelect} />
				<MenuItem
					action="add-tag"
					icon={<Tag className="h-4 w-4" />}
					label="Agregar etiqueta"
					onSelect={handleSelect}
				/>
				<MenuItem
					action="favorite-toggle"
					icon={<Star className="h-4 w-4" />}
					label="Favorito"
					onSelect={handleSelect}
				/>
			</div>
		</div>
	);
}

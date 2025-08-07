import { Loader2, Plus } from 'lucide-react';
import React, { memo, useEffect, useMemo, useState } from 'react';
import {
	ContextMenuGroup,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { FileItem } from '@/types/file-browser/file-item';
import type { ContextMenuAction } from '../types';
import { SubmenuSearch } from './submenu-search';

interface EnhancedSubmenuItem {
	id: string;
	name: string;
	emoji?: string | null;
	color?: string;
	isFavorite?: boolean;
	isRecent?: boolean;
}

interface EnhancedSubmenuProps {
	title: string;
	icon: React.ReactNode;
	items: EnhancedSubmenuItem[];
	isLoading: boolean;
	file: FileItem;
	onAction: (action: ContextMenuAction, file: FileItem, data?: Record<string, unknown>) => void;
	actionType: ContextMenuAction;
	createActionType: ContextMenuAction;
	onOpenChange?: (isOpen: boolean) => void;
	dataIdField?: string;
	dataNameField?: string;
}

/**
 * Componente de submenú mejorado con búsqueda y secciones para favoritos y recientes
 */
export const EnhancedSubmenu = memo<EnhancedSubmenuProps>(function EnhancedSubmenu({
	title,
	icon,
	items,
	isLoading,
	file,
	onAction,
	actionType,
	createActionType,
	onOpenChange,
	dataIdField = 'id',
	dataNameField = 'name',
}) {
	// Estados
	const [isOpen, setIsOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState('');

	// Notificar al padre cuando el estado de apertura cambia
	useEffect(() => {
		onOpenChange?.(isOpen);
	}, [isOpen, onOpenChange]);

	// Filtrar y agrupar elementos
	const { favorites, recents, others, filteredItems } = useMemo(() => {
		// Filtrar por término de búsqueda
		const filtered = searchTerm
			? items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
			: items;

		// Agrupar por categorías
		const favorites = filtered.filter((item) => item.isFavorite);
		const recents = filtered.filter((item) => !item.isFavorite && item.isRecent);
		const others = filtered.filter((item) => !(item.isFavorite || item.isRecent));

		return {
			favorites,
			recents,
			others,
			filteredItems: filtered,
		};
	}, [items, searchTerm]);

	// Manejador para seleccionar un elemento
	const handleSelect = (item: EnhancedSubmenuItem) => {
		const data = {
			[dataIdField]: item.id,
			[dataNameField]: item.name,
		};
		onAction(actionType, file, data);
	};

	// Manejador para crear un nuevo elemento
	const handleCreate = () => {
		// Si hay un término de búsqueda, usarlo como nombre para el nuevo elemento
		const data = searchTerm ? { name: searchTerm } : undefined;
		onAction(createActionType, file, data);
	};

	return (
		<ContextMenuSub
			onOpenChange={(open) => {
				setIsOpen(open);
				if (!open) {
					// Limpiar búsqueda al cerrar
					setSearchTerm('');
				}
			}}
		>
			<ContextMenuSubTrigger className="flex items-center">
				{icon}
				<span className="ml-2">{title}</span>
			</ContextMenuSubTrigger>

			<ContextMenuSubContent className="w-64 p-2">
				{/* Barra de búsqueda */}
				<SubmenuSearch className="mb-2" onSearchChange={setSearchTerm} searchTerm={searchTerm} />

				{isLoading ? (
					<div className="flex items-center justify-center py-4">
						<Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
					</div>
				) : (
					<ScrollArea className="h-[calc(100vh-200px)] max-h-[300px] pr-3">
						{/* Favoritos */}
						{favorites.length > 0 && (
							<>
								<ContextMenuGroup>
									<div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">Favoritos</div>
									{favorites.map((item) => (
										<ContextMenuItem
											className="flex items-center gap-2"
											key={item.id}
											onClick={() => handleSelect(item)}
										>
											{item.emoji && <span>{item.emoji}</span>}
											<span className={cn('flex-1 truncate', item.color && `text-[${item.color}]`)}>{item.name}</span>
										</ContextMenuItem>
									))}
								</ContextMenuGroup>
								<ContextMenuSeparator />
							</>
						)}

						{/* Recientes */}
						{recents.length > 0 && (
							<>
								<ContextMenuGroup>
									<div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">Recientes</div>
									{recents.map((item) => (
										<ContextMenuItem
											className="flex items-center gap-2"
											key={item.id}
											onClick={() => handleSelect(item)}
										>
											{item.emoji && <span>{item.emoji}</span>}
											<span className={cn('flex-1 truncate', item.color && `text-[${item.color}]`)}>{item.name}</span>
										</ContextMenuItem>
									))}
								</ContextMenuGroup>
								<ContextMenuSeparator />
							</>
						)}

						{/* Otros */}
						{others.length > 0 ? (
							<ContextMenuGroup>
								{!(favorites.length || recents.length) && (
									<div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">{title}</div>
								)}
								{others.map((item) => (
									<ContextMenuItem className="flex items-center gap-2" key={item.id} onClick={() => handleSelect(item)}>
										{item.emoji && <span>{item.emoji}</span>}
										<span className={cn('flex-1 truncate', item.color && `text-[${item.color}]`)}>{item.name}</span>
									</ContextMenuItem>
								))}
							</ContextMenuGroup>
						) : (
							!(favorites.length || recents.length) && (
								<div className="px-2 py-4 text-center text-muted-foreground text-sm">No se encontraron resultados</div>
							)
						)}

						{/* Opción de crear nuevo */}
						<ContextMenuSeparator />
						<ContextMenuItem className="flex items-center gap-2 text-primary" onClick={handleCreate}>
							<Plus className="h-4 w-4" />
							<span>{searchTerm ? `Crear "${searchTerm}"` : `Crear ${title.toLowerCase()}`}</span>
						</ContextMenuItem>
					</ScrollArea>
				)}
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
});

'use client';

import {
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import type { SubMenuProps } from '../types';

// Tipo para entidades con id
interface EntityWithId {
	id: string;
	[key: string]: unknown;
}

export function EntitySubMenu<T>({
	title,
	icon,
	entityName,
	entities,
	isLoading,
	onSelectAction,
	onCreateAction,
	renderItemAction,
}: SubMenuProps<T>) {
	// Memoizar las funciones de callback para evitar recreaciones en cada renderizado
	const handleCreate = useCallback(() => {
		onCreateAction();
	}, [onCreateAction]);

	// Memoizar los elementos renderizados
	const renderedItems = useMemo(() => {
		if (!entities || entities.length === 0) {
			return (
				<ContextMenuItem disabled>
					<span className="text-muted-foreground">No hay {entityName}s disponibles</span>
				</ContextMenuItem>
			);
		}

		return entities.map((entity, index) => {
			// Mejorar la extracción de ID para evitar errores de tipado
			let itemKey = `entity-${index}`;

			if (entity && typeof entity === 'object') {
				// Verificar si la entidad tiene un id y es string o número
				if ('id' in entity &&
					(typeof (entity as EntityWithId).id === 'string' ||
						typeof (entity as EntityWithId).id === 'number')) {
					itemKey = `entity-${String((entity as EntityWithId).id)}`;
				}
			}

			const handleClick = () => onSelectAction(entity);

			return (
				<ContextMenuItem key={itemKey} onClick={handleClick}>
					{renderItemAction(entity)}
				</ContextMenuItem>
			);
		});
	}, [entities, entityName, onSelectAction, renderItemAction]);

	return (
		<ContextMenuSub>
			<ContextMenuSubTrigger>
				{icon}
				{title}
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="w-56">
				{isLoading ? (
					<div className="flex justify-center items-center py-2">
						<LoadingSpinner size={16} />
						<span className="ml-2 text-sm">Cargando {entityName}...</span>
					</div>
				) : (
					<>
						<ContextMenuItem onClick={handleCreate} className="text-primary">
							<Plus className="mr-2 h-4 w-4" />
							<span>Nuevo {entityName}</span>
						</ContextMenuItem>

						<ContextMenuSeparator />

						{entities && entities.length > 0 ? (
							<ScrollArea className={entities.length > 10 ? 'h-[300px]' : ''}>
								{renderedItems}
							</ScrollArea>
						) : (
							<ContextMenuItem disabled>
								<span className="text-muted-foreground">No hay {entityName}s disponibles</span>
							</ContextMenuItem>
						)}
					</>
				)}
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
}

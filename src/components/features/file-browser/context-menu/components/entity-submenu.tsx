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
	onSelect,
	onCreate,
	renderItem,
}: SubMenuProps<T>) {
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
						<ContextMenuItem onClick={onCreate} className="text-primary">
							<Plus className="mr-2 h-4 w-4" />
							<span>Nuevo {entityName}</span>
						</ContextMenuItem>

						<ContextMenuSeparator />

						{entities && entities.length > 0 ? (
							<ScrollArea className={entities.length > 10 ? 'h-[300px]' : ''}>
								{entities.map((entity, index) => (
									<ContextMenuItem
										key={`entity-${
											entity && typeof entity === 'object' && 'id' in entity ? (entity as EntityWithId).id : index
										}`}
										onClick={() => onSelect(entity)}
									>
										{renderItem(entity)}
									</ContextMenuItem>
								))}
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

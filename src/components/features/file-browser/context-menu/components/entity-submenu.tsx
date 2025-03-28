'use client';

import {
	ContextMenuItem,
	ContextMenuPortal,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus } from 'lucide-react';
import { memo, useCallback, useMemo } from 'react';
import type { SubMenuProps } from '../types';

// Componentes memoizados para reducir renderizaciones
const MemoizedContextMenuItem = memo(ContextMenuItem);
const MemoizedContextMenuSeparator = memo(ContextMenuSeparator);
const MemoizedContextMenuSub = memo(ContextMenuSub);
const MemoizedContextMenuSubContent = memo(ContextMenuSubContent);
const MemoizedContextMenuSubTrigger = memo(ContextMenuSubTrigger);
const MemoizedContextMenuPortal = memo(ContextMenuPortal);
const MemoizedScrollArea = memo(ScrollArea);

// Interfaz para entidades con ID
interface EntityWithId {
	id: string;
	[key: string]: unknown;
}

// Componente de ítem individual memoizado
const EntityItem = memo(function EntityItem<T>({
	entity,
	onSelectAction,
	renderItemAction,
}: {
	entity: T;
	onSelectAction: (entity: T) => void;
	renderItemAction: (entity: T) => React.ReactNode;
}) {
	const handleClick = useCallback(() => {
		onSelectAction(entity);
	}, [entity, onSelectAction]);

	return <MemoizedContextMenuItem onClick={handleClick}>{renderItemAction(entity)}</MemoizedContextMenuItem>;
});

// Componente para estado de carga memoizado
const LoadingState = memo(function LoadingState({ entityName }: { entityName: string }) {
	return (
		<div className="flex justify-center items-center py-2">
			<LoadingSpinner size={16} />
			<span className="ml-2 text-sm">Cargando {entityName}...</span>
		</div>
	);
});

// Componente para estado vacío memoizado
const EmptyState = memo(function EmptyState({ entityName }: { entityName: string }) {
	return (
		<MemoizedContextMenuItem disabled>
			<span className="text-muted-foreground">No hay {entityName}s disponibles</span>
		</MemoizedContextMenuItem>
	);
});

// Componente para el botón de crear memoizado
const CreateButton = memo(function CreateButton({
	entityName,
	onClick,
}: {
	entityName: string;
	onClick: () => void;
}) {
	return (
		<MemoizedContextMenuItem onClick={onClick} className="text-primary">
			<Plus className="mr-2 h-4 w-4" />
			<span>Nuevo {entityName}</span>
		</MemoizedContextMenuItem>
	);
});

// Componente principal memoizado
export const EntitySubMenu = memo(function EntitySubMenu<T>({
	title,
	icon,
	entityName,
	entities,
	isLoading,
	onSelectAction,
	onCreateAction,
	renderItemAction,
}: SubMenuProps<T>) {
	// Callback para crear nueva entidad
	const handleCreate = useCallback(() => {
		onCreateAction();
	}, [onCreateAction]);

	// Memoizar la lista de entidades renderizadas
	const renderedItems = useMemo(() => {
		if (!entities || entities.length === 0) {
			return <EmptyState entityName={entityName} />;
		}

		return entities.map((entity, index) => {
			// Generar key única para cada entidad
			let itemKey = `entity-${index}`;

			if (entity && typeof entity === 'object') {
				if (
					'id' in entity &&
					(typeof (entity as EntityWithId).id === 'string' || typeof (entity as EntityWithId).id === 'number')
				) {
					itemKey = `entity-${String((entity as EntityWithId).id)}`;
				}
			}

			return (
				<EntityItem key={itemKey} entity={entity} onSelectAction={onSelectAction} renderItemAction={renderItemAction} />
			);
		});
	}, [entities, entityName, onSelectAction, renderItemAction]);

	// Determinar si necesitamos scroll basado en la cantidad de entidades
	const needsScrollArea = useMemo(() => entities && entities.length > 10, [entities]);

	// Determinar el contenido del submenu basado en el estado de carga
	const submenuContent = useMemo(() => {
		if (isLoading) {
			return <LoadingState entityName={entityName} />;
		}

		return (
			<>
				<CreateButton entityName={entityName} onClick={handleCreate} />
				<MemoizedContextMenuSeparator />

				{entities && entities.length > 0 ? (
					<MemoizedScrollArea className={needsScrollArea ? 'h-[300px]' : ''}>{renderedItems}</MemoizedScrollArea>
				) : (
					<EmptyState entityName={entityName} />
				)}
			</>
		);
	}, [isLoading, entityName, handleCreate, entities, needsScrollArea, renderedItems]);

	return (
		<MemoizedContextMenuSub>
			<MemoizedContextMenuSubTrigger>
				{icon}
				{title}
			</MemoizedContextMenuSubTrigger>
			<MemoizedContextMenuPortal>
				<MemoizedContextMenuSubContent className="w-56" style={{ zIndex: 9999 }}>
					{submenuContent}
				</MemoizedContextMenuSubContent>
			</MemoizedContextMenuPortal>
		</MemoizedContextMenuSub>
	);
});

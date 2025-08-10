import { Plus } from 'lucide-react';
import React, { memo, useCallback, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { clientLogger } from '@/lib/logger/client-logger';
import type { SubMenuProps } from '../types';

// Logger para debugging
const submenuLogger = clientLogger.withContext('EntitySubmenu');

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
const EntityItem = memo(function EntityItemInner<T>({
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
const LoadingState = memo(function LoadingStateInner({ entityName }: { entityName: string }) {
	return (
		<div className="flex items-center justify-center py-2">
			<LoadingSpinner size={16} />
			<span className="ml-2 text-sm">Cargando {entityName}...</span>
		</div>
	);
});

// Componente para estado vacío memoizado
const EmptyState = memo(function EmptyStateInner({ entityName }: { entityName: string }) {
	return (
		<MemoizedContextMenuItem disabled>
			<span className="text-muted-foreground">No hay {entityName}s disponibles</span>
		</MemoizedContextMenuItem>
	);
});

// Componente para estado de error memoizado
const ErrorState = memo(function ErrorStateInner({ entityName }: { entityName: string }) {
	return (
		<MemoizedContextMenuItem className="text-destructive" disabled>
			<span>Error al cargar {entityName}s</span>
		</MemoizedContextMenuItem>
	);
});

// Componente para el botón de crear memoizado
const CreateButton = memo(function CreateButtonInner({
	entityName,
	onClick,
}: {
	entityName: string;
	onClick: () => void;
}) {
	const navigate = useNavigate();

	// Mapeo de entidades a sus correspondientes tabs en SettingsView
	const entityToSettingsTabMap: Record<string, string> = {
		álbum: 'albums',
		etiqueta: 'tags',
		colección: 'collections',
		personaje: 'characters',
		lugar: 'places',
		'objeto del mundo': 'world-items',
		prompt: 'prompts',
		nota: 'notes',
		concepto: 'concepts',
	};

	const handleCreateClick = useCallback(() => {
		submenuLogger.info(`📝 Creando nuevo ${entityName}`);

		// Llamar al callback original primero
		onClick();

		// Redirigir a la vista de configuración
		navigate('/settings');

		// Obtener la pestaña correspondiente
		const settingsTab = entityToSettingsTabMap[entityName];

		if (settingsTab) {
			// Emitir un evento para que SettingsView pueda cambiar a la pestaña correspondiente
			// Para que esto funcione, SettingsView debe escuchar por este evento
			window.dispatchEvent(
				new CustomEvent('set-settings-tab', {
					detail: { tab: settingsTab },
				})
			);
		}
	}, [onClick, entityName, navigate]);

	return (
		<MemoizedContextMenuItem className="text-primary" onClick={handleCreateClick}>
			<Plus className="mr-2 h-4 w-4" />
			<span>Nuevo {entityName}</span>
		</MemoizedContextMenuItem>
	);
});

// Componente principal memoizado
export const EntitySubMenu = memo(function EntitySubMenuInner({
	title,
	icon,
	entityName,
	entities,
	isLoading,
	hasError,
	onSelectAction,
	onCreateAction,
	renderItemAction,
	onOpenChange,
}: SubMenuProps) {
	// Efecto para logging cuando cambian las entidades - reduce verbosidad
	useEffect(() => {
		// Solo log si los datos realmente cambiaron - evita log en cada renderizado
		if (entities?.length > 0) {
			submenuLogger.info(`📊 ${entityName}: ${entities.length} elementos disponibles`);
		}
	}, [entities, entityName]);

	// Callback para crear nueva entidad
	const handleCreate = useCallback(() => {
		submenuLogger.info(`➕ Crear ${entityName}`);
		onCreateAction();
	}, [onCreateAction, entityName]);

	// Callback para manejar el cambio de estado abierto/cerrado
	const handleOpenChange = useCallback(
		(open: boolean) => {
			submenuLogger.info(`${open ? '📂' : '📁'} Submenú ${entityName} ${open ? 'abierto' : 'cerrado'}`);
			if (onOpenChange) {
				onOpenChange(open);
			}
		},
		[onOpenChange, entityName]
	);

	// Callback para la selección de una entidad
	const handleSelectAction = useCallback(
		(entity: any) => {
			try {
				submenuLogger.info(`✅ Seleccionado ${entityName}:`, (entity as any).id || 'unknown');
				onSelectAction(entity);
			} catch (error) {
				submenuLogger.error(`❌ Error al seleccionar ${entityName}:`, error);
			}
		},
		[onSelectAction, entityName]
	);

	// Claves estables para entidades sin id
	const keyMapRef = React.useRef<WeakMap<object, string>>(new WeakMap());
	const keyCounterRef = React.useRef(0);

	// Memoizar la lista de entidades renderizadas
	const renderedItems = useMemo(() => {
		if (!entities || entities.length === 0) {
			return <EmptyState entityName={entityName} />;
		}

		return entities.map((entity) => {
			let itemKey: string | undefined;

			if (
				entity &&
				typeof entity === 'object' &&
				'id' in entity &&
				(typeof (entity as EntityWithId).id === 'string' || typeof (entity as EntityWithId).id === 'number')
			) {
				itemKey = `entity-${String((entity as EntityWithId).id)}`;
			} else if (entity && typeof entity === 'object') {
				const obj = entity as object;
				const existing = keyMapRef.current.get(obj);
				if (existing) {
					itemKey = existing;
				} else {
					keyCounterRef.current += 1;
					itemKey = `entity-auto-${keyCounterRef.current}`;
					keyMapRef.current.set(obj, itemKey);
				}
			} else {
				keyCounterRef.current += 1;
				itemKey = `entity-primitive-${keyCounterRef.current}`;
			}

			return (
				<EntityItem
					entity={entity as any}
					key={itemKey}
					onSelectAction={handleSelectAction}
					renderItemAction={renderItemAction}
				/>
			);
		});
	}, [entities, entityName, handleSelectAction, renderItemAction]);

	// Determinar si necesitamos scroll basado en la cantidad de entidades
	const needsScrollArea = useMemo(() => entities && entities.length > 10, [entities]);

	// Determinar el contenido del submenu basado en el estado de carga
	const submenuContent = useMemo(() => {
		if (isLoading) {
			return <LoadingState entityName={entityName} />;
		}

		// Si hay error pero tenemos entidades, mostramos lo que tenemos
		if (hasError && (!entities || entities.length === 0)) {
			return (
				<>
					<CreateButton entityName={entityName} onClick={handleCreate} />
					<MemoizedContextMenuSeparator />
					<ErrorState entityName={entityName} />
				</>
			);
		}

		// Incluso con error, si tenemos datos los mostramos
		return (
			<>
				<CreateButton entityName={entityName} onClick={handleCreate} />
				<MemoizedContextMenuSeparator />

				{entities && entities.length > 0 ? (
					needsScrollArea ? (
						<MemoizedScrollArea className="h-[300px]">
							{renderedItems}
							{hasError && <ErrorIndicator entityName={entityName} />}
						</MemoizedScrollArea>
					) : (
						<>
							{renderedItems}
							{hasError && <ErrorIndicator entityName={entityName} />}
						</>
					)
				) : (
					<EmptyState entityName={entityName} />
				)}
			</>
		);
	}, [isLoading, hasError, entityName, handleCreate, entities, needsScrollArea, renderedItems]);

	return (
		<MemoizedContextMenuSub onOpenChange={handleOpenChange}>
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

// Nuevo componente para mostrar un indicador de error sin bloquear el contenido
const ErrorIndicator = memo(function ErrorIndicatorInner({ entityName }: { entityName: string }) {
	return <div className="px-2 py-1 text-red-500 text-xs italic">Error al cargar todos los {entityName}</div>;
});

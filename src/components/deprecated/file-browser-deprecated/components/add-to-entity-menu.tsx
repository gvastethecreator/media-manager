import * as React from 'react';
import {
	ContextMenuItem,
	ContextMenuLabel,
	ContextMenuSeparator,
	ContextMenuSub,
	ContextMenuSubContent,
	ContextMenuSubTrigger,
} from '@/components/ui/context-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { getEntityTypeColor, getEntityTypeIcon } from '@/config/entity-type-configs';
import { useAddImageToAlbum } from '@/lib/api/albums';
import { useAddImageToCollection } from '@/lib/api/collections';
import { useAddTags } from '@/lib/api/files';
import { useEntityCatalogStore } from '@/store/entity-catalog-store';
import { EntityStatsType } from '@/types/file-browser/entity-stats';

type MinimalItem = { id: string; label: string };

function mapKeyToType(key: string): EntityStatsType | undefined {
	const map: Record<string, EntityStatsType> = {
		album: EntityStatsType.ALBUM,
		collection: EntityStatsType.COLLECTION,
		concept: EntityStatsType.CONCEPT,
		character: EntityStatsType.CHARACTER,
		group: EntityStatsType.GROUP,
		note: EntityStatsType.NOTE,
		place: EntityStatsType.PLACE,
		property: EntityStatsType.PROPERTY,
		prompt: EntityStatsType.PROMPT,
		tag: EntityStatsType.TAG,
		wildcard: EntityStatsType.WILDCARD,
		'world-item': EntityStatsType.WORLD_ITEM,
	};
	return map[key];
}

function EntityTypeSubmenu({
	typeKey,
	label,
	children,
}: {
	typeKey: string;
	label: string;
	children: React.ReactNode;
}) {
	const t = mapKeyToType(typeKey);
	const Icon = t ? getEntityTypeIcon(t) : undefined;
	const color = t ? getEntityTypeColor(t) : undefined;
	return (
		<ContextMenuSub>
			<ContextMenuSubTrigger data-entity-submenu-trigger={typeKey}>
				{Icon ? <Icon aria-hidden className="mr-2 h-4 w-4" style={{ color }} /> : null}
				<span>{label}</span>
			</ContextMenuSubTrigger>
			<ContextMenuSubContent className="max-h-64 overflow-y-auto p-0" data-entity-submenu-content={typeKey}>
				{/* Usamos ScrollArea por consistencia visual, pero el SubContent ya tiene overflow controlado */}
				<ScrollArea className="max-h-64">{children}</ScrollArea>
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
}

export interface AddToEntityMenuProps {
	// item: podríamos usar para mutaciones más adelante
	itemId?: string;
	entityType?: string;
}

/**
 * Submenú reutilizable “Agregar a …” que lista varias entidades con un máximo de 15 por tipo,
 * con soporte de mutaciones para álbumes, colecciones y tags.
 */
export function AddToEntityMenu(_props: AddToEntityMenuProps) {
	const { itemId, entityType } = _props;
	const { toast } = useToast();

	// Consumir datos precargados desde el store (sin disparar requests al abrir el menú)
	const albums = useEntityCatalogStore((s) => s.albums.items);
	const collections = useEntityCatalogStore((s) => s.collections.items);
	const concepts = useEntityCatalogStore((s) => s.concepts.items);
	const characters = useEntityCatalogStore((s) => s.characters.items);
	const groups = useEntityCatalogStore((s) => s.groups.items);
	const notes = useEntityCatalogStore((s) => s.notes.items);
	const places = useEntityCatalogStore((s) => s.places.items);
	const properties = useEntityCatalogStore((s) => s.properties.items);
	const prompts = useEntityCatalogStore((s) => s.prompts.items);
	const tags = useEntityCatalogStore((s) => s.tags.items);
	const wildcards = useEntityCatalogStore((s) => s.wildcards.items);
	const worldItems = useEntityCatalogStore((s) => s.worldItems.items);
	const loadingAny = useEntityCatalogStore(
		(s) =>
			s.albums.loading ||
			s.collections.loading ||
			s.concepts.loading ||
			s.characters.loading ||
			s.groups.loading ||
			s.notes.loading ||
			s.places.loading ||
			s.properties.loading ||
			s.prompts.loading ||
			s.tags.loading ||
			s.wildcards.loading ||
			s.worldItems.loading
	);

	// Mutations soportadas actualmente
	const addToAlbum = useAddImageToAlbum();
	const addToCollection = useAddImageToCollection();
	const addTags = useAddTags();

	// Ya no mapeamos de queries; viene listo del store

	// renderList sin manejo por tipo fue reemplazado por renderTypedList

	// Helper para construir items con manejador por tipo
	function renderTypedList(typeKey: string, state: { isLoading: boolean; isError: boolean; items: MinimalItem[] }) {
		if (loadingAny) return <ContextMenuItem disabled>Cargando…</ContextMenuItem>;
		if (state.items.length === 0) return <ContextMenuItem disabled>Sin resultados</ContextMenuItem>;

		const isImage = (entityType ?? 'image') === 'image';

		return (
			<>
				{state.items.map((it) => (
					<ContextMenuItem
						data-entity-option-id={it.id}
						key={it.id}
						onSelect={async () => {
							if (!itemId) {
								toast({ variant: 'destructive', title: 'Acción inválida', description: 'Falta el ID del archivo.' });
								return;
							}

							try {
								if (typeKey === 'album') {
									if (!isImage) throw new Error('Solo imágenes soportadas por ahora');
									await addToAlbum.mutateAsync({ albumId: it.id, imageId: itemId });
									toast({ title: 'Añadido al álbum', description: `Se agregó al álbum “${it.label}”.` });
									return;
								}
								if (typeKey === 'collection') {
									if (!isImage) throw new Error('Solo imágenes soportadas por ahora');
									await addToCollection.mutateAsync({ collectionId: it.id, imageId: itemId });
									toast({ title: 'Añadido a la colección', description: `Se agregó a “${it.label}”.` });
									return;
								}
								if (typeKey === 'tag') {
									await addTags.mutateAsync({ fileId: itemId, tags: [it.id] });
									toast({ title: 'Etiqueta añadida', description: `Se añadió “${it.label}”.` });
									return;
								}

								// Tipos aún no soportados
								toast({ description: 'Acción disponible próximamente.' });
							} catch (error: any) {
								toast({
									variant: 'destructive',
									title: 'No se pudo completar',
									description: error?.message || 'Error inesperado',
								});
							}
						}}
					>
						{renderIcon(typeKey)}
						<span>{it.label}</span>
					</ContextMenuItem>
				))}
			</>
		);
	}

	function renderIcon(typeKey: string) {
		const map: Record<string, EntityStatsType> = {
			album: EntityStatsType.ALBUM,
			collection: EntityStatsType.COLLECTION,
			concept: EntityStatsType.CONCEPT,
			character: EntityStatsType.CHARACTER,
			group: EntityStatsType.GROUP,
			note: EntityStatsType.NOTE,
			place: EntityStatsType.PLACE,
			property: EntityStatsType.PROPERTY,
			prompt: EntityStatsType.PROMPT,
			tag: EntityStatsType.TAG,
			wildcard: EntityStatsType.WILDCARD,
			'world-item': EntityStatsType.WORLD_ITEM,
		};
		const type = map[typeKey] ?? EntityStatsType.TAG;
		const Icon = getEntityTypeIcon(type);
		const color = getEntityTypeColor(type);
		return <Icon aria-hidden className="mr-2 h-4 w-4" style={{ color }} />;
	}

	return (
		<ContextMenuSub>
			<ContextMenuSubTrigger data-testid="add-to-entities-trigger">Agregar a …</ContextMenuSubTrigger>
			<ContextMenuSubContent className="p-1">
				<ContextMenuLabel inset>Elegir entidad</ContextMenuLabel>
				<EntityTypeSubmenu label="Álbumes" typeKey="album">
					{renderTypedList('album', { isLoading: false, isError: false, items: albums })}
				</EntityTypeSubmenu>
				<EntityTypeSubmenu label="Colecciones" typeKey="collection">
					{renderTypedList('collection', { isLoading: false, isError: false, items: collections })}
				</EntityTypeSubmenu>
				<EntityTypeSubmenu label="Conceptos" typeKey="concept">
					{renderTypedList('concept', { isLoading: false, isError: false, items: concepts })}
				</EntityTypeSubmenu>
				<EntityTypeSubmenu label="Personajes" typeKey="character">
					{renderTypedList('character', { isLoading: false, isError: false, items: characters })}
				</EntityTypeSubmenu>
				<EntityTypeSubmenu label="Grupos" typeKey="group">
					{renderTypedList('group', { isLoading: false, isError: false, items: groups })}
				</EntityTypeSubmenu>
				<EntityTypeSubmenu label="Notas" typeKey="note">
					{renderTypedList('note', { isLoading: false, isError: false, items: notes })}
				</EntityTypeSubmenu>
				<EntityTypeSubmenu label="Lugares" typeKey="place">
					{renderTypedList('place', { isLoading: false, isError: false, items: places })}
				</EntityTypeSubmenu>
				<EntityTypeSubmenu label="Propiedades" typeKey="property">
					{renderTypedList('property', { isLoading: false, isError: false, items: properties })}
				</EntityTypeSubmenu>
				<EntityTypeSubmenu label="Prompts" typeKey="prompt">
					{renderTypedList('prompt', { isLoading: false, isError: false, items: prompts })}
				</EntityTypeSubmenu>
				<EntityTypeSubmenu label="Tags" typeKey="tag">
					{renderTypedList('tag', { isLoading: false, isError: false, items: tags })}
				</EntityTypeSubmenu>
				<EntityTypeSubmenu label="Wildcards" typeKey="wildcard">
					{renderTypedList('wildcard', { isLoading: false, isError: false, items: wildcards })}
				</EntityTypeSubmenu>
				<EntityTypeSubmenu label="Elementos del mundo" typeKey="world-item">
					{renderTypedList('world-item', { isLoading: false, isError: false, items: worldItems })}
				</EntityTypeSubmenu>
				<ContextMenuSeparator />
				<ContextMenuItem disabled>Crear nuevo… (próximamente)</ContextMenuItem>
			</ContextMenuSubContent>
		</ContextMenuSub>
	);
}

export default AddToEntityMenu;

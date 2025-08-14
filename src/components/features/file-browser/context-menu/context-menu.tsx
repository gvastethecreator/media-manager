import {
	Album,
	BookImage,
	Copy,
	Download,
	Edit3,
	ExternalLink,
	FolderOpen,
	Heart,
	HeartOff,
	Loader2,
	Move3D,
	Star,
	Tag,
	Trash,
} from 'lucide-react';
import { memo, useCallback, useMemo, useState } from 'react';
import { useEntityLoader } from '@/components/features/file-browser/context-menu/hooks/use-entity-loader';
import { Separator } from '@/components/ui/separator';
import { useContextMenuNavigation } from '@/lib/keyboard';
import { useAlbumStore } from '@/store/entities/album';
import { useCollectionStore } from '@/store/entities/collection';
import { useTagStore } from '@/store/entities/tag';
import type { TagWithStats } from '@/types/entities/tag';
import { EnhancedSubmenu } from './components/enhanced-submenu';
import type { ContextMenuAction, FileContextMenuProps } from './types';

/**
 * Menú contextual para archivos
 *
 * Versión simplificada que no depende de ContextMenuContent de Shadcn UI
 */
export const FileContextMenu = memo<FileContextMenuProps>(function FileContextMenuInner({ file, onAction }) {
	// Usar el hook de carga de entidades
	const { loadingStates, loadEntityData, handleOpenChange } = useEntityLoader();
	// Estado para controlar la acción en proceso
	const [processingAction, setProcessingAction] = useState<ContextMenuAction | null>(null);

	// Obtener datos de los stores - Memoizados para evitar re-renderizados
	const collections = useCollectionStore((state) => Object.values(state.collections));
	const tags = useTagStore((state) => state.getTags());
	const albums = useAlbumStore((state) => Object.values(state.albums));

	// Memoizar las acciones del menú para evitar recreaciones
	const menuActions = useMemo(
		() => [
			{
				action: 'preview' as ContextMenuAction,
				label: 'Vista previa',
				icon: <ExternalLink className="mr-2 h-4 w-4" />,
			},
			{
				action: 'favorite-toggle' as ContextMenuAction,
				label: 'isFavorite' in file && file.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos',
				icon:
					'isFavorite' in file && file.isFavorite ? (
						<HeartOff className="mr-2 h-4 w-4" />
					) : (
						<Heart className="mr-2 h-4 w-4" />
					),
			},
			{
				action: 'mark-toggle' as ContextMenuAction,
				label: 'Marcar/Desmarcar',
				icon: <Star className="mr-2 h-4 w-4" />,
			},
			{
				action: 'open' as ContextMenuAction,
				label: 'Abrir ubicación',
				icon: <ExternalLink className="mr-2 h-4 w-4" />,
			},
			{ action: 'download' as ContextMenuAction, label: 'Descargar', icon: <Download className="mr-2 h-4 w-4" /> },
			{ action: 'copy' as ContextMenuAction, label: 'Copiar al portapapeles', icon: <Copy className="mr-2 h-4 w-4" /> },
			{ action: 'paste' as ContextMenuAction, label: 'Pegar', icon: <Copy className="mr-2 h-4 w-4" /> },
			{ action: 'rename' as ContextMenuAction, label: 'Renombrar', icon: <Edit3 className="mr-2 h-4 w-4" /> },
			{ action: 'move' as ContextMenuAction, label: 'Mover', icon: <Move3D className="mr-2 h-4 w-4" /> },
			{
				action: 'open-in-explorer' as ContextMenuAction,
				label: 'Ver en explorador',
				icon: <FolderOpen className="mr-2 h-4 w-4" />,
			},
			{ action: 'copy-path' as ContextMenuAction, label: 'Copiar ruta', icon: <Copy className="mr-2 h-4 w-4" /> },
			{
				action: 'delete' as ContextMenuAction,
				label: 'Eliminar',
				icon: <Trash className="mr-2 h-4 w-4" />,
				destructive: true,
			},
		],
		[file]
	);

	// Manejador de acciones optimizado con useCallback
	const handleAction = useCallback(
		async (action: ContextMenuAction, data?: Record<string, unknown>) => {
			setProcessingAction(action);
			try {
				await onAction(action, file, data);
			} finally {
				setProcessingAction(null);
			}
		},
		[onAction, file]
	);

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

	// Memoizar elementos transformados para submenús
	const memoizedCollections = useMemo(
		() =>
			collections.map((c) => ({
				...c,
				emoji: c.emoji ?? undefined,
				color: c.color || undefined,
				isFavorite: Boolean(c.isFavorite),
				isRecent: Boolean(c.isRecent),
			})),
		[collections]
	);

	const memoizedTags = useMemo(
		() =>
			tags.map((t: TagWithStats) => ({
				id: t.id,
				name: t.name,
				emoji: t.emoji || undefined,
				isFavorite: false,
				isRecent: false,
			})),
		[tags]
	);

	const memoizedAlbums = useMemo(
		() =>
			albums.map((a) => ({
				...a,
				emoji: a.emoji ?? undefined,
				color: a.color || undefined,
				isFavorite: Boolean(a.isFavorite),
				isRecent: Boolean(a.isRecent),
			})),
		[albums]
	);

	// Estilo para los elementos del menú
	const menuItemStyle =
		'flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer';

	// Renderizar menú contextual con navegación por teclado
	return (
		<div className="w-64 py-1">
			{/* Acciones principales con navegación por teclado */}
			{menuActions.slice(0, 3).map((menuAction, index) => (
				<button
					className={`${menuItemStyle} ${menuAction.destructive ? 'text-red-600 hover:text-red-600' : ''} ${
						selectedIndex === index ? 'bg-accent text-accent-foreground' : ''
					}`}
					disabled={processingAction === menuAction.action}
					key={menuAction.action}
					type="button"
					{...getItemProps(index)}
				>
					{processingAction === menuAction.action ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : menuAction.icon}
					<span>{menuAction.label}</span>
				</button>
			))}

			<Separator className="my-1" />

			{/* Submenús optimizados para entidades */}
			<EnhancedSubmenu
				actionType="add-to-collection"
				createActionType="collection-create"
				file={file}
				icon={<BookImage className="h-4 w-4" />}
				isLoading={loadingStates.collections.loading}
				items={memoizedCollections}
				onAction={onAction}
				onOpenChange={(isOpen) => handleOpenChange('collections', isOpen)}
				title="Colecciones"
			/>

			<EnhancedSubmenu
				actionType="add-tag"
				createActionType="tag-create"
				dataIdField="tagId"
				dataNameField="tagName"
				file={file}
				icon={<Tag className="h-4 w-4" />}
				isLoading={loadingStates.tags.loading}
				items={memoizedTags}
				onAction={onAction}
				onOpenChange={(isOpen) => handleOpenChange('tags', isOpen)}
				title="Etiquetas"
			/>

			<EnhancedSubmenu
				actionType="add-to-album"
				createActionType="album-create"
				dataIdField="albumId"
				dataNameField="albumName"
				file={file}
				icon={<Album className="h-4 w-4" />}
				isLoading={loadingStates.albums.loading}
				items={memoizedAlbums}
				onAction={onAction}
				onOpenChange={(isOpen) => handleOpenChange('albums', isOpen)}
				title="Álbumes"
			/>

			<Separator className="my-1" />

			{/* Acciones de archivo con navegación por teclado */}
			{menuActions.slice(3).map((menuAction, index) => {
				const actualIndex = index + 3;
				return (
					<button
						className={`${menuItemStyle} ${menuAction.destructive ? 'text-red-600 hover:text-red-600' : ''} ${
							selectedIndex === actualIndex ? 'bg-accent text-accent-foreground' : ''
						}`}
						disabled={processingAction === menuAction.action}
						key={menuAction.action}
						type="button"
						{...getItemProps(actualIndex)}
					>
						{processingAction === menuAction.action ? (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						) : (
							menuAction.icon
						)}
						<span>{menuAction.label}</span>
					</button>
				);
			})}
		</div>
	);
});

'use client';

import { useEntityLoader } from '@/components/features/file-browser/context-menu/hooks/use-entity-loader';
import { Separator } from '@/components/ui/separator';
import { useAlbumStore } from '@/store/entities/album';
import { useCollectionStore } from '@/store/entities/collection';
import { useTagStore } from '@/store/entities/tag';
import { Tag as TagType } from '@/types/entities/tag';
import {
	Album,
	BookImage,
	Copy,
	Download,
	ExternalLink,
	Heart,
	HeartOff,
	Loader2,
	Star,
	Tag,
	Trash,
} from 'lucide-react';
import { memo, useState } from 'react';
import { EnhancedSubmenu } from './components/enhanced-submenu';
import type { ContextMenuAction, FileContextMenuProps } from './types';

/**
 * Menú contextual para archivos
 *
 * Versión simplificada que no depende de ContextMenuContent de Shadcn UI
 */
export const FileContextMenu = memo<FileContextMenuProps>(function FileContextMenu({ file, children, onAction }) {
	// Usar el hook de carga de entidades
	const { loadingStates, loadEntityData, handleOpenChange } = useEntityLoader();
	// Estado para controlar la acción en proceso
	const [processingAction, setProcessingAction] = useState<ContextMenuAction | null>(null);

	// Obtener datos de los stores - Ahora esto solo ocurre una vez por renderizado del GridView
	// en lugar de una vez por cada elemento de la cuadrícula
	const collections = useCollectionStore((state) => Object.values(state.collections));
	const tags = useTagStore((state) => state.getTags());
	const albums = useAlbumStore((state) => Object.values(state.albums));

	// Manejador de acciones con indicador de carga
	const handleAction = async (action: ContextMenuAction, data?: Record<string, unknown>) => {
		setProcessingAction(action);
		try {
			await onAction(action, file, data);
		} finally {
			setProcessingAction(null);
		}
	};

	// Estilo para los elementos del menú
	const menuItemStyle =
		'flex items-center w-full px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer';

	// Ahora renderizamos un menú contextual personalizado
	return (
		<div className="w-64 py-1">
			{/* Acciones principales */}
			<button
				type="button"
				className={menuItemStyle}
				onClick={() => handleAction('preview')}
				disabled={processingAction === 'preview'}
			>
				{processingAction === 'preview' ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<ExternalLink className="mr-2 h-4 w-4" />
				)}
				<span>Vista previa</span>
			</button>

			<Separator className="my-1" />

			{/* Acciones de favoritos y selección */}
			<button
				type="button"
				className={menuItemStyle}
				onClick={() => handleAction('favorite-toggle')}
				disabled={processingAction === 'favorite-toggle'}
			>
				{processingAction === 'favorite-toggle' ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : file.isFavorite ? (
					<HeartOff className="mr-2 h-4 w-4" />
				) : (
					<Heart className="mr-2 h-4 w-4" />
				)}
				<span>{file.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}</span>
			</button>

			{/* Resto del menú contextual sin cambios */}
			<button
				type="button"
				className={menuItemStyle}
				onClick={() => handleAction('mark-toggle')}
				disabled={processingAction === 'mark-toggle'}
			>
				{processingAction === 'mark-toggle' ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<Star className="mr-2 h-4 w-4" />
				)}
				<span>Marcar/Desmarcar</span>
			</button>

			<Separator className="my-1" />

			{/* Submenús mejorados para entidades */}
			<EnhancedSubmenu
				title="Colecciones"
				icon={<BookImage className="h-4 w-4" />}
				items={collections.map((c) => ({
					...c,
					isFavorite: Boolean(c.isFavorite),
					isRecent: Boolean(c.isRecent),
				}))}
				isLoading={loadingStates.collections.loading}
				file={file}
				onAction={onAction}
				actionType="add-to-collection"
				createActionType="collection-create"
				onOpenChange={(isOpen) => handleOpenChange('collections', isOpen)}
			/>

			<EnhancedSubmenu
				title="Etiquetas"
				icon={<Tag className="h-4 w-4" />}
				items={tags.map((t: TagType) => ({
					id: t.id,
					name: t.name,
					isFavorite: false,
					isRecent: false,
				}))}
				isLoading={loadingStates.tags.loading}
				file={file}
				onAction={onAction}
				actionType="add-tag"
				createActionType="tag-create"
				onOpenChange={(isOpen) => handleOpenChange('tags', isOpen)}
				dataIdField="tagId"
				dataNameField="tagName"
			/>

			<EnhancedSubmenu
				title="Álbumes"
				icon={<Album className="h-4 w-4" />}
				items={albums.map((a) => ({
					...a,
					isFavorite: Boolean(a.isFavorite),
					isRecent: Boolean(a.isRecent),
				}))}
				isLoading={loadingStates.albums.loading}
				file={file}
				onAction={onAction}
				actionType="add-to-album"
				createActionType="album-create"
				onOpenChange={(isOpen) => handleOpenChange('albums', isOpen)}
				dataIdField="albumId"
				dataNameField="albumName"
			/>

			<Separator className="my-1" />

			{/* Acciones de archivo */}
			<button
				type="button"
				className={menuItemStyle}
				onClick={() => handleAction('open')}
				disabled={processingAction === 'open'}
			>
				{processingAction === 'open' ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<ExternalLink className="mr-2 h-4 w-4" />
				)}
				<span>Abrir ubicación</span>
			</button>

			<button
				type="button"
				className={menuItemStyle}
				onClick={() => handleAction('download')}
				disabled={processingAction === 'download'}
			>
				{processingAction === 'download' ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<Download className="mr-2 h-4 w-4" />
				)}
				<span>Descargar</span>
			</button>

			<button
				type="button"
				className={menuItemStyle}
				onClick={() => handleAction('copy')}
				disabled={processingAction === 'copy'}
			>
				{processingAction === 'copy' ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<Copy className="mr-2 h-4 w-4" />
				)}
				<span>Copiar al portapapeles</span>
			</button>

			<button
				type="button"
				className={menuItemStyle}
				onClick={() => handleAction('copy-path')}
				disabled={processingAction === 'copy-path'}
			>
				{processingAction === 'copy-path' ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<Copy className="mr-2 h-4 w-4" />
				)}
				<span>Copiar ruta</span>
			</button>

			<Separator className="my-1" />

			{/* Acciones destructivas */}
			<button
				type="button"
				className={`${menuItemStyle} text-red-600 hover:text-red-600`}
				onClick={() => handleAction('delete')}
				disabled={processingAction === 'delete'}
			>
				{processingAction === 'delete' ? (
					<Loader2 className="mr-2 h-4 w-4 animate-spin" />
				) : (
					<Trash className="mr-2 h-4 w-4" />
				)}
				<span>Eliminar</span>
			</button>
		</div>
	);
});

'use client';

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuPortal,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useFavoriteStore } from '@/store/entities/favorite';
import { useSelectionStore } from '@/store/selection.store';
import { Copy, Download, Flag, FolderOpen, Heart, HeartOff, ImageIcon, Info, Share2, Trash2 } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { clientLogger } from '@/lib/logger/client-logger';
import {
	AlbumsSubmenu,
	CharactersSubmenu,
	CollectionsSubmenu,
	ConceptsSubmenu,
	NotesSubmenu,
	PlacesSubmenu,
	PromptsSubmenu,
	TagsSubmenu,
	WorldItemsSubmenu,
} from './components/submenus';
import { useEntityLoader } from './hooks/use-entity-loader';
import type { FileContextMenuProps } from './types';

// Logger para el componente
const contextMenuLogger = clientLogger.withContext('ContextMenu');

// Componentes memoizados para evitar re-renderizados
const MemoizedContextMenuTrigger = memo(ContextMenuTrigger);
const MemoizedContextMenuContent = memo(ContextMenuContent);
const MemoizedContextMenuItem = memo(ContextMenuItem);
const MemoizedContextMenuSeparator = memo(ContextMenuSeparator);
const MemoizedContextMenuPortal = memo(ContextMenuPortal);

// Componente de botón de favorito memoizado
const FavoriteButton = memo(function FavoriteButton({
	isFavorited,
	onClick,
}: {
	isFavorited: boolean;
	onClick: () => void;
}) {
	return (
		<MemoizedContextMenuItem onClick={onClick}>
			{isFavorited ? (
				<>
					<HeartOff className="mr-2 h-4 w-4" />
					Quitar de favoritos
				</>
			) : (
				<>
					<Heart className="mr-2 h-4 w-4" />
					Añadir a favoritos
				</>
			)}
		</MemoizedContextMenuItem>
	);
});

// Componente de botón de marcar memoizado
const MarkButton = memo(function MarkButton({
	markText,
	onClick,
}: {
	markText: string;
	onClick: () => void;
}) {
	return (
		<MemoizedContextMenuItem onClick={onClick}>
			<Flag className="mr-2 h-4 w-4" />
			{markText}
		</MemoizedContextMenuItem>
	);
});

// Componente del contenido del menú contextual memoizado
const ContextMenuItems = memo(function ContextMenuItems({
	file,
	onAction,
	markToggleText,
	isFileFavorited,
	submenuProps,
	handleFavoriteToggle,
	handleMarkToggle,
	handlePreview,
	handleOpenLocation,
	handleDownload,
	handleCopy,
	handleCopyPath,
	handleShowProperties,
	handleDelete,
}: {
	file: FileContextMenuProps['file'];
	onAction: FileContextMenuProps['onAction'];
	markToggleText: string;
	isFileFavorited: boolean;
	submenuProps: any;
	handleFavoriteToggle: () => void;
	handleMarkToggle: () => void;
	handlePreview: () => void;
	handleOpenLocation: () => void;
	handleDownload: () => void;
	handleCopy: () => void;
	handleCopyPath: () => void;
	handleShowProperties: () => void;
	handleDelete: () => void;
}) {
	return (
		<MemoizedContextMenuContent className="w-64" style={{ zIndex: 9999 }}>
			{/* Acciones principales */}
			<MemoizedContextMenuItem onClick={handlePreview}>
				<ImageIcon className="mr-2 h-4 w-4" />
				Ver imagen
			</MemoizedContextMenuItem>

			<MarkButton markText={markToggleText} onClick={handleMarkToggle} />
			<FavoriteButton isFavorited={isFileFavorited} onClick={handleFavoriteToggle} />

			<MemoizedContextMenuSeparator />

			{/* Submenús para entidades */}
			<CollectionsSubmenu {...submenuProps} />
			<TagsSubmenu {...submenuProps} />
			<AlbumsSubmenu {...submenuProps} />
			<CharactersSubmenu {...submenuProps} />
			<PlacesSubmenu {...submenuProps} />
			<WorldItemsSubmenu {...submenuProps} />
			<PromptsSubmenu {...submenuProps} />
			<NotesSubmenu {...submenuProps} />
			<ConceptsSubmenu {...submenuProps} />

			<MemoizedContextMenuSeparator />

			{/* Acciones de archivo */}
			<MemoizedContextMenuItem onClick={handleOpenLocation}>
				<FolderOpen className="mr-2 h-4 w-4" />
				Abrir ubicación
			</MemoizedContextMenuItem>

			<MemoizedContextMenuItem onClick={handleDownload}>
				<Download className="mr-2 h-4 w-4" />
				Descargar
			</MemoizedContextMenuItem>

			<MemoizedContextMenuItem onClick={handleCopy}>
				<Copy className="mr-2 h-4 w-4" />
				Copiar al portapapeles
			</MemoizedContextMenuItem>

			<MemoizedContextMenuItem onClick={handleCopyPath}>
				<Share2 className="mr-2 h-4 w-4" />
				Copiar ruta
			</MemoizedContextMenuItem>

			<MemoizedContextMenuSeparator />

			{/* Información y acciones de borrado */}
			<MemoizedContextMenuItem onClick={handleShowProperties}>
				<Info className="mr-2 h-4 w-4" />
				Propiedades
			</MemoizedContextMenuItem>

			<MemoizedContextMenuItem className="text-red-500" onClick={handleDelete}>
				<Trash2 className="mr-2 h-4 w-4" />
				Eliminar
			</MemoizedContextMenuItem>
		</MemoizedContextMenuContent>
	);
});

// Memoizamos el componente FileContextMenu para evitar renderizaciones innecesarias
export const FileContextMenu = memo(function FileContextMenu({ file, children, onAction }: FileContextMenuProps) {
	const { toggleFavorite, isFavorited } = useFavoriteStore();
	const { loadingStates, handleOpenChange, loadEntityData } = useEntityLoader();
	const { selectedItems, isItemSelected, toggleSelection } = useSelectionStore();
	const [isOpen, setIsOpen] = useState(false);

	// Efecto para verificar si las entidades ya están cargadas y actualizar el UI apropiadamente
	useEffect(() => {
		if (typeof window !== 'undefined' && window.entityPreloadComplete) {
			contextMenuLogger.info('✅ Entidades ya precargadas globalmente desde FileBrowser, listo para mostrar menú');
		}
	}, []);

	// Memoizamos la función handleFavoriteToggle
	const handleFavoriteToggle = useCallback(() => {
		toggleFavorite(file.id);
		onAction('favorite-toggle', file);
		contextMenuLogger.info('⭐ Toggle favorito:', file.id);
	}, [file, toggleFavorite, onAction]);

	// Memoizamos el texto del botón de marcar
	const markToggleText = useMemo(() => {
		const isSelected = isItemSelected(file.id);
		return isSelected ? 'Desmarcar' : 'Marcar';
	}, [isItemSelected, file.id]);

	// Memoizamos los handlers para acciones comunes
	const handlePreview = useCallback(() => {
		contextMenuLogger.info('👁️ Vista previa:', file.id);
		onAction('preview', file);
	}, [onAction, file]);

	const handleMarkToggle = useCallback(() => {
		contextMenuLogger.info('🚩 Toggle marca:', file.id);
		toggleSelection(file.id, file);
		onAction('mark-toggle', file);
	}, [onAction, file, toggleSelection]);

	const handleOpenLocation = useCallback(() => {
		contextMenuLogger.info('📂 Abrir ubicación:', file.id);
		onAction('open', file);
	}, [onAction, file]);

	const handleDownload = useCallback(() => {
		contextMenuLogger.info('⬇️ Descargar:', file.id);
		onAction('download', file);
	}, [onAction, file]);

	const handleCopy = useCallback(() => {
		contextMenuLogger.info('📋 Copiar al portapapeles:', file.id);
		onAction('copy', file);
	}, [onAction, file]);

	const handleCopyPath = useCallback(() => {
		contextMenuLogger.info('📋 Copiar ruta:', file.id);
		onAction('copy-path', file);
	}, [onAction, file]);

	const handleDelete = useCallback(() => {
		contextMenuLogger.info('🗑️ Eliminar:', file.id);
		onAction('delete', file);
	}, [onAction, file]);

	const handleShowProperties = useCallback(() => {
		contextMenuLogger.info('ℹ️ Mostrar propiedades:', file.id);
		window.dispatchEvent(
			new CustomEvent('show-file-details', {
				detail: { fileId: file.id },
			})
		);
	}, [file.id]);

	// Memoizamos el estado de favorito
	const isFileFavorited = useMemo(() => isFavorited(file.id), [isFavorited, file.id]);

	// Crear objetos de props para submenús - memoizado para evitar re-renderizados
	const submenuProps = useMemo(
		() => ({
			file,
			onAction,
			loadEntityData,
			loadingStates,
		}),
		[file, onAction, loadEntityData, loadingStates]
	);

	// Manejador memoizado para cambios en el estado de apertura del menú
	const handleContextMenuOpenChange = useCallback(
		(open: boolean) => {
			setIsOpen(open);
			// Solo cargar entidades cuando se abre el menú
			if (open) {
				handleOpenChange(open);
			}
		},
		[handleOpenChange]
	);

	return (
		<ContextMenu onOpenChange={handleContextMenuOpenChange}>
			<MemoizedContextMenuTrigger>{children}</MemoizedContextMenuTrigger>
			<MemoizedContextMenuPortal>
				{isOpen && (
					<ContextMenuItems
						file={file}
						onAction={onAction}
						markToggleText={markToggleText}
						isFileFavorited={isFileFavorited}
						submenuProps={submenuProps}
						handleFavoriteToggle={handleFavoriteToggle}
						handleMarkToggle={handleMarkToggle}
						handlePreview={handlePreview}
						handleOpenLocation={handleOpenLocation}
						handleDownload={handleDownload}
						handleCopy={handleCopy}
						handleCopyPath={handleCopyPath}
						handleShowProperties={handleShowProperties}
						handleDelete={handleDelete}
					/>
				)}
			</MemoizedContextMenuPortal>
		</ContextMenu>
	);
});

// Exportar también las acciones desde types.ts
export type { ContextMenuAction } from './types';

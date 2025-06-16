'use client';

import { useEntityLoader } from '@/components/features/file-browser/context-menu/hooks/use-entity-loader';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
	Copy,
	Download,
	ExternalLink,
	Heart,
	HeartOff,
	Loader2,
	Star,
	Trash
} from 'lucide-react';
import { memo, useState } from 'react';
import { AlbumsSubmenu, CollectionsSubmenu, TagsSubmenu } from './components/submenus';
import type { FileContextMenuProps } from './types';

/**
 * Menú contextual para archivos
 */
export const FileContextMenu = memo<FileContextMenuProps>(function FileContextMenu({ file, children, onAction }) {
	// Usar el hook de carga de entidades
	const { loadingStates, loadEntityData, handleOpenChange } = useEntityLoader();
	// Estado para controlar la acción en proceso
	const [processingAction, setProcessingAction] = useState<ContextMenuAction | null>(null);

	// Manejador de acciones con indicador de carga
	const handleAction = async (action: ContextMenuAction, data?: Record<string, unknown>) => {
		setProcessingAction(action);
		try {
			await onAction(action, file, data);
		} finally {
			setProcessingAction(null);
		}
	};

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-64">
				{/* Acciones principales */}
				<ContextMenuItem
					onClick={() => handleAction('preview')}
					disabled={processingAction === 'preview'}
				>
					{processingAction === 'preview' ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<ExternalLink className="mr-2 h-4 w-4" />
					)}
					<span>Vista previa</span>
				</ContextMenuItem>

				<ContextMenuSeparator />

				{/* Acciones de favoritos y selección */}
				<ContextMenuItem
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
				</ContextMenuItem>

				<ContextMenuItem
					onClick={() => handleAction('mark-toggle')}
					disabled={processingAction === 'mark-toggle'}
				>
					{processingAction === 'mark-toggle' ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Star className="mr-2 h-4 w-4" />
					)}
					<span>Marcar/Desmarcar</span>
				</ContextMenuItem>

				<ContextMenuSeparator />

				{/* Submenús para entidades */}
				<CollectionsSubmenu
					file={file}
					onAction={onAction}
					loadEntityData={loadEntityData}
					loadingStates={loadingStates}
					handleOpenChange={handleOpenChange}
				/>
				<TagsSubmenu
					file={file}
					onAction={onAction}
					loadEntityData={loadEntityData}
					loadingStates={loadingStates}
					handleOpenChange={handleOpenChange}
				/>
				<AlbumsSubmenu
					file={file}
					onAction={onAction}
					loadEntityData={loadEntityData}
					loadingStates={loadingStates}
					handleOpenChange={handleOpenChange}
				/>

				<ContextMenuSeparator />

				{/* Acciones de archivo */}
				<ContextMenuItem
					onClick={() => handleAction('open')}
					disabled={processingAction === 'open'}
				>
					{processingAction === 'open' ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<ExternalLink className="mr-2 h-4 w-4" />
					)}
					<span>Abrir ubicación</span>
				</ContextMenuItem>

				<ContextMenuItem
					onClick={() => handleAction('download')}
					disabled={processingAction === 'download'}
				>
					{processingAction === 'download' ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Download className="mr-2 h-4 w-4" />
					)}
					<span>Descargar</span>
				</ContextMenuItem>

				<ContextMenuItem
					onClick={() => handleAction('copy')}
					disabled={processingAction === 'copy'}
				>
					{processingAction === 'copy' ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Copy className="mr-2 h-4 w-4" />
					)}
					<span>Copiar al portapapeles</span>
				</ContextMenuItem>

				<ContextMenuItem
					onClick={() => handleAction('copy-path')}
					disabled={processingAction === 'copy-path'}
				>
					{processingAction === 'copy-path' ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Copy className="mr-2 h-4 w-4" />
					)}
					<span>Copiar ruta</span>
				</ContextMenuItem>

				<ContextMenuSeparator />

				{/* Acciones destructivas */}
				<ContextMenuItem
					onClick={() => handleAction('delete')}
					className="text-red-600"
					disabled={processingAction === 'delete'}
				>
					{processingAction === 'delete' ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : (
						<Trash className="mr-2 h-4 w-4" />
					)}
					<span>Eliminar</span>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
});


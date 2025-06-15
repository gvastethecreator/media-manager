'use client';

import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuSeparator,
	ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { clientLogger } from '@/lib/logger/client-logger';
import { Copy, Download, ExternalLink, Heart, HeartOff, Star, Trash } from 'lucide-react';
import { memo } from 'react';
import { AlbumsSubmenu, CollectionsSubmenu, TagsSubmenu } from './components/submenus';
import { useEntityLoader } from './hooks/use-entity-loader';
import type { FileContextMenuProps } from './types';

// Logger para el componente
const menuLogger = clientLogger.withContext('FileContextMenu');

/**
 * Menú contextual para archivos con submenús para diferentes entidades
 */
export const FileContextMenu = memo<FileContextMenuProps>(function FileContextMenu({ file, children, onAction }) {
	// Usar el hook de carga de entidades
	const { loadingStates, loadEntityData, handleOpenChange } = useEntityLoader();

	return (
		<ContextMenu>
			<ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
			<ContextMenuContent className="w-64">
				{/* Acciones principales */}
				<ContextMenuItem onClick={() => onAction('preview', file)}>
					<ExternalLink className="mr-2 h-4 w-4" />
					<span>Vista previa</span>
				</ContextMenuItem>

				<ContextMenuSeparator />

				{/* Acciones de favoritos y selección */}
				<ContextMenuItem onClick={() => onAction('favorite-toggle', file)}>
					{file.isFavorite ? (
						<>
							<HeartOff className="mr-2 h-4 w-4" />
							<span>Quitar de favoritos</span>
						</>
					) : (
						<>
							<Heart className="mr-2 h-4 w-4" />
							<span>Añadir a favoritos</span>
						</>
					)}
				</ContextMenuItem>

				<ContextMenuItem onClick={() => onAction('mark-toggle', file)}>
					<Star className="mr-2 h-4 w-4" />
					<span>Marcar/Desmarcar</span>
				</ContextMenuItem>

				<ContextMenuSeparator />

				{/* Submenús para entidades */}
				<CollectionsSubmenu
					file={file}
					onAction={onAction}
					loadEntityData={loadEntityData}
					loadingStates={loadingStates}
				/>
				<TagsSubmenu file={file} onAction={onAction} loadEntityData={loadEntityData} loadingStates={loadingStates} />
				<AlbumsSubmenu file={file} onAction={onAction} loadEntityData={loadEntityData} loadingStates={loadingStates} />

				<ContextMenuSeparator />

				{/* Acciones de archivo */}
				<ContextMenuItem onClick={() => onAction('open', file)}>
					<ExternalLink className="mr-2 h-4 w-4" />
					<span>Abrir ubicación</span>
				</ContextMenuItem>
				<ContextMenuItem onClick={() => onAction('download', file)}>
					<Download className="mr-2 h-4 w-4" />
					<span>Descargar</span>
				</ContextMenuItem>
				<ContextMenuItem onClick={() => onAction('copy', file)}>
					<Copy className="mr-2 h-4 w-4" />
					<span>Copiar al portapapeles</span>
				</ContextMenuItem>
				<ContextMenuItem onClick={() => onAction('copy-path', file)}>
					<Copy className="mr-2 h-4 w-4" />
					<span>Copiar ruta</span>
				</ContextMenuItem>

				<ContextMenuSeparator />

				{/* Acciones destructivas */}
				<ContextMenuItem onClick={() => onAction('delete', file)} className="text-red-600">
					<Trash className="mr-2 h-4 w-4" />
					<span>Eliminar</span>
				</ContextMenuItem>
			</ContextMenuContent>
		</ContextMenu>
	);
});


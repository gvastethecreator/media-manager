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
import { memo, useState } from 'react';
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
export const FileContextMenu = memo<FileContextMenuProps>(function FileContextMenu({ file, onAction }) {
	// Usar el hook de carga de entidades
	const { loadingStates, loadEntityData, handleOpenChange } = useEntityLoader();
	// Estado para controlar la acción en proceso
	const [processingAction, setProcessingAction] = useState<ContextMenuAction | null>(null);

	// Definir las acciones del menú en orden
	const menuActions: Array<{ action: ContextMenuAction; label: string; icon: React.ReactNode; destructive?: boolean }> =
		[
			{ action: 'preview', label: 'Vista previa', icon: <ExternalLink className="mr-2 h-4 w-4" /> },
			{
				action: 'favorite-toggle',
				label: 'isFavorite' in file && file.isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos',
				icon:
					'isFavorite' in file && file.isFavorite ? (
						<HeartOff className="mr-2 h-4 w-4" />
					) : (
						<Heart className="mr-2 h-4 w-4" />
					),
			},
			{ action: 'mark-toggle', label: 'Marcar/Desmarcar', icon: <Star className="mr-2 h-4 w-4" /> },
			{ action: 'open', label: 'Abrir ubicación', icon: <ExternalLink className="mr-2 h-4 w-4" /> },
			{ action: 'download', label: 'Descargar', icon: <Download className="mr-2 h-4 w-4" /> },
			{ action: 'copy', label: 'Copiar al portapapeles', icon: <Copy className="mr-2 h-4 w-4" /> },
			{ action: 'paste', label: 'Pegar', icon: <Copy className="mr-2 h-4 w-4" /> },
			{ action: 'rename', label: 'Renombrar', icon: <Edit3 className="mr-2 h-4 w-4" /> },
			{ action: 'move', label: 'Mover', icon: <Move3D className="mr-2 h-4 w-4" /> },
			{ action: 'open-in-explorer', label: 'Ver en explorador', icon: <FolderOpen className="mr-2 h-4 w-4" /> },
			{ action: 'copy-path', label: 'Copiar ruta', icon: <Copy className="mr-2 h-4 w-4" /> },
			{ action: 'delete', label: 'Eliminar', icon: <Trash className="mr-2 h-4 w-4" />, destructive: true },
		];

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

	// Renderizar menú contextual con navegación por teclado
	return (
		<div className="w-64 py-1">
			{/* Acciones principales con navegación por teclado */}
			{menuActions.slice(0, 3).map((menuAction, index) => (
				<button
					key={menuAction.action}
					type="button"
					className={`${menuItemStyle} ${menuAction.destructive ? 'text-red-600 hover:text-red-600' : ''} ${
						selectedIndex === index ? 'bg-accent text-accent-foreground' : ''
					}`}
					disabled={processingAction === menuAction.action}
					{...getItemProps(index)}
				>
					{processingAction === menuAction.action ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : menuAction.icon}
					<span>{menuAction.label}</span>
				</button>
			))}

			<Separator className="my-1" />

			{/* Submenús mejorados para entidades */}
			<EnhancedSubmenu
				title="Colecciones"
				icon={<BookImage className="h-4 w-4" />}
				items={collections.map((c) => ({
					...c,
					emoji: c.emoji ?? undefined,
					color: c.color || undefined,
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
				items={tags.map((t: TagWithStats) => ({
					id: t.id,
					name: t.name,
					emoji: t.emoji || undefined,
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
					emoji: a.emoji ?? undefined,
					color: a.color || undefined,
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

			{/* Acciones de archivo con navegación por teclado */}
			{menuActions.slice(3).map((menuAction, index) => {
				const actualIndex = index + 3;
				return (
					<button
						key={menuAction.action}
						type="button"
						className={`${menuItemStyle} ${menuAction.destructive ? 'text-red-600 hover:text-red-600' : ''} ${
							selectedIndex === actualIndex ? 'bg-accent text-accent-foreground' : ''
						}`}
						disabled={processingAction === menuAction.action}
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

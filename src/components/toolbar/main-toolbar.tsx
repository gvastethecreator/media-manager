'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNavigation } from '@/lib/utils/navigation-utils';
import { cn } from '@/lib/utils/utils';
import { useFileManager } from '@/store/file-manager.store';
import { useNavigationStore } from '@/store/navigation.store';
import type { ViewType } from '@/types/file-item';
import {
	Archive,
	BookImage,
	Box,
	Camera,
	Copy,
	Download,
	Edit,
	FolderIcon,
	GalleryHorizontal,
	Grid,
	Grid2X2,
	ImageIcon,
	LayoutGrid,
	List,
	MapPin,
	Plus,
	Search,
	Share2,
	Star,
	TagIcon,
	Trash2,
	User2,
	X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback } from 'react';
import { ViewBreadcrumbs } from './breadcrumbs';
import { EntityDetails } from './entity-details';

export function ViewToolbar() {
	const { currentView } = useNavigationStore();
	const { viewMode, setViewMode, selectedItems, clearSelection } = useFileManager();

	// Usar el hook de navegación para obtener el elemento actual
	const { getCurrentItem } = useNavigation();

	// Acciones para archivos marcados
	const handleDeleteSelected = useCallback(() => {
		if (selectedItems.length === 0) {
			return;
		}

		if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedItems.length} archivo(s)?`)) {
			// Enviar cada archivo a la papelera
			for (const item of selectedItems) {
				if (item.path) {
					window.electron?.deleteFile(item.path);
				}
			}
			// Limpiar selección
			clearSelection();
		}
	}, [selectedItems, clearSelection]);

	const handleDownloadSelected = useCallback(() => {
		if (selectedItems.length === 0) {
			return;
		}

		for (const item of selectedItems) {
			if (item.path) {
				window.electron?.downloadFile(item.path);
			}
		}
	}, [selectedItems]);

	// Función para comprimir archivos seleccionados
	const handleCompressFiles = useCallback(() => {
		if (selectedItems.length === 0) {
			return;
		}

		const paths = selectedItems.map((item) => item.path).filter(Boolean) as string[];
		if (paths.length > 0) {
			// El método compressFiles no existe en la interfaz window.electron
			// Se comenta el código para evitar errores
			// window.electron?.compressFiles(paths);
			console.warn('La funcionalidad de compresión no está implementada en esta versión');
			// Mostrar mensaje al usuario
			alert('La funcionalidad de compresión de archivos estará disponible en una próxima actualización.');
		}
	}, [selectedItems]);

	const handleCopySelected = useCallback(() => {
		if (selectedItems.length === 0) {
			return;
		}

		// Solo copiamos el primer archivo al portapapeles
		// La API no permite copiar múltiples archivos
		if (selectedItems[0]?.path) {
			window.electron?.copyFileToClipboard(selectedItems[0].path);
		}
	}, [selectedItems]);

	const renderIcon = () => {
		switch (currentView) {
			case 'all-images':
				return <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" />;
			case 'favorites':
				return <Star className="h-3.5 w-3.5 text-muted-foreground" />;
			case 'search':
				return <Search className="h-3.5 w-3.5 text-muted-foreground" />;
			case 'collections':
			case 'collection-content':
				return <BookImage className="h-3.5 w-3.5 text-muted-foreground" />;
			case 'folders':
			case 'folder-content':
				return <FolderIcon className="h-3.5 w-3.5 text-muted-foreground" />;
			case 'tags':
			case 'tag-content':
				return <TagIcon className="h-3.5 w-3.5 text-muted-foreground" />;
			case 'albums':
			case 'album-content':
				return <Camera className="h-3.5 w-3.5 text-muted-foreground" />;
			case 'characters':
			case 'character-content':
				return <User2 className="h-3.5 w-3.5 text-muted-foreground" />;
			case 'places':
			case 'place-content':
				return <MapPin className="h-3.5 w-3.5 text-muted-foreground" />;
			case 'world-items':
			case 'world-item-content':
				return <Box className="h-3.5 w-3.5 text-muted-foreground" />;
			default:
				return null;
		}
	};

	const renderActions = () => {
		// Render acciones para elementos marcados
		if (selectedItems.length > 0) {
			return (
				<div className="flex items-center gap-2">
					<Badge variant="secondary" className="gap-1">
						<span>{selectedItems.length}</span>
						<span>seleccionado{selectedItems.length !== 1 ? 's' : ''}</span>
					</Badge>

					<Separator orientation="vertical" className="h-7 w-px bg-border" />

					<div className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon"
							className="h-5 w-5"
							title="Eliminar archivos seleccionados"
							onClick={handleDeleteSelected}
						>
							<Trash2 className="h-3.5 w-3.5 text-red-500" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-5 w-5"
							title="Descargar archivos seleccionados"
							onClick={handleDownloadSelected}
						>
							<Download className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-5 w-5"
							title="Comprimir archivos seleccionados"
							onClick={handleCompressFiles}
						>
							<Archive className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-5 w-5"
							title="Copiar archivo seleccionado"
							onClick={handleCopySelected}
							disabled={selectedItems.length !== 1}
						>
							<Copy className="h-3.5 w-3.5" />
						</Button>
						<Button variant="ghost" size="icon" className="h-5 w-5" title="Limpiar selección" onClick={clearSelection}>
							<X className="h-3.5 w-3.5" />
						</Button>
					</div>

					<Separator orientation="vertical" className="h-5 w-px bg-border" />

					<div className="flex items-center gap-1 bg-black/50 rounded-md p-1">
						<Button
							variant="ghost"
							size="icon"
							className="h-5 w-5"
							onClick={() => setViewMode('grid')}
							title="Vista de cuadrícula"
							data-active={viewMode === 'grid'}
						>
							<Grid className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-5 w-5"
							onClick={() => setViewMode('masonry')}
							title="Vista de mosaico"
							data-active={viewMode === 'masonry'}
						>
							<LayoutGrid className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-5 w-5"
							onClick={() => setViewMode('cards')}
							title="Vista de tarjetas"
							data-active={viewMode === 'cards'}
						>
							<GalleryHorizontal className="h-3.5 w-3.5" />
						</Button>
						<Button
							variant="ghost"
							size="icon"
							className="h-5 w-5"
							onClick={() => setViewMode('list')}
							title="Vista de lista"
							data-active={viewMode === 'list'}
						>
							<List className="h-3.5 w-3.5" />
						</Button>
					</div>
				</div>
			);
		}

		// Resto del código existente
		const commonActions = (
			<>
				<Separator orientation="vertical" className="h-5 w-px bg-border" />
				<div className="flex items-center gap-1 bg-black/50 rounded-md p-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-5 w-5"
						onClick={() => setViewMode('grid')}
						title="Vista de cuadrícula"
						data-active={viewMode === 'grid'}
					>
						<Grid className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-5 w-5"
						onClick={() => setViewMode('masonry')}
						title="Vista de mosaico"
						data-active={viewMode === 'masonry'}
					>
						<LayoutGrid className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-5 w-5"
						onClick={() => setViewMode('cards')}
						title="Vista de tarjetas"
						data-active={viewMode === 'cards'}
					>
						<GalleryHorizontal className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-5 w-5"
						onClick={() => setViewMode('list')}
						title="Vista de lista"
						data-active={viewMode === 'list'}
					>
						<List className="h-3.5 w-3.5" />
					</Button>
				</div>
			</>
		);

		switch (currentView) {
			case 'all-images':
			case 'favorites':
			case 'search':
				return (
					<div className="flex items-center gap-1">
						<Button variant="ghost" size="icon" className="h-5 w-5">
							<Download className="h-3.5 w-3.5" />
						</Button>
						<Button variant="ghost" size="icon" className="h-5 w-5">
							<Share2 className="h-3.5 w-3.5" />
						</Button>
						{commonActions}
					</div>
				);
			case 'collections':
			case 'folders':
			case 'tags':
			case 'albums':
			case 'characters':
			case 'places':
			case 'world-items':
				return (
					<div className="flex items-center gap-1">
						<Button variant="ghost" size="sm" className="h-5 text-xs">
							<Plus className="h-3.5 w-3.5 mr-1" />
							Nuevo
						</Button>
						{commonActions}
					</div>
				);
			case 'collection-content':
			case 'folder-content':
			case 'tag-content':
			case 'album-content':
			case 'character-content':
			case 'place-content':
			case 'world-item-content':
				return (
					<div className="flex items-center gap-1">
						<Button variant="ghost" size="icon" className="h-5 w-5">
							<Edit className="h-3.5 w-3.5" />
						</Button>
						<Button variant="ghost" size="icon" className="h-5 w-5">
							<Trash2 className="h-3.5 w-3.5" />
						</Button>
						{commonActions}
					</div>
				);
			default:
				return null;
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className={cn('flex flex-col bg-background py-0', 'border-b border-border')}
		>
			<div className="flex w-full items-center justify-between gap-2 p-2">
				<div className="flex items-center gap-2 w-full">
					<div className="flex items-center justify-center h-8 w-8 rounded-sm bg-muted">{renderIcon()}</div>
					<div className="flex items-center">
						<ViewBreadcrumbs currentView={currentView as ViewType} currentItem={getCurrentItem()} />
						<EntityDetails />
					</div>
				</div>
				<div className="flex items-center gap-2">{renderActions()}</div>
			</div>
		</motion.div>
	);
}

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNavigation } from '@/lib/utils/navigation.utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFileManager } from '@/store/file-manager.store';
import { useNavigationStore } from '@/store/navigation.store';
import type { ViewType } from '@/types/file-item';
import {
	Archive,
	ArrowDown,
	ArrowUp,
	BookImage,
	Box,
	Calendar,
	Camera,
	ChevronRight,
	Clock,
	Copy,
	Download,
	Edit,
	FileText,
	FolderIcon,
	GalleryHorizontal,
	Grid,
	ImageIcon,
	Info,
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
	const { viewMode, setViewMode, selectedItems, clearSelection, sortBy, setSortBy, sortOrder, setSortOrder } =
		useFileManager();
	const { isVisible, toggleVisibility } = useDetailsPanel();
	const { getCurrentItem } = useNavigation();

	// Lista de vistas que requieren el panel de detalles
	const viewsWithDetails = [
		'all-images',
		'favorites',
		'search',
		'collection-content',
		'folder-content',
		'tag-content',
		'album-content',
		'character-content',
		'place-content',
		'world-item-content',
	];

	const showDetailsButton = viewsWithDetails.includes(currentView);

	// Acciones para archivos marcados
	const handleDeleteSelected = useCallback(() => {
		if (selectedItems.length === 0) {
			return;
		}
		if (window.confirm(`¿Estás seguro de que quieres eliminar ${selectedItems.length} archivo(s)?`)) {
			for (const item of selectedItems) {
				if (item.path) {
					window.electron?.deleteFile(item.path);
				}
			}
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

	const handleCompressFiles = useCallback(() => {
		if (selectedItems.length === 0) {
			return;
		}
		const paths = selectedItems.map((item) => item.path).filter(Boolean) as string[];
		if (paths.length > 0) {
			console.warn('La funcionalidad de compresión no está implementada en esta versión');
			alert('La funcionalidad de compresión de archivos estará disponible en una próxima actualización.');
		}
	}, [selectedItems]);

	const handleCopySelected = useCallback(() => {
		if (selectedItems.length === 0) {
			return;
		}
		if (selectedItems[0]?.path) {
			window.electron?.copyFileToClipboard(selectedItems[0].path);
		}
	}, [selectedItems]);

	const handleSort = useCallback(
		(field: string) => {
			if (sortBy === field) {
				setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
			} else {
				setSortBy(field);
				setSortOrder('asc');
			}
		},
		[sortBy, sortOrder, setSortBy, setSortOrder]
	);

	const renderSortButtons = () => (
		<div className="flex items-center gap-1">
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8 hover:bg-accent"
				title="Ordenar por nombre"
				onClick={() => handleSort('name')}
				data-active={sortBy === 'name'}
			>
				<FileText className="h-4 w-4" />
				{sortBy === 'name' && (
					<span className="ml-1">
						{sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
					</span>
				)}
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8 hover:bg-accent"
				title="Ordenar por fecha de modificación"
				onClick={() => handleSort('updatedAt')}
				data-active={sortBy === 'updatedAt'}
			>
				<Clock className="h-4 w-4" />
				{sortBy === 'updatedAt' && (
					<span className="ml-1">
						{sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
					</span>
				)}
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8 hover:bg-accent"
				title="Ordenar por fecha de creación"
				onClick={() => handleSort('createdAt')}
				data-active={sortBy === 'createdAt'}
			>
				<Calendar className="h-4 w-4" />
				{sortBy === 'createdAt' && (
					<span className="ml-1">
						{sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
					</span>
				)}
			</Button>
		</div>
	);

	const renderViewButtons = () => (
		<div className="flex items-center gap-1 bg-accent/10 rounded-md p-1">
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8 hover:bg-accent"
				onClick={() => setViewMode('grid')}
				title="Vista de cuadrícula"
				data-active={viewMode === 'grid'}
			>
				<Grid className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8 hover:bg-accent"
				onClick={() => setViewMode('masonry')}
				title="Vista de mosaico"
				data-active={viewMode === 'masonry'}
			>
				<LayoutGrid className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8 hover:bg-accent"
				onClick={() => setViewMode('cards')}
				title="Vista de tarjetas"
				data-active={viewMode === 'cards'}
			>
				<GalleryHorizontal className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-8 w-8 hover:bg-accent"
				onClick={() => setViewMode('list')}
				title="Vista de lista"
				data-active={viewMode === 'list'}
			>
				<List className="h-4 w-4" />
			</Button>
		</div>
	);

	const renderSelectionActions = () => {
		if (selectedItems.length === 0) {
			return null;
		}

		return (
			<div className="flex items-center gap-2 bg-accent/10 rounded-md p-1">
				<Badge variant="secondary" className="gap-1">
					<span>{selectedItems.length}</span>
					<span>seleccionado{selectedItems.length !== 1 ? 's' : ''}</span>
				</Badge>

				<Separator orientation="vertical" className="h-6 w-px bg-border" />

				<div className="flex items-center gap-1">
					{showDetailsButton && (
						<Button
							variant="ghost"
							size="icon"
							className="h-8 w-8 hover:bg-accent"
							title={isVisible ? 'Ocultar panel de detalles' : 'Mostrar panel de detalles'}
							onClick={toggleVisibility}
							data-active={isVisible}
						>
							<Info className="h-4 w-4" />
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 hover:bg-accent"
						title="Eliminar archivos seleccionados"
						onClick={handleDeleteSelected}
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 hover:bg-accent"
						title="Descargar archivos seleccionados"
						onClick={handleDownloadSelected}
					>
						<Download className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 hover:bg-accent"
						title="Comprimir archivos seleccionados"
						onClick={handleCompressFiles}
					>
						<Archive className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 hover:bg-accent"
						title="Copiar archivo seleccionado"
						onClick={handleCopySelected}
						disabled={selectedItems.length !== 1}
					>
						<Copy className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 w-8 hover:bg-accent"
						title="Limpiar selección"
						onClick={clearSelection}
					>
						<X className="h-4 w-4" />
					</Button>
				</div>
			</div>
		);
	};

	const renderContextActions = () => {
		switch (currentView) {
			case 'all-images':
			case 'favorites':
			case 'search':
				return (
					<div className="flex items-center gap-1">
						<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
							<Download className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
							<Share2 className="h-4 w-4" />
						</Button>
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
						<Button variant="ghost" size="sm" className="h-8 text-sm">
							<Plus className="h-4 w-4 mr-1" />
							Nuevo
						</Button>
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
						<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
							<Edit className="h-4 w-4" />
						</Button>
						<Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent">
							<Trash2 className="h-4 w-4 text-destructive" />
						</Button>
					</div>
				);
			default:
				return null;
		}
	};

	const renderIcon = () => {
		switch (currentView) {
			case 'all-images':
				return <ImageIcon className="h-4 w-4 text-muted-foreground" />;
			case 'favorites':
				return <Star className="h-4 w-4 text-muted-foreground" />;
			case 'search':
				return <Search className="h-4 w-4 text-muted-foreground" />;
			case 'collections':
			case 'collection-content':
				return <BookImage className="h-4 w-4 text-muted-foreground" />;
			case 'folders':
			case 'folder-content':
				return <FolderIcon className="h-4 w-4 text-muted-foreground" />;
			case 'tags':
			case 'tag-content':
				return <TagIcon className="h-4 w-4 text-muted-foreground" />;
			case 'albums':
			case 'album-content':
				return <Camera className="h-4 w-4 text-muted-foreground" />;
			case 'characters':
			case 'character-content':
				return <User2 className="h-4 w-4 text-muted-foreground" />;
			case 'places':
			case 'place-content':
				return <MapPin className="h-4 w-4 text-muted-foreground" />;
			case 'world-items':
			case 'world-item-content':
				return <Box className="h-4 w-4 text-muted-foreground" />;
			default:
				return null;
		}
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: -10 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex flex-col bg-background border-b border-border"
		>
			<div className="flex w-full items-center justify-between gap-4 p-2">
				<div className="flex items-center gap-3">
					<div className="flex items-center justify-center h-9 w-9 rounded-md bg-accent/10">{renderIcon()}</div>
					<div className="flex items-center">
						<ViewBreadcrumbs currentView={currentView as ViewType} currentItem={getCurrentItem()} />
						<EntityDetails />
					</div>
				</div>

				<div className="flex items-center gap-4">
					{renderSortButtons()}
					<Separator orientation="vertical" className="h-6 w-px bg-border" />
					{renderViewButtons()}
					<Separator orientation="vertical" className="h-6 w-px bg-border" />
					{renderSelectionActions()}
					{renderContextActions()}
				</div>
			</div>
		</motion.div>
	);
}

'use client';

import { useNavigationStore } from '@/components/navigation/navigation.store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useFileStoreBase } from '@/store/entities/file';
import type { ViewType } from '@/types/file-item';
import {
	Archive,
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	BookImage,
	Box,
	Calendar,
	Camera,
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
import { ViewBreadcrumbs } from '../navigation/breadcrumbs';
import { EntityDetails } from './entity-details';

export interface ViewToolbarProps {
	isRightPanelCollapsed?: boolean;
	toggleRightPanelCollapse?: () => void;
	isRightPanelVisible?: boolean;
}

export function ViewToolbar({
	isRightPanelCollapsed,
	toggleRightPanelCollapse,
	isRightPanelVisible,
}: ViewToolbarProps) {
	const { currentView, getCurrentItem } = useNavigationStore();

	// 🆕 Usar los nuevos stores específicos de entidades
	const viewMode = useFileStoreBase((state) => state.viewMode);
	const setViewMode = useFileStoreBase((state) => state.setViewMode);
	const selectedFileIds = useFileStoreBase((state) => state.selectedFileIds);
	const files = useFileStoreBase((state) => state.files);
	const deselectAllFiles = useFileStoreBase((state) => state.deselectAllFiles);
	const sortBy = useFileStoreBase((state) => state.sortBy);
	const setSortBy = useFileStoreBase((state) => state.setSortBy);
	const sortDirection = useFileStoreBase((state) => state.sortDirection);
	const setSortDirection = useFileStoreBase((state) => state.setSortDirection);

	// 🎯 Obtener items seleccionados con información completa
	const selectedItems = selectedFileIds.map((id) => files[id as keyof typeof files]).filter(Boolean);

	const { isVisible, toggleVisibility } = useDetailsPanel();

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
				if (item?.path) {
					window.electron?.deleteFile(item.path);
				}
			}
			deselectAllFiles();
		}
	}, [selectedItems, deselectAllFiles]);

	const handleDownloadSelected = useCallback(() => {
		if (selectedItems.length === 0) {
			return;
		}
		for (const item of selectedItems) {
			if (item?.path) {
				window.electron?.downloadFile(item.path);
			}
		}
	}, [selectedItems]);

	const handleCompressFiles = useCallback(() => {
		if (selectedItems.length === 0) {
			return;
		}
		const paths = selectedItems.map((item) => item?.path).filter(Boolean) as string[];
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
		(field: 'name' | 'createdAt' | 'modifiedAt') => {
			if (sortBy === field) {
				setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
			} else {
				setSortBy(field);
				setSortDirection('asc');
			}
		},
		[sortBy, sortDirection, setSortBy, setSortDirection]
	);

	const renderSortButtons = () => (
		<div className="flex items-center gap-0.5">
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				title="Ordenar por nombre"
				onClick={() => handleSort('name')}
				data-active={sortBy === 'name'}
			>
				<FileText className={cn('h-3.5 w-3.5', sortBy === 'name' && 'text-primary')} />
				{sortBy === 'name' && (
					<span className="ml-0.5">
						{sortDirection === 'asc' ? (
							<ArrowUp className="h-2.5 w-2.5 text-primary" />
						) : (
							<ArrowDown className="h-2.5 w-2.5 text-primary" />
						)}
					</span>
				)}
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				title="Ordenar por fecha de modificación"
				onClick={() => handleSort('modifiedAt')}
				data-active={sortBy === 'modifiedAt'}
			>
				<Clock className={cn('h-3.5 w-3.5', sortBy === 'modifiedAt' && 'text-primary')} />
				{sortBy === 'modifiedAt' && (
					<span className="ml-0.5">
						{sortDirection === 'asc' ? (
							<ArrowUp className="h-2.5 w-2.5 text-primary" />
						) : (
							<ArrowDown className="h-2.5 w-2.5 text-primary" />
						)}
					</span>
				)}
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				title="Ordenar por fecha de creación"
				onClick={() => handleSort('createdAt')}
				data-active={sortBy === 'createdAt'}
			>
				<Calendar className={cn('h-3.5 w-3.5', sortBy === 'createdAt' && 'text-primary')} />
				{sortBy === 'createdAt' && (
					<span className="ml-0.5">
						{sortDirection === 'asc' ? (
							<ArrowUp className="h-2.5 w-2.5 text-primary" />
						) : (
							<ArrowDown className="h-2.5 w-2.5 text-primary" />
						)}
					</span>
				)}
			</Button>
		</div>
	);

	const renderViewButtons = () => (
		<div className="flex items-center gap-0.5 bg-accent/10 rounded-md p-0.5">
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				onClick={() => setViewMode('grid')}
				title="Vista de cuadrícula"
				data-active={viewMode === 'grid'}
			>
				<Grid className={cn('h-3.5 w-3.5', viewMode === 'grid' && 'text-primary font-bold')} />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				onClick={() => setViewMode('details')}
				title="Vista de detalles"
				data-active={viewMode === 'details'}
			>
				<LayoutGrid className={cn('h-3.5 w-3.5', viewMode === 'details' && 'text-primary font-bold')} />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				onClick={() => setViewMode('tree')}
				title="Vista de árbol"
				data-active={viewMode === 'tree'}
			>
				<GalleryHorizontal className={cn('h-3.5 w-3.5', viewMode === 'tree' && 'text-primary font-bold')} />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				onClick={() => setViewMode('list')}
				title="Vista de lista"
				data-active={viewMode === 'list'}
			>
				<List className={cn('h-3.5 w-3.5', viewMode === 'list' && 'text-primary font-bold')} />
			</Button>
		</div>
	);

	const renderSelectionActions = () => {
		if (selectedItems.length === 0) {
			return null;
		}

		return (
			<div className="flex items-center gap-1.5 bg-accent/10 rounded-md p-0.5">
				<Badge variant="secondary" className="gap-1 text-xs py-0.5 px-1.5">
					<span>{selectedItems.length}</span>
					<span>seleccionado{selectedItems.length !== 1 ? 's' : ''}</span>
				</Badge>

				<Separator orientation="vertical" className="h-5 w-px bg-border" />

				<div className="flex items-center gap-0.5">
					{showDetailsButton && (
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 hover:bg-accent"
							title={isVisible ? 'Ocultar panel de detalles' : 'Mostrar panel de detalles'}
							onClick={toggleVisibility}
							data-active={isVisible}
						>
							<Info className={cn('h-3.5 w-3.5', isVisible && 'text-primary font-bold')} />
						</Button>
					)}
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 hover:bg-accent"
						title="Eliminar archivos seleccionados"
						onClick={handleDeleteSelected}
					>
						<Trash2 className="h-3.5 w-3.5 text-destructive" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 hover:bg-accent"
						title="Descargar archivos seleccionados"
						onClick={handleDownloadSelected}
					>
						<Download className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 hover:bg-accent"
						title="Comprimir archivos seleccionados"
						onClick={handleCompressFiles}
					>
						<Archive className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 hover:bg-accent"
						title="Copiar archivo seleccionado"
						onClick={handleCopySelected}
						disabled={selectedItems.length !== 1}
					>
						<Copy className="h-3.5 w-3.5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 hover:bg-accent"
						title="Limpiar selección"
						onClick={deselectAllFiles}
					>
						<X className="h-3.5 w-3.5" />
					</Button>
					{/* Botón para colapsar/expandir el panel derecho */}
					{isVisible && toggleRightPanelCollapse && (
						<Button
							variant="ghost"
							size="icon"
							className="h-7 w-7 hover:bg-accent"
							title={isRightPanelCollapsed ? 'Expandir panel de detalles' : 'Colapsar panel de detalles'}
							onClick={toggleRightPanelCollapse}
						>
							{isRightPanelCollapsed ? <ArrowLeft className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
						</Button>
					)}
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
					<div className="flex items-center gap-0.5">
						<Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent">
							<Download className="h-3.5 w-3.5" />
						</Button>
						<Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent">
							<Share2 className="h-3.5 w-3.5" />
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
					<div className="flex items-center gap-0.5">
						<Button variant="ghost" size="sm" className="h-7 text-xs px-2">
							<Plus className="h-3.5 w-3.5 mr-1" />
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
					<div className="flex items-center gap-0.5">
						<Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent">
							<Edit className="h-3.5 w-3.5" />
						</Button>
						<Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-accent">
							<Trash2 className="h-3.5 w-3.5 text-destructive" />
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
				return <ImageIcon className="h-3.5 w-3.5 text-primary" />;
			case 'favorites':
				return <Star className="h-3.5 w-3.5 text-amber-500" />;
			case 'search':
				return <Search className="h-3.5 w-3.5 text-blue-500" />;
			case 'collections':
			case 'collection-content':
				return <BookImage className="h-3.5 w-3.5 text-indigo-500" />;
			case 'folders':
			case 'folder-content':
				return <FolderIcon className="h-3.5 w-3.5 text-yellow-500" />;
			case 'tags':
			case 'tag-content':
				return <TagIcon className="h-3.5 w-3.5 text-green-500" />;
			case 'albums':
			case 'album-content':
				return <Camera className="h-3.5 w-3.5 text-purple-500" />;
			case 'characters':
			case 'character-content':
				return <User2 className="h-3.5 w-3.5 text-sky-500" />;
			case 'places':
			case 'place-content':
				return <MapPin className="h-3.5 w-3.5 text-rose-500" />;
			case 'world-items':
			case 'world-item-content':
				return <Box className="h-3.5 w-3.5 text-orange-500" />;
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
			<div className="flex w-full items-center justify-between gap-3 py-1 px-2">
				<div className="flex items-center gap-2">
					<div className="flex items-center justify-center h-7 w-7 rounded-md bg-accent/10">{renderIcon()}</div>
					<div className="flex items-center">
						<ViewBreadcrumbs currentView={currentView as ViewType} currentItem={getCurrentItem() || undefined} />
						<EntityDetails />
					</div>
				</div>

				<div className="flex items-center gap-3">
					{renderSortButtons()}
					<Separator orientation="vertical" className="h-5 w-px bg-border" />
					{renderViewButtons()}
					<Separator orientation="vertical" className="h-5 w-px bg-border" />
					{renderSelectionActions()}
					{renderContextActions()}
				</div>
			</div>
		</motion.div>
	);
}

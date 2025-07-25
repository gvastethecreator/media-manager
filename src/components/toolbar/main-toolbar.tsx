import {
	Archive,
	ArrowDown,
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
	FolderSearch,
	GalleryHorizontal,
	Grid,
	ImageIcon,
	Info,
	LayoutGrid,
	List,
	MapPin,
	PanelLeftClose,
	PanelLeftOpen,
	PanelRightClose,
	PanelRightOpen,
	Plus,
	RefreshCw,
	Search,
	Share2,
	Star,
	TagIcon,
	Trash2,
	User2,
	X,
	ZoomIn,
	ZoomOut,
} from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useDebouncedCallback } from 'use-debounce';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ViewType } from '@/components/views/types';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import { deleteFile, getFileAsDataUrl } from '@/services/file/file.service';
import { useDetailsPanel } from '@/store/details-panel.store';
import { useSelectionStore } from '@/store/ui/selection.slice';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';
import { ViewBreadcrumbs } from '../navigation/breadcrumbs';

export interface ViewToolbarProps {
	isRightPanelCollapsed?: boolean;
	toggleRightPanelCollapse?: () => void;
	isRightPanelVisible?: boolean;
	isLeftPanelCollapsed?: boolean;
	toggleLeftPanelCollapse?: () => void;
	allItemIds?: string[]; // IDs de todos los elementos disponibles para selección
	// Props para acciones de carpeta
	currentFolderId?: string;
	onScanFolder?: () => void;
	onRefreshFolder?: () => void;
	isRetrying?: boolean;
}

export const ViewToolbar = memo<ViewToolbarProps>(function ViewToolbar({
	isRightPanelCollapsed,
	toggleRightPanelCollapse,
	isRightPanelVisible,
	isLeftPanelCollapsed,
	toggleLeftPanelCollapse,
	allItemIds = [],
	currentFolderId,
	onScanFolder,
	onRefreshFolder,
	isRetrying = false,
}) {
	const location = useLocation();
	const currentView = location.pathname.split('/')[1] || 'gallery';

	// 🔄 Usar los nuevos stores de Zustand
	const viewMode = useViewOptionsStore((state: any) => state.viewMode);
	const setViewMode = useViewOptionsStore((state: any) => state.setViewMode);
	const sortOptions = useViewOptionsStore((state: any) => state.sortOptions);
	const addSortOption = useViewOptionsStore((state: any) => state.addSortOption);
	const searchQuery = useViewOptionsStore((state: any) => state.searchQuery);
	const setSearchQuery = useViewOptionsStore((state: any) => state.setSearchQuery);
	const itemSize = useViewOptionsStore((state: any) => state.itemSize);
	const setItemSize = useViewOptionsStore((state: any) => state.setItemSize);

	// 🔄 Store de selección
	const selectedIds = useSelectionStore((state: any) => state.selectedIds);
	const clearSelection = useSelectionStore((state: any) => state.clearSelection);
	const selectAll = useSelectionStore((state: any) => state.selectAll);
	const invertSelection = useSelectionStore((state: any) => state.invertSelection);

	const { isVisible, toggleVisibility } = useDetailsPanel();

	// Lista de vistas que requieren el panel de detalles - memoizada
	const viewsWithDetails = useMemo(
		() => [
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
		],
		[]
	);

	const showDetailsButton = useMemo(() => viewsWithDetails.includes(currentView), [viewsWithDetails, currentView]);

	// Determinar si estamos en la vista de settings para ocultar controles innecesarios
	const isInSettingsView = useMemo(() => location.pathname === '/settings', [location.pathname]);

	// 🔄 Acciones para archivos seleccionados
	const handleDeleteSelected = useCallback(async () => {
		if (selectedIds.length === 0) {
			return;
		}
		toastService.info(`Eliminando ${selectedIds.length} archivo(s)...`);
		try {
			for (const id of selectedIds) {
				// Asumimos que el id del item es la ruta del archivo por ahora
				await deleteFile(id);
			}
			toastService.success(`${selectedIds.length} archivo(s) eliminado(s) correctamente.`);
			clearSelection();
		} catch (error) {
			console.error('Error al eliminar archivos:', error);
			toastService.error('Error al eliminar archivo(s).');
		}
	}, [selectedIds, clearSelection]);

	const handleDownloadSelected = useCallback(async () => {
		if (selectedIds.length === 0) {
			return;
		}
		toastService.info(`Descargando ${selectedIds.length} archivo(s)...`);
		try {
			for (const id of selectedIds) {
				// Asumimos que el id del item es la ruta del archivo por ahora
				const { dataUrl, mimeType } = await getFileAsDataUrl(id);
				const filename = id.split(/[/]/).pop() || 'download';
				const a = document.createElement('a');
				a.href = dataUrl;
				a.download = filename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
			}
			toastService.success(`${selectedIds.length} archivo(s) descargado(s) correctamente.`);
		} catch (error) {
			console.error('Error al descargar archivos:', error);
			toastService.error('Error al descargar archivo(s).');
		}
	}, [selectedIds]);

	const handleCompressFiles = useCallback(() => {
		if (selectedIds.length === 0) {
			return;
		}
		// TODO: Implementar server action para comprimir archivos
		console.warn('La funcionalidad de compresión no está implementada en esta versión');
		toastService.info('La funcionalidad de compresión de archivos estará disponible en una próxima actualización.');
	}, [selectedIds]);

	const handleCopySelected = useCallback(() => {
		if (selectedIds.length === 0) {
			return;
		}
		// TODO: Implementar server action para copiar archivos
	}, [selectedIds]);

	// 🔄 Manejador de ordenación
	const handleSort = useCallback(
		(field: string) => {
			console.log('🔧 Toolbar - handleSort llamado:', { field, currentSortOptions: sortOptions });
			const currentSortOption = sortOptions.find((option: any) => option.field === field);
			if (currentSortOption) {
				// Cambiar dirección si ya existe
				const newOption = {
					field,
					direction: currentSortOption.direction === 'asc' ? 'desc' : 'asc',
				};
				console.log('🔧 Toolbar - Cambiando dirección:', newOption);
				addSortOption(newOption);
			} else {
				// Añadir nueva opción de ordenación
				const newOption = { field, direction: 'asc' };
				console.log('🔧 Toolbar - Añadiendo nueva opción:', newOption);
				addSortOption(newOption);
			}
		},
		[sortOptions, addSortOption]
	);

	// 🔄 Manejador de selección
	const handleSelectAll = useCallback(() => {
		selectAll(allItemIds);
	}, [selectAll, allItemIds]);

	const handleInvertSelection = useCallback(() => {
		invertSelection(allItemIds);
	}, [invertSelection, allItemIds]);

	// 🔄 Manejador de cambio de tamaño optimizado con debounce
	const debouncedSizeChange = useDebouncedCallback(
		(newSize: number) => {
			setItemSize(newSize);
		},
		100 // Debounce de 100ms para evitar renders excesivos
	);

	const handleSizeChange = useCallback(
		(delta: number) => {
			const newSize = Math.max(50, Math.min(300, itemSize + delta));
			// Actualizar inmediatamente el estado local para feedback visual rápido
			setItemSize(newSize);
			// También aplicar el debounce por si el usuario hace múltiples clicks rápidos
			debouncedSizeChange(newSize);
		},
		[itemSize, setItemSize, debouncedSizeChange]
	);

	const renderSortButtons = () => (
		<div className="flex items-center gap-0.5">
			<Button
				variant="ghost"
				size="icon"
				className={cn(
					'h-7 hover:bg-accent',
					sortOptions.some((opt: any) => opt.field === 'name') ? 'w-10 bg-accent/50' : 'w-7'
				)}
				title="Ordenar por nombre"
				onClick={() => handleSort('name')}
				data-active={sortOptions.some((opt: any) => opt.field === 'name')}
			>
				<div className="flex items-center justify-center gap-0.5">
					<FileText className={cn('h-3.5 w-3.5', sortOptions.some((opt: any) => opt.field === 'name') ? 'text-primary' : 'text-muted-foreground')} />
					{sortOptions.some((opt: any) => opt.field === 'name') && (
						<div className="flex items-center">
							{sortOptions.find((opt: any) => opt.field === 'name')?.direction === 'asc' ? (
								<ArrowUp className="h-2.5 w-2.5 text-primary" />
							) : (
								<ArrowDown className="h-2.5 w-2.5 text-primary" />
							)}
						</div>
					)}
				</div>
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className={cn(
					'h-7 hover:bg-accent',
					sortOptions.some((opt: any) => opt.field === 'modifiedAt') ? 'w-10 bg-accent/50' : 'w-7'
				)}
				title="Ordenar por fecha de modificación"
				onClick={() => handleSort('modifiedAt')}
				data-active={sortOptions.some((opt: any) => opt.field === 'modifiedAt')}
			>
				<div className="flex items-center justify-center gap-0.5">
					<Clock className={cn('h-3.5 w-3.5', sortOptions.some((opt: any) => opt.field === 'modifiedAt') ? 'text-primary' : 'text-muted-foreground')} />
					{sortOptions.some((opt: any) => opt.field === 'modifiedAt') && (
						<div className="flex items-center">
							{sortOptions.find((opt: any) => opt.field === 'modifiedAt')?.direction === 'asc' ? (
								<ArrowUp className="h-2.5 w-2.5 text-primary" />
							) : (
								<ArrowDown className="h-2.5 w-2.5 text-primary" />
							)}
						</div>
					)}
				</div>
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className={cn(
					'h-7 hover:bg-accent',
					sortOptions.some((opt: any) => opt.field === 'createdAt') ? 'w-10 bg-accent/50' : 'w-7'
				)}
				title="Ordenar por fecha de creación"
				onClick={() => handleSort('createdAt')}
				data-active={sortOptions.some((opt: any) => opt.field === 'createdAt')}
			>
				<div className="flex items-center justify-center gap-0.5">
					<Calendar
						className={cn('h-3.5 w-3.5', sortOptions.some((opt: any) => opt.field === 'createdAt') ? 'text-primary' : 'text-muted-foreground')}
					/>
					{sortOptions.some((opt: any) => opt.field === 'createdAt') && (
						<div className="flex items-center">
							{sortOptions.find((opt: any) => opt.field === 'createdAt')?.direction === 'asc' ? (
								<ArrowUp className="h-2.5 w-2.5 text-primary" />
							) : (
								<ArrowDown className="h-2.5 w-2.5 text-primary" />
							)}
						</div>
					)}
				</div>
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
				onClick={() => setViewMode('cards')}
				title="Vista de tarjetas"
				data-active={viewMode === 'cards'}
			>
				<LayoutGrid className={cn('h-3.5 w-3.5', viewMode === 'cards' && 'text-primary font-bold')} />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				onClick={() => setViewMode('masonry')}
				title="Vista de mosaico"
				data-active={viewMode === 'masonry'}
			>
				<GalleryHorizontal className={cn('h-3.5 w-3.5', viewMode === 'masonry' && 'text-primary font-bold')} />
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
		if (selectedIds.length === 0) return null;

		return (
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				exit={{ opacity: 0, y: -10 }}
				className="flex items-center gap-1 ml-2"
			>
				<Badge variant="secondary" className="h-5 px-1.5">
					{selectedIds.length} {selectedIds.length === 1 ? 'seleccionado' : 'seleccionados'}
				</Badge>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={clearSelection}
					title="Limpiar selección"
				>
					<X className="h-3.5 w-3.5" />
				</Button>
				<Separator orientation="vertical" className="h-4 mx-1" />
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={handleSelectAll}
					title="Seleccionar todo"
				>
					<Plus className="h-3.5 w-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={handleInvertSelection}
					title="Invertir selección"
				>
					<ArrowRight className="h-3.5 w-3.5" />
				</Button>
				<Separator orientation="vertical" className="h-4 mx-1" />
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={handleDeleteSelected}
					title="Eliminar seleccionados"
				>
					<Trash2 className="h-3.5 w-3.5 text-destructive" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={handleDownloadSelected}
					title="Descargar seleccionados"
				>
					<Download className="h-3.5 w-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={handleCopySelected}
					title="Copiar seleccionados"
				>
					<Copy className="h-3.5 w-3.5" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 hover:bg-accent"
					onClick={handleCompressFiles}
					title="Comprimir seleccionados"
				>
					<Archive className="h-3.5 w-3.5" />
				</Button>
			</motion.div>
		);
	};

	// 🔄 Añadir controles de tamaño
	const renderSizeControls = () => (
		<div className="flex items-center gap-0.5">
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				onClick={() => handleSizeChange(-10)}
				title="Reducir tamaño de miniaturas"
			>
				<ZoomOut className="h-3.5 w-3.5" />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				className="h-7 w-7 hover:bg-accent"
				onClick={() => handleSizeChange(10)}
				title="Aumentar tamaño de miniaturas"
			>
				<ZoomIn className="h-3.5 w-3.5" />
			</Button>
		</div>
	);

	// 🔄 Añadir campo de búsqueda
	const renderSearchInput = () => (
		<div className="flex items-center gap-1 ml-2">
			<div className="relative">
				<Search className="h-3.5 w-3.5 absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
				<input
					type="text"
					placeholder="Buscar..."
					className="h-7 pl-7 pr-2 rounded-md bg-accent/10 border-none focus:ring-1 focus:ring-primary text-sm"
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
				{searchQuery && (
					<Button
						variant="ghost"
						size="icon"
						className="h-5 w-5 absolute right-1 top-1/2 transform -translate-y-1/2 hover:bg-accent"
						onClick={() => setSearchQuery('')}
						title="Limpiar búsqueda"
					>
						<X className="h-2.5 w-2.5" />
					</Button>
				)}
			</div>
		</div>
	);

	const renderContextActions = () => {
		switch (currentView) {
			case 'collection-content':
				return (
					<div className="flex items-center gap-0.5">
						<Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-accent">
							<Plus className="h-3.5 w-3.5 mr-1" />
							<span className="text-xs">Añadir imágenes</span>
						</Button>
						<Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-accent">
							<Edit className="h-3.5 w-3.5 mr-1" />
							<span className="text-xs">Editar colección</span>
						</Button>
						<Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-accent">
							<Share2 className="h-3.5 w-3.5 mr-1" />
							<span className="text-xs">Compartir</span>
						</Button>
					</div>
				);
			case 'folder-content':
				return (
					<div className="flex items-center gap-0.5">
						{/* Botones de escanear y recargar carpeta */}
						{currentFolderId && onScanFolder && (
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-2 hover:bg-accent"
								onClick={onScanFolder}
								disabled={isRetrying}
							>
								<FolderSearch className="h-3.5 w-3.5 mr-1" />
								<span className="text-xs">{isRetrying ? 'Escaneando...' : 'Escanear'}</span>
							</Button>
						)}
						{currentFolderId && onRefreshFolder && (
							<Button
								variant="ghost"
								size="sm"
								className="h-7 px-2 hover:bg-accent"
								onClick={onRefreshFolder}
								disabled={isRetrying}
							>
								<RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
								<span className="text-xs">{isRetrying ? 'Recargando...' : 'Recargar'}</span>
							</Button>
						)}
						{(currentFolderId && (onScanFolder || onRefreshFolder)) && (
							<Separator orientation="vertical" className="h-4 mx-1" />
						)}
						<Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-accent">
							<Plus className="h-3.5 w-3.5 mr-1" />
							<span className="text-xs">Nueva carpeta</span>
						</Button>
						<Button variant="ghost" size="sm" className="h-7 px-2 hover:bg-accent">
							<ImageIcon className="h-3.5 w-3.5 mr-1" />
							<span className="text-xs">Subir imágenes</span>
						</Button>
					</div>
				);
			default:
				return null;
		}
	};

	const _renderIcon = () => {
		switch (currentView) {
			case 'all-images':
				return <ImageIcon className="h-4 w-4 mr-2 text-primary" />;
			case 'favorites':
				return <Star className="h-4 w-4 mr-2 text-yellow-500" />;
			case 'collection-content':
				return <BookImage className="h-4 w-4 mr-2 text-blue-500" />;
			case 'folder-content':
				return <FolderIcon className="h-4 w-4 mr-2 text-yellow-500" />;
			case 'tag-content':
				return <TagIcon className="h-4 w-4 mr-2 text-green-500" />;
			case 'album-content':
				return <Camera className="h-4 w-4 mr-2 text-purple-500" />;
			case 'character-content':
				return <User2 className="h-4 w-4 mr-2 text-red-500" />;
			case 'place-content':
				return <MapPin className="h-4 w-4 mr-2 text-cyan-500" />;
			case 'world-item-content':
				return <Box className="h-4 w-4 mr-2 text-orange-500" />;
			default:
				return null;
		}
	};

	return (
		<div className="flex items-center justify-between h-10 px-2 border-b">
			{/* Lado izquierdo: Botón colapsar panel izquierdo + breadcrumbs + selecciones */}
			<div className="flex items-center gap-2">
				{/* Botón de colapsar panel izquierdo */}
				{toggleLeftPanelCollapse && (
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 hover:bg-accent"
						onClick={toggleLeftPanelCollapse}
						title={isLeftPanelCollapsed ? 'Abrir panel izquierdo' : 'Cerrar panel izquierdo'}
					>
						{isLeftPanelCollapsed ? (
							<PanelLeftOpen className="h-3.5 w-3.5" />
						) : (
							<PanelLeftClose className="h-3.5 w-3.5" />
						)}
					</Button>
				)}

				<ViewBreadcrumbs currentView={currentView as ViewType} />
				{renderSelectionActions()}
			</div>

			{/* Lado derecho: Controles de vista + botón colapsar panel derecho */}
			<div className="flex items-center gap-2">
				{!isInSettingsView && renderSearchInput()}
				{!isInSettingsView && renderSortButtons()}
				{!isInSettingsView && renderViewButtons()}
				{!isInSettingsView && renderSizeControls()}
				{!isInSettingsView && renderContextActions()}

				{!isInSettingsView && showDetailsButton && (
					<Button
						variant="ghost"
						size="icon"
						className={cn('h-7 w-7 hover:bg-accent', isVisible && 'bg-accent')}
						onClick={toggleVisibility}
						title={isVisible ? 'Ocultar detalles' : 'Mostrar detalles'}
					>
						<Info className="h-3.5 w-3.5" />
					</Button>
				)}

				{/* Botón de colapsar panel derecho */}
				{!isInSettingsView && toggleRightPanelCollapse && (
					<Button
						variant="ghost"
						size="icon"
						className="h-7 w-7 hover:bg-accent"
						onClick={toggleRightPanelCollapse}
						title={isRightPanelCollapsed ? 'Abrir panel derecho' : 'Cerrar panel derecho'}
					>
						{isRightPanelCollapsed ? (
							<PanelRightOpen className="h-3.5 w-3.5" />
						) : (
							<PanelRightClose className="h-3.5 w-3.5" />
						)}
					</Button>
				)}
			</div>
		</div>
	);
});

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
// Eliminado dropdown de cambio de vista (no debe existir)
import { Separator } from '@/components/ui/separator';
import { ViewType } from '@/components/views/types';
import { useDebouncedViewMode } from '@/hooks/use-debounced-view-mode';
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
	isLeftPanelCollapsed?: boolean;
	toggleLeftPanelCollapse?: () => void;
	allItemIds?: string[]; // IDs de todos los elementos disponibles para selección
	// Props para acciones de carpeta
	currentFolderId?: string;
	onScanFolder?: () => void;
	onRefreshFolder?: () => void;
	isRetrying?: boolean;
}

// Regex a nivel superior para rendimiento
const SLASH_REGEX = /\//;

export const ViewToolbar = memo<ViewToolbarProps>(function ViewToolbarInner({
	isRightPanelCollapsed,
	toggleRightPanelCollapse,
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

	// Crear versión debounced del setViewMode para mejorar performance
	const { setViewMode: setViewModeDebounced } = useDebouncedViewMode();

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
			await Promise.all(
				selectedIds.map(async (id: string) => {
					// Asumimos que el id del item es la ruta del archivo por ahora
					await deleteFile(id);
				})
			);
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
			const fileDatas = await Promise.all(
				selectedIds.map(async (id: string) => {
					const { dataUrl } = await getFileAsDataUrl(id);
					return { id, dataUrl };
				})
			);

			for (const { id, dataUrl } of fileDatas) {
				const filename = id.split(SLASH_REGEX).pop() || 'download';
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
			// Usar nombres públicos; el comparador soporta alias (modifiedAt/createdAt)
			const current = sortOptions.find((option: any) => option.field === field);
			if (current) {
				addSortOption({ field, direction: current.direction === 'asc' ? 'desc' : 'asc' });
			} else {
				addSortOption({ field, direction: 'asc' });
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

	const renderSortButtons = () => {
		const isNameActive = sortOptions.some((opt: any) => opt.field === 'name');
		const nameOpt = sortOptions.find((opt: any) => opt.field === 'name');
		const modifiedOpt = sortOptions.find((opt: any) => opt.field === 'modifiedAt' || opt.field === 'modifiedTime');
		const createdOpt = sortOptions.find((opt: any) => opt.field === 'createdAt' || opt.field === 'createdTime');

		const btnClass = (active: boolean) => cn('h-7 hover:bg-accent', active ? 'w-10 bg-accent/50' : 'w-7');
		const dirIcon = (dir?: 'asc' | 'desc') =>
			dir ? (
				dir === 'asc' ? (
					<ArrowUp className="h-2.5 w-2.5 text-primary" />
				) : (
					<ArrowDown className="h-2.5 w-2.5 text-primary" />
				)
			) : null;

		return (
			<div className="flex items-center gap-0.5">
				<Button
					className={btnClass(isNameActive)}
					data-active={isNameActive}
					onClick={() => handleSort('name')}
					size="icon"
					title="Ordenar por nombre"
					variant="ghost"
				>
					<div className="flex items-center justify-center gap-0.5">
						<FileText className={cn('h-3.5 w-3.5', isNameActive ? 'text-primary' : 'text-muted-foreground')} />
						{dirIcon(nameOpt?.direction)}
					</div>
				</Button>
				<Button
					className={btnClass(!!modifiedOpt)}
					data-active={!!modifiedOpt}
					onClick={() => handleSort('modifiedAt')}
					size="icon"
					title="Ordenar por fecha de modificación"
					variant="ghost"
				>
					<div className="flex items-center justify-center gap-0.5">
						<Clock className={cn('h-3.5 w-3.5', modifiedOpt ? 'text-primary' : 'text-muted-foreground')} />
						{dirIcon(modifiedOpt?.direction)}
					</div>
				</Button>
				<Button
					className={btnClass(!!createdOpt)}
					data-active={!!createdOpt}
					onClick={() => handleSort('createdAt')}
					size="icon"
					title="Ordenar por fecha de creación"
					variant="ghost"
				>
					<div className="flex items-center justify-center gap-0.5">
						<Calendar className={cn('h-3.5 w-3.5', createdOpt ? 'text-primary' : 'text-muted-foreground')} />
						{dirIcon(createdOpt?.direction)}
					</div>
				</Button>
			</div>
		);
	};

	const renderViewButtons = () => (
		<div className="flex items-center gap-1 rounded-md bg-accent/10 p-0.5">
			<Button
				className="h-7 w-7 hover:bg-accent"
				data-active={viewMode === 'grid'}
				data-testid="view-mode-grid-btn"
				onClick={() => setViewMode('grid')}
				size="icon"
				title="Vista de cuadrícula"
				variant="ghost"
			>
				<Grid className={cn('h-3.5 w-3.5', viewMode === 'grid' && 'font-bold text-primary')} />
			</Button>
			<Button
				className="h-7 w-7 hover:bg-accent"
				data-active={viewMode === 'cards'}
				data-testid="view-mode-cards-btn"
				onClick={() => setViewMode('cards')}
				size="icon"
				title="Vista de tarjetas"
				variant="ghost"
			>
				<LayoutGrid className={cn('h-3.5 w-3.5', viewMode === 'cards' && 'font-bold text-primary')} />
			</Button>
			<Button
				className="h-7 w-7 hover:bg-accent"
				data-active={viewMode === 'masonry'}
				data-testid="view-mode-masonry-btn"
				onClick={() => setViewModeDebounced('masonry')}
				size="icon"
				title="Vista de mosaico"
				variant="ghost"
			>
				<GalleryHorizontal className={cn('h-3.5 w-3.5', viewMode === 'masonry' && 'font-bold text-primary')} />
			</Button>
			<Button
				className="h-7 w-7 hover:bg-accent"
				data-active={viewMode === 'list'}
				data-testid="view-mode-list-btn"
				onClick={() => setViewMode('list')}
				size="icon"
				title="Vista de lista"
				variant="ghost"
			>
				<List className={cn('h-3.5 w-3.5', viewMode === 'list' && 'font-bold text-primary')} />
			</Button>
		</div>
	);

	const renderSelectionActions = () => {
		if (selectedIds.length === 0) {
			return null;
		}
		return (
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="ml-2 flex items-center gap-1"
				exit={{ opacity: 0, y: -10 }}
				initial={{ opacity: 0, y: -10 }}
			>
				<Badge className="h-5 px-1.5" variant="secondary">
					{selectedIds.length} {selectedIds.length === 1 ? 'seleccionado' : 'seleccionados'}
				</Badge>
				<Button className="h-6 w-6 hover:bg-accent" onClick={clearSelection} size="icon" variant="ghost">
					<X className="h-3.5 w-3.5" />
				</Button>
				<Button
					className="h-6 w-6 hover:bg-accent"
					onClick={handleSelectAll}
					size="icon"
					title="Seleccionar todo"
					variant="ghost"
				>
					<Plus className="h-3.5 w-3.5" />
				</Button>
				<Button
					className="h-6 w-6 hover:bg-accent"
					onClick={handleInvertSelection}
					size="icon"
					title="Invertir selección"
					variant="ghost"
				>
					<ArrowRight className="h-3.5 w-3.5" />
				</Button>
				<Separator className="mx-1 h-4" orientation="vertical" />
				<Button
					className="h-6 w-6 hover:bg-accent"
					onClick={handleDeleteSelected}
					size="icon"
					title="Eliminar seleccionados"
					variant="ghost"
				>
					<Trash2 className="h-3.5 w-3.5 text-destructive" />
				</Button>
				<Button
					className="h-6 w-6 hover:bg-accent"
					onClick={handleDownloadSelected}
					size="icon"
					title="Descargar seleccionados"
					variant="ghost"
				>
					<Download className="h-3.5 w-3.5" />
				</Button>
				<Button
					className="h-6 w-6 hover:bg-accent"
					onClick={handleCopySelected}
					size="icon"
					title="Copiar seleccionados"
					variant="ghost"
				>
					<Copy className="h-3.5 w-3.5" />
				</Button>
				<Button
					className="h-6 w-6 hover:bg-accent"
					onClick={handleCompressFiles}
					size="icon"
					title="Comprimir seleccionados"
					variant="ghost"
				>
					<Archive className="h-3.5 w-3.5" />
				</Button>
			</motion.div>
		);
	};

	const renderSizeControls = () => (
		<div className="flex items-center gap-0.5">
			<Button
				className="h-7 w-7 hover:bg-accent"
				onClick={() => handleSizeChange(-10)}
				size="icon"
				title="Reducir tamaño de miniaturas"
				variant="ghost"
			>
				<ZoomOut className="h-3.5 w-3.5" />
			</Button>
			<Button
				className="h-7 w-7 hover:bg-accent"
				onClick={() => handleSizeChange(10)}
				size="icon"
				title="Aumentar tamaño de miniaturas"
				variant="ghost"
			>
				<ZoomIn className="h-3.5 w-3.5" />
			</Button>
		</div>
	);

	// 🔄 Añadir campo de búsqueda
	const renderSearchInput = () => (
		<div className="ml-2 flex items-center gap-1">
			<div className="relative">
				<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-3.5 w-3.5 transform text-muted-foreground" />
				<input
					className="h-7 rounded-md border-none bg-accent/10 pr-2 pl-7 text-sm focus:ring-1 focus:ring-primary"
					onChange={(e) => setSearchQuery(e.target.value)}
					placeholder="Buscar..."
					type="text"
					value={searchQuery}
				/>
				{searchQuery && (
					<Button
						className="-translate-y-1/2 absolute top-1/2 right-1 h-5 w-5 transform hover:bg-accent"
						onClick={() => setSearchQuery('')}
						size="icon"
						title="Limpiar búsqueda"
						variant="ghost"
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
						<Button className="h-7 px-2 hover:bg-accent" size="sm" variant="ghost">
							<Plus className="mr-1 h-3.5 w-3.5" />
							<span className="text-xs">Añadir imágenes</span>
						</Button>
						<Button className="h-7 px-2 hover:bg-accent" size="sm" variant="ghost">
							<Edit className="mr-1 h-3.5 w-3.5" />
							<span className="text-xs">Editar colección</span>
						</Button>
						<Button className="h-7 px-2 hover:bg-accent" size="sm" variant="ghost">
							<Share2 className="mr-1 h-3.5 w-3.5" />
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
								className="h-7 px-2 hover:bg-accent"
								disabled={isRetrying}
								onClick={onScanFolder}
								size="sm"
								variant="ghost"
							>
								<FolderSearch className="mr-1 h-3.5 w-3.5" />
								<span className="text-xs">{isRetrying ? 'Escaneando...' : 'Escanear'}</span>
							</Button>
						)}
						{currentFolderId && onRefreshFolder && (
							<Button
								className="h-7 px-2 hover:bg-accent"
								disabled={isRetrying}
								onClick={onRefreshFolder}
								size="sm"
								variant="ghost"
							>
								<RefreshCw className={`mr-1 h-3.5 w-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
								<span className="text-xs">{isRetrying ? 'Recargando...' : 'Recargar'}</span>
							</Button>
						)}
						{currentFolderId && (onScanFolder || onRefreshFolder) && (
							<Separator className="mx-1 h-4" orientation="vertical" />
						)}
						<Button className="h-7 px-2 hover:bg-accent" size="sm" variant="ghost">
							<Plus className="mr-1 h-3.5 w-3.5" />
							<span className="text-xs">Nueva carpeta</span>
						</Button>
						<Button className="h-7 px-2 hover:bg-accent" size="sm" variant="ghost">
							<ImageIcon className="mr-1 h-3.5 w-3.5" />
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
				return <ImageIcon className="mr-2 h-4 w-4 text-primary" />;
			case 'favorites':
				return <Star className="mr-2 h-4 w-4 text-yellow-500" />;
			case 'collection-content':
				return <BookImage className="mr-2 h-4 w-4 text-blue-500" />;
			case 'folder-content':
				return <FolderIcon className="mr-2 h-4 w-4 text-yellow-500" />;
			case 'tag-content':
				return <TagIcon className="mr-2 h-4 w-4 text-green-500" />;
			case 'album-content':
				return <Camera className="mr-2 h-4 w-4 text-purple-500" />;
			case 'character-content':
				return <User2 className="mr-2 h-4 w-4 text-red-500" />;
			case 'place-content':
				return <MapPin className="mr-2 h-4 w-4 text-cyan-500" />;
			case 'world-item-content':
				return <Box className="mr-2 h-4 w-4 text-orange-500" />;
			default:
				return null;
		}
	};

	return (
		<div className="flex h-10 items-center justify-between border-b px-2">
			{/* Lado izquierdo: Botón colapsar panel izquierdo + breadcrumbs + selecciones */}
			<div className="flex items-center gap-2">
				{/* Botón de colapsar panel izquierdo */}
				{toggleLeftPanelCollapse && (
					<Button
						className="h-7 w-7 hover:bg-accent"
						onClick={toggleLeftPanelCollapse}
						size="icon"
						title={isLeftPanelCollapsed ? 'Abrir panel izquierdo' : 'Cerrar panel izquierdo'}
						variant="ghost"
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
						className={cn('h-7 w-7 hover:bg-accent', isVisible && 'bg-accent')}
						onClick={toggleVisibility}
						size="icon"
						title={isVisible ? 'Ocultar detalles' : 'Mostrar detalles'}
						variant="ghost"
					>
						<Info className="h-3.5 w-3.5" />
					</Button>
				)}

				{/* Botón de colapsar panel derecho */}
				{!isInSettingsView && toggleRightPanelCollapse && (
					<Button
						className="h-7 w-7 hover:bg-accent"
						onClick={toggleRightPanelCollapse}
						size="icon"
						title={isRightPanelCollapsed ? 'Abrir panel derecho' : 'Cerrar panel derecho'}
						variant="ghost"
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

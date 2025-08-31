import {
	Archive,
	ArrowDown,
	ArrowRight,
	ArrowUp,
	Calendar,
	Clock,
	Copy,
	Download,
	Edit,
	FileText,
	GalleryHorizontal,
	Grid,
	Info,
	LayoutGrid,
	List as ListIcon,
	PanelLeftClose,
	PanelLeftOpen,
	PanelRightClose,
	PanelRightOpen,
	Plus,
	Settings,
	SortAsc,
	Table as TableIcon,
	Tags,
	Trash2,
	X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { memo, useCallback, useMemo } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
// Reintroducido: dropdown para cambio de vista (compacta espacio en toolbar)
import { Separator } from '@/components/ui/separator';
import { ViewType } from '@/components/views/types';
import { useDebouncedViewMode } from '@/hooks/use-debounced-view-mode';
import { useFolder, useFolderName } from '@/lib/api/folders';
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
}) {
	const location = useLocation();
	const params = useParams<{ id: string }>();
	const currentView = location.pathname.split('/')[1] || 'gallery';

	// Obtener el folderId de los parámetros de la URL cuando estamos en una vista de carpeta
	const folderId = params.id;

	// Obtener información de la carpeta si estamos en folder-content view
	const { data: folderData } = useFolder(folderId || '');
	const { data: folderName } = useFolderName(folderId || '');

	// Preparar currentItem para el breadcrumb
	const currentItem = useMemo(() => {
		if (currentView === 'folders' && folderId && folderData) {
			return {
				id: folderData.id,
				name: folderName || folderData.name,
				path: folderData.path,
				description: folderData.description || undefined,
				emoji: folderData.emoji || undefined,
				color: folderData.color || undefined,
				totalSize: folderData.totalSize,
				lastIndexed: folderData.lastIndexed ? new Date(folderData.lastIndexed) : undefined,
				createdAt: folderData.createdAt ? new Date(folderData.createdAt) : undefined,
				_count: { images: folderData.totalFiles || 0 },
			};
		}
		return;
	}, [currentView, folderId, folderData, folderName]);

	// 🔄 Usar los nuevos stores de Zustand
	const viewMode = useViewOptionsStore((state: any) => state.viewMode);
	const setViewMode = useViewOptionsStore((state: any) => state.setViewMode);
	const sortOptions = useViewOptionsStore((state: any) => state.sortOptions);
	const setSortOptions = useViewOptionsStore((state: any) => state.setSortOptions);
	const searchQuery = useViewOptionsStore((state: any) => state.searchQuery);
	const setSearchQuery = useViewOptionsStore((state: any) => state.setSearchQuery);
	const groupByEntityType = useViewOptionsStore((state: any) => state.groupByEntityType);
	const toggleGroupByEntityType = useViewOptionsStore((state: any) => state.toggleGroupByEntityType);
	// tamaño de item no utilizado en esta toolbar

	// Crear versión debounced del setViewMode para mejorar performance
	const { setViewMode: setViewModeDebounced } = useDebouncedViewMode();

	// 🔄 Store de selección
	const selectedIds = useSelectionStore((state: any) => state.selectedIds);
	const clearSelection = useSelectionStore((state: any) => state.clearSelection);
	const selectAll = useSelectionStore((state: any) => state.selectAll);
	const invertSelection = useSelectionStore((state: any) => state.invertSelection);

	const { isVisible, toggleVisibility, showInterfaceSettings, setShowInterfaceSettings, setVisible } =
		useDetailsPanel() as any;

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

	// 🔄 Manejador de ordenación exclusiva (solo uno activo a la vez)
	const handleSort = useCallback(
		(field: string) => {
			// Verificar si ya existe un ordenamiento por este campo
			const current = sortOptions.find((option: any) => option.field === field);

			if (current) {
				// Si existe, cambiar la dirección (asc/desc)
				const newDirection = current.direction === 'asc' ? 'desc' : 'asc';
				// Usar setSortOptions para reemplazar TODA la lista con solo este ordenamiento
				setSortOptions([{ field, direction: newDirection }]);
			} else {
				// Si no existe, crear nuevo ordenamiento exclusivo
				// Usar setSortOptions para reemplazar TODA la lista con solo este ordenamiento
				setSortOptions([{ field, direction: 'asc' }]);
			}
		},
		[sortOptions, setSortOptions]
	);

	// 🔄 Manejador de selección
	const handleSelectAll = useCallback(() => {
		selectAll(allItemIds);
	}, [selectAll, allItemIds]);

	const handleInvertSelection = useCallback(() => {
		invertSelection(allItemIds);
	}, [invertSelection, allItemIds]);

	// 🔄 Manejador de cambio de tamaño optimizado con debounce
	// sin debounce de tamaño

	// controles de tamaño no usados en esta toolbar minimal

	const renderSortButtons = () => {
		const sortOptions_any = sortOptions as Array<{ field: string; direction: 'asc' | 'desc' }>;
		const nameOpt = sortOptions_any.find((opt) => opt.field === 'name');
		const modifiedOpt = sortOptions_any.find((opt) => opt.field === 'modifiedAt' || opt.field === 'modifiedTime');
		const createdOpt = sortOptions_any.find((opt) => opt.field === 'createdAt' || opt.field === 'createdTime');
		const typeOpt = sortOptions_any.find((opt) => opt.field === 'type' || opt.field === 'entityType');

		const getCurrentSort = () => {
			if (nameOpt) return { field: 'name', direction: nameOpt.direction };
			if (modifiedOpt) return { field: 'modifiedAt', direction: modifiedOpt.direction };
			if (createdOpt) return { field: 'createdAt', direction: createdOpt.direction };
			if (typeOpt) return { field: 'type', direction: typeOpt.direction };
			return null;
		};

		const currentSort = getCurrentSort();

		const getSortLabel = () => {
			if (!currentSort) return 'Ordenar';
			const labels = {
				name: 'Nombre',
				modifiedAt: 'Modificado',
				createdAt: 'Creado',
				type: 'Tipo',
			};
			const label = labels[currentSort.field as keyof typeof labels] || 'Ordenar';
			return `${label} ${currentSort.direction === 'asc' ? '↑' : '↓'}`;
		};

		return (
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button
						className="h-7 px-2 hover:bg-accent"
						data-testid="sort-dropdown-trigger"
						title="Ordenar archivos"
						variant="ghost"
					>
						<SortAsc className="mr-1 h-3.5 w-3.5" />
						<span className="text-xs">{getSortLabel()}</span>
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-48">
					<DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
					<DropdownMenuSeparator />
					<DropdownMenuRadioGroup
						onValueChange={(value) => {
							const [field, direction] = value.split('-');
							handleSort(field);
						}}
						value={currentSort ? `${currentSort.field}-${currentSort.direction}` : ''}
					>
						<DropdownMenuRadioItem value={`name-${nameOpt?.direction || 'asc'}`}>
							<div className="flex items-center gap-2">
								<FileText className="h-4 w-4" />
								<span>Nombre</span>
								{nameOpt && (
									<span className="ml-auto">
										{nameOpt.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
									</span>
								)}
							</div>
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value={`modifiedAt-${modifiedOpt?.direction || 'asc'}`}>
							<div className="flex items-center gap-2">
								<Clock className="h-4 w-4" />
								<span>Fecha modificación</span>
								{modifiedOpt && (
									<span className="ml-auto">
										{modifiedOpt.direction === 'asc' ? (
											<ArrowUp className="h-3 w-3" />
										) : (
											<ArrowDown className="h-3 w-3" />
										)}
									</span>
								)}
							</div>
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value={`createdAt-${createdOpt?.direction || 'asc'}`}>
							<div className="flex items-center gap-2">
								<Calendar className="h-4 w-4" />
								<span>Fecha creación</span>
								{createdOpt && (
									<span className="ml-auto">
										{createdOpt.direction === 'asc' ? (
											<ArrowUp className="h-3 w-3" />
										) : (
											<ArrowDown className="h-3 w-3" />
										)}
									</span>
								)}
							</div>
						</DropdownMenuRadioItem>
						<DropdownMenuRadioItem value={`type-${typeOpt?.direction || 'asc'}`}>
							<div className="flex items-center gap-2">
								<Tags className="h-4 w-4" />
								<span>Tipo de archivo</span>
								{typeOpt && (
									<span className="ml-auto">
										{typeOpt.direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
									</span>
								)}
							</div>
						</DropdownMenuRadioItem>
					</DropdownMenuRadioGroup>
				</DropdownMenuContent>
			</DropdownMenu>
		);
	};

	const renderViewButtons = () => {
		const viewIcon = () => {
			switch (viewMode) {
				case 'grid':
					return <Grid className="h-4 w-4" />;
				case 'cards':
					return <LayoutGrid className="h-4 w-4" />;
				case 'masonry':
					return <GalleryHorizontal className="h-4 w-4" />;
				case 'list':
					return <ListIcon className="h-4 w-4" />;
				case 'table':
					return <TableIcon className="h-4 w-4" />;
				default:
					return <Grid className="h-4 w-4" />;
			}
		};

		const handleChangeView = (mode: string) => {
			setViewMode(mode as any);
		};

		return (
			<div className="flex items-center gap-0.5">
				<Button
					aria-label="Agrupar por tipo de archivo"
					aria-pressed={groupByEntityType}
					data-active={groupByEntityType}
					data-testid="toggle-group-type-btn"
					onClick={toggleGroupByEntityType}
					size="icon"
					title="Agrupar por tipo de archivo"
					variant={groupByEntityType ? 'secondary' : 'ghost'}
				>
					<Tags className="h-4 w-4" />
				</Button>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button className="h-7 px-2" data-testid="view-mode-dropdown-trigger" title="Cambiar vista" variant="ghost">
							{viewIcon()}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-40">
						<DropdownMenuLabel>Modo de vista</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuRadioGroup onValueChange={handleChangeView} value={viewMode}>
							<DropdownMenuRadioItem data-testid="view-mode-grid-btn" value="grid">
								<div className="flex items-center gap-2">
									<Grid className="h-4 w-4" />
									<span>Grid</span>
								</div>
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem data-testid="view-mode-cards-btn" value="cards">
								<div className="flex items-center gap-2">
									<LayoutGrid className="h-4 w-4" />
									<span>Cards</span>
								</div>
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem data-testid="view-mode-masonry-btn" value="masonry">
								<div className="flex items-center gap-2">
									<GalleryHorizontal className="h-4 w-4" />
									<span>Masonry</span>
								</div>
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem data-testid="view-mode-list-btn" value="list">
								<div className="flex items-center gap-2">
									<ListIcon className="h-4 w-4" />
									<span>Lista</span>
								</div>
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem data-testid="view-mode-table-btn" value="table">
								<div className="flex items-center gap-2">
									<TableIcon className="h-4 w-4" />
									<span>Tabla</span>
								</div>
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		);
	};

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

	// 🔄 Añadir campo de búsqueda
	const renderSearchInput = () => (
		<div className="ml-0 flex items-center gap-1">
			<div className="relative">
				<input
					className="h-5 rounded-xs border-none bg-background p-1 pr-2 pl-2 text-xs"
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
							<Edit className="mr-1 h-3.5 w-3.5" />
						</Button>
					</div>
				);
			case 'folder-content':
				return null;
			default:
				return null;
		}
	};

	return (
		<div className="flex h-10 items-center justify-between whitespace-nowrap border-2 border-background bg-secondary p-2">
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

				<ViewBreadcrumbs currentItem={currentItem} currentView={currentView as ViewType} />
				{renderSelectionActions()}
			</div>

			{/* Lado derecho: Controles de vista + botón colapsar panel derecho */}
			<div className="flex items-center gap-2">
				{!isInSettingsView && renderSearchInput()}
				{!isInSettingsView && renderSortButtons()}
				{!isInSettingsView && renderViewButtons()}
				{!isInSettingsView && renderContextActions()}

				{/* Botón abrir configuraciones de vista dentro del panel derecho */}
				{!isInSettingsView && (
					<Button
						className={cn('h-7 w-7 hover:bg-accent', showInterfaceSettings && 'bg-accent')}
						onClick={() => {
							// Activar panel si está oculto y mostrar configuraciones
							if (!isVisible) {
								setVisible(true);
							}
							// Si el panel derecho está colapsado, intentar expandirlo si hay handler
							if (isRightPanelCollapsed && toggleRightPanelCollapse) {
								try {
									toggleRightPanelCollapse();
								} catch {
									/* noop */
								}
							}
							// Si ya está activo, cerrar; si no, abrir y ocultar detalles
							setShowInterfaceSettings(!showInterfaceSettings);
						}}
						size="icon"
						title={showInterfaceSettings ? 'Ocultar configuración de vistas' : 'Mostrar configuración de vistas'}
						variant="ghost"
					>
						<Settings className="h-3.5 w-3.5" />
					</Button>
				)}

				{!isInSettingsView && showDetailsButton && (
					<Button
						className={cn('h-7 w-7 hover:bg-accent', isVisible && !showInterfaceSettings && 'bg-accent')}
						onClick={() => {
							// Si estamos mostrando configuraciones, desactivarlas al alternar detalles
							if (showInterfaceSettings) {
								setShowInterfaceSettings(false);
							}
							toggleVisibility();
						}}
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

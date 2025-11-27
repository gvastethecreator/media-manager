import {
	Archive,
	ArrowDown,
	ArrowRight,
	ArrowUp,
	Calendar,
	Clock,
	Copy,
	Download,
	FileText,
	FolderTree,
	GalleryHorizontal,
	Grid,
	LayoutGrid,
	List as ListIcon,
	Plus,
	Search,
	SortAsc,
	Table as TableIcon,
	Tags,
	Trash2,
	X,
} from 'lucide-react';
import { memo, useCallback, useMemo, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuRadioGroup,
	DropdownMenuRadioItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { motion } from '@/components/ui/motion-shim';
import { Separator } from '@/components/ui/separator';
import { toastService } from '@/lib/ui/toast';
import { cn } from '@/lib/utils';
import { deleteFile, getFileAsDataUrl } from '@/services/file/file.service';
import { useSelectionStore } from '@/store/selection.store';
import { useViewOptionsStore } from '@/store/ui/view-options.slice';

export interface FileBrowserToolbarProps {
	/** Función para refrescar/recargar los datos */
	onRefresh?: () => void;
	/** Indica si se está cargando/refrescando */
	isLoading?: boolean;
	/** Clase CSS adicional */
	className?: string;
	/** IDs de todos los elementos disponibles para selección */
	allItemIds?: string[];
}

export const FileBrowserToolbar = memo<FileBrowserToolbarProps>(function FileBrowserToolbar({
	onRefresh,
	isLoading = false,
	className,
	allItemIds = [],
}) {
	// Estados del store de opciones de vista
	const viewMode = useViewOptionsStore((state) => state.viewMode);
	const setViewMode = useViewOptionsStore((state) => state.setViewMode);
	const sortOptions = useViewOptionsStore((state) => state.sortOptions);
	const setSortOptions = useViewOptionsStore((state) => state.setSortOptions);
	const searchQuery = useViewOptionsStore((state) => state.searchQuery);
	const setSearchQuery = useViewOptionsStore((state) => state.setSearchQuery);
	const groupByEntityType = useViewOptionsStore((state) => state.groupByEntityType);
	const toggleGroupByEntityType = useViewOptionsStore((state) => state.toggleGroupByEntityType);
	const includeSubfolders = useViewOptionsStore((state) => state.includeSubfolders);
	const toggleIncludeSubfolders = useViewOptionsStore((state) => state.toggleIncludeSubfolders);

	// Estados de selección
	const selectedIds = useSelectionStore((state) => state.selectedIds);
	const clearSelection = useSelectionStore((state) => state.clearSelection);
	const selectAll = useSelectionStore((state) => state.selectAll);
	const invertSelection = useSelectionStore((state) => state.invertSelection);

	// Regex a nivel superior para rendimiento
	const SLASH_REGEX = /\//;

	// Acciones para archivos seleccionados (movidas desde main-toolbar)
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
		console.warn('La funcionalidad de copiado no está implementada en esta versión');
		toastService.info('La funcionalidad de copiado de archivos estará disponible en una próxima actualización.');
	}, [selectedIds]);

	// Manejadores de selección
	const handleSelectAll = useCallback(() => {
		selectAll(allItemIds);
	}, [selectAll, allItemIds]);

	const handleInvertSelection = useCallback(() => {
		invertSelection(allItemIds);
	}, [invertSelection, allItemIds]);

	// Manejador de ordenación exclusiva (solo uno activo a la vez)
	const handleSort = useCallback(
		(field: string) => {
			// Verificar si ya existe un ordenamiento por este campo
			const current = sortOptions.find((option) => option.field === field);

			if (current) {
				// Si existe, cambiar la dirección (asc/desc)
				const newDirection = current.direction === 'asc' ? 'desc' : 'asc';
				setSortOptions([{ field, direction: newDirection }]);
			} else {
				// Si no existe, crear nuevo ordenamiento exclusivo
				setSortOptions([{ field, direction: 'asc' }]);
			}
		},
		[sortOptions, setSortOptions]
	);

	// Manejador de cambio de vista
	// Nota: diferimos el cambio para evitar que el Dropdown se desmonte en mitad del click
	// (inestabilidad E2E por elemento "detached").
	const handleViewModeChange = useCallback(
		(mode: string) => {
			// Pequeño retardo para dejar terminar el ciclo de click/selección y layout
			setTimeout(() => setViewMode(mode as any), 80);
		},
		[setViewMode]
	);

	// Estado controlado para el dropdown de modo de vista. Mantenerlo abierto unos ms
	// durante la selección evita que el elemento objetivo se "detache" antes de finalizar el click.
	const [viewMenuOpen, setViewMenuOpen] = useState(false);
	const viewTriggerRef = useRef<HTMLButtonElement | null>(null);
	// Flag para suprimir el cierre automático del menú mientras procesamos la selección
	const suppressCloseRef = useRef(false);

	// Manejador de cambio de open controlado que respeta el guard de cierre
	const handleViewMenuOpenChange = useCallback((nextOpen: boolean) => {
		if (!nextOpen && suppressCloseRef.current) {
			// Evitamos que Radix cierre el menú durante nuestra ventana crítica
			setViewMenuOpen(true);
			return;
		}
		setViewMenuOpen(nextOpen);
	}, []);

	// Helper para manejar selección de modo evitando detach durante el click.
	// Interceptamos pointerdown para suprimir el cierre y ejecutamos en click (post-pointerup).
	const onClickView = useCallback(
		(mode: string) => (e: any) => {
			// Evitar que Radix/DOM cambie foco/cierre automáticamente durante el click
			e?.preventDefault?.();
			e?.stopPropagation?.();
			suppressCloseRef.current = true;
			// Estrategia estable: aplicar primero el modo (con un pequeño retardo post-click)
			// manteniendo abierto el menú; cerrar después de un margen mayor para no "detachear" el item.
			// Aumentamos los márgenes para dar tiempo a Playwright a completar el click sin reflujo.
			const applyDelay = 220;
			const closeDelay = mode === 'masonry' ? 1000 : 700; // más margen para masonry

			// Aplicar cambio de vista tras el click (siguiente frame + pequeño retardo)
			setTimeout(() => {
				// doble raf para asegurar fin de ciclo de input/layout antes de mutar vista
				requestAnimationFrame(() => requestAnimationFrame(() => handleViewModeChange(mode)));
			}, applyDelay);

			// Cerrar y devolver foco al trigger tras margen seguro
			setTimeout(() => {
				setViewMenuOpen(false);
				suppressCloseRef.current = false;
				requestAnimationFrame(() => viewTriggerRef.current?.focus());
			}, closeDelay);
		},
		[handleViewModeChange]
	);

	// Capturar el viewMode inicial para usarlo como defaultValue estático en el menú (evita re-renders)
	const initialViewModeRef = useRef(viewMode);

	// Subcomponente memoizado: contenido del menú de vista, no re-renderiza cuando cambia viewMode
	const ViewModeMenuContent = useMemo(
		() =>
			memo(function ViewModeMenuContentInner({
				onSelectViewCb,
			}: {
				onSelectViewCb: (mode: string) => (e: any) => void;
			}) {
				return (
					<DropdownMenuContent
						align="end"
						avoidCollisions={false}
						className="w-40 animate-none"
						data-no-animate="true"
						data-testid="view-mode-dropdown-content"
						forceMount
						onCloseAutoFocus={(e: Event) => e.preventDefault()}
						onEscapeKeyDown={(e: Event) => e.preventDefault()}
						onInteractOutside={(e: Event) => e.preventDefault()}
						onPointerDownOutside={(e: Event) => e.preventDefault()}
						sideOffset={0}
					>
						<DropdownMenuLabel>Modo de vista</DropdownMenuLabel>
						<DropdownMenuSeparator />
						{/* Items simples para evitar re-render interno por radios */}
						<DropdownMenuItem
							data-testid="view-mode-grid-btn"
							onClick={onSelectViewCb('grid')}
							onPointerDown={(ev) => {
								ev.preventDefault();
								ev.stopPropagation();
								suppressCloseRef.current = true;
							}}
							onSelect={(ev) => ev.preventDefault()}
							role="menuitemradio"
						>
							<div className="flex items-center gap-2">
								<Grid className="h-4 w-4" />
								<span>Grid</span>
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem
							data-testid="view-mode-cards-btn"
							onClick={onSelectViewCb('cards')}
							onPointerDown={(ev) => {
								ev.preventDefault();
								ev.stopPropagation();
								suppressCloseRef.current = true;
							}}
							onSelect={(ev) => ev.preventDefault()}
							role="menuitemradio"
						>
							<div className="flex items-center gap-2">
								<LayoutGrid className="h-4 w-4" />
								<span>Cards</span>
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem
							data-testid="view-mode-masonry-btn"
							onClick={onSelectViewCb('masonry')}
							onPointerDown={(ev) => {
								ev.preventDefault();
								ev.stopPropagation();
								suppressCloseRef.current = true;
							}}
							onSelect={(ev) => ev.preventDefault()}
							role="menuitemradio"
						>
							<div className="flex items-center gap-2">
								<GalleryHorizontal className="h-4 w-4" />
								<span>Masonry</span>
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem
							data-testid="view-mode-list-btn"
							onClick={onSelectViewCb('list')}
							onPointerDown={(ev) => {
								ev.preventDefault();
								ev.stopPropagation();
								suppressCloseRef.current = true;
							}}
							onSelect={(ev) => ev.preventDefault()}
							role="menuitemradio"
						>
							<div className="flex items-center gap-2">
								<ListIcon className="h-4 w-4" />
								<span>Lista</span>
							</div>
						</DropdownMenuItem>
						<DropdownMenuItem
							data-testid="view-mode-table-btn"
							onClick={onSelectViewCb('table')}
							onPointerDown={(ev) => {
								ev.preventDefault();
								ev.stopPropagation();
								suppressCloseRef.current = true;
							}}
							onSelect={(ev) => ev.preventDefault()}
							role="menuitemradio"
						>
							<div className="flex items-center gap-2">
								<TableIcon className="h-4 w-4" />
								<span>Tabla</span>
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				);
			}),
		[]
	);

	// Obtener el ordenamiento actual
	const currentSort = useMemo(() => {
		const sortOptions_any = sortOptions as Array<{ field: string; direction: 'asc' | 'desc' }>;
		const nameOpt = sortOptions_any.find((opt) => opt.field === 'name');
		const modifiedOpt = sortOptions_any.find((opt) => opt.field === 'modifiedAt' || opt.field === 'modifiedTime');
		const createdOpt = sortOptions_any.find((opt) => opt.field === 'createdAt' || opt.field === 'createdTime');
		const typeOpt = sortOptions_any.find((opt) => opt.field === 'type' || opt.field === 'entityType');

		if (nameOpt) return { field: 'name', direction: nameOpt.direction };
		if (modifiedOpt) return { field: 'modifiedAt', direction: modifiedOpt.direction };
		if (createdOpt) return { field: 'createdAt', direction: createdOpt.direction };
		if (typeOpt) return { field: 'type', direction: typeOpt.direction };
		return null;
	}, [sortOptions]);

	// Función para obtener el icono de la vista actual
	const getViewIcon = () => {
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

	// Función para obtener la etiqueta del ordenamiento actual
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

	// Renderizar acciones de selección (movido desde main-toolbar)
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

	return (
		<div className={cn('flex h-10 items-center justify-between bg-muted/30 px-3 py-2', className)}>
			{/* Lado izquierdo: Búsqueda + Acciones de selección */}
			<div className="flex items-center gap-2">
				<div className="relative">
					<Search className="-translate-y-1/2 absolute top-1/2 left-2 h-4 w-4 text-muted-foreground" />
					<Input
						className="h-8 w-64 pl-8"
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Buscar archivos..."
						type="text"
						value={searchQuery}
					/>
					{searchQuery && (
						<Button
							className="-translate-y-1/2 absolute top-1/2 right-1 h-6 w-6"
							onClick={() => setSearchQuery('')}
							size="icon"
							variant="ghost"
						>
							<X className="h-3 w-3" />
						</Button>
					)}
				</div>
				{renderSelectionActions()}
			</div>

			{/* Lado derecho: Controles de vista y acciones */}
			<div className="flex items-center gap-1">
				{/* Botón de agrupar por tipo */}
				<Button
					aria-label="Agrupar por tipo de archivo"
					aria-pressed={groupByEntityType}
					className={cn(
						'transition-all duration-300 ease-in-out hover:scale-105',
						groupByEntityType && 'bg-primary text-primary-foreground shadow-sm'
					)}
					onClick={toggleGroupByEntityType}
					size="sm"
					variant={groupByEntityType ? 'default' : 'ghost'}
				>
					<Tags
						className={cn(
							'h-4 w-4 transition-transform duration-300 ease-in-out',
							groupByEntityType && 'text-primary-foreground'
						)}
					/>
				</Button>

				{/* Botón de incluir subcarpetas */}
				<Button
					aria-label="Incluir archivos de subcarpetas"
					aria-pressed={includeSubfolders}
					className={cn(
						'transition-all duration-300 ease-in-out hover:scale-105',
						includeSubfolders && 'bg-primary text-primary-foreground shadow-sm'
					)}
					onClick={toggleIncludeSubfolders}
					size="sm"
					variant={includeSubfolders ? 'default' : 'ghost'}
				>
					<FolderTree
						className={cn(
							'h-4 w-4 transition-transform duration-300 ease-in-out',
							includeSubfolders && 'text-primary-foreground'
						)}
					/>
				</Button>

				<Separator className="mx-1 h-6" orientation="vertical" />

				{/* Dropdown de ordenación */}
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="sm" variant="ghost">
							<SortAsc className="mr-2 h-4 w-4" />
							{getSortLabel()}
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end" className="w-48">
						<DropdownMenuLabel>Ordenar por</DropdownMenuLabel>
						<DropdownMenuSeparator />
						<DropdownMenuRadioGroup
							onValueChange={(value) => {
								const [field] = value.split('-');
								handleSort(field);
							}}
							value={currentSort ? `${currentSort.field}-${currentSort.direction}` : ''}
						>
							<DropdownMenuRadioItem value="name-asc">
								<div className="flex w-full items-center justify-between">
									<div className="flex items-center gap-2">
										<FileText className="h-4 w-4" />
										<span>Nombre</span>
									</div>
									{currentSort?.field === 'name' && (
										<span className="ml-auto">
											{currentSort.direction === 'asc' ? (
												<ArrowUp className="h-3 w-3" />
											) : (
												<ArrowDown className="h-3 w-3" />
											)}
										</span>
									)}
								</div>
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="modifiedAt-asc">
								<div className="flex w-full items-center justify-between">
									<div className="flex items-center gap-2">
										<Clock className="h-4 w-4" />
										<span>Fecha modificación</span>
									</div>
									{currentSort?.field === 'modifiedAt' && (
										<span className="ml-auto">
											{currentSort.direction === 'asc' ? (
												<ArrowUp className="h-3 w-3" />
											) : (
												<ArrowDown className="h-3 w-3" />
											)}
										</span>
									)}
								</div>
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="createdAt-asc">
								<div className="flex w-full items-center justify-between">
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4" />
										<span>Fecha creación</span>
									</div>
									{currentSort?.field === 'createdAt' && (
										<span className="ml-auto">
											{currentSort.direction === 'asc' ? (
												<ArrowUp className="h-3 w-3" />
											) : (
												<ArrowDown className="h-3 w-3" />
											)}
										</span>
									)}
								</div>
							</DropdownMenuRadioItem>
							<DropdownMenuRadioItem value="type-asc">
								<div className="flex w-full items-center justify-between">
									<div className="flex items-center gap-2">
										<Tags className="h-4 w-4" />
										<span>Tipo de archivo</span>
									</div>
									{currentSort?.field === 'type' && (
										<span className="ml-auto">
											{currentSort.direction === 'asc' ? (
												<ArrowUp className="h-3 w-3" />
											) : (
												<ArrowDown className="h-3 w-3" />
											)}
										</span>
									)}
								</div>
							</DropdownMenuRadioItem>
						</DropdownMenuRadioGroup>
					</DropdownMenuContent>
				</DropdownMenu>

				{/* Dropdown de modo de vista */}
				<DropdownMenu modal={false} onOpenChange={handleViewMenuOpenChange} open={viewMenuOpen}>
					<DropdownMenuTrigger asChild>
						<Button
							aria-label="Cambiar modo de vista"
							data-testid="view-mode-dropdown-trigger"
							ref={viewTriggerRef}
							size="sm"
							variant="ghost"
						>
							{getViewIcon()}
						</Button>
					</DropdownMenuTrigger>
					{/* Contenido memoizado para estabilidad durante el click */}
					<ViewModeMenuContent onSelectViewCb={onClickView} />
				</DropdownMenu>
			</div>
		</div>
	);
});

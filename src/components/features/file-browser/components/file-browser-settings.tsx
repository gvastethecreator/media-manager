import {
	ArrowDown,
	Eye,
	FolderTree,
	Gauge,
	Grid3X3,
	Layers,
	LayoutGrid,
	List,
	RefreshCcw,
	RotateCcw,
	Search,
	Settings,
	Table,
	X,
} from 'lucide-react';
import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDetailsPanel } from '@/store/details-panel.store';
import {
	ColorPicker,
	type PaginationMode,
	RENDERING_MODES,
	type RenderingMode,
	Row,
	Section,
	useSettingsBindings,
	VIEW_MODES,
	type ViewMode,
} from './settings';

/**
 * Componente principal de settings del explorador
 * Usa módulos extraídos de ./settings/ para mejor organización
 */
const FileBrowserSettings = memo(function FileBrowserSettingsInner() {
	const {
		viewMode,
		setViewMode,
		groupByEntityType,
		toggleGroupByEntityType,
		includeSubfolders,
		toggleIncludeSubfolders,
		useCanvasRendering,
		setUseCanvasRendering,
		virtualization,
		backgroundColor,
		setBackgroundColor,
		pagination,
		setPaginationMode,
		setPageSize,
		infiniteScroll,
		setInfiniteScroll,
		toggleInfiniteScrollEnabled,
		toggleInfiniteScrollAutoLoad,
		views,
		setRenderingMode,
		setViewConfig,
		setVirtualization,
		setSearchQuery,
		resetFilters,
		resetAll,
		resetLocalStorage,
	} = useSettingsBindings();

	const { setShowInterfaceSettings } = useDetailsPanel();

	return (
		<div className="h-full space-y-4 overflow-y-auto">
			{/* Header */}
			<div className="sticky top-0 flex items-center justify-between border-b bg-background/95 pb-2 backdrop-blur-sm">
				<div className="flex items-center gap-2">
					<Settings className="h-5 w-5 text-blue-600" />
					<h3 className="font-semibold text-base text-gray-800 dark:text-gray-200">Configuración del Explorador</h3>
				</div>
				<div className="flex items-center gap-2">
					<Button className="text-xs" onClick={() => resetFilters()} size="sm" variant="ghost">
						<RefreshCcw className="mr-1 h-3 w-3" />
						Filtros
					</Button>
					<Button className="text-xs" onClick={() => resetAll()} size="sm" variant="ghost">
						<RotateCcw className="mr-1 h-3 w-3" />
						Todo
					</Button>
					<Button
						className="text-orange-600 text-xs"
						onClick={() => {
							resetLocalStorage();
							// Opcional: mostrar notificación
							window.location.reload();
						}}
						size="sm"
						title="Limpiar localStorage y recargar página"
						variant="ghost"
					>
						<X className="mr-1 h-3 w-3" />
						Debug
					</Button>
					<Button onClick={() => setShowInterfaceSettings(false)} size="sm" variant="outline">
						<X className="h-3 w-3" />
					</Button>
				</div>
			</div>

			{/* Global Settings */}
			<Section color="text-blue-600" icon={Settings} title="Configuración Global">
				<Row>
					<Label className="text-gray-600 text-sm dark:text-gray-400">Vista por defecto</Label>
					<Select onValueChange={(v) => setViewMode(v as ViewMode)} value={viewMode}>
						<Tooltip>
							<TooltipTrigger asChild>
								<SelectTrigger className="h-8 w-40">
									<SelectValue />
								</SelectTrigger>
							</TooltipTrigger>
							<TooltipContent>Cambia el modo de vista por defecto</TooltipContent>
						</Tooltip>
						<SelectContent>
							{VIEW_MODES.map((m) => {
								const IconComponent = m.icon;
								return (
									<SelectItem key={m.value} value={m.value}>
										<div className="flex items-center gap-2">
											<IconComponent className={`h-3 w-3 ${m.color}`} />
											<span>{m.label}</span>
										</div>
									</SelectItem>
								);
							})}
						</SelectContent>
					</Select>
				</Row>
				<Row>
					<Label className="text-gray-600 text-sm dark:text-gray-400">Color de fondo</Label>
					<Tooltip>
						<TooltipTrigger asChild>
							<div>
								<ColorPicker onChange={setBackgroundColor} value={backgroundColor} />
							</div>
						</TooltipTrigger>
						<TooltipContent>Personaliza el color de fondo del explorador</TooltipContent>
					</Tooltip>
				</Row>
			</Section>

			{/* Folders & Grouping */}
			<Section color="text-green-600" icon={FolderTree} title="Carpetas y Agrupación">
				<Row>
					<Label className="text-gray-600 text-sm dark:text-gray-400">Agrupar por tipo</Label>
					<Tooltip>
						<TooltipTrigger asChild>
							<Switch checked={groupByEntityType} onCheckedChange={toggleGroupByEntityType} />
						</TooltipTrigger>
						<TooltipContent>Agrupa resultados por tipo de entidad</TooltipContent>
					</Tooltip>
				</Row>
				<Row>
					<Label className="text-gray-600 text-sm dark:text-gray-400">Incluir subcarpetas</Label>
					<Tooltip>
						<TooltipTrigger asChild>
							<Switch checked={includeSubfolders} onCheckedChange={toggleIncludeSubfolders} />
						</TooltipTrigger>
						<TooltipContent>Incluye elementos de todas las subcarpetas</TooltipContent>
					</Tooltip>
				</Row>
			</Section>

			{/* Performance */}
			<Section color="text-orange-600" icon={Gauge} title="Rendimiento y Virtualización">
				<Row>
					<Label className="text-gray-600 text-sm dark:text-gray-400">Virtualización</Label>
					<Tooltip>
						<TooltipTrigger asChild>
							<Switch checked={virtualization.enabled} onCheckedChange={(v) => setVirtualization({ enabled: v })} />
						</TooltipTrigger>
						<TooltipContent>Mejora rendimiento en listas grandes</TooltipContent>
					</Tooltip>
				</Row>
				<Row>
					<Label className="text-gray-600 text-sm dark:text-gray-400">Umbral de activación</Label>
					<div className="flex items-center gap-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<input
									className="h-8 w-24 rounded-md border bg-background px-2 text-right text-gray-600 text-sm dark:text-gray-400"
									min={0}
									onChange={(e) => setVirtualization({ threshold: Number(e.target.value) })}
									type="number"
									value={virtualization.threshold}
								/>
							</TooltipTrigger>
							<TooltipContent>Cantidad mínima para activar virtualización</TooltipContent>
						</Tooltip>
						<span className="text-muted-foreground text-xs">items</span>
					</div>
				</Row>
				<Row>
					<Label className="text-gray-600 text-sm dark:text-gray-400">Overscan</Label>
					<div className="flex items-center gap-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<input
									className="h-8 w-24 rounded-md border bg-background px-2 text-right text-gray-600 text-sm dark:text-gray-400"
									min={0}
									onChange={(e) => setVirtualization({ overscan: Number(e.target.value) })}
									type="number"
									value={virtualization.overscan}
								/>
							</TooltipTrigger>
							<TooltipContent>Filas extra renderizadas fuera de pantalla</TooltipContent>
						</Tooltip>
						<span className="text-muted-foreground text-xs">filas</span>
					</div>
				</Row>
				<Row>
					<Label className="text-gray-600 text-sm dark:text-gray-400">Paginación</Label>
					<Select onValueChange={(v) => setPaginationMode(v as PaginationMode)} value={pagination.mode}>
						<Tooltip>
							<TooltipTrigger asChild>
								<SelectTrigger className="h-8 w-40">
									<SelectValue />
								</SelectTrigger>
							</TooltipTrigger>
							<TooltipContent>Elige el modo de carga de elementos</TooltipContent>
						</Tooltip>
						<SelectContent>
							<SelectItem value="pagination">Páginas</SelectItem>
							<SelectItem value="infinite">Scroll infinito</SelectItem>
						</SelectContent>
					</Select>
				</Row>
				<Row>
					<Label className="text-gray-600 text-sm dark:text-gray-400">Items por página</Label>
					<div className="flex items-center gap-2">
						<Tooltip>
							<TooltipTrigger asChild>
								<input
									className="h-8 w-28 rounded-md border bg-background px-2 text-right text-gray-600 text-sm dark:text-gray-400"
									min={1}
									onChange={(e) => setPageSize(Number(e.target.value))}
									type="number"
									value={pagination.pageSize}
								/>
							</TooltipTrigger>
							<TooltipContent>Cantidad de elementos por página</TooltipContent>
						</Tooltip>
						<span className="text-muted-foreground text-xs">items</span>
					</div>
				</Row>
			</Section>

			{/* Infinite Scroll */}
			<Section color="text-cyan-600" icon={ArrowDown} title="Infinite Scroll Automático">
				<Row>
					<Label className="text-gray-600 text-sm dark:text-gray-400">Habilitar</Label>
					<Tooltip>
						<TooltipTrigger asChild>
							<Switch checked={infiniteScroll.enabled} onCheckedChange={toggleInfiniteScrollEnabled} />
						</TooltipTrigger>
						<TooltipContent>Activa el infinite scroll automático</TooltipContent>
					</Tooltip>
				</Row>
				{infiniteScroll.enabled && (
					<>
						<Row>
							<Label className="text-gray-600 text-sm dark:text-gray-400">Auto-carga</Label>
							<Tooltip>
								<TooltipTrigger asChild>
									<Switch checked={infiniteScroll.autoLoad} onCheckedChange={toggleInfiniteScrollAutoLoad} />
								</TooltipTrigger>
								<TooltipContent>Carga automáticamente al llegar al final</TooltipContent>
							</Tooltip>
						</Row>
						<Row>
							<Label className="text-gray-600 text-sm dark:text-gray-400">Cooldown</Label>
							<div className="flex items-center gap-2">
								<Tooltip>
									<TooltipTrigger asChild>
										<input
											className="h-8 w-28 rounded-md border bg-background px-2 text-right text-gray-600 text-sm dark:text-gray-400"
											max={2000}
											min={50}
											onChange={(e) =>
												setInfiniteScroll({ cooldownMs: Math.min(2000, Math.max(50, Number(e.target.value))) })
											}
											step={50}
											type="number"
											value={infiniteScroll.cooldownMs}
										/>
									</TooltipTrigger>
									<TooltipContent>Tiempo mínimo entre cargas automáticas</TooltipContent>
								</Tooltip>
								<span className="text-muted-foreground text-xs">ms</span>
							</div>
						</Row>
						<Row>
							<Label className="text-gray-600 text-sm dark:text-gray-400">Umbral</Label>
							<div className="flex items-center gap-2">
								<Tooltip>
									<TooltipTrigger asChild>
										<input
											className="h-8 w-24 rounded-md border bg-background px-2 text-right text-gray-600 text-sm dark:text-gray-400"
											max={1000}
											min={50}
											onChange={(e) => setInfiniteScroll({ threshold: Number(e.target.value) })}
											type="number"
											value={infiniteScroll.threshold}
										/>
									</TooltipTrigger>
									<TooltipContent>Distancia en píxeles para activar carga</TooltipContent>
								</Tooltip>
								<span className="text-muted-foreground text-xs">px</span>
							</div>
						</Row>
					</>
				)}
			</Section>

			{/* Search */}
			<Section color="text-purple-600" icon={Search} title="Búsqueda">
				<Row>
					<Label className="text-gray-600 text-sm dark:text-gray-400">Texto de búsqueda</Label>
					<Tooltip>
						<TooltipTrigger asChild>
							<input
								className="h-8 w-60 rounded-md border bg-background px-2 text-gray-600 text-sm dark:text-gray-400"
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="buscar por nombre..."
							/>
						</TooltipTrigger>
						<TooltipContent>Filtra por nombre o texto</TooltipContent>
					</Tooltip>
				</Row>
			</Section>

			{/* View-specific settings */}
			<div className="space-y-4">
				<div className="flex items-center gap-2 border-t pt-4">
					<Eye className="h-4 w-4 text-gray-500" />
					<span className="font-medium text-gray-700 text-sm dark:text-gray-300">Configuración por Vista</span>
				</div>

				{/* Grid */}
				<Section color="text-blue-600" icon={Grid3X3} title="Grid">
					<Row>
						<Label className="text-gray-600 text-sm dark:text-gray-400">Renderizado</Label>
						<Select
							onValueChange={(v) => setRenderingMode('grid', v as RenderingMode)}
							value={views.grid.renderingMode}
						>
							<Tooltip>
								<TooltipTrigger asChild>
									<SelectTrigger className="h-8 w-40">
										<SelectValue />
									</SelectTrigger>
								</TooltipTrigger>
								<TooltipContent>Estrategia de renderizado para Grid</TooltipContent>
							</Tooltip>
							<SelectContent>
								{RENDERING_MODES.map((mode) => {
									const IconComponent = mode.icon;
									return (
										<SelectItem disabled={mode.value === 'webgl'} key={mode.value} value={mode.value}>
											<div className="flex items-center gap-2">
												<IconComponent className={`h-3 w-3 ${mode.color}`} />
												<span>{mode.label}</span>
												{mode.value === 'webgl' && <span className="text-gray-400 text-xs">(próximo)</span>}
											</div>
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</Row>
					<Row>
						<Label className="text-gray-600 text-sm dark:text-gray-400">Tamaño de celda</Label>
						<div className="flex items-center gap-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<input
										className="h-8 w-24 rounded-md border bg-background px-2 text-right text-gray-600 text-sm dark:text-gray-400"
										min={60}
										onChange={(e) => setViewConfig('grid', { itemSize: Number(e.target.value) } as any)}
										type="number"
										value={(views.grid as any).itemSize}
									/>
								</TooltipTrigger>
								<TooltipContent>Tamaño de cada celda en la cuadrícula</TooltipContent>
							</Tooltip>
							<span className="text-muted-foreground text-xs">px</span>
						</div>
					</Row>
				</Section>

				{/* List */}
				<Section color="text-green-600" icon={List} title="Lista">
					<Row>
						<Label className="text-gray-600 text-sm dark:text-gray-400">Renderizado</Label>
						<Select
							onValueChange={(v) => setRenderingMode('list', v as RenderingMode)}
							value={views.list.renderingMode}
						>
							<Tooltip>
								<TooltipTrigger asChild>
									<SelectTrigger className="h-8 w-40">
										<SelectValue />
									</SelectTrigger>
								</TooltipTrigger>
								<TooltipContent>Estrategia de renderizado para Lista</TooltipContent>
							</Tooltip>
							<SelectContent>
								{RENDERING_MODES.map((mode) => {
									const IconComponent = mode.icon;
									return (
										<SelectItem disabled={mode.value === 'webgl'} key={mode.value} value={mode.value}>
											<div className="flex items-center gap-2">
												<IconComponent className={`h-3 w-3 ${mode.color}`} />
												<span>{mode.label}</span>
												{mode.value === 'webgl' && <span className="text-gray-400 text-xs">(próximo)</span>}
											</div>
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</Row>
					<Row>
						<Label className="text-gray-600 text-sm dark:text-gray-400">Altura de fila</Label>
						<div className="flex items-center gap-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<input
										className="h-8 w-24 rounded-md border bg-background px-2 text-right text-gray-600 text-sm dark:text-gray-400"
										min={20}
										onChange={(e) => setViewConfig('list', { rowHeight: Number(e.target.value) } as any)}
										type="number"
										value={(views.list as any).rowHeight}
									/>
								</TooltipTrigger>
								<TooltipContent>Altura de cada fila en la lista</TooltipContent>
							</Tooltip>
							<span className="text-muted-foreground text-xs">px</span>
						</div>
					</Row>
				</Section>

				{/* Masonry */}
				<Section color="text-orange-600" icon={Layers} title="Masonry">
					<Row>
						<Label className="text-gray-600 text-sm dark:text-gray-400">Renderizado</Label>
						<Select
							onValueChange={(v) => setRenderingMode('masonry', v as RenderingMode)}
							value={views.masonry.renderingMode}
						>
							<Tooltip>
								<TooltipTrigger asChild>
									<SelectTrigger className="h-8 w-40">
										<SelectValue />
									</SelectTrigger>
								</TooltipTrigger>
								<TooltipContent>Estrategia de renderizado para Masonry</TooltipContent>
							</Tooltip>
							<SelectContent>
								{RENDERING_MODES.map((mode) => {
									const IconComponent = mode.icon;
									return (
										<SelectItem disabled={mode.value === 'webgl'} key={mode.value} value={mode.value}>
											<div className="flex items-center gap-2">
												<IconComponent className={`h-3 w-3 ${mode.color}`} />
												<span>{mode.label}</span>
												{mode.value === 'webgl' && <span className="text-gray-400 text-xs">(próximo)</span>}
											</div>
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</Row>
					<Row>
						<Label className="text-gray-600 text-sm dark:text-gray-400">Ancho base</Label>
						<div className="flex items-center gap-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<input
										className="h-8 w-24 rounded-md border bg-background px-2 text-right text-gray-600 text-sm dark:text-gray-400"
										min={100}
										onChange={(e) => setViewConfig('masonry', { itemSize: Number(e.target.value) } as any)}
										type="number"
										value={(views.masonry as any).itemSize}
									/>
								</TooltipTrigger>
								<TooltipContent>Ancho base de los elementos en masonry</TooltipContent>
							</Tooltip>
							<span className="text-muted-foreground text-xs">px</span>
						</div>
					</Row>
				</Section>

				{/* Cards */}
				<Section color="text-purple-600" icon={LayoutGrid} title="Tarjetas">
					<Row>
						<Label className="text-gray-600 text-sm dark:text-gray-400">Renderizado</Label>
						<Select
							onValueChange={(v) => setRenderingMode('cards', v as RenderingMode)}
							value={views.cards.renderingMode}
						>
							<Tooltip>
								<TooltipTrigger asChild>
									<SelectTrigger className="h-8 w-40">
										<SelectValue />
									</SelectTrigger>
								</TooltipTrigger>
								<TooltipContent>Estrategia de renderizado para Tarjetas</TooltipContent>
							</Tooltip>
							<SelectContent>
								{RENDERING_MODES.map((mode) => {
									const IconComponent = mode.icon;
									return (
										<SelectItem disabled={mode.value === 'webgl'} key={mode.value} value={mode.value}>
											<div className="flex items-center gap-2">
												<IconComponent className={`h-3 w-3 ${mode.color}`} />
												<span>{mode.label}</span>
												{mode.value === 'webgl' && <span className="text-gray-400 text-xs">(próximo)</span>}
											</div>
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</Row>
					<Row>
						<Label className="text-gray-600 text-sm dark:text-gray-400">Tamaño de tarjeta</Label>
						<div className="flex items-center gap-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<input
										className="h-8 w-24 rounded-md border bg-background px-2 text-right text-gray-600 text-sm dark:text-gray-400"
										min={120}
										onChange={(e) => setViewConfig('cards', { itemSize: Number(e.target.value) } as any)}
										type="number"
										value={(views.cards as any).itemSize}
									/>
								</TooltipTrigger>
								<TooltipContent>Tamaño de cada tarjeta</TooltipContent>
							</Tooltip>
							<span className="text-muted-foreground text-xs">px</span>
						</div>
					</Row>
				</Section>

				{/* Table */}
				<Section color="text-red-600" icon={Table} title="Tabla">
					<Row>
						<Label className="text-gray-600 text-sm dark:text-gray-400">Renderizado</Label>
						<Select
							onValueChange={(v) => setRenderingMode('table', v as RenderingMode)}
							value={views.table.renderingMode}
						>
							<Tooltip>
								<TooltipTrigger asChild>
									<SelectTrigger className="h-8 w-40">
										<SelectValue />
									</SelectTrigger>
								</TooltipTrigger>
								<TooltipContent>Estrategia de renderizado para Tabla</TooltipContent>
							</Tooltip>
							<SelectContent>
								{RENDERING_MODES.map((mode) => {
									const IconComponent = mode.icon;
									return (
										<SelectItem disabled={mode.value === 'webgl'} key={mode.value} value={mode.value}>
											<div className="flex items-center gap-2">
												<IconComponent className={`h-3 w-3 ${mode.color}`} />
												<span>{mode.label}</span>
												{mode.value === 'webgl' && <span className="text-gray-400 text-xs">(próximo)</span>}
											</div>
										</SelectItem>
									);
								})}
							</SelectContent>
						</Select>
					</Row>
					<Row>
						<Label className="text-gray-600 text-sm dark:text-gray-400">Altura de fila</Label>
						<div className="flex items-center gap-2">
							<Tooltip>
								<TooltipTrigger asChild>
									<input
										className="h-8 w-24 rounded-md border bg-background px-2 text-right text-gray-600 text-sm dark:text-gray-400"
										min={24}
										onChange={(e) => setViewConfig('table', { rowHeight: Number(e.target.value) } as any)}
										type="number"
										value={(views.table as any).rowHeight}
									/>
								</TooltipTrigger>
								<TooltipContent>Altura de cada fila en la tabla</TooltipContent>
							</Tooltip>
							<span className="text-muted-foreground text-xs">px</span>
						</div>
					</Row>
				</Section>
			</div>
		</div>
	);
});

export default FileBrowserSettings;

import type { LucideIcon } from 'lucide-react';
import {
    Cpu,
    Eye,
    FolderTree,
    Gauge,
    Grid3X3,
    Layers,
    LayoutGrid,
    List,
    Monitor,
    RefreshCcw,
    RotateCcw,
    Search,
    Settings,
    Table,
    X,
    Zap,
} from 'lucide-react';
import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useDetailsPanel } from '@/store/details-panel.store';
import {
    type PaginationMode,
    type RenderingMode,
    useViewOptionsStore,
    type ViewMode,
} from '@/store/ui/view-options.slice';

// Helper components
interface SectionProps {
    icon: LucideIcon;
    title: string;
    color: string;
    children: React.ReactNode;
}

const Section = ({ icon: Icon, title, color, children }: SectionProps) => (
    <div className="p-0">
        <div className="mb-2 flex items-center gap-2">
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="font-medium text-gray-700 text-sm dark:text-gray-300">{title}</span>
        </div>
        <Separator className="my-2" />
        <div className="space-y-3">{children}</div>
    </div>
);

interface RowProps {
    children: React.ReactNode;
}

const Row = ({ children }: RowProps) => <div className="flex items-center justify-between gap-3">{children}</div>;

interface ColorPickerProps {
    value: string;
    onChange: (value: string) => void;
}

const ColorPicker = ({ value, onChange }: ColorPickerProps) => {
    const presetColors = ['#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', 'transparent', '#000000', '#1a1a1a', '#2d3748'];

    return (
        <div className="flex items-center gap-2">
            <input
                className="h-8 w-12 cursor-pointer rounded border"
                onChange={(e) => onChange(e.target.value)}
                type="color"
                value={value === 'transparent' ? '#ffffff' : value}
            />
            <input
                className="h-8 w-28 rounded-md border bg-background px-2 text-gray-600 text-sm dark:text-gray-400"
                onChange={(e) => onChange(e.target.value)}
                placeholder="#ffffff"
                type="text"
                value={value}
            />
            <Select onValueChange={onChange} value={value}>
                <SelectTrigger className="h-8 w-24 text-xs">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {presetColors.map((color) => (
                        <SelectItem key={color} value={color}>
                            <div className="flex items-center gap-2">
                                <div
                                    className="h-3 w-3 rounded border"
                                    style={{ backgroundColor: color === 'transparent' ? 'transparent' : color }}
                                />
                                <span className="text-xs">{color}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
};

// Constants
const VIEW_MODES: { value: ViewMode; label: string; icon: LucideIcon; color: string }[] = [
    { value: 'grid', label: 'Grid', icon: Grid3X3, color: 'text-blue-600' },
    { value: 'list', label: 'Lista', icon: List, color: 'text-green-600' },
    { value: 'cards', label: 'Tarjetas', icon: LayoutGrid, color: 'text-purple-600' },
    { value: 'masonry', label: 'Masonry', icon: Layers, color: 'text-orange-600' },
    { value: 'table', label: 'Tabla', icon: Table, color: 'text-red-600' },
    { value: 'canvas', label: 'Canvas', icon: Monitor, color: 'text-cyan-600' },
];

const RENDERING_MODES: { value: RenderingMode; label: string; icon: LucideIcon; color: string }[] = [
    { value: 'canvas', label: 'Canvas', icon: Monitor, color: 'text-blue-500' },
    { value: 'virtualized', label: 'Virtualizado', icon: Zap, color: 'text-green-500' },
    { value: 'webgl', label: 'WebGL', icon: Cpu, color: 'text-purple-500' },
];

// Settings bindings hook
function useSettingsBindings() {
    const viewMode = useViewOptionsStore((s) => s.viewMode);
    const setViewMode = useViewOptionsStore((s) => s.setViewMode);
    const groupByEntityType = useViewOptionsStore((s) => s.groupByEntityType);
    const toggleGroupByEntityType = useViewOptionsStore((s) => s.toggleGroupByEntityType);
    const includeSubfolders = useViewOptionsStore((s) => s.includeSubfolders);
    const toggleIncludeSubfolders = useViewOptionsStore((s) => s.toggleIncludeSubfolders);
    const useCanvasRendering = useViewOptionsStore((s) => s.useCanvasRendering);
    const setUseCanvasRendering = useViewOptionsStore((s) => s.setUseCanvasRendering);
    const virtualization = useViewOptionsStore((s) => s.virtualization);
    const setVirtualization = useViewOptionsStore((s) => s.setVirtualization);
    const backgroundColor = useViewOptionsStore((s) => s.backgroundColor);
    const setBackgroundColor = useViewOptionsStore((s) => s.setBackgroundColor);
    const pagination = useViewOptionsStore((s) => s.pagination);
    const setPaginationMode = useViewOptionsStore((s) => s.setPaginationMode);
    const setPageSize = useViewOptionsStore((s) => s.setPageSize);
    const views = useViewOptionsStore((s) => s.views);
    const setRenderingMode = useViewOptionsStore((s) => s.setRenderingMode);
    const setViewConfig = useViewOptionsStore((s) => s.setViewConfig);
    const setSearchQuery = useViewOptionsStore((s) => s.setSearchQuery);
    const resetFilters = useViewOptionsStore((s) => s.resetFilters);
    const resetAll = useViewOptionsStore((s) => s.resetAll);

    return {
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
        views,
        setRenderingMode,
        setViewConfig,
        setVirtualization,
        setSearchQuery,
        resetFilters,
        resetAll,
    };
}

// Main component
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
        views,
        setRenderingMode,
        setViewConfig,
        setVirtualization,
        setSearchQuery,
        resetFilters,
        resetAll,
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

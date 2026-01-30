/**
 * @file Componente de configuración del File Browser
 * @module file-browser-new/components/settings
 */

import { FolderTree, Gauge, Monitor, RefreshCcw, RotateCcw, Search, Settings, Sliders, X } from 'lucide-react';
import { memo, useMemo } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useDetailsPanel } from '@/store/details-panel.store';
import {
	ColorPicker,
	type PaginationMode,
	Row,
	useSettingsBindings,
	VIEW_MODES,
	type ViewMode,
} from './settings-barrel';

const FileBrowserSettings = memo(function FileBrowserSettingsInner() {
	const {
		viewMode,
		setViewMode,
		groupByEntityType,
		toggleGroupByEntityType,
		includeSubfolders,
		toggleIncludeSubfolders,
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
		setViewConfig,
		setVirtualization,
		setSearchQuery,
		resetFilters,
		resetAll,
		resetLocalStorage,
	} = useSettingsBindings();

	const { setShowInterfaceSettings } = useDetailsPanel();

	// Configuración específica de la vista activa
	const activeViewConfig = useMemo(() => {
		const config = views[viewMode as keyof typeof views];
		if (!config) return null;

		switch (viewMode) {
			case 'grid':
			case 'masonry':
			case 'cards':
				return (
					<Row>
						<Label className="text-muted-foreground text-xs">
							{viewMode === 'masonry' ? 'Ancho base' : 'Tamaño de celda'}
						</Label>
						<div className="flex items-center gap-2">
							<Input
								className="h-7 w-20 text-right text-xs"
								min={60}
								onChange={(e) => setViewConfig(viewMode as any, { itemSize: Number(e.target.value) } as any)}
								type="number"
								value={(config as any).itemSize}
							/>
							<span className="text-[10px] text-muted-foreground">px</span>
						</div>
					</Row>
				);
			case 'list':
			case 'table':
				return (
					<Row>
						<Label className="text-muted-foreground text-xs">Altura de fila</Label>
						<div className="flex items-center gap-2">
							<Input
								className="h-7 w-20 text-right text-xs"
								min={20}
								onChange={(e) => setViewConfig(viewMode as any, { rowHeight: Number(e.target.value) } as any)}
								type="number"
								value={(config as any).rowHeight}
							/>
							<span className="text-[10px] text-muted-foreground">px</span>
						</div>
					</Row>
				);
			default:
				return null;
		}
	}, [viewMode, views, setViewConfig]);

	return (
		<div className="flex h-full flex-col">
			{/* Header Compacto */}
			<div className="flex items-center justify-between border-border/40 border-b bg-background px-4 py-3">
				<div className="flex items-center gap-2">
					<div className="rounded-md bg-primary/10 p-1.5 text-primary">
						<Sliders className="h-4 w-4" />
					</div>
					<h3 className="font-bold text-foreground text-sm tracking-tight">Ajustes del Explorador</h3>
				</div>
				<Button
					className="h-8 w-8 hover:bg-muted"
					onClick={() => setShowInterfaceSettings(false)}
					size="icon"
					variant="ghost"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<div className="flex-1 overflow-y-auto p-4 pt-2">
				<Accordion className="w-full" defaultValue="appearance" type="single">
					{/* 1. APARIENCIA */}
					<AccordionItem className="border-border/40" value="appearance">
						<AccordionTrigger className="py-3 hover:no-underline">
							<div className="flex items-center gap-2.5">
								<Monitor className="h-4 w-4" style={{ color: 'var(--dt-info-500)' }} />
								<span className="font-semibold text-sm">Apariencia</span>
							</div>
						</AccordionTrigger>
						<AccordionContent className="space-y-3 pb-4">
							<div className="space-y-2">
								<Label className="font-bold text-[11px] text-muted-foreground/70 uppercase tracking-wider">
									Interfaz Global
								</Label>
								<Row>
									<Label className="font-medium text-muted-foreground text-xs">Modo de vista</Label>
									<Select onValueChange={(v) => setViewMode(v as ViewMode)} value={viewMode}>
										<SelectTrigger className="h-7 w-32 text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{VIEW_MODES.map((m) => {
												const IconComponent = m.icon;
												return (
													<SelectItem key={m.value} value={m.value}>
														<div className="flex items-center gap-2">
															<IconComponent className={`h-3 w-3 ${m.color}`} />
															<span className="text-xs">{m.label}</span>
														</div>
													</SelectItem>
												);
											})}
										</SelectContent>
									</Select>
								</Row>
								<Row>
									<Label className="font-medium text-muted-foreground text-xs">Fondo personalizado</Label>
									<ColorPicker onChange={setBackgroundColor} value={backgroundColor} />
								</Row>
							</div>

							<div className="space-y-2 pt-1">
								<Label className="font-bold text-[11px] text-muted-foreground/70 uppercase tracking-wider">
									Ajustes de Vista ({viewMode})
								</Label>
								{activeViewConfig}
							</div>
						</AccordionContent>
					</AccordionItem>

					{/* 2. ORGANIZACIÓN */}
					<AccordionItem className="border-border/40" value="organization">
						<AccordionTrigger className="py-3 hover:no-underline">
							<div className="flex items-center gap-2.5">
								<FolderTree className="h-4 w-4" style={{ color: 'var(--dt-success-500)' }} />
								<span className="font-semibold text-sm">Organización</span>
							</div>
						</AccordionTrigger>
						<AccordionContent className="space-y-3 pb-4">
							<Row>
								<div className="flex flex-col gap-0.5">
									<Label className="font-medium text-xs">Agrupar por tipo</Label>
									<p className="text-[10px] text-muted-foreground">Separa imágenes de videos</p>
								</div>
								<Switch checked={groupByEntityType} onCheckedChange={toggleGroupByEntityType} />
							</Row>
							<Row>
								<div className="flex flex-col gap-0.5">
									<Label className="font-medium text-xs">Modo recursivo</Label>
									<p className="text-[10px] text-muted-foreground">Incluir subcarpetas</p>
								</div>
								<Switch checked={includeSubfolders} onCheckedChange={toggleIncludeSubfolders} />
							</Row>
							<div className="space-y-2 pt-2">
								<Label className="font-bold text-[11px] text-muted-foreground/70 uppercase tracking-wider">
									Búsqueda Rápida
								</Label>
								<div className="relative">
									<Search className="absolute top-2.5 left-2.5 h-3.5 w-3.5 text-muted-foreground" />
									<Input
										className="h-9 pl-8 text-xs focus-visible:ring-success/30"
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Filtrar por nombre..."
									/>
								</div>
							</div>
						</AccordionContent>
					</AccordionItem>

					{/* 3. RENDIMIENTO */}
					<AccordionItem className="border-border/40" value="performance">
						<AccordionTrigger className="py-3 hover:no-underline">
							<div className="flex items-center gap-2.5">
								<Gauge className="h-4 w-4" style={{ color: 'var(--dt-warning-500)' }} />
								<span className="font-semibold text-sm">Rendimiento</span>
							</div>
						</AccordionTrigger>
						<AccordionContent className="space-y-4 pb-4">
							{/* Virtualización */}
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label className="font-bold text-[11px] text-muted-foreground/70 uppercase tracking-wider">
										Virtualización
									</Label>
									<Switch checked={virtualization.enabled} onCheckedChange={(v) => setVirtualization({ enabled: v })} />
								</div>
								{virtualization.enabled && (
									<div className="grid grid-cols-2 gap-2">
										<div className="space-y-1.5 rounded-md border border-border/20 bg-muted/30 p-2">
											<Label className="font-medium text-[10px] text-muted-foreground uppercase">Umbral</Label>
											<div className="flex items-center gap-1.5">
												<Input
													className="h-6 w-full text-right text-xs"
													min={0}
													onChange={(e) => setVirtualization({ threshold: Number(e.target.value) })}
													type="number"
													value={virtualization.threshold}
												/>
												<span className="text-[10px] text-muted-foreground">it.</span>
											</div>
										</div>
										<div className="space-y-1.5 rounded-md border border-border/20 bg-muted/30 p-2">
											<Label className="font-medium text-[10px] text-muted-foreground uppercase">Overscan</Label>
											<div className="flex items-center gap-1.5">
												<Input
													className="h-6 w-full text-right text-xs"
													min={0}
													onChange={(e) => setVirtualization({ overscan: Number(e.target.value) })}
													type="number"
													value={virtualization.overscan}
												/>
												<span className="text-[10px] text-muted-foreground">filas</span>
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Paginación */}
							<div className="mt-2 space-y-2 border-border/20 border-t pt-1">
								<Label className="font-bold text-[11px] text-muted-foreground/70 uppercase tracking-wider">
									Carga de Datos
								</Label>
								<Row>
									<Label className="font-medium text-muted-foreground text-xs">Método</Label>
									<Select onValueChange={(v) => setPaginationMode(v as PaginationMode)} value={pagination.mode}>
										<SelectTrigger className="h-7 w-32 text-xs">
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem className="text-xs" value="pagination">
												Páginas
											</SelectItem>
											<SelectItem className="text-xs" value="infinite">
												Scroll infinito
											</SelectItem>
										</SelectContent>
									</Select>
								</Row>
								<Row>
									<Label className="font-medium text-muted-foreground text-xs">Items por página</Label>
									<div className="flex items-center gap-1.5">
										<Input
											className="h-7 w-20 text-right text-xs"
											min={1}
											onChange={(e) => setPageSize(Number(e.target.value))}
											type="number"
											value={pagination.pageSize}
										/>
										<span className="text-[10px] text-muted-foreground">it.</span>
									</div>
								</Row>
							</div>

							{/* Infinite Scroll */}
							<div className="mt-2 space-y-2 border-border/20 border-t pt-1">
								<div className="flex items-center justify-between">
									<Label className="font-bold text-[11px] text-muted-foreground/70 uppercase tracking-wider">
										Infinite Scroll Auto
									</Label>
									<Switch checked={infiniteScroll.enabled} onCheckedChange={toggleInfiniteScrollEnabled} />
								</div>
								{infiniteScroll.enabled && (
									<div
										className="ml-1 space-y-2 border-l-2 pl-1"
										style={{ borderColor: 'color-mix(in oklab, var(--dt-warning-500), transparent 80%)' }}
									>
										<div className="flex h-6 items-center justify-between gap-2 border-none bg-transparent p-0">
											<Label className="text-[11px] text-muted-foreground">Carga automática</Label>
											<Switch checked={infiniteScroll.autoLoad} onCheckedChange={toggleInfiniteScrollAutoLoad} />
										</div>
										<div className="grid grid-cols-2 gap-2 pt-1">
											<div className="flex flex-col gap-1">
												<Label className="text-[10px] text-muted-foreground">Cooldown</Label>
												<div className="flex items-center gap-1">
													<Input
														className="h-6 w-full text-right text-xs"
														max={2000}
														min={50}
														onChange={(e) =>
															setInfiniteScroll({
																cooldownMs: Math.min(2000, Math.max(50, Number(e.target.value))),
															})
														}
														step={50}
														type="number"
														value={infiniteScroll.cooldownMs}
													/>
													<span className="text-[9px] text-muted-foreground">ms</span>
												</div>
											</div>
											<div className="flex flex-col gap-1">
												<Label className="text-[10px] text-muted-foreground">Umbral</Label>
												<div className="flex items-center gap-1">
													<Input
														className="h-6 w-full text-right text-xs"
														max={1000}
														min={50}
														onChange={(e) => setInfiniteScroll({ threshold: Number(e.target.value) })}
														type="number"
														value={infiniteScroll.threshold}
													/>
													<span className="text-[9px] text-muted-foreground">px</span>
												</div>
											</div>
										</div>
									</div>
								)}
							</div>
						</AccordionContent>
					</AccordionItem>

					{/* 4. AVANZADO */}
					<AccordionItem className="border-none" value="advanced">
						<AccordionTrigger className="py-3 opacity-70 transition-opacity hover:no-underline hover:opacity-100">
							<div className="flex items-center gap-2.5">
								<Settings className="h-4 w-4" style={{ color: 'var(--dt-primary-500)' }} />
								<span className="font-semibold text-sm">Avanzado</span>
							</div>
						</AccordionTrigger>
						<AccordionContent className="space-y-2 pt-1 pb-4">
							<div className="grid grid-cols-2 gap-2">
								<Button
									className="h-8 justify-start px-2 text-[11px] hover:bg-primary/10"
									onClick={() => resetFilters()}
									variant="outline"
								>
									<RefreshCcw className="mr-2 h-3 w-3" />
									Reset Filtros
								</Button>
								<Button
									className="h-8 justify-start px-2 text-[11px] hover:border-warning/30 hover:bg-warning/10 hover:text-warning"
									onClick={() => resetAll()}
									variant="outline"
								>
									<RotateCcw className="mr-2 h-3 w-3" />
									Limpiar Todo
								</Button>
							</div>
							<Button
								className="h-8 w-full justify-start border-destructive/30 px-2 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive"
								onClick={() => {
									resetLocalStorage();
									window.location.reload();
								}}
								variant="outline"
							>
								<X className="mr-2 h-3 w-3" />
								Restablecer Memoria (LocalStorage)
							</Button>
							<div className="rounded-md bg-muted/50 p-2 text-[9px] text-muted-foreground leading-relaxed">
								<strong>Nota:</strong> Estas acciones restaurarán los valores de fábrica. Restablecer memoria recargará
								la página por completo.
							</div>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>

			<div className="border-border/40 border-t bg-muted/20 p-4">
				<p className="text-center text-[10px] text-muted-foreground uppercase tracking-tighter opacity-50">
					Image Manager Engine v2.0
				</p>
			</div>
		</div>
	);
});

export default FileBrowserSettings;

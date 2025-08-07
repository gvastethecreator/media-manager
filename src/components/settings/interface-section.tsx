// src/components/settings/interface-section.tsx
// Sección de interfaz para controlar tipografía, tema, animaciones y otros aspectos visuales
// 🛠️ Cumple con los lineamientos de arquitectura y stack del proyecto

import { Columns, Eye, Grid, LayoutGrid, List, Settings, Zap } from 'lucide-react';
import React, { useId, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInterfaceSettingsStore } from '@/store/entities/settings/store';

/**
 * InterfaceSection
 * Sección de configuración de interfaz de usuario (tipografía, tema, animaciones, FileBrowser, etc)
 */
const InterfaceSection: React.FC = () => {
	// Acceso a preferencias y setter desde Zustand
	const preferences = useInterfaceSettingsStore((s) => s.preferences);
	const setPreferences = useInterfaceSettingsStore((s: any) => (s.setPreferences ? s.setPreferences : () => {}));

	// Estado para el tab activo del FileBrowser
	const [activeFileBrowserTab, setActiveFileBrowserTab] = useState('general');

	// IDs únicos para los componentes
	const animationsId = useId();
	const thumbnailsRespectAspectRatioId = useId();
	const thumbnailsAnimationsId = useId();
	const thumbnailsUltraPerformanceId = useId();

	// Helper para actualizar configuración del FileBrowser
	const updateFileBrowserConfig = (section: string, key: string, value: any) => {
		setPreferences({
			fileBrowser: {
				...preferences.fileBrowser,
				[section]: {
					...preferences.fileBrowser[section as keyof typeof preferences.fileBrowser],
					[key]: value,
				},
			},
		});
	};

	// Helper para actualizar configuración de vista específica
	const updateViewConfig = (viewType: 'grid' | 'cards' | 'masonry' | 'list', key: string, value: any) => {
		setPreferences({
			fileBrowser: {
				...preferences.fileBrowser,
				views: {
					...preferences.fileBrowser.views,
					[viewType]: {
						...preferences.fileBrowser.views[viewType],
						[key]: value,
					},
				},
			},
		});
	};

	// Helper para actualizar columnas visibles en vista lista
	const updateListColumn = (column: string, visible: boolean) => {
		setPreferences({
			fileBrowser: {
				...preferences.fileBrowser,
				views: {
					...preferences.fileBrowser.views,
					list: {
						...preferences.fileBrowser.views.list,
						visibleColumns: {
							...preferences.fileBrowser.views.list.visibleColumns,
							[column]: visible,
						},
					},
				},
			},
		});
	};

	return (
		<div className="space-y-6">
			{/* Configuración General de Interfaz */}
			<Card className="rounded-sm border-none bg-muted/30">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="flex items-center gap-2 font-medium text-base text-muted-foreground">
						<Settings className="h-4 w-4" />
						<span>Interfaz General</span>
					</CardTitle>
				</CardHeader>
				<Separator className="my-0" />
				<CardContent className="p-3">
					<div className="flex flex-col gap-4">
						{/* Selector de tipografía */}
						<div className="flex flex-col gap-1">
							<Label htmlFor="fontFamily">Tipografía</Label>
							<Select onValueChange={(v) => setPreferences({ fontFamily: v })} value={preferences.fontFamily}>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="system">Sistema</SelectItem>
									<SelectItem value="serif">Serif</SelectItem>
									<SelectItem value="mono">Monoespaciada</SelectItem>
									<SelectItem value="rounded">Redondeada</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Selector de tamaño de fuente */}
						<div className="flex flex-col gap-1">
							<Label htmlFor="fontSize">Tamaño de fuente</Label>
							<Select onValueChange={(v) => setPreferences({ fontSize: v })} value={preferences.fontSize}>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="sm">Pequeño</SelectItem>
									<SelectItem value="md">Mediano</SelectItem>
									<SelectItem value="lg">Grande</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Selector de tema */}
						<div className="flex flex-col gap-1">
							<Label htmlFor="theme">Tema</Label>
							<Select onValueChange={(v) => setPreferences({ theme: v })} value={preferences.theme}>
								<SelectTrigger className="w-full">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="system">Sistema</SelectItem>
									<SelectItem value="light">Claro</SelectItem>
									<SelectItem value="dark">Oscuro</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{/* Switch de animaciones */}
						<div className="flex items-center gap-3">
							<Label htmlFor={animationsId}>Animaciones</Label>
							<Switch
								checked={preferences.animations}
								id={animationsId}
								onCheckedChange={(v) => setPreferences({ animations: v })}
							/>
						</div>

						{/* Thumbnails: Respetar aspect ratio en grilla */}
						<div className="flex items-center gap-3">
							<Label htmlFor={thumbnailsRespectAspectRatioId}>Respetar aspect ratio (grilla)</Label>
							<Switch
								checked={preferences.thumbnailsRespectAspectRatio}
								id={thumbnailsRespectAspectRatioId}
								onCheckedChange={(v) => setPreferences({ thumbnailsRespectAspectRatio: v })}
							/>
						</div>

						{/* Thumbnails: Bordes redondeados por modo */}
						<div className="flex flex-col gap-1">
							<Label>Borde redondeado thumbnails</Label>
							<div className="flex items-center gap-2">
								<span className="w-12 text-muted-foreground text-xs">Grilla</span>
								<Input
									className="w-16"
									max={32}
									min={0}
									onChange={(e) =>
										setPreferences({
											thumbnailsBorderRadius: { ...preferences.thumbnailsBorderRadius, grid: Number(e.target.value) },
										})
									}
									type="number"
									value={preferences.thumbnailsBorderRadius.grid}
								/>
								<span className="w-12 text-muted-foreground text-xs">Card</span>
								<Input
									className="w-16"
									max={32}
									min={0}
									onChange={(e) =>
										setPreferences({
											thumbnailsBorderRadius: { ...preferences.thumbnailsBorderRadius, card: Number(e.target.value) },
										})
									}
									type="number"
									value={preferences.thumbnailsBorderRadius.card}
								/>
								<span className="w-12 text-muted-foreground text-xs">Mosaico</span>
								<Input
									className="w-16"
									max={32}
									min={0}
									onChange={(e) =>
										setPreferences({
											thumbnailsBorderRadius: { ...preferences.thumbnailsBorderRadius, mosaic: Number(e.target.value) },
										})
									}
									type="number"
									value={preferences.thumbnailsBorderRadius.mosaic}
								/>
							</div>
						</div>

						{/* Thumbnails: Animaciones */}
						<div className="flex items-center gap-3">
							<Label htmlFor={thumbnailsAnimationsId}>Animaciones de thumbnails</Label>
							<Switch
								checked={preferences.thumbnailsAnimations}
								id={thumbnailsAnimationsId}
								onCheckedChange={(v) => setPreferences({ thumbnailsAnimations: v })}
							/>
						</div>

						{/* Thumbnails: Ultra performance */}
						<div className="flex items-center gap-3">
							<Label htmlFor={thumbnailsUltraPerformanceId}>Modo ultra performance</Label>
							<Switch
								checked={preferences.thumbnailsUltraPerformance}
								id={thumbnailsUltraPerformanceId}
								onCheckedChange={(v) => setPreferences({ thumbnailsUltraPerformance: v })}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Configuración específica del FileBrowser */}
			<Card className="rounded-sm border-none bg-muted/30">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="flex items-center gap-2 font-medium text-base text-muted-foreground">
						<Eye className="h-4 w-4" />
						<span>Visor de Archivos</span>
						<Badge className="text-xs" variant="secondary">
							FileBrowser
						</Badge>
					</CardTitle>
				</CardHeader>
				<Separator className="my-0" />
				<CardContent className="p-3">
					<Tabs onValueChange={setActiveFileBrowserTab} value={activeFileBrowserTab}>
						<TabsList className="grid w-full grid-cols-6">
							<TabsTrigger className="text-xs" value="general">
								<Settings className="mr-1 h-3 w-3" />
								General
							</TabsTrigger>
							<TabsTrigger className="text-xs" value="grid">
								<Grid className="mr-1 h-3 w-3" />
								Grid
							</TabsTrigger>
							<TabsTrigger className="text-xs" value="cards">
								<LayoutGrid className="mr-1 h-3 w-3" />
								Cards
							</TabsTrigger>
							<TabsTrigger className="text-xs" value="masonry">
								<Columns className="mr-1 h-3 w-3" />
								Mosaico
							</TabsTrigger>
							<TabsTrigger className="text-xs" value="list">
								<List className="mr-1 h-3 w-3" />
								Lista
							</TabsTrigger>
							<TabsTrigger className="text-xs" value="performance">
								<Zap className="mr-1 h-3 w-3" />
								Rendimiento
							</TabsTrigger>
						</TabsList>

						{/* Tab General */}
						<TabsContent className="mt-4 space-y-4" value="general">
							<div className="flex flex-col gap-3">
								<div className="flex flex-col gap-1">
									<Label>Vista por defecto</Label>
									<Select
										onValueChange={(v) => updateFileBrowserConfig('general', 'defaultViewMode', v)}
										value={preferences.fileBrowser.general.defaultViewMode}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="grid">Grid</SelectItem>
											<SelectItem value="cards">Cards</SelectItem>
											<SelectItem value="masonry">Mosaico</SelectItem>
											<SelectItem value="list">Lista</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="flex flex-col gap-1">
									<Label>Elementos por lote</Label>
									<Input
										max={200}
										min={10}
										onChange={(e) => updateFileBrowserConfig('general', 'itemsPerBatch', Number(e.target.value))}
										type="number"
										value={preferences.fileBrowser.general.itemsPerBatch}
									/>
								</div>

								<div className="space-y-2">
									<div className="flex items-center gap-3">
										<Label>Carga progresiva</Label>
										<Switch
											checked={preferences.fileBrowser.general.enableProgressiveLoading}
											onCheckedChange={(v) => updateFileBrowserConfig('general', 'enableProgressiveLoading', v)}
										/>
									</div>

									<div className="flex items-center gap-3">
										<Label>Transiciones entre vistas</Label>
										<Switch
											checked={preferences.fileBrowser.general.enableViewTransitions}
											onCheckedChange={(v) => updateFileBrowserConfig('general', 'enableViewTransitions', v)}
										/>
									</div>

									<div className="flex items-center gap-3">
										<Label>Selección múltiple</Label>
										<Switch
											checked={preferences.fileBrowser.general.enableMultiSelect}
											onCheckedChange={(v) => updateFileBrowserConfig('general', 'enableMultiSelect', v)}
										/>
									</div>

									<div className="flex items-center gap-3">
										<Label>Arrastrar y soltar</Label>
										<Switch
											checked={preferences.fileBrowser.general.enableDragAndDrop}
											onCheckedChange={(v) => updateFileBrowserConfig('general', 'enableDragAndDrop', v)}
										/>
									</div>

									<div className="flex items-center gap-3">
										<Label>Mostrar contador</Label>
										<Switch
											checked={preferences.fileBrowser.general.showItemCount}
											onCheckedChange={(v) => updateFileBrowserConfig('general', 'showItemCount', v)}
										/>
									</div>

									<div className="flex items-center gap-3">
										<Label>Mostrar tamaño total</Label>
										<Switch
											checked={preferences.fileBrowser.general.showTotalSize}
											onCheckedChange={(v) => updateFileBrowserConfig('general', 'showTotalSize', v)}
										/>
									</div>
								</div>
							</div>
						</TabsContent>

						{/* Tab Grid */}
						<TabsContent className="mt-4 space-y-4" value="grid">
							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Min. columnas</Label>
										<Input
											max={10}
											min={1}
											onChange={(e) => updateViewConfig('grid', 'minColumns', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.grid.minColumns}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Max. columnas</Label>
										<Input
											max={12}
											min={2}
											onChange={(e) => updateViewConfig('grid', 'maxColumns', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.grid.maxColumns}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Tamaño elemento</Label>
										<Input
											max={400}
											min={80}
											onChange={(e) => updateViewConfig('grid', 'itemSize', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.grid.itemSize}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Espaciado</Label>
										<Input
											max={32}
											min={0}
											onChange={(e) => updateViewConfig('grid', 'gap', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.grid.gap}
										/>
									</div>
								</div>

								<div className="flex flex-col gap-1">
									<Label>Relación de aspecto</Label>
									<Input
										max={3}
										min={0.5}
										onChange={(e) => updateViewConfig('grid', 'aspectRatio', Number(e.target.value))}
										step={0.1}
										type="number"
										value={preferences.fileBrowser.views.grid.aspectRatio}
									/>
								</div>

								<div className="space-y-2">
									<div className="flex items-center gap-3">
										<Label>Info al pasar mouse</Label>
										<Switch
											checked={preferences.fileBrowser.views.grid.showInfoOnHover}
											onCheckedChange={(v) => updateViewConfig('grid', 'showInfoOnHover', v)}
										/>
									</div>

									<div className="flex items-center gap-3">
										<Label>Animaciones hover</Label>
										<Switch
											checked={preferences.fileBrowser.views.grid.enableHoverAnimations}
											onCheckedChange={(v) => updateViewConfig('grid', 'enableHoverAnimations', v)}
										/>
									</div>
								</div>
							</div>
						</TabsContent>

						{/* Tab Cards */}
						<TabsContent className="mt-4 space-y-4" value="cards">
							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Min. columnas</Label>
										<Input
											max={6}
											min={1}
											onChange={(e) => updateViewConfig('cards', 'minColumns', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.cards.minColumns}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Max. columnas</Label>
										<Input
											max={8}
											min={2}
											onChange={(e) => updateViewConfig('cards', 'maxColumns', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.cards.maxColumns}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Ancho tarjeta</Label>
										<Input
											max={600}
											min={200}
											onChange={(e) => updateViewConfig('cards', 'cardWidth', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.cards.cardWidth}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Alto tarjeta</Label>
										<Input
											max={800}
											min={250}
											onChange={(e) => updateViewConfig('cards', 'cardHeight', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.cards.cardHeight}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Espaciado</Label>
										<Input
											max={48}
											min={8}
											onChange={(e) => updateViewConfig('cards', 'gap', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.cards.gap}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Tamaño preview</Label>
										<Select
											onValueChange={(v) => updateViewConfig('cards', 'previewSize', v)}
											value={preferences.fileBrowser.views.cards.previewSize}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="small">Pequeño</SelectItem>
												<SelectItem value="medium">Mediano</SelectItem>
												<SelectItem value="large">Grande</SelectItem>
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center gap-3">
										<Label>Mostrar metadatos</Label>
										<Switch
											checked={preferences.fileBrowser.views.cards.showMetadata}
											onCheckedChange={(v) => updateViewConfig('cards', 'showMetadata', v)}
										/>
									</div>

									<div className="flex items-center gap-3">
										<Label>Info técnica</Label>
										<Switch
											checked={preferences.fileBrowser.views.cards.showTechnicalInfo}
											onCheckedChange={(v) => updateViewConfig('cards', 'showTechnicalInfo', v)}
										/>
									</div>

									<div className="flex items-center gap-3">
										<Label>Mostrar badges</Label>
										<Switch
											checked={preferences.fileBrowser.views.cards.showBadges}
											onCheckedChange={(v) => updateViewConfig('cards', 'showBadges', v)}
										/>
									</div>
								</div>
							</div>
						</TabsContent>

						{/* Tab Masonry */}
						<TabsContent className="mt-4 space-y-4" value="masonry">
							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Min. columnas</Label>
										<Input
											max={8}
											min={2}
											onChange={(e) => updateViewConfig('masonry', 'minColumns', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.masonry.minColumns}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Max. columnas</Label>
										<Input
											max={12}
											min={3}
											onChange={(e) => updateViewConfig('masonry', 'maxColumns', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.masonry.maxColumns}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Ancho columna</Label>
										<Input
											max={400}
											min={120}
											onChange={(e) => updateViewConfig('masonry', 'columnWidth', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.masonry.columnWidth}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Gap columnas</Label>
										<Input
											max={24}
											min={2}
											onChange={(e) => updateViewConfig('masonry', 'columnGap', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.masonry.columnGap}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Gap filas</Label>
										<Input
											max={24}
											min={2}
											onChange={(e) => updateViewConfig('masonry', 'rowGap', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.masonry.rowGap}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Alt. máxima</Label>
										<Input
											max={800}
											min={200}
											onChange={(e) => updateViewConfig('masonry', 'maxItemHeight', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.masonry.maxItemHeight}
										/>
									</div>
								</div>

								<div className="flex flex-col gap-1">
									<Label>Altura mínima</Label>
									<Input
										max={300}
										min={80}
										onChange={(e) => updateViewConfig('masonry', 'minItemHeight', Number(e.target.value))}
										type="number"
										value={preferences.fileBrowser.views.masonry.minItemHeight}
									/>
								</div>

								<div className="space-y-2">
									<div className="flex items-center gap-3">
										<Label>Respetar aspect ratio</Label>
										<Switch
											checked={preferences.fileBrowser.views.masonry.respectAspectRatio}
											onCheckedChange={(v) => updateViewConfig('masonry', 'respectAspectRatio', v)}
										/>
									</div>

									<div className="flex items-center gap-3">
										<Label>Balanceo automático</Label>
										<Switch
											checked={preferences.fileBrowser.views.masonry.autoBalance}
											onCheckedChange={(v) => updateViewConfig('masonry', 'autoBalance', v)}
										/>
									</div>
								</div>
							</div>
						</TabsContent>

						{/* Tab List */}
						<TabsContent className="mt-4 space-y-4" value="list">
							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Altura fila</Label>
										<Input
											max={120}
											min={40}
											onChange={(e) => updateViewConfig('list', 'rowHeight', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.list.rowHeight}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Gap filas</Label>
										<Input
											max={16}
											min={0}
											onChange={(e) => updateViewConfig('list', 'rowGap', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.views.list.rowGap}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Tamaño thumbnails</Label>
										<Select
											onValueChange={(v) => updateViewConfig('list', 'thumbnailSize', v)}
											value={preferences.fileBrowser.views.list.thumbnailSize}
										>
											<SelectTrigger>
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="small">Pequeño</SelectItem>
												<SelectItem value="medium">Mediano</SelectItem>
												<SelectItem value="large">Grande</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className="mt-6 flex items-center gap-3">
										<Label>Mostrar thumbnails</Label>
										<Switch
											checked={preferences.fileBrowser.views.list.showThumbnails}
											onCheckedChange={(v) => updateViewConfig('list', 'showThumbnails', v)}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="font-medium text-sm">Columnas visibles</Label>
									<div className="grid grid-cols-2 gap-2">
										{Object.entries(preferences.fileBrowser.views.list.visibleColumns).map(([column, visible]) => (
											<div className="flex items-center gap-2" key={column}>
												<Switch
													checked={visible}
													id={`column-${column}`}
													onCheckedChange={(v) => updateListColumn(column, v)}
												/>
												<Label className="text-xs capitalize" htmlFor={`column-${column}`}>
													{column === 'dateModified'
														? 'Fecha Mod.'
														: column === 'dateCreated'
															? 'Fecha Creación'
															: column === 'name'
																? 'Nombre'
																: column === 'size'
																	? 'Tamaño'
																	: column === 'type'
																		? 'Tipo'
																		: column === 'dimensions'
																			? 'Dimensiones'
																			: column === 'tags'
																				? 'Etiquetas'
																				: column}
												</Label>
											</div>
										))}
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex items-center gap-3">
										<Label>Líneas zebra</Label>
										<Switch
											checked={preferences.fileBrowser.views.list.showZebraStripes}
											onCheckedChange={(v) => updateViewConfig('list', 'showZebraStripes', v)}
										/>
									</div>

									<div className="flex items-center gap-3">
										<Label>Modo compacto</Label>
										<Switch
											checked={preferences.fileBrowser.views.list.compactMode}
											onCheckedChange={(v) => updateViewConfig('list', 'compactMode', v)}
										/>
									</div>
								</div>
							</div>
						</TabsContent>

						{/* Tab Performance */}
						<TabsContent className="mt-4 space-y-4" value="performance">
							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Elementos pre-carga</Label>
										<Input
											max={100}
											min={5}
											onChange={(e) => updateFileBrowserConfig('performance', 'overscanCount', Number(e.target.value))}
											type="number"
											value={preferences.fileBrowser.performance.overscanCount}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Límite cache</Label>
										<Input
											max={1000}
											min={50}
											onChange={(e) =>
												updateFileBrowserConfig('performance', 'thumbnailCacheLimit', Number(e.target.value))
											}
											type="number"
											value={preferences.fileBrowser.performance.thumbnailCacheLimit}
										/>
									</div>
								</div>

								<div className="flex flex-col gap-1">
									<Label>Calidad thumbnails</Label>
									<Select
										onValueChange={(v) => updateFileBrowserConfig('performance', 'thumbnailQuality', v)}
										value={preferences.fileBrowser.performance.thumbnailQuality}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="low">Baja</SelectItem>
											<SelectItem value="medium">Media</SelectItem>
											<SelectItem value="high">Alta</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className="space-y-2">
									<div className="flex items-center gap-3">
										<Label>Virtualización</Label>
										<Switch
											checked={preferences.fileBrowser.performance.enableVirtualization}
											onCheckedChange={(v) => updateFileBrowserConfig('performance', 'enableVirtualization', v)}
										/>
									</div>

									<div className="flex items-center gap-3">
										<Label>Cache thumbnails</Label>
										<Switch
											checked={preferences.fileBrowser.performance.enableThumbnailCache}
											onCheckedChange={(v) => updateFileBrowserConfig('performance', 'enableThumbnailCache', v)}
										/>
									</div>
								</div>
							</div>
						</TabsContent>
					</Tabs>
				</CardContent>
			</Card>
		</div>
	);
};

export default InterfaceSection;

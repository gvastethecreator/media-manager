// src/components/settings/interface-section.tsx
// Sección de interfaz para controlar tipografía, tema, animaciones y otros aspectos visuales
// 🛠️ Cumple con los lineamientos de arquitectura y stack del proyecto

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInterfaceSettingsStore } from '@/store/entities/settings/store';
import { Columns, Eye, Grid, LayoutGrid, List, Settings, Zap } from 'lucide-react';
import React, { useId, useState } from 'react';

/**
 * InterfaceSection
 * Sección de configuración de interfaz de usuario (tipografía, tema, animaciones, FileBrowser, etc)
 */
const InterfaceSection: React.FC = () => {
	// Acceso a preferencias y setter desde Zustand
	const preferences = useInterfaceSettingsStore((s) => s.preferences);
	const setPreferences = useInterfaceSettingsStore((s: any) => (s.setPreferences ? s.setPreferences : () => { }));

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
			<Card className="bg-muted/30 rounded-sm border-none">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
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
							<Select value={preferences.fontFamily} onValueChange={(v) => setPreferences({ fontFamily: v })}>
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
							<Select value={preferences.fontSize} onValueChange={(v) => setPreferences({ fontSize: v })}>
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
							<Select value={preferences.theme} onValueChange={(v) => setPreferences({ theme: v })}>
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
								onCheckedChange={(v) => setPreferences({ animations: v })}
								id={animationsId}
							/>
						</div>

						{/* Thumbnails: Respetar aspect ratio en grilla */}
						<div className="flex items-center gap-3">
							<Label htmlFor={thumbnailsRespectAspectRatioId}>Respetar aspect ratio (grilla)</Label>
							<Switch
								checked={preferences.thumbnailsRespectAspectRatio}
								onCheckedChange={(v) => setPreferences({ thumbnailsRespectAspectRatio: v })}
								id={thumbnailsRespectAspectRatioId}
							/>
						</div>

						{/* Thumbnails: Bordes redondeados por modo */}
						<div className="flex flex-col gap-1">
							<Label>Borde redondeado thumbnails</Label>
							<div className="flex gap-2 items-center">
								<span className="text-xs text-muted-foreground w-12">Grilla</span>
								<Input
									type="number"
									min={0}
									max={32}
									value={preferences.thumbnailsBorderRadius.grid}
									onChange={(e) =>
										setPreferences({
											thumbnailsBorderRadius: { ...preferences.thumbnailsBorderRadius, grid: Number(e.target.value) },
										})
									}
									className="w-16"
								/>
								<span className="text-xs text-muted-foreground w-12">Card</span>
								<Input
									type="number"
									min={0}
									max={32}
									value={preferences.thumbnailsBorderRadius.card}
									onChange={(e) =>
										setPreferences({
											thumbnailsBorderRadius: { ...preferences.thumbnailsBorderRadius, card: Number(e.target.value) },
										})
									}
									className="w-16"
								/>
								<span className="text-xs text-muted-foreground w-12">Mosaico</span>
								<Input
									type="number"
									min={0}
									max={32}
									value={preferences.thumbnailsBorderRadius.mosaic}
									onChange={(e) =>
										setPreferences({
											thumbnailsBorderRadius: { ...preferences.thumbnailsBorderRadius, mosaic: Number(e.target.value) },
										})
									}
									className="w-16"
								/>
							</div>
						</div>

						{/* Thumbnails: Animaciones */}
						<div className="flex items-center gap-3">
							<Label htmlFor={thumbnailsAnimationsId}>Animaciones de thumbnails</Label>
							<Switch
								checked={preferences.thumbnailsAnimations}
								onCheckedChange={(v) => setPreferences({ thumbnailsAnimations: v })}
								id={thumbnailsAnimationsId}
							/>
						</div>

						{/* Thumbnails: Ultra performance */}
						<div className="flex items-center gap-3">
							<Label htmlFor={thumbnailsUltraPerformanceId}>Modo ultra performance</Label>
							<Switch
								checked={preferences.thumbnailsUltraPerformance}
								onCheckedChange={(v) => setPreferences({ thumbnailsUltraPerformance: v })}
								id={thumbnailsUltraPerformanceId}
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Configuración específica del FileBrowser */}
			<Card className="bg-muted/30 rounded-sm border-none">
				<CardHeader className="p-3 pb-2">
					<CardTitle className="text-base text-muted-foreground font-medium flex items-center gap-2">
						<Eye className="h-4 w-4" />
						<span>Visor de Archivos</span>
						<Badge variant="secondary" className="text-xs">
							FileBrowser
						</Badge>
					</CardTitle>
				</CardHeader>
				<Separator className="my-0" />
				<CardContent className="p-3">
					<Tabs value={activeFileBrowserTab} onValueChange={setActiveFileBrowserTab}>
						<TabsList className="grid w-full grid-cols-6">
							<TabsTrigger value="general" className="text-xs">
								<Settings className="h-3 w-3 mr-1" />
								General
							</TabsTrigger>
							<TabsTrigger value="grid" className="text-xs">
								<Grid className="h-3 w-3 mr-1" />
								Grid
							</TabsTrigger>
							<TabsTrigger value="cards" className="text-xs">
								<LayoutGrid className="h-3 w-3 mr-1" />
								Cards
							</TabsTrigger>
							<TabsTrigger value="masonry" className="text-xs">
								<Columns className="h-3 w-3 mr-1" />
								Mosaico
							</TabsTrigger>
							<TabsTrigger value="list" className="text-xs">
								<List className="h-3 w-3 mr-1" />
								Lista
							</TabsTrigger>
							<TabsTrigger value="performance" className="text-xs">
								<Zap className="h-3 w-3 mr-1" />
								Rendimiento
							</TabsTrigger>
						</TabsList>

						{/* Tab General */}
						<TabsContent value="general" className="space-y-4 mt-4">
							<div className="flex flex-col gap-3">
								<div className="flex flex-col gap-1">
									<Label>Vista por defecto</Label>
									<Select
										value={preferences.fileBrowser.general.defaultViewMode}
										onValueChange={(v) => updateFileBrowserConfig('general', 'defaultViewMode', v)}
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
										type="number"
										min={10}
										max={200}
										value={preferences.fileBrowser.general.itemsPerBatch}
										onChange={(e) => updateFileBrowserConfig('general', 'itemsPerBatch', Number(e.target.value))}
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
						<TabsContent value="grid" className="space-y-4 mt-4">
							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Min. columnas</Label>
										<Input
											type="number"
											min={1}
											max={10}
											value={preferences.fileBrowser.views.grid.minColumns}
											onChange={(e) => updateViewConfig('grid', 'minColumns', Number(e.target.value))}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Max. columnas</Label>
										<Input
											type="number"
											min={2}
											max={12}
											value={preferences.fileBrowser.views.grid.maxColumns}
											onChange={(e) => updateViewConfig('grid', 'maxColumns', Number(e.target.value))}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Tamaño elemento</Label>
										<Input
											type="number"
											min={80}
											max={400}
											value={preferences.fileBrowser.views.grid.itemSize}
											onChange={(e) => updateViewConfig('grid', 'itemSize', Number(e.target.value))}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Espaciado</Label>
										<Input
											type="number"
											min={0}
											max={32}
											value={preferences.fileBrowser.views.grid.gap}
											onChange={(e) => updateViewConfig('grid', 'gap', Number(e.target.value))}
										/>
									</div>
								</div>

								<div className="flex flex-col gap-1">
									<Label>Relación de aspecto</Label>
									<Input
										type="number"
										min={0.5}
										max={3}
										step={0.1}
										value={preferences.fileBrowser.views.grid.aspectRatio}
										onChange={(e) => updateViewConfig('grid', 'aspectRatio', Number(e.target.value))}
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
						<TabsContent value="cards" className="space-y-4 mt-4">
							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Min. columnas</Label>
										<Input
											type="number"
											min={1}
											max={6}
											value={preferences.fileBrowser.views.cards.minColumns}
											onChange={(e) => updateViewConfig('cards', 'minColumns', Number(e.target.value))}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Max. columnas</Label>
										<Input
											type="number"
											min={2}
											max={8}
											value={preferences.fileBrowser.views.cards.maxColumns}
											onChange={(e) => updateViewConfig('cards', 'maxColumns', Number(e.target.value))}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Ancho tarjeta</Label>
										<Input
											type="number"
											min={200}
											max={600}
											value={preferences.fileBrowser.views.cards.cardWidth}
											onChange={(e) => updateViewConfig('cards', 'cardWidth', Number(e.target.value))}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Alto tarjeta</Label>
										<Input
											type="number"
											min={250}
											max={800}
											value={preferences.fileBrowser.views.cards.cardHeight}
											onChange={(e) => updateViewConfig('cards', 'cardHeight', Number(e.target.value))}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Espaciado</Label>
										<Input
											type="number"
											min={8}
											max={48}
											value={preferences.fileBrowser.views.cards.gap}
											onChange={(e) => updateViewConfig('cards', 'gap', Number(e.target.value))}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Tamaño preview</Label>
										<Select
											value={preferences.fileBrowser.views.cards.previewSize}
											onValueChange={(v) => updateViewConfig('cards', 'previewSize', v)}
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
						<TabsContent value="masonry" className="space-y-4 mt-4">
							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Min. columnas</Label>
										<Input
											type="number"
											min={2}
											max={8}
											value={preferences.fileBrowser.views.masonry.minColumns}
											onChange={(e) => updateViewConfig('masonry', 'minColumns', Number(e.target.value))}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Max. columnas</Label>
										<Input
											type="number"
											min={3}
											max={12}
											value={preferences.fileBrowser.views.masonry.maxColumns}
											onChange={(e) => updateViewConfig('masonry', 'maxColumns', Number(e.target.value))}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Ancho columna</Label>
										<Input
											type="number"
											min={120}
											max={400}
											value={preferences.fileBrowser.views.masonry.columnWidth}
											onChange={(e) => updateViewConfig('masonry', 'columnWidth', Number(e.target.value))}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Gap columnas</Label>
										<Input
											type="number"
											min={2}
											max={24}
											value={preferences.fileBrowser.views.masonry.columnGap}
											onChange={(e) => updateViewConfig('masonry', 'columnGap', Number(e.target.value))}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Gap filas</Label>
										<Input
											type="number"
											min={2}
											max={24}
											value={preferences.fileBrowser.views.masonry.rowGap}
											onChange={(e) => updateViewConfig('masonry', 'rowGap', Number(e.target.value))}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Alt. máxima</Label>
										<Input
											type="number"
											min={200}
											max={800}
											value={preferences.fileBrowser.views.masonry.maxItemHeight}
											onChange={(e) => updateViewConfig('masonry', 'maxItemHeight', Number(e.target.value))}
										/>
									</div>
								</div>

								<div className="flex flex-col gap-1">
									<Label>Altura mínima</Label>
									<Input
										type="number"
										min={80}
										max={300}
										value={preferences.fileBrowser.views.masonry.minItemHeight}
										onChange={(e) => updateViewConfig('masonry', 'minItemHeight', Number(e.target.value))}
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
						<TabsContent value="list" className="space-y-4 mt-4">
							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Altura fila</Label>
										<Input
											type="number"
											min={40}
											max={120}
											value={preferences.fileBrowser.views.list.rowHeight}
											onChange={(e) => updateViewConfig('list', 'rowHeight', Number(e.target.value))}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Gap filas</Label>
										<Input
											type="number"
											min={0}
											max={16}
											value={preferences.fileBrowser.views.list.rowGap}
											onChange={(e) => updateViewConfig('list', 'rowGap', Number(e.target.value))}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Tamaño thumbnails</Label>
										<Select
											value={preferences.fileBrowser.views.list.thumbnailSize}
											onValueChange={(v) => updateViewConfig('list', 'thumbnailSize', v)}
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
									<div className="flex items-center gap-3 mt-6">
										<Label>Mostrar thumbnails</Label>
										<Switch
											checked={preferences.fileBrowser.views.list.showThumbnails}
											onCheckedChange={(v) => updateViewConfig('list', 'showThumbnails', v)}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-medium">Columnas visibles</Label>
									<div className="grid grid-cols-2 gap-2">
										{Object.entries(preferences.fileBrowser.views.list.visibleColumns).map(([column, visible]) => (
											<div key={column} className="flex items-center gap-2">
												<Switch
													checked={visible}
													onCheckedChange={(v) => updateListColumn(column, v)}
													id={`column-${column}`}
												/>
												<Label htmlFor={`column-${column}`} className="text-xs capitalize">
													{column === 'dateModified' ? 'Fecha Mod.' :
														column === 'dateCreated' ? 'Fecha Creación' :
															column === 'name' ? 'Nombre' :
																column === 'size' ? 'Tamaño' :
																	column === 'type' ? 'Tipo' :
																		column === 'dimensions' ? 'Dimensiones' :
																			column === 'tags' ? 'Etiquetas' : column}
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
						<TabsContent value="performance" className="space-y-4 mt-4">
							<div className="space-y-3">
								<div className="grid grid-cols-2 gap-3">
									<div className="flex flex-col gap-1">
										<Label>Elementos pre-carga</Label>
										<Input
											type="number"
											min={5}
											max={100}
											value={preferences.fileBrowser.performance.overscanCount}
											onChange={(e) => updateFileBrowserConfig('performance', 'overscanCount', Number(e.target.value))}
										/>
									</div>
									<div className="flex flex-col gap-1">
										<Label>Límite cache</Label>
										<Input
											type="number"
											min={50}
											max={1000}
											value={preferences.fileBrowser.performance.thumbnailCacheLimit}
											onChange={(e) => updateFileBrowserConfig('performance', 'thumbnailCacheLimit', Number(e.target.value))}
										/>
									</div>
								</div>

								<div className="flex flex-col gap-1">
									<Label>Calidad thumbnails</Label>
									<Select
										value={preferences.fileBrowser.performance.thumbnailQuality}
										onValueChange={(v) => updateFileBrowserConfig('performance', 'thumbnailQuality', v)}
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

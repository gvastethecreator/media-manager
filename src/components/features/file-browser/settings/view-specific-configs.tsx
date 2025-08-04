/**
 * @file View Specific Configuration Components
 * @module components/features/file-browser/settings/view-specific-configs
 * @description Componentes para configurar vistas específicas del FileBrowser.
 * Cada vista tiene sus propias opciones de personalización.
 */

import { Columns, Eye, Grid3X3, LayoutGrid, Maximize, MousePointer, Move, Palette, Type, Zap } from 'lucide-react';
import { useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { getMetadataKey, isMetadataKey } from '@/lib/metadata';
import { cn } from '@/lib/utils';
import type {
	CardsViewConfig,
	GridViewConfig,
	ListViewConfig,
	MasonryViewConfig,
} from '@/transformers/settings/schema';

// Configuración para ListView
interface ListViewConfigurationProps {
	config: ListViewConfig;
	onUpdate: (updates: Partial<ListViewConfig>) => Promise<boolean>;
	className?: string;
}

export function ListViewConfiguration({ config, onUpdate, className }: ListViewConfigurationProps) {
	const handleUpdate = useCallback(
		async (updates: Partial<ListViewConfig>) => {
			// Handle special cases for thumbnailSize updates
			if ('thumbnailSize' in updates) {
				const thumbnailSize = updates.thumbnailSize;
				if (thumbnailSize === 'none') {
					// If thumbnailSize is being set to none, remove it completely
					const { thumbnailSize, ...rest } = config;
					return await onUpdate({ ...rest });
				}
			}
			return await onUpdate(updates);
		},
		[onUpdate, config]
	);
	// Separar la lógica de actualización para cada sección
	const handleColumnVisibilityUpdate = useCallback(
		async (columnKey: string, visible: boolean) => {
			const updatedColumns = config.columns.map((col) => (col.key === columnKey ? { ...col, visible } : col));
			return await handleUpdate({ columns: updatedColumns });
		},
		[config.columns, handleUpdate]
	);

	return (
		<div className={cn('space-y-6', className)}>
			{/* Configuración de Columnas */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Columns className="h-4 w-4" />
						Columnas
					</CardTitle>
					<CardDescription>Configura qué columnas mostrar y su comportamiento</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Columnas Visibles</Label>
							<div className="space-y-2">
								{config.columns?.map((column) => (
									<div key={column.key} className="flex items-center space-x-2">
										<Switch
											id={`column-${column.key}`}
											checked={column.visible}
											onCheckedChange={(visible) => {
												const updatedColumns =
													config.columns?.map((col) => (col.key === column.key ? { ...col, visible } : col)) || [];
												handleUpdate({ columns: updatedColumns });
											}}
										/>
										<Label htmlFor={`column-${column.key}`}>{column.label}</Label>
									</div>
								))}
							</div>
						</div>

						<div className="space-y-4">
							<div className="space-y-2">
								<Label>Redimensionamiento</Label>
								<Switch
									checked={config.columns?.every((col) => col.resizable !== false) ?? true}
									onCheckedChange={(resizable) =>
										handleUpdate({
											columns:
												config.columns?.map((col) => ({
													...col,
													resizable,
												})) || [],
										})
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>Reordenamiento</Label>
								<Switch
									checked={config.columns?.every((col) => col.order !== undefined) ?? true}
									onCheckedChange={(orderable) =>
										handleUpdate({
											columns:
												config.columns?.map((col, index) => ({
													...col,
													order: orderable ? index : undefined,
												})) || [],
										})
									}
								/>
							</div>

							<div className="space-y-2">
								<Label>Mostrar Encabezado</Label>
								<Switch
									checked={config.showHeader ?? true}
									onCheckedChange={(showHeader) => handleUpdate({ showHeader })}
								/>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Configuración de Apariencia */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Palette className="h-4 w-4" />
						Apariencia
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Altura de Fila</Label>
							<div className="space-y-2">
								<Slider
									value={[config.rowHeight ?? 40]}
									onValueChange={([rowHeight]) => handleUpdate({ rowHeight })}
									min={40}
									max={120}
									step={4}
								/>
								<div className="text-sm text-muted-foreground">{config.rowHeight ?? 40}px</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Filas Alternadas</Label>
							<Switch
								checked={config.showZebraStripes ?? false}
								onCheckedChange={(showZebraStripes) => handleUpdate({ showZebraStripes })}
							/>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Miniaturas</Label>
						<div className="space-y-4">
							<div className="flex items-center gap-2">
								<Label>Mostrar</Label>
								<Switch
									checked={config.thumbnailSize !== undefined}
									onCheckedChange={(enabled) =>
										handleUpdate({
											thumbnailSize: enabled ? 'medium' : 'none',
										})
									}
								/>
							</div>
							{config.thumbnailSize !== 'none' && (
								<div className="space-y-2">
									<Label>Tamaño</Label>
									<Select
										value={config.thumbnailSize ?? 'medium'}
										onValueChange={(size: 'small' | 'medium' | 'large' | 'none') =>
											handleUpdate({ thumbnailSize: size })
										}
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
							)}{' '}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Configuración para GridView
interface GridViewConfigurationProps {
	config: GridViewConfig;
	onUpdate: (updates: Partial<GridViewConfig>) => Promise<boolean>;
	className?: string;
}

export function GridViewConfiguration({ config, onUpdate, className }: GridViewConfigurationProps) {
	const handleUpdate = useCallback(
		async (updates: Partial<GridViewConfig>) => {
			return await onUpdate(updates);
		},
		[onUpdate]
	);

	return (
		<div className={cn('space-y-6', className)}>
			{/* Configuración de Cuadrícula */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Grid3X3 className="h-4 w-4" />
						Cuadrícula
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Columnas por Fila</Label>
							<div className="space-y-2">
								<Slider
									value={[config.columns === 'auto' ? 4 : config.columns]}
									onValueChange={([columns]) => handleUpdate({ columns })}
									min={1}
									max={20}
									step={1}
								/>
								<div className="text-sm text-muted-foreground">
									{config.columns === 'auto' ? 'Auto' : `${config.columns} columnas`}
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Espaciado</Label>
							<div className="space-y-2">
								<Slider
									value={[config.gap ?? 16]}
									onValueChange={([gap]) => handleUpdate({ gap })}
									min={0}
									max={50}
									step={2}
								/>
								<div className="text-sm text-muted-foreground">{config.gap ?? 16}px</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Tamaño de Elemento</Label>
							<div className="space-y-2">
								<Slider
									value={[config.itemSize ?? 200]}
									onValueChange={([itemSize]) => handleUpdate({ itemSize })}
									min={50}
									max={800}
									step={10}
								/>
								<div className="text-sm text-muted-foreground">{config.itemSize ?? 200}px</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Relación de Aspecto</Label>
							<Select
								value={config.aspectRatio}
								onValueChange={(value: 'auto' | 'square' | '4:3' | '16:9' | 'custom') =>
									handleUpdate({ aspectRatio: value })
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="auto">Automático</SelectItem>
									<SelectItem value="square">Cuadrado (1:1)</SelectItem>
									<SelectItem value="4:3">Paisaje (4:3)</SelectItem>
									<SelectItem value="16:9">Ancho (16:9)</SelectItem>
									<SelectItem value="custom">Personalizado</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					{config.aspectRatio === 'custom' && (
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Ancho</Label>
								<Input
									type="number"
									value={config.customAspectRatio?.width ?? 1}
									onChange={(e) =>
										handleUpdate({
											customAspectRatio: {
												width: Number(e.target.value),
												height: config.customAspectRatio?.height ?? 1,
											},
										})
									}
									min={1}
								/>
							</div>
							<div className="space-y-2">
								<Label>Alto</Label>
								<Input
									type="number"
									value={config.customAspectRatio?.height ?? 1}
									onChange={(e) =>
										handleUpdate({
											customAspectRatio: {
												width: config.customAspectRatio?.width ?? 1,
												height: Number(e.target.value),
											},
										})
									}
									min={1}
								/>
							</div>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Configuración de Interacción */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<MousePointer className="h-4 w-4" />
						Interacción
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Efectos de Hover</Label>
							<Switch
								checked={config.animations?.enabled ?? true}
								onCheckedChange={(enabled) =>
									handleUpdate({
										animations: {
											...config.animations,
											enabled,
										},
									})
								}
							/>
						</div>

						<div className="space-y-2">
							<Label>Zoom en Hover</Label>
							<Slider
								value={[config.animations?.hoverScale ?? 1.05]}
								onValueChange={([hoverScale]) =>
									handleUpdate({
										animations: {
											...config.animations,
											hoverScale,
										},
									})
								}
								min={1}
								max={1.2}
								step={0.01}
							/>
							<div className="text-sm text-muted-foreground">{config.animations?.hoverScale ?? 1.05}x</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Mostrar Información</Label>
						<div className="grid grid-cols-2 gap-2">
							{[
								{ key: 'filename', label: 'Nombre' },
								{ key: 'size', label: 'Tamaño' },
								{ key: 'date', label: 'Fecha' },
								{ key: 'dimensions', label: 'Dimensiones' },
							].map(({ key, label }) => (
								<div key={key} className="flex items-center space-x-2">
									<Switch
										id={`info-${key}`}
										checked={config.hoverInfo === 'detailed'}
										onCheckedChange={(checked) => {
											handleUpdate({
												hoverInfo: checked ? 'detailed' : 'basic',
											});
										}}
									/>
									<Label htmlFor={`info-${key}`} className="text-sm">
										{label}
									</Label>
								</div>
							))}
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Configuración para CardsView
interface CardsViewConfigurationProps {
	config: CardsViewConfig;
	onUpdate: (updates: Partial<CardsViewConfig>) => Promise<boolean>;
	className?: string;
}

export function CardsViewConfiguration({ config, onUpdate, className }: CardsViewConfigurationProps) {
	const handleUpdate = useCallback(
		async (updates: Partial<CardsViewConfig>) => {
			// Handle special cases for thumbnailSize updates
			if ('thumbnailSize' in updates) {
				const thumbnailSize = updates.thumbnailSize;
				if (thumbnailSize === 'none') {
					// If thumbnailSize is being set to none, remove it completely
					const { thumbnailSize, ...rest } = config;
					return await onUpdate({ ...rest });
				}
			}
			return await onUpdate(updates);
		},
		[onUpdate, config]
	);

	return (
		<div className={cn('space-y-6', className)}>
			{/* Configuración de Tarjetas */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<LayoutGrid className="h-4 w-4" />
						Tarjetas
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Estilo de Tarjeta</Label>
							<Select
								value={config.cardStyle}
								onValueChange={(cardStyle: 'compact' | 'detailed' | 'minimal') => handleUpdate({ cardStyle })}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="compact">Compacto</SelectItem>
									<SelectItem value="detailed">Detallado</SelectItem>
									<SelectItem value="minimal">Minimalista</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Ancho de Tarjeta</Label>
							<div className="space-y-4">
								<div>
									<Label className="text-xs">Mínimo</Label>
									<Slider
										value={[config.minCardWidth ?? 200]}
										onValueChange={([minCardWidth]) => handleUpdate({ minCardWidth })}
										min={100}
										max={300}
										step={10}
									/>
									<div className="text-sm text-muted-foreground">{config.minCardWidth ?? 200}px</div>
								</div>

								<div>
									<Label className="text-xs">Predeterminado</Label>
									<Slider
										value={[config.cardWidth ?? 280]}
										onValueChange={([cardWidth]) => handleUpdate({ cardWidth })}
										min={120}
										max={500}
										step={20}
									/>
									<div className="text-sm text-muted-foreground">{config.cardWidth ?? 280}px</div>
								</div>

								<div>
									<Label className="text-xs">Máximo</Label>
									<Slider
										value={[config.maxCardWidth ?? 400]}
										onValueChange={([maxCardWidth]) => handleUpdate({ maxCardWidth })}
										min={200}
										max={600}
										step={20}
									/>
									<div className="text-sm text-muted-foreground">{config.maxCardWidth ?? 400}px</div>
								</div>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Relación de Aspecto</Label>
						<div className="space-y-4">
							<Slider
								value={[config.aspectRatio ?? 1.25]}
								onValueChange={([aspectRatio]) => handleUpdate({ aspectRatio })}
								min={0.5}
								max={3}
								step={0.1}
							/>
							<div className="text-sm text-muted-foreground">{config.aspectRatio ?? 1.25}:1</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Espaciado</Label>
							<div className="space-y-2">
								<Slider
									value={[config.gap ?? 16]}
									onValueChange={([gap]) => handleUpdate({ gap })}
									min={0}
									max={50}
									step={2}
								/>
								<div className="text-sm text-muted-foreground">{config.gap ?? 16}px</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Relleno</Label>
							<div className="space-y-2">
								<Slider
									value={[config.padding ?? 24]}
									onValueChange={([padding]) => handleUpdate({ padding })}
									min={0}
									max={50}
									step={2}
								/>
								<div className="text-sm text-muted-foreground">{config.padding ?? 24}px</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Configuración de Contenido */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Type className="h-4 w-4" />
						Contenido
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label>Metadatos a Mostrar</Label>
						<div className="grid grid-cols-2 gap-2">
							{[
								{ key: 'size', label: 'Tamaño' },
								{ key: 'date', label: 'Fecha' },
								{ key: 'type', label: 'Tipo' },
								{ key: 'dimensions', label: 'Dimensiones' },
								{ key: 'duration', label: 'Duración' },
								{ key: 'tags', label: 'Etiquetas' },
								{ key: 'collection', label: 'Colección' },
							].map(({ key, label }) => (
								<div key={key} className="flex items-center space-x-2">
									<Switch
										id={`metadata-${key}`}
										checked={config.metadataConfig[getMetadataKey(key)]}
										onCheckedChange={(checked) => {
											if (isMetadataKey(key)) {
												handleUpdate({
													metadataConfig: {
														...config.metadataConfig,
														[getMetadataKey(key)]: checked,
													},
												});
											}
										}}
									/>
									<Label htmlFor={`metadata-${key}`} className="text-sm">
										{label}
									</Label>
								</div>
							))}
						</div>
					</div>

					<Separator />

					<div className="grid grid-cols-3 gap-4">
						<div className="space-y-2">
							<Label>Sombras</Label>
							<Switch checked={config.showShadows} onCheckedChange={(showShadows) => handleUpdate({ showShadows })} />
						</div>

						<div className="space-y-2">
							<Label>Bordes Redondeados</Label>
							<Switch
								checked={config.roundedCorners}
								onCheckedChange={(roundedCorners) => handleUpdate({ roundedCorners })}
							/>
						</div>

						<div className="space-y-2">
							<Label>Animaciones</Label>
							<Switch
								checked={config.animationsEnabled}
								onCheckedChange={(animationsEnabled) => handleUpdate({ animationsEnabled })}
							/>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Configuración para MasonryView
interface MasonryViewConfigurationProps {
	config: MasonryViewConfig;
	onUpdate: (updates: Partial<MasonryViewConfig>) => Promise<boolean>;
	className?: string;
}

export function MasonryViewConfiguration({ config, onUpdate, className }: MasonryViewConfigurationProps) {
	const handleUpdate = useCallback(
		(updates: Partial<MasonryViewConfig>) => {
			return onUpdate(updates);
		},
		[onUpdate]
	);

	return (
		<div className={cn('space-y-6', className)}>
			{/* Configuración de Espaciado */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Move className="h-4 w-4" />
						Espaciado y Columnas
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Espaciado</Label>
							<div className="space-y-2">
								<Slider
									value={[config.spacing?.gap ?? 16]}
									onValueChange={([gap]) =>
										handleUpdate({
											spacing: {
												...config.spacing,
												gap,
											},
										})
									}
									min={0}
									max={50}
									step={2}
								/>
								<div className="text-sm text-muted-foreground">{config.spacing?.gap ?? 16}px</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Relleno</Label>
							<div className="space-y-2">
								<Slider
									value={[config.spacing?.padding ?? 24]}
									onValueChange={([padding]) =>
										handleUpdate({
											spacing: {
												...config.spacing,
												padding,
											},
										})
									}
									min={0}
									max={50}
									step={2}
								/>
								<div className="text-sm text-muted-foreground">{config.spacing?.padding ?? 24}px</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Mínimo de Columnas</Label>
							<div className="space-y-2">
								<Slider
									value={[config.spacing?.minColumns ?? 1]}
									onValueChange={([minColumns]) =>
										handleUpdate({
											spacing: {
												...config.spacing,
												minColumns,
											},
										})
									}
									min={1}
									max={3}
									step={1}
								/>
								<div className="text-sm text-muted-foreground">{config.spacing?.minColumns ?? 1}</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Máximo de Columnas</Label>
							<div className="space-y-2">
								<Slider
									value={[config.spacing?.maxColumns ?? 8]}
									onValueChange={([maxColumns]) =>
										handleUpdate({
											spacing: {
												...config.spacing,
												maxColumns,
											},
										})
									}
									min={3}
									max={12}
									step={1}
								/>
								<div className="text-sm text-muted-foreground">{config.spacing?.maxColumns ?? 8}</div>
							</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Ancho Mínimo de Columna</Label>
							<div className="space-y-2">
								<Slider
									value={[config.spacing?.minColumnWidth ?? 200]}
									onValueChange={([minColumnWidth]) =>
										handleUpdate({
											spacing: {
												...config.spacing,
												minColumnWidth,
											},
										})
									}
									min={100}
									max={300}
									step={20}
								/>
								<div className="text-sm text-muted-foreground">{config.spacing?.minColumnWidth ?? 200}px</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Ancho Máximo de Columna</Label>
							<div className="space-y-2">
								<Slider
									value={[config.spacing?.maxColumnWidth ?? 400]}
									onValueChange={([maxColumnWidth]) =>
										handleUpdate({
											spacing: {
												...config.spacing,
												maxColumnWidth,
											},
										})
									}
									min={200}
									max={600}
									step={20}
								/>
								<div className="text-sm text-muted-foreground">{config.spacing?.maxColumnWidth ?? 400}px</div>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>

			{/* Configuración de Altura */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Maximize className="h-4 w-4" />
						Altura
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Altura Base</Label>
							<div className="space-y-2">
								<Slider
									value={[config.height.baseHeight]}
									onValueChange={([baseHeight]) =>
										handleUpdate({
											height: {
												...config.height,
												baseHeight,
											},
										})
									}
									min={100}
									max={500}
									step={20}
								/>
								<div className="text-sm text-muted-foreground">{config.height.baseHeight}px</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Factor de Variación</Label>
							<div className="space-y-2">
								<Slider
									value={[config.height.variationFactor * 100]}
									onValueChange={([value]) =>
										handleUpdate({
											height: {
												...config.height,
												variationFactor: value / 100,
											},
										})
									}
									min={0}
									max={100}
									step={5}
								/>
								<div className="text-sm text-muted-foreground">{config.height.variationFactor * 100}%</div>
							</div>
						</div>
					</div>{' '}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Altura Mínima</Label>
							<div className="space-y-2">
								<Slider
									value={[config.height?.minHeight ?? 120]}
									onValueChange={([minHeight]) =>
										handleUpdate({
											height: {
												...config.height,
												minHeight,
											},
										})
									}
									min={80}
									max={200}
									step={20}
								/>
								<div className="text-sm text-muted-foreground">{config.height?.minHeight ?? 120}px</div>
							</div>
						</div>

						<div className="space-y-2">
							<Label>Altura Máxima</Label>
							<div className="space-y-2">
								<Slider
									value={[config.height?.maxHeight ?? 600]}
									onValueChange={([maxHeight]) =>
										handleUpdate({
											height: {
												...config.height,
												maxHeight,
											},
										})
									}
									min={300}
									max={1000}
									step={50}
								/>
								<div className="text-sm text-muted-foreground">{config.height?.maxHeight ?? 600}px</div>
							</div>
						</div>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="useRealDimensions"
							checked={config.height?.useRealDimensions ?? true}
							onCheckedChange={(useRealDimensions) =>
								handleUpdate({
									height: {
										...config.height,
										useRealDimensions,
									},
								})
							}
						/>
						<Label htmlFor="useRealDimensions">Usar dimensiones reales</Label>
					</div>
				</CardContent>
			</Card>

			{/* Configuración de Optimización */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Zap className="h-4 w-4" />
						Optimización
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Algoritmo</Label>
							<Select
								value={config.optimization.algorithm}
								onValueChange={(algorithm: 'shortest-column' | 'balanced' | 'left-to-right') =>
									handleUpdate({
										optimization: {
											...config.optimization,
											algorithm,
										},
									})
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="shortest-column">Columna más corta</SelectItem>
									<SelectItem value="balanced">Equilibrado</SelectItem>
									<SelectItem value="left-to-right">Izquierda a derecha</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-2">
							<Label>Tamaño de Lote</Label>
							<div className="space-y-2">
								<Slider
									value={[config.optimization?.batchSize ?? 50]}
									onValueChange={([batchSize]) =>
										handleUpdate({
											optimization: {
												...config.optimization,
												batchSize,
											},
										})
									}
									min={10}
									max={200}
									step={10}
								/>
								<div className="text-sm text-muted-foreground">{config.optimization?.batchSize ?? 50} elementos</div>
							</div>
						</div>
					</div>

					<div className="space-y-2">
						<Label>Demora de Recálculo</Label>
						<div className="space-y-2">
							<Slider
								value={[config.optimization?.recalculateDebounce ?? 150]}
								onValueChange={([recalculateDebounce]) =>
									handleUpdate({
										optimization: {
											...config.optimization,
											recalculateDebounce,
										},
									})
								}
								min={50}
								max={500}
								step={50}
							/>
							<div className="text-sm text-muted-foreground">{config.optimization?.recalculateDebounce ?? 150}ms</div>
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Rebalanceo Automático</Label>
							<Switch
								checked={config.optimization?.autoRebalance ?? true}
								onCheckedChange={(autoRebalance) =>
									handleUpdate({
										optimization: {
											...config.optimization,
											autoRebalance,
										},
									})
								}
							/>
						</div>

						<div className="space-y-2">
							<Label>Minimizar Espacios</Label>
							<Switch
								checked={config.optimization?.minimizeGaps ?? true}
								onCheckedChange={(minimizeGaps) =>
									handleUpdate({
										optimization: {
											...config.optimization,
											minimizeGaps,
										},
									})
								}
							/>
						</div>
					</div>

					<div className="flex items-center space-x-2">
						<Switch
							id="respectAspectRatio"
							checked={config.optimization?.respectAspectRatio ?? true}
							onCheckedChange={(respectAspectRatio) =>
								handleUpdate({
									optimization: {
										...config.optimization,
										respectAspectRatio,
									},
								})
							}
						/>
						<Label htmlFor="respectAspectRatio">Respetar relación de aspecto</Label>
					</div>
				</CardContent>
			</Card>

			{/* Configuración de Efectos */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Eye className="h-4 w-4" />
						Apariencia e Interacción
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Efectos Visuales</Label>
							<Switch
								checked={config.animationsEnabled}
								onCheckedChange={(animationsEnabled) => handleUpdate({ animationsEnabled })}
							/>
						</div>

						{config.animationsEnabled && (
							<div className="space-y-2">
								<Label>Duración de Animaciones</Label>
								<div className="space-y-2">
									<Slider
										value={[config.animationDuration]}
										onValueChange={([value]) => handleUpdate({ animationDuration: value })}
										min={50}
										max={1000}
										step={50}
									/>
									<div className="text-sm text-muted-foreground">{config.animationDuration}ms</div>
								</div>
							</div>
						)}
					</div>{' '}
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Animaciones</Label>
							<Switch
								checked={config.animationsEnabled ?? true}
								onCheckedChange={(animationsEnabled) => handleUpdate({ animationsEnabled })}
							/>
						</div>

						<div className="space-y-2">
							<Label>Efectos de Animación</Label>
							<Switch
								checked={config.animationsEnabled}
								onCheckedChange={(animationsEnabled) => handleUpdate({ animationsEnabled })}
							/>
						</div>
					</div>
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label>Selección Múltiple</Label>
							<Switch
								checked={config.allowMultiSelect ?? true}
								onCheckedChange={(allowMultiSelect) => handleUpdate({ allowMultiSelect })}
							/>
						</div>

						<div className="space-y-2">
							<Label>Mostrar Selección</Label>
							<Switch
								checked={config.showSelectionIndicators ?? true}
								onCheckedChange={(showSelectionIndicators) => handleUpdate({ showSelectionIndicators })}
							/>
						</div>
					</div>
					{config.animationsEnabled && (
						<div className="space-y-2">
							<Label>Duración de Animaciones</Label>
							<div className="space-y-2">
								<Slider
									value={[config.animationDuration ?? 300]}
									onValueChange={([animationDuration]) => handleUpdate({ animationDuration })}
									min={50}
									max={1000}
									step={50}
								/>
								<div className="text-sm text-muted-foreground">{config.animationDuration ?? 300}ms</div>
							</div>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

// Componente principal que renderiza la configuración según el tipo de vista
interface ViewSpecificConfigurationProps<T> {
	viewType: 'listView' | 'gridView' | 'cardsView' | 'masonryView';
	config: T;
	onUpdate: (updates: Partial<T>) => Promise<boolean>;
	className?: string;
}

export function ViewSpecificConfiguration<
	T extends ListViewConfig | GridViewConfig | CardsViewConfig | MasonryViewConfig,
>({ viewType, config, onUpdate, className }: ViewSpecificConfigurationProps<T>) {
	switch (viewType) {
		case 'listView':
			return (
				<ListViewConfiguration
					config={config as ListViewConfig}
					onUpdate={onUpdate as (updates: Partial<ListViewConfig>) => Promise<boolean>}
					className={className}
				/>
			);
		case 'gridView':
			return (
				<GridViewConfiguration
					config={config as GridViewConfig}
					onUpdate={onUpdate as (updates: Partial<GridViewConfig>) => Promise<boolean>}
					className={className}
				/>
			);
		case 'cardsView':
			return (
				<CardsViewConfiguration
					config={config as CardsViewConfig}
					onUpdate={onUpdate as (updates: Partial<CardsViewConfig>) => Promise<boolean>}
					className={className}
				/>
			);
		case 'masonryView':
			return (
				<MasonryViewConfiguration
					config={config as MasonryViewConfig}
					onUpdate={onUpdate as (updates: Partial<MasonryViewConfig>) => Promise<boolean>}
					className={className}
				/>
			);
		default:
			return <div className="text-sm text-muted-foreground">Configuración no disponible para {viewType}</div>;
	}
}

'use client';

import { LayerPluginProvider, LayerRenderer, RegisterAllLayers, useLayerPlugin } from '@/components/features/entity-cards/layers';
import {
	FormGroup,
	FormInput,
	FormLayout,
	FormRow,
	FormSection,
	FormSelect,
	FormSlider,
	FormToggle,
} from '@/components/features/entity-cards/settings/panels/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Eye, Info, Layers, LayoutGrid, Maximize2, RotateCw, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import type { PreviewModuleProps } from './types';
import { usePreview } from './use-preview';

/**
 * Componente de vista previa real de la tarjeta con capas
 */
function CardPreview({
	entityType,
	entityId,
	activeLayerId,
	isExploded,
	onLayerSelect,
	className
}: {
	entityType?: string;
	entityId?: string;
	activeLayerId?: string | null;
	isExploded?: boolean;
	onLayerSelect?: (layerId: string | null) => void;
	className?: string;
}) {
	const { getLayers } = useLayerPlugin();
	const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
	const [isHovered, setIsHovered] = useState(false);
	const layers = getLayers();

	// Transformación para capas en vista explotada
	const getExplodeTransform = (index: number) => {
		if (!isExploded) return {};

		const offset = 10 * (index + 1);
		return {
			transform: `translateY(${offset}px)`,
			opacity: 1 - index * 0.05,
		};
	};

	// Manejar movimiento del ratón
	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		const x = ((e.clientX - rect.left) / rect.width) * 100;
		const y = ((e.clientY - rect.top) / rect.height) * 100;
		setMousePosition({ x, y });
	};

	return (
		<div
			className={cn(
				"relative aspect-[3/4] w-full max-w-[300px] mx-auto",
				"border rounded-lg overflow-hidden bg-background/5",
				"transition-all duration-300 ease-in-out",
				className
			)}
			onMouseMove={handleMouseMove}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
		>
			{/* Renderizar todas las capas disponibles */}
			<LayerRenderer
				entityType={entityType || 'default'}
				entityId={entityId}
				activeLayer={activeLayerId}
				isExploded={isExploded}
				isHovered={isHovered}
				mousePosition={mousePosition}
				getExplodeLayerTransform={getExplodeTransform}
				onClick={onLayerSelect ? (layerId) => onLayerSelect(layerId) : undefined}
			/>

			{/* Mensaje de ayuda */}
			{layers.length === 0 && (
				<div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 gap-2">
					<p className="text-muted-foreground text-sm">
						No hay capas registradas. El componente RegisterAllLayers debería estar incluido.
					</p>
					<Button
						variant="outline"
						size="sm"
						onClick={() => {
							// Force reload the component to register layers
							window.location.reload();
						}}
						className="text-xs"
					>
						Reintentar cargar capas
					</Button>
				</div>
			)}

			{/* Mostrar información sobre las capas activas cuando hay capas pero ninguna está activa */}
			{layers.length > 0 && isExploded && (
				<div className="absolute bottom-2 right-2 bg-background/80 rounded-md p-2 text-xs">
					<div className="font-medium mb-1">Capas activas ({layers.length})</div>
					<div className="flex flex-wrap gap-1">
						{layers.map(layer => (
							<div
								key={layer.type}
								className={cn(
									"px-1.5 py-0.5 rounded text-[10px]",
									activeLayerId === layer.type
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground"
								)}
							>
								{layer.type}
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

/**
 * Panel de selección de capas
 */
function LayerSelectionPanel({
	activeLayerId,
	onLayerSelect,
	className
}: {
	activeLayerId?: string | null;
	onLayerSelect?: (layerId: string | null) => void;
	className?: string;
}) {
	const { getLayers } = useLayerPlugin();
	const layers = getLayers();

	if (layers.length === 0) return null;

	return (
		<div className={cn("space-y-2", className)}>
			<div className="text-sm font-medium">Capas disponibles</div>
			<div className="flex flex-wrap gap-2">
				{layers.map(layer => (
					<Button
						key={layer.type}
						size="sm"
						variant={activeLayerId === layer.type ? "secondary" : "outline"}
						onClick={() => onLayerSelect?.(layer.type === activeLayerId ? null : layer.type)}
						className="text-xs"
					>
						{layer.type}
					</Button>
				))}
			</div>
		</div>
	);
}

/**
 * Componente principal del módulo de previsualización
 */
export function PreviewModule({
	initialOptions = {},
	onChange,
	disabled = false,
	className,
	rarity,
	texture,
	entityType,
	activeLayerId,
	isExploded,
	onExplodedChange,
	onActiveLayerChange
}: PreviewModuleProps) {
	// Utilizamos el hook para gestionar la previsualización
	const { options, sizeOptions, updateOption } = usePreview({
		initialOptions,
		onChange,
		disabled,
	});

	// Estado local para manejar capa activa y explosión cuando no se proporcionan handlers
	const [localActiveLayerId, setLocalActiveLayerId] = useState<string | null>(null);
	const [localIsExploded, setLocalIsExploded] = useState(false);

	// Determinar qué estado usar (el pasado como props o el local)
	const effectiveActiveLayerId = activeLayerId !== undefined ? activeLayerId : localActiveLayerId;
	const effectiveIsExploded = isExploded !== undefined ? isExploded : localIsExploded;

	// Manejadores efectivos para cambios
	const handleLayerSelect = (layerId: string | null) => {
		if (onActiveLayerChange) {
			onActiveLayerChange(layerId);
		} else {
			setLocalActiveLayerId(layerId);
		}
	};

	const handleExplodedChange = (exploded: boolean) => {
		if (onExplodedChange) {
			onExplodedChange(exploded);
		} else {
			setLocalIsExploded(exploded);
		}
	};

	// Determinar si estamos en modo visualización o edición
	const isViewMode = entityType !== undefined;

	// Determinar si se deben mostrar los campos de dimensiones personalizadas
	const showCustomDimensions = options.size === 'custom';

	return (
		<LayerPluginProvider>
			<RegisterAllLayers />
			<Card className={cn('w-full bg-slate-50/20 border-slate-200/50', className)}>
				<div className="p-1">
					{/* Vista previa de la tarjeta con capas */}
					<div className="mb-4 p-4">
						<CardPreview
							entityType={entityType}
							entityId="preview"
							activeLayerId={effectiveActiveLayerId}
							isExploded={effectiveIsExploded}
							onLayerSelect={handleLayerSelect}
						/>
					</div>

					<Separator className="my-2" />

					{/* Panel de selección de capas */}
					<div className="px-4 py-2">
						<LayerSelectionPanel
							activeLayerId={effectiveActiveLayerId}
							onLayerSelect={handleLayerSelect}
						/>
					</div>

					<Separator className="my-2" />

					<FormLayout title="Vista Previa" description="Configura la visualización de la tarjeta en modo vista previa">
						{/* Mostrar sección de entidad y capa activa si estamos en modo visualización */}
						{isViewMode && (
							<FormSection title="Entidad">
								<FormGroup>
									<FormRow>
										<div className="flex flex-col space-y-1.5 w-full">
											<div className="text-sm font-medium">Tipo de Entidad</div>
											<div className="text-xs text-muted-foreground">{entityType || 'No especificado'}</div>
										</div>
									</FormRow>
									{rarity && (
										<FormRow>
											<div className="flex flex-col space-y-1.5 w-full">
												<div className="text-sm font-medium">Rareza</div>
												<div className="text-xs text-muted-foreground">{rarity.name || 'No especificada'}</div>
											</div>
										</FormRow>
									)}
									{texture && (
										<FormRow>
											<div className="flex flex-col space-y-1.5 w-full">
												<div className="text-sm font-medium">Textura</div>
												<div className="text-xs text-muted-foreground">{texture.name || 'No especificada'}</div>
											</div>
										</FormRow>
									)}
								</FormGroup>
							</FormSection>
						)}

						<FormSection title="Capas">
							<FormGroup>
								<FormToggle
									id="exploded-view"
									label="Vista Explosionada"
									description="Muestra las capas separadas"
									checked={effectiveIsExploded}
									onCheckedChange={handleExplodedChange}
									disabled={disabled}
									icon={<Layers className="h-4 w-4" />}
								/>
							</FormGroup>
							{effectiveActiveLayerId && (
								<FormRow>
									<div className="flex flex-col space-y-1.5 w-full">
										<div className="text-sm font-medium">Capa Activa</div>
										<div className="text-xs text-muted-foreground">{effectiveActiveLayerId}</div>
									</div>
								</FormRow>
							)}
						</FormSection>

						{/* Solo mostrar configuraciones en modo edición (cuando onChange está definido) */}
						{onChange && (
							<>
								<FormSection title="Tamaño">
									<FormGroup>
										<FormSelect
											id="preview-size"
											label="Tamaño de Vista Previa"
											description="Selecciona el tamaño de las tarjetas en la vista previa"
											value={options.size}
											onValueChange={(value: string) => updateOption('size', value)}
											options={sizeOptions}
											disabled={disabled}
											icon={<Maximize2 className="h-4 w-4" />}
										/>
									</FormGroup>

									{showCustomDimensions && (
										<FormGroup>
											<FormRow>
												<FormInput
													id="custom-width"
													label="Ancho personalizado"
													type="number"
													value={options.customWidth?.toString() || '300'}
													onChange={(value: string) => updateOption('customWidth', Number.parseInt(value, 10))}
													disabled={disabled}
												/>
												<FormInput
													id="custom-height"
													label="Alto personalizado"
													type="number"
													value={options.customHeight?.toString() || '400'}
													onChange={(value: string) => updateOption('customHeight', Number.parseInt(value, 10))}
													disabled={disabled}
												/>
											</FormRow>
										</FormGroup>
									)}
								</FormSection>

								<FormSection title="Visualización">
									<FormGroup>
										<FormToggle
											id="show-controls"
											label="Mostrar Controles"
											description="Muestra los controles de navegación en la vista previa"
											checked={options.showControls}
											onCheckedChange={(checked: boolean) => updateOption('showControls', checked)}
											disabled={disabled}
											icon={<LayoutGrid className="h-4 w-4" />}
										/>

										<FormToggle
											id="show-info"
											label="Mostrar Información"
											description="Muestra información adicional sobre la tarjeta"
											checked={options.showInfo}
											onCheckedChange={(checked: boolean) => updateOption('showInfo', checked)}
											disabled={disabled}
											icon={<Info className="h-4 w-4" />}
										/>
									</FormGroup>

									<FormGroup>
										<FormToggle
											id="show-border"
											label="Mostrar Borde"
											description="Muestra un borde alrededor de la tarjeta"
											checked={options.showBorder}
											onCheckedChange={(checked: boolean) => updateOption('showBorder', checked)}
											disabled={disabled}
										/>
									</FormGroup>
								</FormSection>

								<FormSection title="Interacción">
									<FormGroup>
										<FormToggle
											id="enable-interaction"
											label="Habilitar Interacción"
											description="Permite interactuar con la tarjeta en la vista previa"
											checked={options.enableInteraction}
											onCheckedChange={(checked: boolean) => updateOption('enableInteraction', checked)}
											disabled={disabled}
											icon={<Eye className="h-4 w-4" />}
										/>

										<FormToggle
											id="auto-rotate"
											label="Rotación Automática"
											description="Rota automáticamente la tarjeta en la vista previa"
											checked={options.autoRotate}
											onCheckedChange={(checked: boolean) => updateOption('autoRotate', checked)}
											disabled={disabled}
											icon={<RotateCw className="h-4 w-4" />}
										/>
									</FormGroup>

									{options.autoRotate && (
										<FormGroup>
											<FormSlider
												id="rotation-speed"
												label="Velocidad de Rotación"
												description="Ajusta la velocidad de rotación automática"
												value={options.rotationSpeed || 1}
												onValueChange={(value: number) => updateOption('rotationSpeed', value)}
												min={0.5}
												max={5}
												step={0.5}
												disabled={disabled}
											/>
										</FormGroup>
									)}

									<FormGroup>
										<FormSlider
											id="zoom-level"
											label="Nivel de Zoom"
											description="Ajusta el nivel de zoom inicial"
											value={options.zoomLevel || 1}
											onValueChange={(value: number) => updateOption('zoomLevel', value)}
											min={0.5}
											max={2}
											step={0.1}
											disabled={disabled}
											icon={<ZoomIn className="h-4 w-4" />}
										/>
									</FormGroup>
								</FormSection>
							</>
						)}
					</FormLayout>
				</div>
			</Card>
		</LayerPluginProvider>
	);
}

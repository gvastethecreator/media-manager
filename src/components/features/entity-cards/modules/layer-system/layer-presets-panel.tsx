'use client';

/**
 * 🧩 Panel de selección de presets de capas
 *
 * Este componente permite seleccionar y aplicar configuraciones predefinidas
 * para el sistema de capas de las tarjetas de entidad.
 */

import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useState } from 'react';
import type { EntityCardLayerSystemConfig } from './entity-card-layer-adapter';
import { applyPresetToConfig, getPresetsByEntityType, type LayerPreset } from './layer-presets';

interface LayerPresetsPanelProps {
	/** Configuración actual del sistema de capas */
	currentConfig: EntityCardLayerSystemConfig;
	/** Función llamada cuando se selecciona un preset */
	onApplyPreset: (config: EntityCardLayerSystemConfig) => void;
	/** Tipo de entidad para filtrar presets (opcional) */
	entityType?: string;
	/** Preset activo actual */
	activePresetId?: string;
}

/**
 * Panel para seleccionar y aplicar presets de capas
 */
export function LayerPresetsPanel({
	currentConfig,
	onApplyPreset,
	entityType = 'all',
	activePresetId,
}: LayerPresetsPanelProps) {
	// Estado para la categoría activa de presets
	const [activeCategory, setActiveCategory] = useState<string>('basic');

	// Obtener presets filtrados por tipo de entidad y categoría
	const presets = getPresetsByEntityType(entityType);
	const filteredPresets = activeCategory === 'all'
		? presets
		: presets.filter(preset => preset.category === activeCategory);

	// Aplicar un preset a la configuración actual
	const handleSelectPreset = (preset: LayerPreset) => {
		const newConfig = applyPresetToConfig(preset, currentConfig);
		onApplyPreset(newConfig);
	};

	return (
		<div className="space-y-3">
			{/* Selector de categorías */}
			<Tabs
				value={activeCategory}
				onValueChange={setActiveCategory}
				className="w-full"
			>
				<TabsList className="w-full grid grid-cols-4 h-8 bg-muted/20">
					<TabsTrigger
						value="all"
						className="text-[10px] h-6"
					>
						Todos
					</TabsTrigger>
					<TabsTrigger
						value="basic"
						className="text-[10px] h-6"
					>
						Básicos
					</TabsTrigger>
					<TabsTrigger
						value="advanced"
						className="text-[10px] h-6"
					>
						Avanzados
					</TabsTrigger>
					<TabsTrigger
						value="special"
						className="text-[10px] h-6"
					>
						Especiales
					</TabsTrigger>
				</TabsList>
			</Tabs>

			{/* Lista de presets */}
			<ScrollArea className="h-64 rounded-md border bg-muted/10 border-muted/30 p-1">
				<div className="grid grid-cols-2 gap-2 p-1">
					{filteredPresets.length > 0 ? (
						filteredPresets.map((preset) => (
							<PresetCard
								key={preset.id}
								preset={preset}
								isActive={preset.id === activePresetId}
								onClick={() => handleSelectPreset(preset)}
							/>
						))
					) : (
						<div className="col-span-2 flex items-center justify-center h-32 text-center text-[11px] text-muted-foreground">
							No hay presets disponibles para esta categoría
						</div>
					)}
				</div>
			</ScrollArea>
		</div>
	);
}

/**
 * Tarjeta que muestra un preset individual
 */
function PresetCard({
	preset,
	isActive,
	onClick,
}: {
	preset: LayerPreset;
	isActive: boolean;
	onClick: () => void;
}) {
	return (
		<Card
			className={cn(
				"cursor-pointer overflow-hidden border transition-all duration-200 h-28",
				"hover:shadow-md hover:border-primary/30",
				isActive && "border-primary/70 bg-primary/5"
			)}
			onClick={onClick}
		>
			<CardContent className="p-2 h-full flex flex-col">
				<div className="flex items-start justify-between mb-1">
					<div className="space-y-0.5">
						<h3 className="text-[11px] font-medium line-clamp-1">{preset.name}</h3>
						<p className="text-[9px] text-muted-foreground line-clamp-2">
							{preset.description}
						</p>
					</div>
					{isActive && (
						<div className="bg-primary text-primary-foreground rounded-full p-0.5 -mt-0.5">
							<Check className="h-3 w-3" />
						</div>
					)}
				</div>

				{/* Indicadores visuales de características */}
				<div className="mt-auto pt-1 flex flex-wrap gap-1">
					{preset.config.layerSystem.enabledLayers && Object.entries(preset.config.layerSystem.enabledLayers)
						.filter(([_, enabled]) => enabled)
						.map(([layerId]) => (
							<span
								key={layerId}
								className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted/30 text-muted-foreground"
							>
								{layerId}
							</span>
						))
					}
				</div>
			</CardContent>
		</Card>
	);
}

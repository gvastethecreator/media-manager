'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useEffect, useState } from 'react';

interface LayerSystemConfig {
	order: string[];
	explodeView: boolean;
	explodeDistance: number;
	layerBlending: string;
	layerSpacing: number;
}

const DEFAULT_LAYER_SYSTEM: LayerSystemConfig = {
	order: [],
	explodeView: false,
	explodeDistance: 10,
	layerBlending: 'normal',
	layerSpacing: 2
};

interface LayersConfigPanelProps {
	cardOptions: any;
	onCardOptionsChange: (options: any) => void;
	entityType: string;
	entityId?: string;
}

/**
 * Panel de configuración general del sistema de capas
 */
export function LayersConfigPanel({
	cardOptions,
	onCardOptionsChange,
	entityType,
	entityId,
}: LayersConfigPanelProps) {
	// Obtener la configuración del sistema de capas o usar valores predeterminados
	const getConfigWithDefaults = (): LayerSystemConfig => {
		const config = cardOptions.layerSystem || {};
		return {
			order: config.order || DEFAULT_LAYER_SYSTEM.order,
			explodeView: config.explodeView ?? DEFAULT_LAYER_SYSTEM.explodeView,
			explodeDistance: config.explodeDistance ?? DEFAULT_LAYER_SYSTEM.explodeDistance,
			layerBlending: config.layerBlending || DEFAULT_LAYER_SYSTEM.layerBlending,
			layerSpacing: config.layerSpacing ?? DEFAULT_LAYER_SYSTEM.layerSpacing
		};
	};

	// Estado local para la configuración
	const [config, setConfig] = useState<LayerSystemConfig>(getConfigWithDefaults());

	// Actualizar estado cuando cambian las opciones
	useEffect(() => {
		setConfig(getConfigWithDefaults());
	}, [cardOptions]);

	// Manejar cambios y actualizar las opciones
	const handleConfigChange = (key: keyof LayerSystemConfig, value: any) => {
		const newConfig = {
			...config,
			[key]: value,
		};

		setConfig(newConfig);

		onCardOptionsChange({
			...cardOptions,
			layerSystem: newConfig,
		});
	};

	// Restablecer a valores predeterminados
	const handleReset = () => {
		setConfig({ ...DEFAULT_LAYER_SYSTEM });

		onCardOptionsChange({
			...cardOptions,
			layerSystem: { ...DEFAULT_LAYER_SYSTEM },
		});
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<Label htmlFor="explode-view">Vista Explosionada</Label>
				<Switch
					id="explode-view"
					checked={config.explodeView}
					onCheckedChange={(checked) => handleConfigChange('explodeView', checked)}
				/>
			</div>

			{config.explodeView && (
				<div className="space-y-2">
					<Label htmlFor="explode-distance">Distancia entre capas</Label>
					<div className="flex items-center gap-4">
						<Slider
							id="explode-distance"
							value={[config.explodeDistance]}
							min={1}
							max={30}
							step={1}
							onValueChange={(value) => handleConfigChange('explodeDistance', value[0])}
							className="flex-1"
						/>
						<span className="text-sm">{config.explodeDistance}px</span>
					</div>
				</div>
			)}

			<Separator className="my-4" />

			<div className="space-y-2">
				<Label htmlFor="layer-spacing">Espaciado de capas</Label>
				<div className="flex items-center gap-4">
					<Slider
						id="layer-spacing"
						value={[config.layerSpacing]}
						min={0}
						max={10}
						step={0.5}
						onValueChange={(value) => handleConfigChange('layerSpacing', value[0])}
						className="flex-1"
					/>
					<span className="text-sm">{config.layerSpacing}px</span>
				</div>
			</div>

			<div className="flex justify-end pt-2">
				<Button variant="outline" size="sm" onClick={handleReset}>
					Restablecer
				</Button>
			</div>
		</div>
	);
}
'use client';

import { FormGroup } from '@/components/features/entity-cards/settings/panels/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import type { LayerComponentProps, LayerSettingsProps } from '../layer-plugin-system';

/**
 * Interfaz para la configuración de la nueva capa
 * IMPORTANTE: Extiende BaseLayerConfig y añade propiedades específicas
 */
export interface TemplateLayerConfig {
	enabled: boolean;
	layerIndex: number;

	// Propiedades específicas - personalizar según necesidades
	color: string;
	intensity: number;
	mode: 'normal' | 'intense' | 'subtle';
	visibleOnHover: boolean;
}

/**
 * Componente que implementa el efecto visual de la capa
 * @param props Propiedades del componente de capa
 */
export function TemplateEffectLayer({
	isExploded,
	isHovered,
	activeLayer,
	getExplodeLayerTransform,
	config,
}: LayerComponentProps<TemplateLayerConfig>) {
	// Valores por defecto
	const defaultConfig: TemplateLayerConfig = {
		enabled: true,
		layerIndex: 5,
		color: '#3b82f6',
		intensity: 0.5,
		mode: 'normal',
		visibleOnHover: false,
	};

	// Combinar con la configuración recibida
	const mergedConfig = { ...defaultConfig, ...config };

	// Si no está habilitada o debería mostrarse solo en hover y no estamos en hover
	if (!mergedConfig.enabled || (mergedConfig.visibleOnHover && !isHovered)) {
		return null;
	}

	// Obtener estilos específicos según el modo
	const getModeStyles = () => {
		switch (mergedConfig.mode) {
			case 'intense':
				return { opacity: mergedConfig.intensity * 1.5 };
			case 'subtle':
				return { opacity: mergedConfig.intensity * 0.5 };
			default:
				return { opacity: mergedConfig.intensity };
		}
	};

	return (
		<div
			className={cn(
				'absolute inset-0 z-30 pointer-events-none',
				// CSS condicional basado en si está en modo explotado
				isExploded ? 'exploded-layer layer-template' : ''
			)}
			style={{
				backgroundColor: mergedConfig.color,
				...getModeStyles(),
				// Aplicar transformación si está en modo explotado
				...(isExploded ? getExplodeLayerTransform(mergedConfig.layerIndex) : {}),
			}}
			// Atributo para indicar si esta capa está activa
			data-layer-active={activeLayer === 'template' || null}
		/>
	);
}

/**
 * Componente de configuración para la capa
 * @param props Propiedades del componente de configuración
 */
export function TemplateLayerSettings({
	entityType,
	entityId,
	className,
	onConfigUpdate,
}: LayerSettingsProps<TemplateLayerConfig>) {
	const [config, setConfig] = useState<TemplateLayerConfig>({
		enabled: true,
		layerIndex: 5,
		color: '#3b82f6',
		intensity: 0.5,
		mode: 'normal',
		visibleOnHover: false,
	});
	const [isLoading, setIsLoading] = useState(true);

	// Cargar configuración cuando se monta el componente
	useEffect(() => {
		async function loadConfig() {
			try {
				setIsLoading(true);
				// Aquí iría la lógica para cargar la configuración desde el servidor
				// const { getTemplateConfig } = await import('./actions');
				// const response = await getTemplateConfig(entityType, entityId);
				// if (response.success && response.data) {
				//   setConfig(response.data);
				// }
			} catch (error) {
				console.error('Error al cargar configuración:', error);
			} finally {
				setIsLoading(false);
			}
		}

		loadConfig();
	}, [entityType, entityId]);

	// Actualizar un campo de la configuración
	const updateField = <K extends keyof TemplateLayerConfig>(key: K, value: TemplateLayerConfig[K]) => {
		const updatedConfig = { ...config, [key]: value };
		setConfig(updatedConfig);
		onConfigUpdate?.(updatedConfig);
	};

	// Guardar la configuración
	const saveConfig = async () => {
		try {
			setIsLoading(true);
			// Aquí iría la lógica para guardar la configuración en el servidor
			// const { updateTemplateConfig } = await import('./actions');
			// await updateTemplateConfig(entityType, config, entityId);
		} catch (error) {
			console.error('Error al guardar configuración:', error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className={cn('space-y-4', className)}>
			<FormGroup>
				<div className="flex items-center justify-between">
					<Label htmlFor="enabled">Habilitada</Label>
					<Switch
						id="enabled"
						checked={config.enabled}
						onCheckedChange={(checked) => updateField('enabled', checked)}
						disabled={isLoading}
					/>
				</div>
			</FormGroup>

			<FormGroup>
				<Label htmlFor="color">Color</Label>
				<div className="flex gap-2">
					<Input
						id="color"
						type="color"
						value={config.color}
						onChange={(e) => updateField('color', e.target.value)}
						disabled={isLoading || !config.enabled}
						className="w-12"
					/>
					<Input
						value={config.color}
						onChange={(e) => updateField('color', e.target.value)}
						disabled={isLoading || !config.enabled}
						className="flex-1"
					/>
				</div>
			</FormGroup>

			<FormGroup>
				<Label htmlFor="intensity">Intensidad ({(config.intensity * 100).toFixed(0)}%)</Label>
				<Slider
					id="intensity"
					value={[config.intensity]}
					min={0}
					max={1}
					step={0.01}
					onValueChange={([value]) => updateField('intensity', value)}
					disabled={isLoading || !config.enabled}
				/>
			</FormGroup>

			<FormGroup>
				<Label htmlFor="mode">Modo</Label>
				<select
					id="mode"
					value={config.mode}
					onChange={(e) => updateField('mode', e.target.value as any)}
					disabled={isLoading || !config.enabled}
					className="w-full p-2 border border-input rounded-md bg-background"
				>
					<option value="normal">Normal</option>
					<option value="intense">Intenso</option>
					<option value="subtle">Sutil</option>
				</select>
			</FormGroup>

			<FormGroup>
				<div className="flex items-center justify-between">
					<Label htmlFor="visibleOnHover">Visible solo al pasar el ratón</Label>
					<Switch
						id="visibleOnHover"
						checked={config.visibleOnHover}
						onCheckedChange={(checked) => updateField('visibleOnHover', checked)}
						disabled={isLoading || !config.enabled}
					/>
				</div>
			</FormGroup>

			<Button onClick={saveConfig} disabled={isLoading} className="w-full">
				{isLoading ? 'Guardando...' : 'Guardar configuración'}
			</Button>
		</div>
	);
}

// Uso: Importar estos componentes y registrarlos en tu sistema de capas
// 1. Crear el archivo de acciones del servidor (actions/template-config.action.ts)
// 2. Crear un archivo index.ts que exporte la capa
// 3. Registrar la capa en register-layers.tsx

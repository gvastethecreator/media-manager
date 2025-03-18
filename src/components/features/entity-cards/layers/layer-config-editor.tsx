'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { toastService } from '@/lib/services/toast.service';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { type BaseLayerConfig, useLayerPlugin } from './layer-plugin-system';

interface LayerConfigEditorProps {
	layerType: string;
	entityType: string;
	entityId?: string;
	initialConfig?: BaseLayerConfig;
	onConfigChange: (config: BaseLayerConfig) => void;
	onCancel?: () => void;
}

export function LayerConfigEditor({
	layerType,
	entityType,
	entityId,
	initialConfig,
	onConfigChange,
	onCancel,
}: LayerConfigEditorProps) {
	const { getLayer } = useLayerPlugin();
	const layer = getLayer(layerType);

	const [config, setConfig] = useState<BaseLayerConfig | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Cargar la configuración inicial o predeterminada
	useEffect(() => {
		if (!layer) {
			setError(`La capa "${layerType}" no está registrada`);
			return;
		}

		if (initialConfig) {
			setConfig(initialConfig);
		} else {
			// Usar la configuración predeterminada de la capa
			setConfig({ ...layer.defaultConfig });
		}
	}, [layer, layerType, initialConfig]);

	// Cargar desde el servidor si hay acciones del servidor disponibles
	useEffect(() => {
		const loadServerConfig = async () => {
			if (!layer || !layer.getServerActions) {
				return;
			}

			try {
				setLoading(true);
				setError(null);

				const serverActions = layer.getServerActions();
				const response = await serverActions.getConfig(entityType, entityId);

				if (response.success && response.data) {
					setConfig(response.data);
				} else if (response.error) {
					console.warn(`Sin configuración guardada para ${layerType}, usando predeterminada`);
					// Aquí ya tendremos la configuración predeterminada
				}
			} catch (err) {
				console.error('Error al cargar configuración de capa:', err);
				setError('No se pudo cargar la configuración de la capa');
			} finally {
				setLoading(false);
			}
		};

		if (layer?.getServerActions) {
			loadServerConfig();
		}
	}, [layer, layerType, entityType, entityId]);

	// Función para actualizar una propiedad específica
	const updateConfig = (key: string, value: unknown) => {
		if (!config) {
			return;
		}

		setConfig({
			...config,
			[key]: value,
		});
	};

	// Función para guardar los cambios
	const handleSave = async () => {
		if (!config) {
			return;
		}

		try {
			setLoading(true);

			// Si hay acciones del servidor disponibles, guardar en el servidor
			if (layer?.getServerActions) {
				const serverActions = layer.getServerActions();
				const response = await serverActions.updateConfig(entityType, config, entityId);

				if (!response.success) {
					throw new Error(response.error || 'Error al guardar');
				}
			}

			// Notificar el cambio al componente padre
			onConfigChange(config);
			toastService.success(`Configuración de ${layerType} guardada`);
		} catch (err) {
			console.error('Error al guardar configuración:', err);
			setError('No se pudo guardar la configuración');
			toastService.error('No se pudo guardar la configuración');
		} finally {
			setLoading(false);
		}
	};

	// Renderizar componente de carga si está cargando
	if (loading) {
		return (
			<div className="flex justify-center items-center p-8">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
			</div>
		);
	}

	// Renderizar mensaje de error si hay un error
	if (error) {
		return (
			<div className="p-4 bg-destructive/10 border border-destructive rounded-md text-center">
				<p className="text-sm text-destructive">{error}</p>
				<Button variant="outline" size="sm" onClick={onCancel} className="mt-2">
					Volver
				</Button>
			</div>
		);
	}

	// Renderizar mensaje si no hay capa o configuración
	if (!layer || !config) {
		return (
			<div className="p-4 bg-muted rounded-md text-center">
				<p className="text-sm text-muted-foreground">No se encontró la configuración de la capa</p>
				<Button variant="outline" size="sm" onClick={onCancel} className="mt-2">
					Volver
				</Button>
			</div>
		);
	}

	// Renderizar el componente de configuración de la capa si está disponible
	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle className="text-sm font-medium">
					Configuración de {layerType.charAt(0).toUpperCase() + layerType.slice(1)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Configuración básica para todas las capas */}
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<Label htmlFor={`${layerType}-enabled`}>Habilitada</Label>
							<Switch
								id={`${layerType}-enabled`}
								checked={config.enabled}
								onCheckedChange={(checked) => updateConfig('enabled', checked)}
							/>
						</div>

						<div className="space-y-1">
							<Label htmlFor={`${layerType}-index`}>Índice de capa</Label>
							<div className="flex items-center gap-2">
								<Slider
									id={`${layerType}-index`}
									value={[config.layerIndex || 0]}
									min={0}
									max={20}
									step={1}
									onValueChange={([value]) => updateConfig('layerIndex', value)}
									className="flex-1"
								/>
								<span className="text-xs w-6 text-center">{config.layerIndex}</span>
							</div>
							<p className="text-xs text-muted-foreground">
								Controla el orden de renderizado (valores más bajos = más al fondo)
							</p>
						</div>
					</div>

					{/* Componente de configuración específico de la capa */}
					{layer.SettingsComponent && (
						<div className="border-t border-border pt-4 mt-4">
							<layer.SettingsComponent
								entityType={entityType}
								entityId={entityId}
								className="w-full"
								onConfigUpdate={(updatedConfig) => {
									setConfig({
										...config,
										...updatedConfig,
										// Preservar siempre estas propiedades básicas
										enabled: config.enabled,
										layerIndex: config.layerIndex,
									});
								}}
							/>
						</div>
					)}
				</div>
			</CardContent>
			<CardFooter className="flex justify-between">
				<Button variant="outline" onClick={onCancel}>
					Cancelar
				</Button>
				<Button onClick={handleSave} disabled={loading}>
					{loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
					Guardar
				</Button>
			</CardFooter>
		</Card>
	);
}

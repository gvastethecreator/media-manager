'use client';

/**
 * 🧩 Selector de configuración para capas específicas
 *
 * Este componente proporciona una interfaz adaptativa para configurar
 * diferentes tipos de capas basándose en su implementación.
 */

import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { useLayerPlugin } from '../../layers/layer-plugin-system';
import type { LayerImplementation } from '../layers/types';

export interface LayerSelectorProps {
	/** ID de la capa a configurar */
	layerId: string;
	/** Configuración actual de la capa */
	config: Record<string, unknown>;
	/** Función para actualizar la configuración */
	onChange: (newConfig: Record<string, unknown>) => void;
	/** Tipo de entidad (para configuraciones específicas) */
	entityType?: string;
	/** ID de la entidad (opcional) */
	entityId?: string;
	/** Clase CSS adicional */
	className?: string;
}

/**
 * Componente para seleccionar y configurar una capa específica
 */
export function LayerSelector({
	layerId,
	config,
	onChange,
	entityType = 'default',
	entityId,
	className
}: LayerSelectorProps) {
	const [isLoading, setIsLoading] = useState(true);
	const { getLayers } = useLayerPlugin();
	const [layerImplementation, setLayerImplementation] = useState<LayerImplementation | null>(null);

	// Cargar la implementación de la capa
	useEffect(() => {
		setIsLoading(true);
		try {
			// Obtener todas las capas registradas
			const layers = getLayers();
			// Buscar la implementación para este layerId
			const implementation = layers.find(layer => layer.type === layerId);
			setLayerImplementation(implementation || null);
		} catch (error) {
			console.error(`Error al cargar capa ${layerId}:`, error);
			setLayerImplementation(null);
		} finally {
			setIsLoading(false);
		}
	}, [layerId, getLayers]);

	// Si está cargando, mostrar skeleton
	if (isLoading) {
		return <LayerSelectorSkeleton />;
	}

	// Si no se encontró la implementación
	if (!layerImplementation) {
		return (
			<Card className="border border-muted/50 bg-muted/20 shadow-sm">
				<CardContent className="p-3">
					<p className="text-[11px] text-muted-foreground text-center">
						No se encontró configuración para la capa "{layerId}"
					</p>
				</CardContent>
			</Card>
		);
	}

	// Si la capa tiene un componente Settings, usarlo
	if (layerImplementation.Settings) {
		const SettingsComponent = layerImplementation.Settings;
		return (
			<div className="layer-specific-settings">
				<SettingsComponent
					config={config}
					onChange={onChange}
					entityType={entityType}
					entityId={entityId}
				/>
			</div>
		);
	}

	// Renderizar configuraciones básicas si no hay un componente específico
	return (
		<Card className="border border-muted/50 bg-muted/20 shadow-sm">
			<CardContent className="p-3">
				<div className="space-y-2">
					<h4 className="text-[12px] font-medium">
						{layerImplementation.name || layerId}
					</h4>
					{layerImplementation.description && (
						<p className="text-[10px] text-muted-foreground">
							{layerImplementation.description}
						</p>
					)}
					<ScrollArea className="h-[160px] rounded-md border p-2">
						<pre className="text-[10px] font-mono">
							{JSON.stringify(config, null, 2)}
						</pre>
					</ScrollArea>
				</div>
			</CardContent>
		</Card>
	);
}

/**
 * Skeleton para el estado de carga del selector
 */
function LayerSelectorSkeleton() {
	return (
		<Card className="border border-muted/50 bg-muted/20 shadow-sm">
			<CardContent className="p-3">
				<div className="space-y-3">
					<Skeleton className="h-4 w-[120px]" />
					<Skeleton className="h-3 w-full" />
					<Skeleton className="h-3 w-[80%]" />
					<div className="space-y-2 pt-2">
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
						<Skeleton className="h-8 w-full" />
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
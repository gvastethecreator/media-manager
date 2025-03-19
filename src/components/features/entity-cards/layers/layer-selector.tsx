'use client';

/**
 * 🧩 Selector de capa
 *
 * Este componente permite seleccionar y configurar una capa específica
 * basada en su tipo y configuración.
 */

import { useLayerPlugin, type BaseLayerConfig } from '@/components/features/entity-cards/layers/layer-plugin-system';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { useMemo } from 'react';

interface LayerSelectorProps {
	/**
	 * ID de la capa a configurar
	 */
	layerId: string;

	/**
	 * Configuración actual de la capa
	 */
	config: Record<string, unknown>;

	/**
	 * Función llamada cuando cambia la configuración
	 */
	onChange: (newConfig: Record<string, unknown>) => void;

	/**
	 * Tipo de entidad (opcional)
	 */
	entityType?: string;

	/**
	 * ID de entidad específica (opcional)
	 */
	entityId?: string;
}

/**
 * Componente que renderiza el panel de configuración apropiado para una capa
 */
export function LayerSelector({
	layerId,
	config,
	onChange,
	entityType,
	entityId,
}: LayerSelectorProps) {
	// Obtenemos información sobre la capa registrada
	const { getLayer } = useLayerPlugin();
	const layerPlugin = useMemo(() => getLayer(layerId), [getLayer, layerId]);

	// Si no se encuentra el plugin de capa
	if (!layerPlugin) {
		return (
			<Alert variant="destructive" className="my-2">
				<AlertCircle className="h-4 w-4" />
				<AlertDescription className="text-[11px]">
					No se encontró un plugin para la capa "{layerId}".
				</AlertDescription>
			</Alert>
		);
	}

	// Si hay un componente de configuración, lo renderizamos
	if (layerPlugin.SettingsComponent) {
		const SettingsComponent = layerPlugin.SettingsComponent;

		return (
			<SettingsComponent
				entityType={entityType || 'generic'}
				entityId={entityId}
				config={config as BaseLayerConfig}
				onConfigUpdate={onChange}
			/>
		);
	}

	// Si no hay componente de configuración
	return (
		<div className="p-2 bg-muted/40 rounded-md">
			<p className="text-[11px] text-muted-foreground">
				No hay panel de configuración disponible para esta capa.
			</p>
		</div>
	);
}

/**
 * Versión de esqueleto para carga
 */
export function LayerSelectorSkeleton() {
	return (
		<div className="space-y-2">
			<Skeleton className="h-8 w-full" />
			<Skeleton className="h-8 w-full" />
			<Skeleton className="h-8 w-3/4" />
		</div>
	);
}
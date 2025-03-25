'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { ChevronLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { BaseLayerConfig } from '../layer-config-base';

interface LayerConfigEditorProps {
	layerType: string;
	entityType: string;
	entityId?: string;
	initialConfig: BaseLayerConfig;
	onConfigChange: (config: BaseLayerConfig) => void;
	onCancel: () => void;
}

/**
 * Editor de configuración genérico para capas
 */
export function LayerConfigEditor({
	layerType,
	entityType,
	entityId,
	initialConfig,
	onConfigChange,
	onCancel,
}: LayerConfigEditorProps) {
	// Estado local para la configuración que se está editando
	const [config, setConfig] = useState<BaseLayerConfig>({ ...initialConfig });

	// Actualizar el estado local cuando cambia la configuración inicial
	useEffect(() => {
		setConfig({ ...initialConfig });
	}, [initialConfig]);

	// Manejar cambios en propiedades específicas
	const handlePropertyChange = (property: string, value: any) => {
		setConfig((prev) => ({
			...prev,
			[property]: value,
		}));
	};

	// Guardar cambios
	const handleSave = () => {
		onConfigChange(config);
	};

	// Título formateado para mostrar
	const formattedTitle = layerType.charAt(0).toUpperCase() + layerType.slice(1);

	return (
		<Card className="w-full">
			<CardHeader className="pb-3">
				<div className="flex items-center justify-between">
					<CardTitle className="text-xl flex items-center gap-2">
						<Button variant="ghost" size="icon" onClick={onCancel}>
							<ChevronLeft className="h-5 w-5" />
						</Button>
						Configurar {formattedTitle}
					</CardTitle>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex items-center justify-between">
					<span className="font-medium">Habilitada</span>
					<Switch
						checked={config.enabled}
						onCheckedChange={(checked) => handlePropertyChange('enabled', checked)}
					/>
				</div>

				<Separator />

				<div className="flex items-center justify-between">
					<span className="font-medium">Índice de capa</span>
					<input
						type="number"
						min="0"
						max="10"
						value={config.layerIndex}
						onChange={(e) => handlePropertyChange('layerIndex', Number.parseInt(e.target.value))}
						className="w-20 p-2 border rounded-md"
					/>
				</div>

				{/* Componentes adicionales específicos de cada tipo de capa se renderizarían aquí */}

				<div className="flex justify-end gap-2 pt-4">
					<Button variant="outline" onClick={onCancel}>
						Cancelar
					</Button>
					<Button onClick={handleSave}>
						Guardar
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
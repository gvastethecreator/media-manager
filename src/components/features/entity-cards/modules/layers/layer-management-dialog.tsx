'use client';

/**
 * 🎨 Diálogo de gestión de capas
 *
 * Este componente proporciona una interfaz completa para gestionar las capas
 * de una tarjeta de entidad, incluyendo presets y configuración detallada.
 */

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { LayersIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { EntityCardLayerSystemConfig } from './entity-card-layer-adapter';
import { LayerAdminPanel } from './layer-admin-panel';
import { LayerPresetsPanel } from './layer-presets-panel';

export interface LayerManagementDialogProps {
	entityType: string;
	config: EntityCardLayerSystemConfig;
	onChange: (config: EntityCardLayerSystemConfig) => void;
	trigger?: React.ReactNode;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

/**
 * Diálogo para gestionar capas de tarjetas de entidad
 */
export function LayerManagementDialog({
	entityType,
	config,
	onChange,
	trigger,
	open,
	onOpenChange,
}: LayerManagementDialogProps) {
	const [isOpen, setIsOpen] = useState(open || false);
	const [activeTab, setActiveTab] = useState('presets');
	const [localConfig, setLocalConfig] = useState<EntityCardLayerSystemConfig>(config);

	// Sincronizar estado de apertura controlado externamente
	useEffect(() => {
		if (open !== undefined) {
			setIsOpen(open);
		}
	}, [open]);

	// Sincronizar config externa con estado local
	useEffect(() => {
		setLocalConfig(config);
	}, [config]);

	// Manejar cambio de estado de apertura
	const handleOpenChange = (newOpen: boolean) => {
		setIsOpen(newOpen);
		onOpenChange?.(newOpen);

		// Si se cierra el diálogo, aplicar cambios finales
		if (!newOpen) {
			onChange(localConfig);
		}
	};

	// Manejar cambios en la configuración
	const handleConfigChange = (newConfig: EntityCardLayerSystemConfig) => {
		setLocalConfig(newConfig);
		// No propagamos los cambios inmediatamente para permitir previsualización
	};

	// Aplicar cambios y cerrar
	const handleApplyAndClose = () => {
		onChange(localConfig);
		handleOpenChange(false);
	};

	// Cancelar cambios y cerrar
	const handleCancel = () => {
		setLocalConfig(config);
		handleOpenChange(false);
	};

	return (
		<Dialog open={isOpen} onOpenChange={handleOpenChange}>
			{trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}

			<DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col">
				<DialogHeader>
					<DialogTitle>Gestión de Capas</DialogTitle>
					<DialogDescription>
						Personaliza el aspecto de tu tarjeta con presets y configuración detallada de capas.
					</DialogDescription>
				</DialogHeader>

				<div className="flex-1 overflow-hidden py-4">
					<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
						<TabsList className="grid grid-cols-2 mb-4">
							<TabsTrigger value="presets">Presets</TabsTrigger>
							<TabsTrigger value="advanced">Configuración Avanzada</TabsTrigger>
						</TabsList>

						<div className="flex-1 overflow-hidden">
							<TabsContent value="presets" className="h-full mt-0">
								<LayerPresetsPanel
									entityType={entityType}
									currentConfig={localConfig}
									onApplyPreset={handleConfigChange}
									className="h-full"
								/>
							</TabsContent>

							<TabsContent value="advanced" className="h-full mt-0">
								<LayerAdminPanel
									entityType={entityType}
									config={localConfig}
									onChange={handleConfigChange}
									className="h-full"
								/>
							</TabsContent>
						</div>
					</Tabs>
				</div>

				<DialogFooter className="flex justify-between">
					<Button variant="outline" onClick={handleCancel}>
						Cancelar
					</Button>
					<Button onClick={handleApplyAndClose}>Aplicar Cambios</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

/**
 * Botón para abrir el diálogo de gestión de capas
 */
export function LayerManagementButton({
	entityType,
	config,
	onChange,
	className,
}: {
	entityType: string;
	config: EntityCardLayerSystemConfig;
	onChange: (config: EntityCardLayerSystemConfig) => void;
	className?: string;
}) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button
				variant="outline"
				size="sm"
				className={cn('flex items-center gap-1', className)}
				onClick={() => setOpen(true)}
			>
				<LayersIcon className="h-4 w-4" />
				<span>Gestionar Capas</span>
			</Button>

			<LayerManagementDialog
				entityType={entityType}
				config={config}
				onChange={onChange}
				open={open}
				onOpenChange={setOpen}
			/>
		</>
	);
}

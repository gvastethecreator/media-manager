'use client';

import type { CardOptions } from '@/components/features/entity-cards/base/base-card-types';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X } from 'lucide-react';
import { useState } from 'react';
import { CardConfigManager } from './card-config-manager';
import { VisualEffectsManager } from './visual-effects-manager';

interface VisualizationConfigProps {
	options: CardOptions;
	onOptionsChange: (options: CardOptions) => void;
	onClose?: () => void;
}

export function VisualizationConfig({ options, onOptionsChange, onClose }: VisualizationConfigProps) {
	// Estado local para controlar los valores de opciones antes de aplicarlos
	const [localOptions, setLocalOptions] = useState<CardOptions>(options);
	const [activeTab, setActiveTab] = useState<string>('general');

	// Aplicar cambios al componente padre
	const applyChanges = () => {
		onOptionsChange(localOptions);
		onClose?.();
	};

	// Manejadores para los cambios de opciones específicas
	const handleCardConfigChange = (updatedOptions: CardOptions) => {
		setLocalOptions((prev) => ({
			...prev,
			...updatedOptions,
		}));
	};

	const handleHolographicOptionsChange = (holographicOptions: CardOptions['holographicOptions']) => {
		setLocalOptions((prev) => ({
			...prev,
			holographicOptions,
		}));
	};

	const handleScanlinesOptionsChange = (scanlinesOptions: CardOptions['scanlinesOptions']) => {
		setLocalOptions((prev) => ({
			...prev,
			scanlinesOptions,
		}));
	};

	const handleGlowOptionsChange = (glowOptions: CardOptions['glowOptions']) => {
		setLocalOptions((prev) => ({
			...prev,
			glowOptions,
		}));
	};

	const handleBorderOptionsChange = (borderOptions: CardOptions['borderOptions']) => {
		setLocalOptions((prev) => ({
			...prev,
			borderOptions,
		}));
	};

	const handleGrainOptionsChange = (grainOptions: CardOptions['grainOptions']) => {
		setLocalOptions((prev) => ({
			...prev,
			grainOptions,
		}));
	};

	return (
		<div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
			<div className="bg-card border rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-4">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-medium">Configuración Visual</h3>
					<Button
						variant="ghost"
						size="icon"
						onClick={onClose}
						className="text-muted-foreground hover:text-foreground"
						title="Cerrar"
					>
						<X size={18} />
					</Button>
				</div>

				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid grid-cols-2 mb-4">
						<TabsTrigger value="general">General</TabsTrigger>
						<TabsTrigger value="effects">Efectos Avanzados</TabsTrigger>
					</TabsList>

					<TabsContent value="general" className="space-y-4">
						<CardConfigManager options={localOptions} onOptionsChange={handleCardConfigChange} />
					</TabsContent>

					<TabsContent value="effects" className="space-y-4">
						<VisualEffectsManager
							holographicOptions={localOptions.holographicOptions}
							scanlinesOptions={localOptions.scanlinesOptions}
							glowOptions={localOptions.glowOptions}
							borderOptions={localOptions.borderOptions}
							grainOptions={localOptions.grainOptions}
							onHolographicOptionsChange={handleHolographicOptionsChange}
							onScanlinesOptionsChange={handleScanlinesOptionsChange}
							onGlowOptionsChange={handleGlowOptionsChange}
							onBorderOptionsChange={handleBorderOptionsChange}
							onGrainOptionsChange={handleGrainOptionsChange}
						/>
					</TabsContent>
				</Tabs>

				<div className="flex justify-end gap-2 mt-6">
					<Button variant="outline" onClick={onClose}>
						Cancelar
					</Button>
					<Button onClick={applyChanges}>Aplicar Cambios</Button>
				</div>
			</div>
		</div>
	);
}

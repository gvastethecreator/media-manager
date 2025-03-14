'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useEffect, useState } from 'react';
import { DesignModule } from '../../modules/design/design-module';
import { DEFAULT_DESIGN_SYSTEM } from '../../modules/design/design-module';
import { DesignPresets } from '../../modules/design/design-presets';
import { DesignPreview } from '../../modules/design/design-preview';
import type { DesignSystem, DesignSystemPreset } from '../../modules/design/types';
import type { CardOptions } from '../../types/card-settings-types';
import { FormLayout } from './shared';

interface DesignSettingsPanelProps {
	cardOptions: CardOptions;
	onChange: (options: Partial<CardOptions>) => void;
}

export function DesignSettingsPanel({ cardOptions, onChange }: DesignSettingsPanelProps) {
	const [activeTab, setActiveTab] = useState('editor');
	const [currentDesign, setCurrentDesign] = useState<DesignSystem>(cardOptions.designSystem || DEFAULT_DESIGN_SYSTEM);

	// Cargar presets guardados del almacenamiento local
	const [savedPresets, setSavedPresets] = useLocalStorage<DesignSystemPreset[]>('entity-cards-design-presets', []);

	// Actualizar el diseño actual cuando cambian las opciones de la tarjeta
	useEffect(() => {
		if (cardOptions.designSystem) {
			setCurrentDesign(cardOptions.designSystem);
		}
	}, [cardOptions.designSystem]);

	// Manejar cambios en el diseño
	const handleDesignChange = (updatedDesign: DesignSystem) => {
		setCurrentDesign(updatedDesign);
		onChange({
			...cardOptions,
			designSystem: updatedDesign,
		});
	};

	// Manejar la selección de un preset
	const handleSelectPreset = (preset: DesignSystemPreset) => {
		setCurrentDesign(preset.designSystem);
		onChange({ designSystem: preset.designSystem });
	};

	// Guardar un nuevo preset
	const handleSavePreset = (preset: DesignSystemPreset) => {
		setSavedPresets([...savedPresets, preset]);
	};

	// Eliminar un preset
	const handleDeletePreset = (presetId: string) => {
		setSavedPresets(savedPresets.filter((preset) => preset.id !== presetId));
	};

	// Componente para la vista previa
	const PreviewTab = () => (
		<div className="space-y-4">
			<h3 className="text-lg font-medium">Vista Previa del Diseño</h3>
			<div className="flex justify-center p-8 bg-muted/30 rounded-lg">
				<DesignPreview designSystem={currentDesign} className="w-full max-w-md h-80" />
			</div>
			<div className="flex justify-center p-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg">
				<DesignPreview designSystem={currentDesign} className="w-full max-w-md h-80" />
			</div>
			<div className="flex justify-center p-8 bg-gradient-to-r from-gray-900 to-gray-600 rounded-lg">
				<DesignPreview designSystem={currentDesign} className="w-full max-w-md h-80" />
			</div>
		</div>
	);

	return (
		<FormLayout
			title="Configuración de Diseño"
			description="Personaliza el sistema de diseño de tus tarjetas"
			colorScheme="design"
			variant="colored"
		>
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid grid-cols-3 mb-4">
					<TabsTrigger value="editor">Editor</TabsTrigger>
					<TabsTrigger value="preview">Vista Previa</TabsTrigger>
					<TabsTrigger value="presets">Presets</TabsTrigger>
				</TabsList>

				<TabsContent value="editor">
					<DesignModule initialDesignSystem={currentDesign} onChange={handleDesignChange} />
				</TabsContent>

				<TabsContent value="preview">
					<PreviewTab />
				</TabsContent>

				<TabsContent value="presets">
					<DesignPresets
						presets={savedPresets}
						onSelectPreset={handleSelectPreset}
						onSavePreset={handleSavePreset}
						onDeletePreset={handleDeletePreset}
						currentDesign={currentDesign}
					/>
				</TabsContent>
			</Tabs>
		</FormLayout>
	);
}

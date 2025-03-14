'use client';

import { FormLayout } from '@/components/features/entity-cards/settings/panels/shared';
import type { CardOptions } from '@/components/features/entity-cards/types/card-settings-types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Settings2, Sliders, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { BasicEffectsSection, DepthEffectsSection, DesignSection, PerformanceSection } from './components/sections';
import { useImageSettings } from './hooks/use-image-settings';
import type { ImageOptions } from './types';

/**
 * 🖼️ Panel de configuración de imagen
 *
 * Componente principal para la configuración de todos los aspectos
 * relacionados con la visualización de imágenes.
 */
export function ImagePanel({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Estado para la pestaña activa
	const [activeTab, setActiveTab] = useState('design');

	// Usar el hook de configuración de imagen
	const { imageOptions, updateImageOption, updateDesignSystem, updateEffect, updatePerformance } = useImageSettings(
		options.imageOptions
	);

	// Manejar cambios en opciones específicas de imagen
	const handleImageChange = (key: keyof ImageOptions, value: unknown) => {
		updateImageOption(key, value as ImageOptions[keyof ImageOptions]);

		onChange({
			...options,
			imageOptions: {
				...options.imageOptions,
				[key]: value,
			},
		});
	};

	// Manejar cambios en el subsistema de diseño
	const handleDesignSystemChange = (key: string, value: unknown) => {
		updateDesignSystem(key, value);

		onChange({
			...options,
			imageOptions: {
				...options.imageOptions,
				designSystem: {
					...options.imageOptions?.designSystem,
					[key]: value,
				},
			},
		});
	};

	// Manejar cambios en efectos
	const handleEffectsChange = (section: string, key: string, value: unknown) => {
		updateEffect(section, key, value);

		const newOptions = { ...options };

		if (!newOptions.imageOptions) {
			newOptions.imageOptions = {
				enable3DEffect: false,
				enableHolographicEffect: false,
				enableGlowEffect: false,
				enableAnimatedBorder: false,
				enableLightHalo: false,
			};
		}

		if (!newOptions.imageOptions.effects) {
			newOptions.imageOptions.effects = {};
		}

		if (!newOptions.imageOptions.effects[section]) {
			newOptions.imageOptions.effects[section] = {};
		}

		newOptions.imageOptions.effects[section][key] = value;
		onChange(newOptions);
	};

	// Manejar cambios en rendimiento
	const handlePerformanceChange = (key: string, value: unknown) => {
		updatePerformance(key, value);

		onChange({
			...options,
			imageOptions: {
				...options.imageOptions,
				performance: {
					...options.imageOptions?.performance,
					[key]: value,
				},
			},
		});
	};

	return (
		<FormLayout
			title="Configuración de Imagen"
			description="Personaliza la apariencia y efectos de la imagen"
			colorScheme="design"
			variant="colored"
		>
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="w-full">
					<TabsTrigger value="design" className="flex-1">
						<Settings2 className="h-4 w-4 mr-2" />
						Diseño
					</TabsTrigger>
					<TabsTrigger value="effects" className="flex-1">
						<Sparkles className="h-4 w-4 mr-2" />
						Efectos
					</TabsTrigger>
					<TabsTrigger value="advanced" className="flex-1">
						<Sliders className="h-4 w-4 mr-2" />
						Avanzado
					</TabsTrigger>
					<TabsTrigger value="preview" className="flex-1">
						<Eye className="h-4 w-4 mr-2" />
						Vista Previa
					</TabsTrigger>
				</TabsList>

				<TabsContent value="design">
					<DesignSection
						imageOptions={imageOptions}
						handleImageChange={handleImageChange}
						handleDesignSystemChange={handleDesignSystemChange}
						disabled={disabled}
					/>
				</TabsContent>

				<TabsContent value="effects">
					<div className="space-y-6">
						<BasicEffectsSection
							imageOptions={imageOptions}
							handleImageChange={handleImageChange}
							disabled={disabled}
						/>
						<DepthEffectsSection
							imageOptions={imageOptions}
							handleEffectsChange={handleEffectsChange}
							disabled={disabled}
						/>
					</div>
				</TabsContent>

				<TabsContent value="advanced">
					<PerformanceSection
						imageOptions={imageOptions}
						handlePerformanceChange={handlePerformanceChange}
						disabled={disabled}
					/>
				</TabsContent>

				<TabsContent value="preview">
					<div className="flex flex-col items-center justify-center p-6 min-h-[300px] bg-muted rounded-md">
						<p className="text-muted-foreground">Vista previa de imagen</p>
						{/* Aquí iría un componente de vista previa */}
					</div>
				</TabsContent>
			</Tabs>
		</FormLayout>
	);
}

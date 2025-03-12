"use client";

import { toastService } from "@/lib/services/toast.service";
import { cn } from "@/lib/utils/utils";
import { motion } from "motion/react";
import * as React from "react";
import type { TextureConfig } from "../base/base-card-types";
import type { RarityConfig } from "../base/base-card-types";
import { AdvancedEffectsSettings } from "./advanced-effects-settings";
import type {
	CardOptions,
	CardPresetOption,
	CardSettingsProps,
	SystemSettingsProps,
} from "./card-settings-types";
import { DesignSettings } from "./design-settings";
import { ImageGridSettings } from "./image-grid-settings";
import { PerformanceSettings } from "./performance-settings";
import { PresetsPanel } from "./presets-panel";
import { PreviewPanel } from "./preview-panel";
import { StatesSettings } from "./states-settings";
import { SystemsSettings } from "./systems-settings";
import { VisualEffectsSettings } from "./visual-effects-settings";

// Colores para cada sección
const sectionColors = {
	presets:
		"from-blue-50 to-blue-100/10 dark:from-blue-950/10 dark:to-blue-900/5",
	visual:
		"from-indigo-50 to-indigo-100/10 dark:from-indigo-950/10 dark:to-indigo-900/5",
	system:
		"from-violet-50 to-violet-100/10 dark:from-violet-950/10 dark:to-violet-900/5",
	images:
		"from-pink-50 to-pink-100/10 dark:from-pink-950/10 dark:to-pink-900/5",
	advanced:
		"from-cyan-50 to-cyan-100/10 dark:from-cyan-950/10 dark:to-cyan-900/5",
	design:
		"from-emerald-50 to-emerald-100/10 dark:from-emerald-950/10 dark:to-emerald-900/5",
	performance:
		"from-amber-50 to-amber-100/10 dark:from-amber-950/10 dark:to-amber-900/5",
	states:
		"from-orange-50 to-orange-100/10 dark:from-orange-950/10 dark:to-orange-900/5",
};

// Componente para una sección con color de fondo
const SettingsSection = ({
	children,
	colorClass,
}: {
	children: React.ReactNode;
	colorClass: string;
}) => {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className={cn("rounded-md bg-gradient-to-br p-0.5", colorClass)}
		>
			{children}
		</motion.div>
	);
};

export function CardSettingsPanel({
	cardOptions,
	onCardOptionsChange,
	entityType = "album",
	onRarityChange,
	onTextureChange,
	raritySystem,
	textureSystem,
}: SystemSettingsProps) {
	// Estado para el preset activo
	const [activePreset, setActivePreset] = React.useState<string | null>(null);

	// Manejador para cuando se selecciona un preset
	const handlePresetSelect = (preset: CardPresetOption) => {
		onCardOptionsChange(preset.options);
		setActivePreset(preset.id);
		toastService.success(`Preset "${preset.name}" aplicado correctamente`);
	};

	// Manejador para cambios en las opciones que borra el preset activo
	const handleOptionsChange = (options: CardOptions) => {
		onCardOptionsChange(options);
		// Solo limpiamos el preset activo si se cambia alguna configuración
		if (activePreset) {
			setActivePreset(null);
		}
	};

	return (
		<div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
			{/* Panel de configuración - 2 columnas en escritorio */}
			<div className="xl:col-span-2">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{/* Fila 1: Presets y Visual */}
					<SettingsSection colorClass={sectionColors.presets}>
						<PresetsPanel
							activePreset={activePreset}
							onPresetSelect={handlePresetSelect}
							entityType={entityType}
						/>
					</SettingsSection>

					<SettingsSection colorClass={sectionColors.visual}>
						<VisualEffectsSettings
							cardOptions={cardOptions}
							onCardOptionsChange={handleOptionsChange}
						/>
					</SettingsSection>

					{/* Fila 2: Sistema y Configuración de Imágenes */}
					<SettingsSection colorClass={sectionColors.system}>
						<SystemsSettings
							cardOptions={cardOptions}
							onCardOptionsChange={handleOptionsChange}
							entityType={entityType}
							onRarityChange={onRarityChange}
							onTextureChange={onTextureChange}
							raritySystem={raritySystem}
							textureSystem={textureSystem}
						/>
					</SettingsSection>

					<SettingsSection colorClass={sectionColors.images}>
						<ImageGridSettings
							cardOptions={cardOptions}
							onCardOptionsChange={handleOptionsChange}
						/>
					</SettingsSection>

					{/* Fila 3: Efectos Avanzados y Diseño */}
					<SettingsSection colorClass={sectionColors.advanced}>
						<AdvancedEffectsSettings
							cardOptions={cardOptions}
							onCardOptionsChange={handleOptionsChange}
						/>
					</SettingsSection>

					<SettingsSection colorClass={sectionColors.design}>
						<DesignSettings
							cardOptions={cardOptions}
							onCardOptionsChange={handleOptionsChange}
						/>
					</SettingsSection>

					{/* Fila 4: Rendimiento y Estados */}
					<SettingsSection colorClass={sectionColors.performance}>
						<PerformanceSettings
							cardOptions={cardOptions}
							onCardOptionsChange={handleOptionsChange}
						/>
					</SettingsSection>

					<SettingsSection colorClass={sectionColors.states}>
						<StatesSettings
							cardOptions={cardOptions}
							onCardOptionsChange={handleOptionsChange}
						/>
					</SettingsSection>
				</div>
			</div>

			{/* Panel de Preview - Siempre visible */}
			<div className="xl:col-span-1 space-y-4">
				<PreviewPanel
					cardOptions={cardOptions}
					entityType={entityType}
					rarity={
						cardOptions.raritySystem && raritySystem
							? (raritySystem.rarities[0] as RarityConfig)
							: null
					}
					texture={
						cardOptions.textureSystem && textureSystem
							? (textureSystem.textures[0] as TextureConfig)
							: null
					}
					showInfo
				/>
			</div>
		</div>
	);
}

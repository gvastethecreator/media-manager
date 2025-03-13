"use client";

// Importación de los tipos faltantes
import type { RaritySystem } from "@/app/actions/entities-cards/entities-cards.actions";
import type { TextureSystem } from "@/components/features/entity-cards/base/base-card-types";
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
	title,
	icon,
}: {
	children: React.ReactNode;
	colorClass: string;
	title?: string;
	icon?: React.ReactNode;
}) => {
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className={cn("rounded-md bg-gradient-to-br p-0.5 mb-3", colorClass)}
		>
			<div className="bg-card rounded-md">
				{title && (
					<div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-border/40">
						{icon}
						<h3 className="text-[11px] font-medium">{title}</h3>
					</div>
				)}
				{children}
			</div>
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
	accordionMode = false,
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

	// Si está en modo acordeón, usamos un diseño diferente
	if (accordionMode) {
		return (
			<div className="flex flex-col gap-2 w-full">
				{/* Presets Panel */}
				<SettingsSection colorClass={sectionColors.presets}>
					<PresetsPanel
						activePreset={activePreset}
						onPresetSelect={handlePresetSelect}
						entityType={entityType}
					/>
				</SettingsSection>

				<div className="grid grid-cols-1 md:grid-cols-2 gap-2">
					<div className="space-y-2">
						{/* System Settings */}
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

						{/* Visual Effects */}
						<SettingsSection colorClass={sectionColors.visual}>
							<VisualEffectsSettings
								cardOptions={cardOptions}
								onCardOptionsChange={handleOptionsChange}
							/>
						</SettingsSection>

						{/* Image Grid Settings */}
						<SettingsSection colorClass={sectionColors.images}>
							<ImageGridSettings
								cardOptions={cardOptions}
								onCardOptionsChange={handleOptionsChange}
							/>
						</SettingsSection>
					</div>

					<div className="space-y-2">
						{/* Advanced Effects */}
						<SettingsSection colorClass={sectionColors.advanced}>
							<AdvancedEffectsSettings
								cardOptions={cardOptions}
								onCardOptionsChange={handleOptionsChange}
							/>
						</SettingsSection>

						{/* Design Settings */}
						<SettingsSection colorClass={sectionColors.design}>
							<DesignSettings
								cardOptions={cardOptions}
								onCardOptionsChange={handleOptionsChange}
							/>
						</SettingsSection>

						{/* Performance */}
						<SettingsSection colorClass={sectionColors.performance}>
							<PerformanceSettings
								cardOptions={cardOptions}
								onCardOptionsChange={handleOptionsChange}
							/>
						</SettingsSection>

						{/* States */}
						<SettingsSection colorClass={sectionColors.states}>
							<StatesSettings
								cardOptions={cardOptions}
								onCardOptionsChange={handleOptionsChange}
							/>
						</SettingsSection>
					</div>
				</div>

				{/* Preview Panel como sección flotante al final */}
				<div className="mt-3">
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

	// Diseño estándar (no acordeón)
	return (
		<div className="flex flex-col-reverse md:flex-row gap-3">
			{/* Panel de configuración - ahora en una sola columna */}
			<div className="md:w-1/2 lg:w-2/3 space-y-2">
				{/* Presets Panel */}
				<SettingsSection colorClass={sectionColors.presets}>
					<PresetsPanel
						activePreset={activePreset}
						onPresetSelect={handlePresetSelect}
						entityType={entityType}
					/>
				</SettingsSection>

				{/* System Settings */}
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

				{/* Visual Effects */}
				<SettingsSection colorClass={sectionColors.visual}>
					<VisualEffectsSettings
						cardOptions={cardOptions}
						onCardOptionsChange={handleOptionsChange}
					/>
				</SettingsSection>

				{/* Image Grid Settings */}
				<SettingsSection colorClass={sectionColors.images}>
					<ImageGridSettings
						cardOptions={cardOptions}
						onCardOptionsChange={handleOptionsChange}
					/>
				</SettingsSection>

				{/* Advanced Effects */}
				<SettingsSection colorClass={sectionColors.advanced}>
					<AdvancedEffectsSettings
						cardOptions={cardOptions}
						onCardOptionsChange={handleOptionsChange}
					/>
				</SettingsSection>

				{/* Design Settings */}
				<SettingsSection colorClass={sectionColors.design}>
					<DesignSettings
						cardOptions={cardOptions}
						onCardOptionsChange={handleOptionsChange}
					/>
				</SettingsSection>

				{/* Performance */}
				<SettingsSection colorClass={sectionColors.performance}>
					<PerformanceSettings
						cardOptions={cardOptions}
						onCardOptionsChange={handleOptionsChange}
					/>
				</SettingsSection>

				{/* States */}
				<SettingsSection colorClass={sectionColors.states}>
					<StatesSettings
						cardOptions={cardOptions}
						onCardOptionsChange={handleOptionsChange}
					/>
				</SettingsSection>
			</div>

			{/* Panel de Preview - Ahora a la derecha */}
			<div className="md:w-1/2 lg:w-1/3">
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

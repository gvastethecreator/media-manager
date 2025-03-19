'use client';

import { FormGroup, FormLayout, FormRow, FormSection, FormSlider, FormToggle } from '@/components/features/entity-cards/settings/panels/shared';
import { Contrast, Droplets, Eye, Palette, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

// 📝 Definición de tipos para efectos visuales
export interface VisualEffectsOptions {
	// Ajustes de imagen
	brightness?: number;
	contrast?: number;
	saturate?: number;
	hueRotate?: number;

	// Filtros de estilo
	grayscale?: number;
	sepia?: number;
	invert?: number;
	opacity?: number;

	// Efectos de desenfoque
	blur?: number;
	dropShadow?: boolean;

	// Efectos de fondo
	backdropBlur?: number;
	backdropBrightness?: number;
	backdropSaturate?: number;
	backdropOpacity?: number;
}

export interface VisualEffectsModuleProps {
	initialEffects?: VisualEffectsOptions;
	onChange?: (effects: VisualEffectsOptions) => void;
	disabled?: boolean;
	className?: string;
}

// 🎨 Valores por defecto para los efectos visuales
export const DEFAULT_VISUAL_EFFECTS: VisualEffectsOptions = {
	brightness: 100,
	contrast: 100,
	saturate: 100,
	hueRotate: 0,
	grayscale: 0,
	sepia: 0,
	invert: 0,
	opacity: 100,
	blur: 0,
	dropShadow: false,
	backdropBlur: 0,
	backdropBrightness: 100,
	backdropSaturate: 100,
	backdropOpacity: 100,
};

// 📑 Sección de Ajustes de Imagen
const ImageAdjustmentsSection = ({
	visualEffects,
	handleVisualEffectsChange,
	disabled,
}: {
	visualEffects: VisualEffectsOptions;
	handleVisualEffectsChange: (key: keyof VisualEffectsOptions, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Ajustes de Imagen"
			description="Configuraciones básicas de ajuste de imagen"
			colorScheme="visual"
			icon={<Contrast className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={1}>
					<FormSlider
						id="brightness"
						label="Brillo"
						value={visualEffects.brightness ?? DEFAULT_VISUAL_EFFECTS.brightness}
						onValueChange={(value) => handleVisualEffectsChange('brightness', value)}
						min={0}
						max={200}
						step={1}
						unit="%"
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSlider
						id="contrast"
						label="Contraste"
						value={visualEffects.contrast ?? DEFAULT_VISUAL_EFFECTS.contrast}
						onValueChange={(value) => handleVisualEffectsChange('contrast', value)}
						min={0}
						max={200}
						step={1}
						unit="%"
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSlider
						id="saturate"
						label="Saturación"
						value={visualEffects.saturate ?? DEFAULT_VISUAL_EFFECTS.saturate}
						onValueChange={(value) => handleVisualEffectsChange('saturate', value)}
						min={0}
						max={200}
						step={1}
						unit="%"
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSlider
						id="hueRotate"
						label="Rotación de Tono"
						value={visualEffects.hueRotate ?? DEFAULT_VISUAL_EFFECTS.hueRotate}
						onValueChange={(value) => handleVisualEffectsChange('hueRotate', value)}
						min={0}
						max={360}
						step={1}
						unit="°"
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

// 🖌️ Sección de Filtros de Estilo
const StyleFiltersSection = ({
	visualEffects,
	handleVisualEffectsChange,
	disabled,
}: {
	visualEffects: VisualEffectsOptions;
	handleVisualEffectsChange: (key: keyof VisualEffectsOptions, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Filtros de Estilo"
			description="Efectos estilísticos para la tarjeta"
			colorScheme="visual"
			icon={<Palette className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={1}>
					<FormSlider
						id="grayscale"
						label="Escala de Grises"
						value={visualEffects.grayscale ?? DEFAULT_VISUAL_EFFECTS.grayscale}
						onValueChange={(value) => handleVisualEffectsChange('grayscale', value)}
						min={0}
						max={100}
						step={1}
						unit="%"
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSlider
						id="sepia"
						label="Sepia"
						value={visualEffects.sepia ?? DEFAULT_VISUAL_EFFECTS.sepia}
						onValueChange={(value) => handleVisualEffectsChange('sepia', value)}
						min={0}
						max={100}
						step={1}
						unit="%"
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSlider
						id="invert"
						label="Invertir"
						value={visualEffects.invert ?? DEFAULT_VISUAL_EFFECTS.invert}
						onValueChange={(value) => handleVisualEffectsChange('invert', value)}
						min={0}
						max={100}
						step={1}
						unit="%"
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSlider
						id="opacity"
						label="Opacidad"
						value={visualEffects.opacity ?? DEFAULT_VISUAL_EFFECTS.opacity}
						onValueChange={(value) => handleVisualEffectsChange('opacity', value)}
						min={0}
						max={100}
						step={1}
						unit="%"
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

// 💧 Sección de Efectos de Desenfoque
const BlurEffectsSection = ({
	visualEffects,
	handleVisualEffectsChange,
	disabled,
}: {
	visualEffects: VisualEffectsOptions;
	handleVisualEffectsChange: (key: keyof VisualEffectsOptions, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Efectos de Desenfoque"
			description="Configuraciones de desenfoque y sombras"
			colorScheme="visual"
			icon={<Droplets className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={1}>
					<FormSlider
						id="blur"
						label="Desenfoque"
						value={visualEffects.blur ?? DEFAULT_VISUAL_EFFECTS.blur}
						onValueChange={(value) => handleVisualEffectsChange('blur', value)}
						min={0}
						max={20}
						step={0.5}
						unit="px"
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormToggle
						id="dropShadow"
						label="Sombra"
						checked={visualEffects.dropShadow ?? DEFAULT_VISUAL_EFFECTS.dropShadow}
						onCheckedChange={(value) => handleVisualEffectsChange('dropShadow', value)}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

// 🪟 Sección de Efectos de Fondo
const BackdropEffectsSection = ({
	visualEffects,
	handleVisualEffectsChange,
	disabled,
}: {
	visualEffects: VisualEffectsOptions;
	handleVisualEffectsChange: (key: keyof VisualEffectsOptions, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Efectos de Fondo"
			description="Efectos que afectan al fondo de la tarjeta"
			colorScheme="visual"
			icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={1}>
					<FormSlider
						id="backdropBlur"
						label="Desenfoque de Fondo"
						value={visualEffects.backdropBlur ?? DEFAULT_VISUAL_EFFECTS.backdropBlur}
						onValueChange={(value) => handleVisualEffectsChange('backdropBlur', value)}
						min={0}
						max={20}
						step={0.5}
						unit="px"
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSlider
						id="backdropBrightness"
						label="Brillo de Fondo"
						value={visualEffects.backdropBrightness ?? DEFAULT_VISUAL_EFFECTS.backdropBrightness}
						onValueChange={(value) => handleVisualEffectsChange('backdropBrightness', value)}
						min={0}
						max={200}
						step={1}
						unit="%"
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSlider
						id="backdropSaturate"
						label="Saturación de Fondo"
						value={visualEffects.backdropSaturate ?? DEFAULT_VISUAL_EFFECTS.backdropSaturate}
						onValueChange={(value) => handleVisualEffectsChange('backdropSaturate', value)}
						min={0}
						max={200}
						step={1}
						unit="%"
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormSlider
						id="backdropOpacity"
						label="Opacidad de Fondo"
						value={visualEffects.backdropOpacity ?? DEFAULT_VISUAL_EFFECTS.backdropOpacity}
						onValueChange={(value) => handleVisualEffectsChange('backdropOpacity', value)}
						min={0}
						max={100}
						step={1}
						unit="%"
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

// ✨ Componente principal del módulo de efectos visuales
export function VisualEffectsModule({ initialEffects, onChange, disabled, className }: VisualEffectsModuleProps) {
	const [visualEffects, setVisualEffects] = useState<VisualEffectsOptions>({
		...DEFAULT_VISUAL_EFFECTS,
		...initialEffects,
	});

	// 🔄 Actualizar estado cuando cambien las props
	useEffect(() => {
		if (initialEffects) {
			setVisualEffects({ ...DEFAULT_VISUAL_EFFECTS, ...initialEffects });
		}
	}, [initialEffects]);

	// 🎚️ Manejador de cambios de efectos visuales
	const handleVisualEffectsChange = (key: keyof VisualEffectsOptions, value: unknown) => {
		const updatedEffects = { ...visualEffects, [key]: value };
		setVisualEffects(updatedEffects);
		onChange?.(updatedEffects);
	};

	return (
		<FormLayout
			title="Efectos Visuales"
			description="Configuraciones para ajustar la apariencia visual de la tarjeta"
			colorScheme="visual"
			icon={<Sparkles className="h-4 w-4" />}
			className={className}
			maxHeight={550}
			variant="colored"
		>
			<FormToggle
				id="visual-effects-main-toggle"
				label="Habilitar Efectos Visuales"
				description="Activa o desactiva todos los efectos visuales"
				checked={true}
				onCheckedChange={() => { }}
				disabled={disabled}
			/>

			<div className="mt-4 space-y-6">
				<ImageAdjustmentsSection
					visualEffects={visualEffects}
					handleVisualEffectsChange={handleVisualEffectsChange}
					disabled={disabled}
				/>

				<StyleFiltersSection
					visualEffects={visualEffects}
					handleVisualEffectsChange={handleVisualEffectsChange}
					disabled={disabled}
				/>

				<BlurEffectsSection
					visualEffects={visualEffects}
					handleVisualEffectsChange={handleVisualEffectsChange}
					disabled={disabled}
				/>

				<BackdropEffectsSection
					visualEffects={visualEffects}
					handleVisualEffectsChange={handleVisualEffectsChange}
					disabled={disabled}
				/>
			</div>
		</FormLayout>
	);
}

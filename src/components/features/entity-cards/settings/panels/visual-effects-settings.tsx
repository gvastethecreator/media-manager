'use client';

import { Contrast, Droplets, Eye, Palette, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CardOptions } from '../types';
import {
	FormGroup,
	FormLayout,
	FormRow,
	FormSection,
	FormSlider,
	FormToggle,
	createNestedOptionChangeHandler,
	panelColors,
} from './shared';

// Tipo para las opciones de efectos visuales
interface VisualEffectsOptions {
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

// Sección de Ajustes de Imagen
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
						description="Ajusta el brillo de la imagen"
						value={visualEffects.brightness ?? 100}
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
						description="Ajusta el contraste de la imagen"
						value={visualEffects.contrast ?? 100}
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
						description="Ajusta la saturación de los colores"
						value={visualEffects.saturate ?? 100}
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
						description="Rota los colores de la imagen"
						value={visualEffects.hueRotate ?? 0}
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

// Sección de Filtros de Estilo
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
			description="Filtros para cambiar el estilo visual"
			colorScheme="visual"
			icon={<Palette className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={1}>
					<FormSlider
						id="grayscale"
						label="Escala de Grises"
						description="Convierte la imagen a escala de grises"
						value={visualEffects.grayscale ?? 0}
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
						description="Añade un tono sepia a la imagen"
						value={visualEffects.sepia ?? 0}
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
						description="Invierte los colores de la imagen"
						value={visualEffects.invert ?? 0}
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
						description="Ajusta la transparencia de la imagen"
						value={visualEffects.opacity ?? 100}
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

// Sección de Efectos de Desenfoque
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
			description="Ajustes relacionados con el desenfoque"
			colorScheme="visual"
			icon={<Droplets className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={1}>
					<FormSlider
						id="blur"
						label="Desenfoque"
						description="Aplica un desenfoque a la imagen"
						value={visualEffects.blur ?? 0}
						onValueChange={(value) => handleVisualEffectsChange('blur', value)}
						min={0}
						max={20}
						step={0.1}
						unit="px"
						disabled={disabled}
					/>
				</FormRow>
				<FormRow cols={1}>
					<FormToggle
						id="dropShadow"
						label="Sombra"
						description="Añade una sombra a la imagen"
						checked={visualEffects.dropShadow ?? false}
						onCheckedChange={(checked) => handleVisualEffectsChange('dropShadow', checked)}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

// Sección de Efectos de Fondo
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
			description="Efectos que se aplican al fondo detrás de la tarjeta"
			colorScheme="visual"
			icon={<Sparkles className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={1}>
					<FormSlider
						id="backdropBlur"
						label="Desenfoque de Fondo"
						description="Aplica un desenfoque al fondo detrás de la tarjeta"
						value={visualEffects.backdropBlur ?? 0}
						onValueChange={(value) => handleVisualEffectsChange('backdropBlur', value)}
						min={0}
						max={20}
						step={0.1}
						unit="px"
						disabled={disabled}
					/>
				</FormRow>
				<FormRow cols={1}>
					<FormSlider
						id="backdropBrightness"
						label="Brillo de Fondo"
						description="Ajusta el brillo del fondo detrás de la tarjeta"
						value={visualEffects.backdropBrightness ?? 100}
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
						description="Ajusta la saturación del fondo detrás de la tarjeta"
						value={visualEffects.backdropSaturate ?? 100}
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
						description="Ajusta la transparencia del fondo detrás de la tarjeta"
						value={visualEffects.backdropOpacity ?? 100}
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

export function VisualEffectsSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Inicializar opciones de efectos visuales desde las opciones de la tarjeta
	const [visualEffects, setVisualEffects] = useState<VisualEffectsOptions>({
		brightness: options.visualEffects?.brightness ?? 100,
		contrast: options.visualEffects?.contrast ?? 100,
		saturate: options.visualEffects?.saturate ?? 100,
		hueRotate: options.visualEffects?.hueRotate ?? 0,
		grayscale: options.visualEffects?.grayscale ?? 0,
		sepia: options.visualEffects?.sepia ?? 0,
		invert: options.visualEffects?.invert ?? 0,
		opacity: options.visualEffects?.opacity ?? 100,
		blur: options.visualEffects?.blur ?? 0,
		dropShadow: options.visualEffects?.dropShadow ?? false,
		backdropBlur: options.visualEffects?.backdropBlur ?? 0,
		backdropBrightness: options.visualEffects?.backdropBrightness ?? 100,
		backdropSaturate: options.visualEffects?.backdropSaturate ?? 100,
		backdropOpacity: options.visualEffects?.backdropOpacity ?? 100,
	});

	// Actualizar opciones de efectos visuales cuando cambien las opciones externas
	useEffect(() => {
		if (options.visualEffects) {
			setVisualEffects({
				brightness: options.visualEffects.brightness ?? 100,
				contrast: options.visualEffects.contrast ?? 100,
				saturate: options.visualEffects.saturate ?? 100,
				hueRotate: options.visualEffects.hueRotate ?? 0,
				grayscale: options.visualEffects.grayscale ?? 0,
				sepia: options.visualEffects.sepia ?? 0,
				invert: options.visualEffects.invert ?? 0,
				opacity: options.visualEffects.opacity ?? 100,
				blur: options.visualEffects.blur ?? 0,
				dropShadow: options.visualEffects.dropShadow ?? false,
				backdropBlur: options.visualEffects.backdropBlur ?? 0,
				backdropBrightness: options.visualEffects.backdropBrightness ?? 100,
				backdropSaturate: options.visualEffects.backdropSaturate ?? 100,
				backdropOpacity: options.visualEffects.backdropOpacity ?? 100,
			});
		}
	}, [options.visualEffects]);

	// Manejar cambios en opciones de efectos visuales
	const handleVisualEffectsChange = (key: keyof VisualEffectsOptions, value: unknown) => {
		const updatedVisualEffects = {
			...visualEffects,
			[key]: value,
		};

		setVisualEffects(updatedVisualEffects);

		// Propagar cambios al componente padre
		onChange({
			...options,
			visualEffects: updatedVisualEffects,
		});
	};

	return (
		<FormLayout
			title="Efectos Visuales"
			description="Configura filtros y efectos visuales básicos para las tarjetas"
			colorScheme="visual"
			variant="colored"
			maxHeight={500}
			tabs={[
				{ value: 'adjustments', label: 'Ajustes', icon: <Contrast className="h-3.5 w-3.5" /> },
				{ value: 'filters', label: 'Filtros', icon: <Palette className="h-3.5 w-3.5" /> },
				{ value: 'effects', label: 'Efectos', icon: <Sparkles className="h-3.5 w-3.5" /> },
			]}
		>
			{(tab) =>
				tab === 'adjustments' ? (
					<ImageAdjustmentsSection
						visualEffects={visualEffects}
						handleVisualEffectsChange={handleVisualEffectsChange}
						disabled={disabled}
					/>
				) : tab === 'filters' ? (
					<StyleFiltersSection
						visualEffects={visualEffects}
						handleVisualEffectsChange={handleVisualEffectsChange}
						disabled={disabled}
					/>
				) : (
					<>
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
					</>
				)
			}
		</FormLayout>
	);
}

'use client';

import { Scale, Scissors, Slice, Wand2, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CardOptions } from '../../types/card-settings-types';
import {
	FormGroup,
	FormLayout,
	FormRow,
	FormSection,
	FormSlider,
	FormToggle,
	panelColors
} from './shared';

// Tipo para las opciones de efectos de distorsión
interface DistortionEffectsOptions {
	enabled: boolean;
	visibleOnHover: boolean;
	intensity: number;
	glitchEffect: {
		enabled: boolean;
		visibleOnHover: boolean;
		intensity: number;
		frequency: number;
		duration: number;
	};
	chromaticAberration: {
		enabled: boolean;
		visibleOnHover: boolean;
		intensity: number;
		offset: number;
	};
	pixelate: {
		enabled: boolean;
		visibleOnHover: boolean;
		intensity: number;
		blockSize: number;
	};
}

// Sección de Configuración General
const GeneralSection = ({
	effects,
	onEffectsChange,
	disabled
}: {
	effects: DistortionEffectsOptions;
	onEffectsChange: (key: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Configuración General"
			description="Ajustes generales de los efectos de distorsión"
			colorScheme="visual"
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="enable-effects"
						label="Habilitar Efectos"
						description="Activa o desactiva todos los efectos de distorsión"
						checked={effects.enabled}
						onCheckedChange={(checked) => onEffectsChange('enabled', checked)}
						disabled={disabled}
						icon={<Wand2 className="h-3.5 w-3.5 text-muted-foreground" />}
					/>
					<FormToggle
						id="visible-on-hover"
						label="Visible en Hover"
						description="Muestra los efectos solo al pasar el cursor"
						checked={effects.visibleOnHover}
						onCheckedChange={(checked) => onEffectsChange('visibleOnHover', checked)}
						disabled={disabled || !effects.enabled}
					/>
				</FormRow>
				<FormRow cols={1}>
					<FormSlider
						id="intensity"
						label="Intensidad Global"
						description="Intensidad general de los efectos de distorsión"
						value={effects.intensity}
						onValueChange={(value) => onEffectsChange('intensity', value)}
						min={0}
						max={2}
						step={0.01}
						disabled={disabled || !effects.enabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

// Sección de Efecto Glitch
const GlitchSection = ({
	effects,
	onDistortionChange,
	disabled
}: {
	effects: DistortionEffectsOptions;
	onDistortionChange: (effect: 'glitch' | 'chromatic' | 'pixelate', property: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	const isDisabled = disabled || !effects.enabled || !effects.glitchEffect.enabled;

	return (
		<FormSection
			title="Efecto Glitch"
			description="Efecto de falla digital para simular corrupciones"
			colorScheme="visual"
			icon={<Zap className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="enable-glitch"
						label="Habilitar Glitch"
						description="Activa el efecto de falla digital"
						checked={effects.glitchEffect.enabled}
						onCheckedChange={(checked) => onDistortionChange('glitch', 'enabled', checked)}
						disabled={disabled || !effects.enabled}
					/>
					<FormToggle
						id="glitch-visible-on-hover"
						label="Visible en Hover"
						description="Muestra el efecto solo al pasar el cursor"
						checked={effects.glitchEffect.visibleOnHover}
						onCheckedChange={(checked) => onDistortionChange('glitch', 'visibleOnHover', checked)}
						disabled={isDisabled}
					/>
				</FormRow>
				<FormRow>
					<FormSlider
						id="glitch-intensity"
						label="Intensidad"
						description="Fuerza del efecto glitch"
						value={effects.glitchEffect.intensity}
						onValueChange={(value) => onDistortionChange('glitch', 'intensity', value)}
						min={0}
						max={1}
						step={0.01}
						disabled={isDisabled}
					/>
				</FormRow>
				<FormRow>
					<FormSlider
						id="glitch-frequency"
						label="Frecuencia"
						description="Frecuencia de aparición del efecto"
						value={effects.glitchEffect.frequency}
						onValueChange={(value) => onDistortionChange('glitch', 'frequency', value)}
						min={0}
						max={1}
						step={0.01}
						disabled={isDisabled}
					/>
					<FormSlider
						id="glitch-duration"
						label="Duración"
						description="Duración del efecto en segundos"
						value={effects.glitchEffect.duration}
						onValueChange={(value) => onDistortionChange('glitch', 'duration', value)}
						min={0.05}
						max={1}
						step={0.01}
						unit="s"
						disabled={isDisabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

// Sección de Aberración Cromática
const ChromaticAberrationSection = ({
	effects,
	onDistortionChange,
	disabled
}: {
	effects: DistortionEffectsOptions;
	onDistortionChange: (effect: 'glitch' | 'chromatic' | 'pixelate', property: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	const isDisabled = disabled || !effects.enabled || !effects.chromaticAberration.enabled;

	return (
		<FormSection
			title="Aberración Cromática"
			description="Efecto de separación de colores en los bordes"
			colorScheme="visual"
			icon={<Scissors className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="enable-chromatic"
						label="Habilitar Aberración"
						description="Activa el efecto de aberración cromática"
						checked={effects.chromaticAberration.enabled}
						onCheckedChange={(checked) => onDistortionChange('chromatic', 'enabled', checked)}
						disabled={disabled || !effects.enabled}
					/>
					<FormToggle
						id="chromatic-visible-on-hover"
						label="Visible en Hover"
						description="Muestra el efecto solo al pasar el cursor"
						checked={effects.chromaticAberration.visibleOnHover}
						onCheckedChange={(checked) => onDistortionChange('chromatic', 'visibleOnHover', checked)}
						disabled={isDisabled}
					/>
				</FormRow>
				<FormRow>
					<FormSlider
						id="chromatic-intensity"
						label="Intensidad"
						description="Fuerza del efecto de aberración"
						value={effects.chromaticAberration.intensity}
						onValueChange={(value) => onDistortionChange('chromatic', 'intensity', value)}
						min={0}
						max={1}
						step={0.01}
						disabled={isDisabled}
					/>
					<FormSlider
						id="chromatic-offset"
						label="Desplazamiento"
						description="Distancia de separación entre colores"
						value={effects.chromaticAberration.offset}
						onValueChange={(value) => onDistortionChange('chromatic', 'offset', value)}
						min={0}
						max={0.5}
						step={0.01}
						unit="px"
						disabled={isDisabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

// Sección de Pixelado
const PixelateSection = ({
	effects,
	onDistortionChange,
	disabled
}: {
	effects: DistortionEffectsOptions;
	onDistortionChange: (effect: 'glitch' | 'chromatic' | 'pixelate', property: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	const isDisabled = disabled || !effects.enabled || !effects.pixelate.enabled;

	return (
		<FormSection
			title="Pixelado"
			description="Efecto de reducción de resolución por bloques"
			colorScheme="visual"
			icon={<Scale className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="enable-pixelate"
						label="Habilitar Pixelado"
						description="Activa el efecto de pixelado"
						checked={effects.pixelate.enabled}
						onCheckedChange={(checked) => onDistortionChange('pixelate', 'enabled', checked)}
						disabled={disabled || !effects.enabled}
					/>
					<FormToggle
						id="pixelate-visible-on-hover"
						label="Visible en Hover"
						description="Muestra el efecto solo al pasar el cursor"
						checked={effects.pixelate.visibleOnHover}
						onCheckedChange={(checked) => onDistortionChange('pixelate', 'visibleOnHover', checked)}
						disabled={isDisabled}
					/>
				</FormRow>
				<FormRow>
					<FormSlider
						id="pixelate-intensity"
						label="Intensidad"
						description="Fuerza del efecto de pixelado"
						value={effects.pixelate.intensity}
						onValueChange={(value) => onDistortionChange('pixelate', 'intensity', value)}
						min={0}
						max={1}
						step={0.01}
						disabled={isDisabled}
					/>
					<FormSlider
						id="pixelate-blockSize"
						label="Tamaño de Bloque"
						description="Tamaño de los píxeles"
						value={effects.pixelate.blockSize}
						onValueChange={(value) => onDistortionChange('pixelate', 'blockSize', value)}
						min={1}
						max={32}
						step={1}
						unit="px"
						disabled={isDisabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

export function DistortionEffectsSettings({
	cardOptions,
	onCardOptionsChange,
	disabled = false
}: {
	cardOptions: CardOptions;
	onCardOptionsChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Inicializar efectos de distorsión desde las opciones de la tarjeta
	const [effects, setEffects] = useState<DistortionEffectsOptions>(
		cardOptions.effects || {
			enabled: false,
			visibleOnHover: false,
			intensity: 1,
			glitchEffect: {
				enabled: false,
				visibleOnHover: false,
				intensity: 0.5,
				frequency: 0.1,
				duration: 0.2,
			},
			chromaticAberration: {
				enabled: false,
				visibleOnHover: false,
				intensity: 0.5,
				offset: 0.1,
			},
			pixelate: {
				enabled: false,
				visibleOnHover: false,
				intensity: 0.5,
				blockSize: 4,
			},
		}
	);

	// Actualizar efectos cuando cambien las opciones externas
	useEffect(() => {
		if (cardOptions.effects) {
			setEffects(cardOptions.effects);
		}
	}, [cardOptions.effects]);

	// Manejador para cambios en propiedades de nivel superior
	const handleEffectsChange = (key: string, value: unknown) => {
		const updatedEffects = {
			...effects,
			[key]: value,
		};

		setEffects(updatedEffects);

		// Propagar cambios al componente padre
		onCardOptionsChange({
			...cardOptions,
			effects: updatedEffects,
		});
	};

	// Manejador para cambios en efectos de distorsión específicos
	const handleDistortionChange = (
		effect: 'glitch' | 'chromatic' | 'pixelate',
		property: string,
		value: unknown
	) => {
		let updatedEffect: DistortionEffectsOptions;

		switch (effect) {
			case 'glitch':
				updatedEffect = {
					...effects,
					glitchEffect: {
						...effects.glitchEffect,
						[property]: value,
					},
				};
				break;
			case 'chromatic':
				updatedEffect = {
					...effects,
					chromaticAberration: {
						...effects.chromaticAberration,
						[property]: value,
					},
				};
				break;
			case 'pixelate':
				updatedEffect = {
					...effects,
					pixelate: {
						...effects.pixelate,
						[property]: value,
					},
				};
				break;
			default:
				return;
		}

		setEffects(updatedEffect);

		// Propagar cambios al componente padre
		onCardOptionsChange({
			...cardOptions,
			effects: updatedEffect,
		});
	};

	return (
		<FormLayout
			title="Efectos de Distorsión"
			description="Configura efectos de distorsión como glitch, aberración cromática y pixelado"
			colorScheme="visual"
			variant="colored"
			maxHeight={600}
			tabs={[
				{ value: 'general', label: 'General', icon: <Wand2 className="h-3.5 w-3.5" /> },
				{ value: 'glitch', label: 'Glitch', icon: <Zap className="h-3.5 w-3.5" /> },
				{ value: 'chromatic', label: 'Aberración', icon: <Scissors className="h-3.5 w-3.5" /> },
				{ value: 'pixelate', label: 'Pixelado', icon: <Scale className="h-3.5 w-3.5" /> },
			]}
		>
			{(tab) => (
				tab === 'general' ? (
					<GeneralSection
						effects={effects}
						onEffectsChange={handleEffectsChange}
						disabled={disabled}
					/>
				) : tab === 'glitch' ? (
					<GlitchSection
						effects={effects}
						onDistortionChange={handleDistortionChange}
						disabled={disabled}
					/>
				) : tab === 'chromatic' ? (
					<ChromaticAberrationSection
						effects={effects}
						onDistortionChange={handleDistortionChange}
						disabled={disabled}
					/>
				) : (
					<PixelateSection
						effects={effects}
						onDistortionChange={handleDistortionChange}
						disabled={disabled}
					/>
				)
			)}
		</FormLayout>
	);
}

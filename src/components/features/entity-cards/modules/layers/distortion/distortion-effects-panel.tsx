'use client';

import { Scale, Scissors, Slice, Wand2, Zap } from 'lucide-react';
import { useState } from 'react';
import {
	FormGroup,
	FormLayout,
	FormRow,
	FormSection,
	FormSlider,
	FormToggle,
} from '../../../../settings/panels/shared';
import type { DistortionEffectsSystem } from './types';

interface DistortionEffectsPanelProps {
	effectsSystem: DistortionEffectsSystem;
	onChange: (system: DistortionEffectsSystem) => void;
	disabled?: boolean;
	className?: string;
}

/**
 * Sección de Configuración General
 */
const GeneralSection = ({
	effects,
	onEffectsChange,
	disabled,
}: {
	effects: DistortionEffectsSystem;
	onEffectsChange: (key: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Configuración General"
			description="Ajustes globales para todos los efectos de distorsión"
			colorScheme="advanced"
			icon={<Wand2 className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={1}>
					<FormToggle
						id="distortion-enabled"
						label="Habilitar Efectos de Distorsión"
						description="Activa o desactiva todos los efectos de distorsión"
						checked={effects.enabled}
						onCheckedChange={(checked) => onEffectsChange('enabled', checked)}
						disabled={disabled}
					/>
				</FormRow>

				{effects.enabled && (
					<>
						<FormRow cols={1}>
							<FormToggle
								id="distortion-hover-only"
								label="Solo visible al pasar el cursor"
								description="Los efectos solo se mostrarán al pasar el cursor sobre la tarjeta"
								checked={effects.visibleOnHover}
								onCheckedChange={(checked) => onEffectsChange('visibleOnHover', checked)}
								disabled={disabled}
							/>
						</FormRow>

						<FormRow cols={1}>
							<FormSlider
								id="distortion-intensity"
								label="Intensidad global"
								description="Controla la intensidad general de todos los efectos"
								value={effects.intensity}
								onValueChange={(value) => onEffectsChange('intensity', value)}
								min={0}
								max={1}
								step={0.01}
								disabled={disabled}
							/>
						</FormRow>
					</>
				)}
			</FormGroup>
		</FormSection>
	);
};

/**
 * Sección de Efecto Glitch
 */
const GlitchSection = ({
	effects,
	onDistortionChange,
	disabled,
}: {
	effects: DistortionEffectsSystem;
	onDistortionChange: (effect: 'glitch' | 'chromatic' | 'pixelate', property: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Efecto Glitch"
			description="Simula errores digitales y ruido para un aspecto dañado"
			colorScheme="advanced"
			icon={<Zap className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={1}>
					<FormToggle
						id="glitch-enabled"
						label="Habilitar Efecto Glitch"
						description="Activa o desactiva el efecto glitch"
						checked={effects.glitchEffect.enabled}
						onCheckedChange={(checked) => onDistortionChange('glitch', 'enabled', checked)}
						disabled={disabled || !effects.enabled}
					/>
				</FormRow>

				{effects.glitchEffect.enabled && effects.enabled && (
					<>
						<FormRow cols={1}>
							<FormToggle
								id="glitch-hover-only"
								label="Solo visible al pasar el cursor"
								description="El efecto solo se mostrará al pasar el cursor sobre la tarjeta"
								checked={effects.glitchEffect.visibleOnHover}
								onCheckedChange={(checked) => onDistortionChange('glitch', 'visibleOnHover', checked)}
								disabled={disabled}
							/>
						</FormRow>

						<FormRow cols={1}>
							<FormSlider
								id="glitch-intensity"
								label="Intensidad"
								description="Controla la intensidad del efecto glitch"
								value={effects.glitchEffect.intensity}
								onValueChange={(value) => onDistortionChange('glitch', 'intensity', value)}
								min={0}
								max={1}
								step={0.01}
								disabled={disabled}
							/>
						</FormRow>

						<FormRow cols={1}>
							<FormSlider
								id="glitch-frequency"
								label="Frecuencia"
								description="Controla la frecuencia con la que ocurre el efecto"
								value={effects.glitchEffect.frequency}
								onValueChange={(value) => onDistortionChange('glitch', 'frequency', value)}
								min={0}
								max={1}
								step={0.01}
								disabled={disabled}
							/>
						</FormRow>

						<FormRow cols={1}>
							<FormSlider
								id="glitch-duration"
								label="Duración"
								description="Duración de cada glitch en segundos"
								value={effects.glitchEffect.duration}
								onValueChange={(value) => onDistortionChange('glitch', 'duration', value)}
								min={0.05}
								max={1}
								step={0.01}
								unit="s"
								disabled={disabled}
							/>
						</FormRow>
					</>
				)}
			</FormGroup>
		</FormSection>
	);
};

/**
 * Sección de Aberración Cromática
 */
const ChromaticAberrationSection = ({
	effects,
	onDistortionChange,
	disabled,
}: {
	effects: DistortionEffectsSystem;
	onDistortionChange: (effect: 'glitch' | 'chromatic' | 'pixelate', property: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Aberración Cromática"
			description="Desplazamiento de los canales de color RGB para un aspecto retro"
			colorScheme="advanced"
			icon={<Slice className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={1}>
					<FormToggle
						id="chromatic-enabled"
						label="Habilitar Aberración Cromática"
						description="Activa o desactiva el efecto de aberración cromática"
						checked={effects.chromaticAberration.enabled}
						onCheckedChange={(checked) => onDistortionChange('chromatic', 'enabled', checked)}
						disabled={disabled || !effects.enabled}
					/>
				</FormRow>

				{effects.chromaticAberration.enabled && effects.enabled && (
					<>
						<FormRow cols={1}>
							<FormToggle
								id="chromatic-hover-only"
								label="Solo visible al pasar el cursor"
								description="El efecto solo se mostrará al pasar el cursor sobre la tarjeta"
								checked={effects.chromaticAberration.visibleOnHover}
								onCheckedChange={(checked) => onDistortionChange('chromatic', 'visibleOnHover', checked)}
								disabled={disabled}
							/>
						</FormRow>

						<FormRow cols={1}>
							<FormSlider
								id="chromatic-intensity"
								label="Intensidad"
								description="Controla la intensidad del efecto"
								value={effects.chromaticAberration.intensity}
								onValueChange={(value) => onDistortionChange('chromatic', 'intensity', value)}
								min={0}
								max={1}
								step={0.01}
								disabled={disabled}
							/>
						</FormRow>

						<FormRow cols={1}>
							<FormSlider
								id="chromatic-offset"
								label="Desplazamiento"
								description="Cantidad de píxeles a desplazar los canales de color"
								value={effects.chromaticAberration.offset}
								onValueChange={(value) => onDistortionChange('chromatic', 'offset', value)}
								min={0}
								max={10}
								step={0.1}
								unit="px"
								disabled={disabled}
							/>
						</FormRow>
					</>
				)}
			</FormGroup>
		</FormSection>
	);
};

/**
 * Sección de Pixelado
 */
const PixelateSection = ({
	effects,
	onDistortionChange,
	disabled,
}: {
	effects: DistortionEffectsSystem;
	onDistortionChange: (effect: 'glitch' | 'chromatic' | 'pixelate', property: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Efecto Pixelado"
			description="Reduce la resolución para crear un aspecto pixelado"
			colorScheme="advanced"
			icon={<Scale className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow cols={1}>
					<FormToggle
						id="pixelate-enabled"
						label="Habilitar Pixelado"
						description="Activa o desactiva el efecto de pixelado"
						checked={effects.pixelate.enabled}
						onCheckedChange={(checked) => onDistortionChange('pixelate', 'enabled', checked)}
						disabled={disabled || !effects.enabled}
					/>
				</FormRow>

				{effects.pixelate.enabled && effects.enabled && (
					<>
						<FormRow cols={1}>
							<FormToggle
								id="pixelate-hover-only"
								label="Solo visible al pasar el cursor"
								description="El efecto solo se mostrará al pasar el cursor sobre la tarjeta"
								checked={effects.pixelate.visibleOnHover}
								onCheckedChange={(checked) => onDistortionChange('pixelate', 'visibleOnHover', checked)}
								disabled={disabled}
							/>
						</FormRow>

						<FormRow cols={1}>
							<FormSlider
								id="pixelate-intensity"
								label="Intensidad"
								description="Controla la intensidad del efecto"
								value={effects.pixelate.intensity}
								onValueChange={(value) => onDistortionChange('pixelate', 'intensity', value)}
								min={0}
								max={1}
								step={0.01}
								disabled={disabled}
							/>
						</FormRow>

						<FormRow cols={1}>
							<FormSlider
								id="pixelate-block-size"
								label="Tamaño de bloques"
								description="Tamaño de los bloques de píxeles"
								value={effects.pixelate.blockSize}
								onValueChange={(value) => onDistortionChange('pixelate', 'blockSize', value)}
								min={1}
								max={32}
								step={1}
								unit="px"
								disabled={disabled}
							/>
						</FormRow>
					</>
				)}
			</FormGroup>
		</FormSection>
	);
};

/**
 * Panel de configuración para los efectos de distorsión
 */
export function DistortionEffectsPanel({
	effectsSystem,
	onChange,
	disabled = false,
	className,
}: DistortionEffectsPanelProps) {
	// Handler para cambios en configuración general
	const handleEffectsChange = (key: string, value: unknown) => {
		onChange({
			...effectsSystem,
			[key]: value,
		});
	};

	// Handler para cambios en efectos específicos
	const handleDistortionChange = (effect: 'glitch' | 'chromatic' | 'pixelate', property: string, value: unknown) => {
		const effectMap = {
			glitch: 'glitchEffect',
			chromatic: 'chromaticAberration',
			pixelate: 'pixelate',
		};

		const effectKey = effectMap[effect];

		onChange({
			...effectsSystem,
			[effectKey]: {
				...effectsSystem[effectKey as keyof DistortionEffectsSystem],
				[property]: value,
			},
		});
	};

	return (
		<FormLayout
			title="Efectos de Distorsión"
			description="Configura efectos visuales avanzados que distorsionan la apariencia de las tarjetas"
			colorScheme="advanced"
			variant="colored"
			maxHeight={500}
			className={className}
		>
			<GeneralSection effects={effectsSystem} onEffectsChange={handleEffectsChange} disabled={disabled} />

			<GlitchSection effects={effectsSystem} onDistortionChange={handleDistortionChange} disabled={disabled} />

			<ChromaticAberrationSection
				effects={effectsSystem}
				onDistortionChange={handleDistortionChange}
				disabled={disabled}
			/>

			<PixelateSection effects={effectsSystem} onDistortionChange={handleDistortionChange} disabled={disabled} />
		</FormLayout>
	);
}

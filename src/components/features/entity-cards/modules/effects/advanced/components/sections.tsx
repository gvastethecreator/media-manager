'use client';

import { Paintbrush, Rainbow, ScanLine, Wallpaper, Zap } from 'lucide-react';
import {
	FormColorPicker,
	FormGroup,
	FormRow,
	FormSection,
	FormSlider,
	FormToggle,
} from '../../../../../../settings/panels/shared';
import type { AdvancedEffectsOptions } from '../types';

type SectionProps = {
	effects: AdvancedEffectsOptions;
	onEffectsChange: <K extends keyof AdvancedEffectsOptions>(key: K, value: AdvancedEffectsOptions[K]) => void;
	disabled?: boolean;
};

/**
 * 📦 Sección de Efectos de Escaneo
 */
export const ScanEffectsSection = ({ effects, onEffectsChange, disabled }: SectionProps) => {
	const isScanLinesEnabled = effects.scanlines ?? false;

	return (
		<FormSection
			title="Efectos de Escaneo"
			description="Configuración de efectos visuales de tipo retro"
			colorScheme="advanced"
			icon={<ScanLine className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="scanlines"
						label="Líneas de Escaneo"
						description="Añade un efecto de líneas de escaneo retro a la tarjeta"
						checked={isScanLinesEnabled}
						onCheckedChange={(checked) => onEffectsChange('scanlines', checked)}
						disabled={disabled}
					/>
				</FormRow>

				{isScanLinesEnabled && (
					<FormRow>
						<FormSlider
							id="scanlinesDensity"
							label="Densidad"
							description="Controla la densidad de las líneas de escaneo"
							value={effects.scanlinesDensity ?? 2}
							onValueChange={(value) => onEffectsChange('scanlinesDensity', value)}
							min={1}
							max={10}
							step={0.1}
							disabled={disabled}
						/>
						<FormSlider
							id="scanlinesOpacity"
							label="Opacidad"
							description="Controla la opacidad de las líneas de escaneo"
							value={effects.scanlinesOpacity ?? 0.3}
							onValueChange={(value) => onEffectsChange('scanlinesOpacity', value)}
							min={0}
							max={1}
							step={0.01}
							disabled={disabled}
						/>
					</FormRow>
				)}
			</FormGroup>
		</FormSection>
	);
};

/**
 * 📦 Sección de Efectos de Textura
 */
export const TextureEffectsSection = ({ effects, onEffectsChange, disabled }: SectionProps) => {
	const isGrainEnabled = effects.grain ?? false;
	const isNoiseTextureEnabled = effects.noiseTexture ?? false;

	return (
		<FormSection
			title="Efectos de Textura"
			description="Añade texturas sutiles para dar profundidad a la tarjeta"
			colorScheme="advanced"
			icon={<Wallpaper className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="grain"
						label="Grano"
						description="Añade un efecto de grano de película a la tarjeta"
						checked={isGrainEnabled}
						onCheckedChange={(checked) => onEffectsChange('grain', checked)}
						disabled={disabled}
					/>
				</FormRow>

				{isGrainEnabled && (
					<FormRow>
						<FormSlider
							id="grainDensity"
							label="Densidad"
							description="Controla la densidad del grano"
							value={effects.grainDensity ?? 30}
							onValueChange={(value) => onEffectsChange('grainDensity', value)}
							min={1}
							max={100}
							disabled={disabled}
						/>
						<FormSlider
							id="grainOpacity"
							label="Opacidad"
							description="Controla la opacidad del grano"
							value={effects.grainOpacity ?? 0.2}
							onValueChange={(value) => onEffectsChange('grainOpacity', value)}
							min={0}
							max={1}
							step={0.01}
							disabled={disabled}
						/>
					</FormRow>
				)}

				<FormRow>
					<FormToggle
						id="noiseTexture"
						label="Textura de Ruido"
						description="Añade una textura de ruido sutil a la tarjeta"
						checked={isNoiseTextureEnabled}
						onCheckedChange={(checked) => onEffectsChange('noiseTexture', checked)}
						disabled={disabled}
					/>
				</FormRow>

				{isNoiseTextureEnabled && (
					<FormRow>
						<FormSlider
							id="noiseTextureDensity"
							label="Densidad"
							description="Controla la densidad de la textura de ruido"
							value={effects.noiseTextureDensity ?? 40}
							onValueChange={(value) => onEffectsChange('noiseTextureDensity', value)}
							min={1}
							max={100}
							disabled={disabled}
						/>
						<FormSlider
							id="noiseTextureOpacity"
							label="Opacidad"
							description="Controla la opacidad de la textura de ruido"
							value={effects.noiseTextureOpacity ?? 0.15}
							onValueChange={(value) => onEffectsChange('noiseTextureOpacity', value)}
							min={0}
							max={1}
							step={0.01}
							disabled={disabled}
						/>
					</FormRow>
				)}
			</FormGroup>
		</FormSection>
	);
};

/**
 * 📦 Sección de Efectos de Borde
 */
export const BorderEffectsSection = ({ effects, onEffectsChange, disabled }: SectionProps) => {
	const isBorderGlowEnabled = effects.borderGlow ?? false;

	return (
		<FormSection
			title="Efectos de Borde"
			description="Configuración de efectos visuales para los bordes"
			colorScheme="advanced"
			icon={<Paintbrush className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="borderGlow"
						label="Resplandor de Borde"
						description="Añade un efecto de resplandor alrededor del borde de la tarjeta"
						checked={isBorderGlowEnabled}
						onCheckedChange={(checked) => onEffectsChange('borderGlow', checked)}
						disabled={disabled}
					/>
				</FormRow>

				{isBorderGlowEnabled && (
					<>
						<FormRow>
							<FormColorPicker
								id="borderGlowColor"
								label="Color"
								description="Selecciona el color del resplandor del borde"
								value={effects.borderGlowColor ?? '#00ffff'}
								onChange={(value) => onEffectsChange('borderGlowColor', value)}
								disabled={disabled}
							/>
						</FormRow>
						<FormRow>
							<FormSlider
								id="borderGlowWidth"
								label="Ancho"
								description="Controla el ancho del resplandor del borde"
								value={effects.borderGlowWidth ?? 3}
								onValueChange={(value) => onEffectsChange('borderGlowWidth', value)}
								min={1}
								max={10}
								disabled={disabled}
							/>
							<FormSlider
								id="borderGlowSpread"
								label="Propagación"
								description="Controla la propagación del resplandor del borde"
								value={effects.borderGlowSpread ?? 10}
								onValueChange={(value) => onEffectsChange('borderGlowSpread', value)}
								min={0}
								max={30}
								disabled={disabled}
							/>
							<FormSlider
								id="borderGlowIntensity"
								label="Intensidad"
								description="Controla la intensidad del resplandor del borde"
								value={effects.borderGlowIntensity ?? 0.7}
								onValueChange={(value) => onEffectsChange('borderGlowIntensity', value)}
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
 * 📦 Sección de Efectos Holográficos
 */
export const HolographicEffectsSection = ({ effects, onEffectsChange, disabled }: SectionProps) => {
	const isHolographicEnabled = effects.holographicEffect ?? false;

	return (
		<FormSection
			title="Efectos Holográficos"
			description="Añade efectos holográficos a la tarjeta"
			colorScheme="advanced"
			icon={<Rainbow className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="holographicEffect"
						label="Efecto Holográfico"
						description="Añade un efecto holográfico a la tarjeta"
						checked={isHolographicEnabled}
						onCheckedChange={(checked) => onEffectsChange('holographicEffect', checked)}
						disabled={disabled}
					/>
				</FormRow>

				{isHolographicEnabled && (
					<>
						<FormRow>
							<FormToggle
								id="holographicRainbowMode"
								label="Modo Arcoíris"
								description="Cambia entre color único y arcoíris"
								checked={effects.holographicRainbowMode ?? false}
								onCheckedChange={(checked) => onEffectsChange('holographicRainbowMode', checked)}
								disabled={disabled}
							/>
						</FormRow>

						{!effects.holographicRainbowMode && (
							<FormRow>
								<FormColorPicker
									id="holographicEffectColor"
									label="Color"
									description="Selecciona el color del efecto holográfico"
									value={effects.holographicEffectColor ?? '#ff00ff'}
									onChange={(value) => onEffectsChange('holographicEffectColor', value)}
									disabled={disabled}
								/>
							</FormRow>
						)}

						<FormRow>
							<FormSlider
								id="holographicEffectIntensity"
								label="Intensidad"
								description="Controla la intensidad del efecto holográfico"
								value={effects.holographicEffectIntensity ?? 0.5}
								onValueChange={(value) => onEffectsChange('holographicEffectIntensity', value)}
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
 * 📦 Sección de Efectos de Distorsión
 */
export const DistortionEffectsSection = ({ effects, onEffectsChange, disabled }: SectionProps) => {
	const isChromaticAberrationEnabled = effects.chromaticAberration ?? false;
	const isGlitchEffectEnabled = effects.glitchEffect ?? false;
	const isPixelateEnabled = effects.pixelate ?? false;

	return (
		<FormSection
			title="Efectos de Distorsión"
			description="Añade efectos de distorsión visual a la tarjeta"
			colorScheme="advanced"
			icon={<Zap className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="chromaticAberration"
						label="Aberración Cromática"
						description="Añade un efecto de aberración cromática a la tarjeta"
						checked={isChromaticAberrationEnabled}
						onCheckedChange={(checked) => onEffectsChange('chromaticAberration', checked)}
						disabled={disabled}
					/>
				</FormRow>

				{isChromaticAberrationEnabled && (
					<FormRow>
						<FormSlider
							id="chromaticAberrationOffset"
							label="Desplazamiento"
							description="Controla el desplazamiento de la aberración cromática"
							value={effects.chromaticAberrationOffset ?? 2}
							onValueChange={(value) => onEffectsChange('chromaticAberrationOffset', value)}
							min={1}
							max={10}
							step={0.1}
							disabled={disabled}
						/>
						<FormSlider
							id="chromaticAberrationIntensity"
							label="Intensidad"
							description="Controla la intensidad de la aberración cromática"
							value={effects.chromaticAberrationIntensity ?? 0.5}
							onValueChange={(value) => onEffectsChange('chromaticAberrationIntensity', value)}
							min={0}
							max={1}
							step={0.01}
							disabled={disabled}
						/>
					</FormRow>
				)}

				<FormRow>
					<FormToggle
						id="glitchEffect"
						label="Efecto Glitch"
						description="Añade un efecto de glitch a la tarjeta"
						checked={isGlitchEffectEnabled}
						onCheckedChange={(checked) => onEffectsChange('glitchEffect', checked)}
						disabled={disabled}
					/>
				</FormRow>

				{isGlitchEffectEnabled && (
					<FormRow>
						<FormSlider
							id="glitchEffectIntensity"
							label="Intensidad"
							description="Controla la intensidad del efecto de glitch"
							value={effects.glitchEffectIntensity ?? 0.3}
							onValueChange={(value) => onEffectsChange('glitchEffectIntensity', value)}
							min={0}
							max={1}
							step={0.01}
							disabled={disabled}
						/>
						<FormSlider
							id="glitchEffectFrequency"
							label="Frecuencia"
							description="Controla la frecuencia del efecto de glitch"
							value={effects.glitchEffectFrequency ?? 0.5}
							onValueChange={(value) => onEffectsChange('glitchEffectFrequency', value)}
							min={0}
							max={1}
							step={0.01}
							disabled={disabled}
						/>
					</FormRow>
				)}

				<FormRow>
					<FormToggle
						id="pixelate"
						label="Pixelar"
						description="Añade un efecto de pixelado a la tarjeta"
						checked={isPixelateEnabled}
						onCheckedChange={(checked) => onEffectsChange('pixelate', checked)}
						disabled={disabled}
					/>
				</FormRow>

				{isPixelateEnabled && (
					<FormRow>
						<FormSlider
							id="pixelateSize"
							label="Tamaño de Píxel"
							description="Controla el tamaño de los píxeles"
							value={effects.pixelateSize ?? 5}
							onValueChange={(value) => onEffectsChange('pixelateSize', value)}
							min={2}
							max={20}
							step={1}
							disabled={disabled}
						/>
					</FormRow>
				)}
			</FormGroup>
		</FormSection>
	);
};

'use client';

import { Eye, Settings2, Sliders, Sparkles } from 'lucide-react';
import {
	FormGroup,
	FormRow,
	FormSection,
	FormSelect,
	FormSlider,
	FormToggle,
} from '../../../../../settings/panels/shared';
import type { ImageOptions } from '../types';

/**
 * 📦 Sección de Diseño para configuración de imagen
 */
export const DesignSection = ({
	imageOptions,
	handleImageChange,
	handleDesignSystemChange,
	disabled,
}: {
	imageOptions: ImageOptions;
	handleImageChange: (key: keyof ImageOptions, value: unknown) => void;
	handleDesignSystemChange: (key: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection title="Diseño" description="Configuración general del aspecto de la imagen" colorScheme="design">
			<FormGroup>
				<FormRow>
					<FormToggle
						id="enable-3d-effect"
						label="Efecto 3D"
						description="Activa el efecto tridimensional para la imagen"
						checked={imageOptions.enable3DEffect}
						onCheckedChange={(checked) => handleImageChange('enable3DEffect', checked)}
						disabled={disabled}
					/>
					<FormToggle
						id="rounded-corners"
						label="Esquinas redondeadas"
						description="Aplica esquinas redondeadas a la imagen"
						checked={imageOptions.designSystem?.cornerStyle === 'rounded'}
						onCheckedChange={(checked) => handleDesignSystemChange('cornerStyle', checked ? 'rounded' : 'sharp')}
						disabled={disabled}
					/>
				</FormRow>
				<FormRow>
					<FormSlider
						id="elevation"
						label="Elevación"
						description="Nivel de elevación de la imagen"
						value={imageOptions.designSystem?.elevation || 0}
						onValueChange={(value) => handleDesignSystemChange('elevation', value)}
						min={0}
						max={5}
						step={1}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

/**
 * 📦 Sección de Efectos Básicos para configuración de imagen
 */
export const BasicEffectsSection = ({
	imageOptions,
	handleImageChange,
	disabled,
}: {
	imageOptions: ImageOptions;
	handleImageChange: (key: keyof ImageOptions, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Efectos Básicos"
			description="Efectos visuales básicos para mejorar la apariencia"
			colorScheme="visual"
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="enable-holographic"
						label="Holográfico"
						description="Aplica un efecto holográfico a la imagen"
						checked={imageOptions.enableHolographicEffect}
						onCheckedChange={(checked) => handleImageChange('enableHolographicEffect', checked)}
						disabled={disabled}
						icon={<Sparkles className="h-3.5 w-3.5 text-muted-foreground" />}
					/>
					<FormToggle
						id="enable-glow"
						label="Brillo"
						description="Añade un efecto de brillo alrededor de la imagen"
						checked={imageOptions.enableGlowEffect}
						onCheckedChange={(checked) => handleImageChange('enableGlowEffect', checked)}
						disabled={disabled}
					/>
				</FormRow>
				<FormRow>
					<FormToggle
						id="enable-animated-border"
						label="Borde Animado"
						description="Añade un borde con animación"
						checked={imageOptions.enableAnimatedBorder}
						onCheckedChange={(checked) => handleImageChange('enableAnimatedBorder', checked)}
						disabled={disabled}
					/>
					<FormToggle
						id="enable-light-halo"
						label="Halo de Luz"
						description="Crea un halo luminoso alrededor de la imagen"
						checked={imageOptions.enableLightHalo}
						onCheckedChange={(checked) => handleImageChange('enableLightHalo', checked)}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

/**
 * 📦 Sección de Efectos de Profundidad para configuración de imagen
 */
export const DepthEffectsSection = ({
	imageOptions,
	handleEffectsChange,
	disabled,
}: {
	imageOptions: ImageOptions;
	handleEffectsChange: (key: string, subKey: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Efectos de Profundidad"
			description="Efectos que aportan profundidad y realismo"
			colorScheme="visual"
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="enable-shadow"
						label="Sombra"
						description="Añade sombra a la imagen"
						checked={imageOptions.effects?.shadow?.enabled}
						onCheckedChange={(checked) => handleEffectsChange('shadow', 'enabled', checked)}
						disabled={disabled}
					/>
					<FormToggle
						id="enable-reflection"
						label="Reflexión"
						description="Añade un efecto de reflexión"
						checked={imageOptions.effects?.reflection?.enabled}
						onCheckedChange={(checked) => handleEffectsChange('reflection', 'enabled', checked)}
						disabled={disabled}
					/>
				</FormRow>
				<FormRow>
					<FormToggle
						id="enable-parallax"
						label="Parallax"
						description="Añade efecto de parallax al mover la imagen"
						checked={imageOptions.effects?.parallax?.enabled}
						onCheckedChange={(checked) => handleEffectsChange('parallax', 'enabled', checked)}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

/**
 * 📦 Sección de Rendimiento para configuración de imagen
 */
export const PerformanceSection = ({
	imageOptions,
	handlePerformanceChange,
	disabled,
}: {
	imageOptions: ImageOptions;
	handlePerformanceChange: (key: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection title="Rendimiento" description="Opciones relacionadas con el rendimiento" colorScheme="advanced">
			<FormGroup>
				<FormRow>
					<FormToggle
						id="enable-hardware-acceleration"
						label="Aceleración Hardware"
						description="Utiliza aceleración hardware para mejorar el rendimiento"
						checked={imageOptions.performance?.enableHardwareAcceleration}
						onCheckedChange={(checked) => handlePerformanceChange('enableHardwareAcceleration', checked)}
						disabled={disabled}
						icon={<Sliders className="h-3.5 w-3.5 text-muted-foreground" />}
					/>
					<FormToggle
						id="use-raf"
						label="Usar RAF"
						description="Utiliza requestAnimationFrame para las animaciones"
						checked={imageOptions.performance?.useRAF}
						onCheckedChange={(checked) => handlePerformanceChange('useRAF', checked)}
						disabled={disabled}
					/>
				</FormRow>
				<FormRow>
					<FormToggle
						id="batch-updates"
						label="Actualizaciones en Lote"
						description="Agrupa las actualizaciones para mejorar el rendimiento"
						checked={imageOptions.performance?.batchUpdates}
						onCheckedChange={(checked) => handlePerformanceChange('batchUpdates', checked)}
						disabled={disabled}
					/>
				</FormRow>
				<FormRow>
					<FormSlider
						id="throttle-ms"
						label="Throttle (ms)"
						description="Tiempo de throttle para eventos frecuentes"
						value={imageOptions.performance?.throttleMs || 150}
						onValueChange={(value) => handlePerformanceChange('throttleMs', value)}
						min={0}
						max={500}
						step={10}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

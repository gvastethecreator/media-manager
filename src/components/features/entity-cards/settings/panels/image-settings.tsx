'use client';

import { Eye, Settings2, Sliders, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CardOptions } from '../../types/card-settings-types';
import {
	FormGroup,
	FormLayout,
	FormRow,
	FormSection,
	FormSelect,
	FormSlider,
	FormToggle,
	createNestedOptionChangeHandler,
	panelColors,
} from './shared';

// Tipo para las opciones de imagen
interface ImageOptions {
	// Diseño
	enable3DEffect: boolean;
	designSystem?: {
		cornerStyle?: string;
		elevation?: number;
	};

	// Efectos Básicos
	enableHolographicEffect: boolean;
	enableGlowEffect: boolean;
	enableAnimatedBorder: boolean;
	enableLightHalo: boolean;

	// Efectos de Profundidad
	effects?: {
		shadow?: {
			enabled?: boolean;
			color?: string;
			blur?: number;
			spread?: number;
		};
		reflection?: {
			enabled?: boolean;
			opacity?: number;
			blur?: number;
		};
		parallax?: {
			enabled?: boolean;
			intensity?: number;
			perspective?: number;
		};
	};

	// Rendimiento
	performance?: {
		enableHardwareAcceleration?: boolean;
		useRAF?: boolean;
		batchUpdates?: boolean;
		throttleMs?: number;
	};
}

// Sección de Diseño
const DesignSection = ({
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

// Sección de Efectos Básicos
const BasicEffectsSection = ({
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

// Sección de Efectos de Profundidad
const DepthEffectsSection = ({
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

// Sección de Rendimiento
const PerformanceSection = ({
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
						label="Actualizaciones por lotes"
						description="Agrupa actualizaciones para mejorar el rendimiento"
						checked={imageOptions.performance?.batchUpdates}
						onCheckedChange={(checked) => handlePerformanceChange('batchUpdates', checked)}
						disabled={disabled}
					/>
					<FormSlider
						id="throttle-ms"
						label="Tiempo de limitación"
						description="Milisegundos entre actualizaciones"
						value={imageOptions.performance?.throttleMs || 16}
						onValueChange={(value) => handlePerformanceChange('throttleMs', value)}
						min={1}
						max={100}
						step={1}
						unit="ms"
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

export function ImageSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Inicializar opciones de imagen desde las opciones de la tarjeta
	const [imageOptions, setImageOptions] = useState<ImageOptions>({
		enable3DEffect: options.enable3DEffect ?? true,
		designSystem: options.designSystem ?? {
			cornerStyle: 'rounded',
			elevation: 2,
		},
		enableHolographicEffect: options.enableHolographicEffect ?? true,
		enableGlowEffect: options.enableGlowEffect ?? true,
		enableAnimatedBorder: options.enableAnimatedBorder ?? true,
		enableLightHalo: options.enableLightHalo ?? true,
		effects: options.effects ?? {
			shadow: {
				enabled: true,
				color: 'rgba(0,0,0,0.2)',
				blur: 10,
				spread: 5,
			},
			reflection: {
				enabled: true,
				opacity: 0.1,
				blur: 2,
			},
			parallax: {
				enabled: true,
				intensity: 0.1,
				perspective: 1000,
			},
		},
		performance: options.performance ?? {
			enableHardwareAcceleration: true,
			useRAF: true,
			batchUpdates: true,
			throttleMs: 16,
		},
	});

	// Actualizar opciones de imagen cuando cambien las opciones externas
	useEffect(() => {
		setImageOptions({
			enable3DEffect: options.enable3DEffect ?? true,
			designSystem: options.designSystem ?? {
				cornerStyle: 'rounded',
				elevation: 2,
			},
			enableHolographicEffect: options.enableHolographicEffect ?? true,
			enableGlowEffect: options.enableGlowEffect ?? true,
			enableAnimatedBorder: options.enableAnimatedBorder ?? true,
			enableLightHalo: options.enableLightHalo ?? true,
			effects: options.effects ?? {
				shadow: {
					enabled: true,
					color: 'rgba(0,0,0,0.2)',
					blur: 10,
					spread: 5,
				},
				reflection: {
					enabled: true,
					opacity: 0.1,
					blur: 2,
				},
				parallax: {
					enabled: true,
					intensity: 0.1,
					perspective: 1000,
				},
			},
			performance: options.performance ?? {
				enableHardwareAcceleration: true,
				useRAF: true,
				batchUpdates: true,
				throttleMs: 16,
			},
		});
	}, [options]);

	// Manejar cambios en opciones de imagen
	const handleImageChange = (key: keyof ImageOptions, value: unknown) => {
		const updatedImageOptions = {
			...imageOptions,
			[key]: value,
		};

		setImageOptions(updatedImageOptions);

		// Propagar cambios al componente padre
		onChange({
			...options,
			...updatedImageOptions,
		});
	};

	// Manejar cambios en designSystem
	const handleDesignSystemChange = (key: string, value: unknown) => {
		const updatedDesignSystem = {
			...imageOptions.designSystem,
			[key]: value,
		};

		handleImageChange('designSystem', updatedDesignSystem);
	};

	// Manejar cambios en effects
	const handleEffectsChange = (section: string, key: string, value: unknown) => {
		if (!imageOptions.effects) {
			return;
		}

		const updatedEffects = {
			...imageOptions.effects,
			[section]: {
				...imageOptions.effects[section as keyof typeof imageOptions.effects],
				[key]: value,
			},
		};

		handleImageChange('effects', updatedEffects);
	};

	// Manejar cambios en performance
	const handlePerformanceChange = (key: string, value: unknown) => {
		if (!imageOptions.performance) {
			return;
		}

		const updatedPerformance = {
			...imageOptions.performance,
			[key]: value,
		};

		handleImageChange('performance', updatedPerformance);
	};

	return (
		<FormLayout
			title="Configuración de Imagen"
			description="Personaliza la apariencia y comportamiento de imágenes"
			colorScheme="visual"
			variant="colored"
			maxHeight={500}
			tabs={[
				{ value: 'design', label: 'Diseño', icon: <Eye className="h-3.5 w-3.5" /> },
				{ value: 'effects', label: 'Efectos', icon: <Sparkles className="h-3.5 w-3.5" /> },
				{ value: 'advanced', label: 'Avanzado', icon: <Settings2 className="h-3.5 w-3.5" /> },
			]}
		>
			{(tab) =>
				tab === 'design' ? (
					<>
						<DesignSection
							imageOptions={imageOptions}
							handleImageChange={handleImageChange}
							handleDesignSystemChange={handleDesignSystemChange}
							disabled={disabled}
						/>
						<BasicEffectsSection
							imageOptions={imageOptions}
							handleImageChange={handleImageChange}
							disabled={disabled}
						/>
					</>
				) : tab === 'effects' ? (
					<DepthEffectsSection
						imageOptions={imageOptions}
						handleEffectsChange={handleEffectsChange}
						disabled={disabled}
					/>
				) : (
					<PerformanceSection
						imageOptions={imageOptions}
						handlePerformanceChange={handlePerformanceChange}
						disabled={disabled}
					/>
				)
			}
		</FormLayout>
	);
}

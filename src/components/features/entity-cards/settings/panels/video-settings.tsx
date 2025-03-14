'use client';

import { Eye, Film, Settings2, Sliders, Sparkles, Video } from 'lucide-react';
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

// Tipo para las opciones de video
interface VideoOptions {
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

	// Específico para Video
	videoAutoplay?: boolean;
	videoLoop?: boolean;
	videoMuted?: boolean;
	videoControls?: boolean;
	videoPlaybackRate?: number;
}

// Sección de Diseño
const DesignSection = ({
	videoOptions,
	handleVideoChange,
	handleDesignSystemChange,
	disabled,
}: {
	videoOptions: VideoOptions;
	handleVideoChange: (key: keyof VideoOptions, value: unknown) => void;
	handleDesignSystemChange: (key: string, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection title="Diseño" description="Configuración general del aspecto del video" colorScheme="design">
			<FormGroup>
				<FormRow>
					<FormToggle
						id="enable-3d-effect"
						label="Efecto 3D"
						description="Activa el efecto tridimensional para el video"
						checked={videoOptions.enable3DEffect}
						onCheckedChange={(checked) => handleVideoChange('enable3DEffect', checked)}
						disabled={disabled}
						icon={<Film className="h-3.5 w-3.5 text-muted-foreground" />}
					/>
					<FormToggle
						id="rounded-corners"
						label="Esquinas redondeadas"
						description="Aplica esquinas redondeadas al video"
						checked={videoOptions.designSystem?.cornerStyle === 'rounded'}
						onCheckedChange={(checked) => handleDesignSystemChange('cornerStyle', checked ? 'rounded' : 'sharp')}
						disabled={disabled}
					/>
				</FormRow>
				<FormRow>
					<FormSlider
						id="elevation"
						label="Elevación"
						description="Nivel de elevación del video"
						value={videoOptions.designSystem?.elevation || 0}
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
	videoOptions,
	handleVideoChange,
	disabled,
}: {
	videoOptions: VideoOptions;
	handleVideoChange: (key: keyof VideoOptions, value: unknown) => void;
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
						description="Aplica un efecto holográfico al video"
						checked={videoOptions.enableHolographicEffect}
						onCheckedChange={(checked) => handleVideoChange('enableHolographicEffect', checked)}
						disabled={disabled}
						icon={<Sparkles className="h-3.5 w-3.5 text-muted-foreground" />}
					/>
					<FormToggle
						id="enable-glow"
						label="Brillo"
						description="Añade un efecto de brillo alrededor del video"
						checked={videoOptions.enableGlowEffect}
						onCheckedChange={(checked) => handleVideoChange('enableGlowEffect', checked)}
						disabled={disabled}
					/>
				</FormRow>
				<FormRow>
					<FormToggle
						id="enable-animated-border"
						label="Borde Animado"
						description="Añade un borde con animación"
						checked={videoOptions.enableAnimatedBorder}
						onCheckedChange={(checked) => handleVideoChange('enableAnimatedBorder', checked)}
						disabled={disabled}
					/>
					<FormToggle
						id="enable-light-halo"
						label="Halo de Luz"
						description="Crea un halo luminoso alrededor del video"
						checked={videoOptions.enableLightHalo}
						onCheckedChange={(checked) => handleVideoChange('enableLightHalo', checked)}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

// Sección de Efectos de Profundidad
const DepthEffectsSection = ({
	videoOptions,
	handleEffectsChange,
	disabled,
}: {
	videoOptions: VideoOptions;
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
						description="Añade sombra al video"
						checked={videoOptions.effects?.shadow?.enabled}
						onCheckedChange={(checked) => handleEffectsChange('shadow', 'enabled', checked)}
						disabled={disabled}
					/>
					<FormToggle
						id="enable-reflection"
						label="Reflexión"
						description="Añade un efecto de reflexión"
						checked={videoOptions.effects?.reflection?.enabled}
						onCheckedChange={(checked) => handleEffectsChange('reflection', 'enabled', checked)}
						disabled={disabled}
					/>
				</FormRow>
				<FormRow>
					<FormToggle
						id="enable-parallax"
						label="Parallax"
						description="Añade efecto de parallax al mover el video"
						checked={videoOptions.effects?.parallax?.enabled}
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
	videoOptions,
	handlePerformanceChange,
	disabled,
}: {
	videoOptions: VideoOptions;
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
						checked={videoOptions.performance?.enableHardwareAcceleration}
						onCheckedChange={(checked) => handlePerformanceChange('enableHardwareAcceleration', checked)}
						disabled={disabled}
						icon={<Sliders className="h-3.5 w-3.5 text-muted-foreground" />}
					/>
					<FormToggle
						id="use-raf"
						label="Usar RAF"
						description="Utiliza requestAnimationFrame para las animaciones"
						checked={videoOptions.performance?.useRAF}
						onCheckedChange={(checked) => handlePerformanceChange('useRAF', checked)}
						disabled={disabled}
					/>
				</FormRow>
				<FormRow>
					<FormToggle
						id="batch-updates"
						label="Actualizaciones por lotes"
						description="Agrupa actualizaciones para mejorar el rendimiento"
						checked={videoOptions.performance?.batchUpdates}
						onCheckedChange={(checked) => handlePerformanceChange('batchUpdates', checked)}
						disabled={disabled}
					/>
					<FormSlider
						id="throttle-ms"
						label="Tiempo de limitación"
						description="Milisegundos entre actualizaciones"
						value={videoOptions.performance?.throttleMs || 16}
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

// Sección de Control de Video
const VideoControlSection = ({
	videoOptions,
	handleVideoChange,
	disabled,
}: {
	videoOptions: VideoOptions;
	handleVideoChange: (key: keyof VideoOptions, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Control de Video"
			description="Opciones para controlar la reproducción del video"
			colorScheme="visual"
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="video-autoplay"
						label="Reproducción automática"
						description="Inicia la reproducción automáticamente"
						checked={videoOptions.videoAutoplay}
						onCheckedChange={(checked) => handleVideoChange('videoAutoplay', checked)}
						disabled={disabled}
					/>
					<FormToggle
						id="video-loop"
						label="Bucle"
						description="Reproduce el video en bucle continuo"
						checked={videoOptions.videoLoop}
						onCheckedChange={(checked) => handleVideoChange('videoLoop', checked)}
						disabled={disabled}
					/>
				</FormRow>
				<FormRow>
					<FormToggle
						id="video-muted"
						label="Silenciado"
						description="Reproduce el video sin sonido"
						checked={videoOptions.videoMuted}
						onCheckedChange={(checked) => handleVideoChange('videoMuted', checked)}
						disabled={disabled}
					/>
					<FormToggle
						id="video-controls"
						label="Mostrar controles"
						description="Muestra los controles de reproducción"
						checked={videoOptions.videoControls}
						onCheckedChange={(checked) => handleVideoChange('videoControls', checked)}
						disabled={disabled}
					/>
				</FormRow>
				<FormRow cols={1}>
					<FormSlider
						id="video-playback-rate"
						label="Velocidad de reproducción"
						description="Ajusta la velocidad de reproducción del video"
						value={videoOptions.videoPlaybackRate || 1}
						onValueChange={(value) => handleVideoChange('videoPlaybackRate', value)}
						min={0.25}
						max={2}
						step={0.25}
						unit="x"
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

export function VideoSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Inicializar opciones de video desde las opciones de la tarjeta
	const [videoOptions, setVideoOptions] = useState<VideoOptions>({
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
		videoAutoplay: options.videoAutoplay ?? false,
		videoLoop: options.videoLoop ?? true,
		videoMuted: options.videoMuted ?? true,
		videoControls: options.videoControls ?? false,
		videoPlaybackRate: options.videoPlaybackRate ?? 1,
	});

	// Actualizar opciones de video cuando cambien las opciones externas
	useEffect(() => {
		setVideoOptions({
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
			videoAutoplay: options.videoAutoplay ?? false,
			videoLoop: options.videoLoop ?? true,
			videoMuted: options.videoMuted ?? true,
			videoControls: options.videoControls ?? false,
			videoPlaybackRate: options.videoPlaybackRate ?? 1,
		});
	}, [options]);

	// Manejar cambios en opciones de video
	const handleVideoChange = (key: keyof VideoOptions, value: unknown) => {
		const updatedVideoOptions = {
			...videoOptions,
			[key]: value,
		};

		setVideoOptions(updatedVideoOptions);

		// Propagar cambios al componente padre
		onChange({
			...options,
			...updatedVideoOptions,
		});
	};

	// Manejar cambios en designSystem
	const handleDesignSystemChange = (key: string, value: unknown) => {
		const updatedDesignSystem = {
			...videoOptions.designSystem,
			[key]: value,
		};

		handleVideoChange('designSystem', updatedDesignSystem);
	};

	// Manejar cambios en effects
	const handleEffectsChange = (section: string, key: string, value: unknown) => {
		if (!videoOptions.effects) {
			return;
		}

		const updatedEffects = {
			...videoOptions.effects,
			[section]: {
				...videoOptions.effects[section as keyof typeof videoOptions.effects],
				[key]: value,
			},
		};

		handleVideoChange('effects', updatedEffects);
	};

	// Manejar cambios en performance
	const handlePerformanceChange = (key: string, value: unknown) => {
		if (!videoOptions.performance) {
			return;
		}

		const updatedPerformance = {
			...videoOptions.performance,
			[key]: value,
		};

		handleVideoChange('performance', updatedPerformance);
	};

	return (
		<FormLayout
			title="Configuración de Video"
			description="Personaliza la apariencia y comportamiento de videos"
			colorScheme="visual"
			variant="colored"
			maxHeight={500}
			tabs={[
				{ value: 'design', label: 'Diseño', icon: <Eye className="h-3.5 w-3.5" /> },
				{ value: 'video', label: 'Video', icon: <Video className="h-3.5 w-3.5" /> },
				{ value: 'effects', label: 'Efectos', icon: <Sparkles className="h-3.5 w-3.5" /> },
				{ value: 'advanced', label: 'Avanzado', icon: <Settings2 className="h-3.5 w-3.5" /> },
			]}
		>
			{(tab) =>
				tab === 'design' ? (
					<>
						<DesignSection
							videoOptions={videoOptions}
							handleVideoChange={handleVideoChange}
							handleDesignSystemChange={handleDesignSystemChange}
							disabled={disabled}
						/>
						<BasicEffectsSection
							videoOptions={videoOptions}
							handleVideoChange={handleVideoChange}
							disabled={disabled}
						/>
					</>
				) : tab === 'video' ? (
					<VideoControlSection videoOptions={videoOptions} handleVideoChange={handleVideoChange} disabled={disabled} />
				) : tab === 'effects' ? (
					<DepthEffectsSection
						videoOptions={videoOptions}
						handleEffectsChange={handleEffectsChange}
						disabled={disabled}
					/>
				) : (
					<PerformanceSection
						videoOptions={videoOptions}
						handlePerformanceChange={handlePerformanceChange}
						disabled={disabled}
					/>
				)
			}
		</FormLayout>
	);
}

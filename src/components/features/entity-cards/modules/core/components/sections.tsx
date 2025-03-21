'use client';

import { FormGroup, FormRow, FormSection, FormSelect, FormSlider, FormToggle } from '@/components/features/entity-cards/settings-old/panels/shared';
import { Cpu, Layers3, MousePointer, Smile, SpeakerIcon } from 'lucide-react';
import {
	type CoreOptions,
	INTERACTIVE_MODE_OPTIONS,
	POINTER_PRECISION_OPTIONS,
	TOUCH_BEHAVIOR_OPTIONS,
} from '../types';

/**
 * Tipo para props comunes de secciones
 */
type SectionProps = {
	coreOptions: CoreOptions;
	handleCoreChange: <K extends keyof CoreOptions>(key: K, value: CoreOptions[K]) => void;
	disabled?: boolean;
};

/**
 * 📦 Sección de Interactividad
 */
export const InteractivitySection = ({ coreOptions, handleCoreChange, disabled }: SectionProps) => {
	return (
		<FormSection
			title="Interactividad"
			description="Configura cómo responde la tarjeta a las interacciones del usuario"
			colorScheme="advanced"
		>
			<FormGroup>
				<FormRow>
					<FormSelect
						id="interactive-mode"
						label="Modo interactivo"
						description="Define cómo se activa la interactividad de la tarjeta"
						value={coreOptions.interactiveMode || 'hover'}
						onValueChange={(value) => handleCoreChange('interactiveMode', value)}
						disabled={disabled}
						icon={<MousePointer className="h-3.5 w-3.5 text-muted-foreground" />}
						options={INTERACTIVE_MODE_OPTIONS}
					/>
					<FormSlider
						id="hover-delay"
						label="Retraso de hover"
						description="Milisegundos de retraso antes de activar el efecto hover"
						value={coreOptions.hoverDelay || 100}
						onValueChange={(value) => handleCoreChange('hoverDelay', value)}
						min={0}
						max={500}
						step={10}
						unit="ms"
						disabled={disabled || coreOptions.interactiveMode === 'none'}
					/>
				</FormRow>
				<FormRow>
					<FormSelect
						id="touch-behavior"
						label="Comportamiento táctil"
						description="Define cómo responde la tarjeta en dispositivos táctiles"
						value={coreOptions.touchBehavior || 'tap'}
						onValueChange={(value) => handleCoreChange('touchBehavior', value)}
						disabled={disabled}
						options={TOUCH_BEHAVIOR_OPTIONS}
					/>
					<FormSelect
						id="pointer-precision"
						label="Precisión del puntero"
						description="Define la precisión requerida para la interacción"
						value={coreOptions.pointerPrecision || 'medium'}
						onValueChange={(value) => handleCoreChange('pointerPrecision', value)}
						disabled={disabled}
						options={POINTER_PRECISION_OPTIONS}
					/>
				</FormRow>
				<FormRow cols={1}>
					<FormToggle
						id="motion-reduction"
						label="Reducción de movimiento"
						description="Activa el modo de reducción de movimiento para mayor accesibilidad"
						checked={coreOptions.motionReduction || false}
						onCheckedChange={(checked) => handleCoreChange('motionReduction', checked)}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

/**
 * 📦 Sección de Rendimiento
 */
export const PerformanceSection = ({ coreOptions, handleCoreChange, disabled }: SectionProps) => {
	return (
		<FormSection
			title="Rendimiento"
			description="Opciones relacionadas con el rendimiento del sistema"
			colorScheme="system"
			icon={<Cpu className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow>
					<FormSelect
						id="performance-mode"
						label="Modo de rendimiento"
						description="Define el equilibrio entre calidad y rendimiento"
						value={coreOptions.performanceMode || 'balanced'}
						onValueChange={(value) => handleCoreChange('performanceMode', value)}
						disabled={disabled}
						options={[
							{ value: 'quality', label: 'Calidad' },
							{ value: 'balanced', label: 'Equilibrado' },
							{ value: 'performance', label: 'Rendimiento' },
						]}
					/>
					<FormToggle
						id="enable-cache"
						label="Habilitar caché"
						description="Activa el sistema de caché para mejorar el rendimiento"
						checked={coreOptions.enableCache || false}
						onCheckedChange={(checked) => handleCoreChange('enableCache', checked)}
						disabled={disabled}
					/>
				</FormRow>
				<FormRow>
					<FormSelect
						id="loading-strategy"
						label="Estrategia de carga"
						description="Define cómo se cargan los recursos"
						value={coreOptions.loadingStrategy || 'progressive'}
						onValueChange={(value) => handleCoreChange('loadingStrategy', value)}
						disabled={disabled}
						options={[
							{ value: 'eager', label: 'Inmediata' },
							{ value: 'progressive', label: 'Progresiva' },
							{ value: 'lazy', label: 'Perezosa' },
						]}
					/>
					<FormToggle
						id="enable-preloading"
						label="Habilitar precarga"
						description="Activa la precarga de recursos para mejorar la velocidad"
						checked={coreOptions.enablePreloading || false}
						onCheckedChange={(checked) => handleCoreChange('enablePreloading', checked)}
						disabled={disabled}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

/**
 * 📦 Sección de Retroalimentación
 */
export const FeedbackSection = ({ coreOptions, handleCoreChange, disabled }: SectionProps) => {
	return (
		<FormSection
			title="Retroalimentación"
			description="Opciones relacionadas con la retroalimentación táctil y auditiva"
			colorScheme="system"
		>
			<FormGroup>
				<FormRow>
					<FormToggle
						id="enable-haptics"
						label="Habilitar hápticos"
						description="Activa la retroalimentación táctil"
						checked={coreOptions.enableHaptics || false}
						onCheckedChange={(checked) => handleCoreChange('enableHaptics', checked)}
						disabled={disabled}
						icon={<Smile className="h-3.5 w-3.5 text-muted-foreground" />}
					/>
					<FormSlider
						id="haptic-intensity"
						label="Intensidad háptica"
						description="Define la intensidad de la retroalimentación táctil"
						value={coreOptions.hapticIntensity || 0.5}
						onValueChange={(value) => handleCoreChange('hapticIntensity', value)}
						min={0}
						max={1}
						step={0.1}
						disabled={disabled || !coreOptions.enableHaptics}
					/>
				</FormRow>
				<FormRow>
					<FormToggle
						id="enable-sounds"
						label="Habilitar sonidos"
						description="Activa la retroalimentación auditiva"
						checked={coreOptions.enableSounds || false}
						onCheckedChange={(checked) => handleCoreChange('enableSounds', checked)}
						disabled={disabled}
						icon={<SpeakerIcon className="h-3.5 w-3.5 text-muted-foreground" />}
					/>
					<FormSlider
						id="sound-volume"
						label="Volumen"
						description="Define el volumen de los sonidos"
						value={coreOptions.soundVolume || 0.5}
						onValueChange={(value) => handleCoreChange('soundVolume', value)}
						min={0}
						max={1}
						step={0.1}
						disabled={disabled || !coreOptions.enableSounds}
					/>
				</FormRow>
				<FormRow cols={1}>
					<FormSelect
						id="sound-theme"
						label="Tema de sonidos"
						description="Define el conjunto de sonidos a utilizar"
						value={coreOptions.soundTheme || 'minimal'}
						onValueChange={(value) => handleCoreChange('soundTheme', value)}
						disabled={disabled || !coreOptions.enableSounds}
						options={[
							{ value: 'minimal', label: 'Minimalista' },
							{ value: 'classic', label: 'Clásico' },
							{ value: 'modern', label: 'Moderno' },
							{ value: 'game', label: 'Juego' },
						]}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

/**
 * 📦 Sección de Contenido
 */
export const ContentSection = ({ coreOptions, handleCoreChange, disabled }: SectionProps) => {
	return (
		<FormSection
			title="Contenido"
			description="Opciones relacionadas con la disposición y presentación del contenido"
			colorScheme="design"
			icon={<Layers3 className="h-3.5 w-3.5 text-muted-foreground" />}
		>
			<FormGroup>
				<FormRow>
					<FormSelect
						id="content-arrangement"
						label="Disposición de contenido"
						description="Define cómo se organiza el contenido en la tarjeta"
						value={coreOptions.contentArrangement || 'standard'}
						onValueChange={(value) => handleCoreChange('contentArrangement', value)}
						disabled={disabled}
						options={[
							{ value: 'standard', label: 'Estándar' },
							{ value: 'compact', label: 'Compacto' },
							{ value: 'expanded', label: 'Expandido' },
							{ value: 'custom', label: 'Personalizado' },
						]}
					/>
					<FormToggle
						id="enable-auto-height"
						label="Altura automática"
						description="Ajusta automáticamente la altura según el contenido"
						checked={coreOptions.enableAutoHeight || true}
						onCheckedChange={(checked) => handleCoreChange('enableAutoHeight', checked)}
						disabled={disabled}
					/>
				</FormRow>
				<FormRow>
					<FormSlider
						id="max-lines"
						label="Líneas máximas"
						description="Número máximo de líneas para textos"
						value={coreOptions.maxLines || 3}
						onValueChange={(value) => handleCoreChange('maxLines', value)}
						min={1}
						max={10}
						step={1}
						disabled={disabled}
					/>
					<FormSelect
						id="text-truncation"
						label="Truncamiento de texto"
						description="Define cómo se truncan los textos largos"
						value={coreOptions.textTruncation || 'ellipsis'}
						onValueChange={(value) => handleCoreChange('textTruncation', value)}
						disabled={disabled}
						options={[
							{ value: 'ellipsis', label: 'Elipsis' },
							{ value: 'fade', label: 'Desvanecer' },
							{ value: 'clip', label: 'Recortar' },
						]}
					/>
				</FormRow>
				<FormRow cols={1}>
					<FormSelect
						id="media-fit"
						label="Ajuste de medios"
						description="Define cómo se ajustan las imágenes y videos"
						value={coreOptions.mediaFit || 'cover'}
						onValueChange={(value) => handleCoreChange('mediaFit', value)}
						disabled={disabled}
						options={[
							{ value: 'cover', label: 'Cubrir' },
							{ value: 'contain', label: 'Contener' },
							{ value: 'fill', label: 'Llenar' },
							{ value: 'scale-down', label: 'Escalar abajo' },
						]}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

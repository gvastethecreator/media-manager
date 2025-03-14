'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { Cpu, Layers3, MousePointerSquare, Settings2, Smile, SpeakerIcon, Wand2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CardOptions } from '../types';
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

// Tipo para las opciones de core
interface CoreOptions {
	enabled: boolean;
	layerSystem?: {
		order?: string[];
		layerBlending?: string;
		layerSpacing?: number;
	};
	interactiveMode?: string;
	hoverDelay?: number;
	touchBehavior?: string;
	pointerPrecision?: string;
	motionReduction?: boolean;
	performanceMode?: string;
	enableCache?: boolean;
	loadingStrategy?: string;
	enablePreloading?: boolean;
	enableHaptics?: boolean;
	hapticIntensity?: number;
	enableSounds?: boolean;
	soundVolume?: number;
	soundTheme?: string;
	contentArrangement?: string;
	enableAutoHeight?: boolean;
	maxLines?: number;
	textTruncation?: string;
	mediaFit?: string;
}

// Refactorizar sección de interactividad
const InteractivitySection = ({
	coreOptions,
	handleCoreChange,
	disabled,
}: {
	coreOptions: CoreOptions;
	handleCoreChange: (key: keyof CoreOptions, value: unknown) => void;
	disabled?: boolean;
}) => {
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
						icon={<MousePointerSquare className="h-3.5 w-3.5 text-muted-foreground" />}
						options={[
							{ value: 'hover', label: 'Hover' },
							{ value: 'click', label: 'Click' },
							{ value: 'both', label: 'Ambos' },
							{ value: 'none', label: 'Ninguno' },
						]}
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
						options={[
							{ value: 'tap', label: 'Tap' },
							{ value: 'press', label: 'Press' },
							{ value: 'double-tap', label: 'Double Tap' },
						]}
					/>
					<FormSelect
						id="pointer-precision"
						label="Precisión del puntero"
						description="Define la precisión requerida para la interacción"
						value={coreOptions.pointerPrecision || 'medium'}
						onValueChange={(value) => handleCoreChange('pointerPrecision', value)}
						disabled={disabled}
						options={[
							{ value: 'low', label: 'Baja' },
							{ value: 'medium', label: 'Media' },
							{ value: 'high', label: 'Alta' },
						]}
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

export function CoreSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Inicializar core options desde las opciones de la tarjeta o con valores predeterminados
	const [coreOptions, setCoreOptions] = useState<CoreOptions>({
		enabled: options.core?.enabled ?? false,
		layerSystem: options.core?.layerSystem ?? {
			order: ['background', 'content', 'effects', 'holographic', 'border', 'filter'],
			layerBlending: 'screen',
			layerSpacing: 2,
		},
		interactiveMode: options.core?.interactiveMode ?? 'hover',
		hoverDelay: options.core?.hoverDelay ?? 100,
		touchBehavior: options.core?.touchBehavior ?? 'tap',
		pointerPrecision: options.core?.pointerPrecision ?? 'medium',
		motionReduction: options.core?.motionReduction ?? false,
		performanceMode: options.core?.performanceMode ?? 'balanced',
		enableCache: options.core?.enableCache ?? true,
		loadingStrategy: options.core?.loadingStrategy ?? 'progressive',
		enablePreloading: options.core?.enablePreloading ?? true,
		enableHaptics: options.core?.enableHaptics ?? false,
		hapticIntensity: options.core?.hapticIntensity ?? 0.5,
		enableSounds: options.core?.enableSounds ?? false,
		soundVolume: options.core?.soundVolume ?? 0.5,
		soundTheme: options.core?.soundTheme ?? 'minimal',
		contentArrangement: options.core?.contentArrangement ?? 'standard',
		enableAutoHeight: options.core?.enableAutoHeight ?? true,
		maxLines: options.core?.maxLines ?? undefined,
		textTruncation: options.core?.textTruncation ?? 'ellipsis',
		mediaFit: options.core?.mediaFit ?? 'cover',
	});

	// Actualizar core options cuando cambien las opciones externas
	useEffect(() => {
		if (options.core) {
			setCoreOptions((prev) => ({
				...prev,
				...options.core,
			}));
		}
	}, [options.core]);

	// Manejar cambios en opciones de core
	const handleCoreChange = (key: keyof CoreOptions, value: unknown) => {
		let updatedCoreOptions: CoreOptions;

		if (key === 'layerSystem' && typeof value === 'object') {
			// Caso especial para layerSystem que es un objeto
			updatedCoreOptions = {
				...coreOptions,
				layerSystem: {
					...coreOptions.layerSystem,
					...value,
				},
			};
		} else {
			// Caso general para propiedades simples
			updatedCoreOptions = {
				...coreOptions,
				[key]: value,
			};
		}

		setCoreOptions(updatedCoreOptions);

		// Propagar cambios al componente padre
		onChange({
			...options,
			core: updatedCoreOptions,
		});
	};

	// Manejar cambios en propiedades anidadas de layerSystem
	const _handleLayerSystemChange = (key: string, value: unknown) => {
		const updatedLayerSystem = {
			...coreOptions.layerSystem,
			[key]: value,
		};

		handleCoreChange('layerSystem', updatedLayerSystem);
	};

	return (
		<FormLayout
			title="Configuración del Núcleo"
			description="Ajustes fundamentales del sistema de tarjetas"
			colorScheme="system"
			variant="colored"
			maxHeight={500}
		>
			<FormToggle
				id="core-enabled"
				label="Habilitar configuración del núcleo"
				description="Activa o desactiva todas las características del núcleo"
				checked={coreOptions.enabled}
				onCheckedChange={(checked) => handleCoreChange('enabled', checked)}
				disabled={disabled}
				icon={<Settings2 className="h-3.5 w-3.5 text-muted-foreground" />}
			/>

			{coreOptions.enabled && (
				<div className="mt-4 space-y-6">
					<InteractivitySection coreOptions={coreOptions} handleCoreChange={handleCoreChange} disabled={disabled} />

					{/* Mantener el resto del código original o refactorizarlo según sea necesario */}
				</div>
			)}
		</FormLayout>
	);
}

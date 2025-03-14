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
import {
	BoxIcon,
	FileStackIcon,
	FlipHorizontalIcon,
	InfoIcon,
	LayoutIcon,
	MessageSquareIcon,
	MouseIcon,
	PaletteIcon,
	RectangleHorizontalIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CardOptions } from '../types';
import {
	FormGroup,
	FormInput,
	FormLayout,
	FormRow,
	FormSection,
	FormSelect,
	FormSlider,
	FormToggle,
	createNestedOptionChangeHandler,
	panelColors,
} from './shared';

// Tipo para las opciones de backside
interface BacksideOptions {
	enabled: boolean;
	layoutType?: string;
	colorMode?: string;
	customColor?: string;
	opacity?: number;
	blurBackground?: boolean;
	blurAmount?: number;
	showAttributes?: boolean;
	showDescription?: boolean;
	showStats?: boolean;
	showMetadata?: boolean;
	showRelations?: boolean;
	maxDescriptionLength?: number;
	flipAnimation?: string;
	flipDuration?: number;
	enableAutoFlip?: boolean;
	autoFlipDelay?: number;
	flipTrigger?: string;
	headingStyle?: string;
	infoStyle?: string;
	separatorStyle?: string;
}

// Componente de sección para la configuración de diseño
const DesignSection = ({
	backsideOptions,
	handleBacksideChange,
	disabled,
}: {
	backsideOptions: BacksideOptions;
	handleBacksideChange: (key: keyof BacksideOptions, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Diseño y Estilo"
			description="Configura la apariencia visual de la cara posterior"
			colorScheme="design"
		>
			<FormGroup>
				<FormRow>
					<FormSelect
						id="layout-type"
						label="Tipo de Layout"
						description="Define la estructura general de la cara posterior"
						value={backsideOptions.layoutType || 'standard'}
						onValueChange={(value) => handleBacksideChange('layoutType', value)}
						disabled={disabled}
						icon={<LayoutIcon className="h-3.5 w-3.5 text-muted-foreground" />}
						options={[
							{ value: 'standard', label: 'Estándar' },
							{ value: 'tabbed', label: 'Pestañas' },
							{ value: 'grid', label: 'Cuadrícula' },
							{ value: 'minimal', label: 'Minimalista' },
						]}
					/>
					<FormSelect
						id="color-mode"
						label="Modo de Color"
						description="Define cómo se aplican los colores a la cara posterior"
						value={backsideOptions.colorMode || 'inherit'}
						onValueChange={(value) => handleBacksideChange('colorMode', value)}
						disabled={disabled}
						icon={<PaletteIcon className="h-3.5 w-3.5 text-muted-foreground" />}
						options={[
							{ value: 'inherit', label: 'Heredar' },
							{ value: 'custom', label: 'Personalizado' },
							{ value: 'reverse', label: 'Invertido' },
							{ value: 'contrast', label: 'Contraste' },
						]}
					/>
				</FormRow>

				{backsideOptions.colorMode === 'custom' && (
					<FormRow>
						<FormInput
							id="custom-color"
							label="Color Personalizado"
							description="Define un color personalizado para la cara posterior"
							value={backsideOptions.customColor || '#000000'}
							onChange={(value) => handleBacksideChange('customColor', value)}
							disabled={disabled}
							type="color"
						/>
					</FormRow>
				)}

				<FormRow>
					<FormSlider
						id="opacity"
						label="Opacidad"
						description="Define la opacidad de la cara posterior"
						value={backsideOptions.opacity !== undefined ? backsideOptions.opacity * 100 : 95}
						onValueChange={(value) => handleBacksideChange('opacity', value / 100)}
						min={20}
						max={100}
						step={1}
						unit="%"
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormToggle
						id="blur-background"
						label="Fondo Difuminado"
						description="Aplica un efecto de desenfoque al fondo de la cara posterior"
						checked={backsideOptions.blurBackground !== undefined ? backsideOptions.blurBackground : true}
						onCheckedChange={(checked) => handleBacksideChange('blurBackground', checked)}
						disabled={disabled}
					/>
				</FormRow>

				{backsideOptions.blurBackground && (
					<FormRow>
						<FormSlider
							id="blur-amount"
							label="Cantidad de Desenfoque"
							description="Define la intensidad del desenfoque de fondo"
							value={backsideOptions.blurAmount || 10}
							onValueChange={(value) => handleBacksideChange('blurAmount', value)}
							min={0}
							max={30}
							step={1}
							unit="px"
							disabled={disabled}
						/>
					</FormRow>
				)}
			</FormGroup>
		</FormSection>
	);
};

// Componente de sección para la configuración de contenido
const ContentSection = ({
	backsideOptions,
	handleBacksideChange,
	disabled,
}: {
	backsideOptions: BacksideOptions;
	handleBacksideChange: (key: keyof BacksideOptions, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Contenido"
			description="Configura qué información se muestra en la cara posterior"
			colorScheme="advanced"
		>
			<FormGroup>
				<FormRow cols={2}>
					<FormToggle
						id="show-attributes"
						label="Mostrar Atributos"
						checked={backsideOptions.showAttributes !== undefined ? backsideOptions.showAttributes : true}
						onCheckedChange={(checked) => handleBacksideChange('showAttributes', checked)}
						disabled={disabled}
						icon={<InfoIcon className="h-3.5 w-3.5 text-muted-foreground" />}
					/>
					<FormToggle
						id="show-description"
						label="Mostrar Descripción"
						checked={backsideOptions.showDescription !== undefined ? backsideOptions.showDescription : true}
						onCheckedChange={(checked) => handleBacksideChange('showDescription', checked)}
						disabled={disabled}
						icon={<MessageSquareIcon className="h-3.5 w-3.5 text-muted-foreground" />}
					/>
				</FormRow>

				<FormRow cols={2}>
					<FormToggle
						id="show-stats"
						label="Mostrar Estadísticas"
						checked={backsideOptions.showStats !== undefined ? backsideOptions.showStats : true}
						onCheckedChange={(checked) => handleBacksideChange('showStats', checked)}
						disabled={disabled}
						icon={<FileStackIcon className="h-3.5 w-3.5 text-muted-foreground" />}
					/>
					<FormToggle
						id="show-metadata"
						label="Mostrar Metadatos"
						checked={backsideOptions.showMetadata !== undefined ? backsideOptions.showMetadata : true}
						onCheckedChange={(checked) => handleBacksideChange('showMetadata', checked)}
						disabled={disabled}
						icon={<BoxIcon className="h-3.5 w-3.5 text-muted-foreground" />}
					/>
				</FormRow>

				<FormRow cols={1}>
					<FormToggle
						id="show-relations"
						label="Mostrar Relaciones"
						checked={backsideOptions.showRelations !== undefined ? backsideOptions.showRelations : false}
						onCheckedChange={(checked) => handleBacksideChange('showRelations', checked)}
						disabled={disabled}
					/>
				</FormRow>

				{backsideOptions.showDescription && (
					<FormRow>
						<FormInput
							id="max-description-length"
							label="Longitud Máxima de Descripción"
							description="Número máximo de caracteres para la descripción"
							value={String(backsideOptions.maxDescriptionLength || 300)}
							onChange={(value) => handleBacksideChange('maxDescriptionLength', Number.parseInt(value) || 300)}
							disabled={disabled}
							type="number"
						/>
					</FormRow>
				)}
			</FormGroup>
		</FormSection>
	);
};

// Componente de sección para la configuración de interacción
const InteractionSection = ({
	backsideOptions,
	handleBacksideChange,
	disabled,
}: {
	backsideOptions: BacksideOptions;
	handleBacksideChange: (key: keyof BacksideOptions, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Interacción"
			description="Configura cómo el usuario interactúa con la cara posterior"
			colorScheme="states"
		>
			<FormGroup>
				<FormRow>
					<FormSelect
						id="flip-animation"
						label="Animación de Volteo"
						description="Define el tipo de animación al mostrar la cara posterior"
						value={backsideOptions.flipAnimation || 'rotate'}
						onValueChange={(value) => handleBacksideChange('flipAnimation', value)}
						disabled={disabled}
						icon={<FlipHorizontalIcon className="h-3.5 w-3.5 text-muted-foreground" />}
						options={[
							{ value: 'rotate', label: 'Rotación' },
							{ value: 'fade', label: 'Desvanecer' },
							{ value: 'flip3d', label: 'Volteo 3D' },
							{ value: 'slide', label: 'Deslizar' },
						]}
					/>
					<FormSlider
						id="flip-duration"
						label="Duración de Animación"
						description="Duración de la animación de volteo en milisegundos"
						value={backsideOptions.flipDuration || 600}
						onValueChange={(value) => handleBacksideChange('flipDuration', value)}
						min={200}
						max={2000}
						step={50}
						unit="ms"
						disabled={disabled}
					/>
				</FormRow>

				<FormRow cols={2}>
					<FormToggle
						id="enable-auto-flip"
						label="Volteo Automático"
						description="Activa el volteo automático de la tarjeta"
						checked={backsideOptions.enableAutoFlip !== undefined ? backsideOptions.enableAutoFlip : false}
						onCheckedChange={(checked) => handleBacksideChange('enableAutoFlip', checked)}
						disabled={disabled}
						icon={<MouseIcon className="h-3.5 w-3.5 text-muted-foreground" />}
					/>

					{backsideOptions.enableAutoFlip && (
						<FormSlider
							id="auto-flip-delay"
							label="Retraso de Volteo"
							description="Tiempo antes del volteo automático en milisegundos"
							value={backsideOptions.autoFlipDelay || 3000}
							onValueChange={(value) => handleBacksideChange('autoFlipDelay', value)}
							min={1000}
							max={10000}
							step={500}
							unit="ms"
							disabled={disabled}
						/>
					)}
				</FormRow>

				<FormRow>
					<FormSelect
						id="flip-trigger"
						label="Disparador de Volteo"
						description="Define qué acción activa el volteo de la tarjeta"
						value={backsideOptions.flipTrigger || 'click'}
						onValueChange={(value) => handleBacksideChange('flipTrigger', value)}
						disabled={disabled}
						options={[
							{ value: 'click', label: 'Click' },
							{ value: 'hover', label: 'Hover' },
							{ value: 'doubleClick', label: 'Doble Click' },
						]}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

// Componente de sección para la configuración de estilo UI
const UIStyleSection = ({
	backsideOptions,
	handleBacksideChange,
	disabled,
}: {
	backsideOptions: BacksideOptions;
	handleBacksideChange: (key: keyof BacksideOptions, value: unknown) => void;
	disabled?: boolean;
}) => {
	return (
		<FormSection
			title="Estilo UI"
			description="Configura el estilo visual de los elementos de interfaz"
			colorScheme="design"
			withSeparator={false}
		>
			<FormGroup>
				<FormRow>
					<FormSelect
						id="heading-style"
						label="Estilo de Encabezados"
						value={backsideOptions.headingStyle || 'default'}
						onValueChange={(value) => handleBacksideChange('headingStyle', value)}
						disabled={disabled}
						options={[
							{ value: 'default', label: 'Predeterminado' },
							{ value: 'large', label: 'Grande' },
							{ value: 'subtle', label: 'Sutil' },
							{ value: 'accent', label: 'Acentuado' },
						]}
					/>
					<FormSelect
						id="info-style"
						label="Estilo de Información"
						value={backsideOptions.infoStyle || 'default'}
						onValueChange={(value) => handleBacksideChange('infoStyle', value)}
						disabled={disabled}
						options={[
							{ value: 'default', label: 'Predeterminado' },
							{ value: 'pills', label: 'Píldoras' },
							{ value: 'cards', label: 'Tarjetas' },
							{ value: 'minimal', label: 'Minimalista' },
						]}
					/>
				</FormRow>

				<FormRow>
					<FormSelect
						id="separator-style"
						label="Estilo de Separadores"
						value={backsideOptions.separatorStyle || 'line'}
						onValueChange={(value) => handleBacksideChange('separatorStyle', value)}
						disabled={disabled}
						options={[
							{ value: 'line', label: 'Línea' },
							{ value: 'dotted', label: 'Punteado' },
							{ value: 'gradient', label: 'Degradado' },
							{ value: 'none', label: 'Ninguno' },
						]}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);
};

export function BacksideSettings({
	options,
	onChange,
	disabled = false,
}: {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}) {
	// Inicializar backside options desde las opciones de la tarjeta o con valores predeterminados
	const [backsideOptions, setBacksideOptions] = useState<BacksideOptions>({
		enabled: options.backside?.enabled ?? false,
		layoutType: options.backside?.layoutType ?? 'standard',
		colorMode: options.backside?.colorMode ?? 'inherit',
		customColor: options.backside?.customColor ?? '',
		opacity: options.backside?.opacity ?? 0.95,
		blurBackground: options.backside?.blurBackground ?? true,
		blurAmount: options.backside?.blurAmount ?? 10,
		showAttributes: options.backside?.showAttributes ?? true,
		showDescription: options.backside?.showDescription ?? true,
		showStats: options.backside?.showStats ?? true,
		showMetadata: options.backside?.showMetadata ?? true,
		showRelations: options.backside?.showRelations ?? false,
		maxDescriptionLength: options.backside?.maxDescriptionLength ?? 300,
		flipAnimation: options.backside?.flipAnimation ?? 'rotate',
		flipDuration: options.backside?.flipDuration ?? 600,
		enableAutoFlip: options.backside?.enableAutoFlip ?? false,
		autoFlipDelay: options.backside?.autoFlipDelay ?? 3000,
		flipTrigger: options.backside?.flipTrigger ?? 'click',
		headingStyle: options.backside?.headingStyle ?? 'default',
		infoStyle: options.backside?.infoStyle ?? 'default',
		separatorStyle: options.backside?.separatorStyle ?? 'line',
	});

	// Actualizar backside options cuando cambien las opciones externas
	useEffect(() => {
		if (options.backside) {
			setBacksideOptions((prev) => ({
				...prev,
				...options.backside,
			}));
		}
	}, [options.backside]);

	// Manejar cambios en opciones de backside
	const handleBacksideChange = (key: keyof BacksideOptions, value: unknown) => {
		const updatedOptions = {
			...backsideOptions,
			[key]: value,
		};

		setBacksideOptions(updatedOptions);

		// Propagar cambios al componente padre
		onChange({
			...options,
			backside: updatedOptions,
		});
	};

	return (
		<FormLayout
			title="Configuración de Cara Posterior"
			description="Personaliza la apariencia y comportamiento de la cara posterior de la tarjeta"
			colorScheme="images"
			variant="colored"
			maxHeight={500}
		>
			<FormToggle
				id="backside-enabled"
				label="Habilitar cara posterior"
				description="Activa o desactiva la cara posterior de la tarjeta"
				checked={backsideOptions.enabled}
				onCheckedChange={(checked) => handleBacksideChange('enabled', checked)}
				disabled={disabled}
				icon={<RectangleHorizontalIcon className="h-3.5 w-3.5 text-muted-foreground" />}
			/>

			{backsideOptions.enabled && (
				<div className="mt-4 space-y-6">
					<DesignSection
						backsideOptions={backsideOptions}
						handleBacksideChange={handleBacksideChange}
						disabled={disabled}
					/>

					<ContentSection
						backsideOptions={backsideOptions}
						handleBacksideChange={handleBacksideChange}
						disabled={disabled}
					/>

					<InteractionSection
						backsideOptions={backsideOptions}
						handleBacksideChange={handleBacksideChange}
						disabled={disabled}
					/>

					<UIStyleSection
						backsideOptions={backsideOptions}
						handleBacksideChange={handleBacksideChange}
						disabled={disabled}
					/>
				</div>
			)}
		</FormLayout>
	);
}

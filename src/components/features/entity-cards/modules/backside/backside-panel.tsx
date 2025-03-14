'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SelectItem } from '@/components/ui/select';
import { FileStackIcon, FlipHorizontalIcon, LayoutIcon, MouseIcon, PaletteIcon } from 'lucide-react';
import {
	FormInput,
	FormLayout,
	FormRow,
	FormSection,
	FormSelect,
	FormSlider,
	FormToggle,
	panelColors,
} from '@/components/features/entity-cards/settings/panels/shared';
import type { BacksideOptions, BacksideSystemProps } from './types';
import { useBacksideSystem } from './use-backside-system';

// Sección de diseño para el backside
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
			icon={<LayoutIcon className="h-5 w-5" />}
			title="Diseño"
			description="Configura el aspecto visual del reverso de la carta"
			color={panelColors.design}
		>
			<FormRow>
				<FormSelect
					label="Tipo de Layout"
					value={backsideOptions.layoutType || 'standard'}
					onChange={(value) => handleBacksideChange('layoutType', value)}
					disabled={disabled}
				>
					<SelectItem value="standard">Estándar</SelectItem>
					<SelectItem value="centered">Centrado</SelectItem>
					<SelectItem value="tabular">Tabular</SelectItem>
					<SelectItem value="minimal">Minimalista</SelectItem>
					<SelectItem value="media">Media-rich</SelectItem>
				</FormSelect>
			</FormRow>

			<FormRow>
				<FormSelect
					label="Modo de Color"
					value={backsideOptions.colorMode || 'inherit'}
					onChange={(value) => handleBacksideChange('colorMode', value)}
					disabled={disabled}
				>
					<SelectItem value="inherit">Heredar del frente</SelectItem>
					<SelectItem value="inverse">Inverso del frente</SelectItem>
					<SelectItem value="darken">Oscurecer frente</SelectItem>
					<SelectItem value="lighten">Aclarar frente</SelectItem>
					<SelectItem value="custom">Color personalizado</SelectItem>
				</FormSelect>
			</FormRow>

			{backsideOptions.colorMode === 'custom' && (
				<FormRow>
					<FormInput
						label="Color Personalizado"
						type="color"
						value={backsideOptions.customColor || '#ffffff'}
						onChange={(e) => handleBacksideChange('customColor', e.target.value)}
						disabled={disabled}
					/>
				</FormRow>
			)}

			<FormRow>
				<FormSlider
					label="Opacidad"
					min={0}
					max={1}
					step={0.05}
					value={[backsideOptions.opacity || 0.9]}
					onValueChange={(value) => handleBacksideChange('opacity', value[0])}
					disabled={disabled}
				/>
			</FormRow>

			<FormRow>
				<FormToggle
					label="Fondo Borroso"
					checked={backsideOptions.blurBackground || false}
					onCheckedChange={(checked) => handleBacksideChange('blurBackground', checked)}
					disabled={disabled}
				/>
			</FormRow>

			{backsideOptions.blurBackground && (
				<FormRow>
					<FormSlider
						label="Intensidad de Desenfoque"
						min={1}
						max={20}
						step={1}
						value={[backsideOptions.blurAmount || 5]}
						onValueChange={(value) => handleBacksideChange('blurAmount', value[0])}
						disabled={disabled}
					/>
				</FormRow>
			)}
		</FormSection>
	);
};

// Sección de contenido para el backside
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
			icon={<FileStackIcon className="h-5 w-5" />}
			title="Contenido"
			description="Configura qué información se muestra en el reverso"
			color={panelColors.content}
		>
			<FormRow>
				<FormToggle
					label="Mostrar Atributos"
					checked={backsideOptions.showAttributes || false}
					onCheckedChange={(checked) => handleBacksideChange('showAttributes', checked)}
					disabled={disabled}
				/>
			</FormRow>

			<FormRow>
				<FormToggle
					label="Mostrar Descripción"
					checked={backsideOptions.showDescription || false}
					onCheckedChange={(checked) => handleBacksideChange('showDescription', checked)}
					disabled={disabled}
				/>
			</FormRow>

			{backsideOptions.showDescription && (
				<FormRow>
					<FormSlider
						label="Longitud Máxima"
						min={50}
						max={500}
						step={10}
						value={[backsideOptions.maxDescriptionLength || 250]}
						onValueChange={(value) => handleBacksideChange('maxDescriptionLength', value[0])}
						disabled={disabled}
					/>
				</FormRow>
			)}

			<FormRow>
				<FormToggle
					label="Mostrar Estadísticas"
					checked={backsideOptions.showStats || false}
					onCheckedChange={(checked) => handleBacksideChange('showStats', checked)}
					disabled={disabled}
				/>
			</FormRow>

			<FormRow>
				<FormToggle
					label="Mostrar Metadatos"
					checked={backsideOptions.showMetadata || false}
					onCheckedChange={(checked) => handleBacksideChange('showMetadata', checked)}
					disabled={disabled}
				/>
			</FormRow>

			<FormRow>
				<FormToggle
					label="Mostrar Relaciones"
					checked={backsideOptions.showRelations || false}
					onCheckedChange={(checked) => handleBacksideChange('showRelations', checked)}
					disabled={disabled}
				/>
			</FormRow>
		</FormSection>
	);
};

// Sección de interacción para el backside
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
			icon={<MouseIcon className="h-5 w-5" />}
			title="Interacción"
			description="Configura cómo se voltea la carta"
			color={panelColors.interaction}
		>
			<FormRow>
				<FormSelect
					label="Animación de Volteo"
					value={backsideOptions.flipAnimation || 'flip'}
					onChange={(value) => handleBacksideChange('flipAnimation', value)}
					disabled={disabled}
				>
					<SelectItem value="flip">Flip</SelectItem>
					<SelectItem value="rotate">Rotate</SelectItem>
					<SelectItem value="fade">Fade</SelectItem>
					<SelectItem value="slide">Slide</SelectItem>
					<SelectItem value="fold">Fold</SelectItem>
					<SelectItem value="flip3d">3D Flip</SelectItem>
				</FormSelect>
			</FormRow>

			<FormRow>
				<FormSlider
					label="Duración de Animación (s)"
					min={0.1}
					max={2}
					step={0.1}
					value={[backsideOptions.flipDuration || 0.6]}
					onValueChange={(value) => handleBacksideChange('flipDuration', value[0])}
					disabled={disabled}
				/>
			</FormRow>

			<FormRow>
				<FormSelect
					label="Activador de Volteo"
					value={backsideOptions.flipTrigger || 'hover'}
					onChange={(value) => handleBacksideChange('flipTrigger', value)}
					disabled={disabled}
				>
					<SelectItem value="hover">Hover</SelectItem>
					<SelectItem value="click">Click</SelectItem>
					<SelectItem value="double-click">Doble Click</SelectItem>
					<SelectItem value="contextmenu">Menú Contextual</SelectItem>
				</FormSelect>
			</FormRow>

			<FormRow>
				<FormToggle
					label="Volteo Automático"
					checked={backsideOptions.enableAutoFlip || false}
					onCheckedChange={(checked) => handleBacksideChange('enableAutoFlip', checked)}
					disabled={disabled}
				/>
			</FormRow>

			{backsideOptions.enableAutoFlip && (
				<FormRow>
					<FormSlider
						label="Retraso de Auto-volteo (s)"
						min={1}
						max={10}
						step={0.5}
						value={[backsideOptions.autoFlipDelay || 3]}
						onValueChange={(value) => handleBacksideChange('autoFlipDelay', value[0])}
						disabled={disabled}
					/>
				</FormRow>
			)}
		</FormSection>
	);
};

// Sección de estilo UI para el backside
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
			icon={<PaletteIcon className="h-5 w-5" />}
			title="Estilo UI"
			description="Configura la apariencia de los elementos UI"
			color={panelColors.style}
		>
			<FormRow>
				<FormSelect
					label="Estilo de Títulos"
					value={backsideOptions.headingStyle || 'large'}
					onChange={(value) => handleBacksideChange('headingStyle', value)}
					disabled={disabled}
				>
					<SelectItem value="large">Grande</SelectItem>
					<SelectItem value="medium">Mediano</SelectItem>
					<SelectItem value="small">Pequeño</SelectItem>
					<SelectItem value="minimal">Minimalista</SelectItem>
					<SelectItem value="fancy">Decorativo</SelectItem>
				</FormSelect>
			</FormRow>

			<FormRow>
				<FormSelect
					label="Estilo de Información"
					value={backsideOptions.infoStyle || 'compact'}
					onChange={(value) => handleBacksideChange('infoStyle', value)}
					disabled={disabled}
				>
					<SelectItem value="compact">Compacto</SelectItem>
					<SelectItem value="expanded">Expandido</SelectItem>
					<SelectItem value="card">Tarjetas</SelectItem>
					<SelectItem value="simple">Simple</SelectItem>
					<SelectItem value="detailed">Detallado</SelectItem>
				</FormSelect>
			</FormRow>

			<FormRow>
				<FormSelect
					label="Estilo de Separadores"
					value={backsideOptions.separatorStyle || 'gradient'}
					onChange={(value) => handleBacksideChange('separatorStyle', value)}
					disabled={disabled}
				>
					<SelectItem value="gradient">Gradiente</SelectItem>
					<SelectItem value="solid">Sólido</SelectItem>
					<SelectItem value="dashed">Discontinuo</SelectItem>
					<SelectItem value="dotted">Punteado</SelectItem>
					<SelectItem value="none">Ninguno</SelectItem>
				</FormSelect>
			</FormRow>
		</FormSection>
	);
};

/**
 * Panel de configuración para el backside de las cartas
 */
export function BacksidePanel({ options, onChange, disabled = false }: BacksideSystemProps) {
	const { backsideOptions, handleBacksideChange } = useBacksideSystem({
		options,
		onChange,
		disabled,
	});

	return (
		<Card className="w-full">
			<CardHeader className="bg-secondary/50">
				<CardTitle className="flex items-center gap-2 text-lg">
					<FlipHorizontalIcon className="h-5 w-5" />
					Configuración de Backside
				</CardTitle>
				<CardDescription>Personaliza el reverso de la carta y la interacción de volteo</CardDescription>
			</CardHeader>
			<CardContent className="p-0">
				<div className="p-6 pt-2">
					<FormLayout>
						<FormRow>
							<FormToggle
								label="Habilitar Backside"
								checked={backsideOptions.enabled}
								onCheckedChange={(checked) => handleBacksideChange('enabled', checked)}
								disabled={disabled}
							/>
						</FormRow>
					</FormLayout>
				</div>

				{backsideOptions.enabled && (
					<ScrollArea className="h-[calc(100vh-24rem)] px-6 pb-6">
						<FormLayout>
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
						</FormLayout>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
}

'use client';

import {
	FormInput,
	FormLayout,
	FormRow,
	FormSection,
	FormSelect,
	FormSlider,
	FormToggle,
} from '@/components/features/entity-cards/settingsold/panels/shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FlipHorizontalIcon } from 'lucide-react';
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
		<FormSection title="Diseño" description="Configura el aspecto visual del reverso de la carta" colorScheme="design">
			<FormRow>
				<FormSelect
					id="layoutType"
					label="Tipo de Layout"
					value={backsideOptions.layoutType || 'standard'}
					onValueChange={(value) => handleBacksideChange('layoutType', value)}
					disabled={disabled}
					options={[
						{ value: 'standard', label: 'Estándar' },
						{ value: 'centered', label: 'Centrado' },
						{ value: 'tabular', label: 'Tabular' },
						{ value: 'minimal', label: 'Minimalista' },
						{ value: 'media', label: 'Media-rich' },
					]}
				/>
			</FormRow>

			<FormRow>
				<FormSelect
					id="colorMode"
					label="Modo de Color"
					value={backsideOptions.colorMode || 'inherit'}
					onValueChange={(value) => handleBacksideChange('colorMode', value)}
					disabled={disabled}
					options={[
						{ value: 'inherit', label: 'Heredar del frente' },
						{ value: 'inverse', label: 'Inverso del frente' },
						{ value: 'darken', label: 'Oscurecer frente' },
						{ value: 'lighten', label: 'Aclarar frente' },
						{ value: 'custom', label: 'Color personalizado' },
					]}
				/>
			</FormRow>

			{backsideOptions.colorMode === 'custom' && (
				<FormRow>
					<FormInput
						id="customColor"
						label="Color Personalizado"
						type="color"
						value={backsideOptions.customColor || '#ffffff'}
						onChange={(value) => handleBacksideChange('customColor', value)}
						disabled={disabled}
					/>
				</FormRow>
			)}

			<FormRow>
				<FormSlider
					id="opacity"
					label="Opacidad"
					min={0}
					max={1}
					step={0.05}
					value={backsideOptions.opacity || 0.9}
					onValueChange={(value) => handleBacksideChange('opacity', value)}
					disabled={disabled}
				/>
			</FormRow>

			<FormRow>
				<FormToggle
					id="blurBackground"
					label="Fondo Borroso"
					checked={backsideOptions.blurBackground || false}
					onCheckedChange={(checked) => handleBacksideChange('blurBackground', checked)}
					disabled={disabled}
				/>
			</FormRow>

			{backsideOptions.blurBackground && (
				<FormRow>
					<FormSlider
						id="blurAmount"
						label="Intensidad de Desenfoque"
						min={1}
						max={20}
						step={1}
						value={backsideOptions.blurAmount || 5}
						onValueChange={(value) => handleBacksideChange('blurAmount', value)}
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
			title="Contenido"
			description="Configura qué información se muestra en el reverso"
			colorScheme="performance"
		>
			<FormRow>
				<FormToggle
					id="showAttributes"
					label="Mostrar Atributos"
					checked={backsideOptions.showAttributes || false}
					onCheckedChange={(checked) => handleBacksideChange('showAttributes', checked)}
					disabled={disabled}
				/>
			</FormRow>

			<FormRow>
				<FormToggle
					id="showDescription"
					label="Mostrar Descripción"
					checked={backsideOptions.showDescription || false}
					onCheckedChange={(checked) => handleBacksideChange('showDescription', checked)}
					disabled={disabled}
				/>
			</FormRow>

			{backsideOptions.showDescription && (
				<FormRow>
					<FormSlider
						id="maxDescriptionLength"
						label="Longitud Máxima"
						min={50}
						max={500}
						step={10}
						value={backsideOptions.maxDescriptionLength || 250}
						onValueChange={(value) => handleBacksideChange('maxDescriptionLength', value)}
						disabled={disabled}
					/>
				</FormRow>
			)}

			<FormRow>
				<FormToggle
					id="showStats"
					label="Mostrar Estadísticas"
					checked={backsideOptions.showStats || false}
					onCheckedChange={(checked) => handleBacksideChange('showStats', checked)}
					disabled={disabled}
				/>
			</FormRow>

			<FormRow>
				<FormToggle
					id="showMetadata"
					label="Mostrar Metadatos"
					checked={backsideOptions.showMetadata || false}
					onCheckedChange={(checked) => handleBacksideChange('showMetadata', checked)}
					disabled={disabled}
				/>
			</FormRow>

			<FormRow>
				<FormToggle
					id="showRelations"
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
		<FormSection title="Interacción" description="Configura cómo se voltea la carta" colorScheme="system">
			<FormRow>
				<FormSelect
					id="flipAnimation"
					label="Animación de Volteo"
					value={backsideOptions.flipAnimation || 'flip'}
					onValueChange={(value) => handleBacksideChange('flipAnimation', value)}
					disabled={disabled}
					options={[
						{ value: 'flip', label: 'Flip' },
						{ value: 'rotate', label: 'Rotate' },
						{ value: 'fade', label: 'Fade' },
						{ value: 'slide', label: 'Slide' },
						{ value: 'fold', label: 'Fold' },
						{ value: 'flip3d', label: '3D Flip' },
					]}
				/>
			</FormRow>

			<FormRow>
				<FormSlider
					id="flipDuration"
					label="Duración de Animación (s)"
					min={0.1}
					max={2}
					step={0.1}
					value={backsideOptions.flipDuration || 0.6}
					onValueChange={(value) => handleBacksideChange('flipDuration', value)}
					disabled={disabled}
				/>
			</FormRow>

			<FormRow>
				<FormSelect
					id="flipTrigger"
					label="Activador de Volteo"
					value={backsideOptions.flipTrigger || 'hover'}
					onValueChange={(value) => handleBacksideChange('flipTrigger', value)}
					disabled={disabled}
					options={[
						{ value: 'hover', label: 'Hover' },
						{ value: 'click', label: 'Click' },
						{ value: 'double-click', label: 'Doble Click' },
						{ value: 'contextmenu', label: 'Menú Contextual' },
					]}
				/>
			</FormRow>

			<FormRow>
				<FormToggle
					id="enableAutoFlip"
					label="Volteo Automático"
					checked={backsideOptions.enableAutoFlip || false}
					onCheckedChange={(checked) => handleBacksideChange('enableAutoFlip', checked)}
					disabled={disabled}
				/>
			</FormRow>

			{backsideOptions.enableAutoFlip && (
				<FormRow>
					<FormSlider
						id="autoFlipDelay"
						label="Retraso de Auto-volteo (s)"
						min={1}
						max={10}
						step={0.5}
						value={backsideOptions.autoFlipDelay || 3}
						onValueChange={(value) => handleBacksideChange('autoFlipDelay', value)}
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
		<FormSection title="Estilo UI" description="Configura la apariencia de los elementos UI" colorScheme="visual">
			<FormRow>
				<FormSelect
					id="headingStyle"
					label="Estilo de Títulos"
					value={backsideOptions.headingStyle || 'large'}
					onValueChange={(value) => handleBacksideChange('headingStyle', value)}
					disabled={disabled}
					options={[
						{ value: 'large', label: 'Grande' },
						{ value: 'medium', label: 'Mediano' },
						{ value: 'small', label: 'Pequeño' },
						{ value: 'minimal', label: 'Minimalista' },
						{ value: 'fancy', label: 'Decorativo' },
					]}
				/>
			</FormRow>

			<FormRow>
				<FormSelect
					id="infoStyle"
					label="Estilo de Información"
					value={backsideOptions.infoStyle || 'compact'}
					onValueChange={(value) => handleBacksideChange('infoStyle', value)}
					disabled={disabled}
					options={[
						{ value: 'compact', label: 'Compacto' },
						{ value: 'expanded', label: 'Expandido' },
						{ value: 'card', label: 'Tarjetas' },
						{ value: 'simple', label: 'Simple' },
						{ value: 'detailed', label: 'Detallado' },
					]}
				/>
			</FormRow>

			<FormRow>
				<FormSelect
					id="separatorStyle"
					label="Estilo de Separadores"
					value={backsideOptions.separatorStyle || 'gradient'}
					onValueChange={(value) => handleBacksideChange('separatorStyle', value)}
					disabled={disabled}
					options={[
						{ value: 'gradient', label: 'Gradiente' },
						{ value: 'solid', label: 'Sólido' },
						{ value: 'dashed', label: 'Discontinuo' },
						{ value: 'dotted', label: 'Punteado' },
						{ value: 'none', label: 'Ninguno' },
					]}
				/>
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
								id="enabled"
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

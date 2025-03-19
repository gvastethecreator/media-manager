'use client';

import { FormGroup, FormInput, FormLayout, FormRow, FormSection, FormToggle } from '@/components/features/entity-cards/settings/panels/shared';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ColorPaletteSelector } from './color-palette-selector';
import type { ColorsModuleProps } from './types';
import { useColors } from './use-colors';

/**
 * Componente principal del módulo de colores
 */
export function ColorsModule({ initialOptions = {}, onChange, disabled = false, className }: ColorsModuleProps) {
	// Utilizamos el hook para gestionar los colores
	const { options, updateOption, updateColorPalette, toggleColorPalettes } = useColors({
		initialOptions,
		onChange,
		disabled,
	});

	// Componente para la sección de colores personalizados
	const CustomColorsSection = () => (
		<FormSection title="Colores Personalizados" description="Define los colores personalizados para tu tarjeta">
			<FormGroup>
				<FormRow>
					<FormInput
						id="primary-color"
						label="Color primario"
						value={options.primaryColor || '59, 130, 246'}
						onChange={(value) => updateOption('primaryColor', value)}
						disabled={disabled}
						icon={
							<div
								className="h-4 w-4 rounded-full border"
								style={{ backgroundColor: `rgb(${options.primaryColor || '59, 130, 246'})` }}
							/>
						}
					/>
					<FormInput
						id="secondary-color"
						label="Color secundario"
						value={options.secondaryColor || '37, 99, 235'}
						onChange={(value) => updateOption('secondaryColor', value)}
						disabled={disabled}
						icon={
							<div
								className="h-4 w-4 rounded-full border"
								style={{ backgroundColor: `rgb(${options.secondaryColor || '37, 99, 235'})` }}
							/>
						}
					/>
				</FormRow>
			</FormGroup>

			<FormGroup>
				<FormRow>
					<FormInput
						id="accent-color"
						label="Color de acento"
						value={options.accentColor || '245, 158, 11'}
						onChange={(value) => updateOption('accentColor', value)}
						disabled={disabled}
						icon={
							<div
								className="h-4 w-4 rounded-full border"
								style={{ backgroundColor: `rgb(${options.accentColor || '245, 158, 11'})` }}
							/>
						}
					/>
					<FormInput
						id="text-color"
						label="Color de texto"
						value={options.textColor || '31, 41, 55'}
						onChange={(value) => updateOption('textColor', value)}
						disabled={disabled}
						icon={
							<div
								className="h-4 w-4 rounded-full border"
								style={{ backgroundColor: `rgb(${options.textColor || '31, 41, 55'})` }}
							/>
						}
					/>
				</FormRow>
			</FormGroup>

			<FormGroup>
				<FormRow>
					<FormInput
						id="background-start-color"
						label="Color de fondo (inicio)"
						value={options.backgroundStartColor || '249, 250, 251'}
						onChange={(value) => updateOption('backgroundStartColor', value)}
						disabled={disabled}
						icon={
							<div
								className="h-4 w-4 rounded-full border"
								style={{ backgroundColor: `rgb(${options.backgroundStartColor || '249, 250, 251'})` }}
							/>
						}
					/>
					<FormInput
						id="background-end-color"
						label="Color de fondo (fin)"
						value={options.backgroundEndColor || '243, 244, 246'}
						onChange={(value) => updateOption('backgroundEndColor', value)}
						disabled={disabled}
						icon={
							<div
								className="h-4 w-4 rounded-full border"
								style={{ backgroundColor: `rgb(${options.backgroundEndColor || '243, 244, 246'})` }}
							/>
						}
					/>
				</FormRow>
			</FormGroup>

			<FormGroup>
				<FormRow>
					<FormInput
						id="border-color"
						label="Color de borde"
						value={options.borderColor || '209, 213, 219'}
						onChange={(value) => updateOption('borderColor', value)}
						disabled={disabled}
						icon={
							<div
								className="h-4 w-4 rounded-full border"
								style={{ backgroundColor: `rgb(${options.borderColor || '209, 213, 219'})` }}
							/>
						}
					/>
				</FormRow>
			</FormGroup>
		</FormSection>
	);

	return (
		<Card className={cn('w-full bg-slate-50/20 border-slate-200/50', className)}>
			<FormLayout
				title="Colores y Paletas"
				description="Configura los colores de las tarjetas usando paletas predefinidas o colores personalizados"
			>
				<FormToggle
					id="use-color-palettes"
					label="Usar paletas de colores"
					description="Utiliza paletas de colores predefinidas en lugar de colores personalizados"
					checked={options.useColorPalettes}
					onCheckedChange={toggleColorPalettes}
					disabled={disabled}
				/>

				{options.useColorPalettes ? (
					<div className="mt-4">
						<FormSection title="Seleccionar Paleta" description="Elige una paleta de colores predefinida">
							<FormGroup>
								<ColorPaletteSelector
									selectedPaletteId={options.colorPalette}
									onSelectPalette={updateColorPalette}
									allowCustom={true}
								/>
							</FormGroup>
						</FormSection>
					</div>
				) : (
					<div className="mt-4">
						<CustomColorsSection />
					</div>
				)}
			</FormLayout>
		</Card>
	);
}

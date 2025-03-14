'use client';

import { type ColorPalette, ColorPaletteSelector } from '../../modules/colors';
import type { CardOptions } from '../../types/card-settings-types';
import { FormGroup, FormInput, FormLayout, FormRow, FormSection, FormToggle, panelColors } from './shared';

interface ColorsSettingsProps {
	options: CardOptions;
	onChange: (options: CardOptions) => void;
	disabled?: boolean;
}

export function ColorsSettings({ options, onChange, disabled = false }: ColorsSettingsProps) {
	// Manejar cambio de paleta de colores
	const handleColorPaletteChange = (palette: ColorPalette) => {
		onChange({
			...options,
			colorPalette: palette.id,
			primaryColor: palette.primaryColor,
			secondaryColor: palette.secondaryColor,
			accentColor: palette.accentColor,
			backgroundStartColor: palette.backgroundStart,
			backgroundEndColor: palette.backgroundEnd,
			textColor: palette.textColor,
			borderColor: palette.borderColor,
		});
	};

	// Manejar cambio en el uso de paletas de colores
	const handleUseColorPalettes = (enabled: boolean) => {
		onChange({
			...options,
			useColorPalettes: enabled,
		});
	};

	// Encontrar la paleta seleccionada actualmente
	const selectedPaletteId = options.colorPalette || 'modern-blue';

	// Componente para la sección de colores personalizados
	const CustomColorsSection = () => (
		<FormSection
			title="Colores Personalizados"
			description="Define los colores personalizados para tu tarjeta"
			colorScheme="design"
		>
			<FormGroup>
				<FormRow>
					<FormInput
						id="primary-color"
						label="Color primario"
						value={options.primaryColor || '59, 130, 246'}
						onChange={(value) => onChange({ ...options, primaryColor: value })}
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
						onChange={(value) => onChange({ ...options, secondaryColor: value })}
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
		</FormSection>
	);

	return (
		<FormLayout
			title="Colores y Paletas"
			description="Configura los colores de las tarjetas usando paletas predefinidas o colores personalizados"
			colorScheme="design"
			variant="colored"
		>
			<FormToggle
				id="use-color-palettes"
				label="Usar paletas de colores"
				description="Utiliza paletas de colores predefinidas en lugar de colores personalizados"
				checked={options.useColorPalettes}
				onCheckedChange={handleUseColorPalettes}
				disabled={disabled}
			/>

			{options.useColorPalettes ? (
				<div className="mt-4">
					<FormSection
						title="Seleccionar Paleta"
						description="Elige una paleta de colores predefinida"
						colorScheme="design"
					>
						<FormGroup>
							<ColorPaletteSelector
								selectedPaletteId={selectedPaletteId}
								onSelectPalette={handleColorPaletteChange}
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
	);
}

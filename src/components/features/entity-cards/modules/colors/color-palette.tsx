'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Plus } from 'lucide-react';
import type * as React from 'react';
import { useEffect, useState } from 'react';

export interface ColorPalette {
	id: string;
	name: string;
	description?: string;
	primaryColor: string;
	secondaryColor: string;
	accentColor: string;
	backgroundStart: string;
	backgroundEnd: string;
	textColor: string;
	borderColor: string;
}

// Paletas de colores predefinidas
export const DEFAULT_COLOR_PALETTES: ColorPalette[] = [
	{
		id: 'modern-blue',
		name: 'Azul Moderno',
		description: 'Paleta de azules modernos con acentos brillantes',
		primaryColor: '59, 130, 246',
		secondaryColor: '37, 99, 235',
		accentColor: '147, 197, 253',
		backgroundStart: '239, 246, 255',
		backgroundEnd: '219, 234, 254',
		textColor: '30, 64, 175',
		borderColor: '191, 219, 254',
	},
	{
		id: 'emerald-green',
		name: 'Esmeralda',
		description: 'Tonos verdes esmeralda y jade',
		primaryColor: '16, 185, 129',
		secondaryColor: '5, 150, 105',
		accentColor: '110, 231, 183',
		backgroundStart: '236, 253, 245',
		backgroundEnd: '209, 250, 229',
		textColor: '6, 95, 70',
		borderColor: '167, 243, 208',
	},
	{
		id: 'royal-purple',
		name: 'Púrpura Real',
		description: 'Elegante combinación de púrpuras y violetas',
		primaryColor: '139, 92, 246',
		secondaryColor: '124, 58, 237',
		accentColor: '196, 181, 253',
		backgroundStart: '245, 243, 255',
		backgroundEnd: '237, 233, 254',
		textColor: '91, 33, 182',
		borderColor: '221, 214, 254',
	},
	{
		id: 'sunset-orange',
		name: 'Atardecer',
		description: 'Cálidos tonos de naranja y rosa atardecer',
		primaryColor: '249, 115, 22',
		secondaryColor: '234, 88, 12',
		accentColor: '253, 186, 116',
		backgroundStart: '255, 247, 237',
		backgroundEnd: '255, 237, 213',
		textColor: '154, 52, 18',
		borderColor: '254, 215, 170',
	},
	{
		id: 'rose-pink',
		name: 'Rosa Rosado',
		description: 'Suaves tonos rosas y fucsias',
		primaryColor: '236, 72, 153',
		secondaryColor: '219, 39, 119',
		accentColor: '251, 207, 232',
		backgroundStart: '255, 241, 242',
		backgroundEnd: '252, 231, 243',
		textColor: '157, 23, 77',
		borderColor: '251, 207, 232',
	},
	{
		id: 'teal-cyan',
		name: 'Turquesa Cian',
		description: 'Refrescantes tonos de turquesa y cian',
		primaryColor: '20, 184, 166',
		secondaryColor: '13, 148, 136',
		accentColor: '153, 246, 228',
		backgroundStart: '240, 253, 250',
		backgroundEnd: '204, 251, 241',
		textColor: '15, 118, 110',
		borderColor: '153, 246, 228',
	},
	{
		id: 'slate-gray',
		name: 'Gris Pizarra',
		description: 'Elegantes tonos grises neutros',
		primaryColor: '100, 116, 139',
		secondaryColor: '71, 85, 105',
		accentColor: '203, 213, 225',
		backgroundStart: '248, 250, 252',
		backgroundEnd: '241, 245, 249',
		textColor: '51, 65, 85',
		borderColor: '226, 232, 240',
	},
	{
		id: 'amber-gold',
		name: 'Ámbar Dorado',
		description: 'Brillantes tonos ámbar y dorados',
		primaryColor: '245, 158, 11',
		secondaryColor: '217, 119, 6',
		accentColor: '252, 211, 77',
		backgroundStart: '255, 251, 235',
		backgroundEnd: '254, 243, 199',
		textColor: '146, 64, 14',
		borderColor: '253, 230, 138',
	},
];

interface ColorPaletteCardProps {
	palette: ColorPalette;
	isSelected: boolean;
	onClick: () => void;
}

// Componente para mostrar una paleta de colores individual
const ColorPaletteCard: React.FC<ColorPaletteCardProps> = ({ palette, isSelected, onClick }) => {
	return (
		<button
			type="button"
			className={cn(
				'relative w-full rounded-md border p-2 transition-all hover:shadow-md',
				isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
			)}
			onClick={onClick}
		>
			<div className="flex flex-col gap-2">
				<div className="flex justify-between items-center">
					<span className="text-xs font-medium">{palette.name}</span>
					{isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
				</div>

				<div className="grid grid-cols-5 gap-1 mt-1">
					<div
						className="h-4 rounded-sm"
						style={{ backgroundColor: `rgb(${palette.primaryColor})` }}
						title="Color primario"
					/>
					<div
						className="h-4 rounded-sm"
						style={{ backgroundColor: `rgb(${palette.secondaryColor})` }}
						title="Color secundario"
					/>
					<div
						className="h-4 rounded-sm"
						style={{ backgroundColor: `rgb(${palette.accentColor})` }}
						title="Color acento"
					/>
					<div
						className="h-4 rounded-sm"
						style={{ backgroundColor: `rgb(${palette.textColor})` }}
						title="Color de texto"
					/>
					<div
						className="h-4 rounded-sm border border-border"
						style={{
							background: `linear-gradient(to right, rgb(${palette.backgroundStart}), rgb(${palette.backgroundEnd}))`,
						}}
						title="Fondo"
					/>
				</div>
			</div>
		</button>
	);
};

interface ColorPaletteSelectorProps {
	selectedPaletteId?: string;
	onSelectPalette: (palette: ColorPalette) => void;
	customPalettes?: ColorPalette[];
	allowCustom?: boolean;
}

export const ColorPaletteSelector: React.FC<ColorPaletteSelectorProps> = ({
	selectedPaletteId,
	onSelectPalette,
	customPalettes = [],
	allowCustom = false,
}) => {
	const [selectedId, setSelectedId] = useState<string | undefined>(selectedPaletteId);
	const [palettes, setPalettes] = useState<ColorPalette[]>([...DEFAULT_COLOR_PALETTES, ...customPalettes]);

	// Actualizar las paletas cuando cambien las props
	useEffect(() => {
		setPalettes([...DEFAULT_COLOR_PALETTES, ...customPalettes]);
	}, [customPalettes]);

	// Actualizar el ID seleccionado cuando cambie la prop
	useEffect(() => {
		setSelectedId(selectedPaletteId);
	}, [selectedPaletteId]);

	const handleSelectPalette = (palette: ColorPalette) => {
		setSelectedId(palette.id);
		onSelectPalette(palette);
	};

	return (
		<div className="space-y-3">
			<div className="flex justify-between items-center">
				<h3 className="text-sm font-medium">Paleta de colores</h3>
				{allowCustom && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 text-xs"
					>
						<Plus className="h-3.5 w-3.5 mr-1" />
						Personalizada
					</Button>
				)}
			</div>

			<div className="grid grid-cols-2 gap-2">
				{palettes.map((palette) => (
					<ColorPaletteCard
						key={palette.id}
						palette={palette}
						isSelected={selectedId === palette.id}
						onClick={() => handleSelectPalette(palette)}
					/>
				))}
			</div>
		</div>
	);
};

interface ColorPaletteApplierProps {
	palette: ColorPalette;
	children: React.ReactNode;
	className?: string;
}

// Componente para aplicar una paleta de colores a sus hijos
export const ColorPaletteApplier: React.FC<ColorPaletteApplierProps> = ({ palette, children, className }) => {
	// Crear variables CSS para la paleta de colores
	const cssVars = {
		'--color-primary': `rgb(${palette.primaryColor})`,
		'--color-secondary': `rgb(${palette.secondaryColor})`,
		'--color-accent': `rgb(${palette.accentColor})`,
		'--color-background-start': `rgb(${palette.backgroundStart})`,
		'--color-background-end': `rgb(${palette.backgroundEnd})`,
		'--color-text': `rgb(${palette.textColor})`,
		'--color-border': `rgb(${palette.borderColor})`,
	} as React.CSSProperties;

	return (
		<div className={cn('color-palette-container', className)} style={cssVars}>
			{children}
		</div>
	);
};

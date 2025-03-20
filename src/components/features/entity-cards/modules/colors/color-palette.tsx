'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Plus } from 'lucide-react';
import type * as React from 'react';
import { useState, useMemo } from 'react';
import { CustomPaletteModal } from './custom-palette-modal';
import type { ColorPalette } from './types';

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
	palettes?: ColorPalette[];
	allowCustom?: boolean;
	className?: string;
}

export function ColorPaletteSelector({
	selectedPaletteId,
	onSelectPalette,
	palettes = DEFAULT_COLOR_PALETTES,
	allowCustom = false,
	className,
}: ColorPaletteSelectorProps) {
	const [customPalettes, setCustomPalettes] = useState<ColorPalette[]>([]);
	const [showCustomModal, setShowCustomModal] = useState(false);

	// Combinar paletas predefinidas con paletas personalizadas
	const allPalettes = useMemo(() => {
		return [...palettes, ...customPalettes];
	}, [palettes, customPalettes]);

	const selectedPalette = allPalettes.find((p) => p.id === selectedPaletteId);

	const handleSelectPalette = (palette: ColorPalette) => {
		onSelectPalette?.(palette);
	};

	const handleSaveCustomPalette = (newPalette: ColorPalette) => {
		setCustomPalettes((prev) => {
			// Reemplazar si ya existe una paleta con el mismo ID
			const exists = prev.findIndex((p) => p.id === newPalette.id);
			if (exists >= 0) {
				const updated = [...prev];
				updated[exists] = newPalette;
				return updated;
			}
			// Agregar nueva paleta
			return [...prev, newPalette];
		});
		handleSelectPalette(newPalette);
		setShowCustomModal(false);
	};

	return (
		<div className={cn('flex flex-col space-y-2', className)}>
			<div className="flex items-center justify-between">
				<div className="text-sm font-medium">Paleta de colores</div>
				{allowCustom && (
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="h-7 text-xs"
						onClick={() => setShowCustomModal(true)}
					>
						<Plus className="h-3.5 w-3.5 mr-1" />
						Personalizada
					</Button>
				)}
			</div>

			<div className="grid grid-cols-2 gap-2">
				{allPalettes.map((palette) => (
					<button
						key={palette.id}
						type="button"
						className={cn(
							'flex items-center space-x-2 rounded-md border p-2 text-left text-sm transition-colors',
							selectedPaletteId === palette.id
								? 'border-primary bg-primary/5'
								: 'hover:bg-muted/50'
						)}
						onClick={() => handleSelectPalette(palette)}
					>
						<div className="flex flex-1 flex-col">
							<span className="font-medium">{palette.name}</span>
							{palette.description && (
								<span className="text-xs text-muted-foreground line-clamp-1">
									{palette.description}
								</span>
							)}
						</div>
						<div className="flex items-center space-x-1">
							<div
								className="h-4 w-4 rounded-full border"
								style={{ backgroundColor: `rgb(${palette.primaryColor})` }}
							/>
							<div
								className="h-4 w-4 rounded-full border"
								style={{ backgroundColor: `rgb(${palette.secondaryColor})` }}
							/>
							<div
								className="h-4 w-4 rounded-full border"
								style={{ backgroundColor: `rgb(${palette.accentColor})` }}
							/>
							{selectedPaletteId === palette.id && (
								<Check className="h-4 w-4 text-primary ml-1" />
							)}
						</div>
					</button>
				))}
			</div>

			{showCustomModal && (
				<CustomPaletteModal
					onClose={() => setShowCustomModal(false)}
					onSave={handleSaveCustomPalette}
				/>
			)}
		</div>
	);
}

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

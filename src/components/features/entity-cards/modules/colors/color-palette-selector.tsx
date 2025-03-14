'use client';

import { cn } from '@/lib/utils';
import { CheckIcon } from 'lucide-react';
import { useCallback } from 'react';
import type { ColorPalette } from './types';
import { COLOR_PALETTES } from './types';

interface ColorPaletteSelectorProps {
	selectedPaletteId: string;
	onSelectPalette: (palette: ColorPalette) => void;
	allowCustom?: boolean;
	className?: string;
}

/**
 * Componente para seleccionar paletas de colores
 */
export function ColorPaletteSelector({
	selectedPaletteId,
	onSelectPalette,
	allowCustom = true,
	className,
}: ColorPaletteSelectorProps) {
	// Manejador para seleccionar una paleta
	const handleSelectPalette = useCallback(
		(palette: ColorPalette) => {
			onSelectPalette(palette);
		},
		[onSelectPalette]
	);

	return (
		<div className={cn('grid grid-cols-2 gap-2', className)}>
			{COLOR_PALETTES.map((palette) => (
				<button
					key={palette.id}
					type="button"
					className={cn(
						'relative flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 p-1 text-xs transition-all',
						{
							'border-blue-500 ring-2 ring-blue-200': palette.id === selectedPaletteId,
							'border-slate-200 hover:border-slate-300': palette.id !== selectedPaletteId,
						}
					)}
					onClick={() => handleSelectPalette(palette)}
				>
					{/* Paleta de colores */}
					<div className="flex w-full justify-center space-x-0.5">
						{[
							{ id: `${palette.id}-primary`, color: palette.primaryColor },
							{ id: `${palette.id}-secondary`, color: palette.secondaryColor },
							{ id: `${palette.id}-accent`, color: palette.accentColor },
							{ id: `${palette.id}-text`, color: palette.textColor },
						].map((item) => (
							<div
								key={item.id}
								className="h-3 w-3 rounded-full border border-slate-200"
								style={{ backgroundColor: `rgb(${item.color})` }}
							/>
						))}
					</div>

					{/* Gradiente de fondo */}
					<div
						className="mt-1 h-5 w-full rounded border border-slate-200"
						style={{
							background: `linear-gradient(to right, rgb(${palette.backgroundStart}), rgb(${palette.backgroundEnd}))`,
						}}
					/>

					{/* Nombre de la paleta */}
					<span className="mt-1 text-[10px] font-medium">{palette.name}</span>

					{/* Indicador de selección */}
					{palette.id === selectedPaletteId && (
						<div className="absolute right-1 top-1 rounded-full bg-blue-500 p-0.5 text-white">
							<CheckIcon className="h-3 w-3" />
						</div>
					)}
				</button>
			))}

			{allowCustom && (
				<button
					type="button"
					className={cn(
						'flex h-20 w-full cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed p-1 text-xs transition-all',
						{
							'border-blue-500 text-blue-500': selectedPaletteId === 'custom',
							'border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-600':
								selectedPaletteId !== 'custom',
						}
					)}
					onClick={() => {
						// Implementar lógica para paleta personalizada si es necesario
					}}
				>
					<span className="text-[10px] font-medium">Personalizada</span>
				</button>
			)}
		</div>
	);
}

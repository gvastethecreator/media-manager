'use client';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CheckIcon, Paintbrush } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';

// Paleta de colores predefinidos para opciones rápidas
const PRESET_COLORS = [
	'#000000', // Negro
	'#FFFFFF', // Blanco
	'#F3F4F6', // Gris claro
	'#4B5563', // Gris oscuro
	'#EF4444', // Rojo
	'#F59E0B', // Ámbar
	'#10B981', // Esmeralda
	'#3B82F6', // Azul
	'#8B5CF6', // Violeta
	'#EC4899', // Rosa
];

interface ColorPickerProps {
	color: string;
	onChange: (color: string) => void;
	className?: string;
}

/**
 * Componente para selección de colores con opciones predefinidas
 * 🎨 Permite elegir colores mediante paleta o input hexadecimal
 */
export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
	const [localColor, setLocalColor] = useState(color);

	// Actualiza el color tanto local como externamente
	const handleColorChange = (newColor: string) => {
		setLocalColor(newColor);
		onChange(newColor);
	};

	// Maneja los cambios en el input de color
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setLocalColor(value);
	};

	// Aplica el color cuando se confirma el input
	const handleInputBlur = () => {
		try {
			// Validar que es un color hexadecimal válido
			if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(localColor)) {
				onChange(localColor);
			} else {
				// Si es inválido, revertir al color anterior
				setLocalColor(color);
			}
		} catch (_error) {
			setLocalColor(color);
		}
	};

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button variant="outline" size="sm" className={cn('w-full h-8 px-3 justify-between', className)}>
					<div className="flex items-center gap-2">
						<div className="h-4 w-4 rounded-sm border" style={{ backgroundColor: color }} />
						<span className="text-xs">{color}</span>
					</div>
					<Paintbrush className="h-3.5 w-3.5 text-muted-foreground" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-3">
				<div className="space-y-3">
					{/* Selector de color nativo */}
					<div>
						<input
							type="color"
							value={localColor}
							onChange={(e) => handleColorChange(e.target.value)}
							className="w-full h-8 cursor-pointer"
						/>
					</div>

					{/* Colores predefinidos */}
					<div className="space-y-1.5">
						<div className="text-xs font-medium">Colores predefinidos</div>
						<div className="grid grid-cols-5 gap-1">
							{PRESET_COLORS.map((presetColor) => (
								<Button
									key={presetColor}
									type="button"
									size="sm"
									variant="outline"
									className="w-full h-6 p-0"
									style={{ backgroundColor: presetColor }}
									onClick={() => handleColorChange(presetColor)}
								>
									{color.toLowerCase() === presetColor.toLowerCase() && (
										<CheckIcon className="h-3 w-3 text-white drop-shadow-sm" />
									)}
								</Button>
							))}
						</div>
					</div>

					{/* Input de código hexadecimal */}
					<div className="space-y-1.5">
						<label htmlFor="hex-input" className="text-xs font-medium">
							Código hexadecimal
						</label>
						<input
							id="hex-input"
							type="text"
							value={localColor}
							onChange={handleInputChange}
							onBlur={handleInputBlur}
							className="w-full h-8 px-2 text-xs border rounded-md"
							placeholder="#RRGGBB"
						/>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

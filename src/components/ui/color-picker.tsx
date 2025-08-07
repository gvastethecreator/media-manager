import { Check, Palette } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

// Paleta de colores predefinidos
const PRESET_COLORS = [
	'#3b82f6', // Blue
	'#ef4444', // Red
	'#22c55e', // Green
	'#eab308', // Yellow
	'#ec4899', // Pink
	'#8b5cf6', // Purple
	'#06b6d4', // Cyan
	'#f97316', // Orange
	'#14b8a6', // Teal
	'#f43f5e', // Rose
	'#6366f1', // Indigo
	'#0ea5e9', // Sky
	'#64748b', // Slate
	'#6b7280', // Gray
	'#d946ef', // Fuchsia
	'#84cc16', // Lime
	'#0891b2', // Cyan Dark
	'#9333ea', // Purple Darker
	'#000000', // Black
	'#ffffff', // White
];

interface ColorPickerProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
	compact?: boolean;
	showLabel?: boolean;
}

export function ColorPicker({ value, onChange, className, compact = false, showLabel = true }: ColorPickerProps) {
	const [open, setOpen] = useState(false);
	const [currentColor, setCurrentColor] = useState(value);

	// Gestionar cambio directo de color mediante input
	const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCurrentColor(e.target.value);
	};

	// Aplicar el color seleccionado
	const applyColor = (color: string) => {
		onChange(color);
		setCurrentColor(color);
		setOpen(false);
	};

	// Detectar si un color coincide con el actual para marcarlo como seleccionado
	const isSelected = (color: string) => color.toLowerCase() === currentColor.toLowerCase();

	return (
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					aria-expanded={open}
					className={cn(
						compact ? 'h-8' : 'h-9',
						showLabel || !compact ? 'w-full justify-between' : 'w-8 justify-center p-0',
						className
					)}
					variant="outline"
				>
					<div className={cn('flex items-center gap-2', !showLabel && compact && 'flex-1 justify-center')}>
						<div
							className={cn('rounded-full border', compact ? 'h-4 w-4' : 'h-5 w-5')}
							style={{ backgroundColor: currentColor }}
						/>
						{(showLabel || !compact) && <span className={compact ? 'truncate text-xs' : ''}>{currentColor}</span>}
					</div>
					{(showLabel || !compact) && (
						<Palette className={cn('ml-auto shrink-0 opacity-50', compact ? 'h-3 w-3' : 'h-4 w-4')} />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className={cn('p-3', compact ? 'w-56' : 'w-64')} sideOffset={8}>
				<div className="space-y-3">
					<div className="space-y-1">
						<Label className={compact ? 'text-xs' : ''} htmlFor="custom-color">
							Color personalizado
						</Label>
						<div className="flex gap-2">
							<Input
								className={cn('cursor-pointer p-0', compact ? 'h-7 w-7' : 'h-8 w-8')}
								id="custom-color"
								onChange={handleColorChange}
								type="color"
								value={currentColor}
							/>
							<Input
								className={cn('flex-1', compact ? 'h-7 text-xs' : 'h-8')}
								maxLength={9}
								onChange={(e) => setCurrentColor(e.target.value)}
								type="text"
								value={currentColor}
							/>
							<Button
								className={cn('p-0', compact ? 'h-7 w-7' : 'h-8 w-8')}
								onClick={() => applyColor(currentColor)}
								size="sm"
								variant="outline"
							>
								<Check className={compact ? 'h-3 w-3' : 'h-4 w-4'} />
								<span className="sr-only">Aplicar color</span>
							</Button>
						</div>
					</div>

					<div className="space-y-1">
						<Label className={compact ? 'text-xs' : ''}>Colores predefinidos</Label>
						<div className={cn('grid gap-2', compact ? 'grid-cols-6' : 'grid-cols-5')}>
							{PRESET_COLORS.slice(0, compact ? 12 : 20).map((color) => (
								<button
									aria-label={`Seleccionar color ${color}`}
									className={cn(
										'flex h-6 w-6 items-center justify-center rounded-md border border-muted',
										isSelected(color) && 'ring-1 ring-ring'
									)}
									key={color}
									onClick={() => applyColor(color)}
									style={{ backgroundColor: color }}
									type="button"
								>
									{isSelected(color) && (
										<Check
											className={cn(color === '#ffffff' ? 'text-black' : 'text-white', compact ? 'h-3 w-3' : 'h-4 w-4')}
										/>
									)}
									<span className="sr-only">{color}</span>
								</button>
							))}
						</div>
					</div>
				</div>
			</PopoverContent>
		</Popover>
	);
}

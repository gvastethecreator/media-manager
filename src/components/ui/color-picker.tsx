'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, Palette } from 'lucide-react';
import { useState } from 'react';

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
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn(
						compact ? "h-8" : "h-9",
						showLabel || !compact ? "w-full justify-between" : "w-8 p-0 justify-center",
						className
					)}
				>
					<div
						className={cn(
							"flex items-center gap-2",
							!showLabel && compact && "flex-1 justify-center"
						)}
					>
						<div
							className={cn(
								"rounded-full border",
								compact ? "h-4 w-4" : "h-5 w-5"
							)}
							style={{ backgroundColor: currentColor }}
						/>
						{(showLabel || !compact) && (
							<span className={compact ? "text-xs truncate" : ""}>{currentColor}</span>
						)}
					</div>
					{(showLabel || !compact) && (
						<Palette className={cn(
							"ml-auto shrink-0 opacity-50",
							compact ? "h-3 w-3" : "h-4 w-4"
						)} />
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className={cn(
					"p-3",
					compact ? "w-56" : "w-64"
				)}
				align="start"
				sideOffset={8}
			>
				<div className="space-y-3">
					<div className="space-y-1">
						<Label
							htmlFor="custom-color"
							className={compact ? "text-xs" : ""}
						>
							Color personalizado
						</Label>
						<div className="flex gap-2">
							<Input
								id="custom-color"
								type="color"
								value={currentColor}
								onChange={handleColorChange}
								className={cn(
									"p-0 cursor-pointer",
									compact ? "h-7 w-7" : "h-8 w-8"
								)}
							/>
							<Input
								type="text"
								value={currentColor}
								onChange={(e) => setCurrentColor(e.target.value)}
								className={cn(
									"flex-1",
									compact ? "h-7 text-xs" : "h-8"
								)}
								maxLength={9}
							/>
							<Button
								variant="outline"
								size="sm"
								className={cn(
									"p-0",
									compact ? "h-7 w-7" : "h-8 w-8"
								)}
								onClick={() => applyColor(currentColor)}
							>
								<Check className={compact ? "h-3 w-3" : "h-4 w-4"} />
								<span className="sr-only">Aplicar color</span>
							</Button>
						</div>
					</div>

					<div className="space-y-1">
						<Label className={compact ? "text-xs" : ""}>
							Colores predefinidos
						</Label>
						<div className={cn(
							"grid gap-2",
							compact ? "grid-cols-6" : "grid-cols-5"
						)}>
							{PRESET_COLORS.slice(0, compact ? 12 : 20).map((color) => (
								<button
									key={color}
									className={cn(
										'rounded-full border flex items-center justify-center',
										isSelected(color) && 'ring-2 ring-primary ring-offset-1',
										compact ? "h-6 w-6" : "h-8 w-8"
									)}
									style={{ backgroundColor: color }}
									onClick={() => applyColor(color)}
								>
									{isSelected(color) && (
										<Check className={cn(
											color === '#ffffff' ? 'text-black' : 'text-white',
											compact ? "h-3 w-3" : "h-4 w-4"
										)} />
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

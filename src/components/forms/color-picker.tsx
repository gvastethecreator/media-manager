import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

const presetColors = [
	'#ef4444', // Red
	'#f97316', // Orange
	'#f59e0b', // Amber
	'#22c55e', // Green
	'#10b981', // Emerald
	'#14b8a6', // Teal
	'#06b6d4', // Cyan
	'#0ea5e9', // Sky
	'#3b82f6', // Blue
	'#6366f1', // Indigo
	'#8b5cf6', // Violet
	'#a855f7', // Purple
	'#d946ef', // Fuchsia
	'#ec4899', // Pink
	'#f43f5e', // Rose
	'#64748b', // Slate
];

export const ColorPicker = memo(function ColorPicker({ value, onChange, className }: ColorPickerProps) {
	const [open, setOpen] = useState(false);

	// Callback memoizado para manejar selección de color
	const handleColorSelect = useCallback(
		(color: string) => {
			onChange(color);
			setOpen(false);
		},
		[onChange]
	);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					type="button"
					className={cn('w-[4rem] justify-center', className)}
					style={{ backgroundColor: value }}
				>
					<span className="sr-only">Color seleccionado: {value}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-64 p-3" align="start">
				<div className="grid grid-cols-4 gap-2">
					{presetColors.map((color) => (
						<Button
							key={color}
							variant="outline"
							className="h-8 w-8 p-0 flex items-center justify-center"
							style={{ backgroundColor: color }}
							onClick={() => handleColorSelect(color)}
							title={`Color: ${color}`}
						>
							{value === color && <span className="text-white text-xs">✓</span>}
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
});

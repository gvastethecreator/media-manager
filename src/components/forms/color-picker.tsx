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
		<Popover onOpenChange={setOpen} open={open}>
			<PopoverTrigger asChild>
				<Button
					className={cn('w-[4rem] justify-center', className)}
					style={{ backgroundColor: value }}
					type="button"
					variant="outline"
				>
					<span className="sr-only">Color seleccionado: {value}</span>
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-64 p-3">
				<div className="grid grid-cols-4 gap-2">
					{presetColors.map((color) => (
						<Button
							className="flex h-8 w-8 items-center justify-center p-0"
							key={color}
							onClick={() => handleColorSelect(color)}
							style={{ backgroundColor: color }}
							title={`Color: ${color}`}
							variant="outline"
						>
							{value === color && <span className="text-white text-xs">✓</span>}
						</Button>
					))}
				</div>
			</PopoverContent>
		</Popover>
	);
});

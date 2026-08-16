import { memo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
	className?: string;
	onChange: (value: string) => void;
	value: string;
}

const presetColors = [
	'var(--preset-red)',
	'var(--preset-orange)',
	'var(--preset-yellow)',
	'var(--preset-green)',
	'var(--preset-emerald)',
	'var(--preset-teal)',
	'var(--preset-cyan)',
	'var(--preset-sky)',
	'var(--preset-blue)',
	'var(--preset-indigo)',
	'var(--preset-violet)',
	'var(--preset-purple)',
	'var(--preset-fuchsia)',
	'var(--preset-pink)',
	'var(--preset-rose)',
	'var(--preset-slate)',
];

export const ColorPicker = memo(function ColorPickerImpl({ value, onChange, className }: ColorPickerProps) {
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

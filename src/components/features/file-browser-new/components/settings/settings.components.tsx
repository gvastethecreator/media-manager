import { memo } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PRESET_COLORS } from './settings.constants';
import type { ColorPickerProps, RowProps, SectionProps } from './settings.types';

export const Section = memo(({ icon: Icon, title, color = 'text-foreground', children }: SectionProps) => {
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<Icon className={`h-4 w-4 ${color}`} />
				<span className="font-medium text-foreground text-sm">{title}</span>
			</div>
			<Separator className="my-2" />
			<div className="space-y-2">{children}</div>
		</div>
	);
});

Section.displayName = 'Section';

export const Row = memo(({ children }: RowProps) => {
	return <div className="flex items-center justify-between gap-2 rounded-md bg-muted/30 p-2">{children}</div>;
});

Row.displayName = 'Row';

export const ColorPicker = memo(({ value, onChange }: ColorPickerProps) => {
	return (
		<div className="flex items-center gap-2">
			<input
				className="h-8 w-12 cursor-pointer rounded border-2 border-input bg-background"
				onChange={(e) => onChange(e.target.value)}
				type="color"
				value={value}
			/>
			<Input
				className="h-8 w-28 font-mono text-xs"
				onChange={(e) => onChange(e.target.value)}
				type="text"
				value={value}
			/>
			<Select onValueChange={onChange} value={value}>
				<SelectTrigger className="h-8 w-32">
					<SelectValue placeholder="Preset" />
				</SelectTrigger>
				<SelectContent>
					{PRESET_COLORS.map((preset) => (
						<SelectItem key={preset.value} value={preset.value}>
							<div className="flex items-center gap-2">
								<div className="h-4 w-4 rounded border border-border" style={{ backgroundColor: preset.value }} />
								<span>{preset.label}</span>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
});

ColorPicker.displayName = 'ColorPicker';

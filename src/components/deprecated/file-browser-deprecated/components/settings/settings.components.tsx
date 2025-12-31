import { memo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PRESET_COLORS } from './settings.constants';
import type { ColorPickerProps, RowProps, SectionProps } from './settings.types';

/**
 * Componente Section - Header de sección con ícono, título y separador
 */
export const Section = memo(({ icon: Icon, title, color = 'text-gray-700', children }: SectionProps) => {
	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<Icon className={`h-4 w-4 ${color}`} />
				<span className="font-medium text-gray-700 text-sm dark:text-gray-300">{title}</span>
			</div>
			<Separator className="my-2" />
			<div className="space-y-2">{children}</div>
		</div>
	);
});

Section.displayName = 'Section';

/**
 * Componente Row - Layout de fila para alinear label y control
 */
export const Row = memo(({ children }: RowProps) => {
	return <div className="flex items-center justify-between gap-2 rounded-md bg-muted/30 p-2">{children}</div>;
});

Row.displayName = 'Row';

/**
 * Componente ColorPicker - Selector de color con input, texto y presets
 */
export const ColorPicker = memo(({ value, onChange }: ColorPickerProps) => {
	return (
		<div className="flex items-center gap-2">
			<input
				className="h-8 w-12 cursor-pointer rounded border-2"
				onChange={(e) => onChange(e.target.value)}
				type="color"
				value={value}
			/>
			<input
				className="h-8 w-28 rounded-md border bg-background px-2 font-mono text-gray-600 text-xs dark:text-gray-400"
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
								<div className="h-4 w-4 rounded border" style={{ backgroundColor: preset.value }} />
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

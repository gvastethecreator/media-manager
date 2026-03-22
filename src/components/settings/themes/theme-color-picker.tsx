/**
 * @file Theme Color Picker
 * @module components/settings/themes/theme-color-picker
 * @description Color picker optimizado para editar colores de tema en formato OKLCH
 */

import { Check, Copy, RotateCcw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider-legacy';
import { cn } from '@/lib/utils';

interface ThemeColorPickerProps {
	/** Clase adicional */
	className?: string;
	/** Valor por defecto para reset */
	defaultValue?: string;
	/** Descripción opcional */
	description?: string;
	/** Etiqueta del color */
	label: string;
	/** Callback cuando cambia el color */
	onChange: (value: string) => void;
	/** Valor actual en formato OKLCH */
	value: string;
}

interface OKLCHColor {
	a?: number; // 0-1 (alpha)
	c: number; // 0-0.4 (chroma)
	h: number; // 0-360 (hue)
	l: number; // 0-1 (lightness)
}

/**
 * Parsea un string OKLCH a objeto
 */
function parseOKLCH(value: string): OKLCHColor | null {
	// Formatos: oklch(0.5 0.15 240) o oklch(0.5 0.15 240 / 0.5)
	const match = value.match(/oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\s*\)/);
	if (!match) return null;

	return {
		l: Number.parseFloat(match[1]),
		c: Number.parseFloat(match[2]),
		h: Number.parseFloat(match[3]),
		a: match[4] ? Number.parseFloat(match[4]) : undefined,
	};
}

/**
 * Convierte objeto OKLCH a string
 */
function toOKLCHString(color: OKLCHColor): string {
	const { l, c, h, a } = color;
	if (a !== undefined && a < 1) {
		return `oklch(${l.toFixed(2)} ${c.toFixed(2)} ${h.toFixed(0)} / ${a.toFixed(2)})`;
	}
	return `oklch(${l.toFixed(2)} ${c.toFixed(2)} ${h.toFixed(0)})`;
}

/**
 * Aproxima un color OKLCH a HEX para preview (no es preciso, solo para visualización)
 */
function oklchToApproxHex(color: OKLCHColor): string {
	// Conversión aproximada para visualización
	const { l, c, h } = color;

	// Convertir a aproximado RGB usando fórmulas simplificadas
	const hRad = (h * Math.PI) / 180;
	const a = c * Math.cos(hRad);
	const b = c * Math.sin(hRad);

	// Conversión aproximada L'a'b' -> RGB
	let r = l + 0.396_337_777_4 * a + 0.215_803_757_3 * b;
	let g = l - 0.105_561_345_8 * a - 0.063_854_172_8 * b;
	let bl = l - 0.089_484_177_5 * a - 1.291_485_548 * b;

	// Clamp y convertir a 0-255
	r = Math.round(Math.max(0, Math.min(1, r)) * 255);
	g = Math.round(Math.max(0, Math.min(1, g)) * 255);
	bl = Math.round(Math.max(0, Math.min(1, bl)) * 255);

	return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`;
}

/**
 * Color picker con sliders para OKLCH
 */
export function ThemeColorPicker({
	value,
	onChange,
	label,
	description,
	defaultValue,
	className,
}: ThemeColorPickerProps) {
	const [color, setColor] = useState<OKLCHColor>(() => parseOKLCH(value) || { l: 0.5, c: 0.15, h: 240 });
	const [copied, setCopied] = useState(false);
	const [isOpen, setIsOpen] = useState(false);

	// Sincronizar con valor externo
	useEffect(() => {
		const parsed = parseOKLCH(value);
		if (parsed) {
			setColor(parsed);
		}
	}, [value]);

	const handleColorChange = useCallback(
		(updates: Partial<OKLCHColor>) => {
			const newColor = { ...color, ...updates };
			setColor(newColor);
			onChange(toOKLCHString(newColor));
		},
		[color, onChange]
	);

	const handleCopy = useCallback(() => {
		navigator.clipboard.writeText(value);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	}, [value]);

	const handleReset = useCallback(() => {
		if (defaultValue) {
			onChange(defaultValue);
		}
	}, [defaultValue, onChange]);

	const previewHex = oklchToApproxHex(color);

	return (
		<div className={cn('flex flex-col gap-1', className)}>
			<div className="flex items-center justify-between">
				<Label className="font-medium text-foreground text-xs">{label}</Label>
				{description && <span className="text-[10px] text-muted-foreground">{description}</span>}
			</div>

			<Popover onOpenChange={setIsOpen} open={isOpen}>
				<PopoverTrigger asChild>
					<button
						className={cn(
							'group flex h-9 w-full items-center gap-2 rounded-md border border-border/50 bg-background px-2',
							'hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20',
							'transition-all duration-150'
						)}
						type="button"
					>
						{/* Color preview */}
						<div className="h-5 w-5 shrink-0 rounded border border-border/50" style={{ backgroundColor: value }} />

						{/* Valor */}
						<span className="flex-1 truncate text-left font-mono text-muted-foreground text-xs">{value}</span>

						{/* Indicador */}
						<div className="h-4 w-4 rounded-full bg-muted opacity-0 transition-opacity group-hover:opacity-100" />
					</button>
				</PopoverTrigger>

				<PopoverContent align="start" className="w-80 p-4" side="right">
					<div className="flex flex-col gap-4">
						{/* Header */}
						<div className="flex items-center justify-between">
							<span className="font-medium text-sm">{label}</span>
							<div className="flex items-center gap-1">
								<Button className="h-7 w-7" onClick={handleCopy} size="icon" variant="ghost">
									{copied ? <Check className="h-3.5 w-3.5 text-success-500" /> : <Copy className="h-3.5 w-3.5" />}
								</Button>
								{defaultValue && (
									<Button className="h-7 w-7" onClick={handleReset} size="icon" variant="ghost">
										<RotateCcw className="h-3.5 w-3.5" />
									</Button>
								)}
							</div>
						</div>

						{/* Preview grande */}
						<div className="h-16 w-full rounded-lg border border-border/50" style={{ backgroundColor: value }} />

						{/* Sliders OKLCH */}
						<div className="flex flex-col gap-3">
							{/* Lightness */}
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between">
									<Label className="text-muted-foreground text-xs">Luminosidad (L)</Label>
									<span className="font-mono text-foreground text-xs">{color.l.toFixed(2)}</span>
								</div>
								<Slider
									className="w-full"
									max={1}
									min={0}
									onValueChange={([l]) => handleColorChange({ l })}
									step={0.01}
									value={[color.l]}
								/>
							</div>

							{/* Chroma */}
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between">
									<Label className="text-muted-foreground text-xs">Saturación (C)</Label>
									<span className="font-mono text-foreground text-xs">{color.c.toFixed(2)}</span>
								</div>
								<Slider
									className="w-full"
									max={0.4}
									min={0}
									onValueChange={([c]) => handleColorChange({ c })}
									step={0.01}
									value={[color.c]}
								/>
							</div>

							{/* Hue */}
							<div className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between">
									<Label className="text-muted-foreground text-xs">Tono (H)</Label>
									<span className="font-mono text-foreground text-xs">{color.h.toFixed(0)}°</span>
								</div>
								<div
									className="h-3 w-full rounded-md"
									style={{
										background:
											'linear-gradient(to right, oklch(0.7 0.2 0), oklch(0.7 0.2 60), oklch(0.7 0.2 120), oklch(0.7 0.2 180), oklch(0.7 0.2 240), oklch(0.7 0.2 300), oklch(0.7 0.2 360))',
									}}
								/>
								<Slider
									className="w-full"
									max={360}
									min={0}
									onValueChange={([h]) => handleColorChange({ h })}
									step={1}
									value={[color.h]}
								/>
							</div>

							{/* Alpha (opcional) */}
							{color.a !== undefined && (
								<div className="flex flex-col gap-1.5">
									<div className="flex items-center justify-between">
										<Label className="text-muted-foreground text-xs">Opacidad (A)</Label>
										<span className="font-mono text-foreground text-xs">{(color.a * 100).toFixed(0)}%</span>
									</div>
									<Slider
										className="w-full"
										max={1}
										min={0}
										onValueChange={([a]) => handleColorChange({ a })}
										step={0.01}
										value={[color.a]}
									/>
								</div>
							)}
						</div>

						{/* Input manual */}
						<div className="flex flex-col gap-1.5">
							<Label className="text-muted-foreground text-xs">Valor OKLCH</Label>
							<Input
								className="font-mono text-xs"
								onChange={(e) => onChange(e.target.value)}
								placeholder="oklch(0.5 0.15 240)"
								value={value}
							/>
						</div>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}

/**
 * Preset de colores comunes para selección rápida
 */
export const COLOR_PRESETS = [
	{ name: 'Azul', value: 'oklch(0.55 0.18 240)' },
	{ name: 'Verde', value: 'oklch(0.6 0.18 145)' },
	{ name: 'Rojo', value: 'oklch(0.6 0.24 25)' },
	{ name: 'Amarillo', value: 'oklch(0.75 0.18 85)' },
	{ name: 'Rosa', value: 'oklch(0.7 0.2 350)' },
	{ name: 'Púrpura', value: 'oklch(0.55 0.2 280)' },
	{ name: 'Cyan', value: 'oklch(0.65 0.15 195)' },
	{ name: 'Naranja', value: 'oklch(0.7 0.19 45)' },
	{ name: 'Teal', value: 'oklch(0.55 0.15 180)' },
	{ name: 'Gris', value: 'oklch(0.55 0.01 0)' },
	{ name: 'Blanco', value: 'oklch(0.98 0 0)' },
	{ name: 'Negro', value: 'oklch(0.1 0 0)' },
];

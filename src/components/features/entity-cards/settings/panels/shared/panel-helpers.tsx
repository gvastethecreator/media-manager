'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Componente para una opción de configuración con toggle/switch
 */
export function ToggleOption({
	id,
	label,
	description,
	checked,
	onCheckedChange,
	icon,
	disabled = false,
}: {
	id: string;
	label: string;
	description?: string;
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
	icon?: ReactNode;
	disabled?: boolean;
}) {
	return (
		<div className="flex items-center justify-between space-x-3">
			<Label
				htmlFor={id}
				className={cn('text-[11px] flex items-center cursor-pointer gap-1.5', disabled && 'opacity-50')}
			>
				{icon}
				{label}
				{description && (
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger asChild>
								<Info className="h-3 w-3 text-muted-foreground" />
							</TooltipTrigger>
							<TooltipContent className="text-xs max-w-xs">{description}</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				)}
			</Label>
			<Switch id={id} checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
		</div>
	);
}

/**
 * Componente para una opción de configuración con slider
 */
export function SliderOption({
	id,
	label,
	description,
	value,
	onValueChange,
	min = 0,
	max = 100,
	step = 1,
	disabled = false,
	unit = '',
	icon,
}: {
	id: string;
	label: string;
	description?: string;
	value: number;
	onValueChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	unit?: string;
	icon?: ReactNode;
}) {
	return (
		<div className={cn('space-y-1.5', disabled && 'opacity-50 pointer-events-none')}>
			<div className="flex items-center justify-between">
				<Label htmlFor={id} className="text-[11px] flex items-center gap-1.5">
					{icon}
					{label}
					{description && (
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<Info className="h-3 w-3 text-muted-foreground" />
								</TooltipTrigger>
								<TooltipContent className="text-xs max-w-xs">{description}</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					)}
				</Label>
				<span className="text-[10px] font-mono text-muted-foreground">
					{value}
					{unit}
				</span>
			</div>
			<Slider
				id={id}
				min={min}
				max={max}
				step={step}
				value={[value]}
				onValueChange={(values) => onValueChange(values[0])}
				className="cursor-pointer"
				disabled={disabled}
			/>
		</div>
	);
}

/**
 * Objeto con esquemas de colores para diferentes paneles
 */
export const panelColors = {
	visual: {
		bg: 'bg-indigo-500/5',
		border: 'border-indigo-500/20',
		text: 'text-indigo-600',
		highlight: 'bg-indigo-500/10',
	},
	design: {
		bg: 'bg-emerald-500/5',
		border: 'border-emerald-500/20',
		text: 'text-emerald-600',
		highlight: 'bg-emerald-500/10',
	},
	performance: {
		bg: 'bg-amber-500/5',
		border: 'border-amber-500/20',
		text: 'text-amber-600',
		highlight: 'bg-amber-500/10',
	},
	states: {
		bg: 'bg-orange-500/5',
		border: 'border-orange-500/20',
		text: 'text-orange-600',
		highlight: 'bg-orange-500/10',
	},
	system: {
		bg: 'bg-violet-500/5',
		border: 'border-violet-500/20',
		text: 'text-violet-600',
		highlight: 'bg-violet-500/10',
	},
	advanced: {
		bg: 'bg-cyan-500/5',
		border: 'border-cyan-500/20',
		text: 'text-cyan-600',
		highlight: 'bg-cyan-500/10',
	},
	images: {
		bg: 'bg-rose-500/5',
		border: 'border-rose-500/20',
		text: 'text-rose-600',
		highlight: 'bg-rose-500/10',
	},
};

/**
 * Función para manejar cambios en las opciones de CardOptions
 */
export function createOptionChangeHandler<T extends Record<string, unknown>>(
	options: T,
	onChange: (newOptions: T) => void
) {
	return (key: keyof T, value: unknown) => {
		onChange({
			...options,
			[key]: value,
		});
	};
}

/**
 * Función para manejar cambios en subopciones anidadas
 */
export function createNestedOptionChangeHandler<T extends Record<string, unknown>>(
	options: T,
	onChange: (newOptions: T) => void,
	nestedKey: keyof T
) {
	return (key: string, value: unknown) => {
		// Si la opción anidada no existe, la creamos
		const nestedOptions = options[nestedKey] || {};

		onChange({
			...options,
			[nestedKey]: {
				...(nestedOptions as Record<string, unknown>),
				[key]: value,
			},
		});
	};
}

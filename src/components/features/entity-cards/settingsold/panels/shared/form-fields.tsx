'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Propiedades comunes para todos los campos de formulario
 */
interface BaseFormFieldProps {
	id: string;
	label: string;
	description?: string;
	icon?: ReactNode;
	disabled?: boolean;
	className?: string;
	error?: string;
	colorScheme?: string;
}

/**
 * Componente para una opción de configuración con toggle/switch
 */
export function FormToggle({
	id,
	label,
	description,
	checked,
	onCheckedChange,
	icon,
	disabled = false,
	className,
	error,
	colorScheme,
}: BaseFormFieldProps & {
	checked: boolean;
	onCheckedChange: (checked: boolean) => void;
}) {
	return (
		<div className={cn('flex items-center justify-between space-x-3', className)}>
			<Label
				htmlFor={id}
				className={cn(
					'text-[11px] flex items-center cursor-pointer gap-1.5',
					disabled && 'opacity-50',
					colorScheme && `text-${colorScheme}-600`
				)}
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
			{error && <p className="text-[10px] text-destructive">{error}</p>}
		</div>
	);
}

/**
 * Componente para una opción de configuración con slider
 */
export function FormSlider({
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
	className,
	error,
	colorScheme,
}: BaseFormFieldProps & {
	value: number;
	onValueChange: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	unit?: string;
}) {
	return (
		<div className={cn('space-y-1.5', disabled && 'opacity-50 pointer-events-none', className)}>
			<div className="flex items-center justify-between">
				<Label
					htmlFor={id}
					className={cn('text-[11px] flex items-center gap-1.5', colorScheme && `text-${colorScheme}-600`)}
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
			{error && <p className="text-[10px] text-destructive">{error}</p>}
		</div>
	);
}

/**
 * Componente para una opción de configuración con campo de entrada de texto
 */
export function FormInput({
	id,
	label,
	description,
	value,
	onChange,
	placeholder,
	type = 'text',
	disabled = false,
	icon,
	className,
	error,
	colorScheme,
}: BaseFormFieldProps & {
	value: string;
	onChange: (value: string) => void;
	placeholder?: string;
	type?: string;
}) {
	return (
		<div className={cn('space-y-1.5', className)}>
			<Label
				htmlFor={id}
				className={cn(
					'text-[11px] flex items-center gap-1.5',
					disabled && 'opacity-50',
					colorScheme && `text-${colorScheme}-600`
				)}
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
			<Input
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder={placeholder}
				type={type}
				disabled={disabled}
				className="h-8 text-xs"
			/>
			{error && <p className="text-[10px] text-destructive">{error}</p>}
		</div>
	);
}

/**
 * Componente para una opción de configuración con campo de selección
 */
export function FormSelect({
	id,
	label,
	description,
	value,
	onValueChange,
	options,
	disabled = false,
	icon,
	className,
	error,
	colorScheme,
	placeholder = 'Seleccionar...',
}: BaseFormFieldProps & {
	value: string;
	onValueChange: (value: string) => void;
	options: { value: string; label: string }[];
	placeholder?: string;
}) {
	return (
		<div className={cn('space-y-1.5', className)}>
			<Label
				htmlFor={id}
				className={cn(
					'text-[11px] flex items-center gap-1.5',
					disabled && 'opacity-50',
					colorScheme && `text-${colorScheme}-600`
				)}
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
			<Select value={value} onValueChange={onValueChange} disabled={disabled}>
				<SelectTrigger id={id} className="h-8 text-xs">
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{options.map((option) => (
						<SelectItem key={option.value} value={option.value} className="text-xs">
							{option.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
			{error && <p className="text-[10px] text-destructive">{error}</p>}
		</div>
	);
}

/**
 * Componente para mostrar una alerta con información o error
 */
export function FormAlert({
	message,
	type = 'info',
	className,
}: {
	message: string;
	type?: 'info' | 'warning' | 'error' | 'success';
	className?: string;
}) {
	const colors = {
		info: 'bg-blue-50 text-blue-800 border-blue-200',
		warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
		error: 'bg-red-50 text-red-800 border-red-200',
		success: 'bg-green-50 text-green-800 border-green-200',
	};

	return <div className={cn('text-[10px] p-2 rounded border', colors[type], className)}>{message}</div>;
}

// Exportar componentes heredados para compatibilidad
export { ToggleOption, SliderOption } from './panel-helpers';

'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { cva } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { panelColors } from './panel-helpers';

/**
 * Variantes de layout para el contenedor del formulario
 */
const formLayoutVariants = cva('rounded-lg transition-all duration-300', {
	variants: {
		variant: {
			default: 'bg-card border',
			colored: 'border',
		},
		size: {
			sm: 'p-3',
			md: 'p-4',
			lg: 'p-6',
		},
	},
	defaultVariants: {
		variant: 'default',
		size: 'md',
	},
});

/**
 * Props para el componente FormLayout
 */
export interface FormLayoutProps {
	children: ReactNode;
	title?: string;
	description?: string;
	colorScheme?: keyof typeof panelColors;
	variant?: 'default' | 'colored';
	size?: 'sm' | 'md' | 'lg';
	className?: string;
	footer?: ReactNode;
	maxHeight?: number | string;
	showScrollbar?: boolean;
	withAnimation?: boolean;
	actions?: ReactNode;
	id?: string;
}

/**
 * Componente FormLayout para estandarizar la estructura de formularios
 * @param {FormLayoutProps} props - Propiedades del componente
 * @returns {JSX.Element} Componente de layout para formularios
 */
export function FormLayout({
	children,
	title,
	description,
	colorScheme,
	variant = 'default',
	size = 'md',
	className,
	footer,
	maxHeight,
	showScrollbar = true,
	withAnimation = true,
	actions,
	id,
}: FormLayoutProps): JSX.Element {
	// Determinamos las clases CSS según las props
	const containerClasses = cn(
		formLayoutVariants({ variant, size }),
		colorScheme && variant === 'colored' && panelColors[colorScheme].bg,
		colorScheme && variant === 'colored' && panelColors[colorScheme].border,
		withAnimation && 'animate-form-appear',
		className
	);

	// Determinamos si usar Card o div simple según si hay título
	if (title) {
		return (
			<Card className={containerClasses} id={id}>
				<CardHeader className={cn('px-4 py-3', size === 'sm' && 'px-3 py-2', size === 'lg' && 'px-5 py-4')}>
					<div className="flex justify-between items-center">
						<CardTitle
							className={cn(
								'text-sm font-medium',
								size === 'sm' && 'text-xs',
								size === 'lg' && 'text-base',
								colorScheme && panelColors[colorScheme].text
							)}
						>
							{title}
						</CardTitle>
						{actions}
					</div>
					{description && <CardDescription className="text-xs text-muted-foreground">{description}</CardDescription>}
				</CardHeader>
				<CardContent className={cn('px-4 pt-0 pb-3', size === 'sm' && 'px-3 pb-2', size === 'lg' && 'px-5 pb-4')}>
					{maxHeight ? (
						<ScrollArea className={cn('pr-3', !showScrollbar && 'scrollbar-none')} style={{ maxHeight }}>
							<div className="pr-3">{children}</div>
						</ScrollArea>
					) : (
						children
					)}
				</CardContent>
				{footer && (
					<CardFooter
						className={cn(
							'px-4 py-3 border-t',
							size === 'sm' && 'px-3 py-2',
							size === 'lg' && 'px-5 py-4',
							colorScheme && panelColors[colorScheme].border
						)}
					>
						{footer}
					</CardFooter>
				)}
			</Card>
		);
	}

	// Versión simplificada sin Card (solo contenedor)
	return (
		<div className={containerClasses} id={id}>
			{maxHeight ? (
				<ScrollArea className={cn('pr-3', !showScrollbar && 'scrollbar-none')} style={{ maxHeight }}>
					<div className="pr-3">{children}</div>
				</ScrollArea>
			) : (
				children
			)}
		</div>
	);
}

/**
 * Componente FormSection para agrupar campos relacionados
 */
export function FormSection({
	children,
	title,
	description,
	className,
	colorScheme,
	withSeparator = true,
}: {
	children: ReactNode;
	title?: string;
	description?: string;
	className?: string;
	colorScheme?: keyof typeof panelColors;
	withSeparator?: boolean;
}) {
	return (
		<div className={cn('space-y-3', className)}>
			{title && (
				<div className="space-y-0.5">
					<h4 className={cn('text-xs font-medium', colorScheme && panelColors[colorScheme].text)}>{title}</h4>
					{description && <p className="text-[10px] text-muted-foreground">{description}</p>}
				</div>
			)}
			<div className="space-y-3">{children}</div>
			{withSeparator && <div className="h-0.5 w-full border-t border-border my-3" />}
		</div>
	);
}

/**
 * Componente FormRow para distribuir campos en filas
 */
export function FormRow({
	children,
	className,
	cols = 2,
	gap = 3,
}: {
	children: ReactNode;
	className?: string;
	cols?: 1 | 2 | 3 | 4;
	gap?: 1 | 2 | 3 | 4 | 5;
}) {
	const gridCols = {
		1: 'grid-cols-1',
		2: 'grid-cols-2',
		3: 'grid-cols-3',
		4: 'grid-cols-4',
	};

	const gridGap = {
		1: 'gap-1',
		2: 'gap-2',
		3: 'gap-3',
		4: 'gap-4',
		5: 'gap-5',
	};

	return <div className={cn(`grid ${gridCols[cols]} ${gridGap[gap]}`, className)}>{children}</div>;
}

/**
 * Componente FormGroup para agrupar lógicamente campos de formulario
 */
export function FormGroup({
	children,
	title,
	description,
	colorScheme,
	className,
}: {
	children: ReactNode;
	title?: string;
	description?: string;
	colorScheme?: keyof typeof panelColors;
	className?: string;
}) {
	return (
		<div
			className={cn(
				'p-3 rounded-md border',
				colorScheme && panelColors[colorScheme].border,
				colorScheme && panelColors[colorScheme].bg,
				className
			)}
		>
			{title && (
				<div className="mb-2">
					<h5 className={cn('text-[11px] font-medium', colorScheme && panelColors[colorScheme].text)}>{title}</h5>
					{description && <p className="text-[10px] text-muted-foreground mt-0.5">{description}</p>}
				</div>
			)}
			<div className="space-y-2.5">{children}</div>
		</div>
	);
}

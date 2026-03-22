/**
 * @file Settings Card Component
 * @module components/settings/modern/settings-card
 * @description Tarjeta reutilizable para secciones de configuración
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SettingsCardProps {
	/** Hijos de la tarjeta */
	children: React.ReactNode;
	/** Clases adicionales */
	className?: string;
	/** Color del icono/borde */
	color?: string;
	/** Descripción opcional */
	description?: string;
	/** Icono opcional para la tarjeta */
	icon?: React.ReactNode;
	/** Título de la sección */
	title: string;
	/** Variantes de estilo */
	variant?: 'default' | 'outlined' | 'elevated';
}

/**
 * Tarjeta de configuración con icono, título y contenido
 * Variantes: default, outlined, elevated
 */
export const SettingsCard = React.forwardRef<HTMLDivElement, SettingsCardProps>(
	({ icon, title, description, className, children, variant = 'default', color, ...props }, ref) => {
		const variants = {
			default: 'bg-card border',
			outlined: 'bg-transparent border border-muted/30',
			elevated: 'bg-card border shadow-dt-1',
		};

		return (
			<div
				className={cn(
					'flex flex-col gap-3 rounded-lg p-4 transition-all duration-200',
					'hover:border-border/40',
					variants[variant],
					className
				)}
				ref={ref}
				style={color ? { borderColor: `color-mix(in oklch, ${color} 8%, transparent)` } : undefined}
				{...props}
			>
				{/* Header con Icono y Título */}
				{(icon || title || description) && (
					<div className="flex items-start gap-3">
						{icon && (
							<div
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
								style={{
									backgroundColor: color ? `color-mix(in oklch, ${color} 6%, transparent)` : 'var(--muted)',
								}}
							>
								<div className="h-5 w-5" style={{ color: color || 'var(--muted-foreground)' }}>
									{icon}
								</div>
							</div>
						)}
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<h3 className="font-semibold text-foreground text-sm leading-none">{title}</h3>
							{description && <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>}
						</div>
					</div>
				)}

				{/* Contenido de la tarjeta */}
				<div className="flex flex-col gap-4">{children}</div>
			</div>
		);
	}
);

SettingsCard.displayName = 'SettingsCard';

/**
 * Componente de fila dentro de SettingsCard
 * Útil para opciones individuales con toggle/input
 */
export interface SettingsRowProps {
	border?: boolean;
	children: React.ReactNode;
	description?: string;
	label: string;
}

export const SettingsRow = ({ label, description, children, border = false }: SettingsRowProps) => {
	return (
		<div
			className={cn(
				'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
				border && 'border-border/50 border-b pb-4'
			)}
		>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<span className="font-medium text-foreground text-sm">{label}</span>
				{description && <span className="text-muted-foreground text-xs">{description}</span>}
			</div>
			<div className="shrink-0">{children}</div>
		</div>
	);
};

/**
 * Componente de grupo de opciones
 * Múltiples SettingsRow dentro de un contenedor
 */
export interface SettingsGroupProps {
	children: React.ReactNode;
	title?: string;
}

export const SettingsGroup = ({ title, children }: SettingsGroupProps) => {
	return (
		<div className="flex flex-col gap-4">
			{title && <h4 className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">{title}</h4>}
			<div className="flex flex-col gap-3">{children}</div>
		</div>
	);
};

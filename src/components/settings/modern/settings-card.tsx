/**
 * @file Settings Card Component
 * @module components/settings/modern/settings-card
 * @description Tarjeta reutilizable para secciones de configuración
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SettingsCardProps {
	/** Icono opcional para la tarjeta */
	icon?: React.ReactNode;
	/** Título de la sección */
	title: string;
	/** Descripción opcional */
	description?: string;
	/** Clases adicionales */
	className?: string;
	/** Hijos de la tarjeta */
	children: React.ReactNode;
	/** Variantes de estilo */
	variant?: 'default' | 'outlined' | 'elevated';
	/** Color del icono/borde */
	color?: string;
}

/**
 * Tarjeta de configuración con icono, título y contenido
 * Variantes: default, outlined, elevated
 */
export const SettingsCard = React.forwardRef<HTMLDivElement, SettingsCardProps>(
	({ icon, title, description, className, children, variant = 'default', color, ...props }, ref) => {
		const variants = {
			default: 'bg-card border',
			outlined: 'bg-transparent border-2 border-muted/30',
			elevated: 'bg-card border shadow-md',
		};

		return (
			<div
				ref={ref}
				className={cn(
					'flex flex-col gap-4 rounded-xl p-6 transition-all duration-200',
					'hover:border-border/60',
					variants[variant],
					className
				)}
				style={color ? { borderColor: color + '20' } : undefined}
				{...props}
			>
				{/* Header con Icono y Título */}
				{(icon || title || description) && (
					<div className="flex items-start gap-3">
						{icon && (
							<div
								className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
								style={{
									backgroundColor: color ? `${color}15` : 'var(--muted)',
								}}
							>
								<div className="h-5 w-5" style={{ color: color || 'var(--muted-foreground)' }}>
									{icon}
								</div>
							</div>
						)}
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<h3 className="text-sm font-semibold leading-none text-foreground">{title}</h3>
							{description && (
								<p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
							)}
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
	label: string;
	description?: string;
	children: React.ReactNode;
	border?: boolean;
}

export const SettingsRow = ({ label, description, children, border = false }: SettingsRowProps) => {
	return (
		<div
			className={cn(
				'flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4',
				border && 'border-b border-border/50 pb-4'
			)}
		>
			<div className="flex min-w-0 flex-1 flex-col gap-1">
				<span className="text-sm font-medium text-foreground">{label}</span>
				{description && <span className="text-xs text-muted-foreground">{description}</span>}
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
	title?: string;
	children: React.ReactNode;
}

export const SettingsGroup = ({ title, children }: SettingsGroupProps) => {
	return (
		<div className="flex flex-col gap-4">
			{title && <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>}
			<div className="flex flex-col gap-3">{children}</div>
		</div>
	);
};

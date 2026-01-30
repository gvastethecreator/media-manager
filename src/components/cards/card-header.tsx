import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardHeaderProps {
	title: string;
	subtitle?: string;
	icon?: ReactNode;
	emoji?: string;
	primaryColor: string;
	className?: string;
	compact?: boolean;
	children?: ReactNode;
}

/**
 * Componente de encabezado para tarjetas de entidades
 * Similar al encabezado de una carta Magic con título, subtítulo e icono
 */
export function CardHeader({
	title,
	subtitle,
	icon,
	emoji,
	primaryColor,
	className,
	compact,
	children,
}: CardHeaderProps) {
	return (
		<div
			className={cn('flex items-center gap-2 border-b', compact ? 'px-2 py-1' : 'px-3 py-2', className)}
			style={{
				borderColor: `color-mix(in oklab, ${primaryColor}, transparent 60%)`,
				background: `linear-gradient(135deg, color-mix(in oklab, ${primaryColor}, transparent 75%), color-mix(in oklab, ${primaryColor}, transparent 85%))`,
			}}
		>
			{/* Emoji o icono si está presente */}
			{emoji && (
				<div className="flex-shrink-0">
					<span className={compact ? 'text-base' : 'text-lg'}>{emoji}</span>
				</div>
			)}
			{!emoji && icon && (
				<div
					className="flex-shrink-0 rounded-full p-1"
					style={{ backgroundColor: `color-mix(in oklab, ${primaryColor}, transparent 70%)` }}
				>
					{icon}
				</div>
			)}

			{/* Contenido de texto */}
			<div className="min-w-0 flex-1">
				{/* Título principal */}
				<h3 className={cn('truncate font-bold', compact ? 'text-base' : 'text-lg')} style={{ color: primaryColor }}>
					{title}
				</h3>

				{/* Subtítulo opcional - solo si no es compact */}
				{!compact && subtitle && <p className="truncate text-muted-foreground text-sm capitalize">{subtitle}</p>}
			</div>
		</div>
	);
}

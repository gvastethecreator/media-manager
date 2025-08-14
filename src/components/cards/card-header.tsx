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
}

/**
 * Componente de encabezado para tarjetas de entidades
 * Similar al encabezado de una carta Magic con título, subtítulo e icono
 */
export function CardHeader({ title, subtitle, icon, emoji, primaryColor, className, compact }: CardHeaderProps) {
	return (
		<div
			className={cn('flex items-center gap-2 border-b', compact ? 'px-2 py-1' : 'px-3 py-2', className)}
			style={{
				borderColor: `${primaryColor}40`,
				background: `linear-gradient(135deg, ${primaryColor}25, ${primaryColor}15)`,
			}}
		>
			{/* Emoji o icono si está presente */}
			{emoji && (
				<div className="flex-shrink-0">
					<span className={compact ? 'text-sm' : 'text-base'}>{emoji}</span>
				</div>
			)}
			{!emoji && icon && (
				<div className="flex-shrink-0 rounded-full p-1" style={{ backgroundColor: `${primaryColor}30` }}>
					{icon}
				</div>
			)}

			{/* Contenido de texto */}
			<div className="min-w-0 flex-1">
				{/* Título principal */}
				<h3 className={cn('truncate font-bold', compact ? 'text-sm' : 'text-base')} style={{ color: primaryColor }}>
					{title}
				</h3>

				{/* Subtítulo opcional - solo si no es compact */}
				{!compact && subtitle && <p className="truncate text-muted-foreground text-xs capitalize">{subtitle}</p>}
			</div>
		</div>
	);
}

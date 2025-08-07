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
			className={cn('border-b px-3 py-2', 'flex items-center gap-2', className)}
			style={{
				borderColor: `${primaryColor}40`,
				background: `linear-gradient(135deg, ${primaryColor}25, ${primaryColor}15)`,
			}}
		>
			{/* Icono si está presente */}
			{icon && (
				<div className="flex-shrink-0 rounded-full p-1" style={{ backgroundColor: `${primaryColor}30` }}>
					{icon}
				</div>
			)}

			{/* Contenido de texto */}
			<div className="min-w-0 flex-1">
				{/* Título principal */}
				<h3 className="truncate font-bold text-base" style={{ color: primaryColor }}>
					{title}
				</h3>

				{/* Subtítulo opcional */}
				{subtitle && <p className="truncate text-muted-foreground text-xs capitalize">{subtitle}</p>}
			</div>
		</div>
	);
}

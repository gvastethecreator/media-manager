'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardHeaderProps {
	title: string;
	subtitle?: string;
	icon?: ReactNode;
	primaryColor: string;
	className?: string;
}

/**
 * Componente de encabezado para tarjetas de entidades
 * Similar al encabezado de una carta Magic con título, subtítulo e icono
 */
export function CardHeader({ title, subtitle, icon, primaryColor, className }: CardHeaderProps) {
	return (
		<div
			className={cn('px-3 py-2 border-b', 'flex items-center gap-2', className)}
			style={{
				borderColor: `${primaryColor}40`,
				background: `linear-gradient(135deg, ${primaryColor}25, ${primaryColor}15)`,
			}}
		>
			{/* Icono si está presente */}
			{icon && (
				<div className="flex-shrink-0 p-1 rounded-full" style={{ backgroundColor: `${primaryColor}30` }}>
					{icon}
				</div>
			)}

			{/* Contenido de texto */}
			<div className="flex-1 min-w-0">
				{/* Título principal */}
				<h3 className="font-bold text-base truncate" style={{ color: primaryColor }}>
					{title}
				</h3>

				{/* Subtítulo opcional */}
				{subtitle && <p className="text-xs text-muted-foreground truncate capitalize">{subtitle}</p>}
			</div>
		</div>
	);
}

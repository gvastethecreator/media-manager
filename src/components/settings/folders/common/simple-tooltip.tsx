import type { ReactNode } from 'react';
import { memo } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * 🔧 TOOLTIP WRAPPER REUTILIZABLE OPTIMIZADO
 *
 * IMPORTANTE: Requiere un TooltipProvider en un nivel superior
 * Eliminamos el provider interno para evitar renders excesivos
 */

interface SimpleTooltipProps {
	align?: 'start' | 'center' | 'end';
	children: ReactNode;
	className?: string;
	content: string | ReactNode;
	side?: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Tooltip optimizado que NO incluye TooltipProvider (debe estar en nivel superior)
 */
export const SimpleTooltip = memo(function SimpleTooltip({
	children,
	content,
	side = 'top',
	align = 'center',
	className,
}: SimpleTooltipProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>{children}</TooltipTrigger>
			<TooltipContent align={align} className={className} side={side}>
				{content}
			</TooltipContent>
		</Tooltip>
	);
});

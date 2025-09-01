import type { ReactNode } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * 🔧 TOOLTIP WRAPPER REUTILIZABLE
 * Elimina la duplicación de TooltipProvider en cada botón
 */

interface SimpleTooltipProps {
	children: ReactNode;
	content: string | ReactNode;
	side?: 'top' | 'bottom' | 'left' | 'right';
	align?: 'start' | 'center' | 'end';
	className?: string;
}

/**
 * Tooltip simple que incluye su propio provider
 */
export function SimpleTooltip({ children, content, side = 'top', align = 'center', className }: SimpleTooltipProps) {
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent align={align} className={className} side={side}>
					{content}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}

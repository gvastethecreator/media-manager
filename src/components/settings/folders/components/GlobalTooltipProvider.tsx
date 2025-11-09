import { memo } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';

// OPTIMIZACIÓN: Provider global de tooltips para evitar 3400+ renders
export const GlobalTooltipProvider = memo(function GlobalTooltipProvider({ children }: { children: React.ReactNode }) {
	return (
		<TooltipProvider delayDuration={300} skipDelayDuration={100}>
			{children}
		</TooltipProvider>
	);
});

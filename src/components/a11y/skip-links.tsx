/**
 * @file Skip Links para accesibilidad
 * @description Navegación por teclado para saltar al contenido principal
 */

import { useCallback } from 'react';
import { cn } from '@/lib/utils';

interface SkipLink {
	/** Texto del enlace */
	label: string;
	/** ID del elemento destino */
	to: string;
}

interface SkipLinksProps {
	/** Clases adicionales */
	className?: string;
	/** Links configurables */
	links?: SkipLink[];
}

/**
 * Skip Links para navegación accesible por teclado
 * Permite a usuarios de teclado saltar directamente al contenido principal
 *
 * @example
 * ```tsx
 * <SkipLinks links={[
 *   { to: 'main-content', label: 'Saltar al contenido principal' },
 *   { to: 'navigation', label: 'Saltar a navegación' },
 * ]} />
 * ```
 */
export function SkipLinks({
	links = [
		{ to: 'main-content', label: 'Skip to main content' },
		{ to: 'navigation', label: 'Skip to navigation' },
	],
	className,
}: SkipLinksProps) {
	const handleClick = useCallback((to: string) => {
		const element = document.getElementById(to);
		if (element) {
			element.focus();
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
	}, []);

	return (
		<div
			aria-label="Quick navigation links"
			className={cn('fixed top-4 left-4 z-[9999] flex flex-col gap-2', className)}
			role="region"
		>
			{links.map((link) => (
				<button
					className={cn(
						'sr-only rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm',
						'shadow-lg ring-2 ring-primary ring-offset-2 ring-offset-background',
						'focus:not-sr-only focus:absolute focus:outline-none focus:ring-2 focus:ring-primary',
						'transition-colors hover:bg-primary/90'
					)}
					key={link.to}
					onClick={() => handleClick(link.to)}
					type="button"
				>
					{link.label}
				</button>
			))}
		</div>
	);
}

export default SkipLinks;

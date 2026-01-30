/**
 * @file Skip Links para accesibilidad
 * @description Navegación por teclado para saltar al contenido principal
 */

import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface SkipLink {
	/** ID del elemento destino */
	to: string;
	/** Texto del enlace */
	label: string;
}

interface SkipLinksProps {
	/** Links configurables */
	links?: SkipLink[];
	/** Clases adicionales */
	className?: string;
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
		{ to: 'main-content', label: 'Saltar al contenido principal' },
		{ to: 'navigation', label: 'Saltar a navegación' },
	],
	className,
}: SkipLinksProps) {
	const [isVisible, setIsVisible] = useState(false);

	// Mostrar skip links al presionar Tab
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Tab' && !e.shiftKey) {
				setIsVisible(true);
			}
		};

		const handleClick = () => {
			setIsVisible(false);
		};

		document.addEventListener('keydown', handleKeyDown);
		document.addEventListener('click', handleClick);

		return () => {
			document.removeEventListener('keydown', handleKeyDown);
			document.removeEventListener('click', handleClick);
		};
	}, []);

	const handleClick = useCallback((to: string) => {
		const element = document.getElementById(to);
		if (element) {
			element.focus();
			element.scrollIntoView({ behavior: 'smooth', block: 'start' });
		}
		setIsVisible(false);
	}, []);

	return (
		<div
			aria-label="Enlaces de navegación rápida"
			className={cn(
				'fixed top-4 left-4 z-[9999] flex flex-col gap-2 transition-all duration-200',
				isVisible ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0',
				className
			)}
			role="region"
		>
			{links.map((link) => (
				<button
					className={cn(
						'rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm',
						'shadow-lg ring-2 ring-primary ring-offset-2 ring-offset-background',
						'focus:outline-none focus:ring-2 focus:ring-primary',
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

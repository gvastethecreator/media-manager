/**
 * @file SkipLink Component
 * @module components/ui/skip-link
 * @description Enlace para saltar al contenido principal (A11y)
 * WCAG 2.4.1 - Bypass Blocks
 */

import { cn } from '@/lib/utils';

interface SkipLinkProps {
	/** ID del elemento principal al que saltar */
	targetId?: string;
	/** Texto del enlace */
	children?: React.ReactNode;
	/** Clases adicionales */
	className?: string;
}

/**
 * SkipLink - Permite a usuarios de teclado saltar navegación repetitiva
 *
 * @example
 * <SkipLink targetId="main-content" />
 *
 * <nav>...</nav>
 * <main id="main-content">...</main>
 */
export function SkipLink({
	targetId = 'main-content',
	children = 'Saltar al contenido principal',
	className,
}: SkipLinkProps) {
	const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		const target = document.getElementById(targetId);
		if (target) {
			target.tabIndex = -1;
			target.focus();
			// Scroll suave
			target.scrollIntoView({ behavior: 'smooth' });
		}
	};

	return (
		<a
			href={`#${targetId}`}
			onClick={handleClick}
			className={cn(
				// Por defecto oculto
				'sr-only',
				// Visible cuando tiene foco
				'focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100]',
				// Estilos visuales cuando es visible
				'focus:flex focus:items-center focus:gap-2',
				'focus:rounded-dt-sm focus:border-2 focus:border-primary focus:bg-background',
				'focus:px-4 focus:py-3 focus:shadow-dt-3',
				'focus:text-foreground focus:font-medium',
				// Animación suave
				'focus:transition-all focus:duration-dt-fast',
				className
			)}
		>
			{children}
		</a>
	);
}

/**
 * Target para el SkipLink
 * Marca el inicio del contenido principal
 */
export function SkipLinkTarget({ id = 'main-content' }: { id?: string }) {
	return <div id={id} tabIndex={-1} className="outline-none" aria-label="Contenido principal" />;
}

export default SkipLink;

import { Slot } from '@radix-ui/react-slot';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import * as React from 'react';

import { cn } from '@/lib/utils';

const Breadcrumb = React.forwardRef<
	HTMLElement,
	React.ComponentPropsWithoutRef<'nav'> & {
		separator?: React.ReactNode;
	}
>(({ ...props }, ref) => <nav aria-label="breadcrumb" ref={ref} {...props} />);
Breadcrumb.displayName = 'Breadcrumb';

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.ComponentPropsWithoutRef<'ol'>>(
	({ className, ...props }, ref) => (
		<ol
			className={cn(
				'flex flex-wrap items-center gap-1.5 break-words text-muted-foreground text-sm sm:gap-2.5',
				className
			)}
			ref={ref}
			{...props}
		/>
	)
);
BreadcrumbList.displayName = 'BreadcrumbList';

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
	({ className, ...props }, ref) => (
		<li className={cn('inline-flex items-center gap-1.5', className)} ref={ref} {...props} />
	)
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

/**
 * BreadcrumbLink con Design Tokens v2
 * - Focus visible mejorado para accesibilidad
 * - Transiciones suaves
 * - Underline animado en hover
 */
const BreadcrumbLink = React.forwardRef<
	HTMLAnchorElement,
	React.ComponentPropsWithoutRef<'a'> & {
		asChild?: boolean;
	}
>(({ asChild, className, ...props }, ref) => {
	const Comp = asChild ? Slot : 'a';

	return (
		<Comp
			className={cn(
				'relative cursor-pointer rounded-dt-xs px-0.5 transition-all duration-dt-fast',
				// Colors
				'text-muted-foreground hover:text-foreground',
				// Underline animado
				'after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-current after:transition-transform after:duration-dt-fast',
				'hover:after:scale-x-100',
				// Focus visible - Design Tokens v2
				'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
				className
			)}
			ref={ref}
			{...props}
		/>
	);
});
BreadcrumbLink.displayName = 'BreadcrumbLink';

/**
 * BreadcrumbPage con Design Tokens v2
 * - Estilo visual distintivo para página actual
 * - Font weight semibold para jerarquía
 */
const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.ComponentPropsWithoutRef<'span'>>(
	({ className, ...props }, ref) => (
		<span
			aria-current="page"
			aria-disabled="true"
			className={cn('rounded-dt-xs px-0.5 font-medium text-foreground', className)}
			ref={ref}
			{...props}
		/>
	)
);
BreadcrumbPage.displayName = 'BreadcrumbPage';

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<'li'>) => (
	<li aria-hidden="true" className={cn('[&>svg]:h-3.5 [&>svg]:w-3.5', className)} role="presentation" {...props}>
		{children ?? <ChevronRight />}
	</li>
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
	<span
		aria-hidden="true"
		className={cn('flex h-9 w-9 items-center justify-center', className)}
		role="presentation"
		{...props}
	>
		<MoreHorizontal className="h-4 w-4" />
		<span className="sr-only">More</span>
	</span>
);
BreadcrumbEllipsis.displayName = 'BreadcrumbElipssis';

export {
	Breadcrumb,
	BreadcrumbList,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbPage,
	BreadcrumbSeparator,
	BreadcrumbEllipsis,
};

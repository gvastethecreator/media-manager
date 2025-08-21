import { ChevronRight, MoreHorizontal } from 'lucide-react';
import { Slot as SlotPrimitive } from 'radix-ui';
import * as React from 'react';
import { cn } from '@/lib/utils';

function Breadcrumb({
	...props
}: React.ComponentProps<'nav'> & {
	separator?: React.ReactNode;
}) {
	return <nav aria-label="breadcrumb" data-slot="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
	return (
		<ol
			className={cn('flex flex-wrap items-center gap-1.5 break-words text-muted-foreground text-sm', className)}
			data-slot="breadcrumb-list"
			{...props}
		/>
	);
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
	return <li className={cn('inline-flex items-center gap-1.5', className)} data-slot="breadcrumb-item" {...props} />;
}

function BreadcrumbLink({
	asChild,
	className,
	...props
}: React.ComponentProps<'a'> & {
	asChild?: boolean;
}) {
	const Comp = asChild ? SlotPrimitive.Slot : 'a';

	return (
		<Comp className={cn('transition-colors hover:text-foreground', className)} data-slot="breadcrumb-link" {...props} />
	);
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
	return (
		<span
			aria-current="page"
			aria-disabled="true"
			className={cn('font-normal text-foreground', className)}
			data-slot="breadcrumb-page"
			role="link"
			{...props}
		/>
	);
}

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<'li'>) => (
	<li
		aria-hidden="true"
		className={cn('[&>svg]:h-3.5 [&>svg]:w-3.5', className)}
		data-slot="breadcrumb-separator"
		role="presentation"
		{...props}
	>
		{children ?? <ChevronRight className="rtl:rotate-180" />}
	</li>
);

const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
	<span
		aria-hidden="true"
		className={cn('flex h-9 w-9 items-center justify-center', className)}
		data-slot="breadcrumb-ellipsis"
		role="presentation"
		{...props}
	>
		<MoreHorizontal className="h-4 w-4" />
		<span className="sr-only">More</span>
	</span>
);

export {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
};

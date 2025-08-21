import { mergeProps } from '@base-ui-components/react/merge-props';
import { useRender } from '@base-ui-components/react/use-render';
import { ChevronRight, MoreHorizontal } from 'lucide-react';
import React from 'react';
import { cn } from '@/lib/utils';

export interface BreadcrumbLinkProps extends useRender.ComponentProps<'a'> {
	asChild?: boolean;
}

function Breadcrumb(props: React.ComponentProps<'nav'>) {
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

function BreadcrumbLink({ render, asChild = false, children, className, ...props }: BreadcrumbLinkProps) {
	const defaultProps = {
		'data-slot': 'breadcrumb-link',
		className: cn('transition-colors hover:text-foreground', className),
	};

	// Determine render element based on asChild prop
	const renderElement =
		asChild && React.isValidElement(children)
			? (children as React.ReactElement<Record<string, unknown>, string | React.JSXElementConstructor<unknown>>)
			: render || <a href="/">{children ?? 'Link'}</a>;

	// When using asChild, children becomes the element props, otherwise use children normally
	const finalProps =
		asChild && React.isValidElement(children)
			? mergeProps(defaultProps, props)
			: mergeProps(defaultProps, { ...props, children });

	const element = useRender({
		render: renderElement,
		props: finalProps,
	});

	return element;
}

function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
	return (
		<span
			aria-current="page"
			className={cn('font-normal text-foreground', className)}
			data-slot="breadcrumb-page"
			{...props}
		/>
	);
}

function BreadcrumbSeparator({ children, className, ...props }: React.ComponentProps<'li'>) {
	return (
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
}

function BreadcrumbEllipsis({ children, className, ...props }: React.ComponentProps<'span'>) {
	const content = children ?? (
		<>
			<MoreHorizontal className="h-4 w-4" />
			<span className="sr-only">More</span>
		</>
	);

	return (
		<span
			aria-hidden="true"
			className={cn('flex h-9 w-9 items-center justify-center', className)}
			data-slot="breadcrumb-ellipsis"
			role="presentation"
			{...props}
		>
			{content}
		</span>
	);
}

export {
	Breadcrumb,
	BreadcrumbEllipsis,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
};

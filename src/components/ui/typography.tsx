import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TypographyProps extends HTMLAttributes<HTMLElement> {
	children: ReactNode;
	className?: string;
}

/**
 * Componente para titulares nivel H1
 */
export function TypographyH1({ children, className, ...props }: TypographyProps) {
	return (
		<h1 className={cn('scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl', className)} {...props}>
			{children}
		</h1>
	);
}

/**
 * Componente para titulares nivel H2
 */
export function TypographyH2({ children, className, ...props }: TypographyProps) {
	return (
		<h2
			className={cn('scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0', className)}
			{...props}
		>
			{children}
		</h2>
	);
}

/**
 * Componente para titulares nivel H3
 */
export function TypographyH3({ children, className, ...props }: TypographyProps) {
	return (
		<h3 className={cn('scroll-m-20 text-2xl font-semibold tracking-tight', className)} {...props}>
			{children}
		</h3>
	);
}

/**
 * Componente para titulares nivel H4
 */
export function TypographyH4({ children, className, ...props }: TypographyProps) {
	return (
		<h4 className={cn('scroll-m-20 text-xl font-semibold tracking-tight', className)} {...props}>
			{children}
		</h4>
	);
}

/**
 * Componente para párrafos
 */
export function TypographyP({ children, className, ...props }: TypographyProps) {
	return (
		<p className={cn('leading-7 [&:not(:first-child)]:mt-6', className)} {...props}>
			{children}
		</p>
	);
}

/**
 * Componente para texto en bloques de código
 */
export function TypographyBlockquote({ children, className, ...props }: TypographyProps) {
	return (
		<blockquote className={cn('mt-6 border-l-2 pl-6 italic', className)} {...props}>
			{children}
		</blockquote>
	);
}

/**
 * Componente para listas
 */
export function TypographyList({ children, className, ...props }: TypographyProps) {
	return (
		<ul className={cn('my-6 ml-6 list-disc [&>li]:mt-2', className)} {...props}>
			{children}
		</ul>
	);
}

/**
 * Componente para texto pequeño o subtextos
 */
export function TypographySmall({ children, className, ...props }: TypographyProps) {
	return (
		<small className={cn('text-sm font-medium leading-none', className)} {...props}>
			{children}
		</small>
	);
}

/**
 * Componente para textos grandes
 */
export function TypographyLarge({ children, className, ...props }: TypographyProps) {
	return (
		<div className={cn('text-lg font-semibold', className)} {...props}>
			{children}
		</div>
	);
}

/**
 * Componente para textos destacados o leads
 */
export function TypographyLead({ children, className, ...props }: TypographyProps) {
	return (
		<p className={cn('text-xl text-muted-foreground', className)} {...props}>
			{children}
		</p>
	);
}

/**
 * Componente para texto muted o con menor énfasis
 */
export function TypographyMuted({ children, className, ...props }: TypographyProps) {
	return (
		<p className={cn('text-sm text-muted-foreground', className)} {...props}>
			{children}
		</p>
	);
}

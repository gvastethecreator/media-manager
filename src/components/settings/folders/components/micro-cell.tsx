import { memo } from 'react';
import { cn } from '@/lib/utils';

/**
 * Micro card reutilizable para condensar información en celdas
 * Proporciona estilos consistentes según el tono visual
 */
export const MicroCell = memo(function MicroCell({
	children,
	className,
	tone = 'default',
}: {
	children: React.ReactNode;
	className?: string;
	tone?: 'default' | 'info' | 'success' | 'warning' | 'danger';
}) {
	const toneClasses =
		tone === 'danger'
			? 'border-red-200/40 bg-red-50/60 dark:bg-red-950/20'
			: tone === 'warning'
				? 'border-amber-200/40 bg-amber-50/60 dark:bg-amber-950/20'
				: tone === 'success'
					? 'border-emerald-200/40 bg-emerald-50/60 dark:bg-emerald-950/20'
					: tone === 'info'
						? 'border-blue-200/40 bg-blue-50/60 dark:bg-blue-950/20'
						: 'border-border/40 bg-muted/10';

	return <div className={cn('rounded-sm border px-2.5 py-2', toneClasses, className)}>{children}</div>;
});

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
			? 'border-ui-error-border bg-ui-error'
			: tone === 'warning'
				? 'border-ui-warning-border bg-ui-warning'
				: tone === 'success'
					? 'border-ui-success-border bg-ui-success'
					: tone === 'info'
						? 'border-ui-info-border bg-ui-info'
						: 'border-border/40 bg-muted/10';

	return <div className={cn('rounded-sm border px-2.5 py-2', toneClasses, className)}>{children}</div>;
});

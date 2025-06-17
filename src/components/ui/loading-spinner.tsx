import { Loader2 } from 'lucide-react';
import type * as React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
	size?: number;
}

export function LoadingSpinner({ size = 24, className, ...props }: LoadingSpinnerProps) {
	return (
		<div className={cn('animate-spin', className)} aria-live="polite" {...props}>
			<Loader2 size={size} className="text-muted-foreground" />
			<span className="sr-only">Cargando...</span>
		</div>
	);
}

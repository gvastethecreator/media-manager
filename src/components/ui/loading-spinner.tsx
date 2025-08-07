import { Loader2 } from 'lucide-react';
import type * as React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
	size?: number;
}

export function LoadingSpinner({ size = 24, className, ...props }: LoadingSpinnerProps) {
	return (
		<div aria-live="polite" className={cn('animate-spin', className)} {...props}>
			<Loader2 className="text-muted-foreground" size={size} />
			<span className="sr-only">Cargando...</span>
		</div>
	);
}

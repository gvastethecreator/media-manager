'use client';

import { cn } from '@/lib/utils/utils';
import { Loader2 } from 'lucide-react';
import type * as React from 'react';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLOutputElement> {}

export function LoadingSpinner({ className, ...props }: LoadingSpinnerProps) {
	return (
		<output className={cn('flex items-center justify-center', className)} {...props}>
			<Loader2 className="h-4 w-4 animate-spin" />
			<span className="sr-only">Cargando...</span>
		</output>
	);
}

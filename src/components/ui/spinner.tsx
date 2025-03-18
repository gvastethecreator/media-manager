'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import type * as React from 'react';

export function LoadingSpinner({ className, ...props }: React.HTMLAttributes<HTMLOutputElement>) {
	return (
		<output className={cn('flex items-center justify-center', className)} {...props}>
			<Loader2 className="h-4 w-4 animate-spin" />
			<span className="sr-only">Cargando...</span>
		</output>
	);
}

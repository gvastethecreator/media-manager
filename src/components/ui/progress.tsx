'use client';

import { Indicator as ProgressIndicator, Root as ProgressRoot } from '@radix-ui/react-progress';
import React from 'react';

import { cn } from '@/lib/utils';

function Progress({ className, value, ...props }: React.ComponentProps<typeof ProgressRoot>) {
	return (
		<ProgressRoot
			className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)}
			data-slot="progress"
			{...props}
		>
			<ProgressIndicator
				className="h-full w-full flex-1 bg-primary transition-all"
				data-slot="progress-indicator"
				style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
			/>
		</ProgressRoot>
	);
}

export { Progress };

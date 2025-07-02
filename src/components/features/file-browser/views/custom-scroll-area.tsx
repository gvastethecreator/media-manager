import React, { forwardRef, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CustomScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
	className?: string;
	viewportClassName?: string;
	children: React.ReactNode;
}

export const CustomScrollArea = React.memo(
	forwardRef<HTMLDivElement, CustomScrollAreaProps>(({ className, viewportClassName, children, ...props }, ref) => {
		const innerRef = useRef<HTMLDivElement>(null);
		const forwardedRef = ref || innerRef;

		return (
			<div className={cn('relative overflow-hidden', className)} {...props} ref={forwardedRef}>
				<div className={cn('h-full w-full overflow-auto', viewportClassName)} data-slot="scroll-area-viewport">
					{children}
				</div>
			</div>
		);
	})
);

CustomScrollArea.displayName = 'CustomScrollArea';

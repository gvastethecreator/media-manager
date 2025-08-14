'use client';

import { Corner, Root, Scrollbar, Thumb, Viewport } from '@radix-ui/react-scroll-area';
import React from 'react';

import { cn } from '@/lib/utils';

interface ScrollAreaProps extends React.ComponentProps<typeof Root> {
	/** test id base para el scroll area (usado en viewport también) */
	dataTestId?: string;
}

function ScrollArea({ className, children, dataTestId, ...props }: ScrollAreaProps) {
	return (
		<Root
			className={cn('relative', className)}
			data-slot="scroll-area"
			{...props}
			data-testid={dataTestId ?? (props as any)['data-testid'] /* fallback si alguien pasa data-testid */}
		>
			<Viewport
				className="size-full rounded-[inherit] outline-none transition-[color,box-shadow] focus-visible:outline-1 focus-visible:ring-[3px] focus-visible:ring-ring/50"
				data-slot="scroll-area-viewport"
				data-testid={
					(dataTestId ?? (props as any)['data-testid'])
						? `${dataTestId ?? (props as any)['data-testid']}-viewport`
						: 'file-browser-viewport'
				}
			>
				{children}
			</Viewport>
			<ScrollBar />
			<Corner />
		</Root>
	);
}

function ScrollBar({ className, orientation = 'vertical', ...props }: React.ComponentProps<typeof Scrollbar>) {
	return (
		<Scrollbar
			className={cn(
				'flex touch-none select-none p-px transition-colors',
				orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent',
				orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent',
				className
			)}
			data-slot="scroll-area-scrollbar"
			orientation={orientation}
			{...props}
		>
			<Thumb className="relative flex-1 rounded-full bg-border" data-slot="scroll-area-thumb" />
		</Scrollbar>
	);
}

export { ScrollArea, ScrollBar };

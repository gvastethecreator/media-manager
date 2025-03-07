'use client';

import { GripVertical } from 'lucide-react';
import * as ResizablePrimitive from 'react-resizable-panels';

import { cn } from '@/lib/utils';
import type * as React from 'react';

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof ResizablePrimitive.PanelGroup>) => (
	<ResizablePrimitive.PanelGroup
		className={cn('flex h-full w-full data-[panel-group-direction=vertical]:flex-col', className)}
		{...props}
	/>
);

const ResizablePanel = ResizablePrimitive.Panel;

const ResizablePanelHandle = ({
	withHandle,
	className,
	...props
}: React.ComponentProps<typeof ResizablePrimitive.PanelResizeHandle> & {
	withHandle?: boolean;
}) => (
	<ResizablePrimitive.PanelResizeHandle
		className={cn(
			'relative flex w-px items-center justify-center bg-border after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 data-[panel-group-direction=vertical]:h-px data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:after:left-0 data-[panel-group-direction=vertical]:after:h-1 data-[panel-group-direction=vertical]:after:w-full data-[panel-group-direction=vertical]:after:-translate-y-1/2 data-[panel-group-direction=vertical]:after:translate-x-0 [&[data-panel-group-direction=vertical]>div]:rotate-90',
			className
		)}
		{...props}
	>
		{withHandle && (
			<div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="10"
					height="10"
					viewBox="0 0 10 10"
					fill="currentColor"
					aria-labelledby="grip-title"
				>
					<title id="grip-title">Redimensionar panel</title>
					<path d="M3.5 2C3.22386 2 3 1.77614 3 1.5C3 1.22386 3.22386 1 3.5 1C3.77614 1 4 1.22386 4 1.5C4 1.77614 3.77614 2 3.5 2ZM5.5 1.5C5.5 1.77614 5.72386 2 6 2C6.27614 2 6.5 1.77614 6.5 1.5C6.5 1.22386 6.27614 1 6 1C5.72386 1 5.5 1.22386 5.5 1.5ZM3.5 4C3.22386 4 3 3.77614 3 3.5C3 3.22386 3.22386 3 3.5 3C3.77614 3 4 3.22386 4 3.5C4 3.77614 3.77614 4 3.5 4ZM5.5 3.5C5.5 3.77614 5.72386 4 6 4C6.27614 4 6.5 3.77614 6.5 3.5C6.5 3.22386 6.27614 3 6 3C5.72386 3 5.5 3.22386 5.5 3.5ZM3.5 6C3.22386 6 3 5.77614 3 5.5C3 5.22386 3.22386 5 3.5 5C3.77614 5 4 5.22386 4 5.5C4 5.77614 3.77614 6 3.5 6ZM5.5 5.5C5.5 5.77614 5.72386 6 6 6C6.27614 6 6.5 5.77614 6.5 5.5C6.5 5.22386 6.27614 5 6 5C5.72386 5 5.5 5.22386 5.5 5.5ZM3.5 8C3.22386 8 3 7.77614 3 7.5C3 7.22386 3.22386 7 3.5 7C3.77614 7 4 7.22386 4 7.5C4 7.77614 3.77614 8 3.5 8ZM5.5 7.5C5.5 7.77614 5.72386 8 6 8C6.27614 8 6.5 7.77614 6.5 7.5C6.5 7.22386 6.27614 7 6 7C5.72386 7 5.5 7.22386 5.5 7.5ZM3.5 10C3.22386 10 3 9.77614 3 9.5C3 9.22386 3.22386 9 3.5 9C3.77614 9 4 9.22386 4 9.5C4 9.77614 3.77614 10 3.5 10ZM5.5 9.5C5.5 9.77614 5.72386 10 6 10C6.27614 10 6.5 9.77614 6.5 9.5C6.5 9.22386 6.27614 9 6 9C5.72386 9 5.5 9.22386 5.5 9.5Z" />
				</svg>
			</div>
		)}
	</ResizablePrimitive.PanelResizeHandle>
);

export { ResizablePanel, ResizablePanelGroup, ResizablePanelHandle };

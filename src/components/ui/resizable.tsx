'use client';

import { GripVerticalIcon } from 'lucide-react';
import * as React from 'react';
import { Group, Panel, Separator } from 'react-resizable-panels';

import { cn } from '@/lib/utils';

function ResizablePanelGroup({ className, ...props }: React.ComponentProps<typeof Group>) {
	return (
		<Group
			className={cn(
				'flex h-full w-full min-h-0 min-w-0 data-[panel-group-direction=vertical]:flex-col',
				className
			)}
			data-slot="resizable-panel-group"
			{...props}
		/>
	);
}

function ResizablePanel({
	className,
	...props
}: React.ComponentProps<typeof Panel>) {
	return (
		<Panel
			className={cn('min-h-0 min-w-0', className)}
			data-slot="resizable-panel"
			{...props}
		/>
	);
}

function ResizableHandle({
	withHandle,
	className,
	...props
}: React.ComponentProps<typeof Separator> & {
	withHandle?: boolean;
}) {
	return (
		<Separator
			className={cn(
				'relative flex w-1.5 items-center justify-center bg-border/30 hover:bg-primary/40 transition-all active:bg-primary cursor-col-resize data-[panel-group-direction=vertical]:h-1.5 data-[panel-group-direction=vertical]:w-full data-[panel-group-direction=vertical]:cursor-row-resize',
				'after:absolute after:inset-y-0 after:left-1/2 after:w-8 after:-translate-x-1/2 after:z-50',
				className
			)}
			data-slot="resizable-handle"
			{...props}
		>
			{withHandle && (
				<div className="z-10 flex h-5 w-3 items-center justify-center rounded-full border bg-background shadow-sm">
					<GripVerticalIcon className="size-2.5 text-muted-foreground" />
				</div>
			)}
		</Separator>
	);
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
